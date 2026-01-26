<?php
/**
 * 👨‍⚕️ API: Get All Active Doctors for Dropdown
 * ดึงรายชื่อแพทย์ที่ active (is_active = 1)
 * 
 * Usage:
 * GET /get_doctors.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);

date_default_timezone_set('Asia/Bangkok');

// Use centralized database configuration
require_once __DIR__ . '/db_config.php';

try {
    $pdo = DBConfig::getPDO();

    error_log("📋 [GET DOCTORS] Fetching active doctors");

    // ✅ SQL Query - ดึงแพทย์ที่ active
    $sql = "
        SELECT 
            doctor_code,
            doctor_name,
            specialization,
            station_id,
            status
        FROM station_doctors
        WHERE is_active = 1
        ORDER BY doctor_name ASC
    ";

    error_log("📝 Running SQL query for active doctors");

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("✅ Retrieved " . count($doctors) . " doctors");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => '✅ ดึงข้อมูลแพทย์สำเร็จ',
        'data' => [
            'total_doctors' => count($doctors),
            'doctors' => $doctors,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ ERROR: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => '❌ ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}

exit();
?>