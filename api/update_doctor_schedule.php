<?php
// /hospital/api/update_doctor_schedule.php
header('Content-Type: application/json; charset=utf-8');

try {
    // ✅ เชื่อมต่อ Database
    $host = '127.0.0.1';
    $dbname = 'hospitalstation';
    $username = 'sa';
    $password = '';
    $port = 3306;
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=$charset";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);

    // ✅ ดึงข้อมูล JSON จาก request
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception('Invalid JSON input');
    }

    // ✅ ตรวจสอบ Parameters
    $doctor_id = $data['doctor_id'] ?? null;
    $station_id = $data['station_id'] ?? null;
    $work_start_time = $data['work_start_time'] ?? '08:00:00';
    $work_end_time = $data['work_end_time'] ?? '17:00:00';
    $break_start_time = $data['break_start_time'] ?? '12:00:00';
    $break_end_time = $data['break_end_time'] ?? '13:00:00';

    if (!$doctor_id || !$station_id) {
        throw new Exception('Missing required: doctor_id or station_id');
    }

    // ✅ Update station_doctors เท่านั้น
    $sql = "
        UPDATE station_doctors 
        SET 
            work_start_time = :work_start,
            work_end_time = :work_end,
            break_start_time = :break_start,
            break_end_time = :break_end
        WHERE station_doctor_id = :doctor_id 
        AND station_id = :station_id
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':work_start' => $work_start_time,
        ':work_end' => $work_end_time,
        ':break_start' => $break_start_time,
        ':break_end' => $break_end_time,
        ':doctor_id' => $doctor_id,
        ':station_id' => $station_id
    ]);

    $affected = $stmt->rowCount();

    echo json_encode([
        'success' => true,
        'message' => 'อัปเดตเวลาทำงานแพทย์สำเร็จ',
        'data' => [
            'station_doctor_id' => $doctor_id,
            'station_id' => $station_id,
            'affected_rows' => $affected,
            'work_start_time' => $work_start_time,
            'work_end_time' => $work_end_time,
            'break_start_time' => $break_start_time,
            'break_end_time' => $break_end_time
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>