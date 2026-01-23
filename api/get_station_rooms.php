<?php
// get_station_rooms.php - FIXED
// ✅ แก้ไขให้ใช้ station_patients แทน procedures

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
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $station_id = isset($_GET['station_id']) ? intval($_GET['station_id']) : 0;
    $only_available = isset($_GET['only_available']) ? $_GET['only_available'] === 'true' : false;
    $work_date = isset($_GET['work_date']) ? $_GET['work_date'] : date('Y-m-d');

    if ($station_id <= 0) {
        throw new Exception('ต้องระบุ station_id');
    }

    // ✅ Query ห้อง + พนักงาน + แพทย์
    $sql = "
        SELECT 
            sr.room_id,
            sr.room_number,
            sr.room_name,
            sr.station_id,
            s.station_name,
            
            -- นับพนักงานที่ assign ห้องนี้
            (SELECT COUNT(*) FROM station_staff 
             WHERE assigned_room_id = sr.room_id 
             AND work_date = :work_date 
             AND is_active = 1) as staff_count,
            
            -- นับแพทย์
            (SELECT COUNT(*) FROM station_doctors 
             WHERE assigned_room_id = sr.room_id 
             AND DATE(work_date) = :work_date 
             AND is_active = 1) as doctor_count,
            
            -- ✅ นับคนไข้ (ใช้ station_patients แทน procedures)
            (SELECT COUNT(*) FROM station_patients sp
             WHERE sp.room_id = sr.room_id AND sp.status != 'completed') as patient_count
        FROM station_rooms sr
        LEFT JOIN stations s ON sr.station_id = s.station_id
        WHERE sr.station_id = :station_id
        ORDER BY sr.room_number
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':station_id' => $station_id,
        ':work_date' => $work_date
    ]);
    $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ สำหรับแต่ละห้อง ดึงเวลาทำงาน
    $result = [];
    foreach ($rooms as $room) {
        // ✅ ดึงเวลาพนักงานจาก station_staff
        $staffTimeSql = "
            SELECT work_start_time, work_end_time
            FROM station_staff
            WHERE assigned_room_id = :room_id 
            AND work_date = :work_date 
            AND is_active = 1
        ";
        $staffStmt = $pdo->prepare($staffTimeSql);
        $staffStmt->execute([':room_id' => $room['room_id'], ':work_date' => $work_date]);
        $staff_work_times = $staffStmt->fetchAll(PDO::FETCH_ASSOC);

        // ✅ ดึงเวลาแพทย์
        $doctorTimeSql = "
            SELECT work_start_time, work_end_time
            FROM station_doctors
            WHERE assigned_room_id = :room_id 
            AND DATE(work_date) = :work_date 
            AND is_active = 1
        ";
        $doctorStmt = $pdo->prepare($doctorTimeSql);
        $doctorStmt->execute([':room_id' => $room['room_id'], ':work_date' => $work_date]);
        $doctor_work_times = $doctorStmt->fetchAll(PDO::FETCH_ASSOC);

        // ✅ สร้าง object ส่งไป
        $result[] = [
            'room_id' => (int)$room['room_id'],
            'room_number' => $room['room_number'],
            'room_name' => $room['room_name'],
            'station_id' => (int)$room['station_id'],
            'station_name' => $room['station_name'],
            
            // ✅ 4 ฟิลด์ที่ JS ใช้
            'staff_count' => (int)$room['staff_count'],
            'doctor_count' => (int)$room['doctor_count'],
            'patient_count' => (int)$room['patient_count'],
            
            // ✅ เวลาทำงาน (ให้ JS ตรวจสอบ)
            'staff_work_times' => $staff_work_times,
            'doctor_work_times' => $doctor_work_times
        ];
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'ดึงข้อมูลห้องสำเร็จ',
        'data' => $result,
        'total' => count($result)
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'data' => []
    ], JSON_UNESCAPED_UNICODE);
}
exit();
?>