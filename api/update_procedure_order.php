<?php
/**
 * update_procedure_order_FIXED.php
 * 
 * Update running_number สำหรับ procedure ที่ dragged
 * เมื่อ drag procedure เปลี่ยนตำแหน่ง ต้อง reorder ทั้งหมด
 * 
 * Request:
 * {
 *   "hn": "4112922",
 *   "appointment_date": "2026-01-22",
 *   "procedures": [
 *     { "id": 1024, "running_number": 1 },
 *     { "id": 1025, "running_number": 2 },
 *     ...
 *   ]
 * }
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');

error_reporting(E_ALL);
ini_set('display_errors', 0);

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
    PDO::ATTR_EMULATE_PREPARES => false,
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

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON input'
    ]);
    exit;
}

$hn = $data['hn'] ?? null;
$appointment_date = $data['appointment_date'] ?? null;
$procedures = $data['procedures'] ?? [];

if (!$hn || !$appointment_date || empty($procedures)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing required parameters: hn, appointment_date, procedures'
    ]);
    exit;
}

try {
    // Start transaction
    $pdo->beginTransaction();
    
    // ✅ Update ทีละ procedure ตามลำดับใหม่
    $updated = 0;
    foreach ($procedures as $proc) {
        $procedure_id = (int)($proc['id'] ?? $proc['procedure_id'] ?? 0);
        $new_running_number = (int)($proc['running_number'] ?? 0);
        
        if ($procedure_id <= 0 || $new_running_number <= 0) {
            throw new Exception("Invalid procedure data: id=$procedure_id, running_number=$new_running_number");
        }
        
        // Update running_number สำหรับ procedure นี้
        $stmt = $pdo->prepare("
            UPDATE station_patients 
            SET running_number = ?, update_date = NOW() 
            WHERE id = ? AND hn = ? AND appointment_date = ?
        ");
        
        $result = $stmt->execute([
            $new_running_number,
            $procedure_id,
            $hn,
            $appointment_date
        ]);
        
        if ($stmt->rowCount() > 0) {
            $updated++;
        }
    }
    
    // ✅ Verify: เช็ค running_number ไม่มีซ้ำ
    $stmt = $pdo->prepare("
        SELECT running_number, COUNT(*) as cnt 
        FROM station_patients 
        WHERE hn = ? AND appointment_date = ?
        GROUP BY running_number 
        HAVING cnt > 1
    ");
    $stmt->execute([$hn, $appointment_date]);
    $duplicates = $stmt->fetchAll();
    
    if (!empty($duplicates)) {
        throw new Exception('Duplicate running_numbers detected: ' . json_encode($duplicates));
    }
    
    // Commit transaction
    $pdo->commit();
    
    // ✅ Success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "อัพเดทลำดับสำเร็จ ($updated รายการ)",
        'data' => [
            'hn' => $hn,
            'appointment_date' => $appointment_date,
            'updated_count' => $updated,
            'total_count' => count($procedures)
        ]
    ]);
    
} catch (Exception $e) {
    // Rollback on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$pdo = null;
?>