<?php
/**
 * API: Assign Staff to Room
 * ✅ ใช้แค่ station_staff table เดียว (ไม่ใช้ room_staff)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
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
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    $roomId = intval($input['room_id'] ?? 0);
    $stationStaffId = intval($input['station_staff_id'] ?? 0);
    $workStartTime = $input['work_start_time'] ?? '08:00:00';
    $workEndTime = $input['work_end_time'] ?? '17:00:00';
    $breakStartTime = $input['break_start_time'] ?? '12:00:00';
    $breakEndTime = $input['break_end_time'] ?? '13:00:00';

    // ✅ Validate inputs
    if ($roomId <= 0 || $stationStaffId <= 0) {
        throw new Exception('Invalid room_id or station_staff_id');
    }

    // ✅ Validate time format (should be HH:MM:SS)
    if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $workStartTime)) {
        $workStartTime = $workStartTime . ':00';
    }
    if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $workEndTime)) {
        $workEndTime = $workEndTime . ':00';
    }
    if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $breakStartTime)) {
        $breakStartTime = $breakStartTime . ':00';
    }
    if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $breakEndTime)) {
        $breakEndTime = $breakEndTime . ':00';
    }

    // ✅ Get station_staff info
    $staffStmt = $pdo->prepare("
        SELECT ss.station_staff_id, ss.staff_name, ss.staff_type, ss.assigned_room_id
        FROM station_staff ss
        WHERE ss.station_staff_id = :id AND ss.is_active = 1
    ");
    $staffStmt->execute([':id' => $stationStaffId]);
    $staffData = $staffStmt->fetch(PDO::FETCH_ASSOC);

    if (!$staffData) {
        throw new Exception('Staff not found or inactive');
    }

    // ✅ Check if room exists
    $roomStmt = $pdo->prepare("SELECT room_id, room_name FROM station_rooms WHERE room_id = :id");
    $roomStmt->execute([':id' => $roomId]);
    $roomData = $roomStmt->fetch(PDO::FETCH_ASSOC);

    if (!$roomData) {
        throw new Exception('Room not found');
    }

    // ✅ Update station_staff (assign to room)
    $updateStmt = $pdo->prepare("
        UPDATE station_staff 
        SET assigned_room_id = :room_id,
            work_start_time = :work_start_time,
            work_end_time = :work_end_time,
            break_start_time = :break_start_time,
            break_end_time = :break_end_time,
            status = 'working',
            assigned_at = NOW()
        WHERE station_staff_id = :station_staff_id
    ");
    
    $updateStmt->execute([
        ':room_id' => $roomId,
        ':work_start_time' => $workStartTime,
        ':work_end_time' => $workEndTime,
        ':break_start_time' => $breakStartTime,
        ':break_end_time' => $breakEndTime,
        ':station_staff_id' => $stationStaffId
    ]);

    $wasAlreadyAssigned = !empty($staffData['assigned_room_id']);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $wasAlreadyAssigned ? 'Staff assignment updated successfully' : 'Staff assigned to room successfully',
        'data' => [
            'station_staff_id' => $stationStaffId,
            'room_id' => $roomId,
            'room_name' => $roomData['room_name'],
            'staff_name' => $staffData['staff_name'],
            'staff_type' => $staffData['staff_type'],
            'work_start_time' => $workStartTime,
            'work_end_time' => $workEndTime,
            'break_start_time' => $breakStartTime,
            'break_end_time' => $breakEndTime,
            'was_updated' => $wasAlreadyAssigned
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>