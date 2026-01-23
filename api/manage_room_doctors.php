<?php
/**
 * API: Manage Room Doctors
 * ✅ ใช้ station_doctors.assigned_room_id เป็นหลัก
 * ✅ ไม่ใช้ room_doctors อีกต่อไป
 * ✅ รองรับทั้ง station_doctor_id และ room_doctor_id (backward compatible)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 0);
error_reporting(0);

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

    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? null;

    if (!$action) {
        throw new Exception('ไม่พบ action');
    }

    error_log("🔧 [MANAGE ROOM DOCTORS] Action: $action");
    error_log("📥 Request data: " . json_encode($data));

    // ==========================================
    // ASSIGN DOCTOR TO ROOM
    // ==========================================
    if ($action === 'assign') {
        // ✅ รองรับทั้ง station_doctor_id และ room_doctor_id
        $stationDoctorId = $data['station_doctor_id'] ?? $data['room_doctor_id'] ?? null;
        $roomId = $data['room_id'] ?? null;

        if (!$stationDoctorId || !$roomId) {
            throw new Exception('ต้องระบุ station_doctor_id (หรือ room_doctor_id) และ room_id');
        }

        error_log("👨‍⚕️ Assigning doctor ID: $stationDoctorId to room ID: $roomId");

        // ตรวจสอบว่าแพทย์มีอยู่จริง
        $checkStmt = $pdo->prepare("
            SELECT station_doctor_id, doctor_name, assigned_room_id, status
            FROM station_doctors
            WHERE station_doctor_id = :station_doctor_id
            AND is_active = 1
            LIMIT 1
        ");
        $checkStmt->execute([':station_doctor_id' => $stationDoctorId]);
        $doctor = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$doctor) {
            throw new Exception('ไม่พบแพทย์');
        }

        // ตรวจสอบว่าห้องมีอยู่จริง
        $roomStmt = $pdo->prepare("
            SELECT room_id, room_name, station_id
            FROM station_rooms
            WHERE room_id = :room_id
            LIMIT 1
        ");
        $roomStmt->execute([':room_id' => $roomId]);
        $room = $roomStmt->fetch(PDO::FETCH_ASSOC);

        if (!$room) {
            throw new Exception('ไม่พบห้อง');
        }

        // อัปเดต assigned_room_id
        $updateStmt = $pdo->prepare("
            UPDATE station_doctors
            SET 
                assigned_room_id = :room_id,
                status = 'assigned'
            WHERE station_doctor_id = :station_doctor_id
        ");
        $updateStmt->execute([
            ':room_id' => $roomId,
            ':station_doctor_id' => $stationDoctorId
        ]);

        error_log("✅ Assigned Doctor {$doctor['doctor_name']} to Room {$room['room_name']}");

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'มอบหมายแพทย์เข้าห้องสำเร็จ',
            'data' => [
                'station_doctor_id' => $stationDoctorId,
                'doctor_name' => $doctor['doctor_name'],
                'room_id' => $roomId,
                'room_name' => $room['room_name'],
                'status' => 'assigned'
            ]
        ], JSON_UNESCAPED_UNICODE);
    }

    // ==========================================
    // REMOVE DOCTOR FROM ROOM
    // ==========================================
    elseif ($action === 'remove') {
        // ✅ รองรับทั้ง station_doctor_id และ room_doctor_id
        $stationDoctorId = $data['station_doctor_id'] ?? $data['room_doctor_id'] ?? null;

        if (!$stationDoctorId) {
            throw new Exception('ต้องระบุ station_doctor_id (หรือ room_doctor_id)');
        }

        error_log("👨‍⚕️ Removing doctor ID: $stationDoctorId from room");

        // ดึงข้อมูลแพทย์ก่อนลบ
        $getStmt = $pdo->prepare("
            SELECT 
                sd.station_doctor_id,
                sd.doctor_name,
                sd.assigned_room_id,
                sr.room_name
            FROM station_doctors sd
            LEFT JOIN station_rooms sr ON sd.assigned_room_id = sr.room_id
            WHERE sd.station_doctor_id = :station_doctor_id
            LIMIT 1
        ");
        $getStmt->execute([':station_doctor_id' => $stationDoctorId]);
        $doctor = $getStmt->fetch(PDO::FETCH_ASSOC);

        if (!$doctor) {
            throw new Exception('ไม่พบแพทย์');
        }

        // ลบออกจากห้อง (เซ็ต assigned_room_id = NULL)
        $removeStmt = $pdo->prepare("
            UPDATE station_doctors
            SET 
                assigned_room_id = NULL,
                status = 'available'
            WHERE station_doctor_id = :station_doctor_id
        ");
        $removeStmt->execute([':station_doctor_id' => $stationDoctorId]);

        error_log("✅ Removed Doctor {$doctor['doctor_name']} from Room {$doctor['room_name']}");

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'ลบแพทย์ออกจากห้องสำเร็จ',
            'data' => [
                'station_doctor_id' => $stationDoctorId,
                'doctor_name' => $doctor['doctor_name'],
                'previous_room' => $doctor['room_name'],
                'status' => 'available'
            ]
        ], JSON_UNESCAPED_UNICODE);
    }

    // ==========================================
    // UNKNOWN ACTION
    // ==========================================
    else {
        throw new Exception("Action ไม่ถูกต้อง: $action");
    }

} catch (Exception $e) {
    error_log("❌ [MANAGE ROOM DOCTORS] ERROR: " . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}
?>