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

// Use centralized database configuration
require_once __DIR__ . '/db_config.php';

try {
    $pdo = DBConfig::getPDO();
} catch (Exception $e) {
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
    // ✅ ใช้ time_target และ time_target_wait จาก station_patients เลย
    // ✅ Include countdown timer data (procedure_time, countdown_exit_time)
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
            sp.time_target,
            sp.time_target_wait,
            sp.arrival_time,
            sp.running_number,
            sp.station_id,
            sp.procedure_id,
            COALESCE(current_station.station_name, '-') as current_station_name,
            COALESCE(current_station.procedure_code, sp.procedure_code) as current_procedure_code,
            COALESCE(current_station.station_status, sp.status) as current_station_status,
            -- ✅ Countdown timer data
            COALESCE(rp.procedure_time, 0) AS procedure_duration_minutes,
            -- ✅ IMPROVED: Calculate countdown exit time with proper datetime format
            CASE
                WHEN sp.arrival_time IS NOT NULL AND rp.procedure_time > 0 THEN
                    CONCAT(
                        DATE_FORMAT(DATE_ADD(sp.arrival_time, INTERVAL rp.procedure_time MINUTE), '%Y-%m-%d'),
                        ' ',
                        DATE_FORMAT(DATE_ADD(sp.arrival_time, INTERVAL rp.procedure_time MINUTE), '%H:%i:%s')
                    )
                ELSE NULL
            END AS countdown_exit_time
        FROM station_patients sp
        LEFT JOIN patients p ON sp.hn = p.hn AND sp.appointment_date = p.appointment_date
        LEFT JOIN room_procedures rp ON rp.room_id = sp.room_id AND rp.procedure_id = sp.procedure_id
        LEFT JOIN (
            -- ✅ Get the LATEST station where patient is waiting or in-process
            SELECT
                sp_latest.hn,
                sp_latest.appointment_date,
                s.station_id,
                s.station_name,
                sp_latest.procedure_code,
                sp_latest.status as station_status
            FROM station_patients sp_latest
            JOIN stations s ON sp_latest.station_id = s.station_id
            WHERE sp_latest.status IN ('waiting', 'in_process')
            AND sp_latest.Actual_Time IS NULL
            AND sp_latest.running_number = (
                SELECT MAX(sp_check.running_number)
                FROM station_patients sp_check
                WHERE sp_check.hn = sp_latest.hn
                AND sp_check.appointment_date = sp_latest.appointment_date
                AND sp_check.status IN ('waiting', 'in_process')
            )
            GROUP BY sp_latest.hn, sp_latest.appointment_date
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

    // ✅ IMPORTANT: Select ONLY the LATEST station record for each patient (highest running_number that's not completed)
    // This ensures we display the CURRENT station's data, not all stations
    $sql .= " AND sp.running_number = (
        SELECT MAX(sp_max.running_number)
        FROM station_patients sp_max
        WHERE sp_max.hn = sp.hn
        AND sp_max.appointment_date = sp.appointment_date
        AND sp_max.status IN ('waiting', 'in_process')
    )
    GROUP BY sp.hn, sp.appointment_date
    ORDER BY sp.time_start ASC, sp.running_number ASC, sp.station_id ASC";

    // ✅ SEQUENTIAL FLOW: ต้องไม่มี procedures ก่อนหน้า (running_number ต่ำกว่า) ที่ยังไม่เสร็จ
    // Apply ONLY after getting latest records
    // $sql_with_sequential = $sql . " AND NOT EXISTS (
    //     SELECT 1
    //     FROM station_patients sp_earlier
    //     WHERE sp_earlier.hn = sp.hn
    //     AND sp_earlier.appointment_date = sp.appointment_date
    //     AND sp_earlier.running_number < sp.running_number
    //     AND sp_earlier.Actual_Time IS NULL
    // )";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $records = $stmt->fetchAll();

    // ✅ DEBUG: Log query execution
    error_log("🔍 GET_PATIENTS_LIST DEBUG:");
    error_log("   Date: $date");
    error_log("   Status Filter: " . ($status ?: 'none'));
    error_log("   Doctor Filter: " . ($doctor_code ?: 'none'));
    error_log("   Records found: " . count($records));
    if (count($records) > 0) {
        error_log("   First record HN: " . $records[0]['hn']);
    }

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

        // ✅ FALLBACK: If doctor name still not found, try PDP lookup
        if ($doctorNameValue === '-' && $doctorCodeValue) {
            try {
                require_once __DIR__ . '/external_db_config.php';
                $pdpPdo = ExternalDBConfig::getPDPConnection();
                $pdpStmt = $pdpPdo->prepare("SELECT doctor_name FROM doctors WHERE doctor_code = ? LIMIT 1");
                $pdpStmt->execute([$doctorCodeValue]);
                $pdpName = $pdpStmt->fetchColumn();

                if ($pdpName) {
                    $doctorNameValue = $pdpName;
                }
            } catch (Exception $e) {
                error_log("PDP doctor lookup failed for $doctorCodeValue: " . $e->getMessage());
            }
        }

        $patient = [
            'patient_id' => $record['patient_id'],
            'patient_name' => $record['patient_name'] ?? '-',
            'hn' => $record['hn'],
            'gender' => $record['sex'] ?? null,
            'sex' => $record['sex'] ?? null,
            'appointment_date' => $record['appointment_date'],
            'arrival_time' => $record['arrival_time'] ?? null,
            'room_id' => $record['room_id'],
            'status' => $record['station_status'] ?? $record['patient_status'] ?? '-',
            'doctor_code' => $doctorCodeValue ?? '-',
            'doctor_name' => $doctorNameValue,
            'start_time' => $record['time_start'] ?? null,
            'time_target' => $record['time_target'] ?? null,  // ✅ เวลาที่ต้องเสร็จ
            'time_target_wait' => $record['time_target_wait'] ?? null,  // ✅ ช้าสุดที่ทำเสร็จได้
            'running_number' => $record['running_number'] ?? 0,
            'total_procedures' => (int)$totalProcedures,
            'procedure_count' => (int)$totalProcedures,
            'current_station' => $record['current_station_name'] ?? '-',
            'phone' => null,
            // ✅ Countdown timer data
            'procedure_duration_minutes' => !empty($record['procedure_duration_minutes']) ? (int)$record['procedure_duration_minutes'] : 0,
            'countdown_exit_time' => $record['countdown_exit_time'] ?? null
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