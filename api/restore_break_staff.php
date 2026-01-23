<?php
/**
 * ✅ Restore Staff After Break Time API
 * ✅ ใช้ station_staff.status แทน room_staff.is_active
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
    
    error_log("\n========== RESTORE STAFF AFTER BREAK: $currentTime ==========");
    
    $pdo->beginTransaction();

    // ✅ STEP 1: หาพนักงานที่ status = 'on_break' และหมดเวลาเบรคแล้ว
    $restoreStmt = $pdo->prepare("
        SELECT 
            ss.station_staff_id,
            ss.assigned_room_id as room_id,
            ss.staff_name,
            ss.break_start_time,
            ss.break_end_time,
            ss.work_start_time,
            ss.work_end_time
        FROM station_staff ss
        WHERE ss.status = 'on_break'
        AND (ss.work_date IS NULL OR ss.work_date = :current_date)
        AND ss.assigned_room_id IS NOT NULL
        AND TIME(:current_time) >= TIME(ss.break_end_time)
        AND TIME(:current_time) < TIME(ss.work_end_time)
    ");
    
    $restoreStmt->execute([
        ':current_date' => $currentDate,
        ':current_time' => $currentTime
    ]);
    $toRestore = $restoreStmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("👥 พนักงานที่จบพักเบรค: " . count($toRestore) . " คน");

    $restoredCount = 0;
    $restoreLog = [];

    // ✅ STEP 2: สำหรับแต่ละคนที่จบพักเบรค
    foreach ($toRestore as $staff) {
        $roomId = $staff['room_id'];
        $staffName = $staff['staff_name'];
        $stationStaffId = $staff['station_staff_id'];
        
        error_log("🔄 ประมวลผล: $staffName - จบพักเบรคแล้ว (Room $roomId)");

        // ✅ SET status = 'working' (กลับมาทำงาน)
        $updateStaffStmt = $pdo->prepare("
            UPDATE station_staff
            SET status = 'working'
            WHERE station_staff_id = :station_staff_id
        ");
        $updateStaffStmt->execute([':station_staff_id' => $stationStaffId]);
        error_log("   ✅ ตั้ง status = 'working'");

        // ✅ หาพนักงานแทนที่กำลังทำงานในห้องนี้ (ถ้ามี)
        $findReplacementStmt = $pdo->prepare("
            SELECT station_staff_id, staff_name
            FROM station_staff
            WHERE assigned_room_id = :room_id
            AND station_staff_id != :original_staff_id
            AND status = 'working'
            LIMIT 1
        ");
        $findReplacementStmt->execute([
            ':room_id' => $roomId,
            ':original_staff_id' => $stationStaffId
        ]);
        $replacement = $findReplacementStmt->fetch(PDO::FETCH_ASSOC);

        if ($replacement) {
            // ✅ เอาพนักงานแทนออก
            $removeReplacementStmt = $pdo->prepare("
                UPDATE station_staff
                SET assigned_room_id = NULL,
                    status = 'available',
                    assigned_at = NULL
                WHERE station_staff_id = :station_staff_id
            ");
            $removeReplacementStmt->execute([':station_staff_id' => $replacement['station_staff_id']]);
            
            error_log("   ❌ ลบทดแทน: " . $replacement['staff_name']);
            $restoreLog[] = "✅ $staffName กลับมา - ลบทดแทน " . $replacement['staff_name'];
        } else {
            $restoreLog[] = "✅ $staffName กลับมา (ไม่มีทดแทน)";
            error_log("   ℹ️ ไม่มีพนักงานทดแทน");
        }

        // ✅ อัปเดตเครื่องมือเป็น "พร้อม"
        $updateEquipStmt = $pdo->prepare("
            UPDATE room_equipment
            SET is_active = 1
            WHERE room_id = :room_id AND require_staff = 1
        ");
        $updateEquipStmt->execute([':room_id' => $roomId]);
        error_log("   ⚙️ เครื่องมือ: พร้อม");

        $restoredCount++;
    }

    $pdo->commit();
    
    error_log("✅ เสร็จสิ้น - ฟื้นคืน: $restoredCount คน\n");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'ฟื้นคืนพนักงานสำเร็จ',
        'data' => [
            'current_time' => $currentTime,
            'restored_count' => $restoredCount,
            'restore_log' => $restoreLog
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