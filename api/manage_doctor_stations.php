<?php
/**
 * API: Manage Doctor Stations
 * Assign doctors to specific stations/rooms
 * ✅ UPDATED: รองรับตาราง room_doctors แทน room_doctors_old
 * ✅ FIXED: ใช้โครงสร้างตาราง station_doctors ที่ถูกต้อง
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;port=3306;dbname=hospitalstation;charset=utf8mb4",
        'sa',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - List all doctors in all stations (from station_doctors)
if ($method === 'GET') {
    // ใน GET method (บรรทัด 32-51)
$stmt = $pdo->query("
    SELECT 
        sd.station_doctor_id,
        sd.station_id,
        sd.doctor_name,
        sd.doctor_id,
        sd.work_date,
        sd.work_start_time,
        sd.work_end_time,
        sd.break_start_time,
        sd.break_end_time,
        sd.is_active,
        sd.status,
        sd.room_number,
        sd.assigned_room_id,
        s.station_name,
        s.station_code,
        sr.room_name as assigned_room_name
    FROM station_doctors sd
    LEFT JOIN stations s ON sd.station_id = s.station_id
    LEFT JOIN station_rooms sr ON sd.assigned_room_id = sr.room_id
    WHERE sd.is_active = 1
    AND (sd.work_date = CURDATE() OR sd.work_date IS NULL)  -- ✅ เพิ่มเงื่อนไข
    ORDER BY sd.doctor_name
");
    $doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $doctors,
        'count' => count($doctors)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// POST - Assign doctor to station (or create new station doctor)
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $doctorName = $input['doctor_name'] ?? '';
    $stationId = $input['station_id'] ?? null;
    $roomId = $input['room_id'] ?? null;
    $assignedRoomId = $input['assigned_room_id'] ?? null; // ใช้ชื่อเดียวกับตาราง
    $doctorIdInput = $input['doctor_id'] ?? null;
    $workStartTime = $input['work_start_time'] ?? '08:00:00';
    $workEndTime = $input['work_end_time'] ?? '17:00:00';
    $breakStartTime = $input['break_start_time'] ?? '12:00:00';
    $breakEndTime = $input['break_end_time'] ?? '13:00:00';
    $status = $input['status'] ?? 'available';
    
    // ✅ FIXED: ไม่มี specialization ในตาราง station_doctors
    // ลบการรับค่า specialization
    // $specialization = $input['specialization'] ?? 'General';

    if (empty($doctorName) || empty($stationId)) {
        echo json_encode([
            'success' => false,
            'message' => 'Doctor name and station ID are required'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    try {
        // Check if doctor already exists in station_doctors 
        // ตรวจสอบด้วย doctor_name + station_id หรือ doctor_id + station_id
        if ($doctorIdInput) {
            $stmt = $pdo->prepare("
                SELECT station_doctor_id, doctor_id 
                FROM station_doctors 
                WHERE (doctor_id = :doctor_id AND station_id = :station_id)
                   OR (doctor_name = :name AND station_id = :station_id)
                LIMIT 1
            ");
            $stmt->execute([
                ':doctor_id' => $doctorIdInput,
                ':name' => $doctorName,
                ':station_id' => $stationId
            ]);
        } else {
            $stmt = $pdo->prepare("
                SELECT station_doctor_id, doctor_id 
                FROM station_doctors 
                WHERE doctor_name = :name AND station_id = :station_id
                LIMIT 1
            ");
            $stmt->execute([
                ':name' => $doctorName,
                ':station_id' => $stationId
            ]);
        }
        
        $existingDoctor = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existingDoctor) {
            // Doctor already exists in station_doctors, update details
            // ✅ FIXED: ไม่มี specialization ในตาราง
            $stmt = $pdo->prepare("
                UPDATE station_doctors 
                SET doctor_name = :doctor_name,
                    work_start_time = :work_start_time,
                    work_end_time = :work_end_time,
                    break_start_time = :break_start_time,
                    break_end_time = :break_end_time,
                    status = :status,
                    assigned_room_id = :assigned_room_id,
                    room_number = :room_number
                WHERE station_doctor_id = :id
            ");
            
            // หา room_number ถ้ามี assigned_room_id
            $roomNumber = null;
            if ($assignedRoomId) {
                $roomStmt = $pdo->prepare("SELECT room_number FROM station_rooms WHERE room_id = :room_id");
                $roomStmt->execute([':room_id' => $assignedRoomId]);
                $roomData = $roomStmt->fetch(PDO::FETCH_ASSOC);
                $roomNumber = $roomData ? $roomData['room_number'] : null;
            }
            
            $stmt->execute([
                ':doctor_name' => $doctorName,
                ':work_start_time' => $workStartTime,
                ':work_end_time' => $workEndTime,
                ':break_start_time' => $breakStartTime,
                ':break_end_time' => $breakEndTime,
                ':status' => $status,
                ':assigned_room_id' => $assignedRoomId,
                ':room_number' => $roomNumber,
                ':id' => $existingDoctor['station_doctor_id']
            ]);

            $doctorId = $existingDoctor['doctor_id'];
            $stationDoctorId = $existingDoctor['station_doctor_id'];
            $message = 'Doctor details updated successfully in station_doctors';
        } else {
            // Create new doctor in station_doctors
            // ✅ FIXED: ใช้โครงสร้างตารางที่ถูกต้อง
            $stmt = $pdo->prepare("
                INSERT INTO station_doctors 
                (doctor_name, doctor_id, station_id, 
                 work_start_time, work_end_time, break_start_time, break_end_time,
                 is_active, status, room_number, assigned_room_id)
                VALUES (:name, :doctor_id_input, :station_id, 
                        :work_start_time, :work_end_time, :break_start_time, :break_end_time,
                        1, :status, :room_number, :assigned_room_id)
            ");
            
            // หา room_number ถ้ามี assigned_room_id
            $roomNumber = null;
            if ($assignedRoomId) {
                $roomStmt = $pdo->prepare("SELECT room_number FROM station_rooms WHERE room_id = :room_id");
                $roomStmt->execute([':room_id' => $assignedRoomId]);
                $roomData = $roomStmt->fetch(PDO::FETCH_ASSOC);
                $roomNumber = $roomData ? $roomData['room_number'] : null;
            }
            
            $stmt->execute([
                ':name' => $doctorName,
                ':doctor_id_input' => $doctorIdInput,
                ':station_id' => $stationId,
                ':work_start_time' => $workStartTime,
                ':work_end_time' => $workEndTime,
                ':break_start_time' => $breakStartTime,
                ':break_end_time' => $breakEndTime,
                ':status' => $status,
                ':room_number' => $roomNumber,
                ':assigned_room_id' => $assignedRoomId
            ]);

            $stationDoctorId = $pdo->lastInsertId();
            $doctorId = $doctorIdInput;
            $message = 'New Doctor created in station_doctors successfully';
        }

        // ✅ FIXED: หากต้องการ assign doctor ไปยัง room_doctors ด้วย
        if ($assignedRoomId && $stationDoctorId) {
            // ตรวจสอบว่า doctor ถูก assign ใน room_doctors แล้วหรือยัง
            $checkRoomStmt = $pdo->prepare("
                SELECT station_doctor_id 
                FROM room_doctors 
                WHERE station_doctor_id = :station_doctor_id 
                AND assigned_room_id = :room_id
                AND is_active = 1
            ");
            $checkRoomStmt->execute([
                ':station_doctor_id' => $stationDoctorId,
                ':room_id' => $assignedRoomId
            ]);
            
            if ($checkRoomStmt->fetchColumn() == 0) {
                // หา room_number และ station_id ของห้อง
                $roomInfoStmt = $pdo->prepare("
                    SELECT room_number, station_id 
                    FROM station_rooms 
                    WHERE room_id = :room_id
                ");
                $roomInfoStmt->execute([':room_id' => $assignedRoomId]);
                $roomInfo = $roomInfoStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($roomInfo) {
                    // Assign to room_doctors
                    $assignStmt = $pdo->prepare("
                        INSERT INTO room_doctors 
                        (station_doctor_id, station_id, doctor_name, doctor_id,
                         work_start_time, work_end_time, break_start_time, break_end_time,
                         is_active, status, room_number, assigned_room_id)
                        VALUES (:station_doctor_id, :station_id, :doctor_name, :doctor_id,
                                :work_start_time, :work_end_time, :break_start_time, :break_end_time,
                                1, :status, :room_number, :assigned_room_id)
                    ");
                    $assignStmt->execute([
                        ':station_doctor_id' => $stationDoctorId,
                        ':station_id' => $roomInfo['station_id'],
                        ':doctor_name' => $doctorName,
                        ':doctor_id' => $doctorId,
                        ':work_start_time' => $workStartTime,
                        ':work_end_time' => $workEndTime,
                        ':break_start_time' => $breakStartTime,
                        ':break_end_time' => $breakEndTime,
                        ':status' => $status,
                        ':room_number' => $roomInfo['room_number'],
                        ':assigned_room_id' => $assignedRoomId
                    ]);
                    $message .= ' and assigned to room ' . $assignedRoomId . ' in room_doctors';
                }
            } else {
                $message .= ' but already assigned to room ' . $assignedRoomId . ' in room_doctors';
            }
        }

        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => [
                'station_doctor_id' => $stationDoctorId,
                'doctor_id' => $doctorId,
                'doctor_name' => $doctorName,
                'station_id' => $stationId,
                'assigned_room_id' => $assignedRoomId
            ]
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        error_log("❌ Error in POST /manage_doctor_stations: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Failed to assign doctor: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// DELETE - Remove doctor from station_doctors (soft delete)
if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stationDoctorId = $input['station_doctor_id'] ?? 0;
    $doctorId = $input['doctor_id'] ?? 0;

    if ($stationDoctorId <= 0 && $doctorId <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid doctor ID or station_doctor_id'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    try {
        // ✅ FIXED: Soft delete แทน hard delete
        if ($stationDoctorId > 0) {
            // 1. Soft delete from station_doctors
            $stmt = $pdo->prepare("
                UPDATE station_doctors 
                SET is_active = 0, status = 'inactive'
                WHERE station_doctor_id = :id
            ");
            $stmt->execute([':id' => $stationDoctorId]);
            
            // 2. Soft delete from room_doctors
            $stmt = $pdo->prepare("
                UPDATE room_doctors 
                SET is_active = 0, status = 'inactive'
                WHERE station_doctor_id = :id
            ");
            $stmt->execute([':id' => $stationDoctorId]);
            
            $message = 'Doctor soft deleted successfully (station_doctor_id: ' . $stationDoctorId . ')';
            
        } elseif ($doctorId > 0) {
            // ใช้ doctor_id แทน
            // 1. Soft delete from station_doctors
            $stmt = $pdo->prepare("
                UPDATE station_doctors 
                SET is_active = 0, status = 'inactive'
                WHERE doctor_id = :id
            ");
            $stmt->execute([':id' => $doctorId]);
            
            // 2. Soft delete from room_doctors
            $stmt = $pdo->prepare("
                UPDATE room_doctors 
                SET is_active = 0, status = 'inactive'
                WHERE doctor_id = :id
            ");
            $stmt->execute([':id' => $doctorId]);
            
            $message = 'Doctor soft deleted successfully (doctor_id: ' . $doctorId . ')';
        }

        echo json_encode([
            'success' => true,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        error_log("❌ Error in DELETE /manage_doctor_stations: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Failed to remove doctor: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

echo json_encode([
    'success' => false,
    'message' => 'Method not allowed'
], JSON_UNESCAPED_UNICODE);
?>