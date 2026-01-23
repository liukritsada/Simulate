<?php
/**
 * TEST add_room.php - Simple Version
 * Place in: /hospital/api/test_add_room.php
 */

// Start fresh
ob_end_clean();
ob_start();

// Suppress errors
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Set header
header('Content-Type: application/json; charset=utf-8');

try {
    // Get input
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    // Simple validation
    if (!isset($input['station_id']) || !isset($input['room_name'])) {
        throw new Exception('Missing station_id or room_name');
    }
    
    $station_id = intval($input['station_id']);
    $room_name = trim($input['room_name']);
    
    if (!$station_id || !$room_name) {
        throw new Exception('Invalid data');
    }
    
    // DON'T load db_config yet - just simulate
    // This proves the file structure works
    
    // Clean buffer before response
    ob_clean();
    
    // Simulate success
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => '✅ Room created successfully (TEST)',
        'data' => [
            'room_id' => rand(100, 999),
            'station_id' => $station_id,
            'room_name' => $room_name,
            'created_at' => date('Y-m-d H:i:s'),
            'test_mode' => true
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
    
} catch (Throwable $e) {
    // Clean buffer before error
    ob_clean();
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'test_mode' => true
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
?>