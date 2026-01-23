<?php
/**
 * ULTRA SIMPLE TEST - No db_config needed
 * Place in: /hospital/api/simple_test.php
 */

// Start fresh
ob_end_clean();
ob_start();

// Suppress errors
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Set header
header('Content-Type: application/json; charset=utf-8');

// Clean buffer
ob_clean();

// Create simple response
$response = [
    'test' => 'simple_test.php',
    'status' => 'Working!',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
];

// Output
echo json_encode($response, JSON_PRETTY_PRINT);
exit;
?>