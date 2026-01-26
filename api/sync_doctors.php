<?php
/**
 * API: Sync Doctor Codes from External PDP Database to Local
 * Synchronizes doctor information from PDP to station_doctors table
 *
 * Usage: GET /api/sync_doctors.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
date_default_timezone_set('Asia/Bangkok');

// Use centralized database configurations
require_once __DIR__ . '/db_config.php';
require_once __DIR__ . '/external_db_config.php';

try {
    // Connect to local and external databases
    $localPdo = DBConfig::getPDO();
    $pdpPdo = ExternalDBConfig::getPDPConnection();

    $synced = 0;
    $skipped = 0;
    $errors = [];
    $syncedDoctors = [];

    // Get all unique doctor codes from station_patients
    $stmt = $localPdo->query("
        SELECT DISTINCT doctor_code
        FROM station_patients
        WHERE doctor_code IS NOT NULL
          AND doctor_code != ''
          AND TRIM(doctor_code) != ''
        ORDER BY doctor_code
    ");
    $doctorCodes = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($doctorCodes)) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'ไม่พบ doctor_code ที่ต้อง sync',
            'data' => [
                'total_codes' => 0,
                'synced' => 0,
                'skipped' => 0,
                'errors' => []
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Process each doctor code
    foreach ($doctorCodes as $code) {
        // Check if doctor already exists in station_doctors
        $stmt = $localPdo->prepare("
            SELECT COUNT(*) as count
            FROM station_doctors
            WHERE doctor_code = ?
        ");
        $stmt->execute([$code]);
        $exists = $stmt->fetchColumn();

        if ($exists > 0) {
            $skipped++;
            continue;
        }

        // Fetch doctor info from PDP database
        try {
            $stmt = $pdpPdo->prepare("
                SELECT doctor_name, specialization
                FROM doctors
                WHERE doctor_code = ?
                LIMIT 1
            ");
            $stmt->execute([$code]);
            $doctor = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($doctor && !empty($doctor['doctor_name'])) {
                // Insert into station_doctors
                $stmt = $localPdo->prepare("
                    INSERT INTO station_doctors (
                        station_id,
                        doctor_code,
                        doctor_name,
                        specialization,
                        is_active,
                        work_date,
                        status
                    ) VALUES (
                        0,
                        ?,
                        ?,
                        ?,
                        1,
                        CURDATE(),
                        'available'
                    )
                ");

                $stmt->execute([
                    $code,
                    $doctor['doctor_name'],
                    $doctor['specialization'] ?? null
                ]);

                $synced++;
                $syncedDoctors[] = [
                    'doctor_code' => $code,
                    'doctor_name' => $doctor['doctor_name'],
                    'specialization' => $doctor['specialization'] ?? '-'
                ];

                error_log("✅ Synced doctor: $code - {$doctor['doctor_name']}");
            } else {
                $errors[] = "Doctor code not found in PDP: $code";
                error_log("❌ Doctor not found in PDP: $code");
            }
        } catch (PDOException $e) {
            $errors[] = "Error syncing doctor $code: " . $e->getMessage();
            error_log("❌ Error syncing doctor $code: " . $e->getMessage());
        }
    }

    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Synced $synced doctors successfully",
        'data' => [
            'total_codes' => count($doctorCodes),
            'synced' => $synced,
            'skipped' => $skipped,
            'errors' => $errors,
            'synced_doctors' => $syncedDoctors
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    error_log("❌ Sync doctors error: " . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sync failed: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}
?>
