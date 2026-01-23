<?php
/**
 * API: Add a new procedure (step) to an existing patient's flow
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Function to send JSON response and exit
function sendResponse($success, $message, $data = null) {
    http_response_code($success ? 200 : 400);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Get input data
$input = json_decode(file_get_contents('php://input'), true);

$patientId = $input['patient_id'] ?? 0;
$procedureId = $input['procedure_id'] ?? 0;
$waitTime = $input['wait_time'] ?? null;
    $procedureTime = $input['procedure_time'] ?? null;
    $estimatedDuration = $input['estimated_duration'] ?? 15; // Default 15 minutes

if ($patientId <= 0 || $procedureId <= 0) {
    sendResponse(false, 'Invalid patient ID or procedure ID.');
}

try {
    // Connect to hospitalstation DB
    $pdo = new PDO(
        "mysql:host=127.0.0.1;port=3306;dbname=hospitalstation;charset=utf8mb4",
        'sa',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Connect to pdp DB for procedure name
    $pdpPdo = new PDO(
        "mysql:host=172.25.41.30;port=3306;dbname=pdp;charset=utf8",
        'root',
        'abzolute',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // --- Start Transaction ---
    $pdo->beginTransaction();

    // 2. Get Procedure Name from pdp DB
    $stmt = $pdpPdo->prepare("
        SELECT procedure_item_name 
        FROM procedure_item 
        WHERE procedure_item_id = :id
    ");
    $stmt->execute([':id' => $procedureId]);
    $procedureName = $stmt->fetchColumn();

    if (!$procedureName) {
        $pdo->rollBack();
        sendResponse(false, 'Procedure not found in PDP database.');
    }

    // 3. Find the last step's order and station_id
    $stmt = $pdo->prepare("
        SELECT step_order, station_id, room_id, doctor_name
        FROM patient_steps 
        WHERE patient_id = :id
        ORDER BY step_order DESC
        LIMIT 1
    ");
    $stmt->execute([':id' => $patientId]);
    $lastStep = $stmt->fetch(PDO::FETCH_ASSOC);

    $newStepOrder = ($lastStep['step_order'] ?? 0) + 1;
    
    // 4. Find the station for this procedure
    $stmt = $pdo->prepare("
        SELECT s.station_id, s.station_name, sr.room_id, sr.room_name, s.require_doctor, sp.wait_time, sp.procedure_time
        FROM station_procedures sp
        JOIN stations s ON sp.station_id = s.station_id
        LEFT JOIN station_rooms sr ON s.station_id = sr.station_id AND sr.room_number = 1
        WHERE sp.procedure_id = :proc_id
        LIMIT 1
    ");
    $stmt->execute([':proc_id' => $procedureId]);
    $stationInfo = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$stationInfo) {
        // Fallback: If procedure is not mapped, use the last station's info
        $stationId = $lastStep['station_id'] ?? 1; // Default to Reg station (ID 1)
        $roomId = $lastStep['room_id'] ?? 1;
        $waitTime = 10; // Default wait time
        $procedureTime = 30; // Default procedure time
        $estimatedDuration = $waitTime + $procedureTime;
        $doctorName = $lastStep['doctor_name'] ?? null;
        $stepType = 'procedure';
        $stepName = $procedureName;
    } else {
        $stationId = $stationInfo['station_id'];
        $roomId = $stationInfo['room_id'] ?? 1;
        $waitTime = $stationInfo['wait_time'] ?? 10;
        $procedureTime = $stationInfo['procedure_time'] ?? 30;
        $estimatedDuration = $waitTime + $procedureTime;
        $doctorName = $stationInfo['require_doctor'] ? ($lastStep['doctor_name'] ?? null) : null;
        $stepType = 'procedure';
        $stepName = $procedureName;
    }

    // 5. Insert the new step
    $stmt = $pdo->prepare("
        INSERT INTO patient_steps (
            patient_id, step_order, step_type, step_name, station_id, room_id, doctor_name, estimated_duration, wait_time, procedure_time, status
        ) VALUES (
            :patient_id, :step_order, :step_type, :step_name, :station_id, :room_id, :doctor_name, :estimated_duration, :wait_time, :procedure_time, 'waiting'
        )
    ");

    $stmt->execute([
        ':patient_id' => $patientId,
        ':step_order' => $newStepOrder,
        ':step_type' => $stepType,
        ':step_name' => $stepName,
        ':station_id' => $stationId,
        ':room_id' => $roomId,
        ':doctor_name' => $doctorName,
        ':estimated_duration' => $estimatedDuration,
            ':wait_time' => $waitTime,
            ':procedure_time' => $procedureTime
    ]);

    // 6. Update subsequent steps' order (if any)
    // In a real system, we would need to re-insert the final steps (Payment, Pharmacy, Discharge)
    // For simplicity in this simulation, we assume the new procedure is the final step before the fixed final steps.
    // We need to re-order the final steps (Payment, Pharmacy, Discharge) to be after the new procedure.
    
    // Find the fixed final steps (Payment, Pharmacy, Discharge)
    $stmt = $pdo->prepare("
        SELECT step_id, step_order
        FROM patient_steps
        WHERE patient_id = :id AND step_type IN ('payment', 'pharmacy', 'discharge')
        ORDER BY step_order
    ");
    $stmt->execute([':id' => $patientId]);
    $finalSteps = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $currentOrder = $newStepOrder + 1;
    foreach ($finalSteps as $step) {
        $stmt = $pdo->prepare("
            UPDATE patient_steps
            SET step_order = :new_order
            WHERE step_id = :step_id
        ");
        $stmt->execute([
            ':new_order' => $currentOrder,
            ':step_id' => $step['step_id']
        ]);
        $currentOrder++;
    }

    // 7. Commit transaction
    $pdo->commit();

    sendResponse(true, 'Procedure added successfully and flow re-ordered.', [
        'patient_id' => $patientId,
        'procedure_name' => $procedureName,
        'new_step_order' => $newStepOrder
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse(false, 'Database error: ' . $e->getMessage());
} catch (Exception $e) {
    sendResponse(false, 'An error occurred: ' . $e->getMessage());
}
?>
