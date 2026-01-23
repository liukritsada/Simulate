<?php
/**
 * ✅ ADD Room Procedures - CORRECTED
 * ตรงตามที่ room_procedures table มีจริง
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
date_default_timezone_set('Asia/Bangkok');

require_once __DIR__ . '/db_config.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

$room_id = isset($input['room_id']) ? intval($input['room_id']) : 0;
$procedure_ids = isset($input['procedure_ids']) ? $input['procedure_ids'] : [];

if (!$room_id || !is_array($procedure_ids) || count($procedure_ids) === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'room_id and procedure_ids are required']);
    exit;
}

try {
    $conn = DBConfig::getPDO();
    $conn->beginTransaction();
    
    $added_count = 0;
    $skipped_count = 0;
    $errors = [];
    
    // ✅ Query ที่ถูกต้อง - ไม่มี created_at, มี procedure_type, procedure_name เป็น default
    // ✅ เพิ่ม Procedurepdp_id ในการ INSERT
    $query = "INSERT INTO room_procedures (room_id, procedure_id, Procedurepdp_id, procedure_type, procedure_name, wait_time, procedure_time, Time_target, staff_required, equipment_required) 
              SELECT :room_id, sp.procedure_id, sp.Procedurepdp_id, 'standard', sp.procedure_name, sp.wait_time, sp.procedure_time, 0, sp.staff_required, sp.equipment_required 
              FROM station_procedures sp 
              WHERE sp.procedure_id = :procedure_id";
    
    $stmt = $conn->prepare($query);
    
    foreach ($procedure_ids as $procedure_id) {
        $procedure_id = intval($procedure_id);
        
        if ($procedure_id <= 0) {
            $errors[] = "Invalid procedure_id: $procedure_id";
            continue;
        }
        
        try {
            // ตรวจสอบว่ามี procedure นี้ในห้องนี้แล้วหรือยัง
            $checkQuery = "SELECT COUNT(*) as count FROM room_procedures WHERE room_id = :room_id AND procedure_id = :procedure_id";
            $checkStmt = $conn->prepare($checkQuery);
            $checkStmt->bindParam(':room_id', $room_id, PDO::PARAM_INT);
            $checkStmt->bindParam(':procedure_id', $procedure_id, PDO::PARAM_INT);
            $checkStmt->execute();
            
            $checkResult = $checkStmt->fetch(PDO::FETCH_ASSOC);
            if ($checkResult['count'] > 0) {
                $skipped_count++;
                continue;
            }
            
            // เพิ่ม procedure จาก station_procedures
            $stmt->bindParam(':room_id', $room_id, PDO::PARAM_INT);
            $stmt->bindParam(':procedure_id', $procedure_id, PDO::PARAM_INT);
            
            if ($stmt->execute()) {
                $added_count++;
            }
        } catch (Exception $e) {
            $errors[] = "Procedure $procedure_id: " . $e->getMessage();
        }
    }
    
    $conn->commit();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Added $added_count procedures",
        'data' => [
            'room_id' => $room_id,
            'added_count' => $added_count,
            'skipped_count' => $skipped_count,
            'total_processed' => count($procedure_ids)
        ],
        'errors' => $errors
    ]);
    
} catch (Exception $e) {
    if ($conn) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>