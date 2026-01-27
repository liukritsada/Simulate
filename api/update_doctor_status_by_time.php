<?php
/**
 * ✅ update_doctor_status_by_time.php (VERSION 1.0)
 * Auto update doctor status ตามเวลาปัจจุบัน
 * 
 * ✅ FIX 1.0: Update doctor status (available, working, on_break, off_duty)
 * ✅ FIX 1.1: ลบแพทย์ออกจากห้องเมื่อเข้า break หรือ off_duty
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    /* ===================== INPUT ===================== */
    $input = [];
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $input = $_GET;
    } else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
    }

    $station_id   = intval($input['station_id'] ?? 0);
    $current_date = $input['current_date'] ?? date('Y-m-d');
    $current_time = $input['current_time'] ?? date('H:i:s');

    error_log("=== UPDATE_DOCTOR_STATUS_BY_TIME START ===");
    error_log("🔍 station_id={$station_id}, date={$current_date}, time={$current_time}");

    /* ===================== DB ===================== */
    $conn = new mysqli('127.0.0.1', 'sa', '', 'hospitalstation');
    $conn->set_charset('utf8mb4');

    /* ===================== FETCH DOCTORS ===================== */
    $sql = "
        SELECT 
            station_doctor_id,
            station_id,
            doctor_name,
            work_start_time,
            work_end_time,
            break_start_time,
            break_end_time,
            status AS current_status,
            assigned_room_id
        FROM station_doctors
        WHERE work_date = ?
        AND is_active = 1
    ";

    if ($station_id > 0) {
        $sql .= " AND station_id = ?";
    }

    $stmt = $conn->prepare($sql);

    if ($station_id > 0) {
        $stmt->bind_param('si', $current_date, $station_id);
    } else {
        $stmt->bind_param('s', $current_date);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $doctor_list = [];
    while ($row = $result->fetch_assoc()) {
        $doctor_list[] = $row;
    }
    $stmt->close();

    if (count($doctor_list) === 0) {
        echo json_encode([
            'success' => true,
            'message' => 'No doctors to update',
            'data' => [
                'station_id' => $station_id,
                'updated_count' => 0
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /* ===================== PREPARE UPDATE ===================== */
    $update_status_stmt = $conn->prepare("
        UPDATE station_doctors 
        SET status = ?
        WHERE station_doctor_id = ?
    ");

    $clear_room_stmt = $conn->prepare("
        UPDATE station_doctors 
        SET assigned_room_id = NULL, status = ?
        WHERE station_doctor_id = ?
    ");

    /* ===================== LOOP ===================== */
    $updates = [];
    $update_count = 0;

    foreach ($doctor_list as $doctor) {
        $doctor_id      = $doctor['station_doctor_id'];
        $doctor_name    = $doctor['doctor_name'];
        $old_status     = $doctor['current_status'];
        $assigned_room  = $doctor['assigned_room_id'];

        $new_status = determineDocatorStatus(
            $current_time,
            $doctor['work_start_time'],
            $doctor['work_end_time'],
            $doctor['break_start_time'],
            $doctor['break_end_time'],
            $old_status,
            !empty($assigned_room)
        );

        error_log("🔄 Doctor: {$doctor_name} | Old: {$old_status} | New: {$new_status} | Room: " . ($assigned_room ?? 'NULL'));

        // ✅ CASE 1: OFF DUTY + มีห้อง → ลบห้อง
        if ($new_status === 'off_duty' && $assigned_room) {
            error_log("   ACTION: OFF_DUTY + Clear Room");
            $clear_room_stmt->bind_param('si', $new_status, $doctor_id);
            $clear_room_stmt->execute();

            $updates[] = [
                'doctor' => $doctor_name,
                'from' => $old_status,
                'to' => $new_status,
                'room_cleared' => true,
                'action' => '🏁 เลิกงาน - ลบออกจากห้อง'
            ];
            $update_count++;

        // ✅ CASE 2: ON BREAK + มีห้อง → ลบห้อง
        } else if ($new_status === 'on_break' && $assigned_room) {
            error_log("   ACTION: ON_BREAK + Clear Room");
            $clear_room_stmt->bind_param('si', $new_status, $doctor_id);
            $clear_room_stmt->execute();

            $updates[] = [
                'doctor' => $doctor_name,
                'from' => $old_status,
                'to' => $new_status,
                'room_cleared' => true,
                'action' => '🍽️ พักเบรค - ลบออกจากห้อง'
            ];
            $update_count++;

        // ✅ CASE 3: สถานะเปลี่ยน แต่ห้องคงอยู่
        } else if ($new_status !== $old_status) {
            error_log("   ACTION: Status Change");
            $update_status_stmt->bind_param('si', $new_status, $doctor_id);
            $update_status_stmt->execute();

            $updates[] = [
                'doctor' => $doctor_name,
                'from' => $old_status,
                'to' => $new_status,
                'room_cleared' => false,
                'action' => "เปลี่ยนสถานะ: {$old_status} → {$new_status}"
            ];
            $update_count++;
        }
    }

    $update_status_stmt->close();
    $clear_room_stmt->close();
    $conn->close();

    error_log("📊 Total updates: {$update_count}");
    error_log("=== UPDATE_DOCTOR_STATUS_BY_TIME END (SUCCESS) ===");

    echo json_encode([
        'success' => true,
        'message' => "Updated {$update_count} doctors",
        'data' => [
            'station_id' => $station_id,
            'updated_count' => $update_count,
            'updates' => $updates,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log('❌ ERROR: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}

/* ===================== HELPER FUNCTION ===================== */
function determineDocatorStatus(
    $current_time,
    $work_start,
    $work_end,
    $break_start,
    $break_end,
    $current_status,
    $has_room = false
) {
    $current = strtotime($current_time);
    $start   = strtotime($work_start ?? '08:00:00');
    $end     = $work_end ? strtotime($work_end) : strtotime('23:59:59'); // NULL means work all day
    $b_start = strtotime($break_start ?? '12:00:00');
    $b_end   = strtotime($break_end ?? '13:00:00');

    // ✅ Check time sequence
    if ($current >= $end) {
        return 'off_duty';
    }
    
    if ($current < $start) {
        return 'waiting_to_start';
    }
    
    // ✅ CHECK BREAK FIRST
    if ($current >= $b_start && $current < $b_end) {
        return 'on_break';
    }

    // ✅ After break, determine available or working
    if ($has_room) {
        return 'working';
    } else {
        return 'available';
    }
}
?>