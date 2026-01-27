<?php
/**
 * update_patient_status.php
 * อัปเดตสถานะผู้ป่วยพร้อมบันทึก Actual_wait และ Actual_Time
 *
 * Logic:
 * - Actual_Time = เวลาที่ทำเสร็จจริง (เวลาปัจจุบันที่เปลี่ยนสถานะเป็น completed)
 * - Actual_wait = ระยะเวลาที่เกินจาก time_target
 *   - ถ้า Actual_Time > time_target → Actual_wait = Actual_Time - time_target
 *   - ถ้า Actual_Time <= time_target → Actual_wait = 00:00:00
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once __DIR__ . '/db_config.php';
    $pdo = DBConfig::getPDO();

    // รับข้อมูลจาก request
    $input = json_decode(file_get_contents('php://input'), true);

    $patient_id = intval($input['patient_id'] ?? 0);
    $hn = $input['hn'] ?? '';
    $appointment_date = $input['appointment_date'] ?? '';
    $status = $input['status'] ?? 'completed';

    error_log("=== UPDATE_PATIENT_STATUS START ===");
    error_log("📝 Input: patient_id=$patient_id, hn=$hn, date=$appointment_date, status=$status");

    // Validate input
    if (!$patient_id && !$hn) {
        throw new Exception('Missing required parameter: patient_id or hn');
    }

    if (!$appointment_date) {
        throw new Exception('Missing required parameter: appointment_date');
    }

    // ========================================
    // STEP 1: ดึงข้อมูลผู้ป่วยปัจจุบัน
    // ========================================
    $sql = "
        SELECT
            id,
            patient_id,
            hn,
            appointment_date,
            time_start,
            time_target,
            time_target_wait,
            status,
            Actual_Time,
            Actual_wait
        FROM station_patients
        WHERE appointment_date = ?
    ";

    $params = [$appointment_date];

    if ($patient_id > 0) {
        $sql .= " AND patient_id = ?";
        $params[] = $patient_id;
    } else {
        $sql .= " AND hn = ?";
        $params[] = $hn;
    }

    $sql .= " LIMIT 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $patient = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$patient) {
        throw new Exception('Patient not found');
    }

    error_log("✅ Found patient: {$patient['hn']} (ID: {$patient['patient_id']})");

    // ========================================
    // STEP 2: คำนวณ Actual_Time และ Actual_wait
    // ========================================
    $actual_time = date('H:i:s');  // เวลาปัจจุบัน
    $actual_wait = '00:00:00';     // ค่าเริ่มต้น

    // ถ้ามี time_target ให้คำนวณ Actual_wait
    if ($patient['time_target'] && $status === 'completed') {
        $target_time = strtotime($patient['time_target']);
        $current_time = strtotime($actual_time);

        // ถ้าทำเสร็จเกินเวลาที่กำหนด
        if ($current_time > $target_time) {
            $diff_seconds = $current_time - $target_time;
            $hours = floor($diff_seconds / 3600);
            $minutes = floor(($diff_seconds % 3600) / 60);
            $seconds = $diff_seconds % 60;
            $actual_wait = sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds);

            error_log("⏱️ Calculated wait: Actual=$actual_time, Target={$patient['time_target']}, Wait=$actual_wait");
        } else {
            error_log("✅ Completed on time: Actual=$actual_time <= Target={$patient['time_target']}");
        }
    }

    // ========================================
    // STEP 3: อัปเดตสถานะและบันทึกเวลา
    // ========================================
    $update_sql = "
        UPDATE station_patients
        SET
            status = ?,
            Actual_Time = ?,
            Actual_wait = ?,
            completed_date = ?,
            update_date = CURRENT_TIMESTAMP
        WHERE id = ?
    ";

    $completed_date = ($status === 'completed') ? date('Y-m-d H:i:s') : null;

    $update_params = [
        $status,
        ($status === 'completed') ? $actual_time : null,
        ($status === 'completed') ? $actual_wait : null,
        $completed_date,
        $patient['id']
    ];

    $stmt = $pdo->prepare($update_sql);
    $stmt->execute($update_params);

    $affected_rows = $stmt->rowCount();

    error_log("✅ Updated $affected_rows row(s)");
    error_log("=== UPDATE_PATIENT_STATUS END (SUCCESS) ===");

    // ========================================
    // RESPONSE
    // ========================================
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Patient status updated successfully',
        'data' => [
            'patient_id' => $patient['patient_id'],
            'hn' => $patient['hn'],
            'appointment_date' => $patient['appointment_date'],
            'status' => $status,
            'actual_time' => ($status === 'completed') ? $actual_time : null,
            'actual_wait' => ($status === 'completed') ? $actual_wait : null,
            'time_target' => $patient['time_target'],
            'completed_date' => $completed_date
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ Error: " . $e->getMessage());
    error_log("Stack: " . $e->getTraceAsString());
    error_log("=== UPDATE_PATIENT_STATUS END (ERROR) ===");

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE);
}

$pdo = null;
?>
