<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db_config.php';

try {
    $pdo = DBConfig::getPDO();

    // Check if table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'station_rooms'");
    $exists = $stmt->fetch();

    if ($exists) {
        // Get table structure
        $stmt = $pdo->query("DESCRIBE station_rooms");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get row count
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM station_rooms");
        $count = $stmt->fetchColumn();

        echo json_encode([
            'success' => true,
            'table_exists' => true,
            'columns' => $columns,
            'row_count' => $count
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    } else {
        echo json_encode([
            'success' => false,
            'table_exists' => false,
            'message' => 'ตาราง station_rooms ไม่มีในฐานข้อมูล'
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
