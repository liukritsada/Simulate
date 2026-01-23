<?php
/**
 * ✅ FIXED: get_station_staff_list.php
 * กรองข้อมูลพนักงานตาม work_date ที่ส่งมา
 * แก้ไข: ใช้ชื่อตารางที่ถูกต้อง (station_rooms แทน room)
 */

header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Asia/Bangkok');
try {
    // ✅ รับ parameters
    $station_id = isset($_GET['station_id']) ? intval($_GET['station_id']) : 0;
    $work_date = isset($_GET['work_date']) ? $_GET['work_date'] : date('Y-m-d');
    
    if (!$station_id) {
        throw new Exception('station_id is required');
    }

    // ✅ เชื่อมต่อ database
    $conn = new mysqli('localhost', 'sa', '', 'hospitalstation');
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }

    // ✅ Query: ดึงพนักงานที่มี work_date ตรงกัน
    // แก้ไข: ใช้ station_rooms แทน room
    $sql = "SELECT 
                ss.station_staff_id,
                ss.station_id,
                ss.staff_id,
                ss.staff_name,
                ss.staff_type,
                ss.work_date,
                ss.work_start_time,
                ss.work_end_time,
                ss.break_start_time,
                ss.break_end_time,
                ss.is_active,
                ss.assigned_room_id,
                sr.room_name,
                CASE WHEN ss.work_date = ? THEN 1 ELSE 0 END as is_assigned_today
            FROM station_staff ss
            LEFT JOIN station_rooms sr ON ss.assigned_room_id = sr.room_id
            WHERE ss.station_id = ? 
            AND ss.work_date = ?
            AND ss.is_active = 1
            ORDER BY ss.staff_name ASC";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    // ✅ Bind parameters
    $stmt->bind_param('sis', $work_date, $station_id, $work_date);
    
    if (!$stmt->execute()) {
        throw new Exception('Execute failed: ' . $stmt->error);
    }

    $result = $stmt->get_result();
    $staff_list = [];

    while ($row = $result->fetch_assoc()) {
        // ✅ ตรวจสอบว่าวันที่ตรงกับ work_date ไหม
        if ($row['work_date'] === $work_date) {
            $staff_list[] = array(
                'station_staff_id' => (int)$row['station_staff_id'],
                'station_id' => (int)$row['station_id'],
                'staff_id' => (int)$row['staff_id'],
                'staff_name' => $row['staff_name'],
                'staff_type' => $row['staff_type'],
                'work_date' => $row['work_date'],
                'work_start_time' => $row['work_start_time'],
                'work_end_time' => $row['work_end_time'],
                'break_start_time' => $row['break_start_time'],
                'break_end_time' => $row['break_end_time'],
                'is_active' => (int)$row['is_active'],
                'room_name' => $row['room_name'],
                'is_assigned_today' => (int)$row['is_assigned_today'],
                'today_assignment' => array(
                    'station_staff_id' => (int)$row['station_staff_id'],
                    'work_start_time' => $row['work_start_time'],
                    'work_end_time' => $row['work_end_time'],
                    'break_start_time' => $row['break_start_time'],
                    'break_end_time' => $row['break_end_time']
                )
            );
        }
    }

    $stmt->close();
    $conn->close();

    // ✅ ส่งกลับ response
    echo json_encode([
        'success' => true,
        'message' => 'Staff list retrieved for date: ' . $work_date,
        'data' => $staff_list,
        'count' => count($staff_list),
        'date_filter' => $work_date
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'data' => []
    ]);
}
?>