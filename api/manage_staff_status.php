<?php
/**
 * ✅ API: get_station_staff_status.php
 * ตำแหน่ง: /hospital/api/get_station_staff_status.php
 * ดึงข้อมูลพนักงานและสถานะของพนักงาน (7 status)
 */

// ✅ ตั้งค่า error handling
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// ✅ ตั้ง header ก่อน
header('Content-Type: application/json; charset=utf-8');

// ✅ Output buffering
ob_start();

try {
    // ✅ ตรวจสอบ parameter
    if (!isset($_GET['station_id'])) {
        throw new Exception('Missing parameter: station_id');
    }
    
    $station_id = intval($_GET['station_id']);
    
    if ($station_id <= 0) {
        throw new Exception('Invalid station_id: must be positive integer');
    }
    
    // ✅ เชื่อมต่อฐานข้อมูล
    $config_path = __DIR__ . '/db_config.php';
    
    if (!file_exists($config_path)) {
        throw new Exception('Config file not found: ' . $config_path);
    }
    
    require_once $config_path;
    
    if (!isset($conn) || !$conn) {
        throw new Exception('Database connection not established');
    }
    
    if ($conn->connect_error) {
        throw new Exception('Database connection error: ' . $conn->connect_error);
    }
    
    // ✅ เตรียมข้อมูล
    $current_date = date('Y-m-d');
    $current_time = date('H:i:s');
    
    error_log("get_station_staff_status: station_id=$station_id, time=$current_time, date=$current_date");
    
    // ✅ SQL Query - ใช้ station_staff โดยตรง (รองรับ 7 status)
    // ✅ ใช้ PHP variables ใน CASE WHEN เพื่อลดความซับซ้อนของ bind_param
    $sql = "
        SELECT 
            ss.station_staff_id,
            ss.staff_id,
            ss.staff_name,
            ss.staff_type,
            ss.work_start_time,
            ss.work_end_time,
            ss.break_start_time,
            ss.break_end_time,
            ss.status as current_status,
            ss.assigned_room_id,
            sr.room_name,
            rs.work_date,
            CASE 
                WHEN '$current_time' < ss.work_start_time
                    THEN 'waiting_to_start'
                WHEN ss.break_start_time IS NOT NULL 
                    AND ss.break_end_time IS NOT NULL
                    AND '$current_time' >= ss.break_start_time 
                    AND '$current_time' < ss.break_end_time 
                    THEN 'on_break'
                WHEN ss.assigned_room_id IS NOT NULL 
                    AND '$current_time' >= ss.work_end_time
                    THEN 'overtime'
                WHEN ss.assigned_room_id IS NOT NULL 
                    AND '$current_time' >= ss.work_start_time 
                    AND '$current_time' < ss.work_end_time 
                    THEN 'working'
                WHEN ss.assigned_room_id IS NULL
                    AND '$current_time' >= ss.work_start_time 
                    AND '$current_time' < ss.work_end_time
                    THEN 'available'
                WHEN '$current_time' >= ss.work_end_time
                    THEN 'offline'
                ELSE 'offline'
            END as calculated_status
        FROM station_staff ss
        LEFT JOIN station_rooms sr ON ss.assigned_room_id = sr.room_id
        LEFT JOIN room_staff rs ON ss.station_staff_id = rs.station_staff_id 
            AND rs.work_date = ?
        WHERE ss.station_id = ?
            AND ss.work_date = ?
            AND ss.is_active = 1
        ORDER BY ss.work_start_time ASC
    ";
    
    // ✅ Prepare statement
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception('Database prepare error: ' . $conn->error);
    }
    
    // ✅ Bind parameters (เหลือเพียง 3 parameters)
    $stmt->bind_param(
        'sis', // string, integer, string
        $current_date,  // 1 - work_date for room_staff join
        $station_id,    // 2 - WHERE station_id
        $current_date   // 3 - WHERE work_date
    );
    
    // ✅ Execute statement
    if (!$stmt->execute()) {
        throw new Exception('Database execute error: ' . $stmt->error);
    }
    
    // ✅ Get result
    $result = $stmt->get_result();
    
    if (!$result) {
        throw new Exception('Get result error: ' . $stmt->error);
    }
    
    // ✅ Process data
    $staff_list = [];
    $stats = [
        'total' => 0,
        'working' => 0,
        'available' => 0,
        'on_break' => 0,
        'overtime' => 0,
        'waiting_to_start' => 0,
        'offline' => 0
    ];
    
    while ($row = $result->fetch_assoc()) {
        // ✅ ใช้ calculated_status จาก CASE WHEN
        $status = $row['calculated_status'];
        $stats['total']++;
        
        if (isset($stats[$status])) {
            $stats[$status]++;
        }
        
        // ✅ เอาเฉพาะชั่วโมง:นาที (ตัด :วินาที)
        $work_start = $row['work_start_time'] ? substr($row['work_start_time'], 0, 5) : '08:00';
        $work_end = $row['work_end_time'] ? substr($row['work_end_time'], 0, 5) : '17:00';
        $break_start = $row['break_start_time'] ? substr($row['break_start_time'], 0, 5) : '12:00';
        $break_end = $row['break_end_time'] ? substr($row['break_end_time'], 0, 5) : '13:00';
        
        $staff_list[] = [
            'station_staff_id' => intval($row['station_staff_id']),
            'staff_id' => $row['staff_id'] ? intval($row['staff_id']) : null,
            'staff_name' => $row['staff_name'] ?? 'Unknown',
            'staff_type' => $row['staff_type'] ?? 'Staff',
            'work_start_time' => $work_start,
            'work_end_time' => $work_end,
            'break_start_time' => $break_start,
            'break_end_time' => $break_end,
            'status' => $status,
            'current_status_db' => $row['current_status'],
            'assigned_room_id' => $row['assigned_room_id'] ? intval($row['assigned_room_id']) : null,
            'room_name' => $row['room_name'],
            'work_date' => $row['work_date']
        ];
    }
    
    // ✅ ล้าง output buffer
    ob_end_clean();
    
    // ✅ ส่ง response สำเร็จ
    echo json_encode([
        'success' => true,
        'message' => 'ดึงข้อมูลสำเร็จ',
        'data' => [
            'staff' => $staff_list,
            'stats' => $stats,
            'timestamp' => date('c'),
            'current_time' => substr($current_time, 0, 5),
            'current_date' => $current_date,
            'station_id' => $station_id
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
    // ✅ ล้าง resource
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    // ✅ ล้าง output buffer
    ob_end_clean();
    
    // ✅ บันทึก error log
    error_log('get_station_staff_status.php ERROR: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    
    // ✅ ส่ง error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => 'STAFF_STATUS_ERROR',
        'debug_info' => [
            'file' => basename(__FILE__),
            'time' => date('c'),
            'station_id' => $_GET['station_id'] ?? 'not_set'
        ]
    ], JSON_UNESCAPED_UNICODE);
    
    exit(1);
}
?>