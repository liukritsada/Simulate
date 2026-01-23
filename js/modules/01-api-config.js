/**
 * 🔧 API Configuration Module
 * จัดการ API Base URL และสร้าง API endpoints
 * 
 * Features:
 * - Cleanup API URL (ลบ trailing slash)
 * - สร้าง API URL ที่ถูกต้อง
 * - รองรับ custom API paths
 */

// ========================================
// ✅ API CONFIGURATION INITIALIZATION
// ========================================

console.log("🔧 เริ่มตั้งค่า API Configuration...");

/**
 * ตรวจสอบว่า main.php ประกาศ API_BASE_URL หรือยัง
 */
if (typeof API_BASE_URL === "undefined") {
  console.warn("⚠️ API_BASE_URL ไม่ได้ประกาศจาก main.php");

  // หาค่า default จาก URL ปัจจุบัน
  const currentPath = window.location.pathname;

  if (currentPath.includes("/hospital/")) {
    window.API_BASE_URL = "/hospital/api";
  } else {
    window.API_BASE_URL = "/api";
  }

  console.log("✅ ใช้ค่า default:", window.API_BASE_URL);
} else {
  console.log("✅ API_BASE_URL จาก main.php:", API_BASE_URL);

  // ✅ ลบ / ท้ายออก (ถ้ามี)
  window.API_BASE_URL = API_BASE_URL.replace(/\/+$/, "");
}

console.log("🔗 API Base URL (ทำความสะอาดแล้ว):", window.API_BASE_URL);

// ========================================
// ✅ CORE FUNCTIONS
// ========================================

/**
 * ✅ Function: ทำความสะอาด API URL
 * 
 * @returns {boolean} - true ถ้าสำเร็จ, false ถ้าไม่สำเร็จ
 */
function cleanupAPIBaseUrl() {
  if (!window.API_BASE_URL) {
    console.error("❌ API_BASE_URL ไม่ได้ประกาศ");
    return false;
  }

  // ✅ ลบ trailing slash ถ้ามี
  let cleanUrl = API_BASE_URL;

  if (cleanUrl.endsWith("/")) {
    cleanUrl = cleanUrl.slice(0, -1);
    console.log(
      `✅ ลบ trailing slash: "${API_BASE_URL}" → "${cleanUrl}"`
    );
  }

  // ✅ บันทึก
  window.API_BASE_URL = cleanUrl;
  window.API_BASE_URL_CLEAN = cleanUrl;

  console.log(`🔗 API URL ที่ใช้: ${window.API_BASE_URL_CLEAN}`);

  return true;
}

/**
 * ✅ Helper: สร้าง API URL ที่ถูกต้อง
 * 
 * @param {string} endpoint - API endpoint (เช่น "get_station_detail.php")
 * @returns {string} - full API URL
 * 
 * @example
 * getApiUrl("get_station_detail.php") 
 * // => "http://example.com/api/get_station_detail.php"
 */
function getApiUrl(endpoint) {
  const baseUrl = window.API_BASE_URL_CLEAN || API_BASE_URL.replace(/\/$/, "");
  const url = `${baseUrl}/${endpoint}`;
  return url;
}

// ========================================
// ✅ INITIALIZATION ON PAGE LOAD
// ========================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("📱 Page loaded - Cleaning up API URLs...");

  // ✅ ทำความสะอาด API URL
  cleanupAPIBaseUrl();

  // ✅ ทดสอบ
  console.log(`✅ API_BASE_URL: ${window.API_BASE_URL_CLEAN}`);
  console.log(`✅ Test URL: ${getApiUrl("test.php")}`);
});

// ========================================
// ✅ EXPORTS (สำหรับ ES Modules)
// ========================================

// หากใช้ ES Modules
// export { cleanupAPIBaseUrl, getApiUrl };
