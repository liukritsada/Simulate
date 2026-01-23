<?php
// /hospital/api/get_room_doctors.php
header('Content-Type: application/json; charset=utf-8');

$room_id = $_GET['room_id'] ?? null;
$work_date = $_GET['work_date'] ?? date('Y-m-d');

if (!$room_id) {
    echo json_encode(['success' => false, 'message' => 'ไม่พบ room_id']);
    exit;
}

try {
    // ✅ ดึงแพทย์ในห้อง
    $query = "
        SELECT 
            rd.*
        FROM room_doctors rd
        WHERE rd.room_id = ? 
        AND DATE(rd.work_date) = ?
        AND rd.is_active = 1
        ORDER BY rd.doctor_name ASC
    ";
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param('is', $room_id, $work_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $doctors = [];
    while ($row = $result->fetch_assoc()) {
        $doctors[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'doctors' => $doctors,
            'total' => count($doctors)
        ]
    ]);
    
    $stmt->close();
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
