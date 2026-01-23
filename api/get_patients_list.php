<?php
/**
 * get_patients_list_SMART.php
 * 
 * ✅ SMART LOGIC - ดึง doctor_code จากหลาย procedures
 * 
 * Logic:
 * 1. ดึง doctor_code ทั้งหมดของ patient (หลาย procedures)
 * 2. เช็ค ตัวไหนมีค่า (ไม่ใช่ NULL)
 * 3. ใช้ตัวแรกที่มีค่า → หา doctor_name จาก station_doctors
 * 4. ถ้าไม่มี → แสดง "-"
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// Database connection
$host = 'localhost';
$dbname = 'hospitalstation';
$user = 'root';
$password = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $password, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}

// Get query parameters
$date = $_GET['date'] ?? null;
$status = $_GET['status'] ?? '';
$doctor_code = $_GET['doctor_code'] ?? '';

if (!$date) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing required parameter: date'
    ]);
    exit;
}

try {
    $startTime = microtime(true);

    // ========================================
    // STEP 1: ดึง procedure counts สำหรับแต่ละ HN
    // ========================================
    $countSQL = "
        SELECT 
            hn,
            appointment_date,
            COUNT(*) as procedure_count
        FROM station_patients
        WHERE appointment_date = ?
        GROUP BY hn, appointment_date
    ";
    
    $countStmt = $pdo->prepare($countSQL);
    $countStmt->execute([$date]);
    $procedureCounts = $countStmt->fetchAll();
    
    // Map procedure counts by HN+date
    $procedureMap = [];
    foreach ($procedureCounts as $pc) {
        $key = $pc['hn'] . '_' . $pc['appointment_date'];
        $procedureMap[$key] = $pc['procedure_count'];
    }

    // ========================================
    // STEP 2: ดึง doctor_code ทั้งหมด สำหรับแต่ละ HN
    // ========================================
    $doctorCodeSQL = "
        SELECT DISTINCT
            sp.hn,
            sp.appointment_date,
            sp.doctor_code
        FROM station_patients sp
        WHERE sp.appointment_date = ?
        AND sp.doctor_code IS NOT NULL
        AND TRIM(sp.doctor_code) != ''
    ";
    
    $doctorCodeStmt = $pdo->prepare($doctorCodeSQL);
    $doctorCodeStmt->execute([$date]);
    $doctorCodes = $doctorCodeStmt->fetchAll();
    
    // Map doctor codes by HN+date (เอาตัวแรกที่มีค่า)
    $firstDoctorCodeMap = [];
    foreach ($doctorCodes as $dc) {
        $key = $dc['hn'] . '_' . $dc['appointment_date'];
        
        // ถ้ายังไม่มี key นี้ → เก็บตัวแรกที่เจอ
        if (!isset($firstDoctorCodeMap[$key])) {
            $firstDoctorCodeMap[$key] = $dc['doctor_code'];
        }
    }
    
    // ========================================
    // STEP 3: ดึง doctor_name จาก station_doctors
    // ========================================
    $doctorNameMap = [];
    if (!empty($firstDoctorCodeMap)) {
        $placeholders = implode(',', array_fill(0, count($firstDoctorCodeMap), '?'));
        $doctorNameSQL = "
            SELECT 
                doctor_code,
                doctor_name
            FROM station_doctors
            WHERE doctor_code IN ($placeholders)
        ";
        
        $doctorNameStmt = $pdo->prepare($doctorNameSQL);
        $doctorNameStmt->execute(array_values($firstDoctorCodeMap));
        $doctorNames = $doctorNameStmt->fetchAll();
        
        // Map doctor_name by doctor_code
        foreach ($doctorNames as $dn) {
            $doctorNameMap[$dn['doctor_code']] = $dn['doctor_name'];
        }
    }

    // ========================================
    // STEP 4: ดึง patient list (unique patients)
    // ========================================
    $sql = "
        SELECT 
            p.patient_id,
            p.patient_name,
            sp.hn,
            p.sex,
            sp.appointment_date,
            p.room_id,
            sp.status as station_status,
            p.status as patient_status,
            sp.doctor_code,
            sp.time_start,
            sp.running_number,
            sp.station_id,
            COALESCE(current_station.station_name, '-') as current_station_name
        FROM station_patients sp
        LEFT JOIN patients p ON sp.hn = p.hn AND sp.appointment_date = p.appointment_date
        LEFT JOIN (
            SELECT 
                sp_in.hn,
                sp_in.appointment_date,
                s.station_name
            FROM station_patients sp_in
            JOIN stations s ON sp_in.station_id = s.station_id
            WHERE sp_in.status = 'in_process'
            GROUP BY sp_in.hn, sp_in.appointment_date
        ) as current_station ON sp.hn = current_station.hn AND sp.appointment_date = current_station.appointment_date
        WHERE sp.appointment_date = ?
    ";
    
    $params = [$date];
    
    // Add status filter
    if ($status) {
        $sql .= " AND sp.status = ?";
        $params[] = $status;
    }
    
    // Add doctor filter
    if ($doctor_code) {
        $sql .= " AND sp.doctor_code = ?";
        $params[] = $doctor_code;
    }
    
    // เรียงตาม start_time
    $sql .= " GROUP BY sp.hn, sp.appointment_date
        ORDER BY sp.time_start ASC, sp.running_number ASC, sp.station_id ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $records = $stmt->fetchAll();

    // ========================================
    // STEP 5: Transform data
    // ========================================
    $patients = [];
    foreach ($records as $record) {
        $countKey = $record['hn'] . '_' . $record['appointment_date'];
        $totalProcedures = $procedureMap[$countKey] ?? 0;
        
        // ✅ ดึง doctor_code ตัวแรกที่มีค่า
        $doctorCodeValue = $firstDoctorCodeMap[$countKey] ?? null;
        
        // ✅ ดึง doctor_name จากแมป
        $doctorNameValue = '-';
        if ($doctorCodeValue && isset($doctorNameMap[$doctorCodeValue])) {
            $doctorNameValue = $doctorNameMap[$doctorCodeValue];
        }
        
        $patient = [
            'patient_id' => $record['patient_id'],
            'patient_name' => $record['patient_name'] ?? '-',
            'hn' => $record['hn'],
            'gender' => $record['sex'] ?? null,
            'sex' => $record['sex'] ?? null,
            'appointment_date' => $record['appointment_date'],
            'room_id' => $record['room_id'],
            'status' => $record['station_status'] ?? $record['patient_status'] ?? '-',
            'doctor_code' => $doctorCodeValue ?? '-',
            'doctor_name' => $doctorNameValue,  // ✅ ชื่อแพทย์ที่ถูกต้อง!
            'start_time' => $record['time_start'] ?? null,
            'running_number' => $record['running_number'] ?? 0,
            'total_procedures' => (int)$totalProcedures,
            'procedure_count' => (int)$totalProcedures,
            'current_station' => $record['current_station_name'] ?? '-',
            'phone' => null
        ];
        
        $patients[] = $patient;
    }
    
    $queryTime = microtime(true) - $startTime;

    // ========================================
    // RESPONSE
    // ========================================
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Patients retrieved successfully',
        'data' => [
            'patients' => $patients,
            'count' => count($patients),
            'filters' => [
                'date' => $date,
                'status' => $status,
                'doctor_code' => $doctor_code
            ]
        ],
        '_debug' => [
            'query_time_ms' => round($queryTime * 1000, 2),
            'patients_count' => count($patients),
            'logic' => 'Smart doctor code extraction from multiple procedures'
        ]
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ], JSON_UNESCAPED_UNICODE);
}

$pdo = null;
?>