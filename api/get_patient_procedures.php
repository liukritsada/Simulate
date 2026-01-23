<?php
/**
 * 💉 API: Get Patient Procedures (FIXED)
 * ดึง procedures ทั้งหมดของ 1 คนไข้ เรียงตาม running_number
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

ini_set('display_errors', 0);
error_reporting(E_ALL);

date_default_timezone_set('Asia/Bangkok');

// ✅ Database connection (FIXED credentials)
try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;port=3306;dbname=hospitalstation;charset=utf8mb4",
        'root',  // ← FIXED: was 'sa'
        ''       // ← Password is empty
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get parameters
    $patient_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;
    $hn = isset($_GET['hn']) ? trim($_GET['hn']) : '';
    $appointment_date = isset($_GET['appointment_date']) ? trim($_GET['appointment_date']) : '';

    error_log("💉 Get Patient Procedures: Patient ID=$patient_id, HN=$hn, Date=$appointment_date");

    // Build SQL Query
    $sql = "
        SELECT 
            id,
            patient_id,
            station_id,
            hn,
            patient_name,
            appointmentno,
            doctor_code,
            procedure_code,
            procedures,
            appointment_date,
            arrival_time,
            time_start,
            time_target,
            expected_wait_time,
            Actual_Time,
            Actual_wait,
            in_process,
            status,
            flag,
            running_number,
            room_id,
            create_date,
            update_date
        FROM station_patients
        WHERE 1=1
    ";

    $params = [];

    // Search by patient_id + hn + appointment_date
    if ($patient_id > 0 && !empty($hn) && !empty($appointment_date)) {
        $sql .= " AND patient_id = :patient_id AND hn = :hn AND appointment_date = :appointment_date";
        $params[':patient_id'] = $patient_id;
        $params[':hn'] = $hn;
        $params[':appointment_date'] = $appointment_date;
    }
    // Search by hn + appointment_date only
    else if (!empty($hn) && !empty($appointment_date)) {
        $sql .= " AND hn = :hn AND appointment_date = :appointment_date";
        $params[':hn'] = $hn;
        $params[':appointment_date'] = $appointment_date;
    }
    // Search by patient_id only
    else if ($patient_id > 0) {
        $sql .= " AND patient_id = :patient_id";
        $params[':patient_id'] = $patient_id;
    }
    else {
        throw new Exception('กรุณาระบุ patient_id หรือ (hn + appointment_date)');
    }

    $sql .= " ORDER BY running_number ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $procedures = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($procedures)) {
        throw new Exception('ไม่พบข้อมูลคนไข้');
    }

    // Get patient info from first record
    $patientInfo = $procedures[0];

    // Return response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'ดึงข้อมูล procedures สำเร็จ',
        'data' => [
            'patient_id' => (int)$patientInfo['patient_id'],
            'patient_info' => [
                'hn' => $patientInfo['hn'],
                'patient_name' => $patientInfo['patient_name'],
                'appointment_date' => $patientInfo['appointment_date'],
                'doctor_code' => $patientInfo['doctor_code'],
                'status' => $patientInfo['status']
            ],
            'total_procedures' => count($procedures),
            'procedures' => array_map(function($p) {
                // Handle undefined procedure names
                $proc_name = $p['procedures'];
                if (!$proc_name || $proc_name === 'undefined' || trim($proc_name) === '') {
                    $proc_name = $p['procedure_code'] ?: 'Procedure #' . $p['running_number'];
                }
                
                return [
                    'id' => (int)$p['id'],
                    'procedure_code' => $p['procedure_code'],
                    'procedure_name' => $proc_name,
                    'running_number' => (int)$p['running_number'],
                    'time_start' => $p['time_start'],
                    'status' => $p['status'],
                    'room_id' => $p['room_id']
                ];
            }, $procedures),
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("ERROR: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}

exit();
?>