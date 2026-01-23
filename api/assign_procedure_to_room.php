<?php
/**
 * ✅ WORKING API: Assign Procedures to Room
 * Fixed for actual database structure (no procedure_type)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Only accept POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit();
    }

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
        exit();
    }

    $room_id = intval($input['room_id'] ?? 0);
    $procedure_id = intval($input['procedure_id'] ?? 0);

    if ($room_id <= 0 || $procedure_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
        exit();
    }

    // ✅ DIRECT DATABASE CONNECTION
    $host = 'localhost';
    $db = 'hospitalstation';
    $user = 'root';
    $pass = '';

    try {
        $conn = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
        exit();
    }

    // Check if room exists
    $stmt = $conn->prepare("SELECT room_id, room_name FROM station_rooms WHERE room_id = ?");
    $stmt->execute([$room_id]);
    $room = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$room) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Room not found']);
        exit();
    }

    // Check if procedure exists (don't select procedure_type)
    $stmt = $conn->prepare("
        SELECT procedure_id, procedure_name, wait_time, procedure_time, staff_required, equipment_required 
        FROM station_procedures 
        WHERE procedure_id = ?
    ");
    $stmt->execute([$procedure_id]);
    $procedure = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$procedure) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Procedure not found']);
        exit();
    }

    // Check if already exists
    $stmt = $conn->prepare("SELECT room_procedure_id FROM room_procedures WHERE room_id = ? AND procedure_id = ?");
    $stmt->execute([$room_id, $procedure_id]);
    
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Already exists']);
        exit();
    }

    // ✅ Insert WITHOUT procedure_type
    $stmt = $conn->prepare("
        INSERT INTO room_procedures (
            room_id, 
            procedure_id, 
            procedure_name,
            wait_time,
            procedure_time,
            staff_required,
            equipment_required
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $result = $stmt->execute([
        $room_id,
        $procedure_id,
        $procedure['procedure_name'],
        $procedure['wait_time'] ?? 15,
        $procedure['procedure_time'] ?? 30,
        $procedure['staff_required'] ?? 0,
        $procedure['equipment_required'] ?? 0
    ]);

    if (!$result) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Insert failed']);
        exit();
    }

    $new_id = $conn->lastInsertId();

    // Success
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Procedure added successfully',
        'data' => [
            'room_procedure_id' => intval($new_id),
            'room_id' => $room_id,
            'procedure_id' => $procedure_id,
            'procedure_name' => $procedure['procedure_name'],
            'room_name' => $room['room_name']
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>