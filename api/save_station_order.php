<?php
/**
 * ✅ save_station_order.php
 * บันทึกลำดับ station ลง database
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
    $stations = $input['stations'] ?? [];

    if (!$floor || empty($stations)) {
        throw new Exception('Missing floor or stations data');
    }

    // Connect to DB
    $conn = new mysqli('127.0.0.1', 'sa', '', 'hospitalstation');
    $conn->set_charset('utf8mb4');

    if ($conn->connect_error) {
        throw new Exception('DB Connection failed: ' . $conn->connect_error);
    }

    // Update each station's order
    $updated = 0;
    foreach ($stations as $station) {
        $stationId = intval($station['station_id']);
        $orderPosition = intval($station['order_position']);

        $stmt = $conn->prepare("
            UPDATE stations 
            SET display_order = ? 
            WHERE station_id = ? AND floor = ?
        ");

        $stmt->bind_param('iii', $orderPosition, $stationId, $floor);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            $updated++;
        }
        $stmt->close();
    }

    $conn->close();

    ob_clean();
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Updated $updated stations",
        'data' => [
            'floor' => $floor,
            'updated_count' => $updated
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