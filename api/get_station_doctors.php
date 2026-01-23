<?php
/**
 * 🩺 API: Get Station Doctors
 * 
 * Usage: GET /api/get_station_doctors.php?station_id=77
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
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

    $station_id = isset($_GET['station_id']) ? intval($_GET['station_id']) : 0;

    if ($station_id <= 0) {
        http_response_code(400);
        throw new Exception('ต้องระบุ station_id');
    }

    error_log("🔍 [GET DOCTORS] Station: $station_id");

    // ✅ SQL ที่ถูกต้อง - ไม่มี sd.room_number
    $sql = "
        SELECT 
            sd.station_doctor_id,
            sd.station_id,
            sd.doctor_code,
            sd.doctor_id,
            sd.doctor_name,
            sd.doctor_type,
            sd.specialization,
            sd.work_start_time,
            sd.work_end_time,
            sd.break_start_time,
            sd.break_end_time,
            sd.room_id,
            sd.assigned_room_id,
            sd.status,
            sd.work_date,
            sd.is_active,
            sr.room_name,
            sr.room_number
        FROM station_doctors sd
        LEFT JOIN station_rooms sr 
            ON sd.assigned_room_id = sr.room_id 
            AND sr.station_id = sd.station_id
        WHERE sd.station_id = :station_id
        AND sd.is_active = 1
        ORDER BY sd.doctor_name ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':station_id' => $station_id]);
    $doctors = $stmt->fetchAll();

    error_log("✅ Found: " . count($doctors) . " doctors");

    // ✅ Format data
    $formattedDoctors = [];
    foreach ($doctors as $doctor) {
        $formattedDoctors[] = [
            'station_doctor_id' => (int)$doctor['station_doctor_id'],
            'station_id' => (int)$doctor['station_id'],
            'doctor_id' => (int)($doctor['doctor_id'] ?? 0),
            'doctor_code' => $doctor['doctor_code'],
            'doctor_name' => $doctor['doctor_name'],
            'doctor_type' => $doctor['doctor_type'] ?? 'Monthly',
            'specialization' => $doctor['specialization'] ?? 'ทั่วไป',
            'work_start_time' => $doctor['work_start_time'],
            'work_end_time' => $doctor['work_end_time'],
            'break_start_time' => $doctor['break_start_time'],
            'break_end_time' => $doctor['break_end_time'],
            'room_id' => !empty($doctor['room_id']) ? (int)$doctor['room_id'] : null,
            'assigned_room_id' => !empty($doctor['assigned_room_id']) ? (int)$doctor['assigned_room_id'] : null,
            'room_name' => $doctor['room_name'] ?? null,
            'room_number' => $doctor['room_number'] ?? null,
            'status' => $doctor['status'] ?? 'available',
            'work_date' => $doctor['work_date'],
            'is_active' => (int)$doctor['is_active']
        ];
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'ดึงข้อมูลแพทย์สำเร็จ',
        'data' => [
            'station_id' => $station_id,
            'doctors' => $formattedDoctors,
            'total' => count($formattedDoctors)
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    error_log("DATABASE ERROR: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database Error: ' . $e->getMessage(),
        'error_code' => $e->getCode(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    error_log("ERROR: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}

exit();
?>