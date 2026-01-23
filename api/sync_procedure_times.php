<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = '127.0.0.1';
$port = '3306';
$dbname = 'hospitalstation';
$username = 'sa';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['action']) || $data['action'] !== 'sync_from_station') {
        throw new Exception('Invalid action');
    }

    $stationId = intval($data['station_id']);
    $procedureId = intval($data['procedure_id']);
    $waitTime = intval($data['wait_time']);
    $procTime = intval($data['procedure_time']);
    $staffRequired = intval($data['staff_required']);
    $equipmentRequired = $data['equipment_required'] ? 1 : 0;

    // ✅ Update ทุก room_procedures ที่เกี่ยวข้องกับ procedure นี้ในแผนกนี้
    $updateStmt = $pdo->prepare("
        UPDATE room_procedures rp
        SET 
            rp.wait_time = :wait_time,
            rp.procedure_time = :proc_time,
            rp.staff_required = :staff_required,
            rp.equipment_required = :equipment_required
        WHERE rp.procedure_id = :procedure_id
        AND rp.room_id IN (
            SELECT sr.room_id
            FROM station_rooms sr
            WHERE sr.station_id = :station_id
        )
    ");

    $updateStmt->execute([
        ':procedure_id' => $procedureId,
        ':station_id' => $stationId,
        ':wait_time' => $waitTime,
        ':proc_time' => $procTime,
        ':staff_required' => $staffRequired,
        ':equipment_required' => $equipmentRequired
    ]);

    $rowsUpdated = $updateStmt->rowCount();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Synced to $rowsUpdated rooms",
        'data' => [
            'rooms_updated' => $rowsUpdated
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("Sync error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>