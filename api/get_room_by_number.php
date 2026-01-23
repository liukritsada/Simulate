<?php
/**
 * API: Get Room by Number - FINAL FIXED VERSION
 * ✅ ใช้ columns ที่แท้จริง (ไม่มี is_active, floor)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

$host = '127.0.0.1';
$port = '3306';
$dbname = 'hospitalstation';
$username = 'sa';
$password = '';

try {
    // ============================================================
    // 🔌 เชื่อมต่อฐานข้อมูล
    // ============================================================
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]
    );

    error_log("✅ เชื่อมต่อฐานข้อมูลสำเร็จ");

    // ============================================================
    // 📥 ดึง parameters
    // ============================================================
    $station_id = isset($_GET['station_id']) ? intval($_GET['station_id']) : 0;
    $room_number = isset($_GET['room_number']) ? trim($_GET['room_number']) : '';

    error_log("📥 Parameters: station_id=$station_id, room_number=$room_number");

    if ($station_id <= 0) {
        throw new Exception('ต้องระบุ station_id ที่ถูกต้อง');
    }

    if (empty($room_number)) {
        throw new Exception('ต้องระบุ room_number');
    }

    // ============================================================
    // ✅ QUERY: ค้นหาห้องตามเลขห้อง
    // station_rooms columns: room_id, station_id, room_number, room_name,
    //                        max_patients, settings_json, created_at
    // ============================================================
    error_log("🔍 ค้นหาห้อง: station_id=$station_id, room_number=$room_number");

    $query = "
        SELECT 
            sr.room_id,
            sr.station_id,
            sr.room_number,
            sr.room_name,
            sr.max_patients,
            sr.created_at
        FROM station_rooms sr
        WHERE sr.station_id = :station_id
        AND sr.room_number = :room_number
        LIMIT 1
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':station_id' => $station_id,
        ':room_number' => $room_number
    ]);

    $room = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$room) {
        error_log("⚠️ ไม่พบห้อง: station_id=$station_id, room_number=$room_number");
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => "ไม่พบห้องหมายเลข $room_number ในสถานีนี้"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    error_log("✅ พบห้อง: " . $room['room_name']);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $room
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    error_log("❌ Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    error_log("❌ Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>