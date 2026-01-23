<?php
/**
 * ✅ manage_break_replacement.php
 * จัดการการแทนพนักงานเบรค
 * - เมื่อเข้าพักเบรค → ลบออกจากห้อง + เรียกคนแทน
 * - เมื่อจบพักเบรค → คืนห้องเดิม
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
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

    error_log("=== MANAGE BREAK REPLACEMENT START ===");
    error_log("📊 date=$current_date, time=$current_time");

    // ✅ 1. ค้นหาพนักงานที่เพิ่งเข้าพักเบรค (status เปลี่ยนจาก working → on_break)
    $on_break_query = "
        SELECT 
            ss.station_staff_id,
            ss.staff_name,
            ss.assigned_room_id,
            ss.status,
            ss.break_start_time,
            ss.break_end_time,
            sr.room_name
        FROM station_staff ss
        LEFT JOIN station_rooms sr ON ss.assigned_room_id = sr.room_id
        WHERE ss.work_date = ?
        AND ss.is_active = 1
        AND ss.status = 'on_break'
        AND ss.assigned_room_id IS NOT NULL
        AND ss.assigned_room_id > 0
    ";
    
    $stmt = $pdo->prepare($on_break_query);
    $stmt->execute([$current_date]);
    $on_break_staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("📋 Found " . count($on_break_staff) . " staff on break with rooms");

    $replacements = [];
    $replacement_count = 0;

    // ✅ 2. สำหรับพนักงานที่อยู่เบรค → ลบ room + เรียกคนแทน
    foreach ($on_break_staff as $staff) {
        error_log("🍽️ Processing: {$staff['staff_name']} (Room: {$staff['room_name']})");

        // ✅ 2.1 บันทึก room ID ไว้เพื่อคืนภายหลัง
        $room_id = $staff['assigned_room_id'];
        
        // ✅ 2.2 ลบ room assignment สำหรับพนักงานที่อยู่เบรค
        $remove_stmt = $pdo->prepare("
            UPDATE station_staff
            SET assigned_room_id = NULL,
                break_room_id = ?
            WHERE station_staff_id = ?
        ");
        $remove_stmt->execute([$room_id, $staff['station_staff_id']]);

        error_log("   ❌ Removed from room: {$staff['assigned_room_id']}");

        // ✅ 2.3 ค้นหาพนักงานว่างจากสถานีเดียวกัน
        $station_id_query = "SELECT station_id FROM station_staff WHERE station_staff_id = ?";
        $station_stmt = $pdo->prepare($station_id_query);
        $station_stmt->execute([$staff['station_staff_id']]);
        $station_data = $station_stmt->fetch(PDO::FETCH_ASSOC);
        $station_id = $station_data['station_id'];

        // ✅ 2.4 หาพนักงานว่างแทน (status = 'available')
        $replacement_query = "
            SELECT 
                ss.station_staff_id,
                ss.staff_name,
                ss.status
            FROM station_staff ss
            WHERE ss.station_id = ?
            AND ss.work_date = ?
            AND ss.is_active = 1
            AND ss.status = 'available'
            AND (ss.assigned_room_id IS NULL OR ss.assigned_room_id = 0)
            ORDER BY ss.staff_name
            LIMIT 1
        ";
        
        $repl_stmt = $pdo->prepare($replacement_query);
        $repl_stmt->execute([$station_id, $current_date]);
        $replacement_staff = $repl_stmt->fetch(PDO::FETCH_ASSOC);

        if ($replacement_staff) {
            error_log("   ✅ Found replacement: {$replacement_staff['staff_name']}");

            // ✅ 2.5 Assign พนักงานแทนเข้าห้อง
            $assign_stmt = $pdo->prepare("
                UPDATE station_staff
                SET assigned_room_id = ?,
                    status = 'working',
                    assigned_at = NOW()
                WHERE station_staff_id = ?
            ");
            $assign_stmt->execute([$room_id, $replacement_staff['station_staff_id']]);

            $replacement_count++;
            $replacements[] = [
                'original_staff' => $staff['staff_name'],
                'replacement_staff' => $replacement_staff['staff_name'],
                'room_id' => $room_id,
                'room_name' => $staff['room_name']
            ];

            error_log("   ✅ Assigned to room: {$room_id}");
        } else {
            error_log("   ⚠️ No available staff for replacement");
        }
    }

    // ✅ 3. ค้นหาพนักงานที่จบพักเบรค (status = on_break แต่เวลาเลยจบพักแล้ว)
    // ✅ เมื่อจบพักเบรค → set status = 'available' เท่านั้น (ไม่คืนห้อง เพราะมีคนแทนอยู่)
    $recovery_query = "
        SELECT 
            ss.station_staff_id,
            ss.staff_name,
            ss.break_room_id,
            ss.status
        FROM station_staff ss
        WHERE ss.work_date = ?
        AND ss.is_active = 1
        AND ss.status = 'on_break'
        AND TIME(?) >= TIME(COALESCE(ss.break_end_time, '13:00:00'))
    ";
    
    $recovery_stmt = $pdo->prepare($recovery_query);
    $recovery_stmt->execute([$current_date, $current_time]);
    $recovery_staff = $recovery_stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("📋 Found " . count($recovery_staff) . " staff ending break");

    $restorations = [];
    $restoration_count = 0;

    // ✅ 4. สำหรับพนักงานที่จบพักเบรค → set status = 'available'
    foreach ($recovery_staff as $staff) {
        error_log("✅ Processing recovery: {$staff['staff_name']}");

        // ✅ 4.1 Set status = available (จบพัก → ว่าง เรียกไปทำงานห้องอื่นได้)
        $restore_stmt = $pdo->prepare("
            UPDATE station_staff
            SET status = 'available',
                assigned_room_id = NULL,
                break_room_id = NULL
            WHERE station_staff_id = ?
        ");
        $restore_stmt->execute([$staff['station_staff_id']]);

        error_log("   ✅ Status set to available (break ended)");

        $restoration_count++;
        $restorations[] = [
            'staff_name' => $staff['staff_name'],
            'message' => "✅ {$staff['staff_name']} จบพักเบรค → ว่าง (ไม่คืนห้องเดิม)"
        ];
    }

    error_log("📊 Summary: Replacements={$replacement_count}, Restorations={$restoration_count}");
    error_log("=== MANAGE BREAK REPLACEMENT END (SUCCESS) ===");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Break management completed',
        'data' => [
            'current_date' => $current_date,
            'current_time' => $current_time,
            'replacements_count' => $replacement_count,
            'restorations_count' => $restoration_count,
            'replacements' => $replacements,
            'restorations' => $restorations,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ Error: " . $e->getMessage());
    error_log("=== MANAGE BREAK REPLACEMENT END (ERROR) ===");

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}
?>