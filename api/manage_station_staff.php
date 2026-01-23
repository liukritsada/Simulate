<?php
/**
 * API: Manage Station Staff
 * จัดการพนักงานในสเตชั่น (เพิ่ม/ลบ)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200 );
    exit();
}

ini_set('display_errors', 0);
error_reporting(0);

$host = '127.0.0.1';
$port = '3306';
$dbname = 'hospitalstation';
$username = 'sa';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    switch ($action) {
        case 'add':
            // Add staff to station
            $stationId = intval($input['station_id'] ?? 0);
            $staffId = intval($input['staff_id'] ?? 0);
            $staffName = $input['staff_name'] ?? ''; // Keep for now, but will be replaced by staff_id from UI
            $staffType = $input['staff_type'] ?? 'Staff';

            if ($stationId <= 0 || $staffId <= 0) { // staffName is now optional, staffId is key
                throw new Exception('Invalid parameters');
            }

            // Check if staff already in station
            $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM station_staff WHERE station_id = :station_id AND staff_id = :staff_id");
            $checkStmt->execute([':station_id' => $stationId, ':staff_id' => $staffId]);
            if ($checkStmt->fetchColumn() > 0) {
                throw new Exception('Staff ID ' . $staffId . ' already assigned to this station');
            }

            // 1. Insert into station_staff
            $stmt = $pdo->prepare("
                INSERT INTO station_staff (station_id, staff_id, staff_name, staff_type, assigned_at)
                VALUES (:station_id, :staff_id, :staff_name, :staff_type, NOW())
            ");
            $stmt->execute([
                ':station_id' => $stationId,
                ':staff_id' => $staffId,
                ':staff_name' => $staffName,
                ':staff_type' => $staffType
            ]);

            http_response_code(200 );
            echo json_encode([
                'success' => true,
                'message' => 'Staff added to station successfully',
                'data' => [
                    'staff_assignment_id' => $pdo->lastInsertId(),
                    'staff_id' => $staffId,
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit;

        case 'remove':
            // Remove staff from station
            $staffAssignmentId = intval($input['staff_assignment_id'] ?? 0);

            if ($staffAssignmentId <= 0) {
                throw new Exception('Invalid staff_assignment_id');
            }
            
            // Delete from station_staff
            $stmt = $pdo->prepare("DELETE FROM station_staff WHERE staff_assignment_id = :id");
            $stmt->execute([':id' => $staffAssignmentId]);

            http_response_code(200 );
            echo json_encode([
                'success' => true,
                'message' => 'Staff removed from station successfully'
            ], JSON_UNESCAPED_UNICODE);
            exit;

        default:
            throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    http_response_code(400 );
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
?>
