<?php
/**
 * API: Get Patients by Appointment Numbers + Department
 * ✅ ดึงข้อมูลคนไข้จากหมายเลขนัดหมาย + department_id
 * ✅ ใช้สำหรับ Room Detail
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);

date_default_timezone_set('Asia/Bangkok');

// Use centralized database configuration
require_once __DIR__ . '/db_config.php';

try {
    $pdo = DBConfig::getPDO();

    // ✅ รับข้อมูลจาก POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    $appointmentNumbers = $input['appointmentno'] ?? [];
    $departmentId = isset($input['department_id']) ? intval($input['department_id']) : 0;

    if (empty($appointmentNumbers)) {
        throw new Exception('ต้องระบุ appointmentno');
    }

    if ($departmentId <= 0) {
        throw new Exception('ต้องระบุ department_id');
    }

    // ✅ Sanitize appointment numbers
    $appointmentNumbers = array_map(function($no) {
        return trim($no);
    }, $appointmentNumbers);
    
    // ✅ สร้าง placeholders สำหรับ IN clause
    $placeholders = implode(',', array_fill(0, count($appointmentNumbers), '?'));
    
    error_log("🔍 [GET PATIENTS] Dept: $departmentId, Appointments: " . json_encode($appointmentNumbers));

    // ==========================================
    // ✅ ดึงข้อมูลคนไข้จากหมายเลขนัดหมาย + department_id
    // ==========================================
    $patientsSql = "
        SELECT 
            id,
            appointmentno,
            doctor_code,
            department_id,
            room_id,
            procedure_id,
            procedure_code,
            procedures,
            time_start,
            time_target,
            time_target_wait,
            flag,
            create_date,
            in_process,
            Actual_Time,
            appointment_date,
            hn,
            patient_name,
            patient_age,
            patient_gender
        FROM station_patients
        WHERE appointmentno IN ($placeholders)
        AND department_id = ?
        ORDER BY time_start ASC, create_date ASC
    ";

    error_log("📝 SQL: ดึงข้อมูลคนไข้ Dept=$departmentId");

    $stmt = $pdo->prepare($patientsSql);
    
    // ✅ สร้าง bind parameters: appointment numbers + department_id
    $bindParams = array_merge($appointmentNumbers, [$departmentId]);
    $stmt->execute($bindParams);
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("✅ Retrieved " . count($patients) . " patients from department $departmentId");

    // ==========================================
    // ✅ Sanitize data
    // ==========================================
    $patients = array_map(function($p) {
        return [
            'id' => (int)$p['id'],
            'appointmentno' => $p['appointmentno'],
            'hn' => $p['hn'] ?? '-',
            'patient_name' => $p['patient_name'] ?? '-',
            'patient_age' => $p['patient_age'] ?? '-',
            'patient_gender' => $p['patient_gender'] ?? '-',
            'doctor_code' => $p['doctor_code'] ?? '-',
            'department_id' => (int)$p['department_id'],
            'room_id' => (int)$p['room_id'],
            'procedure_id' => (int)$p['procedure_id'],
            'procedures' => $p['procedures'] ?? $p['procedure_code'] ?? '-',
            'time_start' => $p['time_start'] ?? '-',
            'time_target' => $p['time_target'] ?? '-',
            'Actual_Time' => $p['Actual_Time'] ?? '-',
            'appointment_date' => $p['appointment_date'] ?? '-',
            'in_process' => (int)$p['in_process'],
            'flag' => $p['flag'] ?? '-'
        ];
    }, $patients);

    // ==========================================
    // ✅ Return Response
    // ==========================================
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'ดึงข้อมูลคนไข้สำเร็จ',
        'data' => [
            'department_id' => $departmentId,
            'total_count' => count($patients),
            'patients' => $patients,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("❌ [GET PATIENTS] ERROR: " . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}

exit();
?>