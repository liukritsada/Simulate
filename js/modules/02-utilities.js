/**
 * 🛠️ Utility Functions Module
 * ฟังก์ชันช่วยต่างๆ สำหรับ formatting และ data conversion
 * 
 * Categories:
 * - Time/Date Formatting
 * - Time/Date Conversion
 * - JSON Parsing
 */

// ========================================
// ⏰ TIME FORMATTING FUNCTIONS
// ========================================

/**
 * ✅ Format time to 24-hour (HH:MM)
 * ใช้ได้ทั้ง input และ display
 * 
 * @param {string} timeStr - เวลาข้อมูลป้อนเข้า
 * @returns {string} - เวลาในรูปแบบ HH:MM (24 ชั่วโมง)
 */
function formatTimeTo24Hour(timeStr) {
  if (!timeStr || timeStr === "-") return "08:00";

  // ลบ seconds ออก (เก็บแค่ HH:MM)
  if (timeStr.includes(":")) {
    return timeStr.substring(0, 5);
  }

  return "08:00";
}

/**
 * ✅ Format time input (HH:MM in 24-hour format)
 * Auto-format ขณะ user พิมพ์
 * 
 * @param {HTMLInputElement} input - input element
 */
function formatTimeInput(input) {
  let value = input.value.replace(/\D/g, "");

  if (value.length >= 2) {
    value = value.substring(0, 2) + ":" + value.substring(2, 4);
  }

  input.value = value;

  // ✅ ตรวจสอบรูปแบบ 24 ชั่วโมง
  if (value.length === 5) {
    const [hours, minutes] = value.split(":");
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);

    if (h < 0 || h > 23 || m < 0 || m > 59) {
      input.style.borderColor = "#C0392B";
      input.setAttribute("data-valid", "false");
    } else {
      input.style.borderColor = "#ced4da";
      input.setAttribute("data-valid", "true");
    }
  }
}

/**
 * ✅ Convert 12-hour format to 24-hour (if needed)
 * 
 * @param {string} time12h - เวลา 12 ชั่วโมง หรือ 24 ชั่วโมง
 * @returns {string} - เวลา 24 ชั่วโมง (HH:MM)
 */
function convert12To24(time12h) {
  if (!time12h || time12h === "-") return "08:00";

  // ลบ AM/PM ออกและเก็บเฉพาะเวลา
  const timePart = time12h.replace(/\s*(AM|PM|am|pm)/g, "").trim();

  // ถ้ามีอยู่แล้ว return ตรงๆ (24-hour format)
  if (timePart.includes(":")) {
    return timePart.substring(0, 5);
  }

  return "08:00";
}

// ========================================
// 📅 DATE FORMATTING & CONVERSION
// ========================================

/**
 * ✅ NEW: Format date input (dd/mm/yyyy)
 * Auto-format ขณะ user พิมพ์
 * 
 * @param {HTMLInputElement} input - input element
 */
function formatDateInput(input) {
  let value = input.value.replace(/\D/g, "");

  if (value.length >= 2) {
    value = value.substring(0, 2) + "/" + value.substring(2);
  }
  if (value.length >= 5) {
    value = value.substring(0, 5) + "/" + value.substring(5, 9);
  }

  input.value = value;

  // ✅ Validate format
  if (value.length === 10) {
    const [day, month, year] = value.split("/");
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj)) {
      input.style.borderColor = "#C0392B";
    } else {
      input.style.borderColor = "#ced4da";
    }
  }
}

/**
 * ✅ Convert dd/mm/yyyy to yyyy-mm-dd for API
 * 
 * @param {string} dateStr - วันที่ในรูปแบบ dd/mm/yyyy
 * @returns {string} - วันที่ในรูปแบบ yyyy-mm-dd
 * 
 * @example
 * convertDateFormat("12/02/2025") // => "2025-02-12"
 */
function convertDateFormat(dateStr) {
  if (!dateStr || dateStr.length !== 10) return dateStr;
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month}-${day}`;
}

/**
 * ✅ Convert dd/mm/yyyy to yyyy-mm-dd (Alternative name)
 * 
 * @param {string} dateStr - วันที่ในรูปแบบ dd/mm/yyyy
 * @returns {string} - วันที่ในรูปแบบ yyyy-mm-dd
 */
function convertDateDDMMToYYYYMM(dateStr) {
  if (!dateStr) return new Date().toISOString().split("T")[0];

  // ✅ ถ้า input เป็น dd/mm/yyyy
  if (dateStr.includes("/")) {
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month}-${day}`;
  }

  return dateStr;
}

// ========================================
// 🔄 JSON PARSING UTILITIES (Unused but kept for future)
// ========================================

/**
 * Template สำหรับ fetch + parse ที่ปลอดภัย
 * 
 * Note: Currently unused by the main station/room logic,
 * which uses direct `fetch` and `response.json()`.
 * Kept here as utility functions for future development.
 */
async function safeFetchJson(url, options = {}) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // ✅ รับ text ก่อน
    const text = await response.text();

    // ✅ Log เพื่อ debug (แสดงแค่ 200 ตัวอักษรแรก)
    console.log("📄 Response preview:", text.substring(0, 200));

    // ✅ Parse ด้วย safeJsonParse
    const result = safeJsonParse(text);

    if (!result) {
      throw new Error("ไม่สามารถ parse JSON ได้");
    }

    return result;
  } catch (error) {
    console.error("❌ safeFetchJson error:", error);
    throw error;
  }
}

/**
 * ฟังก์ชันช่วยทำความสะอาด JSON Response
 * 
 * @param {string} text - JSON text ที่ต้องทำความสะอาด
 * @returns {string} - JSON text ที่สะอาดแล้ว
 */
function cleanJsonResponse(text) {
  if (!text) return "{}";

  try {
    // ✅ 1. ลบ BOM (Byte Order Mark)
    text = text.replace(/^\uFEFF/, "");

    // ✅ 2. ลบ single-line comments (// comment)
    text = text.replace(/\/\/.*$/gm, "");

    // ✅ 3. ลบ multi-line comments (/* comment */)
    text = text.replace(/\/\*[\s\S]*?\*\//g, "");

    // ✅ 4. ลบ whitespace ที่เกิน
    text = text.trim();

    // ✅ 5. หาตำแหน่ง JSON object แรก
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");

    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.substring(jsonStart, jsonEnd + 1);
    }

    return text;
  } catch (error) {
    console.error("❌ ทำความสะอาด JSON ไม่สำเร็จ:", error);
    return text;
  }
}

/**
 * Parse JSON อย่างปลอดภัย
 *
 * @param {string} text - JSON text
 * @returns {object|null} - Parsed object หรือ null ถ้า parse ไม่สำเร็จ
 */
function safeJsonParse(text) {
  try {
    // ทำความสะอาดก่อน
    const cleanText = cleanJsonResponse(text);

    // Parse JSON
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("❌ Parse JSON ไม่สำเร็จ:", error);
    console.error("📄 Text ที่พยายาม parse:", text.substring(0, 200));
    return null;
  }
}

// ========================================
// 🛑 EXPORTS (สำหรับ ES Modules)
// ========================================

// export {
//   formatTimeTo24Hour,
//   formatTimeInput,
//   convert12To24,
//   formatDateInput,
//   convertDateFormat,
//   convertDateDDMMToYYYYMM,
//   safeFetchJson,
//   cleanJsonResponse,
//   safeJsonParse
// };
