<?php
/**
 * API: Add Staff Daily/OT
 * ✅ แก้ไข: บันทึก status พนักงานอัตโนมัติ
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
error_reporting(E_ALL);

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

    // ✅ รับข้อมูลจากไฟล์ Excel
    $stationId = intval($input['station_id'] ?? 0);
    $staffId = intval($input['staff_id'] ?? 0);
    $staffName = trim($input['staff_name'] ?? '');
    $workDate = trim($input['work_date'] ?? '');
    $workStartTime = trim($input['work_start_time'] ?? '08:00:00');
    $workEndTime = trim($input['work_end_time'] ?? '17:00:00');
    $breakStartTime = trim($input['break_start_time'] ?? '12:00:00');
    $breakEndTime = trim($input['break_end_time'] ?? '13:00:00');
    $staffType = trim($input['staff_type'] ?? 'Staff');

    // ✅ Validation
    if ($stationId <= 0 || $staffId <= 0 || empty($staffName) || empty($workDate)) {
        throw new Exception('Missing required fields: station_id, staff_id, staff_name, work_date');
    }

    // ✅ Validate time format (should be HH:MM:SS)
    if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $workStartTime)) {
        $workStartTime = substr($workStartTime, 0, 5) . ':00';
    }
    if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $workEndTime)) {
        $workEndTime = substr($workEndTime, 0, 5) . ':00';
    }
    if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $breakStartTime)) {
        $breakStartTime = substr($breakStartTime, 0, 5) . ':00';
    }
    if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $breakEndTime)) {
        $breakEndTime = substr($breakEndTime, 0, 5) . ':00';
    }

    // ✅ Convert work_date from yyyy-mm-dd to correct format if needed
    $workDate = date('Y-m-d', strtotime($workDate));

    // ✅ ดึง station_staff_id จาก station_staff table
    $checkStmt = $pdo->prepare("
        SELECT station_staff_id, is_active, status
        FROM station_staff 
        WHERE staff_id = :staff_id AND station_id = :station_id
        LIMIT 1
    ");
    $checkStmt->execute([
        ':staff_id' => $staffId,
        ':station_id' => $stationId
    ]);
    $existingStaff = $checkStmt->fetch(PDO::FETCH_ASSOC);

    // ✅ คำนวณ status ตามเวลาปัจจุบัน
    $currentTime = date('H:i:s');
    $determineStatus = function($currentTime, $workStartTime, $workEndTime, $breakStartTime, $breakEndTime) {
        // 🟡 รอเข้างาน (currentTime < workStart)
        if ($currentTime < $workStartTime) {
            return 'waiting_to_start';
        }
        // 🟠 พักเบรค (breakStart <= currentTime < breakEnd)
        elseif ($currentTime >= $breakStartTime && $currentTime < $breakEndTime) {
            return 'on_break';
        }
        // 🔵 ทำงาน (workStart <= currentTime < workEnd && room_id มี)
        elseif ($currentTime >= $workStartTime && $currentTime < $workEndTime) {
            return 'working';  // หรือ 'available' ขึ้นอยู่ว่าติด room_id หรือไม่
        }
        // 🟣 ทำ OT (currentTime >= workEnd && room_id มี)
        // ⚫ เลิกงาน (currentTime >= workEnd && room_id ไม่มี)
        elseif ($currentTime >= $workEndTime) {
            return 'offline';
        }
        // 🟢 ว่าง (workStart <= currentTime < workEnd && room_id ไม่มี)
        else {
            return 'available';
        }
    };

    $status = $determineStatus($currentTime, $workStartTime, $workEndTime, $breakStartTime, $breakEndTime);

    if ($existingStaff) {
        // ✅ Update existing staff in station_staff
        $updateStmt = $pdo->prepare("
            UPDATE station_staff 
            SET staff_name = :staff_name,
                work_date = :work_date,
                work_start_time = :work_start_time,
                work_end_time = :work_end_time,
                break_start_time = :break_start_time,
                break_end_time = :break_end_time,
                staff_type = :staff_type,
                is_active = 1,
                status = :status
            WHERE station_staff_id = :station_staff_id
        ");
        $updateStmt->execute([
            ':staff_name' => $staffName,
            ':work_date' => $workDate,
            ':work_start_time' => $workStartTime,
            ':work_end_time' => $workEndTime,
            ':break_start_time' => $breakStartTime,
            ':break_end_time' => $breakEndTime,
            ':staff_type' => $staffType,
            ':status' => $status,  // ✅ บันทึก status
            ':station_staff_id' => $existingStaff['station_staff_id']
        ]);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Staff updated successfully',
            'data' => [
                'station_staff_id' => $existingStaff['station_staff_id'],
                'staff_id' => $staffId,
                'staff_name' => $staffName,
                'status' => $status,  // ✅ คืน status
                'work_date' => $workDate,
                'work_start_time' => $workStartTime,
                'work_end_time' => $workEndTime,
                'break_start_time' => $breakStartTime,
                'break_end_time' => $breakEndTime
            ]
        ], JSON_UNESCAPED_UNICODE);
    } else {
        // ✅ Insert new staff in station_staff
        $insertStmt = $pdo->prepare("
            INSERT INTO station_staff (
                station_id,
                staff_id,
                staff_name,
                staff_type,
                work_date,
                work_start_time,
                work_end_time,
                break_start_time,
                break_end_time,
                is_active,
                status
            ) VALUES (
                :station_id,
                :staff_id,
                :staff_name,
                :staff_type,
                :work_date,
                :work_start_time,
                :work_end_time,
                :break_start_time,
                :break_end_time,
                1,
                :status
            )
        ");
        $insertStmt->execute([
            ':station_id' => $stationId,
            ':staff_id' => $staffId,
            ':staff_name' => $staffName,
            ':staff_type' => $staffType,
            ':work_date' => $workDate,
            ':work_start_time' => $workStartTime,
            ':work_end_time' => $workEndTime,
            ':break_start_time' => $breakStartTime,
            ':break_end_time' => $breakEndTime,
            ':status' => $status  // ✅ บันทึก status
        ]);

        $stationStaffId = $pdo->lastInsertId();

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Staff added successfully',
            'data' => [
                'station_staff_id' => $stationStaffId,
                'staff_id' => $staffId,
                'staff_name' => $staffName,
                'status' => $status,  // ✅ คืน status
                'work_date' => $workDate,
                'work_start_time' => $workStartTime,
                'work_end_time' => $workEndTime,
                'break_start_time' => $breakStartTime,
                'break_end_time' => $breakEndTime
            ]
        ], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}