<?php
/**
 * 🔄 RESET DAILY DATA - Auto cleanup old records
 * ลบข้อมูลเก่า (เมื่อวาน) ทุกวันเที่ยงคืน
 */

header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Asia/Bangkok');

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

    $today = date('Y-m-d');
    
    // ✅ Reset Station Doctors (ลบแพทย์เมื่อวาน)
    $stmt = $pdo->prepare("
        DELETE FROM station_doctors 
        WHERE DATE(work_date) < :today
    ");
    $stmt->execute([':today' => $today]);
    $deletedDoctors = $stmt->rowCount();
    
    // ✅ Reset Station Staff (ลบพนักงานเมื่อวาน)
    $stmt = $pdo->prepare("
        DELETE FROM station_staff 
        WHERE DATE(work_date) < :today
    ");
    $stmt->execute([':today' => $today]);
    $deletedStaff = $stmt->rowCount();
    
    // ✅ Reset Station Patients (ลบคนไข้เมื่อวาน)
    $stmt = $pdo->prepare("
        DELETE FROM station_patients 
        WHERE DATE(created_at) < :today
    ");
    $stmt->execute([':today' => $today]);
    $deletedPatients = $stmt->rowCount();

    // ✅ Reset Room Assignments (ล้างการแบ่งห้องทั้งหมด)
    $stmt = $pdo->prepare("
        UPDATE station_staff 
        SET assigned_room_id = NULL, 
            status = 'available',
            assigned_at = NULL
        WHERE assigned_room_id IS NOT NULL
    ");
    $stmt->execute();
    $clearedRoomAssignments = $stmt->rowCount();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Reset daily data สำเร็จ',
        'data' => [
            'date' => $today,
            'deleted' => [
                'doctors' => $deletedDoctors,
                'staff' => $deletedStaff,
                'patients' => $deletedPatients
            ],
            'cleared' => [
                'room_assignments' => $clearedRoomAssignments
            ],
            'total_deleted' => $deletedDoctors + $deletedStaff + $deletedPatients,
            'total_cleared' => $clearedRoomAssignments,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
exit();
?>