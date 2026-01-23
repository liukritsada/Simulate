<?php
/**
 * API: Get Available Staff for Room Assignment
 * ✅ ดึงพนักงานจาก station_id ที่ห้องประจำโดยตรง
 * ✅ ดึงทั้งพนักงานถาวร (work_date IS NULL) และพนักงานที่มีวันทำงานวันนี้
 * ✅ Filter: is_active = 1 (พนักงานที่ยังคงการทำงาน)
 * ✅ Filter: ไม่อยู่ในช่วงพักเบรค
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
error_reporting(0);

$host = '127.0.0.1';
$port = '3306';
$dbname = 'hospitalstation';
$username = 'sa';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $roomId = isset($_GET['room_id']) ? intval($_GET['room_id']) : 0;
    $workDate = isset($_GET['work_date']) ? $_GET['work_date'] : date('Y-m-d');
    $currentTime = date('H:i:s');

    if ($roomId <= 0) {
        throw new Exception('Invalid room_id');
    }

    // ✅ Validate work_date format
    $dateObj = DateTime::createFromFormat('Y-m-d', $workDate);
    if (!$dateObj || $dateObj->format('Y-m-d') !== $workDate) {
        throw new Exception("Invalid work_date format: $workDate. Expected: YYYY-MM-DD");
    }

    error_log("🔍 Fetching available staff for room_id: $roomId, work_date: $workDate, current_time: $currentTime");

    // 1️⃣ Get room's station_id
    $roomStmt = $pdo->prepare("
        SELECT sr.station_id, s.station_name
        FROM station_rooms sr
        INNER JOIN stations s ON sr.station_id = s.station_id
        WHERE sr.room_id = :room_id
    ");
    $roomStmt->execute([':room_id' => $roomId]);
    $roomData = $roomStmt->fetch(PDO::FETCH_ASSOC);

    if (!$roomData) {
        throw new Exception('Room not found');
    }

    $stationId = $roomData['station_id'];
    $stationName = $roomData['station_name'];

    error_log("✅ Room $roomId belongs to station $stationId ($stationName)");

    // 2️⃣ Get ALL staff in this station
    // ✅ Filter: assigned_room_id IS NULL or 0 (ยังไม่ assign ห้อง)
    // ✅ Filter: พนักงานถาวร (work_date IS NULL) หรือพนักงานที่มีวันทำงานตรงกับวันที่ระบุ
    // ✅ Filter: is_active = 1 (พนักงานที่ยังคงการทำงาน)
    // ✅ Filter: ไม่อยู่ในช่วงพักเบรค
    $staffStmt = $pdo->prepare("
        SELECT 
            ss.station_staff_id,
            ss.staff_id,
            ss.staff_name,
            ss.staff_type,
            ss.work_start_time,
            ss.work_end_time,
            ss.break_start_time,
            ss.break_end_time,
            ss.is_active,
            ss.assigned_room_id,
            ss.work_date
        FROM station_staff ss
        WHERE ss.station_id = :station_id
            AND (ss.work_date IS NULL OR ss.work_date = :work_date)
            AND (ss.assigned_room_id IS NULL OR ss.assigned_room_id = 0 OR ss.assigned_room_id = '')
            AND ss.is_active = 1
            AND NOT (:current_time BETWEEN ss.break_start_time AND ss.break_end_time)
        ORDER BY ss.staff_name
    ");
    
    $staffStmt->execute([
        ':station_id' => $stationId,
        ':work_date' => $workDate,
        ':current_time' => $currentTime
    ]);
    $staffList = $staffStmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("📊 Total available staff in station $stationId for date $workDate: " . count($staffList));

    // 3️⃣ Debug: If no staff found, show all staff in this station
    if (empty($staffList)) {
        error_log("⚠️ No available staff found. Checking all staff...");
        
        $debugStmt = $pdo->prepare("
            SELECT 
                station_staff_id,
                staff_name,
                assigned_room_id,
                is_active,
                work_date
            FROM station_staff 
            WHERE station_id = :station_id
        ");
        $debugStmt->execute([
            ':station_id' => $stationId
        ]);
        $allStaff = $debugStmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("📋 All staff in station (with details): " . json_encode($allStaff));
        
        // Count by assigned status
        $assignedCount = count(array_filter($allStaff, function($s) {
            return !empty($s['assigned_room_id']) && $s['assigned_room_id'] != 0;
        }));
        
        $notActiveCount = count(array_filter($allStaff, function($s) {
            return $s['is_active'] == 0;
        }));
        
        error_log("📈 Summary: Total=" . count($allStaff) . ", Assigned=$assignedCount, NotActive=$notActiveCount, Available=" . (count($allStaff) - $assignedCount - $notActiveCount));
    } else {
        foreach ($staffList as $idx => $staff) {
            $workDateInfo = $staff['work_date'] ?? 'ถาวร';
            error_log("  [$idx] ID={$staff['station_staff_id']}, Name={$staff['staff_name']}, Active={$staff['is_active']}, AssignedRoom={$staff['assigned_room_id']}, WorkDate=$workDateInfo");
        }
    }

    // 4️⃣ Format response
    $formattedStaff = array_map(function($staff) {
        return [
            'station_staff_id' => (int)$staff['station_staff_id'],
            'staff_id' => $staff['staff_id'] ? (int)$staff['staff_id'] : null,
            'staff_name' => $staff['staff_name'],
            'staff_type' => $staff['staff_type'] ?? 'Staff',
            'work_start_time' => $staff['work_start_time'] ?? '08:00:00',
            'work_end_time' => $staff['work_end_time'] ?? '17:00:00',
            'break_start_time' => $staff['break_start_time'] ?? '12:00:00',
            'break_end_time' => $staff['break_end_time'] ?? '13:00:00',
            'is_active' => (int)$staff['is_active'],
            'work_date' => $staff['work_date'] ?? null
        ];
    }, $staffList);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $formattedStaff,
        'count' => count($formattedStaff),
        'station_id' => (int)$stationId,
        'station_name' => $stationName,
        'work_date' => $workDate
    ], JSON_UNESCAPED_UNICODE);
    exit;

} catch (Exception $e) {
    error_log("❌ Error in get_available_staff.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'data' => []
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
?>
