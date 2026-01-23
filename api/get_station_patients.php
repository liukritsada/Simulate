<?php
/**
 * 🏥 API: Get ALL Station Patients
 * Version 2 - เวอร์ชั่นใหม่
 * ✅ ดึงคนไข้ทั้งหมดในสเตชั่น
 * 
 * Usage:
 * GET /api/get_station_patients.php?station_id=77
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
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $station_id = isset($_GET['station_id']) ? intval($_GET['station_id']) : 0;

    if ($station_id <= 0) {
        throw new Exception('❌ ต้องระบุ station_id');
    }

    $currentTime = date('H:i:s');
    
    error_log("🔍 [GET ALL PATIENTS v2] Station: $station_id");

    // ✅ SQL Query - ดึงคนไข้ทั้งหมด
    $sql = "
        SELECT 
            id,
            patient_id,
            appointmentno,
            doctor_code,
            patient_id,
            patient_name,
            hn,
            department_id,
            room_id,
            procedure_id,
            procedure_code,
            procedure,
            arrival_time,
            time_target,
            expected_wait_time,
            status,
            flag,
            create_date,
            in_process,
            Actual_Time,
            appointment_date
        FROM station_patients
        WHERE station_id = :station_id
        AND (in_process = 1 OR flag IN ('W', 'P', 'N'))
        ORDER BY in_process DESC, appointment_date DESC, arrival_time ASC, create_date ASC
    ";

    error_log("📝 Running SQL query for station $station_id");

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':station_id' => $station_id]);
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("✅ Retrieved " . count($patients) . " patients");

    // ✅ Organize patients
    $inprocessPatients = [];
    $waitingPatients = [];
    
    foreach ($patients as $patient) {
        $patient['id'] = (int)$patient['id'];
        $patient['patient_id'] = (int)$patient['patient_id'];
        $patient['patient_id'] = (int)$patient['patient_id'];
        $patient['department_id'] = !empty($patient['department_id']) ? (int)$patient['department_id'] : null;
        $patient['room_id'] = !empty($patient['room_id']) ? (int)$patient['room_id'] : null;
        $patient['procedure_id'] = !empty($patient['procedure_id']) ? (int)$patient['procedure_id'] : null;
        $patient['in_process'] = (int)$patient['in_process'];
        $patient['expected_wait_time'] = !empty($patient['expected_wait_time']) ? (int)$patient['expected_wait_time'] : 15;
        
        if (empty($patient['procedure'])) {
            $patient['procedure'] = $patient['procedure_code'] ?? 'ไม่ระบุ';
        }
        if (empty($patient['arrival_time'])) {
            $patient['arrival_time'] = $patient['create_date'];
        }
        if (empty($patient['appointmentno'])) {
            $patient['appointmentno'] = 'APT-' . $patient['patient_id'];
        }
        
        if ($patient['in_process'] == 1) {
            $inprocessPatients[] = $patient;
        } else {
            $waitingPatients[] = $patient;
        }
    }

    $totalInprocess = count($inprocessPatients);
    $totalWaiting = count($waitingPatients);
    $totalPatients = $totalInprocess + $totalWaiting;

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => '✅ ดึงข้อมูลคนไข้สำเร็จ',
        'data' => [
            'station_id' => $station_id,
            'current_time' => $currentTime,
            'summary' => [
                'total_patients' => $totalPatients,
                'inprocess_count' => $totalInprocess,
                'waiting_count' => $totalWaiting
            ],
            'inprocess_patients' => $inprocessPatients,
            'waiting_patients' => $waitingPatients,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ ERROR: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => '❌ ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}

exit();
?>