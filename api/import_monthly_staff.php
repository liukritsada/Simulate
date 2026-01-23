<?php
/**
 * API: Import Monthly Staff - STANDALONE VERSION
 * ✅ ไม่ต้องใช้ db_config.php
 * ✅ Direct PDO connection
 * ✅ CSV only
 * ✅ Full debug logs
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
date_default_timezone_set('Asia/Bangkok');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 🔧 ปิด display_errors
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

$debug_logs = [];
$pdo = null;

try {
    // ✅ Log: เริ่มต้น
    $debug_logs[] = "🚀 IMPORT STARTED: " . date('Y-m-d H:i:s');

    // ========================================
    // ✅ DATABASE CONNECTION (No db_config.php)
    // ========================================
    
    $debug_logs[] = "🔌 Attempting to connect to database...";
    
    try {
        $pdo = new PDO(
            "mysql:host=127.0.0.1;port=3306;dbname=hospitalstation;charset=utf8mb4",
            'sa',
            '',
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_PERSISTENT => false
            ]
        );
        
        $pdo->exec("SET NAMES utf8mb4");
        $pdo->exec("SET CHARACTER SET utf8mb4");
        $pdo->exec("SET character_set_connection=utf8mb4");
        
        $debug_logs[] = "✅ Database connected successfully";
        
    } catch (PDOException $dbError) {
        throw new Exception('Database connection failed: ' . $dbError->getMessage());
    }

    // ========================================
    // ✅ VALIDATE REQUEST
    // ========================================
    
    $stationId = intval($_POST['station_id'] ?? 0);
    $staffType = $_POST['staff_type'] ?? 'Staff';
    
    $debug_logs[] = "📥 Request - Station ID: $stationId, Staff Type: $staffType";
    
    if ($stationId <= 0) {
        throw new Exception('Invalid station_id provided');
    }

    // ✅ Check file upload
    if (!isset($_FILES['file'])) {
        throw new Exception('No file uploaded');
    }

    if ($_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $errorMsg = getUploadErrorMessage($_FILES['file']['error']);
        throw new Exception('File upload error: ' . $errorMsg);
    }

    $filePath = $_FILES['file']['tmp_name'];
    $fileName = $_FILES['file']['name'];
    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $fileSize = filesize($filePath);
    
    $debug_logs[] = "📄 File: $fileName (Ext: $fileExt, Size: $fileSize bytes)";

    // ✅ Check file type
    if ($fileExt !== 'csv' && $fileExt !== 'txt') {
        throw new Exception('Invalid file format. Only CSV files are supported.');
    }

    if (!is_readable($filePath)) {
        throw new Exception('File is not readable');
    }

    // ========================================
    // ✅ READ CSV
    // ========================================
    
    $debug_logs[] = "📖 Reading CSV file...";
    
    $fileContent = file_get_contents($filePath);
    if (!$fileContent) {
        throw new Exception('Cannot read file contents');
    }

    // ✅ Fix encoding if needed
    if (!mb_check_encoding($fileContent, 'UTF-8')) {
        $fileContent = iconv('TIS-620', 'UTF-8//IGNORE', $fileContent);
        $debug_logs[] = "🔄 Converted encoding from TIS-620 to UTF-8";
    }

    // ✅ Parse CSV
    $lines = preg_split('/\r\n|\r|\n/', $fileContent);
    $data = [];
    $headers = null;
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line)) continue;
        
        $fields = str_getcsv($line);
        $fields = array_map('trim', $fields);
        
        if ($headers === null) {
            $headers = $fields;
            $debug_logs[] = "📋 CSV Headers: " . implode(" | ", $headers);
            continue;
        }
        
        $row = [];
        for ($i = 0; $i < count($headers) && $i < count($fields); $i++) {
            $row[] = $fields[$i];
        }
        
        if (count($row) > 0 && count(array_filter($row)) > 0) {
            $data[] = $row;
        }
    }
    
    $debug_logs[] = "✅ Parsed " . count($data) . " rows from CSV";

    if (empty($data)) {
        throw new Exception('No data found in CSV file');
    }

    // ========================================
    // ✅ PROCESS DATA
    // ========================================
    
    $pdo->beginTransaction();
    
    $importedCount = 0;
    $errors = [];
    $currentTime = date('H:i:s');
    
    $debug_logs[] = "🔄 Processing " . count($data) . " rows...";

    foreach ($data as $rowIndex => $row) {
        try {
            // Skip empty rows
            if (count(array_filter($row)) === 0) {
                continue;
            }

            // Check columns
            if (count($row) < 8) {
                $errors[] = "Row " . ($rowIndex + 1) . ": Need 8 columns, got " . count($row);
                continue;
            }

            // Extract fields
            $staffId = trim($row[0] ?? '');
            $firstName = trim($row[1] ?? '');
            $lastName = trim($row[2] ?? '');
            $workStart = formatTime($row[3] ?? '');
            $breakStart = formatTime($row[4] ?? '');
            $breakEnd = formatTime($row[5] ?? '');
            $workEnd = formatTime($row[6] ?? '');
            $workDateRaw = trim($row[7] ?? '');

            // Fix encoding
            if (!mb_check_encoding($staffId, 'UTF-8')) {
                $staffId = iconv('TIS-620', 'UTF-8//IGNORE', $staffId);
            }
            if (!mb_check_encoding($firstName, 'UTF-8')) {
                $firstName = iconv('TIS-620', 'UTF-8//IGNORE', $firstName);
            }
            if (!mb_check_encoding($lastName, 'UTF-8')) {
                $lastName = iconv('TIS-620', 'UTF-8//IGNORE', $lastName);
            }

            $staffName = trim($firstName . ' ' . $lastName);
            $workDate = parseExcelDate($workDateRaw);

            // Validate required fields
            $missing = [];
            if (empty($staffId)) $missing[] = "staffId";
            if (empty($staffName) || empty($firstName) || empty($lastName)) $missing[] = "staffName";
            if (empty($workStart)) $missing[] = "workStart";
            if (empty($workEnd)) $missing[] = "workEnd";
            if (empty($workDate)) $missing[] = "workDate";

            if (!empty($missing)) {
                $errors[] = "Row " . ($rowIndex + 1) . ": Missing " . implode(", ", $missing);
                continue;
            }

            // Check for duplicate
            $checkStmt = $pdo->prepare("
                SELECT COUNT(*) FROM station_staff 
                WHERE station_id = :station_id 
                AND staff_id = :staff_id 
                AND work_date = :work_date
            ");
            $checkStmt->execute([
                ':station_id' => $stationId,
                ':staff_id' => $staffId,
                ':work_date' => $workDate
            ]);
            
            if (intval($checkStmt->fetchColumn()) > 0) {
                continue; // Skip duplicate
            }

            // Determine status
            $status = determineStatus($currentTime, $workStart, $workEnd, $breakStart, $breakEnd);
            
            // Insert record
            $insertStmt = $pdo->prepare("
                INSERT INTO station_staff 
                (station_id, staff_id, staff_name, staff_type, work_date, work_start_time, work_end_time, break_start_time, break_end_time, status, is_active)
                VALUES (:station_id, :staff_id, :staff_name, :staff_type, :work_date, :work_start_time, :work_end_time, :break_start_time, :break_end_time, :status, 1)
            ");
            
            $insertStmt->execute([
                ':station_id' => $stationId,
                ':staff_id' => $staffId,
                ':staff_name' => $staffName,
                ':staff_type' => $staffType,
                ':work_date' => $workDate,
                ':work_start_time' => $workStart,
                ':work_end_time' => $workEnd,
                ':break_start_time' => $breakStart,
                ':break_end_time' => $breakEnd,
                ':status' => $status
            ]);

            $importedCount++;

        } catch (\Exception $e) {
            $errors[] = "Row " . ($rowIndex + 1) . ": " . $e->getMessage();
        }
    }

    // Commit
    $pdo->commit();
    
    $debug_logs[] = "✅ Successfully imported $importedCount records";

    // ========================================
    // ✅ SUCCESS RESPONSE
    // ========================================
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "✅ Import completed. $importedCount records imported.",
        'imported_count' => $importedCount,
        'errors' => $errors,
        'total_rows_processed' => count($data),
        'debug_logs' => $debug_logs
    ], JSON_UNESCAPED_UNICODE);

} catch (\Exception $e) {
    // Rollback on error
    if ($pdo && $pdo->inTransaction()) {
        try {
            $pdo->rollBack();
        } catch (Exception $rollbackError) {
            // Ignore rollback errors
        }
    }
    
    $errorMsg = $e->getMessage();
    $debug_logs[] = "❌ ERROR: $errorMsg";
    
    // ========================================
    // ✅ ERROR RESPONSE
    // ========================================
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => "❌ Import failed: $errorMsg",
        'debug_logs' => $debug_logs
    ], JSON_UNESCAPED_UNICODE);
}

exit();

// ========================================
// Helper Functions
// ========================================

function getUploadErrorMessage($code) {
    $messages = [
        UPLOAD_ERR_OK => 'No error',
        UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
        UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
        UPLOAD_ERR_PARTIAL => 'File partially uploaded',
        UPLOAD_ERR_NO_FILE => 'No file uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temp directory',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file',
        UPLOAD_ERR_EXTENSION => 'Extension not allowed'
    ];
    return $messages[$code] ?? 'Unknown error';
}

function determineStatus($currentTime, $workStart, $workEnd, $breakStart, $breakEnd) {
    if ($currentTime < $workStart) return 'waiting_to_start';
    if (!empty($breakStart) && !empty($breakEnd) && $currentTime >= $breakStart && $currentTime < $breakEnd) return 'on_break';
    if ($currentTime >= $workStart && $currentTime < $workEnd) return 'available';
    if ($currentTime >= $workEnd) return 'offline';
    return 'available';
}

function parseExcelDate($dateString) {
    if (empty($dateString)) return null;
    
    $dateString = trim($dateString);
    $dateString = preg_replace('/[\r\n\s].*$/', '', $dateString);
    $dateString = trim($dateString);
    
    if (empty($dateString)) return null;

    // Excel numeric date
    if (is_numeric($dateString) && !strpos($dateString, '/')) {
        try {
            $epochDate = new DateTime('1899-12-30');
            $epochDate->modify("+" . intval($dateString) . " days");
            return $epochDate->format('Y-m-d');
        } catch (Exception $e) {
            return null;
        }
    }

    $formats = ['d/m/Y', 'j/n/Y', 'd-m-Y', 'Y-m-d', 'd/m/y', 'Y/m/d'];
    
    foreach ($formats as $format) {
        $date = DateTime::createFromFormat($format, $dateString);
        if ($date !== false) {
            $year = intval($date->format('Y'));
            if ($year > 2500) {
                $date->modify('-543 years');
            }
            return $date->format('Y-m-d');
        }
    }

    return null;
}

function formatTime($timeString) {
    if (empty($timeString)) return null;
    
    $timeString = trim($timeString);
    if (empty($timeString)) return null;

    // Excel numeric time
    if (is_numeric($timeString) && floatval($timeString) < 1 && floatval($timeString) > 0) {
        $hours = floor(floatval($timeString) * 24);
        $minutes = floor((floatval($timeString) * 24 - $hours) * 60);
        return sprintf('%02d:%02d:00', $hours, $minutes);
    }

    // String time
    if (preg_match('/^(\d{1,2}):(\d{2})/', $timeString, $matches)) {
        return sprintf('%02d:%02d:00', intval($matches[1]), intval($matches[2]));
    }

    return null;
}
?>