<?php
/**
 * ✅ ADD Station Procedure - WITH PDP MAPPING (AUTO GENERATE Procedurepdp_id)
 * ส่วนที่แก้:
 *   - รับ Procedurepdp_id (procedure_item_id จาก PDP) - ถ้าไม่ส่ม ระบบสร้างเองอัตโนมัติ
 *   - ถ้า Procedurepdp_id <= 0 ให้หาค่าสูงสุดแล้ว +1
 *   - INSERT ลง station_procedures พร้อม Procedurepdp_id
 *   - ตรวจสอบซ้ำ ไม่ให้ซ้ำ procedure ชื่อเดียวกัน
 */

header('Content-Type: application/json; charset=utf-8');

// ✅ โหลด db_config.php จาก folder เดียวกัน
if (!isset($pdo)) {
    $db_config_path = __DIR__ . '/db_config.php';
    
    if (!file_exists($db_config_path)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database config file not found',
            'path' => $db_config_path
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    require_once $db_config_path;
    
    if (!isset($pdo) || !$pdo) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection not initialized'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

$data = json_decode(file_get_contents("php://input"), true);

// 📥 รับค่าจาก request
$station_id = intval($data['station_id'] ?? 0);
$Procedurepdp_id = intval($data['Procedurepdp_id'] ?? 0);  // ✅ NEW: procedure_item_id จาก PDP
$procedure_name = trim($data['procedure_name'] ?? '');
$procedure_time = intval($data['procedure_time'] ?? 30);
$wait_time = intval($data['wait_time'] ?? 10);
$Time_target = intval($data['Time_target'] ?? 0);
$staff_required = intval($data['staff_required'] ?? 0);
$equipment_required = intval($data['equipment_required'] ?? 0);

// 🔒 ตรวจสอบข้อมูลจำเป็น
if (!$station_id || $procedure_name === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ข้อมูลไม่ครบ: station_id และ procedure_name จำเป็น'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ✅ ตรวจสอบและสร้าง Procedurepdp_id (UPDATED)
// ถ้าไม่ส่ง Procedurepdp_id มา หรือส่ง 0 ให้สร้างเองจากค่าสูงสุด + 1
try {
    if ($Procedurepdp_id <= 0) {
        // หาค่าสูงสุดของ Procedurepdp_id ที่มีอยู่
        $maxQuery = $pdo->query("SELECT MAX(Procedurepdp_id) as max_id FROM station_procedures");
        $maxResult = $maxQuery->fetch(PDO::FETCH_ASSOC);
        $maxId = intval($maxResult['max_id'] ?? 0);
        
        // สร้าง Procedurepdp_id ใหม่ (ค่าสูงสุด + 1)
        $Procedurepdp_id = $maxId + 1;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'เกิดข้อผิดพลาดในการสร้าง Procedurepdp_id: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // 🔒 เช็กซ้ำ #1: ไม่ให้มี procedure_name ซ้ำในสถานีเดียวกัน
    $check1 = $pdo->prepare("
        SELECT procedure_id, Procedurepdp_id
        FROM station_procedures
        WHERE station_id = :station_id
        AND procedure_name = :procedure_name
    ");
    $check1->execute([
        ':station_id' => $station_id,
        ':procedure_name' => $procedure_name
    ]);

    if ($check1->fetch()) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'มีหัตถการชื่อนี้ใน Station แล้ว ไม่สามารถเพิ่มได้'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ✅ เช็กซ้ำ #2: ไม่ให้มี (Procedurepdp_id + station_id) ซ้ำในสถานีเดียวกัน
    // หัตถการเดียวกันสามารถซ้ำได้ในสถานีต่างๆ เพื่อให้สามารถนำหัตถการจาก PDP มาใช้หลายสถานี
    $check2 = $pdo->prepare("
        SELECT procedure_id, procedure_name, station_id
        FROM station_procedures
        WHERE Procedurepdp_id = :Procedurepdp_id
        AND station_id = :station_id
    ");
    $check2->execute([
        ':Procedurepdp_id' => $Procedurepdp_id,
        ':station_id' => $station_id
    ]);

    $existingProcedure = $check2->fetch(PDO::FETCH_ASSOC);
    if ($existingProcedure) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'หัตถการนี้จาก PDP (procedure_item_id: ' . $Procedurepdp_id . ') มีใน Station นี้แล้ว ไม่สามารถเพิ่มซ้ำได้',
            'existing_procedure' => [
                'procedure_id' => $existingProcedure['procedure_id'],
                'procedure_name' => $existingProcedure['procedure_name'],
                'station_id' => $existingProcedure['station_id']
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ✅ INSERT ลง station_procedures พร้อม Procedurepdp_id
    $stmt = $pdo->prepare("
        INSERT INTO station_procedures
        (
            station_id,
            Procedurepdp_id,
            procedure_name,
            procedure_time,
            wait_time,
            Time_target,
            staff_required,
            equipment_required
        )
        VALUES
        (
            :station_id,
            :Procedurepdp_id,
            :procedure_name,
            :procedure_time,
            :wait_time,
            :Time_target,
            :staff_required,
            :equipment_required
        )
    ");

    $stmt->execute([
        ':station_id' => $station_id,
        ':Procedurepdp_id' => $Procedurepdp_id,
        ':procedure_name' => $procedure_name,
        ':procedure_time' => $procedure_time,
        ':wait_time' => $wait_time,
        ':Time_target' => $Time_target,
        ':staff_required' => $staff_required,
        ':equipment_required' => $equipment_required
    ]);

    $newProcedureId = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'เพิ่มหัตถการเรียบร้อย',
        'data' => [
            'procedure_id' => $newProcedureId,
            'Procedurepdp_id' => $Procedurepdp_id,
            'station_id' => $station_id,
            'procedure_name' => $procedure_name,
            'procedure_time' => $procedure_time,
            'wait_time' => $wait_time,
            'Time_target' => $Time_target,
            'staff_required' => $staff_required,
            'equipment_required' => $equipment_required
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database Error: ' . $e->getMessage(),
        'error_code' => $e->getCode()
    ], JSON_UNESCAPED_UNICODE);
}
?>