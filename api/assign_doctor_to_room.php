<?php
/**
 * API: Assign Doctor to Room
 * ✅ ใช้ station_doctors เป็นแหล่งข้อมูลหลัก
 * ✅ เปลี่ยนห้อง = UPDATE assigned_room_id
 * ✅ ไม่ใช้ room_doctors อีกต่อไป
 */

if ($_SERVER['REQUEST_METHOD'] == 'POST' && 
    strpos($_SERVER['REQUEST_URI'], 'assign_doctor_to_room.php') !== false) {
    
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    ini_set('display_errors', 0);
    error_reporting(E_ALL);
    ini_set('log_errors', 1);

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

        $input = json_decode(file_get_contents('php://input'), true);
        
        $station_doctor_id = isset($input['station_doctor_id']) ? intval($input['station_doctor_id']) : 0;
        $doctor_id = isset($input['doctor_id']) ? intval($input['doctor_id']) : 0;
        $room_id = isset($input['room_id']) ? intval($input['room_id']) : 0;

        // ✅ รองรับทั้ง station_doctor_id และ doctor_id
        if ($station_doctor_id <= 0 && $doctor_id <= 0) {
            throw new Exception('ต้องระบุ station_doctor_id หรือ doctor_id');
        }
        if ($room_id <= 0) {
            throw new Exception('ต้องระบุ room_id');
        }

        // ✅ ดึงข้อมูลแพทย์จาก station_doctors (วันนี้เท่านั้น)
        if ($station_doctor_id > 0) {
            $doctorStmt = $pdo->prepare("
                SELECT 
                    sd.station_doctor_id,
                    sd.doctor_id,
                    sd.doctor_name,
                    sd.station_id,
                    sd.assigned_room_id as current_room_id,
                    sd.work_date
                FROM station_doctors sd
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
                    sd.station_id,
                    sd.assigned_room_id as current_room_id,
                    sd.work_date
                FROM station_doctors sd
                WHERE sd.doctor_id = :doctor_id
                AND DATE(sd.work_date) = CURDATE()
                AND sd.is_active = 1
                LIMIT 1
            ");
            $doctorStmt->execute([':doctor_id' => $doctor_id]);
        }
        
        $doctor = $doctorStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$doctor) {
            throw new Exception('ไม่พบแพทย์ในวันนี้ (กรุณาตรวจสอบว่ามีการ INSERT ข้อมูลแพทย์วันนี้แล้ว)');
        }

        // ✅ ตรวจสอบห้อง
        $roomStmt = $pdo->prepare("
            SELECT 
                sr.room_id,
                sr.room_number,
                sr.room_name,
                sr.station_id
            FROM station_rooms sr
            WHERE sr.room_id = :room_id
        ");
        $roomStmt->execute([':room_id' => $room_id]);
        $room = $roomStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$room) {
            throw new Exception('ไม่พบห้อง ID: ' . $room_id);
        }

        // ✅ ตรวจสอบว่าแพทย์และห้องอยู่ใน station เดียวกัน
        if ($doctor['station_id'] != $room['station_id']) {
            throw new Exception('แพทย์และห้องไม่ได้อยู่ใน Station เดียวกัน');
        }

        // ✅ ตรวจสอบว่าแพทย์อยู่ห้องนี้อยู่แล้วหรือไม่
        if ($doctor['current_room_id'] == $room_id) {
            throw new Exception('แพทย์อยู่ห้องนี้อยู่แล้ว');
        }

        // ✅ UPDATE assigned_room_id และ status
        $updateStmt = $pdo->prepare("
            UPDATE station_doctors 
            SET 
                assigned_room_id = :room_id,
                status = 'working'
            WHERE station_doctor_id = :station_doctor_id
            AND DATE(work_date) = CURDATE()
        ");
        
        $updateStmt->execute([
            ':room_id' => $room_id,
            ':station_doctor_id' => $doctor['station_doctor_id']
        ]);

        $affected = $updateStmt->rowCount();

        if ($affected === 0) {
            throw new Exception('ไม่สามารถอัปเดตข้อมูลได้');
        }

        $action = $doctor['current_room_id'] ? 'เปลี่ยนห้อง' : 'มอบหมายเข้าห้อง';
        $oldRoom = $doctor['current_room_id'] ? "จากห้อง {$doctor['current_room_id']}" : '';

        error_log("✅✅✅ Doctor assigned to room:");
        error_log("  - station_doctor_id: {$doctor['station_doctor_id']}");
        error_log("  - doctor_name: {$doctor['doctor_name']}");
        error_log("  - old_room_id: {$doctor['current_room_id']}");
        error_log("  - new_room_id: {$room_id} ({$room['room_name']})");
        error_log("  - action: {$action}");

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => "{$action}สำเร็จ {$oldRoom}",
            'data' => [
                'station_doctor_id' => $doctor['station_doctor_id'],
                'doctor_id' => $doctor['doctor_id'],
                'doctor_name' => $doctor['doctor_name'],
                'old_room_id' => $doctor['current_room_id'],
                'new_room_id' => $room_id,
                'room_number' => $room['room_number'],
                'room_name' => $room['room_name'],
                'action' => $action,
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
    exit();
}
?>