<?php
/**
 * ✅ get_station_order.php
 * ดึงลำดับ station จาก database
 */

ob_end_clean();
ob_start();

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

date_default_timezone_set('Asia/Bangkok');

try {
    $floor = intval($_GET['floor'] ?? 0);

    if (!$floor) {
        throw new Exception('Missing floor parameter');
    }

    // Connect to DB
    $conn = new mysqli('127.0.0.1', 'sa', '', 'hospitalstation');
    $conn->set_charset('utf8mb4');

    if ($conn->connect_error) {
        throw new Exception('DB Connection failed: ' . $conn->connect_error);
    }

    // Get station order
    $stmt = $conn->prepare("
        SELECT station_id, display_order 
        FROM stations 
        WHERE floor = ? 
        ORDER BY display_order ASC, station_id ASC
    ");

    $stmt->bind_param('i', $floor);
    $stmt->execute();

    $result = $stmt->get_result();
    $orders = [];

    while ($row = $result->fetch_assoc()) {
        $orders[] = [
            'station_id' => intval($row['station_id']),
            'order_position' => intval($row['display_order'] ?? 0)
        ];
    }

    $stmt->close();
    $conn->close();

    ob_clean();
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $orders
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