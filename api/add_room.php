<?php
/**
 * 🏠 Add Room API - FIXED VERSION 3
 * สร้างห้องใหม่ให้กับสถานี
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

$station_id = isset($input['station_id']) ? intval($input['station_id']) : null;
$room_name = isset($input['room_name']) ? trim($input['room_name']) : null;
$room_type = isset($input['room_type']) ? trim($input['room_type']) : 'standard';

// ========================================
// ✅ Validation
// ========================================
$errors = [];

if (!$station_id || $station_id <= 0) {
    $errors[] = 'Invalid station_id';
}

if (!$room_name || strlen($room_name) === 0) {
    $errors[] = 'room_name cannot be empty';
}

if (strlen($room_name) > 255) {
    $errors[] = 'room_name too long (max 255 characters)';
}

if (!empty($errors)) {
    ob_clean();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => '❌ Validation error: ' . implode(', ', $errors)
    ]);
    exit();
}

// ========================================
// ✅ Check if Station Exists
// ========================================
$check_sql = "SELECT station_id FROM stations WHERE station_id = ?";
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

$checkStmt->bind_param("i", $station_id);
$checkStmt->execute();
$result = $checkStmt->get_result();

if ($result->num_rows === 0) {
    ob_clean();
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => '❌ Station not found'
    ]);
    exit();
}

$checkStmt->close();

// ========================================
// ✅ Get Next room_number
// ========================================
$max_sql = "SELECT MAX(room_number) as max_num FROM station_rooms WHERE station_id = ?";
$maxStmt = $conn->prepare($max_sql);

if (!$maxStmt) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '❌ Database error: ' . $conn->error
    ]);
    exit();
}

$maxStmt->bind_param("i", $station_id);
$maxStmt->execute();
$maxResult = $maxStmt->get_result();
$maxRow = $maxResult->fetch_assoc();

$nextRoomNumber = (isset($maxRow['max_num']) && $maxRow['max_num']) ? ($maxRow['max_num'] + 1) : 1;
$maxStmt->close();

// ========================================
// ✅ Insert New Room
// ========================================
$insert_sql = "
    INSERT INTO station_rooms (
        station_id,
        room_number,
        room_name,
        max_patients,
        created_at
    ) VALUES (?, ?, ?, 1, NOW())
";

$insertStmt = $conn->prepare($insert_sql);

if (!$insertStmt) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '❌ Database error: ' . $conn->error
    ]);
    exit();
}

$max_patients = 1;
$insertStmt->bind_param("iis", $station_id, $nextRoomNumber, $room_name);

if (!$insertStmt->execute()) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '❌ Insert failed: ' . $insertStmt->error
    ]);
    exit();
}

$room_id = $conn->insert_id;
$insertStmt->close();

// ========================================
// ✅ Success Response
// ========================================

// ✅ CRITICAL: Clean buffer before final echo
ob_clean();

http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => '✅ Room created successfully',
    'data' => [
        'room_id' => $room_id,
        'station_id' => $station_id,
        'room_number' => $nextRoomNumber,
        'room_name' => $room_name,
        'max_patients' => 1,
        'created_at' => date('Y-m-d H:i:s')
    ]
], JSON_UNESCAPED_UNICODE);

// ✅ Close connection properly
$conn->close();
exit();
?>