<?php
/**
 * API: Get Unassigned Doctors
 * ดึงแพทย์ที่ยังไม่ได้มอบหมายห้อง
 * 
 * ✅ FIXED: แก้ไข column 'room_number' ที่ไม่มีใน station_doctors
 * โดยลบ sd.room_number และเงื่อนไข AND sd.room_number IS NOT NULL ออก
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

try {
    $pdo = new PDO(
        'mysql:host=127.0.0.1;port=3306;dbname=hospitalstation;charset=utf8mb4',
        'sa',
        '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    $station_id = isset($_GET['station_id']) ? intval($_GET['station_id']) : 0;
    $work_date = isset($_GET['work_date']) ? $_GET['work_date'] : date('Y-m-d');

    if ($station_id <= 0) {
        http_response_code(400);
        throw new Exception('station_id must be positive integer');
    }

    error_log("=============================================================");
    error_log("📌 พยายามเชื่อมต่อ: 127.0.0.1:3306/hospitalstation");
    error_log("✅ เชื่อมต่อฐานข้อมูลสำเร็จ");
    error_log("📥 Parameters: station_id=$station_id, work_date=$work_date");

    // ============================================================
    // ✅ QUERY 1: ตรวจสอบ Station ID = 7 มีอยู่หรือไม่
    // ============================================================
    error_log("🔍 Query 1: ตรวจสอบ Station ID = $station_id");

    $checkStmt = $pdo->prepare("SELECT station_id, station_name FROM stations WHERE station_id = ?");
    $checkStmt->execute([$station_id]);
    $station = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$station) {
        error_log("❌ Station ไม่พบ: ID = $station_id");
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => "Station ID $station_id not found",
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    error_log("✅ Station มีข้อมูลทั้งหมด: 1 record");

    // ============================================================
    // ✅ QUERY 2: ดึงแพทย์ที่ยังไม่ได้มอบหมายห้อง
    // ✅ FIXED: ลบ sd.room_number ออก (column ไม่มีในตาราง)
    // ============================================================
    error_log("🔍 Query 2: ดึงแพทย์ที่ยังไม่ได้มอบหมายห้อง");

    $unassignedStmt = $pdo->prepare("
        SELECT 
            sd.station_doctor_id,
            sd.station_id,
            sd.doctor_id,
            sd.doctor_name,
            sd.work_date,
            sd.work_start_time,
            sd.work_end_time,
            sd.break_start_time,
            sd.break_end_time,
            sd.assigned_room_id,
            sd.status
        FROM station_doctors sd
        WHERE sd.station_id = :station_id
        AND DATE(sd.work_date) = :work_date
        AND sd.is_active = 1
        AND sd.assigned_room_id IS NULL
        ORDER BY sd.doctor_name ASC
    ");

    $unassignedStmt->execute([
        ':station_id' => $station_id,
        ':work_date' => $work_date
    ]);

    $unassignedDoctors = $unassignedStmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("✅ แพทย์ที่ยังไม่ได้มอบหมาย: " . count($unassignedDoctors));

    // ============================================================
    // ✅ QUERY 3: ดึงแพทย์ที่มีการมอบหมายห้องแล้ว
    // ============================================================
    error_log("🔍 Query 3: ดึงแพทย์ที่มีการมอบหมายห้องแล้ว");

    $assignedStmt = $pdo->prepare("
        SELECT 
            sd.station_doctor_id,
            sd.station_id,
            sd.doctor_id,
            sd.doctor_name,
            sd.work_date,
            sd.work_start_time,
            sd.work_end_time,
            sd.break_start_time,
            sd.break_end_time,
            sd.assigned_room_id,
            sd.status,
            sr.room_name,
            sr.room_number as assigned_room_number
        FROM station_doctors sd
        LEFT JOIN station_rooms sr ON sd.assigned_room_id = sr.room_id
        WHERE sd.station_id = :station_id
        AND DATE(sd.work_date) = :work_date
        AND sd.is_active = 1
        AND sd.assigned_room_id IS NOT NULL
        ORDER BY sr.room_number ASC
    ");

    $assignedStmt->execute([
        ':station_id' => $station_id,
        ':work_date' => $work_date
    ]);

    $assignedDoctors = $assignedStmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("✅ แพทย์ที่มีการมอบหมาย: " . count($assignedDoctors));

    // ============================================================
    // ✅ Response
    // ============================================================
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Data retrieved successfully',
        'data' => [
            'station' => $station,
            'work_date' => $work_date,
            'unassigned_doctors' => $unassignedDoctors,
            'assigned_doctors' => $assignedDoctors,
            'summary' => [
                'total_doctors' => count($unassignedDoctors) + count($assignedDoctors),
                'unassigned_count' => count($unassignedDoctors),
                'assigned_count' => count($assignedDoctors)
            ]
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    error_log("❌ Database Error: " . $e->getMessage());
    error_log("❌ Error Code: " . $e->getCode());
    error_log("❌ SQL State: " . $e->errorInfo[0]);

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database Error: ' . $e->getMessage(),
        'error_code' => $e->getCode(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ Error: " . $e->getMessage());

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}

exit();
?>