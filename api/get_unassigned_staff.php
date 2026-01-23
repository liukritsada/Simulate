<?php
/**
 * API: Get Unassigned Staff
 * ✅ ใช้ station_staff.assigned_room_id แทน room_staff
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

$host = '127.0.0.1';
$port = '3306';
$dbname = 'hospitalstation';
$username = 'sa';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stationId = $_GET['station_id'] ?? null;
    $workDate = $_GET['work_date'] ?? date('Y-m-d');

    if (!$stationId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'station_id is required']);
        exit;
    }

    error_log("📍 Fetching staff for station_id: $stationId, date: $workDate");

    // ============================================================
    // ✅ ดึงพนักงานทั้งหมดจาก station_staff
    // ============================================================
    $allStaffStmt = $pdo->prepare("
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
            sr.room_name,
            sr.room_number
        FROM station_staff ss
        LEFT JOIN station_rooms sr ON ss.assigned_room_id = sr.room_id
        WHERE ss.station_id = :station_id
        AND ss.is_active = 1
        AND (ss.work_date IS NULL OR ss.work_date = :work_date)
        ORDER BY ss.staff_name
    ");
    $allStaffStmt->execute([
        ':station_id' => $stationId,
        ':work_date' => $workDate
    ]);
    $allStaff = $allStaffStmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("✓ All staff: " . count($allStaff));

    // ============================================================
    // ✅ แยก assigned และ unassigned
    // ============================================================
    $assigned = [];
    $unassigned = [];

    foreach ($allStaff as $staff) {
        if (!empty($staff['assigned_room_id'])) {
            $assigned[] = [
                'station_staff_id' => intval($staff['station_staff_id']),
                'staff_id' => $staff['staff_id'],
                'staff_name' => $staff['staff_name'],
                'staff_type' => $staff['staff_type'],
                'room_id' => intval($staff['assigned_room_id']),
                'room_name' => $staff['room_name'],
                'room_number' => $staff['room_number']
            ];
        } else {
            $unassigned[] = [
                'station_staff_id' => intval($staff['station_staff_id']),
                'staff_id' => $staff['staff_id'],
                'staff_name' => $staff['staff_name'],
                'staff_type' => $staff['staff_type'],
                'work_start_time' => $staff['work_start_time'],
                'work_end_time' => $staff['work_end_time'],
                'break_start_time' => $staff['break_start_time'],
                'break_end_time' => $staff['break_end_time'],
                'is_active' => intval($staff['is_active'])
            ];
        }
    }

    error_log("✓ Assigned staff: " . count($assigned));
    error_log("✓ Unassigned staff: " . count($unassigned));

    // ============================================================
    // ✅ ดึงรายชื่อห้อง
    // ============================================================
    $roomsStmt = $pdo->prepare("
        SELECT room_id, room_number, room_name 
        FROM station_rooms 
        WHERE station_id = :station_id
        ORDER BY room_number
    ");
    $roomsStmt->execute([':station_id' => $stationId]);
    $rooms = $roomsStmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("✓ Rooms: " . count($rooms));

    echo json_encode([
        'success' => true,
        'data' => [
            'station_id' => $stationId,
            'work_date' => $workDate,
            'unassigned_staff' => $unassigned,
            'assigned_staff' => $assigned,
            'rooms' => $rooms,
            'summary' => [
                'total_staff' => count($allStaff),
                'assigned_count' => count($assigned),
                'unassigned_count' => count($unassigned),
                'total_rooms' => count($rooms)
            ]
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ Error in get_unassigned_staff: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>