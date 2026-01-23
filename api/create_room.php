<?php
/**
 * API: Create New Room (CLEAN VERSION) - FIXED
 * 
 * FIXES:
 * - ob_end_clean() + ob_start() ที่บรรทันแรก
 * - Suppress error output
 * - ob_clean() ก่อน echo json
 */

// ✅ OUTPUT BUFFERING FIRST
ob_end_clean();
ob_start();

// ✅ SUPPRESS ERROR OUTPUT
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// ✅ SET HEADERS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // ✅ Clean buffer
    ob_clean();
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db_config.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new Exception('Method not allowed');
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    $stationId  = intval($input['station_id'] ?? 0);
    $roomName   = trim($input['room_name'] ?? '');
    $roomNumber = trim($input['room_number'] ?? '');

    if ($stationId <= 0) {
        throw new Exception('Invalid station_id');
    }

    if ($roomName === '') {
        throw new Exception('room_name is required');
    }

    $pdo = DBConfig::getPDO();
    $pdo->beginTransaction();

    // Check station
    $stmt = $pdo->prepare("
        SELECT station_id, room_count
        FROM stations
        WHERE station_id = ?
        FOR UPDATE
    ");
    $stmt->execute([$stationId]);
    $station = $stmt->fetch();

    if (!$station) {
        throw new Exception('Station not found');
    }

    // Auto generate room number
    if ($roomNumber === '') {
        $roomNumber = 'Room ' . ($station['room_count'] + 1);
    }

    // Insert room
    $stmt = $pdo->prepare("
        INSERT INTO station_rooms
        (station_id, room_number, room_name, created_at)
        VALUES (?, ?, ?, NOW())
    ");
    $stmt->execute([$stationId, $roomNumber, $roomName]);
    $roomId = $pdo->lastInsertId();

    // Update room count
    $stmt = $pdo->prepare("
        UPDATE stations
        SET room_count = room_count + 1
        WHERE station_id = ?
    ");
    $stmt->execute([$stationId]);

    $pdo->commit();

    // ✅ CRITICAL: Clean buffer before response
    ob_clean();

    echo json_encode([
        'success' => true,
        'message' => 'Room created successfully',
        'data' => [
            'room_id' => (int)$roomId,
            'station_id' => $stationId,
            'room_number' => $roomNumber,
            'room_name' => $roomName
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    // ✅ CRITICAL: Clean buffer before error
    ob_clean();

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

// Note: Shutdown function in db_config.php handles cleanup
exit;
?>