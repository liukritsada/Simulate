<?php
/**
 * fix_staff_import.php
 * แก้ไขข้อมูลพนักงานที่ import เข้ามา
 * ตรวจสอบและอัพเดท work_date และ is_active
 */

header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    require_once __DIR__ . '/db_config.php';
    
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Database connection error');
    }
    
    $station_id = intval($_GET['station_id'] ?? 77);
    $current_date = date('Y-m-d');
    
    // ✅ Step 1: หาข้อมูลที่ยังไม่มี work_date
    $sql_check = "
        SELECT COUNT(*) as missing_date_count
        FROM station_staff
        WHERE station_id = ?
        AND (work_date IS NULL OR work_date = '0000-00-00')
    ";
    
    $stmt_check = $conn->prepare($sql_check);
    $stmt_check->bind_param('i', $station_id);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();
    $missing = $result_check->fetch_assoc();
    $stmt_check->close();
    
    // ✅ Step 2: อัพเดท work_date เป็นวันปัจจุบัน
    $sql_update_date = "
        UPDATE station_staff
        SET work_date = ?
        WHERE station_id = ?
        AND (work_date IS NULL OR work_date = '0000-00-00')
    ";
    
    $stmt_update_date = $conn->prepare($sql_update_date);
    $stmt_update_date->bind_param('si', $current_date, $station_id);
    $stmt_update_date->execute();
    $affected_date = $stmt_update_date->affected_rows;
    $stmt_update_date->close();
    
    // ✅ Step 3: อัพเดท is_active = 1
    $sql_update_active = "
        UPDATE station_staff
        SET is_active = 1
        WHERE station_id = ?
        AND (is_active = 0 OR is_active IS NULL)
    ";
    
    $stmt_update_active = $conn->prepare($sql_update_active);
    $stmt_update_active->bind_param('i', $station_id);
    $stmt_update_active->execute();
    $affected_active = $stmt_update_active->affected_rows;
    $stmt_update_active->close();
    
    // ✅ Step 4: ดึงข้อมูลหลังอัพเดท
    $sql_after = "
        SELECT COUNT(*) as total_staff
        FROM station_staff
        WHERE station_id = ?
        AND work_date = ?
        AND is_active = 1
    ";
    
    $stmt_after = $conn->prepare($sql_after);
    $stmt_after->bind_param('is', $station_id, $current_date);
    $stmt_after->execute();
    $result_after = $stmt_after->get_result();
    $after = $result_after->fetch_assoc();
    $stmt_after->close();
    
    $conn->close();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'แก้ไขข้อมูลสำเร็จ',
        'data' => [
            'station_id' => $station_id,
            'current_date' => $current_date,
            'before' => [
                'missing_work_date' => $missing['missing_date_count']
            ],
            'fixed' => [
                'updated_work_date' => $affected_date,
                'updated_is_active' => $affected_active
            ],
            'after' => [
                'total_visible_staff' => $after['total_staff']
            ]
        ]
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => 'FIX_ERROR'
    ], JSON_UNESCAPED_UNICODE);
}
?>