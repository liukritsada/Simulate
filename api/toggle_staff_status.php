
<?php
/**
 * ✅ FILE 2: toggle_staff_status.php
 * Toggle staff active/inactive (ใช้เฉพาะ station_staff)
 */

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db_config.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $station_staff_id = intval($input['station_staff_id'] ?? 0);
    
    if (!$station_staff_id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'station_staff_id is required'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    if (!isset($conn) || !$conn) {
        throw new Exception('Database connection not established');
    }
    
    // Get current status
    $stmt = $conn->prepare("
        SELECT is_active, staff_name 
        FROM station_staff 
        WHERE station_staff_id = ?
    ");
    
    if (!$stmt) {
        throw new Exception('Prepare error: ' . $conn->error);
    }
    
    $stmt->bind_param('i', $station_staff_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $staff = $result->fetch_assoc();
    $stmt->close();
    
    if (!$staff) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Staff not found with ID: ' . $station_staff_id
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $current_status = $staff['is_active'];
    $new_status = $current_status == 1 ? 0 : 1;
    $status_text = $new_status == 1 ? 'available' : 'offline';
    
    // Update station_staff
    $update_stmt = $conn->prepare("
        UPDATE station_staff 
        SET is_active = ?,
            status = ?
        WHERE station_staff_id = ?
    ");
    
    if (!$update_stmt) {
        throw new Exception('Update prepare error: ' . $conn->error);
    }
    
    $update_stmt->bind_param('isi', $new_status, $status_text, $station_staff_id);
    
    if (!$update_stmt->execute()) {
        throw new Exception('Update execute error: ' . $update_stmt->error);
    }
    
    error_log("✅ Toggled staff ID: $station_staff_id -> is_active: $new_status");
    
    $update_stmt->close();
    
    $message = $new_status == 1 ? 'Staff Activated successfully' : 'Staff Deactivated successfully';
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => [
            'station_staff_id' => $station_staff_id,
            'staff_name' => $staff['staff_name'],
            'is_active' => $new_status,
            'status' => $status_text
        ]
    ], JSON_UNESCAPED_UNICODE);
    
    $conn->close();

} catch (Exception $e) {
    error_log('toggle_staff_status.php ERROR: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => 'TOGGLE_ERROR'
    ], JSON_UNESCAPED_UNICODE);
}
?>