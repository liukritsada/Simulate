<?php
/**
 * ✅ update_staff_status_by_time.php (FIXED VERSION 4.0)
 * Auto update staff status ตามเวลาปัจจุบัน
 * 
 * ✅ FIX 4.0: เมื่อพนักงานเข้า BREAK ให้ลบออกจากห้องทันที
 * ✅ FIX 4.1: เมื่อพนักงานออก BREAK ให้เปลี่ยนเป็น available (พร้อมจะเข้าห้องใหม่)
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

    error_log("=== UPDATE_STAFF_STATUS_BY_TIME START ===");
    error_log("🔍 station_id={$station_id}, date={$current_date}, time={$current_time}");

    /* ===================== DB ===================== */
    $conn = new mysqli('127.0.0.1', 'sa', '', 'hospitalstation');
    $conn->set_charset('utf8mb4');

    /* ===================== FETCH STAFF ===================== */
    $sql = "
        SELECT 
            station_staff_id,
            station_id,
            staff_name,
            work_start_time,
            work_end_time,
            break_start_time,
            break_end_time,
            status AS current_status,
            assigned_room_id
        FROM station_staff
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

    $staff_list = [];
    while ($row = $result->fetch_assoc()) {
        $staff_list[] = $row;
    }
    $stmt->close();

    if (count($staff_list) === 0) {
        error_log("⚠️ No staff found");
        echo json_encode([
            'success' => true,
            'message' => 'No staff to update',
            'data' => [
                'station_id' => $station_id,
                'updated_count' => 0
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /* ===================== PREPARE STATEMENTS ===================== */
    
    // ✅ Update status only
    $update_status_stmt = $conn->prepare("
        UPDATE station_staff 
        SET status = ?
        WHERE station_staff_id = ?
    ");

    // ✅ Remove from room AND change status (for break)
    $clear_room_stmt = $conn->prepare("
        UPDATE station_staff 
        SET assigned_room_id = NULL, status = ?
        WHERE station_staff_id = ?
    ");

    /* ===================== PROCESS EACH STAFF ===================== */
    $updates = [];
    $update_count = 0;

    foreach ($staff_list as $staff) {
        $staff_id      = $staff['station_staff_id'];
        $staff_name    = $staff['staff_name'];
        $old_status    = $staff['current_status'];
        $assigned_room = $staff['assigned_room_id'];

        // ✅ Calculate new status based on time
        $new_status = determineStaffStatus(
            $current_time,
            $staff['work_start_time'],
            $staff['work_end_time'],
            $staff['break_start_time'],
            $staff['break_end_time'],
            $old_status,
            !empty($assigned_room)
        );

        error_log("🔄 Processing: {$staff_name} (ID:{$staff_id})");
        error_log("   Current Status: {$old_status}, New Status: {$new_status}");
        error_log("   Assigned Room: " . ($assigned_room ?? 'NULL'));
        error_log("   Time: {$current_time}, Work: {$staff['work_start_time']}-{$staff['work_end_time']}, Break: {$staff['break_start_time']}-{$staff['break_end_time']}");

        /* ✅ CASE 1: OFF DUTY + มีห้องที่เชื่อมโยง */
        if ($new_status === 'off_duty' && $assigned_room) {
            error_log("   ACTION: OFF_DUTY + Clear Room");
            $clear_room_stmt->bind_param('si', $new_status, $staff_id);
            $clear_room_stmt->execute();

            $updates[] = [
                'staff' => $staff_name,
                'from' => $old_status,
                'to' => $new_status,
                'room_cleared' => true,
                'action' => '🏁 เลิกงาน - ลบออกจากห้อง'
            ];
            $update_count++;
            error_log("   ✅ Updated");
        }
        /* ✅ CASE 2: ON BREAK + มีห้องที่เชื่อมโยง -> ต้องเอาออกจากห้อง!!! */
        else if ($new_status === 'on_break' && $assigned_room) {
            error_log("   ACTION: ON_BREAK + MUST Clear Room (เข้า BREAK ต้องเอาออกจากห้อง)");
            $clear_room_stmt->bind_param('si', $new_status, $staff_id);
            $clear_room_stmt->execute();

            $updates[] = [
                'staff' => $staff_name,
                'from' => $old_status,
                'to' => $new_status,
                'room_cleared' => true,
                'action' => '🍽️ พักเบรค - ลบออกจากห้องแล้ว (ปลอดภัย)'
            ];
            $update_count++;
            error_log("   ✅ Updated - Room cleared because staff is on break");
        }
        /* ✅ CASE 3: Status changed but room assignment stays (normal case) */
        else if ($new_status !== $old_status) {
            error_log("   ACTION: Status Change Only");
            $update_status_stmt->bind_param('si', $new_status, $staff_id);
            $update_status_stmt->execute();

            $updates[] = [
                'staff' => $staff_name,
                'from' => $old_status,
                'to' => $new_status,
                'room_cleared' => false,
                'action' => "เปลี่ยนสถานะ: {$old_status} → {$new_status}"
            ];
            $update_count++;
            error_log("   ✅ Updated");
        }
        /* ✅ CASE 4: No change needed */
        else {
            error_log("   ACTION: No Change");
        }
    }

    $update_status_stmt->close();
    $clear_room_stmt->close();
    $conn->close();

    error_log("📊 Total updates: {$update_count}");
    error_log("=== UPDATE_STAFF_STATUS_BY_TIME END (SUCCESS) ===");

    echo json_encode([
        'success' => true,
        'message' => "Updated {$update_count} staff",
        'data' => [
            'station_id' => $station_id,
            'updated_count' => $update_count,
            'updates' => $updates,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log('❌ ERROR: ' . $e->getMessage());
    error_log("=== UPDATE_STAFF_STATUS_BY_TIME END (ERROR) ===");

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}

/* ===================== HELPER FUNCTION ===================== */
/**
 * ✅ Determine staff status based on current time
 * Returns: 'waiting_to_start', 'working', 'on_break', 'available', 'off_duty'
 */
function determineStaffStatus(
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
    $end     = strtotime($work_end ?? '17:00:00');
    $b_start = strtotime($break_start ?? '12:00:00');
    $b_end   = strtotime($break_end ?? '13:00:00');

    // ✅ ลำดับการตรวจสอบเป็นสำคัญ
    if ($current >= $end) {
        return 'off_duty';
    }
    
    if ($current < $start) {
        return 'waiting_to_start';
    }
    
    // ✅ CHECK BREAK FIRST (ก่อน available/working)
    if ($current >= $b_start && $current < $b_end) {
        return 'on_break';  // 🍽️ พักเบรค
    }

    // ✅ After break check, determine available or working
    if ($has_room) {
        return 'working';
    } else {
        return 'available';
    }
}
?>