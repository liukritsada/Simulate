<?php
/**
 * ✅ auto_assign_staff.php (FIXED VERSION 4.0)
 * เพิ่มพนักงานเข้าห้องอัตโนมัติ เมื่อห้องว่าง
 * 
 * ✅ FIX 4.0: ตรวจสอบ break time - ไม่เลือกพนักงานที่อยู่ใน break
 * ✅ FIX 4.1: รองรับ OT staff
 */

// ✅ OUTPUT BUFFERING FIRST
ob_end_clean();
ob_start();

// ✅ SUPPRESS ERROR OUTPUT
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// ✅ SET HEADERS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    ob_clean();
    http_response_code(200);
    exit();
}

try {
    // ✅ OUTPUT BUFFERING
    ob_clean();

    $host = '127.0.0.1';
    $dbname = 'hospitalstation';
    $username = 'sa';
    $password = '';

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $input = json_decode(file_get_contents('php://input'), true);
    $current_date = $input['current_date'] ?? date('Y-m-d');
    $current_time = $input['current_time'] ?? date('H:i:s');

    error_log("=== AUTO_ASSIGN_STAFF START ===");
    error_log("🔍 auto_assign_staff: date=$current_date, time=$current_time");

    // ✅ FIX 1: อัพเดต status ก่อน
    error_log("📊 STEP 1: Update staff status from time...");
    
    try {
        $status_update_url = 'http://127.0.0.1/hospital/api/update_staff_status_by_time.php';
        
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => 'Content-Type: application/json',
                'content' => json_encode([
                    'station_id' => 0,
                    'current_date' => $current_date,
                    'current_time' => $current_time
                ])
            ]
        ]);
        
        $status_result = @file_get_contents($status_update_url, false, $context);
        
        if ($status_result) {
            $status_data = json_decode($status_result, true);
            if ($status_data['success']) {
                error_log("✅ Status updated: {$status_data['data']['updated_count']} staff");
                // Log which staff were cleared from rooms
                foreach ($status_data['data']['updates'] as $update) {
                    if ($update['room_cleared'] ?? false) {
                        error_log("   🚪 {$update['staff']}: {$update['action']}");
                    }
                }
            }
        } else {
            error_log("⚠️ Status update returned empty");
        }
    } catch (Exception $e) {
        error_log("⚠️ Status update error (non-critical): " . $e->getMessage());
    }

    // ✅ ดึงห้องที่ว่างเปล่า
    error_log("📊 STEP 2: Find empty rooms...");
    
    $empty_rooms_query = "
        SELECT 
            sr.room_id, 
            sr.room_number,
            sr.room_name, 
            s.station_id, 
            s.station_name
        FROM station_rooms sr
        JOIN stations s ON sr.station_id = s.station_id
        WHERE 
            sr.room_id NOT IN (
                SELECT DISTINCT assigned_room_id 
                FROM station_staff 
                WHERE assigned_room_id IS NOT NULL 
                AND assigned_room_id > 0
                AND is_active = 1
            )
        ORDER BY sr.room_id
    ";
    
    $empty_rooms = $pdo->prepare($empty_rooms_query);
    $empty_rooms->execute();
    $empty_rooms_list = $empty_rooms->fetchAll(PDO::FETCH_ASSOC);

    error_log("📊 Found " . count($empty_rooms_list) . " empty rooms");

    $auto_assigned = [];
    $already_assigned = [];

    // ✅ สำหรับแต่ละห้องที่ว่าง ให้เลือกพนักงาน
    foreach ($empty_rooms_list as $room) {
        error_log("🔍 Processing empty room {$room['room_id']} ({$room['room_name']})");

        // ✅ FIX 4.0: ตรวจสอบเวลา break ก่อนเลือก
        // ต้องแน่ใจว่าพนักงานนั้นไม่อยู่ในช่วง break
        $available_staff_query = "
            SELECT 
                ss.station_staff_id, 
                ss.staff_id,
                ss.staff_name, 
                ss.staff_type,
                ss.work_start_time, 
                ss.work_end_time,
                ss.break_start_time, 
                ss.break_end_time,
                ss.status,
                ss.ot_start_time,
                ss.ot_end_time
            FROM station_staff ss
            WHERE ss.station_id = :station_id 
                AND ss.is_active = 1
                AND ss.work_date = :current_date
                AND ss.assigned_room_id IS NULL
                AND ss.status IN ('available', 'overtime')
                AND ss.station_staff_id NOT IN (" . (empty($already_assigned) ? '0' : implode(',', $already_assigned)) . ")
                -- ✅ FIX 4.0: ตรวจสอบว่าไม่อยู่ใน break
                AND NOT (
                    :current_time >= ss.break_start_time 
                    AND :current_time < ss.break_end_time
                    AND ss.break_start_time IS NOT NULL
                    AND ss.break_end_time IS NOT NULL
                )
            ORDER BY 
                CASE 
                    WHEN ss.status = 'available' THEN 1
                    WHEN ss.status = 'overtime' THEN 2
                END,
                ss.staff_name
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
            // ✅ ตรวจสอบ break time ครั้งที่ 2 (เพื่อความแน่นอน)
            $is_in_break = isStaffInBreak($current_time, $staff);
            
            if ($is_in_break) {
                error_log("⚠️ Staff {$staff['staff_name']} is in break - SKIP");
                continue;
            }
            
            $staff_status_display = ($staff['status'] === 'overtime') ? 
                "overtime ({$staff['ot_start_time']}-{$staff['ot_end_time']})" : 
                $staff['status'];
            
            error_log("✅ Found available staff: {$staff['staff_name']} (ID: {$staff['station_staff_id']}, Status: {$staff_status_display})");

            try {
                // ✅ UPDATE station_staff เพื่อกำหนดห้อง
                $update_staff_query = "
                    UPDATE station_staff 
                    SET assigned_room_id = :room_id,
                        status = 'working',
                        assigned_at = NOW()
                    WHERE station_staff_id = :station_staff_id
                ";
                
                $update_stmt = $pdo->prepare($update_staff_query);
                $update_stmt->execute([
                    ':room_id' => $room['room_id'],
                    ':station_staff_id' => $staff['station_staff_id']
                ]);

                // ✅ บันทึก assignment สำเร็จ
                $auto_assigned[] = [
                    'room_id' => (int)$room['room_id'],
                    'room_name' => $room['room_name'],
                    'station_name' => $room['station_name'],
                    'station_staff_id' => (int)$staff['station_staff_id'],
                    'staff_name' => $staff['staff_name'],
                    'staff_type' => $staff['staff_type'] ?? 'Staff',
                    'from_status' => $staff['status'],
                    'message' => $staff['status'] === 'overtime' ? 
                        "✅ ส่ง {$staff['staff_name']} (OT) เข้าห้อง {$room['room_name']}" :
                        "✅ ส่ง {$staff['staff_name']} เข้าห้อง {$room['room_name']}"
                ];

                $already_assigned[] = $staff['station_staff_id'];

                error_log("✅ Assigned successfully");

            } catch (Exception $addError) {
                error_log("⚠️ Error assigning staff: " . $addError->getMessage());
            }
        } else {
            error_log("⚠️ No available staff for room {$room['room_id']} (may be in break or all assigned)");
        }
    }

    error_log("📊 Total assigned: " . count($auto_assigned));
    error_log("=== AUTO_ASSIGN_STAFF END (SUCCESS) ===");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'ตรวจสอบห้องว่างและเพิ่มพนักงานเสร็จสิ้น',
        'data' => [
            'empty_rooms_count' => count($empty_rooms_list),
            'auto_assigned_count' => count($auto_assigned),
            'assignments' => $auto_assigned,
            'current_time' => $current_time,
            'current_date' => $current_date,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ Error in auto_assign_staff: " . $e->getMessage());
    error_log("=== AUTO_ASSIGN_STAFF END (ERROR) ===");
    
    ob_clean();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_line' => $e->getLine(),
        'current_date' => $current_date ?? null,
        'current_time' => $current_time ?? null
    ], JSON_UNESCAPED_UNICODE);
}

/* ===================== HELPER FUNCTION ===================== */
/**
 * ✅ ตรวจสอบว่าพนักงานอยู่ในช่วง break หรือไม่
 */
function isStaffInBreak($current_time, $staff) {
    $break_start = $staff['break_start_time'] ?? null;
    $break_end = $staff['break_end_time'] ?? null;
    
    if (!$break_start || !$break_end) {
        return false;
    }
    
    // Compare as strings (HH:mm:ss)
    if ($current_time >= $break_start && $current_time < $break_end) {
        return true;
    }
    
    return false;
}
?>