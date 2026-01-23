<?php
/**
 * ✅ get_station_detail.php - WITH PROCEDUREPDP_ID
 * เพิ่ม Procedurepdp_id เพื่อรู้ว่า procedure มาจาก PDP ตัวไหน
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
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $station_id = isset($_GET['station_id']) ? intval($_GET['station_id']) : 0;
    $work_date = isset($_GET['work_date']) ? $_GET['work_date'] : date('Y-m-d');

    if ($station_id <= 0) {
        throw new Exception('ต้องระบุ station_id');
    }

    // ดึงข้อมูล Station
    $stationSql = "SELECT * FROM stations WHERE station_id = :station_id";
    $stmt = $pdo->prepare($stationSql);
    $stmt->execute([':station_id' => $station_id]);
    $station = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$station) {
        throw new Exception('ไม่พบ Station');
    }

    // Query ห้อง + พนักงาน + แพทย์ + เครื่องมือ
    $sql = "
        SELECT 
            sr.room_id,
            sr.room_number,
            sr.room_name,
            sr.station_id,
            s.station_name,
            
            (SELECT COUNT(*) FROM station_staff 
             WHERE assigned_room_id = sr.room_id 
               AND station_id = :station_id 
               AND DATE(work_date) = :work_date
               AND is_active = 1
               AND work_start_time IS NOT NULL) as staff_count,
            
            (SELECT COUNT(*) FROM station_doctors 
             WHERE assigned_room_id = sr.room_id 
               AND DATE(work_date) = :work_date
               AND is_active = 1
               AND work_start_time IS NOT NULL) as doctor_count,
            
            (SELECT COUNT(*) 
             FROM station_patients 
             WHERE room_id = sr.room_id) as patient_count,
            
            (SELECT CONCAT('[', GROUP_CONCAT(
                CONCAT('{\"equipment_id\":', equipment_id, 
                       ',\"equipment_name\":\"', equipment_name, 
                       '\",\"require_staff\":', COALESCE(require_staff, 0), '}')
            ), ']') FROM room_equipment
            WHERE room_id = sr.room_id AND is_active = 1) as equipment_list
            
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

    // ✅ ดึง station_procedures พร้อม Procedurepdp_id
    $stationProceduresSql = "
        SELECT 
            procedure_id,
            Procedurepdp_id,
            procedure_name,
            wait_time,
            procedure_time,
            staff_required,
            equipment_required,
            Time_target
        FROM station_procedures
        WHERE station_id = :station_id
        ORDER BY procedure_name ASC
    ";
    $stationProceduresStmt = $pdo->prepare($stationProceduresSql);
    $stationProceduresStmt->execute([':station_id' => $station_id]);
    $station_procedures = $stationProceduresStmt->fetchAll(PDO::FETCH_ASSOC);

    // สร้างรายละเอียดแต่ละห้อง + หัตถการ
    $result_rooms = [];
    foreach ($rooms as $room) {
        // ดึงเวลาพนักงาน
        $staffTimeSql = "
            SELECT 
                work_start_time,
                work_end_time
            FROM station_staff
            WHERE assigned_room_id = :room_id 
              AND station_id = :station_id 
              AND DATE(work_date) = :work_date
              AND is_active = 1
              AND work_start_time IS NOT NULL
        ";
        $staffStmt = $pdo->prepare($staffTimeSql);
        $staffStmt->execute([
            ':room_id' => $room['room_id'], 
            ':station_id' => $station_id,
            ':work_date' => $work_date
        ]);
        $staff_work_times = $staffStmt->fetchAll(PDO::FETCH_ASSOC);

        // ดึงเวลาแพทย์
        $doctorTimeSql = "
            SELECT 
                work_start_time,
                work_end_time
            FROM station_doctors
            WHERE assigned_room_id = :room_id 
              AND DATE(work_date) = :work_date
              AND is_active = 1
              AND work_start_time IS NOT NULL
        ";
        $doctorStmt = $pdo->prepare($doctorTimeSql);
        $doctorStmt->execute([
            ':room_id' => $room['room_id'], 
            ':work_date' => $work_date
        ]);
        $doctor_work_times = $doctorStmt->fetchAll(PDO::FETCH_ASSOC);

        // ✅ ดึง room_procedures พร้อม Procedurepdp_id (จาก JOIN station_procedures)
        $roomProceduresSql = "
            SELECT 
                rp.room_procedure_id,
                rp.room_id,
                rp.procedure_id,
                rp.procedure_type,
                rp.procedure_name,
                rp.wait_time,
                rp.procedure_time,
                rp.staff_required,
                rp.equipment_required,
                sp.Procedurepdp_id
            FROM room_procedures rp
            LEFT JOIN station_procedures sp ON rp.procedure_id = sp.procedure_id
            WHERE rp.room_id = :room_id
            ORDER BY rp.procedure_name ASC
        ";
        $roomProceduresStmt = $pdo->prepare($roomProceduresSql);
        $roomProceduresStmt->execute([':room_id' => $room['room_id']]);
        $room_procedures = $roomProceduresStmt->fetchAll(PDO::FETCH_ASSOC);

        // รวม station_procedures + room_procedures
        $all_procedures = array_merge($room_procedures, $station_procedures);

        // สร้าง object ส่งไป
        $result_rooms[] = [
            'room_id' => (int)$room['room_id'],
            'room_number' => $room['room_number'],
            'room_name' => $room['room_name'],
            'station_id' => (int)$room['station_id'],
            'station_name' => $room['station_name'],
            
            'staff_count' => (int)$room['staff_count'],
            'doctor_count' => (int)$room['doctor_count'],
            'patient_count' => (int)$room['patient_count'],
            
            'staff_work_times' => $staff_work_times,
            'doctor_work_times' => $doctor_work_times,
            
            'station_procedures' => $station_procedures,
            'room_procedures' => $room_procedures,
            'all_procedures' => $all_procedures
        ];
    }

    // ส่งข้อมูลกลับ
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'ดึงข้อมูล Station สำเร็จ',
        'data' => [
            'station' => $station,
            'station_procedures' => $station_procedures,
            'rooms' => $result_rooms,
            'total_rooms' => count($result_rooms),
            'total_station_procedures' => count($station_procedures)
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'data' => []
    ], JSON_UNESCAPED_UNICODE);
}
exit();
?>