<?php
/**
 * ✅ reset_station_order.php
 * รีเซ็ตลำดับ station เป็นค่าเริ่มต้น
 */

ob_end_clean();
ob_start();

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

date_default_timezone_set('Asia/Bangkok');

try {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    $floor = intval($input['floor'] ?? 0);

    if (!$floor) {
        throw new Exception('Missing floor parameter');
    }

    // Connect to DB
    $conn = new mysqli('127.0.0.1', 'sa', '', 'hospitalstation');
    $conn->set_charset('utf8mb4');

    if ($conn->connect_error) {
        throw new Exception('DB Connection failed: ' . $conn->connect_error);
    }

    // Reset display_order (set to NULL or 0, will auto-sort by station_id)
    $stmt = $conn->prepare("
        UPDATE stations 
        SET display_order = NULL 
        WHERE floor = ?
    ");

    $stmt->bind_param('i', $floor);
    $stmt->execute();

    $affected = $stmt->affected_rows;
    $stmt->close();
    $conn->close();

    ob_clean();
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Reset $affected stations",
        'data' => [
            'floor' => $floor,
            'reset_count' => $affected
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log('❌ ERROR: ' . $e->getMessage());
    
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>