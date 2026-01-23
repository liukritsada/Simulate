<?php
/**
 * ✅ update_staff_schedule.php (FIXED VERSION 2.0)
 * อัพเดต staff schedule (work time, break time)
 * 
 * ✅ FIX 2.0: เพิ่มการสนับสนุน break_start_time และ break_end_time
 * ✅ FIX 2.1: แก้ไข JSON response error
 * ✅ FIX 2.2: เพิ่ม validation และ error handling
 */

// ✅ OUTPUT BUFFERING FIRST
ob_end_clean();
ob_start();

// ✅ SUPPRESS ERROR OUTPUT
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// ✅ SET HEADERS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    ob_clean();
    http_response_code(200);
    exit();
}

try {
    // ✅ OUTPUT BUFFERING
    ob_clean();

    $host = '127.0.0.1';
    $dbname = 'hospitalstation';
    $username = 'sa';
    $password = '';

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ✅ ดึง JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input === null) {
        throw new Exception('Invalid JSON input');
    }

    error_log("=== UPDATE_STAFF_SCHEDULE START ===");
    error_log("📥 Input: " . json_encode($input));

    // ✅ Validate input
    $station_staff_id = intval($input['station_staff_id'] ?? 0);
    $work_start_time = $input['work_start_time'] ?? null;
    $work_end_time = $input['work_end_time'] ?? null;
    $break_start_time = $input['break_start_time'] ?? null;
    $break_end_time = $input['break_end_time'] ?? null;

    if (!$station_staff_id) {
        throw new Exception('Missing station_staff_id');
    }

    error_log("🔍 Updating staff ID: $station_staff_id");
    error_log("   work_start: $work_start_time, work_end: $work_end_time");
    error_log("   break_start: $break_start_time, break_end: $break_end_time");

    // ✅ Build UPDATE query dynamically
    $update_fields = [];
    $bind_params = [];

    if ($work_start_time !== null && $work_start_time !== '') {
        $update_fields[] = 'work_start_time = ?';
        $bind_params[] = $work_start_time;
    }

    if ($work_end_time !== null && $work_end_time !== '') {
        $update_fields[] = 'work_end_time = ?';
        $bind_params[] = $work_end_time;
    }

    // ✅ FIX 2.0: Support break times
    if ($break_start_time !== null && $break_start_time !== '') {
        $update_fields[] = 'break_start_time = ?';
        $bind_params[] = $break_start_time;
    }

    if ($break_end_time !== null && $break_end_time !== '') {
        $update_fields[] = 'break_end_time = ?';
        $bind_params[] = $break_end_time;
    }

    if (empty($update_fields)) {
        throw new Exception('No fields to update');
    }

    // ✅ Add updated_at timestamp
    $update_fields[] = 'updated_at = NOW()';

    // ✅ Build final query
    $update_query = "
        UPDATE station_staff 
        SET " . implode(', ', $update_fields) . "
        WHERE station_staff_id = ?
    ";

    $bind_params[] = $station_staff_id;

    error_log("📝 Query: " . $update_query);
    error_log("📊 Bind params: " . json_encode($bind_params));

    // ✅ Prepare and execute
    $stmt = $pdo->prepare($update_query);
    
    // ✅ Bind parameters with correct types
    foreach ($bind_params as $idx => $param) {
        $param_type = PDO::PARAM_STR;
        
        // Last parameter is station_staff_id (integer)
        if ($idx === count($bind_params) - 1) {
            $param_type = PDO::PARAM_INT;
        }
        
        $stmt->bindValue($idx + 1, $param, $param_type);
    }

    // ✅ Execute
    $result = $stmt->execute();

    if (!$result) {
        throw new Exception('Execute failed: ' . json_encode($stmt->errorInfo()));
    }

    $rows_affected = $stmt->rowCount();
    error_log("✅ Updated $rows_affected rows");

    // ✅ Fetch updated data
    $get_stmt = $pdo->prepare("
        SELECT 
            station_staff_id,
            staff_name,
            work_start_time,
            work_end_time,
            break_start_time,
            break_end_time,
            status
        FROM station_staff
        WHERE station_staff_id = ?
    ");

    $get_stmt->execute([$station_staff_id]);
    $updated_staff = $get_stmt->fetch(PDO::FETCH_ASSOC);

    error_log("📋 Updated staff: " . json_encode($updated_staff));
    error_log("=== UPDATE_STAFF_SCHEDULE END (SUCCESS) ===");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Staff schedule updated successfully',
        'data' => [
            'station_staff_id' => (int)$station_staff_id,
            'rows_affected' => $rows_affected,
            'staff' => $updated_staff,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ Error in update_staff_schedule: " . $e->getMessage());
    error_log("=== UPDATE_STAFF_SCHEDULE END (ERROR) ===");
    
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => 'UPDATE_SCHEDULE_ERROR',
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}
?>