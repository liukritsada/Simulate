<?php
// ============================================
// DEBUG MODE - แสดง error ทั้งหมด
// ============================================
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/delete_station_error.log');

// ============================================
// LOG REQUEST DATA
// ============================================
$log_data = [
    'timestamp' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
    'query_string' => $_SERVER['QUERY_STRING'] ?? '',
    'input_data' => file_get_contents('php://input'),
    'post_data' => $_POST,
    'get_data' => $_GET
];

file_put_contents(__DIR__ . '/delete_station_debug.log', 
    json_encode($log_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n---\n", 
    FILE_APPEND
);

// ============================================
// HEADERS
// ============================================
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================
// DATABASE CONNECTION
// ============================================
try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;port=3306;dbname=hospitalstation;charset=utf8mb4",
        'sa',
        '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
    error_log("Database connected successfully");
    
} catch (PDOException $e) {
    $error_msg = 'Database connection failed: ' . $e->getMessage();
    error_log($error_msg);
    echo json_encode([
        'success' => false,
        'message' => $error_msg,
        'debug' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// ============================================
// MAIN DELETE LOGIC
// ============================================
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'DELETE' || $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    error_log("Input data: " . json_encode($input, JSON_UNESCAPED_UNICODE));
    
    $stationId = intval($input['station_id'] ?? 0);

    if ($stationId <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid station ID',
            'debug' => [
                'station_id_received' => $input['station_id'] ?? 'null',
                'station_id_parsed' => $stationId
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    try {
        error_log("Starting transaction for station ID: " . $stationId);
        $pdo->beginTransaction();

        // ============================================
        // STEP 1: Get station info
        // ============================================
        error_log("STEP 1: Getting station info");
        $stationStmt = $pdo->prepare("SELECT station_name, station_code FROM stations WHERE station_id = ?");
        $stationStmt->execute([$stationId]);
        $station = $stationStmt->fetch(PDO::FETCH_ASSOC);

        if (!$station) {
            $pdo->rollBack();
            http_response_code(404);
            error_log("Station not found: " . $stationId);
            echo json_encode([
                'success' => false,
                'message' => 'Station not found',
                'debug' => ['station_id' => $stationId]
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        error_log("Found station: " . json_encode($station, JSON_UNESCAPED_UNICODE));

        // ============================================
        // STEP 2: Get rooms
        // ============================================
        error_log("STEP 2: Getting rooms for station");
        $roomsStmt = $pdo->prepare("SELECT room_id FROM station_rooms WHERE station_id = ?");
        $roomsStmt->execute([$stationId]);
        $rooms = $roomsStmt->fetchAll(PDO::FETCH_COLUMN);
        
        error_log("Found " . count($rooms) . " rooms: " . json_encode($rooms));

        // ============================================
        // STEP 3: Clear assignments and delete related data
        // ============================================
        if (!empty($rooms)) {
            error_log("STEP 3: Processing " . count($rooms) . " rooms");
            $placeholders = implode(',', array_fill(0, count($rooms), '?'));
            
            try {
                // Clear staff assignments
                error_log("3.1: Clearing staff assignments");
                $stmt = $pdo->prepare("UPDATE station_staff SET assigned_room_id = NULL, status = 'available' WHERE assigned_room_id IN ($placeholders)");
                $stmt->execute($rooms);
                error_log("Cleared " . $stmt->rowCount() . " staff assignments");
                
            } catch (Exception $e) {
                error_log("Error clearing staff assignments: " . $e->getMessage());
                throw $e;
            }

            try {
                // Clear doctor assignments
                error_log("3.2: Clearing doctor assignments");
                $stmt = $pdo->prepare("UPDATE station_doctors SET assigned_room_id = NULL WHERE assigned_room_id IN ($placeholders)");
                $stmt->execute($rooms);
                error_log("Cleared " . $stmt->rowCount() . " doctor assignments");
                
            } catch (Exception $e) {
                error_log("Error clearing doctor assignments: " . $e->getMessage());
                throw $e;
            }

            try {
                // Delete room equipment
                error_log("3.3: Deleting room equipment");
                $stmt = $pdo->prepare("DELETE FROM room_equipment WHERE room_id IN ($placeholders)");
                $stmt->execute($rooms);
                error_log("Deleted " . $stmt->rowCount() . " room equipment records");
                
            } catch (Exception $e) {
                error_log("Error deleting room equipment: " . $e->getMessage());
                throw $e;
            }

            try {
                // Delete room procedures
                error_log("3.4: Deleting room procedures");
                $stmt = $pdo->prepare("DELETE FROM room_procedures WHERE room_id IN ($placeholders)");
                $stmt->execute($rooms);
                error_log("Deleted " . $stmt->rowCount() . " room procedures");
                
            } catch (Exception $e) {
                error_log("Error deleting room procedures: " . $e->getMessage());
                throw $e;
            }

            try {
                // Delete station patients
                error_log("3.5: Deleting station patients");
                $stmt = $pdo->prepare("DELETE FROM station_patients WHERE room_id IN ($placeholders)");
                $stmt->execute($rooms);
                error_log("Deleted " . $stmt->rowCount() . " station patients");
                
            } catch (Exception $e) {
                error_log("Error deleting station patients: " . $e->getMessage());
                throw $e;
            }

            try {
                // Delete station rooms
                error_log("3.6: Deleting station rooms");
                $stmt = $pdo->prepare("DELETE FROM station_rooms WHERE station_id = ?");
                $stmt->execute([$stationId]);
                error_log("Deleted " . $stmt->rowCount() . " station rooms");
                
            } catch (Exception $e) {
                error_log("Error deleting station rooms: " . $e->getMessage());
                throw $e;
            }
        } else {
            error_log("No rooms found for station");
        }

        // ============================================
        // STEP 4: Delete station data
        // ============================================
        error_log("STEP 4: Deleting station data");
        
        try {
            // Delete station staff
            error_log("4.1: Deleting station_staff");
            $stmt = $pdo->prepare("DELETE FROM station_staff WHERE station_id = ?");
            $stmt->execute([$stationId]);
            error_log("Deleted " . $stmt->rowCount() . " station staff records");
            
        } catch (Exception $e) {
            error_log("Error deleting station_staff: " . $e->getMessage());
            throw $e;
        }

        try {
            // Delete station doctors
            error_log("4.2: Deleting station_doctors");
            $stmt = $pdo->prepare("DELETE FROM station_doctors WHERE station_id = ?");
            $stmt->execute([$stationId]);
            error_log("Deleted " . $stmt->rowCount() . " station doctors records");
            
        } catch (Exception $e) {
            error_log("Error deleting station_doctors: " . $e->getMessage());
            throw $e;
        }

        try {
            // Delete station procedures
            error_log("4.3: Deleting station_procedures");
            $stmt = $pdo->prepare("DELETE FROM station_procedures WHERE station_id = ?");
            $stmt->execute([$stationId]);
            error_log("Deleted " . $stmt->rowCount() . " station procedures records");
            
        } catch (Exception $e) {
            error_log("Error deleting station_procedures: " . $e->getMessage());
            throw $e;
        }

        // ============================================
        // STEP 4.4: ✅ ข้ามตาราง 'staff' ไป (ไม่มีอยู่)
        // ============================================
        error_log("4.4: Skipping 'staff' table - it doesn't exist in database");

        try {
            // Delete station
            error_log("4.5: Deleting station from stations table");
            $stmt = $pdo->prepare("DELETE FROM stations WHERE station_id = ?");
            $stmt->execute([$stationId]);
            error_log("Deleted " . $stmt->rowCount() . " station record");
            
        } catch (Exception $e) {
            error_log("Error deleting station: " . $e->getMessage());
            throw $e;
        }

        // ============================================
        // COMMIT TRANSACTION
        // ============================================
        error_log("Committing transaction");
        $pdo->commit();
        error_log("Transaction committed successfully ✅");

        echo json_encode([
            'success' => true,
            'message' => 'Station deleted successfully',
            'data' => [
                'station_id' => $stationId,
                'station_name' => $station['station_name'],
                'station_code' => $station['station_code'],
                'rooms_deleted' => count($rooms),
                'debug_info' => [
                    'logs_saved_to' => [
                        'error_log' => __DIR__ . '/delete_station_error.log',
                        'debug_log' => __DIR__ . '/delete_station_debug.log'
                    ]
                ]
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            error_log("Rolling back transaction due to error");
            $pdo->rollBack();
        }

        http_response_code(500);
        $error_details = [
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage(),
            'debug' => [
                'error_code' => $e->getCode(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'error_trace' => $e->getTraceAsString(),
                'sql_state' => $e->errorInfo[0] ?? '',
                'driver_code' => $e->errorInfo[1] ?? '',
                'driver_message' => $e->errorInfo[2] ?? ''
            ]
        ];
        
        error_log("ERROR: " . json_encode($error_details, JSON_UNESCAPED_UNICODE));
        
        echo json_encode($error_details, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
    exit;
}

// ============================================
// METHOD NOT ALLOWED
// ============================================
http_response_code(405);
echo json_encode([
    'success' => false, 
    'message' => 'Method not allowed',
    'debug' => [
        'method_received' => $method,
        'allowed_methods' => ['POST', 'DELETE']
    ]
], JSON_UNESCAPED_UNICODE);
?>