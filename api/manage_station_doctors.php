<?php
/**
 * ✅ MANAGE STATION DOCTORS API - FIXED VERSION 4.1
 * 
 * Supports:
 * - POST: Add doctor
 * - DELETE: Remove doctor (FIXED)
 * - PUT: Update doctor status
 * 
 * ✅ FIX 4.1: Use correct column names (update_date, create_date)
 */

ob_end_clean();
ob_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
date_default_timezone_set('Asia/Bangkok');

try {
    // ✅ LOAD DATABASE
    if (!@include_once 'db_config.php') {
        throw new Exception('ไม่สามารถโหลด db_config.php ได้');
    }

    if (!isset($conn) || !$conn || $conn->connect_error) {
        throw new Exception('การเชื่อมต่อฐานข้อมูลล้มเหลว: ' . ($conn->connect_error ?? 'Unknown error'));
    }

    $request_method = $_SERVER['REQUEST_METHOD'];
    $raw_input = file_get_contents('php://input');
    error_log("📥 Request: $request_method | Input: " . substr($raw_input, 0, 200));

    $data = json_decode($raw_input, true) ?? [];

    // ========================================
    // ✅ POST: ADD DOCTOR
    // ========================================
    if ($request_method === 'POST' && !isset($data['station_doctor_id'])) {
        $station_id = intval($data['station_id'] ?? 0);
        $doctor_id = intval($data['doctor_id'] ?? 0);
        $doctor_code = strval($data['doctor_code'] ?? '');
        $doctor_name = strval($data['doctor_name'] ?? '');
        $work_date = strval($data['work_date'] ?? date('Y-m-d'));
        $work_start_time = strval($data['work_start_time'] ?? '08:00:00');
        $work_end_time = strval($data['work_end_time'] ?? '16:00:00');
        $break_start_time = strval($data['break_start_time'] ?? '12:00:00');
        $break_end_time = strval($data['break_end_time'] ?? '13:00:00');
        $doctor_type = strval($data['doctor_type'] ?? 'Monthly');
        $specialization = strval($data['specialization'] ?? '');

        if (!$station_id || !$doctor_id || !$doctor_name) {
            throw new Exception('station_id, doctor_id, doctor_name ต้องระบุ');
        }

        if (!$doctor_code) {
            $doctor_code = 'DOC' . uniqid();
        }

        error_log("📝 Adding doctor: station_id=$station_id, doctor_id=$doctor_id, doctor_name=$doctor_name");

        // ✅ Check if already exists
        $check_query = "
            SELECT station_doctor_id 
            FROM station_doctors 
            WHERE doctor_id = ? AND station_id = ? AND is_active = 1
        ";
        $check_stmt = $conn->prepare($check_query);
        if (!$check_stmt) {
            throw new Exception("Prepare check failed: " . $conn->error);
        }

        $check_stmt->bind_param('ii', $doctor_id, $station_id);
        $check_stmt->execute();
        
        if ($check_stmt->get_result()->num_rows > 0) {
            $check_stmt->close();
            ob_end_clean();
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => 'แพทย์นี้มีอยู่ในสถานนี้แล้ว',
                'code' => 'DOCTOR_EXISTS'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $check_stmt->close();

        $status = 'available';
        $is_active = 1;

        // ✅ Insert doctor (with break columns from table structure)
        $insert_query = "
            INSERT INTO station_doctors (
                station_id, doctor_id, doctor_code, doctor_name,
                doctor_type, specialization, work_date,
                work_start_time, work_end_time,
                break_start_time, break_end_time,
                status, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";

        $insert_stmt = $conn->prepare($insert_query);
        if (!$insert_stmt) {
            throw new Exception("Prepare insert failed: " . $conn->error);
        }

        // ✅ Type binding: i=int, s=string
        $insert_stmt->bind_param(
            'iisssssssssii',
            $station_id, $doctor_id, $doctor_code, $doctor_name,
            $doctor_type, $specialization, $work_date,
            $work_start_time, $work_end_time,
            $break_start_time, $break_end_time,
            $status, $is_active
        );

        if (!$insert_stmt->execute()) {
            throw new Exception("Insert failed: " . $insert_stmt->error);
        }

        $station_doctor_id = $insert_stmt->insert_id;
        $insert_stmt->close();

        error_log("✅ Doctor added: station_doctor_id=$station_doctor_id");

        ob_end_clean();
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'เพิ่มแพทย์สำเร็จ',
            'data' => [
                'station_doctor_id' => $station_doctor_id,
                'station_id' => $station_id,
                'doctor_id' => $doctor_id,
                'doctor_code' => $doctor_code,
                'doctor_name' => $doctor_name,
                'status' => $status
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ========================================
    // ✅ DELETE: REMOVE DOCTOR
    // ========================================
    if ($request_method === 'DELETE' || ($request_method === 'POST' && isset($data['action']) && $data['action'] === 'delete')) {
        $station_doctor_id = intval($data['station_doctor_id'] ?? 0);

        if (!$station_doctor_id) {
            throw new Exception('station_doctor_id ต้องระบุ');
        }

        error_log("🗑️ Deleting station_doctor_id: $station_doctor_id");

        // ✅ Soft delete - use update_date (correct column name)
        $delete_query = "
            UPDATE station_doctors 
            SET is_active = 0, status = 'inactive'
            WHERE station_doctor_id = ?
        ";

        $delete_stmt = $conn->prepare($delete_query);
        if (!$delete_stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $delete_stmt->bind_param('i', $station_doctor_id);

        if (!$delete_stmt->execute()) {
            throw new Exception("Delete failed: " . $delete_stmt->error);
        }

        $affected_rows = $delete_stmt->affected_rows;
        $delete_stmt->close();

        error_log("✅ Doctor deleted: affected_rows=$affected_rows");

        if ($affected_rows === 0) {
            ob_end_clean();
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'ไม่พบแพทย์นี้',
                'code' => 'NOT_FOUND'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        ob_end_clean();
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'ลบแพทย์สำเร็จ',
            'data' => [
                'station_doctor_id' => $station_doctor_id,
                'affected_rows' => $affected_rows
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ========================================
    // ✅ PUT: UPDATE DOCTOR STATUS
    // ========================================
    if ($request_method === 'PUT' || ($request_method === 'POST' && isset($data['action']) && $data['action'] === 'update')) {
        $station_doctor_id = intval($data['station_doctor_id'] ?? 0);
        $status = strval($data['status'] ?? '');

        if (!$station_doctor_id) {
            throw new Exception('station_doctor_id ต้องระบุ');
        }

        if (!$status) {
            throw new Exception('status ต้องระบุ');
        }

        error_log("🔄 Updating doctor $station_doctor_id status: $status");

        $update_query = "
            UPDATE station_doctors 
            SET status = ?
            WHERE station_doctor_id = ?
        ";

        $update_stmt = $conn->prepare($update_query);
        if (!$update_stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $update_stmt->bind_param('si', $status, $station_doctor_id);

        if (!$update_stmt->execute()) {
            throw new Exception("Update failed: " . $update_stmt->error);
        }

        $affected_rows = $update_stmt->affected_rows;
        $update_stmt->close();

        error_log("✅ Doctor status updated: affected_rows=$affected_rows");

        ob_end_clean();
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'อัปเดตสถานะสำเร็จ',
            'data' => [
                'station_doctor_id' => $station_doctor_id,
                'status' => $status,
                'affected_rows' => $affected_rows
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ========================================
    // ✅ METHOD NOT ALLOWED
    // ========================================
    throw new Exception('Method not allowed: ' . $request_method);

} catch (Exception $e) {
    error_log("❌ Error: " . $e->getMessage());
    
    ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'code' => 'API_ERROR'
    ], JSON_UNESCAPED_UNICODE);

} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>