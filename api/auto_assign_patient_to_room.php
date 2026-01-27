<?php
/**
 * ✅ auto_assign_patient_to_room.php
 * แอดคนไข้เข้าห้องอัตโนมัติ เมื่อห้องว่าง
 *
 * Logic:
 * 1. หาห้องว่าง (ไม่มีคนไข้รายอื่น)
 * 2. หาคนไข้ waiting คนแรกในคิว (ตามลำดับ time_start)
 * 3. ตรวจเชค procedure ต้องตรงกับที่ห้องรองรับ (specific หรือ all_from_station)
 * 4. ตรวจเชค: ไม่มีคนคิวก่อนหน้า (has_incomplete_previous = 0)
 * 5. ตรวจเชค: ถ้า procedure ต้องเครื่องมือ → ห้องต้องมีเครื่องมือพร้อม
 * 6. ตรวจเชค: ถ้า procedure ต้องพนักงาน → สถานีต้องมีพนักงาน working
 * 7. แอดคนไข้เข้าห้อง + เปลี่ยน status เป็น in_process
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
date_default_timezone_set('Asia/Bangkok');

try {
    require_once __DIR__ . '/db_config.php';
    $pdo = DBConfig::getPDO();

    $input = json_decode(file_get_contents('php://input'), true);
    $station_id = isset($input['station_id']) ? intval($input['station_id']) : 0;
    $current_date = isset($input['current_date']) ? $input['current_date'] : date('Y-m-d');
    $current_time = isset($input['current_time']) ? $input['current_time'] : date('H:i:s');

    if ($station_id <= 0) {
        throw new Exception('❌ ต้องระบุ station_id');
    }

    error_log("=== AUTO_ASSIGN_PATIENT_TO_ROOM START ===");
    error_log("🏥 Station: $station_id, Date: $current_date, Time: $current_time");

    $assignments = [];
    $assigned_count = 0;

    // ========================================
    // STEP 1: หาห้องว่าง (ไม่มี in_process patients)
    // ========================================
    $empty_rooms_sql = "
        SELECT
            r.room_id,
            r.room_name,
            r.station_id
        FROM station_rooms r
        WHERE r.station_id = :station_id
        AND r.room_id NOT IN (
            SELECT DISTINCT sp.room_id
            FROM station_patients sp
            WHERE sp.room_id IS NOT NULL
            AND sp.appointment_date = :current_date
            AND sp.status IN ('waiting', 'in_process')
        )
        ORDER BY r.room_id ASC
    ";

    $stmt = $pdo->prepare($empty_rooms_sql);
    $stmt->execute([
        ':station_id' => $station_id,
        ':current_date' => $current_date
    ]);
    $empty_rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("📊 Found " . count($empty_rooms) . " empty rooms");

    // ========================================
    // STEP 2: สำหรับแต่ละห้องว่าง หาคนไข้ waiting
    // ========================================
    foreach ($empty_rooms as $room) {
        error_log("🔍 Processing room {$room['room_id']} ({$room['room_name']})");

        // หาคนไข้ waiting ตัวแรก (ตรวจเชคจำนวน requirements หลังจาก fetch)
        $patient_sql = "
            SELECT
                sp.id,
                sp.patient_id,
                sp.hn,
                sp.patient_name,
                sp.status,
                sp.time_start,
                sp.procedure_id,
                sp.procedure_code
            FROM station_patients sp
            WHERE sp.station_id = ?
            AND sp.appointment_date = ?
            AND sp.status = 'waiting'
            AND sp.room_id IS NULL
            AND (sp.time_start IS NULL OR sp.time_start <= ?)
            AND NOT EXISTS (
                SELECT 1
                FROM station_patients sp_prev
                WHERE sp_prev.appointment_date = sp.appointment_date
                AND sp_prev.station_id = sp.station_id
                AND sp_prev.time_start < sp.time_start
                AND sp_prev.Actual_Time IS NULL
            )
            ORDER BY sp.time_start ASC, sp.running_number ASC
            LIMIT 1
        ";

        $stmt = $pdo->prepare($patient_sql);
        $stmt->execute([
            $station_id,
            $current_date,
            $current_time
        ]);
        $patient = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$patient) {
            error_log("   ℹ️ ไม่มีคนไข้ waiting ที่พร้อม");
            continue;
        }

        // ✅ ตรวจเชค: ห้องรองรับ procedure นี้หรือไม่
        $room_supports_stmt = $pdo->prepare("
            SELECT COUNT(*) as cnt FROM room_procedures
            WHERE room_id = ?
            AND (procedure_type = 'all_from_station'
                 OR (procedure_id = ? AND procedure_type = 'specific'))
        ");
        $room_supports_stmt->execute([$room['room_id'], $patient['procedure_id']]);
        $supports = $room_supports_stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

        if (!$supports) {
            error_log("   ℹ️ ห้องไม่รองรับ procedure นี้");
            continue;
        }

        // ✅ ตรวจเชค: ถ้า procedure ต้องเครื่องมือ → ห้องมีเครื่องมือหรือไม่
        $equipment_check = $pdo->prepare("
            SELECT
                (SELECT COUNT(*) FROM room_procedures WHERE room_id = ?
                 AND procedure_id = ? AND equipment_required = 1) as needs_equipment,
                (SELECT COUNT(*) FROM room_equipment WHERE room_id = ? AND is_active = 1) as has_equipment
        ");
        $equipment_check->execute([$room['room_id'], $patient['procedure_id'], $room['room_id']]);
        $eq = $equipment_check->fetch(PDO::FETCH_ASSOC);

        if ($eq['needs_equipment'] && !$eq['has_equipment']) {
            error_log("   ℹ️ ห้องต้องการเครื่องมือแต่ไม่มี");
            continue;
        }

        // ✅ ตรวจเชค: ถ้า procedure ต้องพนักงาน → ห้องมีพนักงาน working หรือไม่
        $staff_check = $pdo->prepare("
            SELECT
                (SELECT COUNT(*) FROM room_procedures WHERE room_id = ?
                 AND procedure_id = ? AND staff_required = 1) as needs_staff,
                (SELECT COUNT(*) FROM station_staff WHERE station_id = ?
                 AND status = 'working' AND assigned_room_id = ?) as has_staff
        ");
        $staff_check->execute([$room['room_id'], $patient['procedure_id'], $station_id, $room['room_id']]);
        $st = $staff_check->fetch(PDO::FETCH_ASSOC);

        if ($st['needs_staff'] && !$st['has_staff']) {
            error_log("   ℹ️ ห้องต้องการพนักงานแต่ไม่มี");
            continue;
        }

        // ========================================
        // STEP 3: แอดคนไข้เข้าห้อง
        // ========================================
        error_log("   👤 Found patient: {$patient['patient_name']} (HN: {$patient['hn']}, Procedure: {$patient['procedure_code']})");

        $update_sql = "
            UPDATE station_patients
            SET
                room_id = :room_id,
                status = 'in_process',
                in_process = 1,
                arrival_time = CURRENT_TIMESTAMP,
                update_date = CURRENT_TIMESTAMP
            WHERE id = :patient_id
        ";

        $stmt = $pdo->prepare($update_sql);
        $stmt->execute([
            ':room_id' => $room['room_id'],
            ':patient_id' => $patient['id']
        ]);

        $assigned_count++;
        $assignments[] = [
            'patient_id' => $patient['patient_id'],
            'hn' => $patient['hn'],
            'patient_name' => $patient['patient_name'],
            'procedure_code' => $patient['procedure_code'],
            'room_id' => $room['room_id'],
            'room_name' => $room['room_name'],
            'message' => "✅ {$patient['patient_name']} (HN: {$patient['hn']}, {$patient['procedure_code']}) -> {$room['room_name']}"
        ];

        error_log("   ✅ Assigned {$patient['patient_name']} to room {$room['room_id']}");
    }

    error_log("📊 Total assigned: $assigned_count patients");
    error_log("=== AUTO_ASSIGN_PATIENT_TO_ROOM END (SUCCESS) ===");

    // ========================================
    // RESPONSE
    // ========================================
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "✅ แอดคนไข้เข้าห้องเสร็จ ($assigned_count คน)",
        'data' => [
            'station_id' => $station_id,
            'current_date' => $current_date,
            'current_time' => $current_time,
            'assigned_count' => $assigned_count,
            'assignments' => $assignments
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ Error: " . $e->getMessage());
    error_log("Stack: " . $e->getTraceAsString());
    error_log("=== AUTO_ASSIGN_PATIENT_TO_ROOM END (ERROR) ===");

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE);
}

$pdo = null;
?>
