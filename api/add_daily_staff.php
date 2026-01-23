<?php
/**
 * ✅ API: add_daily_staff.php (FIXED)
 * เพิ่มพนักงาน วัน/OT ลงใน station_staff
 * ✅ ลบ position field (ไม่มีใน table)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/db_config.php';

try {
    if (!isset($conn) || !$conn) {
        throw new Exception('Database connection not established');
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    // ✅ POST - Add daily staff
    if ($method === 'POST') {
        $station_id = intval($input['station_id'] ?? 0);
        $staff_id = $input['staff_id'] ?? null;
        $staff_name = $input['staff_name'] ?? null;
        $staff_type = $input['staff_type'] ?? null;
        $work_start_time = $input['work_start_time'] ?? null;
        $work_end_time = $input['work_end_time'] ?? null;
        $break_start_time = $input['break_start_time'] ?? null;
        $break_end_time = $input['break_end_time'] ?? null;
        
        // ✅ ตรวจสอบข้อมูลที่จำเป็น
        if (!$station_id || !$staff_id || !$staff_name || !$staff_type) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Missing required fields: station_id, staff_id, staff_name, staff_type'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // ✅ ตรวจสอบ Station มีอยู่
        $station_check = $conn->prepare("SELECT station_id FROM stations WHERE station_id = ?");
        $station_check->bind_param('i', $station_id);
        $station_check->execute();
        $station_result = $station_check->get_result();
        if ($station_result->num_rows === 0) {
            $station_check->close();
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Station not found'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $station_check->close();
        
        // ✅ ตรวจสอบว่าพนักงานนี้มีอยู่แล้วหรือไม่
        $duplicate_check = $conn->prepare("
            SELECT station_staff_id FROM station_staff 
            WHERE station_id = ? AND staff_id = ? AND DATE(work_date) = CURDATE()
        ");
        $duplicate_check->bind_param('ii', $station_id, $staff_id);
        $duplicate_check->execute();
        $duplicate_result = $duplicate_check->get_result();
        if ($duplicate_result->num_rows > 0) {
            $duplicate_check->close();
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Staff already assigned to this station today'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $duplicate_check->close();
        
        // ✅ Insert ลง station_staff (ลบ position ออก)
        $insert_stmt = $conn->prepare("
            INSERT INTO station_staff (
                station_id,
                staff_id,
                staff_name,
                staff_type,
                work_start_time,
                work_end_time,
                break_start_time,
                break_end_time,
                is_active,
                status,
                work_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'waiting_to_start', CURDATE())
        ");
        
        if (!$insert_stmt) {
            throw new Exception('Prepare error: ' . $conn->error);
        }
        
        $insert_stmt->bind_param(
            'iissssss',
            $station_id,
            $staff_id,
            $staff_name,
            $staff_type,
            $work_start_time,
            $work_end_time,
            $break_start_time,
            $break_end_time
        );
        
        if (!$insert_stmt->execute()) {
            throw new Exception('Insert error: ' . $insert_stmt->error);
        }
        
        $station_staff_id = $insert_stmt->insert_id;
        $insert_stmt->close();
        
        error_log("✅ Added daily staff: staff_id=$staff_id, station_staff_id=$station_staff_id");
        
        // ✅ Get inserted data
        $get_stmt = $conn->prepare("
            SELECT 
                station_staff_id,
                station_id,
                staff_id,
                staff_name,
                staff_type,
                work_start_time,
                work_end_time,
                break_start_time,
                break_end_time,
                is_active,
                status,
                work_date
            FROM station_staff
            WHERE station_staff_id = ?
        ");
        
        $get_stmt->bind_param('i', $station_staff_id);
        $get_stmt->execute();
        $result = $get_stmt->get_result();
        $added_staff = $result->fetch_assoc();
        $get_stmt->close();
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Daily staff added successfully',
            'data' => $added_staff
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    
} catch (Exception $e) {
    error_log('add_daily_staff.php ERROR: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => 'ADD_STAFF_ERROR'
    ], JSON_UNESCAPED_UNICODE);
}

$conn->close();
?>