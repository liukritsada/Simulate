<?php
/**
 * 🐛 DEBUG: Doctor Assignment Status
 * ตรวจสอบว่าทำไมแพทย์ไม่ถูก auto-assign
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
date_default_timezone_set('Asia/Bangkok');

require_once __DIR__ . '/db_config.php';

try {
    $pdo = DBConfig::getPDO();

    $station_id = isset($_GET['station_id']) ? intval($_GET['station_id']) : 0;
    $current_date = date('Y-m-d');
    $current_time = date('H:i:s');

    // 1. ดึงข้อมูลห้องทั้งหมด
    $rooms_query = "
        SELECT
            sr.room_id,
            sr.room_name,
            sr.station_id,
            sd.station_doctor_id,
            sd.doctor_name,
            sd.status as doctor_status
        FROM station_rooms sr
        LEFT JOIN station_doctors sd ON sr.room_id = sd.assigned_room_id
            AND sd.is_active = 1
            AND DATE(sd.work_date) = CURDATE()
        WHERE sr.station_id = :station_id
        ORDER BY sr.room_number
    ";

    $stmt = $pdo->prepare($rooms_query);
    $stmt->execute([':station_id' => $station_id]);
    $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. ดึงข้อมูลแพทย์ทั้งหมดในสถานี
    $doctors_query = "
        SELECT
            station_doctor_id,
            doctor_id,
            doctor_name,
            work_date,
            work_start_time,
            work_end_time,
            break_start_time,
            break_end_time,
            assigned_room_id,
            status,
            is_active,
            CASE
                WHEN assigned_room_id IS NOT NULL THEN '❌ มีห้องแล้ว'
                WHEN status != 'available' THEN CONCAT('❌ Status = ', status)
                WHEN work_start_time IS NULL THEN '❌ ไม่มี work_start_time'
                WHEN :current_time < work_start_time THEN CONCAT('❌ ยังไม่ถึงเวลา (', work_start_time, ')')
                WHEN :current_time >= work_end_time THEN CONCAT('❌ หมดเวลาแล้ว (', work_end_time, ')')
                WHEN (:current_time >= break_start_time AND :current_time < break_end_time) THEN '❌ อยู่ในช่วงพัก'
                ELSE '✅ พร้อม Auto-Assign'
            END as check_result
        FROM station_doctors
        WHERE station_id = :station_id
          AND DATE(work_date) = CURDATE()
          AND is_active = 1
        ORDER BY doctor_name
    ";

    $stmt = $pdo->prepare($doctors_query);
    $stmt->execute([
        ':station_id' => $station_id,
        ':current_time' => $current_time
    ]);
    $doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. นับห้องว่าง
    $empty_rooms_count = 0;
    $occupied_rooms = [];
    $empty_rooms_list = [];

    foreach ($rooms as $room) {
        if (empty($room['station_doctor_id'])) {
            $empty_rooms_count++;
            $empty_rooms_list[] = $room['room_name'];
        } else {
            $occupied_rooms[] = [
                'room' => $room['room_name'],
                'doctor' => $room['doctor_name'],
                'status' => $room['doctor_status']
            ];
        }
    }

    // 4. นับแพทย์ที่พร้อม auto-assign
    $ready_doctors = array_filter($doctors, function($d) {
        return strpos($d['check_result'], '✅') === 0;
    });

    // 5. สรุปปัญหา
    $issues = [];

    if ($empty_rooms_count == 0) {
        $issues[] = "⚠️ ไม่มีห้องว่าง (ห้องทั้งหมดมีแพทย์แล้ว)";
    }

    if (count($ready_doctors) == 0) {
        $issues[] = "⚠️ ไม่มีแพทย์ที่พร้อม Auto-Assign";

        // วิเคราะห์เหตุผล
        $reasons = [];
        foreach ($doctors as $d) {
            if (strpos($d['check_result'], '❌') === 0) {
                $reason = $d['check_result'];
                if (!isset($reasons[$reason])) {
                    $reasons[$reason] = 0;
                }
                $reasons[$reason]++;
            }
        }

        foreach ($reasons as $reason => $count) {
            $issues[] = "  • {$reason} ({$count} คน)";
        }
    }

    if (empty($issues)) {
        $issues[] = "✅ ทุกอย่างพร้อม - ควร Auto-Assign ได้";
    }

    // Response
    echo json_encode([
        'success' => true,
        'debug_info' => [
            'current_date' => $current_date,
            'current_time' => $current_time,
            'station_id' => $station_id,
            'total_rooms' => count($rooms),
            'empty_rooms' => $empty_rooms_count,
            'empty_rooms_list' => $empty_rooms_list,
            'occupied_rooms' => $occupied_rooms,
            'total_doctors' => count($doctors),
            'ready_doctors' => count($ready_doctors),
            'issues' => $issues
        ],
        'rooms' => $rooms,
        'doctors' => $doctors
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
