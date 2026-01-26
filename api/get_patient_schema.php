<?php
/**
 * API: Get Patient Database Schema
 * ดึงข้อมูล schema ของ table patient
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Use centralized database configuration
require_once __DIR__ . '/db_config.php';

try {
    $pdo = DBConfig::getPDO();

    // Get table schema
    $stmt = $pdo->query("DESC station_patients");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get sample data (first 3 records)
    $stmt = $pdo->query("SELECT * FROM station_patients LIMIT 3");
    $samples = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get current status distribution
    $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM station_patients GROUP BY status");
    $statusDist = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'schema' => $columns,
        'sample_data' => $samples,
        'status_distribution' => $statusDist,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
