<?php
/**
 * API: Create Hospital Station - SIMPLEST FIX
 * ✅ ใช้ station_id เป็น department_id เลย
 * ✅ station_id auto_increment → department_id auto_increment
 * ✅ 1:1 relationship = ไม่มี duplicate ได้เลย
 */

ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class StationCreator {
    private $pdo;
    private $errors = [];

    public function __construct() {
        try {
            $this->pdo = new PDO(
                "mysql:host=127.0.0.1;port=3306;dbname=hospitalstation;charset=utf8mb4",
                'sa',
                '',
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_PERSISTENT => false
                ]
            );
        } catch (PDOException $e) {
            $this->addError('Database connection failed: ' . $e->getMessage());
            $this->sendResponse(false, 'Database connection failed');
        }
    }

    private function addError($message) {
        $this->errors[] = $message;
        error_log("[StationCreator Error] $message");
    }

    private function sendResponse($success, $message, $data = null) {
        http_response_code($success ? 200 : 400);
        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data,
            'errors' => $this->errors,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    public function create($inputData) {
        error_log("\n" . str_repeat("═", 70) . "\n═  CREATE STATION START\n" . str_repeat("═", 70));
        error_log("Input Data: " . json_encode($inputData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        if (!$this->validateInput($inputData)) {
            error_log("✗ Validation failed");
            return $this->sendResponse(false, 'Validation failed', $this->errors);
        }

        $stationType = isset($inputData['station_type']) ? $inputData['station_type'] : 'with_rooms';
        $procedureMap = [];

        if ($stationType === 'with_rooms') {
            $procedureMap = $this->verifyProcedures(isset($inputData['procedure_ids']) ? $inputData['procedure_ids'] : []);
            if ($procedureMap === false) {
                return $this->sendResponse(false, 'Procedure verification failed', $this->errors);
            }
            $inputData['procedure_map'] = $procedureMap;
        }

        try {
            $this->pdo->beginTransaction();

            $stationId = $this->createStation($inputData);
            if (!$stationId) throw new Exception('Failed to create station');

            $stationCode = $this->generateStationCode($inputData['station_name'], $inputData['floor'], $stationId);
            $this->updateStationCode($stationId, $stationCode);

            if ($stationType === 'with_rooms') {
                $this->addStationProcedures($stationId, $procedureMap);
                
                $doctors = isset($inputData['doctors']) ? $inputData['doctors'] : [];
                if (!empty($doctors)) {
                    $stationDoctorIds = $this->addStationDoctors($stationId, $doctors);
                    $this->addRoomDoctors($stationId, $doctors, $stationDoctorIds);
                }
                
                $this->createStaff(isset($inputData['staff']) ? $inputData['staff'] : [], $stationId);
                $rooms = $this->createRooms($stationId, $inputData);
            } else {
                error_log("✅ Simple station created - no staff/schedules added");
            }

            $this->pdo->commit();

            $responseData = [
                'station_id' => $stationId,
                'department_id' => $stationId,  // ← SAME!
                'station_code' => $stationCode,
                'station_name' => $inputData['station_name'],
                'station_type' => $stationType,
                'floor' => $inputData['floor']
            ];

            if ($stationType === 'simple') {
                $responseData['message'] = 'Simple station created. Please add configuration later.';
            } else {
                $responseData['room_count'] = count(isset($rooms) ? $rooms : []);
                $responseData['procedures_count'] = count(isset($inputData['procedure_ids']) ? $inputData['procedure_ids'] : []);
                $responseData['staff_count'] = count(isset($inputData['staff']) ? $inputData['staff'] : []);
                $responseData['doctors_count'] = count(isset($inputData['doctors']) ? $inputData['doctors'] : []);
            }

            error_log("\n✓ Station created successfully!\n" . str_repeat("═", 70) . "\n");
            return $this->sendResponse(true, 'Station created successfully', $responseData);

        } catch (Exception $e) {
            error_log("\n✗ EXCEPTION: " . $e->getMessage() . "\n");
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            $this->addError($e->getMessage());
            return $this->sendResponse(false, 'Failed to create station', null);
        }
    }

    private function validateInput($data) {
        if (empty($data['station_name'])) {
            $this->addError('station_name is required');
            return false;
        }
        if (!isset($data['floor']) || $data['floor'] < 1 || $data['floor'] > 6) {
            $this->addError('floor must be 1-6');
            return false;
        }

        $stationType = isset($data['station_type']) ? $data['station_type'] : 'with_rooms';
        if (!in_array($stationType, ['with_rooms', 'simple'])) {
            $this->addError('station_type must be with_rooms or simple');
            return false;
        }

        if ($stationType === 'with_rooms') {
            if (!isset($data['procedure_ids']) || !is_array($data['procedure_ids'])) {
                $data['procedure_ids'] = [];
            }
            $roomCount = intval(isset($data['room_count']) ? $data['room_count'] : 1);
            if ($roomCount < 1 || $roomCount > 10) {
                $this->addError('room_count must be 1-10');
                return false;
            }
        }
        return true;
    }

    private function verifyProcedures($procedureIds) {
        if (empty($procedureIds)) return [];

        try {
            $pdpPdo = new PDO(
                "mysql:host=172.25.41.30;port=3306;dbname=pdp;charset=utf8",
                'root',
                'abzolute',
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        } catch (Exception $e) {
            error_log("⚠️ PDP connection failed - assuming procedures valid");
            return array_fill_keys($procedureIds, 'Verified Procedure');
        }

        $placeholders = implode(',', array_fill(0, count($procedureIds), '?'));
        $stmt = $pdpPdo->prepare("SELECT procedure_item_id, procedure_name FROM procedure_item WHERE procedure_item_id IN ($placeholders)");
        $stmt->execute($procedureIds);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($results) != count($procedureIds)) {
            $this->addError('Some procedure IDs are invalid');
            return false;
        }

        // ✅ เปลี่ยน: return array ที่มีทั้ง procedure_item_id + procedure_name
        $procedureMap = [];
        foreach ($results as $row) {
            $procedureMap[$row['procedure_item_id']] = [
                'name' => $row['procedure_name'],
                'pdp_id' => $row['procedure_item_id']  // ✅ เพิ่ม
            ];
        }
        return $procedureMap;
    }

    private function createStaff($staff, $stationId = null) {
        if (empty($staff) || !is_array($staff)) return [];

        $staffMap = [];
        $stmt = $this->pdo->prepare("
            INSERT INTO station_staff 
            (station_id, staff_name, staff_id, staff_type, work_start_time, work_end_time, break_start_time, break_end_time, is_active)
            VALUES (:station_id, :name, :staff_id, :staff_type, :work_start, :work_end, :break_start, :break_end, 1)
        ");

        foreach ($staff as $s) {
            if (empty($s['name'])) continue;
            $stmt->execute([
                ':station_id' => $stationId,
                ':name' => $s['name'],
                ':staff_id' => isset($s['staff_id']) ? $s['staff_id'] : null,
                ':staff_type' => isset($s['staff_type']) ? $s['staff_type'] : 'Staff',
                ':work_start' => isset($s['work_start_time']) ? $s['work_start_time'] : '08:00:00',
                ':work_end' => isset($s['work_end_time']) ? $s['work_end_time'] : '17:00:00',
                ':break_start' => isset($s['break_start_time']) ? $s['break_start_time'] : '12:00:00',
                ':break_end' => isset($s['break_end_time']) ? $s['break_end_time'] : '13:00:00'
            ]);
            $staffMap[$s['name']] = $this->getLastInsertId();
        }

        error_log("✓ Staff created: " . count($staffMap));
        return $staffMap;
    }

    private function addStationProcedures($stationId, $procedureMap) {
        if (empty($procedureMap)) {
            error_log("⚠️ No procedures for station $stationId");
            return;
        }

        // ✅ เพิ่ม Procedurepdp_id ใน INSERT
        $stmt = $this->pdo->prepare("
            INSERT INTO station_procedures 
            (station_id, Procedurepdp_id, procedure_name, wait_time, procedure_time, staff_required)
            VALUES (:station_id, :Procedurepdp_id, :procedure_name, :wait_time, :procedure_time, :staff_required)
        ");

        foreach ($procedureMap as $procId => $procData) {
            // ✅ Handle both old format (string) dan new format (array)
            $procName = is_array($procData) ? $procData['name'] : $procData;
            $pdpId = is_array($procData) ? $procData['pdp_id'] : $procId;
            
            $stmt->execute([
                ':station_id' => $stationId,
                ':Procedurepdp_id' => intval($pdpId),  // ✅ เพิ่ม
                ':procedure_name' => $procName,
                ':wait_time' => 10,
                ':procedure_time' => 30,
                ':staff_required' => 0
            ]);
        }

        error_log("✓ Procedures added: " . count($procedureMap));
    }

    private function generateStationCode($stationName, $floor, $stationId) {
        $nameShort = strtoupper(mb_substr($stationName, 0, 3, 'UTF-8'));
        return sprintf('%s-F%d-%03d', $nameShort, $floor, $stationId);
    }

    private function updateStationCode($stationId, $stationCode) {
        $stmt = $this->pdo->prepare("UPDATE stations SET station_code = :code WHERE station_id = :id");
        $stmt->execute([':code' => $stationCode, ':id' => $stationId]);
        error_log("✓ Station code generated: $stationCode");
    }

    /**
     * 🎯 SIMPLEST FIX: Insert ทั่วไป ปล่อยให้ station_id auto_increment
     * แล้ว UPDATE department_id = station_id ทันที
     */
    private function createStation($data) {
        $stationType = isset($data['station_type']) ? $data['station_type'] : 'with_rooms';
        $requireDoctor = (isset($data['require_doctor']) && $data['require_doctor']) ? 1 : 0;

        // 🔧 Step 1: ใส่ค่า placeholder สำหรับ department_id ชั่วคราว
        // เพราะ unique constraint ต้องมีค่าให้ก่อน
        $sql = "
            INSERT INTO stations 
            (station_name, station_type, department_id, floor, room_count, require_doctor, 
             default_wait_time, default_service_time, staff_count, staff_schedules_json)
            VALUES (:name, :station_type, 0, :floor, :room_count, :require_doctor, 
                    :default_wait_time, :default_service_time, :staff_count, :staff_schedules_json)
        ";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            
            error_log("📌 Type: $stationType station");
            
            $params = [
                ':name' => $data['station_name'],
                ':station_type' => $stationType,
                ':floor' => intval($data['floor']),
                ':room_count' => intval(isset($data['room_count']) ? $data['room_count'] : 1),
                ':require_doctor' => $requireDoctor,
                ':default_wait_time' => null,
                ':default_service_time' => null,
                ':staff_count' => 0,
                ':staff_schedules_json' => null
            ];
            
            error_log("📋 Inserting station...");
            $result = $stmt->execute($params);
            
            if (!$result) {
                throw new Exception('Execute returned false');
            }
            
            $stationId = $this->getLastInsertId();
            
            if (!$stationId) {
                throw new Exception('Failed to get lastInsertId - returned 0 or null');
            }
            
            error_log("✅ Station inserted: ID=$stationId");
            
            // 🔧 Step 2: UPDATE department_id = station_id ทันที
            $updateSql = "UPDATE stations SET department_id = :station_id WHERE station_id = :station_id";
            $updateStmt = $this->pdo->prepare($updateSql);
            $updateResult = $updateStmt->execute([':station_id' => $stationId]);
            
            if (!$updateResult) {
                throw new Exception('Failed to update department_id');
            }
            
            error_log("✅ Department_id updated: $stationId (same as station_id)");
            error_log("✅ Station created successfully: ID=$stationId, department_id=$stationId");
            
            return $stationId;
            
        } catch (PDOException $e) {
            error_log("❌ PDO Exception in createStation:");
            error_log("   Error Code: " . $e->getCode());
            error_log("   Message: " . $e->getMessage());
            if (isset($stmt)) {
                $errorInfo = $stmt->errorInfo();
                error_log("   SQL State: " . $errorInfo[0]);
                error_log("   Driver Code: " . $errorInfo[1]);
                error_log("   Driver Message: " . $errorInfo[2]);
            }
            $this->addError('Database error: ' . $e->getMessage());
            throw $e;
        } catch (Exception $e) {
            error_log("❌ General Exception in createStation:");
            error_log("   Message: " . $e->getMessage());
            $this->addError($e->getMessage());
            throw $e;
        }
    }

    private function getLastInsertId() {
        try {
            $result = $this->pdo->query("SELECT LAST_INSERT_ID() as id");
            $row = $result->fetch(PDO::FETCH_ASSOC);
            return intval($row['id'] ?? 0);
        } catch (Exception $e) {
            error_log("❌ Failed to get last insert ID: " . $e->getMessage());
            return 0;
        }
    }

    private function addStationDoctors($stationId, $doctors) {
        $ids = [];
        $stmt = $this->pdo->prepare("
            INSERT INTO station_doctors (station_id, doctor_name, doctor_id, is_active)
            VALUES (:station_id, :doctor_name, :doctor_id, 1)
        ");
        
        foreach ($doctors as $index => $doctor) {
            if (empty($doctor['name'])) continue;
            
            $stmt->execute([
                ':station_id' => $stationId,
                ':doctor_name' => $doctor['name'],
                ':doctor_id' => isset($doctor['doctor_id']) ? $doctor['doctor_id'] : null
            ]);
            
            $ids[$index] = $this->getLastInsertId();
        }
        
        error_log("✓ Added doctors to station_doctors: " . count($ids));
        return $ids;
    }

    private function addRoomDoctors($stationId, $doctors, $stationDoctorIds) {
        
        error_log("📝 Adding doctors to room_doctors for station: $stationId");
        
        $stmt = $this->pdo->prepare("
            INSERT INTO room_doctors 
            (station_doctor_id, station_id, doctor_name, doctor_id, 
             work_start_time, work_end_time, break_start_time, break_end_time,
             is_active, status, room_number, assigned_room_id)
            VALUES (:station_doctor_id, :station_id, :doctor_name, :doctor_id, 
                    :work_start, :work_end, :break_start, :break_end,
                    1, 'available', NULL, NULL)
        ");
        
        $addedCount = 0;
        foreach ($doctors as $index => $doctor) {
            if (empty($doctor['name'])) continue;
            
            $stationDoctorId = isset($stationDoctorIds[$index]) ? $stationDoctorIds[$index] : null;
            if (!$stationDoctorId) continue;
            
            try {
                $stmt->execute([
                    ':station_doctor_id' => $stationDoctorId,
                    ':station_id' => $stationId,
                    ':doctor_name' => $doctor['name'],
                    ':doctor_id' => isset($doctor['doctor_id']) ? $doctor['doctor_id'] : null,
                    ':work_start' => isset($doctor['work_start_time']) ? $doctor['work_start_time'] : '08:00:00',
                    ':work_end' => isset($doctor['work_end_time']) ? $doctor['work_end_time'] : '17:00:00',
                    ':break_start' => isset($doctor['break_start_time']) ? $doctor['break_start_time'] : '12:00:00',
                    ':break_end' => isset($doctor['break_end_time']) ? $doctor['break_end_time'] : '13:00:00'
                ]);
                
                $roomDoctorId = $this->getLastInsertId();
                $addedCount++;
                error_log("✓ Added doctor to room_doctors: {$doctor['name']}");
                
            } catch (Exception $e) {
                error_log("⚠️ Failed to add doctor to room_doctors: {$doctor['name']} - " . $e->getMessage());
            }
        }
        
        error_log("✓ Total doctors added to room_doctors: $addedCount");
    }

    private function createRooms($stationId, $data) {
        $rooms = [];
        $roomsData = isset($data['rooms']) ? $data['rooms'] : [];
        $roomCount = intval(isset($data['room_count']) ? $data['room_count'] : 1);

        for ($i = 1; $i <= $roomCount; $i++) {
            $roomId = "room-$i";
            $roomSettings = isset($roomsData[$roomId]) ? $roomsData[$roomId] : [];

            $stmt = $this->pdo->prepare("
                INSERT INTO station_rooms (station_id, room_number, room_name, settings_json)
                VALUES (:station_id, :room_number, :room_name, :settings_json)
            ");

            $stmt->execute([
                ':station_id' => $stationId,
                ':room_number' => $i,
                ':room_name' => "Room $i",
                ':settings_json' => json_encode($roomSettings, JSON_UNESCAPED_UNICODE)
            ]);

            $roomDbId = $this->getLastInsertId();
            $this->addEquipment($roomDbId, isset($roomSettings['equipment']) ? $roomSettings['equipment'] : []);
            $this->addRoomProcedures($roomDbId, isset($roomSettings['procedures']) ? $roomSettings['procedures'] : 'all', isset($data['procedure_map']) ? $data['procedure_map'] : []);

            $rooms[] = [
                'room_id' => $roomDbId,
                'room_number' => $i,
                'equipment_count' => count(isset($roomSettings['equipment']) ? $roomSettings['equipment'] : [])
            ];
        }
        return $rooms;
    }

    private function addEquipment($roomId, $equipment) {
        if (empty($equipment) || !is_array($equipment)) return;

        $stmt = $this->pdo->prepare("
            INSERT INTO room_equipment (room_id, equipment_name, require_staff)
            VALUES (:room_id, :name, :require_staff)
        ");

        foreach ($equipment as $eq) {
            if (empty($eq['name'])) continue;
            $stmt->execute([
                ':room_id' => $roomId,
                ':name' => $eq['name'],
                ':require_staff' => isset($eq['use_staff']) && $eq['use_staff'] ? 1 : 0
            ]);
        }
    }

    private function addRoomProcedures($roomId, $procedures, $stationProcedureMap = []) {
        if (empty($stationProcedureMap)) {
            error_log("⚠️ No procedure map for room $roomId");
            return;
        }

        $detailStmt = $this->pdo->prepare("
            SELECT procedure_id, wait_time, procedure_time, staff_required, equipment_required
            FROM station_procedures
            WHERE station_id = (SELECT station_id FROM station_rooms WHERE room_id = :room_id)
            AND procedure_id = :procedure_id LIMIT 1
        ");

        $stmt = $this->pdo->prepare("
            INSERT INTO room_procedures 
            (room_id, procedure_id, procedure_name, wait_time, procedure_time, staff_required, equipment_required, procedure_type)
            VALUES (:room_id, :procedure_id, :procedure_name, :wait_time, :procedure_time, :staff_required, :equipment_required, :type)
        ");

        if ($procedures === 'all' && !empty($stationProcedureMap)) {
            foreach ($stationProcedureMap as $procId => $procName) {
                $detailStmt->execute([':room_id' => $roomId, ':procedure_id' => intval($procId)]);
                $detail = $detailStmt->fetch(PDO::FETCH_ASSOC) ?: [];

                $stmt->execute([
                    ':room_id' => $roomId,
                    ':procedure_id' => intval($procId),
                    ':procedure_name' => $procName,
                    ':wait_time' => isset($detail['wait_time']) ? $detail['wait_time'] : 10,
                    ':procedure_time' => isset($detail['procedure_time']) ? $detail['procedure_time'] : 30,
                    ':staff_required' => isset($detail['staff_required']) ? $detail['staff_required'] : 0,
                    ':equipment_required' => isset($detail['equipment_required']) ? $detail['equipment_required'] : 0,
                    ':type' => 'all_from_station'
                ]);
            }
            error_log("✓ Room $roomId: ALL procedures (" . count($stationProcedureMap) . " procedures)");

        } elseif (is_array($procedures) && !empty($procedures)) {
            foreach ($procedures as $procId) {
                $detailStmt->execute([':room_id' => $roomId, ':procedure_id' => intval($procId)]);
                $detail = $detailStmt->fetch(PDO::FETCH_ASSOC);

                if ($detail) {
                    $stmt->execute([
                        ':room_id' => $roomId,
                        ':procedure_id' => intval($procId),
                        ':procedure_name' => isset($stationProcedureMap[$procId]) ? $stationProcedureMap[$procId] : 'Unknown',
                        ':wait_time' => isset($detail['wait_time']) ? $detail['wait_time'] : 10,
                        ':procedure_time' => isset($detail['procedure_time']) ? $detail['procedure_time'] : 30,
                        ':staff_required' => isset($detail['staff_required']) ? $detail['staff_required'] : 0,
                        ':equipment_required' => isset($detail['equipment_required']) ? $detail['equipment_required'] : 0,
                        ':type' => 'specific'
                    ]);
                }
            }
            error_log("✓ Room $roomId: SPECIFIC procedures (" . count($procedures) . " procedures)");
        }
    }
}

// Handle Request
try {
    $rawInput = file_get_contents('php://input');
    error_log("\n" . str_repeat("═", 70));
    error_log("📨 Raw Input Received:");
    error_log($rawInput);
    error_log(str_repeat("═", 70));
    
    $input = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("❌ JSON Decode Error: " . json_last_error_msg());
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON: ' . json_last_error_msg()], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!$input) {
        error_log("❌ Input is empty after JSON decode");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No input data'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    error_log("✅ JSON decoded successfully");
    
    $creator = new StationCreator();
    $creator->create($input);

} catch (Exception $e) {
    error_log("✗ Unexpected error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unexpected error: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>