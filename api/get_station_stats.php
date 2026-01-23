<?php
/**
 * API: Get Station Statistics
 * ดึงข้อมูลสถิติของ Station
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

ini_set('display_errors', 0);
error_reporting(0);

/* ================= DB CONFIG ================= */
$host = '127.0.0.1';
$port = '3306';
$dbname = 'hospitalstation';
$username = 'sa';
$password = '';

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    /* ================= PARAM ================= */
    $stationId = isset($_GET['station_id']) ? intval($_GET['station_id']) : 0;
    if ($stationId <= 0) {
        throw new Exception('Invalid station_id');
    }

    /* ================= 1. STATION INFO ================= */
    $stationStmt = $pdo->prepare("
        SELECT station_id, station_name, station_code, floor, department_id
        FROM stations
        WHERE station_id = ?
    ");
    $stationStmt->execute([$stationId]);
    $station = $stationStmt->fetch();

    if (!$station) {
        throw new Exception('Station not found');
    }

    /* ================= 2. PATIENT (DISABLED FOR NOW) ================= */
    /*
    // TOTAL PATIENTS (waiting + in_progress)
    $totalPatientsStmt = $pdo->prepare("
        SELECT COUNT(*) AS total_patients
        FROM station_patients sp
        INNER JOIN station_rooms sr ON sp.room_id = sr.room_id
        WHERE sr.station_id = ?
        AND sp.queue_status IN ('waiting', 'in_progress')
    ");
    $totalPatientsStmt->execute([$stationId]);
    $totalPatients = (int) $totalPatientsStmt->fetchColumn();

    // COMPLETED PATIENTS
    $completedPatientsStmt = $pdo->prepare("
        SELECT COUNT(*) AS completed_patients
        FROM station_patients sp
        INNER JOIN station_rooms sr ON sp.room_id = sr.room_id
        WHERE sr.station_id = ?
        AND sp.queue_status = 'completed'
    ");
    $completedPatientsStmt->execute([$stationId]);
    $completedPatients = (int) $completedPatientsStmt->fetchColumn();

    $pendingPatients = max(0, $totalPatients - $completedPatients);
    */

    // placeholder (patient system not ready)
    $totalPatients     = 0;
    $completedPatients = 0;
    $pendingPatients   = 0;

    /* ================= 3. ROOM COUNT ================= */
    $roomsStmt = $pdo->prepare("
        SELECT COUNT(*) AS room_count
        FROM station_rooms
        WHERE station_id = ?
    ");
    $roomsStmt->execute([$stationId]);
    $roomCount = (int) $roomsStmt->fetchColumn();

    /* ================= 4. STAFF COUNT ================= */
    $staffStmt = $pdo->prepare("
        SELECT COUNT(*) AS staff_count
        FROM station_staff
        WHERE station_id = ?
        AND is_active = 1
    ");
    $staffStmt->execute([$stationId]);
    $staffCount = (int) $staffStmt->fetchColumn();

    /* ================= 5. DOCTOR COUNT ================= */
    $doctorStmt = $pdo->prepare("
        SELECT COUNT(DISTINCT doctor_id) AS doctor_count
        FROM station_doctors
        WHERE station_id = ?
        AND is_active = 1
    ");
    $doctorStmt->execute([$stationId]);
    $doctorCount = (int) $doctorStmt->fetchColumn();

    /* ================= RESPONSE ================= */
    echo json_encode([
        'success' => true,
        'data' => [
            'station_id'         => (int) $station['station_id'],
            'station_name'       => $station['station_name'],
            'station_code'       => $station['station_code'],
            'total_patients'     => $totalPatients,
            'completed_patients' => $completedPatients,
            'pending_patients'   => $pendingPatients,
            'room_count'         => $roomCount,
            'staff_count'        => $staffCount,
            'doctor_count'       => $doctorCount
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
