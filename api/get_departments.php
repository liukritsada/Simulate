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

$response = ['success' => false, 'message' => '', 'data' => []];

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_TIMEOUT => 10,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    // Fixed: Removed department_name_thai which doesn't exist
    $stmt = $pdo->prepare("SELECT department_id, department_name FROM DEPARTMENT");
    $stmt->execute();
    $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($departments)) {
        $response['message'] = 'No departments found';
        $response['data'] = [];
    } else {
        $response['success'] = true;
        $response['data'] = $departments;
        $response['count'] = count($departments);
    }

} catch (PDOException $e) {
    $response['message'] = 'Database error: ' . $e->getMessage();
    error_log("Database Error: " . $e->getMessage());
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>