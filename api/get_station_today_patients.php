<?php
/**
 * 🥕 API: Get Station Patients Today - FIXED VERSION 2
 * ✅ ใช้ procedures (พหูพจน์) แทน procedure (เอกพจน์)
 * ✅ Optimized สำหรับการแสดง procedures
 * 
 * Usage: GET /api/get_station_today_patients.php?station_id=77&department_ids=49
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);

date_default_timezone_set('Asia/Bangkok');

// Use centralized database configuration
require_once __DIR__ . '/db_config.php';

try {
    // ✅ Database connection using DBConfig
    $pdo = DBConfig::getPDO();

    // ✅ Get parameters
    $station_id = isset($_GET['station_id']) ? intval($_GET['station_id']) : 0;
    $department_ids_param = isset($_GET['department_ids']) ? $_GET['department_ids'] : '';
    
    // 📅 Add date range filtering
    $date_from = isset($_GET['date_from']) ? $_GET['date_from'] : null;
    $date_to = isset($_GET['date_to']) ? $_GET['date_to'] : null;

    // ✅ Validate station_id
    if ($station_id <= 0) {
        throw new Exception('❌ ต้องระบุ station_id');
    }

    // ✅ Parse department IDs
    $department_ids = [];
    if (!empty($department_ids_param)) {
        $department_ids = array_filter(
            array_map('intval', explode(',', $department_ids_param))
        );
    }

    // 📅 Validate and set date range
    $today = date('Y-m-d');
    if ($date_from && strtotime($date_from) !== false) {
        $today = $date_from; // Use date_from as start
    }
    
    $date_to_filter = $today;
    if ($date_to && strtotime($date_to) !== false) {
        $date_to_filter = $date_to; // Use date_to as end
    }
    
    error_log("📍 [GET PATIENTS] Station: $station_id, Date Range: $today to $date_to_filter, Depts: " . implode(',', $department_ids));

    // ✅ SQL Query - FIX: ใช้ procedures แทน procedure
    // ✅ กรองเฉพาะ status (waiting, in_process)
    // ✅ แสดงเฉพาะคนไข้ที่ time_start <= เวลาปัจจุบัน
    $currentTime = date('H:i:s');

    $sql = "
        SELECT
            sp.patient_id,
            sp.station_id,
            sp.patient_name,
            sp.sex,
            sp.hn,
            sp.appointmentno,
            sp.doctor_code,
            sp.department_id,
            sp.room_id,
            sp.running_number,
            sp.procedure_id,
            sp.procedure_code,
            sp.time_start,
            COALESCE(sp.procedure_code, 'ไม่ระบุ') AS `procedure`,
            sp.appointment_date,
            sp.arrival_time,
            sp.time_target,
            sp.time_target_wait,
            sp.expected_wait_time,
            sp.Actual_Time,
            sp.Actual_wait,
            sp.in_process,
            sp.`status`,
            sp.flag,
            sp.completed_date,
            sp.create_date,
            sp.update_date,
            -- ✅ เช็คว่ามีคนคิวก่อนหน้า ANY PATIENT ในสถานีเดียวกัน (ไม่ว่าจะเป็นคนไข้คนไหน) ที่มี time_start ก่อนหน้าและยังไม่มี Actual_Time
            EXISTS (
                SELECT 1
                FROM station_patients sp_prev
                WHERE sp_prev.appointment_date = sp.appointment_date
                AND sp_prev.station_id = sp.station_id
                AND sp_prev.time_start < sp.time_start
                AND sp_prev.Actual_Time IS NULL
            ) as has_incomplete_previous,
            -- ✅ Get procedure duration for countdown timer
            COALESCE(rp.procedure_time, 0) AS procedure_duration_minutes,
            -- ✅ Calculate countdown exit time: arrival_time + procedure_time
            CASE
                WHEN sp.arrival_time IS NOT NULL AND rp.procedure_time > 0 THEN
                    DATE_ADD(sp.arrival_time, INTERVAL rp.procedure_time MINUTE)
                ELSE NULL
            END AS countdown_exit_time
        FROM station_patients sp
        LEFT JOIN room_procedures rp ON rp.room_id = sp.room_id AND rp.procedure_id = sp.procedure_id
        WHERE sp.station_id = :station_id
        AND sp.appointment_date BETWEEN :date_from AND :date_to
        AND sp.status IN ('waiting', 'in_process')
        AND (
            sp.time_start IS NULL
            OR sp.time_start <= :current_time
        )
        -- ✅ SEQUENTIAL FLOW: ต้องเสร็จทั้งหมด procedures ก่อนหน้า (running_number ต่ำกว่า)
        AND NOT EXISTS (
            SELECT 1
            FROM station_patients sp_earlier
            WHERE sp_earlier.hn = sp.hn
            AND sp_earlier.appointment_date = sp.appointment_date
            AND sp_earlier.running_number < sp.running_number
            AND sp_earlier.Actual_Time IS NULL
        )
    ";

    // ✅ Named parameters with date range and current time
    $params = [
        ':station_id' => $station_id,
        ':date_from' => $today,
        ':date_to' => $date_to_filter,
        ':current_time' => $currentTime
    ];

    // ✅ Filter by departments - ใช้ Named Parameters
    if (!empty($department_ids)) {
        $placeholders = [];
        foreach ($department_ids as $i => $dept_id) {
            $key = ':dept_' . $i;
            $placeholders[] = $key;
            $params[$key] = $dept_id;
        }
        $in_clause = implode(',', $placeholders);
        $sql .= " AND department_id IN ($in_clause)";
    }

    // ✅ เรียงลำดับ: อยู่ระหว่างการรักษา -> เรียงตาม time_start -> เลขคิวน้อย -> มาก่อน
    $sql .= " ORDER BY sp.in_process DESC, sp.time_start ASC, sp.running_number ASC, sp.arrival_time ASC, sp.create_date ASC";

    error_log("📄 SQL: " . str_replace(["\n", "\r", "\t"], " ", $sql));
    error_log("📦 Params: " . json_encode($params));

    // ✅ Execute query
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $patients = $stmt->fetchAll();

    error_log("✅ พบคนไข้: " . count($patients) . " คน");

    // ✅ ดึง unique procedures สำหรับแสดงใน procedures tab
    $allProcedures = [];
    $procedureMap = [];
    
    foreach ($patients as $patient) {
        $proc = $patient['procedure'] ?? 'ไม่ระบุ';
        if (!empty($proc) && !isset($allProcedures[$proc])) {
            $allProcedures[$proc] = true;
            $procedureMap[] = [
                'name' => $proc,
                'code' => $patient['procedure_code'] ?? null,
                'id' => $patient['procedure_id'] ?? null
            ];
        }
    }

    error_log("🔍 Unique Procedures: " . count($allProcedures) . " - " . json_encode(array_keys($allProcedures)));

    // ✅ จัดกลุ่มคนไข้
    $inprocessPatients = [];
    $waitingPatients = [];
    
    foreach ($patients as $patient) {
        // ✅ Format ข้อมูล
        $formatted = [
            'patient_id' => (int)$patient['patient_id'],
            'station_id' => (int)$patient['station_id'],
            'patient_name' => $patient['patient_name'] ?? 'ไม่ระบุ',
            'sex' => isset($patient['sex']) ? $patient['sex'] : null,  // ✅ Keep as string (M/F)
            'hn' => $patient['hn'] ?? 'N/A',
            'appointmentno' => $patient['appointmentno'] ?? 'APT-' . $patient['patient_id'],
            'doctor_code' => $patient['doctor_code'] ?? null,
            'department_id' => !empty($patient['department_id']) ? (int)$patient['department_id'] : null,
            'room_id' => !empty($patient['room_id']) ? (int)$patient['room_id'] : null,
            'running_number' => !empty($patient['running_number']) ? (int)$patient['running_number'] : null,
            'procedure_id' => !empty($patient['procedure_id']) ? (int)$patient['procedure_id'] : null,
            'procedure_code' => $patient['procedure_code'] ?? null,
            'procedure' => $patient['procedure'] ?? 'ไม่ระบุ',
            'appointment_date' => $patient['appointment_date'] ?? $today,
            'arrival_time' => $patient['arrival_time'] ?? $patient['create_date'] ?? null,
            'time_target' => $patient['time_target'] ?? null,
            'time_target_wait' => $patient['time_target_wait'] ?? null,
            'expected_wait_time' => !empty($patient['expected_wait_time']) ? (int)$patient['expected_wait_time'] : 15,
            'Actual_Time' => $patient['Actual_Time'] ?? null,
            'Actual_wait' => $patient['Actual_wait'] ?? null,
            'in_process' => (int)($patient['in_process'] ?? 0),
            'status' => $patient['status'] ?? 'waiting',
            'flag' => $patient['flag'] ?? 'W',
            'completed_date' => $patient['completed_date'] ?? null,
            'create_date' => $patient['create_date'] ?? null,
            'update_date' => $patient['update_date'] ?? null,
            'has_incomplete_previous' => (int)($patient['has_incomplete_previous'] ?? 0),
            // ✅ Add countdown timer data for station level
            'procedure_duration_minutes' => !empty($patient['procedure_duration_minutes']) ? (int)$patient['procedure_duration_minutes'] : 0,
            'countdown_exit_time' => $patient['countdown_exit_time'] ?? null
        ];
        
        if ($formatted['in_process'] == 1) {
            $inprocessPatients[] = $formatted;
        } else {
            $waitingPatients[] = $formatted;
        }
    }

    $totalInprocess = count($inprocessPatients);
    $totalWaiting = count($waitingPatients);
    $totalPatients = $totalInprocess + $totalWaiting;

    // ✅ Success Response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "✅ ดึงข้อมูลคนไข้สำเร็จ (วันที่ $today)",
        'query_date' => $today,
        'total_patients' => $totalPatients,
        'inprocess_count' => $totalInprocess,
        'waiting_count' => $totalWaiting,
        'total_procedures' => count($allProcedures),
        'data' => [
            'station_id' => $station_id,
            'query_date' => $today,
            'current_time' => $currentTime,
            'department_ids' => $department_ids,
            'summary' => [
                'total_patients' => $totalPatients,
                'inprocess_count' => $totalInprocess,
                'waiting_count' => $totalWaiting,
                'total_procedures' => count($allProcedures)
            ],
            'procedures' => array_keys($allProcedures),
            'inprocess_patients' => $inprocessPatients,
            'waiting_patients' => $waitingPatients,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    error_log("❌ DATABASE ERROR: " . $e->getMessage());
    error_log("SQL STATE: " . $e->getCode());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '❌ Database Error: ' . $e->getMessage(),
        'error_code' => $e->getCode(),
        'sql_state' => $e->errorInfo[0] ?? null,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    error_log("❌ ERROR: " . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}

exit();
?>