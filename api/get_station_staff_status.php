<?php
/**
 * ✅ FILE 3: get_station_staff_status.php
 * ดึงข้อมูล staff จาก station_staff เท่านั้น
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json; charset=utf-8');

try {
    // ✅ ดึง parameters จาก GET
    $station_id = intval($_GET['station_id'] ?? 0);
    $work_date = $_GET['work_date'] ?? date('Y-m-d');
    
    error_log("=== GET_STATION_STAFF_STATUS START ===");
    error_log("station_id: $station_id, work_date: $work_date");
    
    if (!$station_id) {
        throw new Exception('Missing station_id');
    }
    
    require_once __DIR__ . '/db_config.php';
    
    if (!isset($conn) || !$conn || $conn->connect_error) {
        throw new Exception('Database connection error');
    }
    
    // ✅ QUERY: ดึง staff ทั้งหมด จาก station_staff เท่านั้น
    $query = "
        SELECT 
            station_staff_id,
            staff_id,
            staff_name,
            staff_type,
            work_start_time,
            work_end_time,
            break_start_time,
            break_end_time,
            assigned_room_id,
            status,
            is_active,
            is_replacement,
            assigned_at,
            work_date
        FROM station_staff
        WHERE station_id = ?
            AND work_date = ?
        ORDER BY work_start_time ASC, staff_name ASC
    ";
    
    error_log("Executing query with station_id=$station_id, work_date=$work_date");
    
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        throw new Exception('Prepare error: ' . $conn->error);
    }
    
    // ✅ Bind parameters
    $stmt->bind_param('is', $station_id, $work_date);
    
    if (!$stmt->execute()) {
        throw new Exception('Execute error: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $staff = [];
    
    while ($row = $result->fetch_assoc()) {
        $staff[] = $row;
    }
    
    $stmt->close();
    
    error_log("✅ Retrieved " . count($staff) . " staff records");
    
    if (count($staff) > 0) {
        error_log("📋 First staff: " . json_encode($staff[0]));
    }
    
    error_log("=== GET_STATION_STAFF_STATUS END (SUCCESS) ===");
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Staff data retrieved successfully',
        'data' => [
            'station_id' => $station_id,
            'work_date' => $work_date,
            'staff_count' => count($staff),
            'staff' => $staff,
            'timestamp' => date('c')
        ]
    ], JSON_UNESCAPED_UNICODE);
    
    $conn->close();
    
} catch (Exception $e) {
    error_log('❌ get_station_staff_status.php ERROR: ' . $e->getMessage());
    error_log("=== GET_STATION_STAFF_STATUS END (ERROR) ===");
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => 'GET_STAFF_ERROR',
        'timestamp' => date('c')
    ], JSON_UNESCAPED_UNICODE);
}
?>