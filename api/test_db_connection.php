<?php
header('Content-Type: application/json; charset=utf-8');
$tests = [];
try {
    $tests['step_1_php'] = 'OK';
    require_once __DIR__ . '/db_config.php';
    $tests['step_2_db_config_loaded'] = 'OK';
    $conn = DBConfig::getConnection();
    $tests['step_3_connection'] = 'OK';
    $result = $conn->query("SELECT COUNT(*) as total FROM station_procedures WHERE station_id = 80");
    $data = $result->fetch(PDO::FETCH_ASSOC);
    $tests['step_4_query'] = 'OK';
    $tests['station_80_procedures'] = $data['total'];
    echo json_encode(['success' => true, 'tests' => $tests]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage(), 'tests' => $tests]);
}
?>