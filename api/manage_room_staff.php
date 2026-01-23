<?php
/**
 * API: Manage Room Staff - FIXED
 * ✅ เพิ่มการตรวจสอบ station_staff_id ที่เข้มงวด
 * ✅ ใช้ station_staff.assigned_room_id แทน room_staff
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

    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    error_log("📥 manage_room_staff received: action=$action");
    error_log("📦 Input data: " . json_encode($input));

    switch ($action) {
        case 'add':
            // ✅ Add staff to room (UPDATE assigned_room_id)
            $roomId = intval($input['room_id'] ?? 0);
            $stationStaffId = intval($input['station_staff_id'] ?? 0);
            $staffName = $input['staff_name'] ?? '';
            
            error_log("🏢 Adding staff - room_id: $roomId, station_staff_id: $stationStaffId, name: $staffName");

            // ✅ ตรวจสอบ parameter
            if ($roomId <= 0) {
                throw new Exception('Invalid room_id: ' . $roomId);
            }
            
            if ($stationStaffId <= 0) {
                throw new Exception('Invalid station_staff_id: ' . $stationStaffId . ' (must be > 0)');
            }

            // ✅ ดึงข้อมูล staff จาก database
            $verifyStmt = $pdo->prepare("
                SELECT 
                    station_staff_id, 
                    work_date, 
                    staff_name, 
                    assigned_room_id,
                    work_start_time, 
                    work_end_time, 
                    break_start_time, 
                    break_end_time
                FROM station_staff 
                WHERE station_staff_id = :station_staff_id
                AND is_active = 1
            ");
            $verifyStmt->execute([':station_staff_id' => $stationStaffId]);
            $staffRecord = $verifyStmt->fetch(PDO::FETCH_ASSOC);

            if (!$staffRecord) {
                throw new Exception("Staff not found or inactive. station_staff_id: $stationStaffId");
            }

            error_log("✅ Staff record found: " . json_encode($staffRecord));

            // ✅ ตรวจสอบซ้ำว่า assigned แล้วหรือไม่
            if (!empty($staffRecord['assigned_room_id'])) {
                throw new Exception("Staff already assigned to room {$staffRecord['assigned_room_id']}");
            }

            // ✅ ใช้ข้อมูลจาก database
            $workDate = $staffRecord['work_date'] ?? date('Y-m-d');
            $staffName = $staffRecord['staff_name'];
            $workStartTime = $staffRecord['work_start_time'] ?? '08:00:00';
            $workEndTime = $staffRecord['work_end_time'] ?? '17:00:00';
            $breakStartTime = $staffRecord['break_start_time'] ?? '12:00:00';
            $breakEndTime = $staffRecord['break_end_time'] ?? '13:00:00';

            error_log("✅ Using staff times - start: $workStartTime, end: $workEndTime");

            // ✅ UPDATE station_staff to assign to room
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

            error_log("✅ Staff assigned successfully to room $roomId");

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Staff added to room successfully',
                'data' => [
                    'station_staff_id' => $stationStaffId,
                    'staff_name' => $staffName,
                    'room_id' => $roomId,
                    'work_date' => $workDate,
                    'work_start_time' => $workStartTime,
                    'work_end_time' => $workEndTime,
                    'break_start_time' => $breakStartTime,
                    'break_end_time' => $breakEndTime
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit;

        case 'remove_from_room':
            // ✅ Remove staff from room (SET assigned_room_id = NULL)
            $stationStaffId = intval($input['station_staff_id'] ?? 0);

            if ($stationStaffId <= 0) {
                throw new Exception('Invalid station_staff_id: ' . $stationStaffId);
            }
            
            error_log("🗑️ Removing staff from room - station_staff_id: $stationStaffId");

            // 1. Get staff info before removing
            $infoStmt = $pdo->prepare("
                SELECT station_staff_id, assigned_room_id, staff_name 
                FROM station_staff 
                WHERE station_staff_id = :id
            ");
            $infoStmt->execute([':id' => $stationStaffId]);
            $info = $infoStmt->fetch(PDO::FETCH_ASSOC);

            if (!$info) {
                throw new Exception('Staff not found');
            }

            if (empty($info['assigned_room_id'])) {
                throw new Exception('Staff is not assigned to any room');
            }

            $roomId = $info['assigned_room_id'];

            error_log("ℹ️ Found: station_staff_id=$stationStaffId, room_id=$roomId");

            // 2. Clear assigned_room_id = NULL
            $updateStmt = $pdo->prepare("
                UPDATE station_staff 
                SET assigned_room_id = NULL,
                    status = 'available',
                    assigned_at = NULL
                WHERE station_staff_id = :station_staff_id
            ");
            $updateStmt->execute([':station_staff_id' => $stationStaffId]);

            error_log("✅ Staff removed from room $roomId successfully");

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Staff removed from room successfully',
                'data' => [
                    'station_staff_id' => $stationStaffId,
                    'staff_name' => $info['staff_name'],
                    'previous_room_id' => $roomId
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit;

        case 'remove':
            // ✅ Delete staff from station
            $stationStaffId = intval($input['station_staff_id'] ?? 0);

            if ($stationStaffId <= 0) {
                throw new Exception('Invalid station_staff_id');
            }
            
            error_log("🗑️ Deleting staff - station_staff_id: $stationStaffId");

            // 1. Get staff info
            $infoStmt = $pdo->prepare("
                SELECT station_staff_id, staff_name 
                FROM station_staff 
                WHERE station_staff_id = :id
            ");
            $infoStmt->execute([':id' => $stationStaffId]);
            $info = $infoStmt->fetch(PDO::FETCH_ASSOC);

            if (!$info) {
                throw new Exception('Staff not found');
            }

            // 2. Delete staff
            $deleteStmt = $pdo->prepare("
                DELETE FROM station_staff 
                WHERE station_staff_id = :station_staff_id
            ");
            $deleteStmt->execute([':station_staff_id' => $stationStaffId]);

            error_log("✅ Staff deleted successfully");

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Staff deleted successfully',
                'data' => [
                    'station_staff_id' => $stationStaffId,
                    'staff_name' => $info['staff_name']
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit;

        default:
            error_log("❌ Unknown action: $action");
            throw new Exception("Invalid action: $action");
    }

} catch (Exception $e) {
    error_log("❌ Error in manage_room_staff: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
?>