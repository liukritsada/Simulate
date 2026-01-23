<?php
/**
 * API: Manage Procedure Times
 * แก้ไขเวลารอและเวลาทำหัตถการ
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');
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

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    if ($action !== 'update') {
        throw new Exception('Invalid action');
    }

    // Update procedure times
    $roomProcedureId = intval($input['room_procedure_id'] ?? 0);
    $waitTime = intval($input['wait_time'] ?? 0);
    $procedureTime = intval($input['procedure_time'] ?? 0);
    $staffRequired = intval($input['staff_required'] ?? 0);
    $equipmentRequired = filter_var($input['equipment_required'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;

    if ($roomProcedureId <= 0) {
        throw new Exception('Invalid room_procedure_id');
    }

    if ($waitTime < 0 || $procedureTime < 0 || $staffRequired < 0) {
        throw new Exception('Times and staff required must be non-negative');
    }

    // Get procedure info
    $procStmt = $pdo->prepare("SELECT procedure_name FROM room_procedures WHERE room_procedure_id = :id");
    $procStmt->execute([':id' => $roomProcedureId]);
    $procedure = $procStmt->fetch(PDO::FETCH_ASSOC);

    if (!$procedure) {
        throw new Exception('Procedure not found');
    }

    // Update
    $stmt = $pdo->prepare("
        UPDATE room_procedures 
        SET 
            wait_time = :wait_time, 
            procedure_time = :procedure_time,
            staff_required = :staff_required,
            equipment_required = :equipment_required
        WHERE room_procedure_id = :id
    ");
    $stmt->execute([
        ':wait_time' => $waitTime,
        ':procedure_time' => $procedureTime,
        ':staff_required' => $staffRequired,
        ':equipment_required' => $equipmentRequired,
        ':id' => $roomProcedureId
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Procedure times updated successfully',
        'data' => [
            'procedure_name' => $procedure['procedure_name'],
            'wait_time' => $waitTime,
            'procedure_time' => $procedureTime,
            'staff_required' => $staffRequired,
            'equipment_required' => $equipmentRequired
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>