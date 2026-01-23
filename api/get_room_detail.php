<?php
/**
 * 🚪 GET ROOM DETAIL API - FIXED VERSION
 * ✅ Now includes is_active in equipment query
 * ✅ Includes room_procedure_id in procedures
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

    $room_id = isset($_GET['room_id']) ? intval($_GET['room_id']) : 0;
    $work_date = isset($_GET['work_date']) ? $_GET['work_date'] : date('Y-m-d');

    if ($room_id <= 0) {
        throw new Exception('ต้องระบุ room_id');
    }

    // ✅ Get room info
    $roomSql = "
        SELECT 
            sr.room_id,
            sr.room_number,
            sr.room_name,
            sr.station_id,
            s.station_name,
            s.floor
        FROM station_rooms sr
        LEFT JOIN stations s ON sr.station_id = s.station_id
        WHERE sr.room_id = :room_id
    ";
    
    $stmt = $pdo->prepare($roomSql);
    $stmt->execute([':room_id' => $room_id]);
    $room = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$room) {
        throw new Exception('ไม่พบ room');
    }

    // ✅ Get staff in room (basic columns only)
    $staffSql = "
        SELECT 
            station_staff_id,
            staff_name,
            work_start_time,
            work_end_time,
            break_start_time,
            break_end_time,
            status
        FROM station_staff
        WHERE assigned_room_id = :room_id
          AND DATE(work_date) = :work_date
          AND is_active = 1
        ORDER BY staff_name
    ";
    
    $stmt = $pdo->prepare($staffSql);
    $stmt->execute([':room_id' => $room_id, ':work_date' => $work_date]);
    $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ Get doctors in room (basic columns only)
    $doctorSql = "
        SELECT 
            station_doctor_id,
            doctor_name,
            doctor_type,
            specialization,
            work_start_time,
            work_end_time,
            break_start_time,
            break_end_time,
            status
        FROM station_doctors
        WHERE assigned_room_id = :room_id
          AND DATE(work_date) = :work_date
          AND is_active = 1
        ORDER BY doctor_name
    ";
    
    $stmt = $pdo->prepare($doctorSql);
    $stmt->execute([':room_id' => $room_id, ':work_date' => $work_date]);
    $doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ Get equipment in room - FIXED: ADDED is_active
    $equipmentSql = "
        SELECT 
            equipment_id,
            room_id,
            equipment_name,
            require_staff,
            is_active
        FROM room_equipment
        WHERE room_id = :room_id
        ORDER BY equipment_name
    ";
    
    $stmt = $pdo->prepare($equipmentSql);
    $stmt->execute([':room_id' => $room_id]);
    $equipment = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ Convert to int for proper JSON
    foreach ($equipment as &$eq) {
        $eq['is_active'] = intval($eq['is_active']);
        $eq['require_staff'] = intval($eq['require_staff']);
    }

    // ✅ Get procedures for room - FIXED: Added room_procedure_id + room_id
    $proceduresSql = "
        SELECT 
            room_procedure_id,
            room_id,
            procedure_id,
            procedure_name,
            procedure_type,
            wait_time,
            procedure_time,
            Time_target,
            staff_required,
            equipment_required
        FROM room_procedures
        WHERE room_id = :room_id
        ORDER BY procedure_name
    ";
    
    $stmt = $pdo->prepare($proceduresSql);
    $stmt->execute([':room_id' => $room_id]);
    $procedures = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ Get patients in room
    $patientsSql = "
        SELECT 
            patient_id,
            patient_name,
            hn,
            status
        FROM station_patients
        WHERE room_id = :room_id
        ORDER BY patient_name
    ";
    
    $stmt = $pdo->prepare($patientsSql);
    $stmt->execute([':room_id' => $room_id]);
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ Get staff work times for room status
    $staffWorkTimesSql = "
        SELECT 
            work_start_time,
            work_end_time
        FROM station_staff
        WHERE assigned_room_id = :room_id
          AND DATE(work_date) = :work_date
          AND is_active = 1
          AND work_start_time IS NOT NULL
    ";
    
    $stmt = $pdo->prepare($staffWorkTimesSql);
    $stmt->execute([':room_id' => $room_id, ':work_date' => $work_date]);
    $staff_work_times = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ Get doctor work times for room status
    $doctorWorkTimesSql = "
        SELECT 
            work_start_time,
            work_end_time
        FROM station_doctors
        WHERE assigned_room_id = :room_id
          AND DATE(work_date) = :work_date
          AND is_active = 1
          AND work_start_time IS NOT NULL
    ";
    
    $stmt = $pdo->prepare($doctorWorkTimesSql);
    $stmt->execute([':room_id' => $room_id, ':work_date' => $work_date]);
    $doctor_work_times = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ Send response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'ดึงข้อมูลห้องสำเร็จ',
        'data' => [
            'room' => $room,
            'staff' => $staff,
            'doctors' => $doctors,
            'equipment' => $equipment,  // ✅ NOW INCLUDES is_active
            'procedures' => $procedures,
            'patients' => $patients,
            'staff_work_times' => $staff_work_times,
            'doctor_work_times' => $doctor_work_times,
            'counts' => [
                'staff' => count($staff),
                'doctors' => count($doctors),
                'equipment' => count($equipment),
                'patients' => count($patients)
            ]
        ]
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