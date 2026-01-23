<?php
header('Content-Type: application/json; charset=utf-8');

$host = '127.0.0.1';
$port = '3306';
$dbname = 'hospitalstation';
$username = 'sa';
$password = '';

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    // ✅ List all tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // ✅ Get info for each table
    $tableInfo = [];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        $stmt = $pdo->query("DESCRIBE `$table`");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $tableInfo[$table] = [
            'total_rows' => (int)$count,
            'columns' => array_column($columns, 'Field')
        ];
    }

    echo json_encode([
        'success' => true,
        'message' => '✅ Tables info retrieved',
        'data' => [
            'database' => $dbname,
            'tables' => $tableInfo
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => '❌ ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>