<?php
/**
 * ✅ GET Room Procedures
 * ดึงรายการหัตถการในห้อง
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
date_default_timezone_set('Asia/Bangkok');

require_once __DIR__ . '/db_config.php';

$room_id = isset($_GET['room_id']) ? intval($_GET['room_id']) : 0;

if (!$room_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'room_id is required']);
    exit;
}

try {
    $conn = DBConfig::getPDO();
    
    $query = "
        SELECT 
            room_procedure_id,
            room_id,
            procedure_id,
            procedure_type,
            procedure_name,
            wait_time,
            procedure_time,
            Time_target,
            staff_required,
            equipment_required,
            updated_at
        FROM room_procedures
        WHERE room_id = :room_id
        ORDER BY procedure_name ASC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':room_id', $room_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $procedures = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $procedures[] = [
            'room_procedure_id' => intval($row['room_procedure_id']),
            'room_id' => intval($row['room_id']),
            'procedure_id' => intval($row['procedure_id']),
            'procedure_type' => $row['procedure_type'],
            'procedure_name' => $row['procedure_name'],
            'wait_time' => intval($row['wait_time']),
            'procedure_time' => intval($row['procedure_time']),
            'Time_target' => intval($row['Time_target']),
            'staff_required' => intval($row['staff_required']),
            'equipment_required' => boolval($row['equipment_required']),
            'updated_at' => $row['updated_at']
        ];
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'procedures' => $procedures,
            'total_count' => count($procedures),
            'room_id' => $room_id
        ],
        'message' => count($procedures) . ' procedures found'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>