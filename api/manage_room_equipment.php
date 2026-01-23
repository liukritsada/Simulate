<?php
/**
 * API: Manage Room Equipment (AUTO TOGGLE)
 * - ใช้ DBConfig กลาง
 * - เครื่องมือที่ต้องใช้พนักงาน → อัตโนมัติเปิด/ปิด ตามจำนวนพนักงาน
 * - เครื่องมือที่ไม่ต้องใช้พนักงาน → เปิดไว้ตลอด
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/db_config.php';

function jsonResponse($success, $message, $data = [], $status = 200) {
    http_response_code($status);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data'    => $data
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * ฟังก์ชันตรวจสอบและ auto toggle เครื่องมือในห้อง
 * 
 * @param PDO $pdo - Database connection
 * @param int $roomId - Room ID
 * @return array - ข้อมูล toggle ทั้งหมด
 */
function autoToggleEquipmentInRoom($pdo, $roomId) {
    // นับจำนวนพนักงานที่เปิดใช้งาน
    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM station_staff
        WHERE assigned_room_id = :room_id
          AND is_active = 1
    ");
    $stmt->execute([':room_id' => $roomId]);
    $staffCount = (int)$stmt->fetchColumn();

    // ดึงเครื่องมือทั้งหมดในห้องนี้
    $stmt = $pdo->prepare("
        SELECT equipment_id, equipment_name, require_staff, is_active
        FROM room_equipment
        WHERE room_id = :room_id
    ");
    $stmt->execute([':room_id' => $roomId]);
    $equipments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $toggleResults = [];

    foreach ($equipments as $eq) {
        $requireStaff = (int)$eq['require_staff'];
        $currentStatus = (int)$eq['is_active'];
        $newStatus = $currentStatus;
        $autoToggled = false;

        if ($requireStaff === 1) {
            // เครื่องมือต้องใช้พนักงาน
            $newStatus = ($staffCount > 0) ? 1 : 0;
            if ($newStatus !== $currentStatus) {
                $autoToggled = true;
            }
        } else {
            // เครื่องมือไม่ต้องใช้พนักงาน → เปิดตลอด
            $newStatus = 1;
            if ($newStatus !== $currentStatus) {
                $autoToggled = true;
            }
        }

        // Update ถ้ามีการเปลี่ยนแปลง
        if ($newStatus !== $currentStatus) {
            $upd = $pdo->prepare("
                UPDATE room_equipment
                SET is_active = :active
                WHERE equipment_id = :id
            ");
            $upd->execute([
                ':active' => $newStatus,
                ':id'     => $eq['equipment_id']
            ]);
        }

        $toggleResults[] = [
            'equipment_id'   => $eq['equipment_id'],
            'equipment_name' => $eq['equipment_name'],
            'require_staff'  => $requireStaff,
            'is_active'      => $newStatus,
            'auto_toggled'   => $autoToggled
        ];
    }

    return [
        'staff_count'      => $staffCount,
        'toggle_results'   => $toggleResults
    ];
}

try {
    $pdo = DBConfig::getPDO();
    $input  = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    if (!$action) {
        throw new Exception('Missing action');
    }

    switch ($action) {

        /* ================= TOGGLE (MANUAL) ================= */
        case 'toggle':
            $equipmentId = intval($input['equipment_id'] ?? 0);
            $roomId      = intval($input['room_id'] ?? 0);
            $requested   = isset($input['is_active']) ? (bool)$input['is_active'] : null;

            if ($equipmentId <= 0 || $roomId <= 0 || $requested === null) {
                throw new Exception('Invalid parameters');
            }

            // โหลดข้อมูลเครื่องมือ
            $stmt = $pdo->prepare("
                SELECT equipment_name, require_staff
                FROM room_equipment
                WHERE equipment_id = :id
            ");
            $stmt->execute([':id' => $equipmentId]);
            $equipment = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$equipment) {
                throw new Exception('Equipment not found');
            }

            // ค่า default = ตามที่ user กด
            $finalIsActive = $requested;
            $autoBlocked  = false;

            // require_staff = 1 → บล็อกเฉพาะตอนพยายามเปิด
            if ($requested === true && (int)$equipment['require_staff'] === 1) {
                $staffStmt = $pdo->prepare("
                    SELECT COUNT(*)
                    FROM station_staff
                    WHERE assigned_room_id = :room_id
                      AND is_active = 1
                ");
                $staffStmt->execute([':room_id' => $roomId]);
                $staffCount = (int)$staffStmt->fetchColumn();

                if ($staffCount === 0) {
                    $finalIsActive = false;
                    $autoBlocked  = true;
                }
            }

            // update DB
            $upd = $pdo->prepare("
                UPDATE room_equipment
                SET is_active = :active
                WHERE equipment_id = :id
            ");
            $upd->execute([
                ':active' => $finalIsActive ? 1 : 0,
                ':id'     => $equipmentId
            ]);

            jsonResponse(true, 'Equipment toggled', [
                'equipment_id'   => $equipmentId,
                'equipment_name' => $equipment['equipment_name'],
                'is_active'      => $finalIsActive,
                'auto_blocked'   => $autoBlocked
            ]);
            break;

        /* ================= ADD ================= */
        case 'add':
            $roomId       = intval($input['room_id'] ?? 0);
            $name         = trim($input['equipment_name'] ?? '');
            $type         = trim($input['equipment_type'] ?? '');
            $requireStaff = !empty($input['require_staff']);

            if ($roomId <= 0 || $name === '') {
                throw new Exception('Invalid parameters');
            }

            // ตรวจสอบจำนวนพนักงานเพื่อกำหนด is_active เริ่มต้น
            $stmt = $pdo->prepare("
                SELECT COUNT(*)
                FROM station_staff
                WHERE assigned_room_id = :room_id
                  AND is_active = 1
            ");
            $stmt->execute([':room_id' => $roomId]);
            $staffCount = (int)$stmt->fetchColumn();

            // ตั้งค่า is_active ตามเงื่อนไข
            if ($requireStaff) {
                // เครื่องมือต้องใช้พนักงาน
                $isActive = ($staffCount > 0);
            } else {
                // เครื่องมือไม่ต้องใช้พนักงาน → เปิดตลอด
                $isActive = true;
            }

            $stmt = $pdo->prepare("
                INSERT INTO room_equipment
                (room_id, equipment_name, equipment_type, require_staff, is_active)
                VALUES (:room_id, :name, :type, :require_staff, :active)
            ");
            $stmt->execute([
                ':room_id'        => $roomId,
                ':name'           => $name,
                ':type'           => $type,
                ':require_staff'  => $requireStaff ? 1 : 0,
                ':active'         => $isActive ? 1 : 0
            ]);

            jsonResponse(true, 'Equipment added', [
                'equipment_id'   => $pdo->lastInsertId(),
                'equipment_name' => $name,
                'equipment_type' => $type,
                'require_staff'  => $requireStaff,
                'is_active'      => $isActive
            ], 201);
            break;

        /* ================= REMOVE ================= */
        case 'remove':
            $equipmentId = intval($input['equipment_id'] ?? 0);
            if ($equipmentId <= 0) {
                throw new Exception('Invalid equipment_id');
            }

            $stmt = $pdo->prepare("DELETE FROM room_equipment WHERE equipment_id = :id");
            $stmt->execute([':id' => $equipmentId]);

            jsonResponse(true, 'Equipment removed');
            break;

        /* ================= AUTO TOGGLE (เรียกเมื่อมีการเปลี่ยนแปลงพนักงาน) ================= */
        case 'auto_toggle':
            $roomId = intval($input['room_id'] ?? 0);
            if ($roomId <= 0) {
                throw new Exception('Invalid room_id');
            }

            $result = autoToggleEquipmentInRoom($pdo, $roomId);

            jsonResponse(true, 'Equipment auto-toggled', $result);
            break;

        default:
            throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    jsonResponse(false, $e->getMessage(), [], 400);
}