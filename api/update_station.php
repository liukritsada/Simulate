<?php
/**
 * 🔧 API: Update Station Name
 * ✅ รองรับการแก้ไขชื่อสถานี
 */

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class StationUpdater {
    private $pdo;
    private $errors = [];

    public function __construct() {
        try {
            $this->pdo = new PDO(
                "mysql:host=127.0.0.1;port=3306;dbname=hospitalstation;charset=utf8mb4",
                'sa',
                '',
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_TIMEOUT => 30
                ]
            );
        } catch (PDOException $e) {
            $this->addError('Database connection failed: ' . $e->getMessage());
            $this->sendResponse(false, 'Database connection failed');
        }
    }

    private function addError($message) {
        $this->errors[] = $message;
        error_log("[StationUpdater Error] $message");
    }

    private function sendResponse($success, $message, $data = null) {
        http_response_code($success ? 200 : 400);
        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data,
            'errors' => $this->errors,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    public function update($inputData) {
        error_log("\n" . str_repeat("═", 70) . "\n═  UPDATE STATION START\n" . str_repeat("═", 70));
        error_log("Input Data: " . json_encode($inputData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        // ✅ Validate input
        if (empty($inputData['station_id'])) {
            $this->addError('station_id is required');
            return $this->sendResponse(false, 'Validation failed', $this->errors);
        }

        if (empty($inputData['station_name'])) {
            $this->addError('station_name is required');
            return $this->sendResponse(false, 'Validation failed', $this->errors);
        }

        try {
            $stationId = intval($inputData['station_id']);
            $stationName = trim($inputData['station_name']);

            // ✅ Check if station exists
            $checkStmt = $this->pdo->prepare('SELECT station_id FROM stations WHERE station_id = ?');
            $checkStmt->execute([$stationId]);
            $existingStation = $checkStmt->fetch();

            if (!$existingStation) {
                $this->addError('Station not found');
                return $this->sendResponse(false, 'Station not found', $this->errors);
            }

            // ✅ Update station name
            $updateStmt = $this->pdo->prepare('
                UPDATE stations 
                SET station_name = ? 
                WHERE station_id = ?
            ');
            $updateStmt->execute([$stationName, $stationId]);

            if ($updateStmt->rowCount() > 0) {
                error_log("✅ Station updated successfully");
                return $this->sendResponse(true, 'Station updated successfully', [
                    'station_id' => $stationId,
                    'station_name' => $stationName
                ]);
            } else {
                return $this->sendResponse(true, 'No changes made', [
                    'station_id' => $stationId,
                    'station_name' => $stationName
                ]);
            }

        } catch (PDOException $e) {
            $this->addError('Database error: ' . $e->getMessage());
            error_log("❌ Error: " . $e->getMessage());
            return $this->sendResponse(false, 'Database error', $this->errors);
        }
    }
}

// ✅ Main
$inputData = json_decode(file_get_contents('php://input'), true) ?? [];
$updater = new StationUpdater();
$updater->update($inputData);
?>