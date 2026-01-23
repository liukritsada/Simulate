<?php
/**
 * ✅ get_stations_by_floor.php
 * ดึง stations ของ floor เรียงตามลำดับที่บันทึก (display_order)
 * 
 * Usage: GET /api/get_stations_by_floor.php?floor=1&department_id=1
 */

ob_end_clean();
ob_start();

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

date_default_timezone_set('Asia/Bangkok');

try {
    $floor = intval($_GET['floor'] ?? 1);
    $departmentId = intval($_GET['department_id'] ?? 0);

    if (!$floor) {
        throw new Exception('Missing floor parameter');
    }

    // Connect to DB
    $conn = new mysqli('127.0.0.1', 'sa', '', 'hospitalstation');
    $conn->set_charset('utf8mb4');

    if ($conn->connect_error) {
        throw new Exception('DB Connection failed: ' . $conn->connect_error);
    }

    // Build query
    $query = "
        SELECT 
            s.station_id,
            s.station_code,
            s.station_name,
            s.floor,
            s.department_id,
            s.display_order,
            COUNT(DISTINCT r.room_id) as room_count,
            s.is_active,
            s.created_at
        FROM stations s
        LEFT JOIN rooms r ON s.station_id = r.station_id
        WHERE s.floor = ?
    ";

    $params = [$floor];
    $types = 'i';

    if ($departmentId > 0) {
        $query .= " AND s.department_id = ?";
        $params[] = $departmentId;
        $types .= 'i';
    }

    // ✅ KEY: Order by display_order (custom order) then by station_id
    $query .= "
        GROUP BY s.station_id
        ORDER BY 
            CASE WHEN s.display_order IS NULL THEN 1 ELSE 0 END ASC,
            s.display_order ASC,
            s.station_id ASC
    ";

    error_log("📋 Query: $query");
    error_log("📋 Params: " . json_encode($params));

    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    // Bind parameters dynamically
    if (count($params) > 0) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $stations = [];
    while ($row = $result->fetch_assoc()) {
        $stations[] = [
            'station_id' => intval($row['station_id']),
            'station_code' => $row['station_code'],
            'station_name' => $row['station_name'],
            'floor' => intval($row['floor']),
            'department_id' => intval($row['department_id']),
            'display_order' => intval($row['display_order'] ?? 0),
            'room_count' => intval($row['room_count']),
            'is_active' => intval($row['is_active']),
            'created_at' => $row['created_at']
        ];
    }

    $stmt->close();
    $conn->close();

    ob_clean();
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $stations,
        'count' => count($stations)
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log('❌ ERROR: ' . $e->getMessage());
    
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>