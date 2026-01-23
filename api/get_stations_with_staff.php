<?php
/**
 * 📊 API: Get Stations with Staff Count (V3 - TODAY ONLY)
 * ดึงข้อมูลสถานีพร้อมจำนวนพนักงาน วันนี้เท่านั้น
 * ✅ Filter by work_date = CURDATE()
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

try {
    // ต่อฐานข้อมูล
    $host = '127.0.0.1';
    $db = 'hospitalstation';
    $user = 'sa';
    $pass = '';

    $conn = new mysqli($host, $user, $pass, $db);
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    $conn->set_charset("utf8mb4");
    $conn->query("SET time_zone = '+07:00'");

    // ✅ ดึงข้อมูลสถานี พร้อมนับพนักงาน วันนี้เท่านั้น
    $query = "
        SELECT 
            s.station_id,
            s.station_name,
            s.station_code,
            s.station_type,
            s.floor,
            s.department_id,
            s.room_count,
            s.staff_count AS staff_count_config,
            s.require_doctor,
            s.default_wait_time,
            s.default_service_time,
            
            -- ✅ นับพนักงาน วันนี้ (work_date = CURDATE() AND is_active = 1)
            (SELECT COUNT(*) 
             FROM station_staff ss
             WHERE ss.station_id = s.station_id 
             AND DATE(ss.work_date) = CURDATE()
             AND ss.is_active = 1) as total_staff,
            
            -- ✅ นับแพทย์ วันนี้ (work_date = CURDATE() AND is_active = 1)
            (SELECT COUNT(*) 
             FROM station_doctors sd
             WHERE sd.station_id = s.station_id 
             AND DATE(sd.work_date) = CURDATE()
             AND sd.is_active = 1) as total_doctors,
            
            -- ✅ นับห้องจาก station_rooms
            (SELECT COUNT(*) 
             FROM station_rooms sr
             WHERE sr.station_id = s.station_id) as actual_room_count
            
        FROM stations s
        ORDER BY s.floor, s.station_id
    ";

    $result = $conn->query($query);

    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $stations = array();
    while ($row = $result->fetch_assoc()) {
        // ✅ แปลงค่าเป็น integer
        $row['station_id'] = intval($row['station_id']);
        $row['floor'] = intval($row['floor']);
        $row['room_count'] = intval($row['room_count']);
        $row['staff_count_config'] = intval($row['staff_count_config']);
        $row['total_staff'] = intval($row['total_staff']);
        $row['total_doctors'] = intval($row['total_doctors']);
        $row['actual_room_count'] = intval($row['actual_room_count']);
        $row['department_id'] = intval($row['department_id']);
        $row['require_doctor'] = intval($row['require_doctor']);
        $row['default_wait_time'] = intval($row['default_wait_time']);
        $row['default_service_time'] = intval($row['default_service_time']);
        
        // ✅ Alias untuk backward compatibility
        $row['staff_count'] = $row['total_staff']; // Use actual count TODAY
        $row['doctor_count'] = $row['total_doctors']; // Use actual count TODAY
        
        $stations[] = $row;
    }

    $conn->close();

    // ✅ ส่งผลลัพธ์
    echo json_encode([
        'success' => true,
        'message' => 'Stations loaded successfully (Today only)',
        'data' => $stations,
        'count' => count($stations),
        'today' => date('Y-m-d'),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'data' => [],
        'error_code' => 500
    ], JSON_UNESCAPED_UNICODE);
}
?>