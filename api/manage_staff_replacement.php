<?php
/**
 * 🔄 Manage Staff Replacement
 * - ลบพนักงานออกจากห้องเมื่อถึงเวลา break
 * - ลบพนักงานออกจากห้องเมื่อถึงเวลา end
 * - เพิ่มพนักงาน available เข้าแทน
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 0);
error_reporting(0);

$host = '127.0.0.1';
$dbname = 'hospitalstation';
$username = 'sa';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $input = json_decode(file_get_contents('php://input'), true);
    $current_date = $input['current_date'] ?? date('Y-m-d');
    $current_time = $input['current_time'] ?? date('H:i:s');

    error_log("🔄 manage_staff_replacement: date=$current_date, time=$current_time");

    $removed_staff = [];
    $replacement_staff = [];

    // ============================================
    // ✅ STEP 1: ลบ staff ที่ถึงเวลา break
    // ============================================
    $break_staff_query = "
        SELECT 
            station_staff_id,
            staff_name,
            assigned_room_id,
            break_start_time,
            break_end_time
        FROM station_staff
        WHERE is_active = 1
        AND status = 'working'
        AND assigned_room_id IS NOT NULL
        AND assigned_room_id > 0
        AND TIME(:current_time) >= TIME(COALESCE(break_start_time, '12:00:00'))
        AND TIME(:current_time) < TIME(COALESCE(break_end_time, '13:00:00'))
    ";

    $stmt = $pdo->prepare($break_staff_query);
    $stmt->execute([':current_time' => $current_time]);
    $break_staff_list = $stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("📊 Found " . count($break_staff_list) . " staff on break");

    foreach ($break_staff_list as $staff) {
        error_log("🔔 Staff on break: {$staff['staff_name']} (Room {$staff['assigned_room_id']})");

        try {
            // ✅ ลบ assignment (ให้ staff ไปพัก)
            $update_query = "
                UPDATE station_staff
                SET assigned_room_id = NULL,
                    status = 'break',
                    unassigned_at = NOW()
                WHERE station_staff_id = :id
            ";

            $update_stmt = $pdo->prepare($update_query);
            $update_stmt->execute([':id' => $staff['station_staff_id']]);

            $removed_staff[] = [
                'reason' => 'break',
                'staff_name' => $staff['staff_name'],
                'room_id' => $staff['assigned_room_id'],
                'break_time' => $staff['break_start_time'] . ' - ' . $staff['break_end_time']
            ];

            error_log("✅ Staff removed for break: {$staff['staff_name']}");

        } catch (Exception $e) {
            error_log("⚠️ Error removing staff on break: " . $e->getMessage());
        }
    }

    // ============================================
    // ✅ STEP 2: ลบ staff ที่ถึงเวลา end time
    // ============================================
    $end_time_query = "
        SELECT 
            station_staff_id,
            staff_name,
            assigned_room_id,
            work_end_time
        FROM station_staff
        WHERE is_active = 1
        AND status = 'working'
        AND assigned_room_id IS NOT NULL
        AND assigned_room_id > 0
        AND TIME(:current_time) >= TIME(COALESCE(work_end_time, '17:00:00'))
    ";

    $stmt = $pdo->prepare($end_time_query);
    $stmt->execute([':current_time' => $current_time]);
    $end_time_staff_list = $stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("📊 Found " . count($end_time_staff_list) . " staff with end time");

    foreach ($end_time_staff_list as $staff) {
        error_log("⏰ Staff end time: {$staff['staff_name']} (Room {$staff['assigned_room_id']})");

        try {
            // ✅ ลบ assignment (ให้ staff ออก)
            $update_query = "
                UPDATE station_staff
                SET assigned_room_id = NULL,
                    status = 'finished',
                    unassigned_at = NOW()
                WHERE station_staff_id = :id
            ";

            $update_stmt = $pdo->prepare($update_query);
            $update_stmt->execute([':id' => $staff['station_staff_id']]);

            $removed_staff[] = [
                'reason' => 'end_time',
                'staff_name' => $staff['staff_name'],
                'room_id' => $staff['assigned_room_id'],
                'work_end_time' => $staff['work_end_time']
            ];

            error_log("✅ Staff removed for end time: {$staff['staff_name']}");

        } catch (Exception $e) {
            error_log("⚠️ Error removing staff on end time: " . $e->getMessage());
        }
    }

    // ============================================
    // ✅ STEP 3: ค้นหาห้องที่ว่างแล้ว และเพิ่ม staff ใหม่
    // ============================================
    if (count($removed_staff) > 0) {
        error_log("🔍 Searching for empty rooms to fill...");

        $empty_rooms_query = "
            SELECT 
                sr.room_id, 
                sr.room_number,
                sr.room_name, 
                s.station_id, 
                s.station_name
            FROM station_rooms sr
            JOIN stations s ON sr.station_id = s.station_id
            WHERE sr.room_id NOT IN (
                SELECT DISTINCT assigned_room_id 
                FROM station_staff 
                WHERE assigned_room_id IS NOT NULL 
                AND assigned_room_id > 0
                AND is_active = 1
                AND status = 'working'
            )
        ";

        $empty_rooms = $pdo->prepare($empty_rooms_query);
        $empty_rooms->execute();
        $empty_rooms_list = $empty_rooms->fetchAll(PDO::FETCH_ASSOC);

        error_log("📊 Found " . count($empty_rooms_list) . " empty rooms");

        $already_assigned = [];

        foreach ($empty_rooms_list as $room) {
            error_log("🔍 Processing empty room {$room['room_id']} ({$room['room_name']})");

            // ✅ เลือก staff ที่ว่าง
            $available_staff_query = "
                SELECT 
                    ss.station_staff_id, 
                    ss.staff_name, 
                    ss.staff_type,
                    ss.work_start_time, 
                    ss.work_end_time
                FROM station_staff ss
                WHERE ss.station_id = :station_id 
                    AND ss.is_active = 1
                    AND (ss.work_date IS NULL OR ss.work_date = :current_date)
                    AND (ss.assigned_room_id IS NULL OR ss.assigned_room_id = 0)
                    AND ss.station_staff_id NOT IN (" . (empty($already_assigned) ? '0' : implode(',', $already_assigned)) . ")
                    AND TIME(:current_time) >= TIME(COALESCE(ss.work_start_time, '08:00:00'))
                    AND TIME(:current_time) < TIME(COALESCE(ss.work_end_time, '17:00:00'))
                    AND NOT (TIME(:current_time) >= TIME(COALESCE(ss.break_start_time, '12:00:00')) 
                             AND TIME(:current_time) < TIME(COALESCE(ss.break_end_time, '13:00:00')))
                ORDER BY ss.staff_name
                LIMIT 1
            ";

            $stmt = $pdo->prepare($available_staff_query);
            $stmt->execute([
                ':station_id' => $room['station_id'],
                ':current_date' => $current_date,
                ':current_time' => $current_time
            ]);

            $staff = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($staff) {
                error_log("✅ Found replacement staff: {$staff['staff_name']}");

                try {
                    $update_query = "
                        UPDATE station_staff 
                        SET assigned_room_id = :room_id,
                            status = 'working',
                            assigned_at = NOW()
                        WHERE station_staff_id = :station_staff_id
                    ";

                    $update_stmt = $pdo->prepare($update_query);
                    $update_stmt->execute([
                        ':room_id' => $room['room_id'],
                        ':station_staff_id' => $staff['station_staff_id']
                    ]);

                    $replacement_staff[] = [
                        'room_name' => $room['room_name'],
                        'staff_name' => $staff['staff_name'],
                        'staff_type' => $staff['staff_type']
                    ];

                    $already_assigned[] = $staff['station_staff_id'];

                    error_log("✅ Replacement assigned: {$staff['staff_name']} → {$room['room_name']}");

                } catch (Exception $e) {
                    error_log("⚠️ Error assigning replacement: " . $e->getMessage());
                }
            } else {
                error_log("⚠️ No available staff for replacement");
            }
        }
    }

    // ============================================
    // ✅ SUCCESS RESPONSE
    // ============================================
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'จัดการพนักงานเสร็จสิ้น',
        'data' => [
            'removed_count' => count($removed_staff),
            'replacement_count' => count($replacement_staff),
            'removed_staff' => $removed_staff,
            'replacement_staff' => $replacement_staff,
            'current_time' => $current_time,
            'current_date' => $current_date,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ Error in manage_staff_replacement: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'current_time' => $current_time ?? null,
        'current_date' => $current_date ?? null
    ], JSON_UNESCAPED_UNICODE);
}
?>