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
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ✅ Check patients table
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM patients WHERE appointment_date = '2026-01-13'");
    $patientsCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // ✅ Check station_patients table
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM station_patients WHERE appointment_date = '2026-01-13'");
    $stationPatientsCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // ✅ Sample data from patients
    $stmt = $pdo->query("SELECT * FROM patients WHERE appointment_date = '2026-01-13' LIMIT 3");
    $samplePatients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ Sample data from station_patients
    $stmt = $pdo->query("SELECT * FROM station_patients WHERE appointment_date = '2026-01-13' LIMIT 3");
    $sampleStationPatients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => '✅ Database connection OK',
        'data' => [
            'patients_table' => [
                'total_2026-01-13' => (int)$patientsCount,
                'sample' => $samplePatients
            ],
            'station_patients_table' => [
                'total_2026-01-13' => (int)$stationPatientsCount,
                'sample' => $sampleStationPatients
            ]
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