<?php
/**
 * auto_update_patient_status.php
 * อัปเดตสถานะผู้ป่วยอัตโนมัติตามเวลา
 *
 * Logic:
 * 1. เช็คผู้ป่วยที่ควรเปลี่ยนจาก waiting → in_process (ถึงเวลา time_start)
 * 2. เช็คผู้ป่วยที่ควรเปลี่ยนจาก in_process → completed (ถึงเวลา time_target_wait)
 * 3. บันทึก Actual_Time และ Actual_wait อัตโนมัติ
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once __DIR__ . '/db_config.php';
    $pdo = DBConfig::getPDO();

    $current_date = date('Y-m-d');
    $current_time = date('H:i:s');

    $updated_to_in_process = [];
    $updated_to_completed = [];

    error_log("=== AUTO_UPDATE_PATIENT_STATUS START ===");
    error_log("🕐 Current: $current_date $current_time");

    // ========================================
    // STEP 1: เปลี่ยน waiting → in_process
    // (เมื่อถึงเวลา time_start และมีห้องว่าง)
    // ========================================

    $waiting_sql = "
        SELECT
            sp.id,
            sp.patient_id,
            sp.hn,
            sp.patient_name,
            sp.appointment_date,
            sp.time_start,
            sp.time_target,
            sp.time_target_wait,
            sp.station_id,
            sp.room_id
        FROM station_patients sp
        WHERE sp.appointment_date = ?
        AND sp.status = 'waiting'
        AND sp.time_start IS NOT NULL
        AND sp.time_start <= ?
        AND sp.arrival_time IS NOT NULL
    ";

    $stmt = $pdo->prepare($waiting_sql);
    $stmt->execute([$current_date, $current_time]);
    $waiting_patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("📊 Found " . count($waiting_patients) . " waiting patients ready to start");

    foreach ($waiting_patients as $patient) {
        // เช็คว่ามีห้องว่างหรือไม่ (ถ้ามี room_id กำหนดไว้แล้ว)
        if ($patient['room_id']) {
            // อัปเดตเป็น in_process
            $update_sql = "
                UPDATE station_patients
                SET status = 'in_process',
                    update_date = CURRENT_TIMESTAMP
                WHERE id = ?
            ";

            $update_stmt = $pdo->prepare($update_sql);
            $update_stmt->execute([$patient['id']]);

            $updated_to_in_process[] = [
                'patient_id' => $patient['patient_id'],
                'hn' => $patient['hn'],
                'patient_name' => $patient['patient_name'],
                'time_start' => $patient['time_start']
            ];

            error_log("✅ Updated {$patient['hn']} to in_process (started at {$patient['time_start']})");
        }
    }

    // ========================================
    // STEP 2: เปลี่ยน in_process → completed
    // (เมื่อถึงเวลา time_target_wait หรือเกิน)
    // ========================================

    $in_process_sql = "
        SELECT
            sp.id,
            sp.patient_id,
            sp.hn,
            sp.patient_name,
            sp.appointment_date,
            sp.time_start,
            sp.time_target,
            sp.time_target_wait
        FROM station_patients sp
        WHERE sp.appointment_date = ?
        AND sp.status = 'in_process'
        AND sp.time_target_wait IS NOT NULL
        AND sp.time_target_wait <= ?
    ";

    $stmt = $pdo->prepare($in_process_sql);
    $stmt->execute([$current_date, $current_time]);
    $in_process_patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("📊 Found " . count($in_process_patients) . " in-process patients ready to complete");

    foreach ($in_process_patients as $patient) {
        // คำนวณ Actual_Time และ Actual_wait (นาที)
        $actual_time = $current_time;
        $actual_wait = 0;

        if ($patient['time_target']) {
            $target_time = strtotime($patient['time_target']);
            $current_timestamp = strtotime($actual_time);

            // ถ้าทำเสร็จเกินเวลาที่กำหนด → คำนวณนาทีที่เกิน
            if ($current_timestamp > $target_time) {
                $diff_seconds = $current_timestamp - $target_time;
                $actual_wait = round($diff_seconds / 60); // ✅ แปลงเป็นนาที
            }
        }

        // อัปเดตเป็น completed พร้อมบันทึก Actual_Time และ Actual_wait
        // ✅ เตะผู้ป่วยออกจากห้อง (room_id = NULL) เพื่อให้พนักงานรับผู้ป่วยคนต่อไปได้
        $update_sql = "
            UPDATE station_patients
            SET status = 'completed',
                room_id = NULL,
                in_process = 0,
                Actual_Time = ?,
                Actual_wait = ?,
                completed_date = CURRENT_TIMESTAMP,
                update_date = CURRENT_TIMESTAMP
            WHERE id = ?
        ";

        $update_stmt = $pdo->prepare($update_sql);
        $update_stmt->execute([$actual_time, $actual_wait, $patient['id']]);

        $updated_to_completed[] = [
            'patient_id' => $patient['patient_id'],
            'hn' => $patient['hn'],
            'patient_name' => $patient['patient_name'],
            'time_target' => $patient['time_target'],
            'actual_time' => $actual_time,
            'actual_wait' => $actual_wait
        ];

        error_log("✅ Completed {$patient['hn']}: Target={$patient['time_target']}, Actual=$actual_time, Wait=$actual_wait");
    }

    error_log("📊 Summary: In-process: " . count($updated_to_in_process) . ", Completed: " . count($updated_to_completed));
    error_log("=== AUTO_UPDATE_PATIENT_STATUS END (SUCCESS) ===");

    // ========================================
    // RESPONSE
    // ========================================
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Patient status auto-updated successfully',
        'data' => [
            'current_time' => $current_time,
            'current_date' => $current_date,
            'updated_to_in_process' => count($updated_to_in_process),
            'updated_to_completed' => count($updated_to_completed),
            'in_process_list' => $updated_to_in_process,
            'completed_list' => $updated_to_completed
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ Error: " . $e->getMessage());
    error_log("Stack: " . $e->getTraceAsString());
    error_log("=== AUTO_UPDATE_PATIENT_STATUS END (ERROR) ===");

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE);
}

$pdo = null;
?>
