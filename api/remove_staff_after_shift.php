<?php
/**
 * ✅ Remove Staff After Work Shift Ends API
 * ✅ ใช้ station_staff.assigned_room_id แทน room_staff
 */

header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Asia/Bangkok');
$host = '127.0.0.1';
$dbname = 'hospitalstation';
$username = 'sa';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $currentTime = date('H:i:s');
    $currentDate = date('Y-m-d');
    
    error_log("\n========== REMOVE STAFF AFTER SHIFT: $currentTime ==========");
    
    $pdo->beginTransaction();

    // ✅ STEP 1: หาพนักงานที่เลิกงานแล้ว (work_end_time < currentTime)
    $shiftEndStmt = $pdo->prepare("
        SELECT 
            ss.station_staff_id,
            ss.assigned_room_id as room_id,
            ss.staff_name,
            ss.work_end_time,
            sr.station_id
        FROM station_staff ss
        INNER JOIN station_rooms sr ON ss.assigned_room_id = sr.room_id
        WHERE ss.is_active = 1
        AND (ss.work_date IS NULL OR ss.work_date = :current_date)
        AND ss.assigned_room_id IS NOT NULL
        AND ss.work_end_time < :current_time
    ");
    
    $shiftEndStmt->execute([
        ':current_date' => $currentDate,
        ':current_time' => $currentTime
    ]);
    $shiftEnded = $shiftEndStmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("👥 พนักงานเลิกงาน: " . count($shiftEnded) . " คน");

    $removedCount = 0;
    $removedRooms = [];
    $removalLog = [];

    // ✅ STEP 2: สำหรับแต่ละคนที่เลิกงาน
    foreach ($shiftEnded as $staff) {
        $roomId = $staff['room_id'];
        $staffName = $staff['staff_name'];
        $workEndTime = $staff['work_end_time'];
        
        error_log("🔄 ประมวลผล: $staffName - เลิกงาน $workEndTime");

        // ✅ Clear assigned_room_id และ SET status = 'offline'
        $updateStmt = $pdo->prepare("
            UPDATE station_staff
            SET assigned_room_id = NULL,
                status = 'offline',
                assigned_at = NULL
            WHERE station_staff_id = :station_staff_id
        ");
        $updateStmt->execute([':station_staff_id' => $staff['station_staff_id']]);
        
        error_log("   ❌ ลบออกจากห้อง: Room $roomId");

        // ✅ ตรวจสอบจำนวนพนักงานในห้อง
        $staffCountStmt = $pdo->prepare("
            SELECT COUNT(*) as staff_count
            FROM station_staff
            WHERE assigned_room_id = :room_id 
            AND is_active = 1
        ");
        $staffCountStmt->execute([':room_id' => $roomId]);
        $staffCount = $staffCountStmt->fetch(PDO::FETCH_ASSOC)['staff_count'];
        
        // ✅ ถ้าไม่มีพนักงาน = เครื่องมือไม่พร้อม
        if ($staffCount == 0) {
            $updateEquipStmt = $pdo->prepare("
                UPDATE room_equipment
                SET is_active = 0
                WHERE room_id = :room_id AND require_staff = 1
            ");
            $updateEquipStmt->execute([':room_id' => $roomId]);
            
            $removedRooms[] = [
                'room_id' => $roomId,
                'status' => 'needs_staff'
            ];
            $removalLog[] = "⚠️ $staffName ลบออก - ห้อง $roomId ต้องการพนักงาน";
            error_log("   ⚠️ ไม่มีพนักงาน - ตั้งเครื่องมือเป็นไม่พร้อม");
        } else {
            $removedRooms[] = [
                'room_id' => $roomId,
                'status' => 'ok',
                'remaining_staff' => $staffCount
            ];
            $removalLog[] = "✅ $staffName ลบออก - ห้อง $roomId ยังมีพนักงาน $staffCount คน";
            error_log("   ✅ ห้องยังมีพนักงาน $staffCount คน");
        }

        $removedCount++;
    }

    $pdo->commit();
    
    error_log("✅ เสร็จสิ้น - ลบออก: $removedCount คน\n");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'ลบพนักงานเลิกงานสำเร็จ',
        'data' => [
            'current_time' => $currentTime,
            'removed_count' => $removedCount,
            'removed_rooms' => $removedRooms,
            'removal_log' => $removalLog
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