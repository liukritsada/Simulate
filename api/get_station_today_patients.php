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

$host = '127.0.0.1';
$port = '3306';
$dbname = 'hospitalstation';
$username = 'sa';
$password = '';

try {
    // ✅ Database connection
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

    // ✅ Get parameters
    $station_id = isset($_GET['station_id']) ? intval($_GET['station_id']) : 0;
    $department_ids_param = isset($_GET['department_ids']) ? $_GET['department_ids'] : '';

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

    $today = date('Y-m-d');
    $currentTime = date('H:i:s');
    
    error_log("📍 [GET PATIENTS] Station: $station_id, Today: $today, Depts: " . implode(',', $department_ids));

    // ✅ SQL Query - FIX: ใช้ procedures แทน procedure
    // ✅ ใช้ procedure_code โดยตรง หรือ procedures table
    $sql = "
        SELECT 
            patient_id,
            station_id,
            patient_name,
            sex,
            hn,
            appointmentno,
            doctor_code,
            department_id,
            room_id,
            running_number,
            procedure_id,
            procedure_code,
            COALESCE(procedure_code, 'ไม่ระบุ') AS `procedure`,
            appointment_date,
            arrival_time,
            time_target,
            expected_wait_time,
            Actual_Time,
            Actual_wait,
            in_process,
            `status`,
            flag,
            completed_date,
            create_date,
            update_date
        FROM station_patients
        WHERE station_id = :station_id
        AND appointment_date = :today
    ";

    // ✅ Named parameters
    $params = [
        ':station_id' => $station_id,
        ':today' => $today
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

    // ✅ Filter เฉพาะที่ active (ยังไม่เสร็จ)
    $sql .= " AND (in_process = 1 OR flag IN ('W', 'P', 'N'))";
    
    // ✅ เรียงลำดับ: อยู่ระหว่างการรักษา -> เลขคิวน้อย -> มาก่อน
    $sql .= " ORDER BY in_process DESC, running_number ASC, arrival_time ASC, create_date ASC";

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
            'patient_id' => (int)$patient['patient_id'],
            'station_id' => (int)$patient['station_id'],
            'patient_name' => $patient['patient_name'] ?? 'ไม่ระบุ',
            'sex' => isset($patient['sex']) ? (int)$patient['sex'] : 0,
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
            'expected_wait_time' => !empty($patient['expected_wait_time']) ? (int)$patient['expected_wait_time'] : 15,
            'Actual_Time' => $patient['Actual_Time'] ?? null,
            'Actual_wait' => $patient['Actual_wait'] ?? null,
            'in_process' => (int)($patient['in_process'] ?? 0),
            'status' => $patient['status'] ?? 'waiting',
            'flag' => $patient['flag'] ?? 'W',
            'completed_date' => $patient['completed_date'] ?? null,
            'create_date' => $patient['create_date'] ?? null,
            'update_date' => $patient['update_date'] ?? null
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