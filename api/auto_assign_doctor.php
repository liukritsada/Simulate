<?php
/**
 * ✅ auto_assign_doctor.php - FIXED VERSION (No Cron Needed)
 * 
 * การทำงาน:
 * 1. เมื่อเพิ่มแพทย์ → ระบบ auto assign ให้เข้าห้องทันที
 * 2. ถ้าแพทย์ไม่มี work_end_time → AUTO-FIX ให้เป็น 17:00 น.
 * 3. หาห้องว่าง → assign แพทย์เข้าห้อง
 * 4. ถ้าไม่มีห้องว่าง → show message ให้ user เลือกห้องเอง
 * 
 * ✅ ไม่ต้องใช้ Cron Job - ทำงานทันทีเมื่อเพิ่มแพทย์
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

ob_start();
header('Content-Type: application/json; charset=utf-8');

try {
    // ✅ Include database config
    $db_file = __DIR__ . DIRECTORY_SEPARATOR . 'db_config.php';
    if (!file_exists($db_file)) {
        $db_file = dirname(__FILE__) . DIRECTORY_SEPARATOR . 'db_config.php';
    }
    
    if (!file_exists($db_file)) {
        throw new Exception("Database config file not found");
    }
    
    require_once($db_file);
    
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? "Unknown"));
    }

    // ✅ Get input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $station_id = $data['station_id'] ?? null;
    $current_date = $data['current_date'] ?? date('Y-m-d');
    $current_time = $data['current_time'] ?? date('H:i:s');

    if (!$station_id) {
        throw new Exception("Missing station_id parameter");
    }

    $log_file = __DIR__ . '/../auto_assign_doctor.log';

    // ✅ STEP 1: AUTO-FIX Missing work_end_time
    // ถ้าแพทย์ไม่มี work_end_time → set เป็น 17:00 น.
    $fix_query = "
        UPDATE station_doctors
        SET work_end_time = '17:00:00'
        WHERE station_id = ?
        AND work_date = ?
        AND (work_end_time IS NULL OR work_end_time = '' OR work_end_time = '0000-00-00' OR work_end_time = '00:00:00')
        AND is_active = 1
    ";

    $stmt = $conn->prepare($fix_query);
    if ($stmt) {
        $stmt->bind_param("is", $station_id, $current_date);
        $stmt->execute();
        $fixed_count = $stmt->affected_rows;
        $stmt->close();
        
        if ($fixed_count > 0) {
            file_put_contents($log_file, date('Y-m-d H:i:s') . " [Station {$station_id}] Fixed {$fixed_count} doctors - Added missing work_end_time\n", FILE_APPEND);
        }
    }

    // ✅ STEP 2: Get unassigned doctors
    $doctor_query = "
        SELECT sd.station_doctor_id, 
               sd.doctor_code, 
               sd.doctor_name,
               sd.status,
               sd.assigned_room_id,
               sd.work_start_time,
               sd.work_end_time
        FROM station_doctors sd
        WHERE sd.station_id = ?
        AND sd.work_date = ?
        AND sd.status IN ('available', 'working')
        AND (sd.assigned_room_id IS NULL OR sd.assigned_room_id = 0)
        AND sd.is_active = 1
        AND sd.work_end_time IS NOT NULL
        AND sd.work_end_time != ''
        AND sd.work_end_time != '00:00:00'
        ORDER BY sd.station_doctor_id DESC
        LIMIT 50
    ";

    $stmt = $conn->prepare($doctor_query);
    if (!$stmt) {
        throw new Exception("Doctor query prepare failed: " . $conn->error);
    }

    $stmt->bind_param("is", $station_id, $current_date);
    if (!$stmt->execute()) {
        throw new Exception("Doctor query execute failed: " . $stmt->error);
    }

    $doctor_result = $stmt->get_result();
    $unassigned_doctors = [];
    while ($row = $doctor_result->fetch_assoc()) {
        $unassigned_doctors[] = $row;
    }
    $stmt->close();

    // ✅ STEP 3: Get available rooms (rooms not assigned to any active doctor today)
    $room_query = "
        SELECT DISTINCT sr.room_id, 
               sr.room_name,
               sr.room_number
        FROM station_rooms sr
        WHERE sr.station_id = ?
        AND sr.is_active = 1
        AND sr.room_id NOT IN (
            SELECT DISTINCT assigned_room_id
            FROM station_doctors
            WHERE station_id = ?
            AND work_date = ?
            AND assigned_room_id IS NOT NULL
            AND assigned_room_id > 0
            AND is_active = 1
            AND status IN ('working', 'available')
        )
        ORDER BY sr.room_id ASC
        LIMIT 50
    ";

    $stmt = $conn->prepare($room_query);
    if (!$stmt) {
        throw new Exception("Room query prepare failed: " . $conn->error);
    }

    $stmt->bind_param("iis", $station_id, $station_id, $current_date);
    if (!$stmt->execute()) {
        throw new Exception("Room query execute failed: " . $stmt->error);
    }

    $room_result = $stmt->get_result();
    $available_rooms = [];
    while ($row = $room_result->fetch_assoc()) {
        $available_rooms[] = $row;
    }
    $stmt->close();

    // ✅ STEP 4: Auto-assign doctors to rooms
    $assignments = [];
    $assigned_count = 0;

    foreach ($unassigned_doctors as $index => $doctor) {
        // ✅ ถ้าไม่มีห้องพอ → ข้ามไป
        if ($index >= count($available_rooms)) {
            break;
        }

        $room = $available_rooms[$index];
        $room_id = $room['room_id'];
        $station_doctor_id = $doctor['station_doctor_id'];
        $doctor_code = $doctor['doctor_code'] ?? 'N/A';
        $doctor_name = $doctor['doctor_name'] ?? 'Unknown';

        // ✅ Update assigned_room_id
        $update_query = "
            UPDATE station_doctors
            SET assigned_room_id = ?,
                status = 'working',
                update_date = NOW()
            WHERE station_doctor_id = ?
            AND station_id = ?
            AND work_date = ?
            LIMIT 1
        ";

        $stmt = $conn->prepare($update_query);
        if (!$stmt) {
            continue;
        }

        $stmt->bind_param("iiis", $room_id, $station_doctor_id, $station_id, $current_date);
        if (!$stmt->execute()) {
            $stmt->close();
            continue;
        }
        $stmt->close();

        $assigned_count++;
        $room_name = $room['room_name'] ?? ("Room " . $room['room_number']);
        
        $assignments[] = [
            'station_doctor_id' => (int)$station_doctor_id,
            'doctor_code' => $doctor_code,
            'doctor_name' => $doctor_name,
            'room_id' => (int)$room_id,
            'room_name' => $room_name
        ];

        file_put_contents($log_file, "   ✅ {$doctor_name} ({$doctor_code}) → {$room_name}\n", FILE_APPEND);
    }

    if ($assigned_count > 0 || $fixed_count > 0) {
        file_put_contents($log_file, "✅ Completed: Fixed={$fixed_count}, Assigned={$assigned_count}\n\n", FILE_APPEND);
    }

    ob_end_clean();

    echo json_encode([
        'success' => true,
        'message' => 'Auto-assign completed',
        'data' => [
            'fixed_work_end_time' => $fixed_count ?? 0,
            'available_rooms_count' => count($available_rooms),
            'unassigned_doctors_count' => count($unassigned_doctors),
            'auto_assigned_count' => $assigned_count,
            'assignments' => $assignments
        ]
    ]);

} catch (Exception $e) {
    ob_end_clean();

    if (isset($log_file)) {
        file_put_contents($log_file, "❌ Error: " . $e->getMessage() . "\n\n", FILE_APPEND);
    }

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);

} finally {
    if (isset($conn) && is_object($conn)) {
        $conn->close();
    }
}
?>