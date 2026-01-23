<?php
/**
 * 🗑️ Delete Room API - FIXED VERSION 3
 * ลบห้องจากฐานข้อมูล
 * 
 * CHANGES:
 * - ไม่ใช้ DBConfig class
 * - ใช้ mysqli directly
 * - Output buffering + ob_clean()
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
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  ob_clean();
  http_response_code(200);
  exit();
}

// ========================================
// ✅ Database Connection (Direct)
// ========================================

try {
    // Create connection directly (no DBConfig class)
    $conn = new mysqli(
        '127.0.0.1',      // host
        'sa',             // username (from db_config.php)
        '',               // password
        'hospitalstation', // database
        3306              // port
    );
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
    
    // Set charset
    $conn->set_charset('utf8mb4');
    $conn->query("SET time_zone = '+07:00'");

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '❌ ' . $e->getMessage()
    ]);
    exit();
}

// ========================================
// ✅ Validate Request
// ========================================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_clean();
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => '❌ Invalid request method'
    ]);
    exit();
}

// ========================================
// ✅ Get Input Data
// ========================================
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    ob_clean();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => '❌ Invalid JSON input'
    ]);
    exit();
}

$room_id = isset($input['room_id']) ? intval($input['room_id']) : null;
$station_id = isset($input['station_id']) ? intval($input['station_id']) : null;

// ========================================
// ✅ Validation
// ========================================
if (!$room_id || $room_id <= 0) {
    ob_clean();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => '❌ Invalid room_id'
    ]);
    exit();
}

// ========================================
// ✅ Check if Room Exists
// ========================================
$check_sql = "SELECT room_id, station_id FROM station_rooms WHERE room_id = ?";
$checkStmt = $conn->prepare($check_sql);

if (!$checkStmt) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '❌ Database error: ' . $conn->error
    ]);
    exit();
}

$checkStmt->bind_param("i", $room_id);
$checkStmt->execute();
$result = $checkStmt->get_result();

if ($result->num_rows === 0) {
    ob_clean();
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => '❌ Room not found'
    ]);
    exit();
}

$room = $result->fetch_assoc();
$room_station_id = $room['station_id'];
$checkStmt->close();

// ========================================
// ✅ Delete Room
// ========================================
$delete_sql = "DELETE FROM station_rooms WHERE room_id = ?";
$deleteStmt = $conn->prepare($delete_sql);

if (!$deleteStmt) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '❌ Database error: ' . $conn->error
    ]);
    exit();
}

$deleteStmt->bind_param("i", $room_id);

if (!$deleteStmt->execute()) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '❌ Delete failed: ' . $deleteStmt->error
    ]);
    exit();
}

$affected_rows = $deleteStmt->affected_rows;
$deleteStmt->close();

// ========================================
// ✅ Success Response
// ========================================

// ✅ CRITICAL: Clean buffer before final echo
ob_clean();

if ($affected_rows > 0) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => '✅ Room deleted successfully',
        'data' => [
            'room_id' => $room_id,
            'station_id' => $room_station_id,
            'affected_rows' => $affected_rows
        ]
    ], JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(200);
    echo json_encode([
        'success' => false,
        'message' => '❌ No rows deleted'
    ], JSON_UNESCAPED_UNICODE);
}

// ✅ Close connection properly
$conn->close();
exit();
?>