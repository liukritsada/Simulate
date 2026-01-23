<?php
/**
 * manage_break_time.php
 * ✅ ใช้ station_staff.assigned_room_id แทน room_staff
 * ✅ SET status = 'on_break' แทนการ deactivate
 */

date_default_timezone_set('Asia/Bangkok');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$host = '127.0.0.1';
$dbname = 'hospitalstation';
$username = 'sa';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("SET time_zone = '+07:00'");

    $input = json_decode(file_get_contents('php://input'), true);
    $currentDate = $input['current_date'] ?? date('Y-m-d');
    $currentTime = $input['current_time'] ?? date('H:i:s');
    
    error_log("\n⏰ [manage_break_time] เวลาไทย: " . date('H:i:s'));
    error_log("⏰ [manage_break_time] เวลาจาก client: $currentTime");
    
    $pdo->beginTransaction();

    // ✅ STEP 1: หาพนักงานที่กำลังพักเบรค
    // ดึงจาก station_staff WHERE assigned_room_id IS NOT NULL
    $breakStmt = $pdo->prepare("
        SELECT 
            ss.station_staff_id,
            ss.assigned_room_id as room_id,
            ss.staff_name,
            ss.work_start_time,
            ss.work_end_time,
            ss.break_start_time,
            ss.break_end_time,
            ss.status,
            sr.station_id,
            TIME(:current_time) as check_time
        FROM station_staff ss
        INNER JOIN station_rooms sr ON ss.assigned_room_id = sr.room_id
        WHERE ss.is_active = 1
        AND (ss.work_date IS NULL OR ss.work_date = :current_date)
        AND ss.assigned_room_id IS NOT NULL
        AND TIME(:current_time) >= TIME(ss.break_start_time)
        AND TIME(:current_time) < TIME(ss.break_end_time)
    ");
    
    $breakStmt->execute([
        ':current_date' => $currentDate,
        ':current_time' => $currentTime
    ]);
    $onBreak = $breakStmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("🕐 Current Time: $currentTime");
    error_log("👥 พนักงานพักเบรค: " . count($onBreak) . " คน");
    
    if (count($onBreak) > 0) {
        foreach ($onBreak as $s) {
            error_log("   - {$s['staff_name']} (Room {$s['room_id']}) Break: {$s['break_start_time']}~{$s['break_end_time']}");
        }
    }

    $replacedCount = 0;
    $notReplacedRooms = [];
    $replacementLog = [];

    // ✅ STEP 2: สำหรับแต่ละคนที่พักเบรค
    foreach ($onBreak as $staff) {
        $roomId = $staff['room_id'];
        $stationId = $staff['station_id'];
        $staffName = $staff['staff_name'];
        $stationStaffId = $staff['station_staff_id'];
        
        error_log("🔄 ประมวลผล: $staffName - พักเบรค {$staff['break_start_time']}~{$staff['break_end_time']} (Room $roomId)");

        // ✅ STEP 2a: SET status = 'on_break' (ยังคง assigned_room_id)
        $updateBreakStmt = $pdo->prepare("
            UPDATE station_staff
            SET status = 'on_break'
            WHERE station_staff_id = :station_staff_id
        ");
        $updateBreakStmt->execute([':station_staff_id' => $stationStaffId]);
        error_log("   ❌ ตั้ง status = 'on_break'");

        // ✅ STEP 2b: หาพนักงานทดแทน
        $replacementStmt = $pdo->prepare("
            SELECT 
                ss.station_staff_id,
                ss.staff_name,
                ss.staff_type,
                ss.work_start_time,
                ss.work_end_time,
                ss.break_start_time,
                ss.break_end_time
            FROM station_staff ss
            WHERE ss.station_id = :station_id
            AND (ss.work_date IS NULL OR ss.work_date = :current_date)
            AND ss.is_active = 1
            AND ss.assigned_room_id IS NULL
            AND NOT (
                TIME(:current_time) >= TIME(ss.break_start_time) 
                AND TIME(:current_time) < TIME(ss.break_end_time)
            )
            AND TIME(:current_time) >= TIME(ss.work_start_time)
            AND TIME(:current_time) < TIME(ss.work_end_time)
            LIMIT 1
        ");
        
        $replacementStmt->execute([
            ':station_id' => $stationId,
            ':current_date' => $currentDate,
            ':current_time' => $currentTime
        ]);
        $replacement = $replacementStmt->fetch(PDO::FETCH_ASSOC);

        if ($replacement) {
            // ✅ Assign พนักงานทดแทนเข้าห้อง
            $assignReplacementStmt = $pdo->prepare("
                UPDATE station_staff
                SET assigned_room_id = :room_id,
                    status = 'working',
                    assigned_at = NOW()
                WHERE station_staff_id = :station_staff_id
            ");
            
            $assignReplacementStmt->execute([
                ':room_id' => $roomId,
                ':station_staff_id' => $replacement['station_staff_id']
            ]);
            
            $replacedCount++;
            $replacementLog[] = "✅ $staffName (พักเบรค) → " . $replacement['staff_name'] . " (Room $roomId)";
            error_log("   ✅ ทดแทน: " . $replacement['staff_name']);
            
            // ✅ เครื่องมือพร้อมใช้
            $updateEquipStmt = $pdo->prepare("
                UPDATE room_equipment
                SET is_active = 1
                WHERE room_id = :room_id AND require_staff = 1
            ");
            $updateEquipStmt->execute([':room_id' => $roomId]);
            error_log("   ⚙️ เครื่องมือ: พร้อม");
        } else {
            // ⚠️ ไม่มีคนแทน
            $notReplacedRooms[] = $roomId;
            $replacementLog[] = "⚠️ $staffName - ไม่มีคนทดแทน (Room $roomId)";
            error_log("   ⚠️ ไม่มีคนทดแทน");
            
            // ✅ เครื่องมือไม่พร้อม
            $updateEquipStmt = $pdo->prepare("
                UPDATE room_equipment
                SET is_active = 0
                WHERE room_id = :room_id AND require_staff = 1
            ");
            $updateEquipStmt->execute([':room_id' => $roomId]);
            error_log("   ⚙️ เครื่องมือ: ไม่พร้อม");
        }
    }

    $pdo->commit();
    
    error_log("✅ เสร็จสิ้น - พักเบรค: " . count($onBreak) . ", ทดแทน: $replacedCount, ไม่มีคนแทน: " . count($notReplacedRooms));
    error_log("========================================\n");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'จัดการพักเบรคสำเร็จ',
        'data' => [
            'current_time' => $currentTime,
            'on_break_count' => count($onBreak),
            'replaced_count' => $replacedCount,
            'not_replaced_rooms' => $notReplacedRooms,
            'replacement_log' => $replacementLog
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("❌ Error: " . $e->getMessage() . "\n");
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>