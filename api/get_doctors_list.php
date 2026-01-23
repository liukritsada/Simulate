<?php
/**
 * get_doctors_list.php
 * 
 * ✅ API ดึงรายชื่อหมอที่มีการนัดหมายในวันนี้
 * 
 * Purpose:
 * - ดึง unique doctors จาก station_patients
 * - Join กับ station_doctors เพื่อได้ doctor_name
 * - Populate dropdown filter "แพทย์"
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// Database connection
$host = 'localhost';
$dbname = 'hospitalstation';
$user = 'root';
$password = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $password, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}

// Get parameters
$date = $_GET['date'] ?? null;

if (!$date) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing required parameter: date'
    ]);
    exit;
}

try {
    // ========================================
    // ดึง doctor_code ที่มีข้อมูล (ไม่ใช่ NULL)
    // ========================================
    $sql = "
        SELECT DISTINCT
            sp.doctor_code,
            COALESCE(sd.doctor_name, sp.specialty, 'ไม่ระบุ') as doctor_name
        FROM station_patients sp
        LEFT JOIN station_doctors sd ON sp.doctor_code = sd.doctor_code
        WHERE sp.appointment_date = ?
        AND sp.doctor_code IS NOT NULL
        AND TRIM(COALESCE(sp.doctor_code, '')) != ''
        ORDER BY doctor_name ASC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$date]);
    $doctors = $stmt->fetchAll();
    
    // ========================================
    // Transform data
    // ========================================
    $result = array_map(function($doc) {
        return [
            'doctor_code' => $doc['doctor_code'] ?? '-',
            'doctor_name' => $doc['doctor_name'] ?? 'ไม่ระบุ'
        ];
    }, $doctors);
    
    // ========================================
    // Response
    // ========================================
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Doctors retrieved successfully',
        'data' => [
            'doctors' => $result,
            'count' => count($result)
        ],
        '_debug' => [
            'date' => $date,
            'total_doctors' => count($result)
        ]
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE);
}

$pdo = null;
?>