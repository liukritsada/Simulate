<?php
/**
 * API: Update Station Default Wait Time and Service Time
 * อัปเดตค่า default_wait_time และ default_service_time ของ station
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db_config.php';

$conn = DBConfig::getConnection();

$input = json_decode(file_get_contents('php://input'), true);
$station_id = $input['station_id'] ?? 0;
$default_wait_time = $input['default_wait_time'] ?? null;
$default_service_time = $input['default_service_time'] ?? null;

if ($station_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid station_id']);
    exit;
}

if ($default_wait_time === null && $default_service_time === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing default_wait_time or default_service_time']);
    exit;
}

try {
    $updates = [];
    $params = [];
    
    if ($default_wait_time !== null) {
        $updates[] = "default_wait_time = ?";
        $params[] = intval($default_wait_time);
    }
    
    if ($default_service_time !== null) {
        $updates[] = "default_service_time = ?";
        $params[] = intval($default_service_time);
    }
    
    $sql = "UPDATE stations SET " . implode(', ', $updates) . " WHERE station_id = ?";
    $params[] = $station_id;
    
    $stmt = $conn->prepare($sql);
    
    if ($stmt->execute($params)) {
        http_response_code(200);
        echo json_encode([
            'success' => true, 
            'message' => 'Station times updated successfully',
            'data' => [
                'station_id' => $station_id,
                'default_wait_time' => $default_wait_time,
                'default_service_time' => $default_service_time
            ]
        ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Update failed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
