
// ============================================
// 2. get_available_doctors.php
// ============================================
<?php
// /hospital/api/get_available_doctors.php
header('Content-Type: application/json; charset=utf-8');

$station_id = $_GET['station_id'] ?? null;
$work_date = $_GET['work_date'] ?? date('Y-m-d');

if (!$station_id) {
    echo json_encode(['success' => false, 'message' => 'ไม่พบ station_id']);
    exit;
}

try {
    // ✅ ดึงแพทย์ที่ยังไม่ได้มอบหมายห้อง
    $query = "
        SELECT 
            sd.*
        FROM station_doctors sd
        WHERE sd.station_id = ? 
        AND DATE(sd.work_date) = ?
        AND sd.is_active = 1
        AND (sd.assigned_room_id IS NULL OR sd.assigned_room_id = 0)
        ORDER BY sd.doctor_name ASC
    ";
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param('is', $station_id, $work_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $doctors = [];
    while ($row = $result->fetch_assoc()) {
        $doctors[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $doctors,
        'total' => count($doctors)
    ]);
    
    $stmt->close();
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
