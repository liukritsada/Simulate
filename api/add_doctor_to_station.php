<?php
/**
 * ✅ ADD DOCTOR TO STATION API - FIXED VERSION 4.0
 * POST /hospital/api/add_doctor_to_station.php
 * 
 * ✅ FIX 4.0: doctor_id as INTEGER (per database schema)
 * ✅ FIX 4.1: Correct type binding 'isissssssssi'
 */

// ✅ CLEAR OUTPUT BUFFER
ob_end_clean();
ob_start();

// ✅ SET HEADERS FIRST
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

// ✅ ERROR HANDLING
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
date_default_timezone_set('Asia/Bangkok');

try {
    // ========================================
    // ✅ LOAD CONFIG & DATABASE
    // ========================================

    if (!@include_once 'db_config.php') {
        throw new Exception('ไม่สามารถโหลดไฟล์ db_config.php ได้');
    }

    if (!isset($conn) || !$conn || $conn->connect_error) {
        throw new Exception('การเชื่อมต่อฐานข้อมูลล้มเหลว: ' . ($conn->connect_error ?? 'Unknown error'));
    }

    // ========================================
    // ✅ GET REQUEST DATA
    // ========================================

    $request_method = $_SERVER['REQUEST_METHOD'];

    if ($request_method !== 'POST') {
        http_response_code(405);
        throw new Exception('ใช้ POST method เท่านั้น');
    }

    $raw_input = file_get_contents('php://input');
    error_log("📥 Raw input: " . substr($raw_input, 0, 500));

    $data = json_decode($raw_input, true);

    if ($data === null) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }

    // ✅ FIX 4.0: doctor_id as INTEGER (per database schema)
    $station_id = intval($data['station_id'] ?? 0);
    $doctor_id = intval($data['doctor_id'] ?? 0);  // ✅ INTEGER
    $doctor_code = strval($data['doctor_code'] ?? '');
    $doctor_name = strval($data['doctor_name'] ?? '');
    $work_date = strval($data['work_date'] ?? date('Y-m-d'));
    $work_start_time = strval($data['work_start_time'] ?? '08:00:00');
    $work_end_time = strval($data['work_end_time'] ?? '16:00:00');
    $break_start_time = strval($data['break_start_time'] ?? '12:00:00');
    $break_end_time = strval($data['break_end_time'] ?? '13:00:00');
    $doctor_type = strval($data['doctor_type'] ?? 'Monthly');
    $specialization = strval($data['specialization'] ?? '');

    error_log("📊 Parsed data: station_id=$station_id, doctor_id=$doctor_id, doctor_name=$doctor_name");

    // ✅ Validation
    if (!$station_id) {
        throw new Exception('station_id ต้องระบุ');
    }

    if (!$doctor_id || !$doctor_name) {
        throw new Exception('doctor_id และ doctor_name ต้องระบุ');
    }

    // ✅ Generate doctor_code ถ้าไม่มี
    if (!$doctor_code) {
        $doctor_code = 'DOC' . uniqid();
    }

    // ========================================
    // ✅ BEGIN TRANSACTION
    // ========================================

    $conn->begin_transaction();
    error_log("🔄 Transaction started");

    // ========================================
    // ✅ STEP 1: Check if doctor already exists
    // ========================================

    $check_query = "
        SELECT station_doctor_id 
        FROM station_doctors 
        WHERE doctor_id = ? 
        AND station_id = ?
        AND is_active = 1
        LIMIT 1
    ";

    $check_stmt = $conn->prepare($check_query);
    if (!$check_stmt) {
        throw new Exception("Prepare check failed: " . $conn->error);
    }

    $check_stmt->bind_param('ii', $doctor_id, $station_id);
    
    if (!$check_stmt->execute()) {
        throw new Exception("Execute check failed: " . $check_stmt->error);
    }

    $check_result = $check_stmt->get_result();
    error_log("✅ Check result rows: " . $check_result->num_rows);
    
    if ($check_result->num_rows > 0) {
        $conn->rollback();
        ob_end_clean();
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'แพทย์นี้มีอยู่ในสถานีแล้ว',
            'code' => 'DOCTOR_EXISTS'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $check_stmt->close();

    // ========================================
    // ✅ STEP 2: Check if break_* columns exist
    // ========================================

    $columns_check = "DESCRIBE station_doctors";
    $columns_result = $conn->query($columns_check);
    
    $has_break_columns = false;
    if ($columns_result) {
        while ($row = $columns_result->fetch_assoc()) {
            if ($row['Field'] === 'break_start_time' || $row['Field'] === 'break_end_time') {
                $has_break_columns = true;
                break;
            }
        }
    }

    error_log("🔍 Has break columns: " . ($has_break_columns ? 'YES' : 'NO'));

    // ========================================
    // ✅ STEP 3: Insert doctor (with break columns)
    // ========================================

    $status = 'available';
    $is_active = 1;

    // ✅ FIX 4.0: Full insert with break times
    $insert_query = "
        INSERT INTO station_doctors (
            station_id,
            doctor_id,
            doctor_code,
            doctor_name,
            doctor_type,
            specialization,
            work_date,
            work_start_time,
            work_end_time,
            break_start_time,
            break_end_time,
            status,
            is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";

    $insert_stmt = $conn->prepare($insert_query);
    if (!$insert_stmt) {
        throw new Exception("Prepare insert failed: " . $conn->error);
    }

    // ✅ FIX 4.1: Correct type binding
    // i = integer, s = string
    // station_id(i), doctor_id(i), doctor_code(s), doctor_name(s),
    // doctor_type(s), specialization(s), work_date(s), work_start_time(s),
    // work_end_time(s), break_start_time(s), break_end_time(s), status(s), is_active(i)
    $insert_stmt->bind_param(
        'iissssssssssi',
        $station_id,
        $doctor_id,
        $doctor_code,
        $doctor_name,
        $doctor_type,
        $specialization,
        $work_date,
        $work_start_time,
        $work_end_time,
        $break_start_time,
        $break_end_time,
        $status,
        $is_active
    );

    if (!$insert_stmt->execute()) {
        throw new Exception("Execute insert failed: " . $insert_stmt->error);
    }

    $station_doctor_id = $insert_stmt->insert_id;
    error_log("✅ Inserted doctor ID: $station_doctor_id");
    $insert_stmt->close();

    // ========================================
    // ✅ STEP 4: Commit transaction
    // ========================================

    $conn->commit();
    error_log("✅ Transaction committed");

    // ========================================
    // ✅ SUCCESS RESPONSE
    // ========================================

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
            'doctor_type' => $doctor_type,
            'specialization' => $specialization,
            'work_date' => $work_date,
            'work_start_time' => $work_start_time,
            'work_end_time' => $work_end_time,
            'break_start_time' => $break_start_time,
            'break_end_time' => $break_end_time,
            'status' => $status
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    // ========================================
    // ✅ ERROR HANDLING
    // ========================================

    error_log("❌ Error: " . $e->getMessage());

    if (isset($conn)) {
        try {
            $conn->rollback();
            error_log("⏮️ Transaction rolled back");
        } catch (Exception $rollback_e) {
            error_log("⚠️ Rollback error: " . $rollback_e->getMessage());
        }
    }

    ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'code' => 'API_ERROR'
    ], JSON_UNESCAPED_UNICODE);

} finally {
    // ========================================
    // ✅ CLEANUP
    // ========================================

    if (isset($conn)) {
        $conn->close();
    }
}
?>