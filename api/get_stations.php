<?php
/**
 * ไฟล์: /api/get_stations.php
 * ✅ แก้ไข: ดึง total_staff จากฐานข้อมูลอย่างถูกต้อง
 * ✅ แก้ไข: เพิ่ม display_order และเรียงตามลำดับที่บันทึก
 */

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;port=3306;dbname=hospitalstation;charset=utf8mb4",
        'sa',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Handle date filtering
    $dateFrom = $_GET['date_from'] ?? date('Y-m-d');
    $dateTo = $_GET['date_to'] ?? date('Y-m-d');
    
    // Validate dates
    if (!strtotime($dateFrom) || !strtotime($dateTo)) {
        $dateFrom = $dateTo = date('Y-m-d');
    }

    error_log("📍 Loading stations for date range: {$dateFrom} to {$dateTo}");

    // ✅ ดึงข้อมูล stations พร้อม staff_count
    // ✅ เรียงตาม display_order (custom order) ถ้าไม่มี ให้เรียงตาม station_id
    $stmt = $pdo->prepare("
        SELECT 
            s.station_id,
            s.station_code,
            s.station_name,
            s.station_type,
            s.floor,
            s.room_count,
            s.department_id,
            COALESCE(s.department_id, 0) as department_id_value,
            s.default_wait_time,
            s.default_service_time,
            s.staff_count,
            s.display_order,
            
            -- ✅ นับ staff ในช่วงวันที่
            COALESCE(
                (SELECT COUNT(*) FROM station_staff 
                 WHERE station_id = s.station_id 
                 AND DATE(work_date) BETWEEN :dateFrom AND :dateTo
                 AND is_active = 1),
                0
            ) as total_staff,
            
            -- ✅ นับ doctors ในช่วงวันที่
            COALESCE(
                (SELECT COUNT(DISTINCT doctor_id) FROM station_doctors 
                 WHERE station_id = s.station_id 
                 AND DATE(work_date) BETWEEN :dateFrom AND :dateTo
                 AND is_active = 1),
                0
            ) as total_doctors,
            
            -- ✅ นับจำนวนผู้ป่วยที่กำลังรอ (ในช่วงวันที่)
            COALESCE(
                (SELECT COUNT(*) FROM station_patients 
                 WHERE station_id = s.station_id 
                 AND DATE(appointment_date) BETWEEN :dateFrom AND :dateTo
                 AND status IN ('waiting', 'in_process')),
                0
            ) as patient_count,
            
            -- ✅ คำนวณเวลารอคอยเฉลี่ย (นาที) สำหรับผู้ป่วยที่กำลังรอ
            COALESCE(
                (SELECT AVG(
                    CASE 
                        WHEN TIME_TO_SEC(TIMEDIFF(NOW(), arrival_time)) > 0 
                        THEN TIME_TO_SEC(TIMEDIFF(NOW(), arrival_time)) / 60 
                        ELSE 0 
                    END
                 ) FROM station_patients 
                 WHERE station_id = s.station_id 
                 AND DATE(appointment_date) BETWEEN :dateFrom AND :dateTo
                 AND status IN ('waiting', 'in_process')
                 AND arrival_time IS NOT NULL),
                0
            ) as avg_wait_time,
            
            -- ✅ นับจำนวนผู้ป่วยที่รอเกิน 60 นาที
            COALESCE(
                (SELECT COUNT(*) FROM station_patients 
                 WHERE station_id = s.station_id 
                 AND DATE(appointment_date) BETWEEN :dateFrom AND :dateTo
                 AND status IN ('waiting', 'in_process')
                 AND arrival_time IS NOT NULL
                 AND TIME_TO_SEC(TIMEDIFF(NOW(), arrival_time)) > 3600), -- 60 นาที
                0
            ) as long_wait_count
            
        FROM stations s
        ORDER BY 
            s.floor ASC,
            CASE WHEN s.display_order IS NULL THEN 1 ELSE 0 END ASC,
            s.display_order ASC,
            s.station_id ASC
    ");
    $stmt->execute([
        ':dateFrom' => $dateFrom,
        ':dateTo' => $dateTo
    ]);
    $stations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("✅ Found " . count($stations) . " stations");

    $stationsWithDetails = [];
    foreach ($stations as $station) {
        $stationId = $station['station_id'];
        error_log("  Processing station: {$station['station_code']} ({$station['station_name']})");

        // นับจำนวนห้อง
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM station_rooms WHERE station_id = :id");
        $stmt->execute([':id' => $stationId]);
        $roomResult = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalRooms = intval($roomResult['count']);

        // นับจำนวน procedures
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM station_procedures WHERE station_id = :id");
        $stmt->execute([':id' => $stationId]);
        $procResult = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalProcedures = intval($procResult['count']);

        // ✅ ดึง total_staff จาก subquery ข้างบน
        $totalStaff = intval($station['total_staff']);
        
        // ✅ ดึง total_doctors จาก subquery ข้างบน
        $totalDoctors = intval($station['total_doctors']);

        // ✅ ดึงข้อมูลแพทย์แต่ละคนจาก station_doctors (ในช่วงวันที่)
        $stmt = $pdo->prepare("
            SELECT 
                sd.station_doctor_id,
                sd.doctor_id,
                sd.doctor_name,
                sd.work_date,
                sd.work_start_time,
                sd.work_end_time,
                sd.break_start_time,
                sd.break_end_time,
                sd.is_active,
                sd.status,
                sd.assigned_room_id,
                sr.room_number,
                sr.room_name,
                CASE 
                    WHEN sd.assigned_room_id IS NOT NULL AND sr.room_name IS NOT NULL 
                    THEN CONCAT('ห้อง: ', sr.room_name)
                    ELSE 'ยังไม่ได้กำหนดห้อง'
                END as room_status
            FROM station_doctors sd
            LEFT JOIN station_rooms sr ON sd.assigned_room_id = sr.room_id
            WHERE sd.station_id = :id 
            AND DATE(sd.work_date) BETWEEN :dateFrom AND :dateTo
            AND sd.is_active = 1
            ORDER BY 
                CASE WHEN sd.assigned_room_id IS NULL THEN 1 ELSE 0 END,
                sr.room_number,
                sd.doctor_name
        ");
        $stmt->execute([
            ':id' => $stationId,
            ':dateFrom' => $dateFrom,
            ':dateTo' => $dateTo
        ]);
        $allDoctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // ✅ ดึง department_name จาก pdp database
        $departmentName = null;
        if ($station['department_id']) {
            try {
                $pdpPdo = new PDO(
                    "mysql:host=172.25.41.30;port=3306;dbname=pdp;charset=utf8",
                    'sa',
                    'abzolute',
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_TIMEOUT => 2
                    ]
                );
                
                $pdpStmt = $pdpPdo->prepare("
                    SELECT department_name_english 
                    FROM DEPARTMENT 
                    WHERE department_id = :id
                    LIMIT 1
                ");
                $pdpStmt->execute([':id' => $station['department_id']]);
                $deptResult = $pdpStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($deptResult) {
                    $departmentName = $deptResult['department_name_english'];
                }
            } catch (Exception $e) {
                error_log("⚠️ Warning: Could not connect to pdp database: " . $e->getMessage());
                $departmentName = "Dept #" . $station['department_id'];
            }
        }

        // ✅ รวมข้อมูลทั้งหมด
        $station['total_rooms'] = $totalRooms;
        $station['total_procedures'] = $totalProcedures;
        $station['total_staff'] = $totalStaff;  // ✅ ใช้ค่าที่นับจาก subquery
        $station['total_doctors'] = $totalDoctors;  // ✅ ใช้ค่าที่นับจาก subquery
        $station['department_name'] = $departmentName ?? 'N/A';
        $station['doctors_detail'] = $allDoctors;
        
        // ✅ เพิ่มข้อมูลผู้ป่วยและเวลารอคอย
        $station['patient_count'] = intval($station['patient_count']);
        $station['avg_wait_time'] = round(floatval($station['avg_wait_time']), 1);
        $station['long_wait_count'] = intval($station['long_wait_count']);

        error_log("    ✅ Rooms: $totalRooms, Procedures: $totalProcedures, Staff: $totalStaff, Doctors: $totalDoctors");
        
        // ✅ Log ข้อมูลแพทย์แต่ละคน
        if (count($allDoctors) > 0) {
            error_log("    👨‍⚕️ Doctors Detail (TODAY ONLY):");
            foreach ($allDoctors as $doctor) {
                $schedule = "N/A";
                if ($doctor['work_start_time'] && $doctor['work_end_time']) {
                    $workStart = substr($doctor['work_start_time'], 0, 5);
                    $workEnd = substr($doctor['work_end_time'], 0, 5);
                    $schedule = "$workStart - $workEnd";
                    
                    if ($doctor['break_start_time'] && $doctor['break_end_time']) {
                        $breakStart = substr($doctor['break_start_time'], 0, 5);
                        $breakEnd = substr($doctor['break_end_time'], 0, 5);
                        $schedule .= " (พัก: $breakStart - $breakEnd)";
                    }
                }
                
                $statusInfo = $doctor['status'] ? " [Status: {$doctor['status']}]" : "";
                $workDate = $doctor['work_date'] ?? 'N/A';
                
                error_log("      - {$doctor['doctor_name']}{$statusInfo} - {$doctor['room_status']} - วันที่: {$workDate} - เวลา: {$schedule}");
            }
        } else {
            error_log("    👨‍⚕️ ไม่มีแพทย์ในสถานีนี้ (วันนี้)");
        }

        $stationsWithDetails[] = $station;
    }

    error_log("✅ All stations prepared with details");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $stationsWithDetails,
        'count' => count($stationsWithDetails),
        'timestamp' => date('Y-m-d H:i:s'),
        'date_range' => ['from' => $dateFrom, 'to' => $dateTo],
        'note' => 'Staff and Doctors count for date range, ordered by display_order'
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    error_log("❌ Database Error in get_stations.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => "Database Error: " . $e->getMessage(),
        'error_code' => $e->getCode()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    error_log("❌ Error in get_stations.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>