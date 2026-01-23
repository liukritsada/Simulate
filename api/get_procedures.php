<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = '172.25.41.30';
$port = '3306';
$dbname = 'pdp';
$username = 'root';
$password = 'abzolute';

$department_id = $_GET['department_id'] ?? '';

if (empty($department_id)) {
    echo json_encode([
        'success' => false,
        'message' => 'Department ID is required'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare("
	        SELECT 
	            procedure_item_id as procedure_id, 
	            procedure_name as procedure_name
	        FROM procedure_item 
	        WHERE department_id = :department_id 
	        AND is_active = 'Y'
	        ORDER BY procedure_name
    ");
    $stmt->execute([':department_id' => intval($department_id)]);
    $procedures = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $procedures,
        'count' => count($procedures),
        'department_id' => $department_id
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>