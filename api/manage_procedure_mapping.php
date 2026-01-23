<?php
/**
 * API: Manage Procedure Mapping
 * Map imported procedure names to stations
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;port=3306;dbname=hospitalstation;charset=utf8mb4",
        'sa',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - List all mappings
if ($method === 'GET') {
    $stmt = $pdo->query("
        SELECT 
            pm.*,
            s.station_name,
            s.station_code
        FROM procedure_mapping pm
        LEFT JOIN stations s ON pm.station_id = s.station_id
        ORDER BY pm.import_procedure_name
    ");
    $mappings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $mappings,
        'count' => count($mappings)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// POST - Create new mapping
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $procedureName = $input['procedure_name'] ?? '';
    $stationId = $input['station_id'] ?? null;
    $procedureId = $input['procedure_id'] ?? null;
    $waitTime = $input['wait_time'] ?? 10; // Default 10 mins
    $procedureTime = $input['procedure_time'] ?? 30; // Default 30 mins
    $duration = $input['estimated_duration'] ?? 15;

    if (empty($procedureName)) {
        echo json_encode([
            'success' => false,
            'message' => 'Procedure name is required'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO procedure_mapping 
            (import_procedure_name, procedure_id, station_id, estimated_duration, wait_time, procedure_time)
            VALUES (:name, :proc_id, :station_id, :duration, :wait_time, :procedure_time)
            ON DUPLICATE KEY UPDATE
                procedure_id = :proc_id,
                station_id = :station_id,
                estimated_duration = :duration,
                wait_time = :wait_time,
                procedure_time = :procedure_time,
                updated_at = NOW()
        ");

        $stmt->execute([
            ':name' => $procedureName,
            ':proc_id' => $procedureId,
            ':station_id' => $stationId,
            ':duration' => $duration,
            ':wait_time' => $waitTime,
            ':procedure_time' => $procedureTime
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Mapping created/updated successfully',
            'mapping_id' => $pdo->lastInsertId()
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create mapping: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// DELETE - Remove mapping
if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $mappingId = $input['mapping_id'] ?? 0;

    if ($mappingId <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid mapping ID'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM procedure_mapping WHERE mapping_id = :id");
        $stmt->execute([':id' => $mappingId]);

        echo json_encode([
            'success' => true,
            'message' => 'Mapping deleted successfully'
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to delete mapping'
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

echo json_encode([
    'success' => false,
    'message' => 'Method not allowed'
], JSON_UNESCAPED_UNICODE);
?>
