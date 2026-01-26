# API Response Standard

มาตรฐานการตอบกลับ (Response Format) สำหรับ Hospital Patient Flow Simulator APIs

---

## Standard Response Format

### Success Response
```json
{
    "success": true,
    "message": "ดำเนินการสำเร็จ",
    "data": {
        // Response data here
    },
    "timestamp": "2026-01-26 14:30:00"
}
```

### Error Response
```json
{
    "success": false,
    "message": "คำอธิบายข้อผิดพลาด",
    "data": null,
    "timestamp": "2026-01-26 14:30:00"
}
```

---

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| **200** | OK | สำเร็จ (Success) |
| **400** | Bad Request | Request ผิดรูปแบบหรือข้อมูลไม่ครบ |
| **401** | Unauthorized | ไม่มีสิทธิ์เข้าถึง (ยังไม่ login) |
| **403** | Forbidden | ห้ามเข้าถึง (login แล้วแต่ไม่มีสิทธิ์) |
| **404** | Not Found | ไม่พบข้อมูลที่ต้องการ |
| **422** | Unprocessable Entity | Validation error (ข้อมูลไม่ถูกต้อง) |
| **500** | Internal Server Error | ข้อผิดพลาดของ server |

---

## Response Types

### 1. Success Response (200)

#### Simple Success
```json
{
    "success": true,
    "message": "บันทึกข้อมูลสำเร็จ",
    "data": null,
    "timestamp": "2026-01-26 14:30:00"
}
```

#### Success with Data
```json
{
    "success": true,
    "message": "ดึงข้อมูลสำเร็จ",
    "data": {
        "patients": [
            {
                "patient_id": 123,
                "patient_name": "สมชาย ใจดี",
                "hn": "5218262"
            }
        ],
        "count": 1
    },
    "timestamp": "2026-01-26 14:30:00"
}
```

#### Success with Warnings
```json
{
    "success": true,
    "message": "นำเข้าข้อมูลสำเร็จ",
    "data": {
        "imported": 10,
        "skipped": 2
    },
    "warnings": [
        "Patient HN12345 already exists - skipped",
        "Invalid date format for HN67890 - skipped"
    ],
    "timestamp": "2026-01-26 14:30:00"
}
```

---

### 2. Error Response (400)

#### Validation Error (422)
```json
{
    "success": false,
    "message": "ข้อมูลไม่ถูกต้อง",
    "data": null,
    "errors": [
        {
            "field": "patient_name",
            "message": "กรุณาระบุชื่อผู้ป่วย"
        },
        {
            "field": "hn",
            "message": "รูปแบบ HN ไม่ถูกต้อง"
        }
    ],
    "timestamp": "2026-01-26 14:30:00"
}
```

#### Not Found (404)
```json
{
    "success": false,
    "message": "ไม่พบข้อมูลผู้ป่วย",
    "data": null,
    "timestamp": "2026-01-26 14:30:00"
}
```

#### Server Error (500)
```json
{
    "success": false,
    "message": "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง",
    "data": null,
    "timestamp": "2026-01-26 14:30:00"
}
```

---

## Using APIResponse Helper

### PHP Example

```php
<?php
require_once __DIR__ . '/response_helper.php';

// Success response
APIResponse::success('ดึงข้อมูลสำเร็จ', [
    'patients' => $patients,
    'count' => count($patients)
]);

// Error response
APIResponse::error('ไม่พบข้อมูล', 404);

// Validation error
APIResponse::validationError('ข้อมูลไม่ถูกต้อง', [
    ['field' => 'hn', 'message' => 'กรุณาระบุ HN']
]);

// Database error (with logging)
try {
    // Database operations
} catch (PDOException $e) {
    APIResponse::databaseError($e, false); // false = hide details in production
}
```

---

## Optional Fields

### Debugging Information (_debug)
```json
{
    "success": true,
    "message": "ดึงข้อมูลสำเร็จ",
    "data": { ... },
    "_debug": {
        "query_time_ms": 45.23,
        "sql_queries": 3,
        "memory_usage": "2.5 MB"
    },
    "timestamp": "2026-01-26 14:30:00"
}
```

**Note**: `_debug` ควรใช้เฉพาะ development environment เท่านั้น

### Pagination
```json
{
    "success": true,
    "message": "ดึงข้อมูลสำเร็จ",
    "data": {
        "patients": [ ... ],
        "pagination": {
            "current_page": 1,
            "total_pages": 5,
            "per_page": 20,
            "total_records": 95
        }
    },
    "timestamp": "2026-01-26 14:30:00"
}
```

---

## Best Practices

### ✅ DO:

1. **Always use standard format**
   ```php
   APIResponse::success('Success message', $data);
   ```

2. **Provide meaningful messages**
   ```php
   // Good
   APIResponse::error('ไม่พบผู้ป่วย HN: 5218262');

   // Bad
   APIResponse::error('Error');
   ```

3. **Use appropriate HTTP status codes**
   ```php
   APIResponse::error('Validation failed', 422);
   ```

4. **Log errors on server side**
   ```php
   error_log("Database error: " . $e->getMessage());
   APIResponse::databaseError($e);
   ```

### ❌ DON'T:

1. **Don't expose sensitive information**
   ```php
   // Bad - exposes database structure
   APIResponse::error($e->getMessage());

   // Good - generic message
   APIResponse::error('ข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล');
   ```

2. **Don't mix response formats**
   ```php
   // Bad
   echo json_encode(['status' => 'ok', 'result' => $data]);

   // Good
   APIResponse::success('Success', $data);
   ```

3. **Don't return 200 for errors**
   ```php
   // Bad
   http_response_code(200);
   echo json_encode(['success' => false, 'message' => 'Error']);

   // Good
   APIResponse::error('Error message', 400);
   ```

---

## Frontend Integration

### JavaScript Example

```javascript
async function fetchPatients() {
    try {
        const response = await fetch('/api/get_patients_list.php?date=2026-01-26');
        const result = await response.json();

        if (result.success) {
            console.log('✅ Success:', result.message);
            console.log('Data:', result.data);
            // Process data
        } else {
            console.error('❌ Error:', result.message);
            // Show error to user
        }
    } catch (error) {
        console.error('Network error:', error);
    }
}
```

---

## Migration Guide

### Converting Old Code

**Before:**
```php
echo json_encode([
    'status' => 'success',
    'result' => $data
]);
```

**After:**
```php
require_once __DIR__ . '/response_helper.php';
APIResponse::success('Operation successful', $data);
```

---

## Quick Reference

| Method | HTTP Code | Use Case |
|--------|-----------|----------|
| `APIResponse::success($msg, $data)` | 200 | Success with data |
| `APIResponse::error($msg, $code)` | 400 | General error |
| `APIResponse::validationError($msg, $errors)` | 422 | Validation failed |
| `APIResponse::notFound($msg)` | 404 | Resource not found |
| `APIResponse::unauthorized($msg)` | 401 | Not logged in |
| `APIResponse::forbidden($msg)` | 403 | No permission |
| `APIResponse::serverError($msg)` | 500 | Server error |
| `APIResponse::databaseError($e)` | 500 | Database error |

---

**Last Updated**: 2026-01-26
**Version**: 1.0
