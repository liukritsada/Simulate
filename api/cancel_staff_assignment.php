<?php
/**
 * API: Cancel Staff Assignment
 * ยกเลิกการบันทึกพนักงานรายวัน
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

    // ✅ รับ JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    $stationStaffId = intval($input['station_staff_id'] ?? 0);

    if ($stationStaffId <= 0) {
        throw new Exception('Invalid station_staff_id');
    }

    // ✅ ตรวจสอบว่าเป็นวันนี้
    $checkStmt = $pdo->prepare("
        SELECT station_staff_id, staff_name, work_date 
        FROM station_staff 
        WHERE station_staff_id = :id 
        AND work_date = CURDATE()
    ");
    $checkStmt->execute([':id' => $stationStaffId]);
    $record = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$record) {
        throw new Exception('ไม่พบการบันทึกสำหรับวันนี้');
    }

    // ✅ ลบการบันทึก
    $deleteStmt = $pdo->prepare("
        DELETE FROM station_staff 
        WHERE station_staff_id = :id 
        AND work_date = CURDATE()
    ");
    $deleteStmt->execute([':id' => $stationStaffId]);

    if ($deleteStmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => "ยกเลิกการบันทึก {$record['staff_name']} สำเร็จ",
            'deleted_record' => $record
        ], JSON_UNESCAPED_UNICODE);
    } else {
        throw new Exception('ไม่สามารถลบได้');
    }

} catch (PDOException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => "Database Error: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>