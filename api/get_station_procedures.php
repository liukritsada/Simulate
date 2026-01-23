<?php
/**
 * ✅ GET Station Procedures API - WITH PROCEDUREPDP_ID
 * เพิ่ม Procedurepdp_id เพื่อรู้ว่า procedure มาจาก PDP ตัวไหน
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
date_default_timezone_set('Asia/Bangkok');

// ============================================
// ✅ Load Database Config
// ============================================
require_once __DIR__ . '/db_config.php';

$station_id = isset($_GET['station_id']) ? intval($_GET['station_id']) : 0;

if (!$station_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'station_id is required']);
    exit;
}

try {
    // ✅ ใช้ getPDO() ที่ถูกต้อง
    $conn = DBConfig::getPDO();
    
    // ✅ เพิ่ม Procedurepdp_id ในการ SELECT
    $query = "
        SELECT 
            sp.procedure_id,
            sp.Procedurepdp_id,
            sp.procedure_name,
            COALESCE(sp.wait_time, 0) as wait_time,
            COALESCE(sp.procedure_time, 0) as procedure_time,
            COALESCE(sp.staff_required, 0) as staff_required,
            COALESCE(sp.equipment_required, 0) as equipment_required,
            COALESCE(sp.Time_target, 0) as time_target
        FROM station_procedures sp
        WHERE sp.station_id = :station_id
        ORDER BY sp.procedure_name ASC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':station_id', $station_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $procedures = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $procedures[] = [
            'procedure_id' => intval($row['procedure_id']),
            'Procedurepdp_id' => intval($row['Procedurepdp_id']),  // ✅ เพิ่ม
            'procedure_name' => $row['procedure_name'],
            'wait_time' => intval($row['wait_time']),
            'procedure_time' => intval($row['procedure_time']),
            'staff_required' => intval($row['staff_required']),
            'equipment_required' => boolval($row['equipment_required']),
            'time_target' => intval($row['time_target'])  // ✅ เพิ่ม
        ];
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'procedures' => $procedures,
            'total_count' => count($procedures),
            'station_id' => $station_id
        ],
        'message' => count($procedures) . ' procedures found'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>