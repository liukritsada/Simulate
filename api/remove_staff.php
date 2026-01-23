<?php
/**
 * API: Remove Staff from Station
 * ✅ ใช้ station_staff อย่างเดียว (ไม่ใช้ room_staff)
 * ✅ ลบพนักงานออกจากระบบ หรือ Clear assigned_room_id
 */

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
date_default_timezone_set('Asia/Bangkok');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class DBConfig {
    public static function getConnection() {
        $host = '127.0.0.1';
        $dbname = 'hospitalstation';
        $username = 'sa';
        $password = '';
        $port = 3306;
        $charset = 'utf8mb4';

        try {
            $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=$charset";
            $pdo = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
            return $pdo;
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }
}

try {
    $pdo = DBConfig::getConnection();
    
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    
    $staffId = $input['staff_id'] ?? null;
    $stationStaffId = $input['station_staff_id'] ?? null;
    $action = $input['action'] ?? 'remove'; // 'remove' หรือ 'unassign'
    
    if (!isset($staffId) && !isset($stationStaffId)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'staff_id or station_staff_id is required'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    if ($action === 'unassign') {
        // ✅ เฉพาะ Clear assigned_room_id (ไม่ลบพนักงาน)
        $updateStmt = $pdo->prepare("
            UPDATE station_staff 
            SET assigned_room_id = NULL,
                status = 'available',
                assigned_at = NULL
            WHERE " . ($stationStaffId ? "station_staff_id = :id" : "staff_id = :id")
        );
        $updateStmt->execute([':id' => $stationStaffId ?? $staffId]);
        
        if ($updateStmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Staff unassigned from room successfully',
                'data' => [
                    'staff_id' => $staffId,
                    'station_staff_id' => $stationStaffId,
                    'action' => 'unassigned'
                ]
            ], JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Staff not found'
            ], JSON_UNESCAPED_UNICODE);
        }
        exit;
    }
    
    // ✅ ลบพนักงานออกจากระบบ (DELETE)
    $stmt = $pdo->prepare("
        DELETE FROM station_staff 
        WHERE " . ($stationStaffId ? "station_staff_id = :id" : "staff_id = :id")
    );
    $stmt->execute([':id' => $stationStaffId ?? $staffId]);
    $deletedRows = $stmt->rowCount();
    
    if ($deletedRows > 0) {
        $message = "Staff removed successfully.";
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => [
                'staff_id' => $staffId,
                'station_staff_id' => $stationStaffId,
                'deleted_rows' => $deletedRows
            ]
        ], JSON_UNESCAPED_UNICODE);
    } else {
        $message = "Staff not found.";
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);
    }

} catch (PDOException $e) {
    error_log("❌ Database Error in remove_staff.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => "Database Error: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    error_log("❌ Error in remove_staff.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>