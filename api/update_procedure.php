<?php
/**
 * API: Update Procedure - Combined
 * รวมการอัปเดตรายละเอียดหัตถการและเวลา
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

// ✅ โหลด db_config.php จากโฟลเดอร์เดียวกัน
if (!isset($pdo)) {
    $db_config_path = __DIR__ . '/db_config.php';
    
    if (!file_exists($db_config_path)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database config file not found'
        ]);
        exit;
    }
    
    require_once $db_config_path;
    
    if (!isset($pdo) || !$pdo) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection not initialized'
        ]);
        exit;
    }
}

try {
    // รับข้อมูลจาก request
    $input = json_decode(file_get_contents('php://input'), true);

    $procedureId = $input['procedure_id'] ?? null;
    $stationId = $input['station_id'] ?? null;
    $waitTime = isset($input['wait_time']) ? intval($input['wait_time']) : null;
    $procedureTime = isset($input['procedure_time']) ? intval($input['procedure_time']) : null;
    $staffRequired = isset($input['staff_required']) ? intval($input['staff_required']) : null;
    $equipmentRequired = isset($input['equipment_required']) ? filter_var($input['equipment_required'], FILTER_VALIDATE_BOOLEAN) : null;
    $timeTarget = isset($input['time_target']) ? intval($input['time_target']) : 0;

    // ✅ ตรวจสอบข้อมูล
    if (!$procedureId) {
        throw new Exception('procedure_id จำเป็น');
    }

    if ($waitTime === null || $procedureTime === null) {
        throw new Exception('wait_time และ procedure_time จำเป็น');
    }

    if ($waitTime < 0 || $procedureTime < 1) {
        throw new Exception('เวลารอต้องมากกว่าหรือเท่ากับ 0 และเวลาทำหัตถการต้องมากกว่า 0');
    }
    
    if ($staffRequired !== null && $staffRequired < 0) {
        throw new Exception('จำนวนพนักงานต้องมากกว่าหรือเท่ากับ 0');
    }

    // แปลง boolean
    if ($equipmentRequired !== null) {
        $equipmentRequired = $equipmentRequired ? 1 : 0;
    }

    error_log("📍 Updating procedure: ID=$procedureId, Wait=$waitTime, Proc=$procedureTime");

    $updated = false;

    // ✅ พยายามอัปเดต station_procedures ก่อน
    if ($stationId) {
        $stmt = $pdo->prepare("
            UPDATE station_procedures 
            SET 
                wait_time = :wait_time,
                procedure_time = :procedure_time,
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
            ':time_target' => $timeTarget
        ]);

        if ($stmt->rowCount() > 0) {
            $updated = true;
        }
    }

    // ✅ ถ้ายังไม่อัปเดต ลองอัปเดต room_procedures
    if (!$updated) {
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

        if ($stmt->rowCount() > 0) {
            $updated = true;
        }
    }

    if ($updated) {
        error_log("✅ Procedure updated successfully");
        
        echo json_encode([
            'success' => true,
            'message' => 'อัปเดตหัตถการสำเร็จ',
            'data' => [
                'procedure_id' => $procedureId,
                'wait_time' => $waitTime,
                'procedure_time' => $procedureTime,
                'staff_required' => $staffRequired,
                'equipment_required' => $equipmentRequired,
                'time_target' => $timeTarget
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