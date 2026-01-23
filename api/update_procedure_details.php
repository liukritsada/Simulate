<?php
/**
 * API: Update Procedure Details - FIXED
 * อัปเดตรายละเอียดหัตถการ (เวลา, พนักงาน, เครื่องมือ, เป้าหมายเวลา)
 * 
 * ✅ FIXED: เพิ่ม time_target ในการ UPDATE
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
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

    // รับข้อมูลจาก request
    $input = json_decode(file_get_contents('php://input'), true);

    $procedureId = $input['procedure_id'] ?? null;
    $stationId = $input['station_id'] ?? null;
    $waitTime = $input['wait_time'] ?? null;
    $procedureTime = $input['procedure_time'] ?? null;
    $staffRequired = $input['staff_required'] ?? null;
    $equipmentRequired = $input['equipment_required'] ?? null;
    $timeTarget = $input['time_target'] ?? null;  // ✅ เพิ่ม time_target

    // ✅ ตรวจสอบข้อมูล
    if (!$procedureId || !$stationId) {
        throw new Exception('procedure_id และ station_id จำเป็น');
    }

    if ($waitTime === null || $procedureTime === null || $staffRequired === null || $equipmentRequired === null) {
        throw new Exception('wait_time, procedure_time, staff_required, และ equipment_required จำเป็น');
    }

    if ($waitTime < 0 || $procedureTime < 1) {
        throw new Exception('เวลารอต้องมากกว่าหรือเท่ากับ 0 และเวลาทำหัตถการต้องมากกว่า 0');
    }
    
    if ($staffRequired < 0) {
        throw new Exception('จำนวนพนักงานที่ต้องการต้องมากกว่าหรือเท่ากับ 0');
    }

    // แปลงค่า boolean/string เป็น int สำหรับฐานข้อมูล
    $equipmentRequired = filter_var($equipmentRequired, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
    $timeTarget = intval($timeTarget ?? 0);  // ✅ แปลง time_target

    error_log("📍 Updating procedure: ID=$procedureId, Station=$stationId, Wait=$waitTime, Proc=$procedureTime, StaffReq=$staffRequired, EquipReq=$equipmentRequired, TimeTarget=$timeTarget");

    // ✅ อัปเดต station_procedures (เพิ่ม time_target)
    $stmt = $pdo->prepare("
        UPDATE station_procedures 
        SET 
            wait_time = :wait_time,
            procedure_time = :procedure_time,
            staff_required = :staff_required,
            equipment_required = :equipment_required,
            time_target = :time_target,
            updated_at = NOW()
        WHERE procedure_id = :procedure_id 
        AND station_id = :station_id
    ");

    $stmt->execute([
        ':procedure_id' => $procedureId,
        ':station_id' => $stationId,
        ':wait_time' => $waitTime,
        ':procedure_time' => $procedureTime,
        ':staff_required' => $staffRequired,
        ':equipment_required' => $equipmentRequired,
        ':time_target' => $timeTarget
    ]);

    $rowsAffected = $stmt->rowCount();

    if ($rowsAffected === 0) {
        // ❌ ไม่พบระเบียน - ลองอัปเดต room_procedures แทน
        error_log("📍 Trying room_procedures table...");
        
        $stmt = $pdo->prepare("
            UPDATE room_procedures 
            SET 
                wait_time = :wait_time,
                procedure_time = :procedure_time,
                updated_at = NOW()
            WHERE procedure_id = :procedure_id
        ");

        $stmt->execute([
            ':procedure_id' => $procedureId,
            ':wait_time' => $waitTime,
            ':procedure_time' => $procedureTime
        ]);

        $rowsAffected = $stmt->rowCount();
    }

    if ($rowsAffected > 0) {
        error_log("✅ Updated successfully - Rows affected: $rowsAffected");
        
        echo json_encode([
            'success' => true,
            'message' => 'อัปเดตรายละเอียดหัตถการสำเร็จ',
            'data' => [
                'procedure_id' => $procedureId,
                'wait_time' => $waitTime,
                'procedure_time' => $procedureTime,
                'staff_required' => $staffRequired,
                'equipment_required' => $equipmentRequired,
                'time_target' => $timeTarget,
                'rows_affected' => $rowsAffected
            ]
        ], JSON_UNESCAPED_UNICODE);
    } else {
        throw new Exception('ไม่พบหัตถการที่ต้องการอัปเดต');
    }

} catch (Exception $e) {
    error_log("❌ Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>