<?php
/**
 * API: จัดการหัตถการของห้อง (ลบ) - FIXED WITH CORRECT TABLE NAME
 * POST /api/manage_room_procedures.php
 * 
 * ✅ Uses station_procedures table (NOT room_procedures)
 * 
 * Request:
 * {
 *   "action": "remove",
 *   "room_procedure_id": 123
 * }
 */

// ✅ Error handling
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // ✅ Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method. Use POST.');
    }

    // ✅ Get and decode JSON
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input or empty body');
    }

    // ✅ Get parameters
    $action = isset($input['action']) ? trim($input['action']) : '';
    $procedure_id = isset($input['room_procedure_id']) ? (int)$input['room_procedure_id'] : null;

    if (empty($action)) {
        throw new Exception('action parameter is required');
    }

    // ✅ Load database config
    if (!file_exists('./db_config.php') && !file_exists('../db_config.php') && !file_exists('../../db_config.php')) {
        throw new Exception('Database config file not found');
    }

    // Try different paths
    if (file_exists('./db_config.php')) {
        require_once './db_config.php';
    } elseif (file_exists('../db_config.php')) {
        require_once '../db_config.php';
    } elseif (file_exists('../../db_config.php')) {
        require_once '../../db_config.php';
    }

    // ✅ Check database connection
    if (!isset($conn) || !$conn) {
        throw new Exception('Database connection failed');
    }

    // ====================================
    // REMOVE ACTION - ✅ Uses station_procedures
    // ====================================
    if ($action === 'remove') {
        if (!$procedure_id) {
            throw new Exception('room_procedure_id is required');
        }

        // ✅ Check if procedure exists in station_procedures
        $query = "
            SELECT sp.procedure_id, sp.station_id, sp.procedure_name
            FROM station_procedures sp
            WHERE sp.procedure_id = ?
        ";

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . $conn->error);
        }

        $stmt->bind_param('i', $procedure_id);
        if (!$stmt->execute()) {
            throw new Exception('Query failed: ' . $stmt->error);
        }

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            throw new Exception('Procedure not found in station_procedures');
        }

        $data = $result->fetch_assoc();
        $station_id = $data['station_id'];
        $procedure_name = $data['procedure_name'] ?? 'Unknown';

        // ✅ Delete from station_procedures
        $deleteQuery = "DELETE FROM station_procedures WHERE procedure_id = ?";
        $stmt = $conn->prepare($deleteQuery);
        if (!$stmt) {
            throw new Exception('Delete prepare failed: ' . $conn->error);
        }

        $stmt->bind_param('i', $procedure_id);
        if (!$stmt->execute()) {
            throw new Exception('Delete failed: ' . $stmt->error);
        }

        $affectedRows = $conn->affected_rows;
        if ($affectedRows <= 0) {
            throw new Exception('Delete failed: no rows affected');
        }

        // ✅ Verify deletion
        $verifyQuery = "SELECT COUNT(*) as cnt FROM station_procedures WHERE procedure_id = ?";
        $stmt = $conn->prepare($verifyQuery);
        if (!$stmt) {
            throw new Exception('Verify prepare failed: ' . $conn->error);
        }

        $stmt->bind_param('i', $procedure_id);
        if (!$stmt->execute()) {
            throw new Exception('Verify query failed: ' . $stmt->error);
        }

        $verifyResult = $stmt->get_result();
        $verifyData = $verifyResult->fetch_assoc();

        if ($verifyData['cnt'] > 0) {
            throw new Exception('Delete verification failed: procedure still exists');
        }

        // ✅ Log activity (optional)
        $logQuery = "
            INSERT INTO activity_logs (
                user_id, 
                action, 
                table_name, 
                record_id, 
                details,
                created_at
            ) VALUES (?, ?, ?, ?, ?, NOW())
        ";

        $stmt = $conn->prepare($logQuery);
        if ($stmt) {
            $action_log = 'DELETE_PROCEDURE_FROM_STATION';
            $table_name = 'station_procedures';
            $details = json_encode([
                'procedure_id' => $procedure_id,
                'station_id' => $station_id,
                'procedure_name' => $procedure_name
            ]);
            $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 0;

            $stmt->bind_param(
                'issss',
                $user_id,
                $action_log,
                $table_name,
                $procedure_id,
                $details
            );
            $stmt->execute();
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Procedure deleted successfully',
            'data' => [
                'procedure_id' => $procedure_id,
                'station_id' => $station_id,
                'procedure_name' => $procedure_name
            ]
        ], JSON_UNESCAPED_UNICODE);
    }

    else {
        throw new Exception('Invalid action: ' . $action);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => $e->getCode()
    ], JSON_UNESCAPED_UNICODE);
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }
}
?>