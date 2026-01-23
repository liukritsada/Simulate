<?php
/**
 * ✅ FILE 4: update_staff_status.php (IMPROVED)
 * Bulk update staff status (ใช้เฉพาะ station_staff)
 * ✅ ตรวจสอบ JSON และเพิ่ม debug logging
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json; charset=utf-8');

try {
    // ✅ 1. ดึงข้อมูล JSON จาก POST body
    $json_input = file_get_contents('php://input');
    
    // ✅ DEBUG: บันทึก raw input
    error_log("=== UPDATE_STAFF_STATUS START ===");
    error_log("📥 Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
    error_log("📥 Content-Length: " . ($_SERVER['CONTENT_LENGTH'] ?? 'not set'));
    error_log("📥 Raw JSON length: " . strlen($json_input));
    error_log("📥 Raw JSON input: " . substr($json_input, 0, 1000));
    
    // ✅ 2. Parse JSON
    $input = json_decode($json_input, true);
    
    if ($input === null) {
        error_log("❌ JSON decode error: " . json_last_error_msg());
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }
    
    // ✅ 3. ตรวจสอบว่า input เป็น array
    if (!is_array($input)) {
        error_log("❌ Input is not array, type: " . gettype($input));
        throw new Exception('Input must be JSON object');
    }
    
    // ✅ DEBUG: บันทึกสิ่งที่ decode ได้
    error_log("✅ Decoded input keys: " . implode(', ', array_keys($input)));
    error_log("✅ Full decoded input: " . json_encode($input));
    
    // ✅ 4. ดึงค่าต่างๆ
    $station_id = intval($input['station_id'] ?? 0);
    $work_date = $input['work_date'] ?? date('Y-m-d');
    $staff_updates = $input['staff_updates'] ?? [];
    $current_time = $input['current_time'] ?? date('H:i:s');
    
    // ✅ DEBUG: บันทึก parameters
    error_log("📊 Parsed parameters:");
    error_log("   station_id: $station_id (type: " . gettype($station_id) . ")");
    error_log("   work_date: $work_date");
    error_log("   current_time: $current_time");
    error_log("   staff_updates type: " . gettype($staff_updates));
    error_log("   staff_updates count: " . (is_array($staff_updates) ? count($staff_updates) : 'NOT ARRAY'));
    
    if (is_array($staff_updates) && count($staff_updates) > 0) {
        error_log("   staff_updates[0]: " . json_encode($staff_updates[0]));
    }
    
    // ✅ 5. ตรวจสอบ station_id
    if (!$station_id) {
        throw new Exception('Missing station_id');
    }
    
    // ✅ 6. ตรวจสอบ staff_updates
    if (!is_array($staff_updates) || empty($staff_updates)) {
        throw new Exception('staff_updates is required and must be non-empty array. Received: ' . json_encode($staff_updates));
    }
    
    // ✅ 7. เชื่อมต่อ database
    require_once __DIR__ . '/db_config.php';
    
    if (!isset($conn) || !$conn || $conn->connect_error) {
        throw new Exception('Database connection error');
    }
    
    $update_count = 0;
    $updates = [];
    
    // ✅ 8. Prepare statement
    $update_stmt = $conn->prepare("
        UPDATE station_staff 
        SET status = ? 
        WHERE station_staff_id = ? AND work_date = ?
    ");
    
    if (!$update_stmt) {
        throw new Exception('Prepare error: ' . $conn->error);
    }
    
    // ✅ 9. Update each staff
    foreach ($staff_updates as $update) {
        try {
            $station_staff_id = intval($update['station_staff_id']);
            $new_status = trim($update['status']);
            $staff_name = $update['staff_name'] ?? 'Unknown';
            
            error_log("🔄 Processing: ID=$station_staff_id, Name=$staff_name, NewStatus=$new_status");
            
            // Get old status
            $check_stmt = $conn->prepare("
                SELECT status FROM station_staff 
                WHERE station_staff_id = ? AND work_date = ?
            ");
            
            if (!$check_stmt) {
                throw new Exception('Check prepare error: ' . $conn->error);
            }
            
            $check_stmt->bind_param('is', $station_staff_id, $work_date);
            $check_stmt->execute();
            $result = $check_stmt->get_result();
            $row = $result->fetch_assoc();
            $check_stmt->close();
            
            $old_status = $row ? $row['status'] : 'unknown';
            
            error_log("   OldStatus: $old_status");
            
            // Update only if changed
            if ($new_status !== $old_status) {
                $update_stmt->bind_param('sis', $new_status, $station_staff_id, $work_date);
                
                if ($update_stmt->execute()) {
                    $update_count++;
                    $updates[] = [
                        'station_staff_id' => $station_staff_id,
                        'staff_name' => $staff_name,
                        'old_status' => $old_status,
                        'new_status' => $new_status
                    ];
                    
                    error_log("✅ Updated: {$staff_name} ({$station_staff_id}): {$old_status} → {$new_status}");
                } else {
                    error_log("❌ Execute failed: " . $update_stmt->error);
                }
            } else {
                error_log("⏭️  No change needed: $staff_name");
            }
            
        } catch (Exception $e) {
            error_log("❌ Error processing staff {$station_staff_id}: " . $e->getMessage());
        }
    }
    
    $update_stmt->close();
    
    error_log("📊 Summary: Updated $update_count staff records");
    error_log("=== UPDATE_STAFF_STATUS END (SUCCESS) ===");
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Updated {$update_count} staff status",
        'data' => [
            'station_id' => $station_id,
            'work_date' => $work_date,
            'updated_count' => $update_count,
            'updates' => $updates,
            'timestamp' => date('c')
        ]
    ], JSON_UNESCAPED_UNICODE);
    
    $conn->close();
    
} catch (Exception $e) {
    error_log('❌ update_staff_status.php ERROR: ' . $e->getMessage());
    error_log("=== UPDATE_STAFF_STATUS END (ERROR) ===");
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => 'UPDATE_STATUS_ERROR',
        'timestamp' => date('c')
    ], JSON_UNESCAPED_UNICODE);
}
?>