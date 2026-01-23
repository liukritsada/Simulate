<?php
/**
 * API: Get Simulation Map Data
 * Returns station positions and patient simulation data for visual display
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;port=3306;dbname=hospitalstation;charset=utf8mb4",
        'sa',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$action = $_GET['action'] ?? 'map';

// Get hospital map with station positions
if ($action === 'map') {
    $stmt = $pdo->query("
        SELECT 
            s.station_id,
            s.station_code,
            s.station_name,
            s.floor,
            d.department_name,
            COUNT(sr.room_id) as room_count
        FROM stations s
        LEFT JOIN departments d ON s.department_id = d.department_id
        LEFT JOIN station_rooms sr ON s.station_id = sr.station_id
        GROUP BY s.station_id
        ORDER BY s.floor, s.station_id
    ");
    $stations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Generate positions for stations (grid layout per floor)
    $stationPositions = [];
    $floorStations = [];
    
    // Group by floor
    foreach ($stations as $station) {
        $floor = $station['floor'];
        if (!isset($floorStations[$floor])) {
            $floorStations[$floor] = [];
        }
        $floorStations[$floor][] = $station;
    }

    // Calculate positions
    foreach ($floorStations as $floor => $stationsInFloor) {
        $count = count($stationsInFloor);
        $cols = ceil(sqrt($count));
        $rows = ceil($count / $cols);
        
        foreach ($stationsInFloor as $index => $station) {
            $row = floor($index / $cols);
            $col = $index % $cols;
            
            // Calculate position (percentage based)
            $x = 10 + ($col * (80 / max(1, $cols - 1)));
            $y = 15 + ($row * (70 / max(1, $rows - 1)));
            
            $stationPositions[] = [
                'station_id' => $station['station_id'],
                'station_code' => $station['station_code'],
                'station_name' => $station['station_name'],
                'department_name' => $station['department_name'],
                'floor' => $station['floor'],
                'room_count' => $station['room_count'],
                'x' => round($x, 2),
                'y' => round($y, 2)
            ];
        }
    }

    // Add special stations (Registration, Payment, Pharmacy, Discharge)
    $specialStations = [
        ['id' => 'registration', 'name' => 'เวชระเบียน', 'floor' => 1, 'x' => 5, 'y' => 10, 'color' => '#3b82f6'],
        ['id' => 'screening', 'name' => 'Screening', 'floor' => 1, 'x' => 15, 'y' => 10, 'color' => '#10b981'],
        ['id' => 'payment', 'name' => 'การเงิน', 'floor' => 1, 'x' => 85, 'y' => 10, 'color' => '#f59e0b'],
        ['id' => 'pharmacy', 'name' => 'จ่ายยา', 'floor' => 1, 'x' => 85, 'y' => 85, 'color' => '#8b5cf6'],
        ['id' => 'discharge', 'name' => 'กลับบ้าน', 'floor' => 1, 'x' => 50, 'y' => 95, 'color' => '#ef4444']
    ];

    echo json_encode([
        'success' => true,
        'data' => [
            'stations' => $stationPositions,
            'special_stations' => $specialStations,
            'floors' => array_keys($floorStations)
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Get patient simulation path
if ($action === 'patient_path') {
    $patientId = $_GET['patient_id'] ?? 0;

    if ($patientId <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid patient ID'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Get patient info
    $stmt = $pdo->prepare("SELECT * FROM patients WHERE patient_id = :id");
    $stmt->execute([':id' => $patientId]);
    $patient = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$patient) {
        echo json_encode([
            'success' => false,
            'message' => 'Patient not found'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Get patient steps with station info
    $stmt = $pdo->prepare("
        SELECT 
            ps.*,
            s.station_code,
            s.station_name,
            s.floor
        FROM patient_steps ps
        LEFT JOIN stations s ON ps.station_id = s.station_id
        WHERE ps.patient_id = :id
        ORDER BY ps.step_order
    ");
    $stmt->execute([':id' => $patientId]);
    $steps = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate timeline and positions
    $startTime = strtotime($patient['start_time']);
    $currentTime = $startTime;
    $path = [];

    foreach ($steps as $step) {
        $stepStart = $currentTime;
        $stepEnd = $currentTime + ($step['estimated_duration'] * 60);

        // Determine position based on step type
        $position = null;
        if ($step['station_id']) {
            $position = ['type' => 'station', 'id' => $step['station_id']];
        } else {
            // Use special station
            $specialMap = [
                'registration' => 'registration',
                'screening' => 'screening',
                'payment' => 'payment',
                'pharmacy' => 'pharmacy',
                'discharge' => 'discharge'
            ];
            $position = ['type' => 'special', 'id' => $specialMap[$step['step_type']] ?? 'registration'];
        }

        $path[] = [
            'step_order' => $step['step_order'],
            'step_name' => $step['step_name'],
            'step_type' => $step['step_type'],
            'station_id' => $step['station_id'],
            'station_name' => $step['station_name'],
            'station_code' => $step['station_code'],
            'floor' => $step['floor'],
            'start_time' => date('H:i:s', $stepStart),
            'end_time' => date('H:i:s', $stepEnd),
            'duration' => $step['estimated_duration'],
            'position' => $position,
            'start_timestamp' => $stepStart,
            'end_timestamp' => $stepEnd
        ];

        $currentTime = $stepEnd;
    }

    $totalDuration = ($currentTime - $startTime) / 60;

    echo json_encode([
        'success' => true,
        'data' => [
            'patient' => $patient,
            'path' => $path,
            'total_duration' => round($totalDuration),
            'start_timestamp' => $startTime,
            'end_timestamp' => $currentTime
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'success' => false,
    'message' => 'Invalid action'
], JSON_UNESCAPED_UNICODE);
?>
