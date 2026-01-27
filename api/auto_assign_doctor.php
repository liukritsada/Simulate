<?php
/**
 * ✅ auto_assign_doctor.php (VERSION 2.0 - NULL work_end_time FIXED)
 * เพิ่มแพทย์เข้าห้องอัตโนมัติ เมื่อห้องว่าง
 *
 * ✅ FIX: เลือกเฉพาะแพทย์ที่ status = 'available' (ไม่เอา 'working')
 * ✅ FIX: เช็คว่าถึงเวลาทำงานแล้ว (current_time >= work_start_time)
 * ✅ FIX: รองรับ work_end_time = NULL (ทำงานตลอดวัน)
 * ✅ FIX: เช็คไม่อยู่ในช่วง break time
 * ✅ FIX: แก้ bug SQL quote ซ้อน (''value'' → 'value')
 */

ob_end_clean();
ob_start();

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    ob_clean();
    http_response_code(200);
    exit();
}

try {
    ob_clean();

    require_once __DIR__ . '/db_config.php';
    $pdo = DBConfig::getPDO();

    $input = json_decode(file_get_contents('php://input'), true);
    $current_date = $input['current_date'] ?? date('Y-m-d');
    $current_time = $input['current_time'] ?? date('H:i:s');
    $station_id = intval($input['station_id'] ?? 0);

    error_log("=== AUTO_ASSIGN_DOCTOR START ===");
    error_log("🔍 Input: station_id=$station_id, date=$current_date, time=$current_time");

    // ========================================
    // STEP 1: ดึงห้องที่ว่างเปล่า
    // ========================================

    $empty_rooms_query = "
        SELECT 
            sr.room_id, 
            sr.room_number,
            sr.room_name, 
            s.station_id, 
            s.station_name
        FROM station_rooms sr
        JOIN stations s ON sr.station_id = s.station_id
        WHERE 1=1
    ";

    if ($station_id > 0) {
        $empty_rooms_query .= " AND sr.station_id = $station_id";
    }

    $empty_rooms_query .= "
        AND sr.room_id NOT IN (
            SELECT DISTINCT assigned_room_id 
            FROM station_doctors 
            WHERE assigned_room_id IS NOT NULL 
            AND assigned_room_id > 0
            AND is_active = 1
            AND status IN ('working', 'available')
        )
        ORDER BY sr.room_id
    ";

    error_log("Query: " . $empty_rooms_query);
    $empty_rooms = $pdo->query($empty_rooms_query);
    $empty_rooms_list = $empty_rooms->fetchAll(PDO::FETCH_ASSOC);

    error_log("📊 Found " . count($empty_rooms_list) . " empty rooms");

    $auto_assigned = [];
    $already_assigned = [];

    // ========================================
    // STEP 2: สำหรับแต่ละห้องที่ว่าง เลือกแพทย์
    // ========================================

    foreach ($empty_rooms_list as $room) {
        error_log("🔍 Processing room {$room['room_id']} ({$room['room_name']})");

        // สร้าง IN list
        $in_list = empty($already_assigned) ? '0' : implode(',', array_map('intval', $already_assigned));

        // สร้าง query โดยไม่ใช้ prepared statement (เพื่อหลีกเลี่ยงปัญหา placeholder)
        // ✅ FIX: $pdo->quote() เติม quote ให้เองแล้ว ไม่ต้องใส่เพิ่ม!
        // ✅ FIX: ถ้า work_end_time = NULL ให้ถือว่าทำงานตลอดวัน
        $available_doctor_query = "
            SELECT
                sd.station_doctor_id,
                sd.doctor_id,
                sd.doctor_name,
                sd.doctor_type,
                sd.work_start_time,
                sd.work_end_time,
                sd.break_start_time,
                sd.break_end_time,
                sd.status
            FROM station_doctors sd
            WHERE sd.station_id = " . intval($room['station_id']) . "
                AND sd.is_active = 1
                AND sd.work_date = " . $pdo->quote($current_date) . "
                AND sd.assigned_room_id IS NULL
                AND sd.status = 'available'
                AND sd.station_doctor_id NOT IN ($in_list)
                AND " . $pdo->quote($current_time) . " >= sd.work_start_time
                AND (sd.work_end_time IS NULL OR " . $pdo->quote($current_time) . " < sd.work_end_time)
                AND (
                    sd.break_start_time IS NULL
                    OR sd.break_end_time IS NULL
                    OR NOT (
                        " . $pdo->quote($current_time) . " >= sd.break_start_time
                        AND " . $pdo->quote($current_time) . " < sd.break_end_time
                    )
                )
            ORDER BY sd.doctor_name
            LIMIT 1
        ";

        error_log("Doctor Query: " . $available_doctor_query);

        try {
            $stmt = $pdo->query($available_doctor_query);
            $doctor = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($doctor) {
                $is_in_break = isDoctorInBreak($current_time, $doctor);

                if ($is_in_break) {
                    error_log("⚠️ Doctor {$doctor['doctor_name']} is in break - SKIP");
                    continue;
                }

                error_log("✅ Found doctor: {$doctor['doctor_name']} (ID: {$doctor['station_doctor_id']})");

                // Update doctor assignment
                $update_query = "
                    UPDATE station_doctors 
                    SET assigned_room_id = " . intval($room['room_id']) . ",
                        status = 'working'
                    WHERE station_doctor_id = " . intval($doctor['station_doctor_id']) . "
                ";

                error_log("Update Query: " . $update_query);
                $pdo->exec($update_query);

                $auto_assigned[] = [
                    'room_id' => (int)$room['room_id'],
                    'room_name' => $room['room_name'],
                    'station_name' => $room['station_name'],
                    'station_doctor_id' => (int)$doctor['station_doctor_id'],
                    'doctor_name' => $doctor['doctor_name'],
                    'doctor_type' => $doctor['doctor_type'] ?? 'Doctor',
                    'message' => "✅ ส่ง {$doctor['doctor_name']} เข้าห้อง {$room['room_name']}"
                ];

                $already_assigned[] = $doctor['station_doctor_id'];

                error_log("✅ Assigned successfully");

            } else {
                error_log("⚠️ No available doctor for room {$room['room_id']}");
            }

        } catch (Exception $e) {
            error_log("❌ Query Error: " . $e->getMessage());
        }
    }

    error_log("📊 Total assigned: " . count($auto_assigned));
    error_log("=== AUTO_ASSIGN_DOCTOR END (SUCCESS) ===");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'ตรวจสอบห้องว่างและเพิ่มแพทย์เสร็จสิ้น',
        'data' => [
            'empty_rooms_count' => count($empty_rooms_list),
            'auto_assigned_count' => count($auto_assigned),
            'assignments' => $auto_assigned,
            'current_time' => $current_time,
            'current_date' => $current_date,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ Error: " . $e->getMessage());
    error_log("Stack: " . $e->getTraceAsString());
    error_log("=== AUTO_ASSIGN_DOCTOR END (ERROR) ===");

    ob_clean();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_line' => $e->getLine(),
        'current_date' => $current_date ?? null,
        'current_time' => $current_time ?? null
    ], JSON_UNESCAPED_UNICODE);
}

/**
 * ✅ ตรวจสอบว่าแพทย์อยู่ในช่วง break หรือไม่
 */
function isDoctorInBreak($current_time, $doctor) {
    $break_start = $doctor['break_start_time'] ?? null;
    $break_end = $doctor['break_end_time'] ?? null;

    if (!$break_start || !$break_end) {
        return false;
    }

    if ($current_time >= $break_start && $current_time < $break_end) {
        return true;
    }

    return false;
}
?>