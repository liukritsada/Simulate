<?php
$logFile = __DIR__ . '/import_debug.log';
if (file_exists($logFile)) {
    header('Content-Type: text/plain; charset=utf-8');
    echo file_get_contents($logFile);
} else {
    echo "Log file not found: " . $logFile;
}
?>
```

2. **อัปโหลดไฟล์อีกครั้ง**

3. **เข้าไปดู Log:**
```
   http://localhost/hospital/api/view_log.php