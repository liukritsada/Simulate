<?php
/**
 * ✅ API: Get All Staff in Station (for Daily Add)
 * - ดึงพนักงานทั้งหมดจาก station_staff
 * - เลือกเฉพาะ is_active = 1
 * - ตรวจสอบว่าเพิ่มเข้าห้องแล้วหรือไม่
 * - ลบซ้ำตามชื่อ
 * 
 * Filename: api/get_all_station_staff_for_daily.php
 */

header('Content-Type: application/json; charset=utf-8');

$host = '127.0.0.1';
$dbname = 'hospitalstation';
$username = 'sa';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stationId = $_GET['station_id'] ?? null;
    $workDate = $_GET['work_date'] ?? date('Y-m-d');

    if (!$stationId) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'station_id is required'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    error_log("📊 get_all_station_staff_for_daily - Station: $stationId, Date: $workDate");

    // ✅ ดึงพนักงานทั้งหมดจาก station_staff
    $stmt = $pdo->prepare("
        SELECT DISTINCT
            ss.station_staff_id,
            ss.staff_id,
            ss.staff_name,
            ss.staff_type,
            ss.work_start_time,
            ss.work_end_time,
            ss.break_start_time,
            ss.break_end_time,
            ss.work_date,
            -- ✅ ตรวจสอบว่าเพิ่มเข้าห้องแล้วหรือไม่
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM room_staff rs
                    WHERE rs.station_staff_id = ss.station_staff_id
                    AND rs.is_active = 1
                    AND rs.work_date = :work_date
                ) THEN 1 
                ELSE 0 
            END as is_assigned_today,
            -- ✅ ดึงห้องที่เพิ่มเข้าไป
            (
                SELECT GROUP_CONCAT(sr.room_name SEPARATOR ', ')
                FROM room_staff rs
                INNER JOIN station_rooms sr ON rs.room_id = sr.room_id
                WHERE rs.station_staff_id = ss.station_staff_id
                AND rs.is_active = 1
                AND rs.work_date = :work_date
            ) as assigned_rooms
        FROM station_staff ss
        WHERE ss.station_id = :station_id
        AND ss.is_active = 1
        ORDER BY ss.staff_name, ss.station_staff_id
    ");

    $stmt->execute([
        ':station_id' => $stationId,
        ':work_date' => $workDate
    ]);
    $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("👥 พบพนักงาน: " . count($staff) . " คน");

    // ✅ ลบซ้ำตามชื่อ (เลือกเฉพาะคนแรก)
    $uniqueStaff = [];
    $seenNames = [];
    
    foreach ($staff as $s) {
        $staffName = $s['staff_name'];
        
        // ✅ ถ้าเห็นชื่อนี้แล้ว ให้ข้ามไป
        if (in_array($staffName, $seenNames)) {
            continue;
        }
        
        $seenNames[] = $staffName;
        $uniqueStaff[] = $s;
    }

    error_log("✅ หลังลบซ้ำ: " . count($uniqueStaff) . " คน");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $uniqueStaff
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>