
<?php
/**
 * ✅ FILE 5: get_available_rooms.php
 * ดึงห้องว่างที่พร้อม assign พนักงาน
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
date_default_timezone_set('Asia/Bangkok');

try {
    $station_id = intval($_GET['station_id'] ?? 0);
    
    if (!$station_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'station_id is required']);
        exit;
    }
    
    require_once __DIR__ . '/db_config.php';
    
    if (!isset($conn) || !$conn) {
        throw new Exception('Database connection not established');
    }
    
    // ✅ นับจำนวนพนักงาน assigned ต่อห้อง
    $sql = "
        SELECT 
            r.room_id,
            r.room_name,
            r.room_number,
            COUNT(ss.station_staff_id) as current_staff_count
        FROM station_rooms r
        LEFT JOIN station_staff ss ON r.room_id = ss.assigned_room_id 
            AND ss.is_active = 1
        WHERE r.station_id = ?
        GROUP BY r.room_id, r.room_name, r.room_number
        ORDER BY r.room_number ASC
    ";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception('Prepare error: ' . $conn->error);
    }
    
    $stmt->bind_param('i', $station_id);
    
    if (!$stmt->execute()) {
        throw new Exception('Execute error: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $rooms = [];
    
    while ($row = $result->fetch_assoc()) {
        $rooms[] = [
            'room_id' => intval($row['room_id']),
            'room_name' => $row['room_name'],
            'room_number' => $row['room_number'],
            'current_staff_count' => intval($row['current_staff_count']),
            'is_available' => intval($row['current_staff_count']) < 3  // เช่น max 3 คน
        ];
    }
    
    $stmt->close();
    $conn->close();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $rooms,
        'timestamp' => date('c'),
        'station_id' => $station_id
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    error_log('get_available_rooms.php ERROR: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => 'ROOM_ERROR'
    ], JSON_UNESCAPED_UNICODE);
}
?>