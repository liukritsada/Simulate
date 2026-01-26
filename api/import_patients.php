<?php
/**
 * API: Import Patient Data from Text/Excel
 * Creates patients and auto-generates treatment steps
 */

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class PatientImporter {
    private $pdo;
    private $pdpPdo;
    private $errors = [];
    private $warnings = [];

    public function __construct() {
        try {
            // Use centralized database configurations
            require_once __DIR__ . '/db_config.php';
            require_once __DIR__ . '/external_db_config.php';

            // Local database connection
            $this->pdo = DBConfig::getPDO();

            // External PDP database connection
            $this->pdpPdo = ExternalDBConfig::getPDPConnection();
        } catch (PDOException $e) {
            $this->sendResponse(false, 'Database connection failed: ' . $e->getMessage());
        } catch (RuntimeException $e) {
            $this->sendResponse(false, 'Database connection failed: ' . $e->getMessage());
        }
    }

    private function sendResponse($success, $message, $data = null) {
        http_response_code($success ? 200 : 400);
        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data,
            'errors' => $this->errors,
            'warnings' => $this->warnings
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Main import function
     */
    public function import($inputData) {
        try {
            $importType = $inputData['import_type'] ?? 'text'; // text or excel
            $rawData = $inputData['data'] ?? '';

            if (empty($rawData)) {
                return $this->sendResponse(false, 'No data provided');
            }

            // Parse data based on type
            $patients = $this->parseData($rawData, $importType);

            if (empty($patients)) {
                return $this->sendResponse(false, 'No valid patient data found');
            }

            // Process each patient
            $results = [];
            $successCount = 0;
            $failCount = 0;

            foreach ($patients as $patientData) {
                try {
                    $this->pdo->beginTransaction();
                    
                    $patientId = $this->createPatient($patientData);
                    $steps = $this->generateSteps($patientId, $patientData);
                    
                    $this->pdo->commit();
                    
                    $results[] = [
                        'hn' => $patientData['hn'],
                        'name' => $patientData['name'],
                        'patient_id' => $patientId,
                        'steps_count' => count($steps),
                        'status' => 'success'
                    ];
                    $successCount++;
                } catch (Exception $e) {
                    if ($this->pdo->inTransaction()) {
                        $this->pdo->rollBack();
                    }
                    $results[] = [
                        'hn' => $patientData['hn'] ?? 'unknown',
                        'name' => $patientData['name'] ?? 'unknown',
                        'status' => 'failed',
                        'error' => $e->getMessage()
                    ];
                    $failCount++;
                }
            }

            return $this->sendResponse(true, "Import completed: $successCount success, $failCount failed", [
                'total' => count($patients),
                'success' => $successCount,
                'failed' => $failCount,
                'results' => $results
            ]);

        } catch (Exception $e) {
            return $this->sendResponse(false, 'Import failed: ' . $e->getMessage());
        }
    }

    /**
     * Parse raw data into structured patient array
     */
    private function parseData($rawData, $type) {
        $patients = [];
        
        if ($type === 'text') {
            $lines = explode("\n", $rawData);
            
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line)) continue;

                // Parse format: 1    20241007-217    5218262 สมหมาย ใจดี    +66819203788    OCT Mac BE,ขยายม่านตา    นพ.สมบัติ    20/11/2025    00:00
                $parts = preg_split('/\s{2,}|\t+/', $line);
                
                if (count($parts) < 8) {
                    $this->warnings[] = "Skipped invalid line: $line";
                    continue;
                }

                // Extract HN and Name
                $hnName = $parts[2] ?? '';
                preg_match('/^(\d+)\s+(.+)$/', $hnName, $matches);
                
                if (count($matches) < 3) {
                    $this->warnings[] = "Cannot parse HN and name: $hnName";
                    continue;
                }

                $hn = $matches[1];
                $name = $matches[2];
                $phone = $parts[3] ?? '';
                $procedures = $parts[4] ?? '';
                $doctor = $parts[5] ?? '';
                $date = $parts[6] ?? '';
                $time = $parts[7] ?? '';

                // Convert date format
                $appointmentDate = $this->convertDate($date);
                $appointmentTime = $this->convertTime($time);

                $patients[] = [
                    'hn' => $hn,
                    'name' => $name,
                    'phone' => $phone,
                    'procedures' => array_filter(array_map('trim', explode(',', $procedures))),
                    'doctor' => $doctor,
                    'appointment_date' => $appointmentDate,
                    'appointment_time' => $appointmentTime
                ];
            }
        }

        return $patients;
    }

    /**
     * Convert date format from DD/MM/YYYY to YYYY-MM-DD
     */
    private function convertDate($dateStr) {
        $parts = explode('/', $dateStr);
        if (count($parts) === 3) {
            return sprintf('%s-%s-%s', $parts[2], $parts[1], $parts[0]);
        }
        return date('Y-m-d');
    }

    /**
     * Convert time format
     */
    private function convertTime($timeStr) {
        if ($timeStr === '00:00' || empty($timeStr)) {
            return '09:00:00'; // Default start time
        }
        return $timeStr . ':00';
    }

    /**
     * Create patient record
     */
    private function createPatient($data) {
        // Check if patient already exists
        $stmt = $this->pdo->prepare("SELECT patient_id FROM patients WHERE hn = :hn");
        $stmt->execute([':hn' => $data['hn']]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            // Update existing patient
            $stmt = $this->pdo->prepare("
                UPDATE patients 
                SET patient_name = :name, 
                    phone = :phone, 
                    appointment_date = :date, 
                    appointment_time = :time,
                    status = 'waiting',
                    current_step = 0,
                    updated_at = NOW()
                WHERE hn = :hn
            ");
            $stmt->execute([
                ':name' => $data['name'],
                ':phone' => $data['phone'],
                ':date' => $data['appointment_date'],
                ':time' => $data['appointment_time'],
                ':hn' => $data['hn']
            ]);

            // Delete old steps
            $stmt = $this->pdo->prepare("DELETE FROM patient_steps WHERE patient_id = :patient_id");
            $stmt->execute([':patient_id' => $existing['patient_id']]);

            return $existing['patient_id'];
        } else {
            // Create new patient
            $stmt = $this->pdo->prepare("
                INSERT INTO patients 
                (hn, patient_name, phone, appointment_date, appointment_time, start_time, status)
                VALUES (:hn, :name, :phone, :date, :time, CONCAT(:date, ' ', :time), 'waiting')
            ");
            $stmt->execute([
                ':hn' => $data['hn'],
                ':name' => $data['name'],
                ':phone' => $data['phone'],
                ':date' => $data['appointment_date'],
                ':time' => $data['appointment_time']
            ]);

            return $this->pdo->lastInsertId();
        }
    }

    /**
     * Generate treatment steps for patient
     */
    private function generateSteps($patientId, $patientData) {
        $steps = [];
        $stepOrder = 1;

        // 1. Registration (เวชระเบียน)
        $steps[] = $this->createStep($patientId, $stepOrder++, 'registration', 'เวชระเบียน', null, null, null, null, 5);

        // 2. Screening
        $steps[] = $this->createStep($patientId, $stepOrder++, 'screening', 'Screening', null, null, null, null, 10);

        // 3. Procedures (หัตถการที่ import เข้ามา)
        foreach ($patientData['procedures'] as $procedureName) {
            $mapping = $this->findProcedureMapping($procedureName);
            
            if ($mapping) {
                $steps[] = $this->createStep(
                    $patientId, 
                    $stepOrder++, 
                    'procedure', 
                    $procedureName, 
                    $mapping['station_id'], 
                    null, 
                    $mapping['procedure_id'], 
                    null, 
                    $mapping['estimated_duration']
                );
            } else {
                // Create unmapped procedure
                $steps[] = $this->createStep($patientId, $stepOrder++, 'procedure', $procedureName, null, null, null, null, 15);
                $this->warnings[] = "Procedure '$procedureName' not mapped to any station";
            }
        }

        // 4. Doctor Visit (พบแพทย์)
        if (!empty($patientData['doctor'])) {
            $doctorStation = $this->findDoctorStation($patientData['doctor']);
            
            if ($doctorStation) {
                $steps[] = $this->createStep(
                    $patientId, 
                    $stepOrder++, 
                    'doctor', 
                    'พบแพทย์ ' . $patientData['doctor'], 
                    $doctorStation['station_id'], 
                    $doctorStation['room_id'], 
                    null, 
                    $patientData['doctor'], 
                    20
                );
            } else {
                $steps[] = $this->createStep($patientId, $stepOrder++, 'doctor', 'พบแพทย์ ' . $patientData['doctor'], null, null, null, $patientData['doctor'], 20);
                $this->warnings[] = "Doctor '{$patientData['doctor']}' not assigned to any station";
            }
        }

        // 5. Payment (การเงิน)
        $steps[] = $this->createStep($patientId, $stepOrder++, 'payment', 'การเงิน', null, null, null, null, 5);

        // 6. Pharmacy (จ่ายยา)
        $steps[] = $this->createStep($patientId, $stepOrder++, 'pharmacy', 'จ่ายยา', null, null, null, null, 10);

        // 7. Discharge (กลับบ้าน)
        $steps[] = $this->createStep($patientId, $stepOrder++, 'discharge', 'กลับบ้าน', null, null, null, null, 0);

        return $steps;
    }

    /**
     * Create a single step
     */
    private function createStep($patientId, $order, $type, $name, $stationId, $roomId, $procedureId, $doctorName, $duration) {
        $stmt = $this->pdo->prepare("
            INSERT INTO patient_steps 
            (patient_id, step_order, step_type, step_name, station_id, room_id, procedure_id, doctor_name, estimated_duration)
            VALUES (:patient_id, :order, :type, :name, :station_id, :room_id, :procedure_id, :doctor_name, :duration)
        ");

        $stmt->execute([
            ':patient_id' => $patientId,
            ':order' => $order,
            ':type' => $type,
            ':name' => $name,
            ':station_id' => $stationId,
            ':room_id' => $roomId,
            ':procedure_id' => $procedureId,
            ':doctor_name' => $doctorName,
            ':duration' => $duration
        ]);

        return $this->pdo->lastInsertId();
    }

    /**
     * Find procedure mapping in database
     */
    private function findProcedureMapping($procedureName) {
        $stmt = $this->pdo->prepare("
            SELECT procedure_id, station_id, estimated_duration 
            FROM procedure_mapping 
            WHERE import_procedure_name = :name
        ");
        $stmt->execute([':name' => $procedureName]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Find doctor's assigned station
     */
    private function findDoctorStation($doctorName) {
        $stmt = $this->pdo->prepare("
            SELECT station_id, room_id 
            FROM doctor_stations 
            WHERE doctor_name = :name AND is_active = 1
            LIMIT 1
        ");
        $stmt->execute([':name' => $doctorName]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}

// Handle request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON input'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $importer = new PatientImporter();
    $importer->import($data);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Only POST method is allowed'
    ], JSON_UNESCAPED_UNICODE);
}
?>
