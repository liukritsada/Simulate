<?php
/**
 * ✅ REMOVE Room Procedure - IMPROVED
 * Better input handling & validation
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
date_default_timezone_set('Asia/Bangkok');

require_once __DIR__ . '/db_config.php';

// ✅ Get raw input
$input = file_get_contents('php://input');

// ✅ Log raw input for debugging
error_log('[remove_room_procedure] Raw input: ' . $input);
error_log('[remove_room_procedure] Content-Type: ' . $_SERVER['CONTENT_TYPE']);

// ✅ Decode JSON
$data = json_decode($input, true);

if ($data === null) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON input',
        'debug' => [
            'raw_input' => substr($input, 0, 100),
            'json_error' => json_last_error_msg()
        ]
    ]);
    exit;
}

// ✅ Get room_procedure_id
$room_procedure_id = isset($data['room_procedure_id']) ? intval($data['room_procedure_id']) : 0;

error_log('[remove_room_procedure] Extracted room_procedure_id: ' . $room_procedure_id);

if (!$room_procedure_id) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'room_procedure_id is required and must be > 0',
        'debug' => [
            'received' => $data['room_procedure_id'] ?? 'not set',
            'parsed_as' => $room_procedure_id
        ]
    ]);
    exit;
}

try {
    $conn = DBConfig::getPDO();
    
    if (!$conn) {
        throw new Exception('Failed to connect to database');
    }
    
    // ✅ ตรวจสอบว่ามีรายการนี้หรือไม่
    $checkQuery = "SELECT room_procedure_id, room_id, procedure_id FROM room_procedures WHERE room_procedure_id = :room_procedure_id LIMIT 1";
    $checkStmt = $conn->prepare($checkQuery);
    
    if (!$checkStmt) {
        throw new Exception('Prepare check query failed: ' . implode(' ', $conn->errorInfo()));
    }
    
    $checkStmt->bindParam(':room_procedure_id', $room_procedure_id, PDO::PARAM_INT);
    
    if (!$checkStmt->execute()) {
        throw new Exception('Execute check query failed: ' . implode(' ', $checkStmt->errorInfo()));
    }
    
    $row = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$row) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Procedure not found',
            'debug' => [
                'looking_for' => 'room_procedure_id = ' . $room_procedure_id
            ]
        ]);
        exit;
    }
    
    error_log('[remove_room_procedure] Found record: ' . json_encode($row));
    
    // ✅ ลบหัตถการ
    $deleteQuery = "DELETE FROM room_procedures WHERE room_procedure_id = :room_procedure_id LIMIT 1";
    $deleteStmt = $conn->prepare($deleteQuery);
    
    if (!$deleteStmt) {
        throw new Exception('Prepare delete query failed: ' . implode(' ', $conn->errorInfo()));
    }
    
    $deleteStmt->bindParam(':room_procedure_id', $room_procedure_id, PDO::PARAM_INT);
    
    if (!$deleteStmt->execute()) {
        throw new Exception('Execute delete query failed: ' . implode(' ', $deleteStmt->errorInfo()));
    }
    
    $affected = $deleteStmt->rowCount();
    
    error_log('[remove_room_procedure] Delete executed, affected rows: ' . $affected);
    
    if ($affected > 0) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Procedure deleted successfully',
            'data' => [
                'room_procedure_id' => $room_procedure_id,
                'room_id' => intval($row['room_id']),
                'procedure_id' => intval($row['procedure_id']),
                'affected_rows' => $affected
            ]
        ]);
    } else {
        throw new Exception('No rows were deleted');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    error_log('[remove_room_procedure] Exception: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'debug' => [
            'room_procedure_id' => $room_procedure_id
        ]
    ]);
}
?>