<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Test auto_assign_doctor.php with specific parameters
$station_id = $_GET['station_id'] ?? 63;
$current_date = date('Y-m-d');
$current_time = date('H:i:s');

echo "<h2>Testing auto_assign_doctor.php</h2>";
echo "<p>Station ID: $station_id</p>";
echo "<p>Date: $current_date</p>";
echo "<p>Time: $current_time</p>";

$url = 'http://localhost/hospital/api/auto_assign_doctor.php';
$data = [
    'station_id' => $station_id,
    'current_date' => $current_date,
    'current_time' => $current_time
];

$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
    ],
];

$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);

if ($result === FALSE) {
    echo "<h3>Error:</h3>";
    echo "<pre>";
    print_r(error_get_last());
    echo "</pre>";
} else {
    echo "<h3>Response:</h3>";
    echo "<pre>";
    echo $result;
    echo "</pre>";

    $json = json_decode($result, true);
    if ($json) {
        echo "<h3>Formatted:</h3>";
        echo "<pre>";
        print_r($json);
        echo "</pre>";
    }
}

// Check error log
$logFile = dirname(__FILE__) . '/../auto_assign_doctor.log';
if (file_exists($logFile)) {
    echo "<h3>Recent Log Entries (last 50 lines):</h3>";
    echo "<pre>";
    echo shell_exec("tail -n 50 " . escapeshellarg($logFile));
    echo "</pre>";
}
