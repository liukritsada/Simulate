<?php
/**
 * API: Get Station Staff
 * Get staff data with OT information and status from database
 * 
 * GET: /hospital/api/get_station_staff.php?station_id=77&work_date=2026-01-08
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

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
    // ========================================
    // 1: DATABASE CONNECTION
    // ========================================
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ========================================
    // 2: GET PARAMETERS
    // ========================================
    $stationId = intval($_GET['station_id'] ?? 0);
    $workDate = $_GET['work_date'] ?? date('Y-m-d');

    if ($stationId <= 0) {
        throw new Exception('Invalid station_id');
    }

    // ========================================
    // 3: QUERY SELECT STAFF WITH OT DATA
    // ========================================
    // Added: status, ot_start_time, ot_end_time, ot_date
    $query = "
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
            ss.assigned_at,
            ss.assigned_room_id as room_id,
            ss.status,
            ss.ot_start_time,
            ss.ot_end_time,
            ss.ot_date,
            sr.room_name,
            sr.room_number
        FROM station_staff ss
        LEFT JOIN station_rooms sr ON ss.assigned_room_id = sr.room_id
        WHERE ss.station_id = :station_id 
        AND ss.is_active = 1
        AND (ss.work_date IS NULL OR ss.work_date = :work_date)
        ORDER BY ss.staff_name ASC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':station_id' => $stationId,
        ':work_date' => $workDate
    ]);
    $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ========================================
    // 4: COUNT STATISTICS
    // ========================================
    $available = 0;
    $working = 0;
    $on_break = 0;
    $overtime = 0;

    foreach ($staff as $s) {
        $status = isset($s['status']) ? strtolower($s['status']) : 'available';
        
        switch ($status) {
            case 'overtime':
                $overtime++;
                break;
            case 'working':
                $working++;
                break;
            case 'on_break':
                $on_break++;
                break;
            default:
                $available++;
                break;
        }
    }

    // ========================================
    // 5: RETURN SUCCESS
    // ========================================
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'staff' => $staff,
            'stats' => [
                'available' => $available,
                'working' => $working,
                'on_break' => $on_break,
                'overtime' => $overtime,
                'total' => count($staff)
            ]
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>