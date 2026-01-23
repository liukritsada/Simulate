<?php
/**
 * 🔍 Debug Auto-Assignment System
 * ตรวจสอบว่าเงื่อนไข auto-assign เป็นไปได้หรือไม่
 */

header('Content-Type: text/html; charset=utf-8');
date_default_timezone_set('Asia/Bangkok');

$host = '127.0.0.1';
$dbname = 'hospitalstation';
$username = 'sa';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $current_date = date('Y-m-d');
    $current_time = date('H:i:s');
    $station_id = isset($_GET['station_id']) ? intval($_GET['station_id']) : 92;

    echo "<h1>🔍 Debug Auto-Assignment System</h1>";
    echo "<p>📅 วันที่: <strong>$current_date</strong></p>";
    echo "<p>🕒 เวลา: <strong>$current_time</strong></p>";
    echo "<p>🏥 Station ID: <strong>$station_id</strong></p>";
    echo "<hr>";

    // ============================================
    // 1. ✅ ตรวจสอบ EMPTY ROOMS
    // ============================================
    echo "<h2>1️⃣ Empty Rooms (ห้องที่ไม่มีพนักงาน)</h2>";
    
    $empty_rooms_query = "
        SELECT 
            sr.room_id, 
            sr.room_number,
            sr.room_name, 
            s.station_id, 
            s.station_name,
            (SELECT COUNT(*) FROM station_staff 
             WHERE assigned_room_id = sr.room_id 
             AND is_active = 1 
             AND status = 'working') as staff_count
        FROM station_rooms sr
        JOIN stations s ON sr.station_id = s.station_id
        WHERE s.station_id = :station_id
        AND sr.room_id NOT IN (
            SELECT DISTINCT assigned_room_id 
            FROM station_staff 
            WHERE assigned_room_id IS NOT NULL 
            AND assigned_room_id > 0
            AND is_active = 1
            AND status = 'working'
        )
    ";
    
    $stmt = $pdo->prepare($empty_rooms_query);
    $stmt->execute([':station_id' => $station_id]);
    $empty_rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($empty_rooms) > 0) {
        echo "<div style='background: #d4edda; padding: 10px; border-radius: 5px;'>";
        echo "✅ <strong>พบ " . count($empty_rooms) . " ห้องที่ว่าง</strong><br>";
        foreach ($empty_rooms as $room) {
            echo "- {$room['room_name']} (Room ID: {$room['room_id']})<br>";
        }
        echo "</div>";
    } else {
        echo "<div style='background: #f8d7da; padding: 10px; border-radius: 5px;'>";
        echo "❌ <strong>ไม่พบห้องที่ว่าง</strong><br>";
        echo "ทุกห้องมีพนักงานแล้ว";
        echo "</div>";
    }

    echo "<hr>";

    // ============================================
    // 2. ✅ ตรวจสอบ AVAILABLE STAFF
    // ============================================
    echo "<h2>2️⃣ Available Staff (พนักงานที่สามารถมอบหมายได้)</h2>";

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
            ss.assigned_room_id,
            ss.status
        FROM station_staff ss
        WHERE ss.station_id = :station_id
        AND ss.is_active = 1
        AND (ss.work_date IS NULL OR ss.work_date = :current_date)
        AND (ss.assigned_room_id IS NULL OR ss.assigned_room_id = 0)
        AND TIME(:current_time) >= TIME(COALESCE(ss.work_start_time, '08:00:00'))
        AND TIME(:current_time) < TIME(COALESCE(ss.work_end_time, '17:00:00'))
        AND NOT (TIME(:current_time) >= TIME(COALESCE(ss.break_start_time, '12:00:00')) 
                 AND TIME(:current_time) < TIME(COALESCE(ss.break_end_time, '13:00:00')))
    ";

    $stmt = $pdo->prepare($available_staff_query);
    $stmt->execute([
        ':station_id' => $station_id,
        ':current_date' => $current_date,
        ':current_time' => $current_time
    ]);
    $available_staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($available_staff) > 0) {
        echo "<div style='background: #d4edda; padding: 10px; border-radius: 5px;'>";
        echo "✅ <strong>พบ " . count($available_staff) . " พนักงานที่ available</strong><br>";
        foreach ($available_staff as $staff) {
            echo "- {$staff['staff_name']} ({$staff['staff_type']}) | ";
            echo "เวลา: {$staff['work_start_time']} - {$staff['work_end_time']}<br>";
        }
        echo "</div>";
    } else {
        echo "<div style='background: #f8d7da; padding: 10px; border-radius: 5px;'>";
        echo "❌ <strong>ไม่พบพนักงานที่ available</strong><br>";
        echo "ส่วนเหตุผล ดูด้านล่าง";
        echo "</div>";

        // ตรวจสอบรายการย่อย
        echo "<h3>🔍 ตรวจสอบรายการ Staff ทั้งหมด</h3>";
        
        $all_staff_query = "
            SELECT 
                ss.station_staff_id,
                ss.staff_name,
                ss.is_active,
                ss.work_date,
                ss.work_start_time,
                ss.work_end_time,
                ss.break_start_time,
                ss.break_end_time,
                ss.assigned_room_id,
                CASE 
                    WHEN ss.is_active = 0 THEN '❌ ไม่ active'
                    WHEN ss.work_date IS NOT NULL AND ss.work_date != :current_date THEN '❌ วันที่ไม่ตรง'
                    WHEN ss.assigned_room_id IS NOT NULL AND ss.assigned_room_id > 0 THEN '❌ ถูก assign แล้ว'
                    WHEN TIME(:current_time) < TIME(COALESCE(ss.work_start_time, '08:00:00')) THEN '❌ ยังไม่ถึงเวลาเริ่มงาน'
                    WHEN TIME(:current_time) >= TIME(COALESCE(ss.work_end_time, '17:00:00')) THEN '❌ หลังเวลาเลิกงาน'
                    WHEN TIME(:current_time) >= TIME(COALESCE(ss.break_start_time, '12:00:00')) AND TIME(:current_time) < TIME(COALESCE(ss.break_end_time, '13:00:00')) THEN '❌ อยู่ในช่วง break'
                    ELSE '✅ Available'
                END as status
            FROM station_staff ss
            WHERE ss.station_id = :station_id
            ORDER BY ss.staff_name
        ";

        $stmt = $pdo->prepare($all_staff_query);
        $stmt->execute([
            ':station_id' => $station_id,
            ':current_date' => $current_date,
            ':current_time' => $current_time
        ]);
        $all_staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo "<table border='1' style='width: 100%; border-collapse: collapse;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th>Staff Name</th><th>Work Time</th><th>Status</th>";
        echo "</tr>";

        foreach ($all_staff as $staff) {
            $bgColor = strpos($staff['status'], '✅') !== false ? '#d4edda' : '#f8d7da';
            echo "<tr style='background: $bgColor;'>";
            echo "<td>{$staff['staff_name']}</td>";
            echo "<td>{$staff['work_start_time']} - {$staff['work_end_time']}</td>";
            echo "<td>{$staff['status']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    }

    echo "<hr>";

    // ============================================
    // 3. ✅ ตรวจสอบ RESULT
    // ============================================
    echo "<h2>3️⃣ Auto-Assignment Result</h2>";

    if (count($empty_rooms) > 0 && count($available_staff) > 0) {
        echo "<div style='background: #d4edda; padding: 15px; border-radius: 5px; border: 2px solid #28a745;'>";
        echo "✅ <strong style='font-size: 18px;'>เงื่อนไขเหมาะสม! Auto-assign สามารถทำงาน</strong><br>";
        echo "- Empty rooms: " . count($empty_rooms) . "<br>";
        echo "- Available staff: " . count($available_staff) . "<br>";
        echo "<br>👉 ระบบควรจะ auto-assign พนักงานเข้าห้องแล้ว";
        echo "</div>";
    } else {
        echo "<div style='background: #f8d7da; padding: 15px; border-radius: 5px; border: 2px solid #dc3545;'>";
        echo "❌ <strong style='font-size: 18px;'>เงื่อนไขไม่เหมาะสม</strong><br>";
        if (count($empty_rooms) === 0) {
            echo "- ❌ ไม่มีห้องที่ว่าง (ทุกห้องมีพนักงาน)<br>";
        } else {
            echo "- ✅ มีห้องที่ว่าง: " . count($empty_rooms) . "<br>";
        }
        if (count($available_staff) === 0) {
            echo "- ❌ ไม่มีพนักงานที่ available<br>";
        } else {
            echo "- ✅ มีพนักงาน available: " . count($available_staff) . "<br>";
        }
        echo "</div>";
    }

    echo "<hr>";
    echo "<p>💡 <strong>วิธีแก้ไข:</strong></p>";
    echo "<ul>";
    echo "<li>✅ เพิ่ม staff ให้สถานี (ทุก station ต้องมี staff)</li>";
    echo "<li>✅ ตั้งเวลาทำงาน (work_start_time, work_end_time)</li>";
    echo "<li>✅ ลบ assignment เก่า (ให้ staff ว่าง)</li>";
    echo "<li>✅ ตรวจสอบเวลา: ปัจจุบันต้องตรงกับ work_start_time - work_end_time</li>";
    echo "</ul>";

} catch (Exception $e) {
    echo "<div style='background: #f8d7da; padding: 10px; border-radius: 5px;'>";
    echo "❌ Error: " . $e->getMessage();
    echo "</div>";
}
?>

<style>
    body {
        font-family: Arial, sans-serif;
        margin: 20px;
        background: #f5f5f5;
    }
    h1, h2, h3 {
        color: #333;
    }
    table {
        margin: 10px 0;
    }
    th, td {
        padding: 8px;
        text-align: left;
    }
</style>