<?php
/**
 * ✅ auto_assign_patient_to_room.php
 * แอดคนไข้เข้าห้องอัตโนมัติ เมื่อห้องว่าง
 *
 * Logic:
 * 1. หาห้องว่าง (ไม่มีคนไข้รายอื่น)
 * 2. หาคนไข้ waiting คนแรกในคิว (ตามลำดับ time_start)
 * 3. ตรวจเชคว่าไม่มีคนคิวก่อนหน้า (has_incomplete_previous = 0)
 * 4. แอดคนไข้เข้าห้อง + เปลี่ยน status เป็น in_process
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
        FROM rooms r
        WHERE r.station_id = :station_id
        AND r.is_active = 1
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

        // หาคนไข้ waiting ตัวแรกในคิว
        // ✅ ตรวจเชค has_incomplete_previous = 0 (ไม่มีคนคิวก่อน)
        // ✅ ตรวจเชค procedure ต้องตรงกับที่ห้องรองรับ (room_procedures)
        // ✅ ตรวจเชค sequential flow: คนไข้ต้องเสร็จ procedures ก่อนหน้า (running_number ต่ำกว่า) ก่อน
        $patient_sql = "
            SELECT
                sp.id,
                sp.patient_id,
                sp.hn,
                sp.patient_name,
                sp.status,
                sp.time_start,
                sp.procedure_id,
                sp.procedure_code,
                sp.has_incomplete_previous,
                sp.running_number
            FROM station_patients sp
            WHERE sp.station_id = :station_id
            AND sp.appointment_date = :current_date
            AND sp.status = 'waiting'
            AND sp.room_id IS NULL
            AND (sp.time_start IS NULL OR sp.time_start <= :current_time)
            AND NOT EXISTS (
                SELECT 1
                FROM station_patients sp_prev
                WHERE sp_prev.appointment_date = sp.appointment_date
                AND sp_prev.station_id = sp.station_id
                AND sp_prev.time_start < sp.time_start
                AND sp_prev.Actual_Time IS NULL
            )
            -- ✅ SEQUENTIAL FLOW CHECK: ต้องไม่มี procedures ก่อนหน้า (running_number ต่ำกว่า) ที่ยังไม่เสร็จ
            AND NOT EXISTS (
                SELECT 1
                FROM station_patients sp_earlier
                WHERE sp_earlier.hn = sp.hn
                AND sp_earlier.appointment_date = sp.appointment_date
                AND sp_earlier.running_number < sp.running_number
                AND sp_earlier.Actual_Time IS NULL
            )
            AND (
                -- ✅ ห้องรองรับ procedure ทั้งหมดของสถานี (all_from_station)
                EXISTS (
                    SELECT 1
                    FROM room_procedures rp
                    WHERE rp.room_id = :room_id
                    AND rp.procedure_type = 'all_from_station'
                )
                OR
                -- ✅ ห้องรองรับ procedure นี้โดยเฉพาะ (specific)
                EXISTS (
                    SELECT 1
                    FROM room_procedures rp
                    WHERE rp.room_id = :room_id
                    AND rp.procedure_id = sp.procedure_id
                    AND rp.procedure_type = 'specific'
                )
            )
            ORDER BY sp.time_start ASC, sp.running_number ASC
            LIMIT 1
        ";

        $stmt = $pdo->prepare($patient_sql);
        $stmt->execute([
            ':station_id' => $station_id,
            ':current_date' => $current_date,
            ':current_time' => $current_time,
            ':room_id' => $room['room_id']
        ]);
        $patient = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$patient) {
            error_log("   ℹ️ ไม่มีคนไข้ waiting ที่พร้อม (ตรวจเชค: ไม่มีคิวก่อน + เสร็จ procedures ก่อนหน้า + ห้องรองรับ procedure)");
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
