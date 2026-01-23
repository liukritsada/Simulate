<?php
/**
 * diagnostic.php
 * 
 * ไฟล์นี้ใช้ตรวจสอบ Path ที่ถูก
 * 
 * Upload ไปยัง: /hospital/api/diagnostic.php
 * Access ที่: http://127.0.0.1/hospital/api/diagnostic.php
 */

header('Content-Type: text/html; charset=utf-8');

echo "<!DOCTYPE html>
<html lang='th'>
<head>
    <meta charset='UTF-8'>
    <title>Hospital API Diagnostic</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #333; }
        .check { margin: 15px 0; padding: 12px; border-left: 4px solid #ddd; }
        .pass { border-color: #27ae60; background: #e8f8f5; }
        .fail { border-color: #e74c3c; background: #fadbd8; }
        .info { border-color: #3498db; background: #ebf5fb; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class='container'>
        <h1>🏥 Hospital API Diagnostic</h1>
        <p>ตรวจสอบ Path และ Configuration</p>
        
        <h2>📍 Current Directory & Path Information</h2>";

// 1. Show current location
echo "<div class='check info'>
    <strong>Current File:</strong><br>
    <code>" . __FILE__ . "</code>
</div>";

// 2. Server root
echo "<div class='check info'>
    <strong>Document Root:</strong><br>
    <code>" . $_SERVER['DOCUMENT_ROOT'] . "</code>
</div>";

// 3. Current directory
echo "<div class='check info'>
    <strong>Current Directory:</strong><br>
    <code>" . dirname(__FILE__) . "</code>
</div>";

// 4. Check if get_patients_list.php exists
$api_file = dirname(__FILE__) . '/get_patients_list.php';
echo "<div class='check " . (file_exists($api_file) ? 'pass' : 'fail') . "'>
    <strong>get_patients_list.php File:</strong><br>";
if (file_exists($api_file)) {
    echo "✅ Found at: <code>$api_file</code><br>";
    echo "Size: " . filesize($api_file) . " bytes<br>";
    echo "Readable: " . (is_readable($api_file) ? "✅ Yes" : "❌ No") . "<br>";
} else {
    echo "❌ NOT FOUND at: <code>$api_file</code>";
}
echo "</div>";

// 5. List files in API directory
echo "<div class='check info'>
    <strong>Files in API Directory:</strong><br>";
$api_dir = dirname(__FILE__);
$files = scandir($api_dir);
echo "<pre>";
foreach ($files as $file) {
    if ($file !== '.' && $file !== '..') {
        echo "- $file\n";
    }
}
echo "</pre>";
echo "</div>";

// 6. Check database connection
echo "<h2>🗄️ Database Information</h2>";
$db_host = 'localhost';
$db_name = 'hospitalstation';
$db_user = 'root';
$db_pass = '';

try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "<div class='check pass'>
        <strong>✅ Database Connected</strong><br>
        Host: <code>$db_host</code><br>
        Database: <code>$db_name</code><br>
        User: <code>$db_user</code>
    </div>";
    
    // Check table
    try {
        $result = $pdo->query("SELECT COUNT(*) as count FROM station_patients WHERE appointment_date = '2026-01-22'");
        $row = $result->fetch(PDO::FETCH_ASSOC);
        echo "<div class='check info'>
            <strong>📊 Data Check</strong><br>
            Patients on 2026-01-22: <code>" . $row['count'] . "</code> records
        </div>";
    } catch (Exception $e) {
        echo "<div class='check fail'>
            <strong>❌ Table Error:</strong><br>
            " . $e->getMessage() . "
        </div>";
    }
} catch (PDOException $e) {
    echo "<div class='check fail'>
        <strong>❌ Database Connection Failed</strong><br>
        Error: " . $e->getMessage() . "
    </div>";
}

// 7. API Test
echo "<h2>🧪 API Test</h2>";
echo "<div class='check info'>
    <strong>Test URL:</strong><br>
    <code>http://127.0.0.1/hospital/api/get_patients_list.php?date=2026-01-22</code><br><br>
    <strong>Instructions:</strong><br>
    1. Open the URL in browser<br>
    2. Check if you see JSON response<br>
    3. If JSON shows, API is working ✅<br>
    4. If error, check messages below
</div>";

// 8. PHP Info
echo "<h2>⚙️ PHP Configuration</h2>";
echo "<div class='check info'>
    <strong>PHP Version:</strong> " . phpversion() . "<br>
    <strong>PHP Extensions:</strong><br>
    - PDO: " . (extension_loaded('pdo') ? "✅" : "❌") . "<br>
    - PDO MySQL: " . (extension_loaded('pdo_mysql') ? "✅" : "❌") . "<br>
</div>";

// 9. Recommendations
echo "<h2>💡 Recommendations</h2>";
echo "<div class='check info'>";
if (!file_exists($api_file)) {
    echo "<strong>❌ Action Required:</strong><br>";
    echo "1. Copy <code>get_patients_list.php</code> to this directory:<br>";
    echo "<code>" . dirname(__FILE__) . "</code><br><br>";
    echo "2. OR upload to:<br>";
    echo "<code>" . $_SERVER['DOCUMENT_ROOT'] . "/hospital/api/</code><br><br>";
} else {
    echo "<strong>✅ Setup looks good!</strong><br>";
    echo "Try accessing the API directly:<br>";
    echo "<code>http://127.0.0.1/hospital/api/get_patients_list.php?date=2026-01-22</code>";
}
echo "</div>";

// 10. Directory structure
echo "<h2>📁 Directory Structure</h2>";
echo "<div class='check info'>";
echo "<strong>Expected Structure:</strong><br>";
echo "<pre>";
echo $_SERVER['DOCUMENT_ROOT'] . "/hospital/\n";
echo "├── index.php (main.php)\n";
echo "├── api/\n";
echo "│   ├── get_patients_list.php  ← Your API\n";
echo "│   └── diagnostic.php          ← This file\n";
echo "├── js/\n";
echo "│   ├── 10-patient-management.js\n";
echo "│   └── (other JS files)\n";
echo "</pre>";
echo "</div>";

echo "
    </div>
</body>
</html>";
?>