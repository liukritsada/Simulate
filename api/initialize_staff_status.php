<?php
/**
 * ✅ initialize_staff_status.php
 * Auto initialize staff status ให้ถูกต้องตามเวลาปัจจุบัน
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
date_default_timezone_set('Asia/Bangkok');

try {
    // Connect to database
    $host = '127.0.0.1';
    $db = 'hospitalstation';
    $user = 'sa';
    $pass = '';
    
    $conn = new mysqli($host, $user, $pass, $db);
    
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
    
    // ✅ Get current time
    $currentTime = date('H:i:s');
    $currentDate = date('Y-m-d');
    
    // ✅ Get all active staff for today
    $query = "
        SELECT 
            station_staff_id,
            staff_name,
            work_start_time,
            work_end_time,
            break_start_time,
            break_end_time,
            status as current_status
        FROM station_staff
        WHERE work_date = ?
        AND is_active = 1
        ORDER BY staff_name
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $currentDate);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $staffList = [];
    $updates = [];
    
    while ($row = $result->fetch_assoc()) {
        $staffList[] = $row;
    }
    $stmt->close();
    
    // ✅ Function to determine status
    function getStatus($current, $start, $end, $breakStart, $breakEnd) {
        $curr = strtotime($current);
        $st = strtotime($start ?? '08:00:00');
        $en = strtotime($end ?? '17:00:00');
        $bs = strtotime($breakStart ?? '12:00:00');
        $be = strtotime($breakEnd ?? '13:00:00');
        
        if ($curr >= $en) return 'off_duty';
        if ($curr < $st) return 'waiting_to_start';
        if ($curr >= $bs && $curr < $be) return 'on_break';
        return 'working';
    }
    
    // ✅ Prepare update statement
    $updateStmt = $conn->prepare("
        UPDATE station_staff 
        SET status = ? 
        WHERE station_staff_id = ?
    ");
    
    // ✅ Process each staff
    $updateCount = 0;
    foreach ($staffList as $staff) {
        $newStatus = getStatus(
            $currentTime,
            $staff['work_start_time'],
            $staff['work_end_time'],
            $staff['break_start_time'],
            $staff['break_end_time']
        );
        
        $oldStatus = $staff['current_status'] ?? 'null';
        
        // Only update if different or if null
        if ($newStatus !== $oldStatus || !$oldStatus) {
            $updateStmt->bind_param('si', $newStatus, $staff['station_staff_id']);
            $updateStmt->execute();
            
            $updateCount++;
            $updates[] = [
                'staff_id' => $staff['station_staff_id'],
                'staff_name' => $staff['staff_name'],
                'old_status' => $oldStatus,
                'new_status' => $newStatus
            ];
        }
    }
    
    $updateStmt->close();
    $conn->close();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Staff status initialized',
        'data' => [
            'current_time' => $currentTime,
            'current_date' => $currentDate,
            'total_staff' => count($staffList),
            'updated_count' => $updateCount,
            'updates' => $updates
        ]
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => 'INIT_ERROR'
    ], JSON_UNESCAPED_UNICODE);
}
?>