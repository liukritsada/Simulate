<?php
/**
 * API: Remove Doctor from Room
 * ✅ ใช้ station_doctors เป็นแหล่งข้อมูลหลัก
 * ✅ ลบออกจากห้อง = SET assigned_room_id = NULL
 * ✅ ไม่ใช้ room_doctors อีกต่อไป
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// ✅ รองรับ OPTIONS request (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ✅ ตรวจสอบ REQUEST METHOD - รองรับ POST เท่านั้น
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("❌ Invalid method: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Only POST is accepted.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

ini_set('display_errors', 0);
error_reporting(E_ALL);

date_default_timezone_set('Asia/Bangkok');

$host = '127.0.0.1';
$port = '3306';
$dbname = 'hospitalstation';
$username = 'sa';
$password = '';

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $rawInput = file_get_contents('php://input');
    error_log("📥 Raw input: " . $rawInput);
    
    $input = json_decode($rawInput, true);
    error_log("📦 Decoded input: " . json_encode($input));
    
    if (!$input || !is_array($input)) {
        error_log("❌ Input is not valid array");
        $input = [];
    }
    
    // ✅ แปลงเป็น int อย่างชัดเจน
    $station_doctor_id = 0;
    $doctor_id = 0;
    $room_id = 0;
    
    if (isset($input['station_doctor_id'])) {
        $station_doctor_id = intval($input['station_doctor_id']);
        error_log("✅ station_doctor_id: " . $station_doctor_id . " (type: " . gettype($station_doctor_id) . ")");
    }
    
    if (isset($input['doctor_id'])) {
        $doctor_id = intval($input['doctor_id']);
        error_log("✅ doctor_id: " . $doctor_id . " (type: " . gettype($doctor_id) . ")");
    }
    
    if (isset($input['room_id'])) {
        $room_id = intval($input['room_id']);
    }

    error_log("📋 Final values - station_doctor_id: $station_doctor_id, doctor_id: $doctor_id, room_id: $room_id");

    // ✅ รองรับทั้ง station_doctor_id และ doctor_id
    if ($station_doctor_id <= 0 && $doctor_id <= 0) {
        error_log("❌ Missing both station_doctor_id (" . $station_doctor_id . ") and doctor_id (" . $doctor_id . ")");
        throw new Exception('ต้องระบุ station_doctor_id หรือ doctor_id');
    }

    // ✅ ดึงข้อมูลแพทย์
    if ($station_doctor_id > 0) {
        $doctorStmt = $pdo->prepare("
            SELECT 
                sd.station_doctor_id,
                sd.doctor_id,
                sd.doctor_name,
                sd.assigned_room_id,
                sr.room_number,
                sr.room_name
            FROM station_doctors sd
            LEFT JOIN station_rooms sr ON sd.assigned_room_id = sr.room_id
            WHERE sd.station_doctor_id = :station_doctor_id
            AND DATE(sd.work_date) = CURDATE()
            AND sd.is_active = 1
            LIMIT 1
        ");
        $doctorStmt->execute([':station_doctor_id' => $station_doctor_id]);
    } else {
        $doctorStmt = $pdo->prepare("
            SELECT 
                sd.station_doctor_id,
                sd.doctor_id,
                sd.doctor_name,
                sd.assigned_room_id,
                sr.room_number,
                sr.room_name
            FROM station_doctors sd
            LEFT JOIN station_rooms sr ON sd.assigned_room_id = sr.room_id
            WHERE sd.doctor_id = :doctor_id
            AND DATE(sd.work_date) = CURDATE()
            AND sd.is_active = 1
            LIMIT 1
        ");
        $doctorStmt->execute([':doctor_id' => $doctor_id]);
    }
    
    $doctor = $doctorStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$doctor) {
        throw new Exception('ไม่พบแพทย์ในวันนี้');
    }

    // ✅ ตรวจสอบว่าแพทย์อยู่ในห้องหรือไม่
    if (!$doctor['assigned_room_id']) {
        throw new Exception('แพทย์ไม่ได้อยู่ในห้องใดๆ');
    }

    // ✅ ถ้าระบุ room_id มา ต้องตรงกับห้องที่แพทย์อยู่
    if ($room_id > 0 && $doctor['assigned_room_id'] != $room_id) {
        throw new Exception('แพทย์ไม่ได้อยู่ในห้องที่ระบุ');
    }

    // ✅ UPDATE: ลบออกจากห้อง
    $updateStmt = $pdo->prepare("
        UPDATE station_doctors 
        SET 
            assigned_room_id = NULL,
            status = 'available'
        WHERE station_doctor_id = :station_doctor_id
        AND DATE(work_date) = CURDATE()
    ");
    
    $updateStmt->execute([
        ':station_doctor_id' => $doctor['station_doctor_id']
    ]);

    $affected = $updateStmt->rowCount();

    if ($affected === 0) {
        throw new Exception('ไม่สามารถลบแพทย์ออกจากห้องได้');
    }

    error_log("✅✅✅ Doctor removed from room:");
    error_log("  - station_doctor_id: {$doctor['station_doctor_id']}");
    error_log("  - doctor_name: {$doctor['doctor_name']}");
    error_log("  - removed_from_room: {$doctor['assigned_room_id']} ({$doctor['room_name']})");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'ลบแพทย์ออกจากห้องสำเร็จ',
        'data' => [
            'station_doctor_id' => intval($doctor['station_doctor_id']),
            'doctor_id' => intval($doctor['doctor_id']),
            'doctor_name' => $doctor['doctor_name'],
            'removed_from_room_id' => $doctor['assigned_room_id'],
            'removed_from_room_name' => $doctor['room_name'],
            'timestamp' => date('Y-m-d H:i:s')
        ]
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