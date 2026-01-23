<?php
/**
 * 👨‍⚕️ GET DOCTOR DETAILS API
 * GET /hospital/api/get_doctor_details.php?station_doctor_id=X
 * 
 * ดึงรายละเอียดแพทย์ในสถานี
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
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
    // ========================================
    // ✅ DATABASE CONNECTION
    // ========================================
    
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ========================================
    // ✅ GET QUERY PARAMETERS
    // ========================================

    $station_doctor_id = isset($_GET['station_doctor_id']) ? intval($_GET['station_doctor_id']) : 0;
    $doctor_id = isset($_GET['doctor_id']) ? intval($_GET['doctor_id']) : 0;
    $station_id = isset($_GET['station_id']) ? intval($_GET['station_id']) : 0;

    if ($station_doctor_id <= 0 && $doctor_id <= 0) {
        throw new Exception('ต้องระบุ station_doctor_id หรือ doctor_id');
    }

    // ========================================
    // ✅ FETCH DOCTOR DETAILS
    // ========================================

    if ($station_doctor_id > 0) {
        $query = "
            SELECT 
                sd.station_doctor_id,
                sd.station_id,
                sd.doctor_id,
                sd.doctor_code,
                sd.doctor_name,
                sd.doctor_type,
                sd.specialization,
                sd.work_date,
                sd.work_start_time,
                sd.work_end_time,
                sd.break_start_time,
                sd.break_end_time,
                sd.room_id,
                sd.assigned_room_id,
                sd.status,
                sd.is_active,
                sd.create_date,
                sd.update_date,
                s.station_name,
                s.floor,
                sr.room_name,
                sr.room_number
            FROM station_doctors sd
            LEFT JOIN stations s ON sd.station_id = s.station_id
            LEFT JOIN station_rooms sr ON sd.assigned_room_id = sr.room_id
            WHERE sd.station_doctor_id = :station_doctor_id
            LIMIT 1
        ";

        $stmt = $pdo->prepare($query);
        $stmt->execute([':station_doctor_id' => $station_doctor_id]);
    } else {
        // Search by doctor_id
        $query = "
            SELECT 
                sd.station_doctor_id,
                sd.station_id,
                sd.doctor_id,
                sd.doctor_code,
                sd.doctor_name,
                sd.doctor_type,
                sd.specialization,
                sd.work_date,
                sd.work_start_time,
                sd.work_end_time,
                sd.break_start_time,
                sd.break_end_time,
                sd.room_id,
                sd.assigned_room_id,
                sd.status,
                sd.is_active,
                sd.create_date,
                sd.update_date,
                s.station_name,
                s.floor,
                sr.room_name,
                sr.room_number
            FROM station_doctors sd
            LEFT JOIN stations s ON sd.station_id = s.station_id
            LEFT JOIN station_rooms sr ON sd.assigned_room_id = sr.room_id
            WHERE sd.doctor_id = :doctor_id
        ";

        if ($station_id > 0) {
            $query .= " AND sd.station_id = :station_id";
        }

        $query .= " ORDER BY sd.work_date DESC LIMIT 1";

        $stmt = $pdo->prepare($query);
        
        $params = [':doctor_id' => $doctor_id];
        if ($station_id > 0) {
            $params[':station_id'] = $station_id;
        }
        
        $stmt->execute($params);
    }

    $doctor = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$doctor) {
        throw new Exception('ไม่พบแพทย์ที่ระบุ');
    }

    // ========================================
    // ✅ SUCCESS RESPONSE
    // ========================================

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'ดึงข้อมูลสำเร็จ',
        'data' => $doctor
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    // ========================================
    // ✅ ERROR HANDLING
    // ========================================

    error_log("Error in get_doctor_details.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'data' => []
    ], JSON_UNESCAPED_UNICODE);
}

exit();
?>