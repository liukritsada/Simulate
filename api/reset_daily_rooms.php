<?php
/**
 * 🔄 RESET DAILY ROOMS
 * ล้างการแบ่งห้องทุกวันเที่ยงคืน
 * - Clear assigned_room_id
 * - Auto-assign staff to required rooms
 * - Track unassigned staff
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
    $currentTime = date('H:i:s');
    
    error_log("\n========== RESET ROOMS ==========");
    error_log("📅 วันที่: $currentDate");
    error_log("⏰ เวลาเซิร์ฟเวอร์: $currentTime");
    
    $pdo->beginTransaction();

    // ✅ STEP 1: Clear assigned_room_id ทั้งหมด
    $pdo->exec("
        UPDATE station_staff 
        SET assigned_room_id = NULL, 
            status = 'available',
            assigned_at = NULL
        WHERE assigned_room_id IS NOT NULL
    ");
    error_log("✅ Clear assigned_room_id ทั้งหมด");

    // ✅ STEP 2: ดึงพนักงานที่เข้ามางานแล้ว
    $staffStmt = $pdo->prepare("
        SELECT 
            ss.station_staff_id,
            ss.staff_id,
            ss.staff_name,
            ss.staff_type,
            ss.station_id,
            ss.work_start_time,
            ss.work_end_time,
            s.station_name
        FROM station_staff ss
        INNER JOIN stations s ON ss.station_id = s.station_id
        WHERE (ss.work_date IS NULL OR ss.work_date = :current_date)
        AND ss.is_active = 1
        AND :current_time >= ss.work_start_time
        AND (
            (ss.work_start_time <= ss.work_end_time AND :current_time <= ss.work_end_time)
            OR
            (ss.work_start_time > ss.work_end_time AND (
                :current_time >= ss.work_start_time OR 
                :current_time <= ss.work_end_time
            ))
        )
        ORDER BY ss.station_id, ss.work_start_time
    ");
    
    $staffStmt->execute([
        ':current_date' => $currentDate,
        ':current_time' => $currentTime
    ]);
    $allStaff = $staffStmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("📌 พบพนักงานที่เข้ามางานแล้ว: " . count($allStaff) . " คน");
    
    if (count($allStaff) == 0) {
        $pdo->rollBack();
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'ไม่มีพนักงานที่เข้ามางานแล้ว',
            'data' => [
                'current_date' => $currentDate,
                'current_time' => $currentTime,
                'staff_on_shift' => 0,
                'assignment_log' => [
                    "⏰ เวลาปัจจุบัน: $currentTime",
                    "👥 พนักงานที่เข้ามางานแล้ว: 0 คน"
                ]
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ✅ STEP 3: จัดกลุ่มพนักงานตามสถานี
    $staffByStation = [];
    foreach ($allStaff as $staff) {
        $stationId = $staff['station_id'];
        if (!isset($staffByStation[$stationId])) {
            $staffByStation[$stationId] = [];
        }
        $staffByStation[$stationId][] = $staff;
    }

    $autoAssignCount = 0;
    $assignmentLog = [];
    $errors = [];
    $unassignedStaff = [];

    $assignmentLog[] = "⏰ เวลาปัจจุบัน: $currentTime";
    $assignmentLog[] = "👥 พนักงานที่เข้ามางานแล้ว: " . count($allStaff) . " คน";
    $assignmentLog[] = "";

    // ✅ STEP 4: สำหรับแต่ละสถานี
    foreach ($staffByStation as $stationId => $staffList) {
        $stationName = $staffList[0]['station_name'];
        error_log("\n🥼 สถานีนี้: $stationName (พนักงาน: " . count($staffList) . " คน)");
        $assignmentLog[] = "🥼 สถานีนี้: $stationName";
        
        // ✅ ดึงห้องที่ต้องการพนักงาน
        $roomsStmt = $pdo->prepare("
            SELECT 
                sr.room_id, 
                sr.room_name,
                sr.room_number
            FROM station_rooms sr
            WHERE sr.station_id = :station_id
            AND EXISTS (
                SELECT 1 FROM room_equipment 
                WHERE room_id = sr.room_id 
                AND require_staff = 1 
                AND is_active = 1
            )
            ORDER BY sr.room_id
        ");
        $roomsStmt->execute([':station_id' => $stationId]);
        $rooms = $roomsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("🏥 ห้องที่ต้องการพนักงาน: " . count($rooms) . " ห้อง");
        
        if (count($rooms) == 0) {
            $assignmentLog[] = "  ⚠️ ไม่มีห้องที่ต้องการพนักงาน";
            foreach ($staffList as $staff) {
                $unassignedStaff[] = "{$staff['staff_name']} ({$staff['staff_type']})";
            }
            $assignmentLog[] = "";
            continue;
        }

        $availableStaff = $staffList;
        
        // ✅ มอบหมายพนักงานให้ห้อง (UPDATE assigned_room_id)
        foreach ($rooms as $index => $room) {
            if (count($availableStaff) == 0) break;
            
            $roomId = $room['room_id'];
            $roomName = $room['room_name'];
            $roomNumber = $room['room_number'];
            $staff = $availableStaff[0];
            
            try {
                // ✅ UPDATE assigned_room_id
                $updateStmt = $pdo->prepare("
                    UPDATE station_staff 
                    SET assigned_room_id = :room_id,
                        status = 'working',
                        assigned_at = NOW()
                    WHERE station_staff_id = :station_staff_id
                ");
                
                $updateStmt->execute([
                    ':room_id' => $roomId,
                    ':station_staff_id' => $staff['station_staff_id']
                ]);
                
                $autoAssignCount++;
                $assignmentLog[] = "  ✅ {$staff['staff_name']} ({$staff['staff_type']}) → $roomName";
                error_log("     ✅ มอบหมาย: {$staff['staff_name']} → $roomName");
                
                array_shift($availableStaff);
                
            } catch (Exception $e) {
                $errors[] = "❌ มอบหมายไม่สำเร็จ: {$staff['staff_name']} → $roomName";
                error_log("     ❌ ข้อผิดพลาด: " . $e->getMessage());
            }
        }
        
        // ✅ เก็บพนักงานที่ไม่ได้รับการมอบหมาย
        foreach ($availableStaff as $staff) {
            $unassignedStaff[] = "{$staff['staff_name']} ({$staff['staff_type']})";
        }
        
        if (count($availableStaff) > 0) {
            $assignmentLog[] = "  ℹ️ พนักงานที่เหลือ: " . count($availableStaff) . " คน";
        }
        $assignmentLog[] = "";
    }

    $pdo->commit();

    $assignmentLog[] = "📋 สรุปผล:";
    $assignmentLog[] = "  • มอบหมายพนักงานแล้ว: $autoAssignCount คน";
    $assignmentLog[] = "  • พนักงานไม่ได้รับการมอบหมาย: " . count($unassignedStaff) . " คน";
    
    if (count($unassignedStaff) > 0) {
        $assignmentLog[] = "";
        $assignmentLog[] = "👥 พนักงานที่ไม่ได้รับการมอบหมาย:";
        foreach ($unassignedStaff as $staff) {
            $assignmentLog[] = "  • $staff";
        }
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'รีเซ็ตสำเร็จ',
        'data' => [
            'staff_on_shift' => count($allStaff),
            'auto_assign_count' => $autoAssignCount,
            'unassigned_staff' => count($unassignedStaff),
            'current_date' => $currentDate,
            'current_time' => $currentTime,
            'assignment_log' => $assignmentLog,
            'errors' => $errors
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("❌ ข้อผิดพลาด: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>