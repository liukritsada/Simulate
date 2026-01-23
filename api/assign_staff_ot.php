<?php
/**
 * ⏰ API: Assign Staff OT - FIXED
 * บันทึก OT ลง station_staff (UPDATE status='overtime', ot_start_time, ot_end_time, work_end_time)
 * 
 * ✅ FIX: Auto-update work_end_time = ot_end_time
 * 
 * POST: /hospital/api/assign_staff_ot.php
 * Input JSON:
 * {
 *   "station_staff_id": 9,
 *   "ot_start_time": "17:00:00",
 *   "ot_end_time": "19:00:00"
 * }
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
    // ========================================
    // 1️⃣ GET INPUT
    // ========================================
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    $station_staff_id = $data['station_staff_id'] ?? null;
    $ot_start_time = $data['ot_start_time'] ?? null;
    $ot_end_time = $data['ot_end_time'] ?? null;

    // ========================================
    // 2️⃣ VALIDATE INPUT
    // ========================================
    if (!$station_staff_id || !$ot_start_time || !$ot_end_time) {
        ob_clean();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: station_staff_id, ot_start_time, ot_end_time',
            'error_code' => 'INVALID_INPUT'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ========================================
    // 3️⃣ CONNECT DATABASE (Direct mysqli)
    // ========================================
    $conn = new mysqli(
        '127.0.0.1',      // host
        'sa',             // username
        '',               // password
        'hospitalstation', // database
        3306              // port
    );

    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }

    $conn->set_charset('utf8mb4');

    // ========================================
    // 4️⃣ CHECK STAFF EXISTS
    // ========================================
    $check_query = "SELECT station_staff_id, staff_name, staff_type, work_end_time
                   FROM station_staff 
                   WHERE station_staff_id = ?";
    
    $stmt = $conn->prepare($check_query);
    if (!$stmt) {
        throw new Exception('Prepare error: ' . $conn->error);
    }

    $stmt->bind_param('i', $station_staff_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $staff = $result->fetch_assoc();
    $stmt->close();
    
    if (!$staff) {
        ob_clean();
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Staff not found',
            'error_code' => 'STAFF_NOT_FOUND'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ========================================
    // 5️⃣ UPDATE station_staff - SET OT INFO + work_end_time
    // ========================================
    $ot_date = date('Y-m-d');
    
    // ✅ IMPORTANT: Also update work_end_time = ot_end_time
    $update_query = "UPDATE station_staff 
                    SET status = 'overtime',
                        ot_start_time = ?,
                        ot_end_time = ?,
                        work_end_time = ?,
                        ot_date = ?,
                        updated_at = NOW()
                    WHERE station_staff_id = ?";
    
    $stmt = $conn->prepare($update_query);
    if (!$stmt) {
        throw new Exception('Prepare error: ' . $conn->error);
    }

    $stmt->bind_param('ssssi', $ot_start_time, $ot_end_time, $ot_end_time, $ot_date, $station_staff_id);
    
    if (!$stmt->execute()) {
        throw new Exception('Execute error: ' . $stmt->error);
    }

    $stmt->close();

    // ========================================
    // 6️⃣ RETURN SUCCESS RESPONSE
    // ========================================
    
    // ✅ Clean buffer before response
    ob_clean();

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => '✅ OT assigned successfully',
        'data' => [
            'station_staff_id' => (int)$station_staff_id,
            'staff_name' => $staff['staff_name'],
            'staff_type' => $staff['staff_type'],
            'ot_start_time' => $ot_start_time,
            'ot_end_time' => $ot_end_time,
            'work_end_time' => $ot_end_time,  // ✅ Now shows updated end time
            'ot_date' => $ot_date,
            'status' => 'overtime'
        ]
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => 'ASSIGN_OT_ERROR'
    ], JSON_UNESCAPED_UNICODE);
}
?>