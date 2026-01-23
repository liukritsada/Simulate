/**
 * Station and Room Management Functions
 * ฟังก์ชันสำหรับจัดการสเตชั่นและห้อง
 */

// ========================================
// ✅ INITIALIZATION
// ========================================

/**
 * ✅ เรียกตอนโหลดหน้า
 */
document.addEventListener("DOMContentLoaded", function () {
  console.log("📱 Page loaded - Cleaning up API URLs...");

  // ✅ ทำความสะอาด API URL
  cleanupAPIBaseUrl();

  // ✅ ทดสอบ
  console.log(`✅ API_BASE_URL: ${window.API_BASE_URL_CLEAN}`);
  console.log(`✅ Test URL: ${getApiUrl("test.php")}`);
});

// Global variables

// ✅ เพิ่มโค้ดนี้ที่ส่วนบนสุดของ station_room_management.js
// (หลังจาก global variables และก่อนฟังก์ชันอื่น ๆ)

// ========================================
// ขั้นตอนที่ 1: ทำความสะอาด API_BASE_URL
// ========================================

console.log("🔧 เริ่มตั้งค่า API Configuration...");

// ตรวจสอบว่า main.php ประกาศ API_BASE_URL หรือยัง
if (typeof API_BASE_URL === "undefined") {
  console.warn("⚠️ API_BASE_URL ไม่ได้ประกาศจาก main.php");

  // หาค่า default จาก URL ปัจจุบัน
  const currentPath = window.location.pathname;

  if (currentPath.includes("/hospital/")) {
    window.API_BASE_URL = "/hospital/api"; // ✅ ไม่มี / ท้าย
  } else {
    window.API_BASE_URL = "/api"; // ✅ ไม่มี / ท้าย
  }

  console.log("✅ ใช้ค่า default:", window.API_BASE_URL);
} else {
  console.log("✅ API_BASE_URL จาก main.php:", API_BASE_URL);

  // ✅ ลบ / ท้ายออก (ถ้ามี)
  window.API_BASE_URL = API_BASE_URL.replace(/\/+$/, "");
}

console.log("🔗 API Base URL (ทำความสะอาดแล้ว):", window.API_BASE_URL);

/**
 * ✅ Function: ทำความสะอาด API URL
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
    console.log(`✅ ลบ trailing slash: "${API_BASE_URL}" → "${cleanUrl}"`);
  }

  // ✅ บันทึก
  window.API_BASE_URL = cleanUrl;
  window.API_BASE_URL_CLEAN = cleanUrl;

  console.log(`🔗 API URL ที่ใช้: ${window.API_BASE_URL_CLEAN}`);

  return true;
}

/**
 * ✅ Helper: สร้าง API URL ที่ถูกต้อง
 */
// ✅ แก้ไขให้ใช้ getApiUrl() เพื่อสร้าง URL ที่ถูกต้อง
function getApiUrl(endpoint) {
  const baseUrl = window.API_BASE_URL_CLEAN || API_BASE_URL.replace(/\/$/, "");
  const url = `${baseUrl}/${endpoint}`;
  return url;
}

/**
 * ✅ Fixed: openStationDetail
 */
async function openStationDetail(stationId) {
  currentStationId = stationId;

  try {
    const apiUrl =
      getApiUrl("get_station_detail.php") + `?station_id=${stationId}`;
    console.log("📥 กำลังดึงข้อมูล:", apiUrl);

    const response = await fetch(apiUrl);
    const result = await response.json();

    if (result.success) {
      displayStationDetail(result.data);
      document.getElementById("stationDetailModal").style.display = "block";

      // ✅ เพิ่ม log ที่นี่
      console.log("🔍 เกี่ยวกับจะเรียก loadDoctorsForStation...");
      loadDoctorsForStation(stationId);
      console.log("🔍 เรียก loadDoctorsForStation เสร็จแล้ว");

      loadStationStaff(stationId);
      setupStatusAutoUpdate(stationId);
    } else {
      alert("❌ " + result.message);
    }
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    alert("❌ ไม่สามารถโหลดข้อมูลได้");
  }
}

/**
 * ✅ Fixed: addDoctorToStation
 */
async function addDoctorToStation(stationId) {
  try {
    // ✅ ดึง station detail
    const stationUrl =
      getApiUrl("get_station_detail.php") + `?station_id=${stationId}`;

    const stationResponse = await fetch(stationUrl);
    const stationResult = await stationResponse.json();

    if (!stationResult.success) {
      throw new Error(stationResult.message);
    }

    const station = stationResult.data.station;
    const departmentId = station.department_id;

    // ... [Modal code here] ...

    // ✅ ส่ง request
    const addUrl = getApiUrl("add_doctor_to_station.php");

    const addResponse = await fetch(addUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_id: stationId,
        department_id: departmentId,
        // ... other data ...
      }),
    });

    const result = await addResponse.json();

    if (result.success) {
      Swal.fire({
        title: "✅ เพิ่มสำเร็จ",
        icon: "success",
      });

      loadDoctorsForStation(stationId);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      title: "❌ ข้อผิดพลาด",
      text: error.message,
      icon: "error",
    });
  }
}

// ========================================
// ✅ UTILITY: JSON Parsing (Unused, but kept for future use)
// ========================================

// Note: The following functions (safeFetchJson, cleanJsonResponse, safeJsonParse) are currently unused
// by the main station/room logic, which uses direct `fetch` and `response.json()`.
// They are kept here as utility functions for future development.

/**
 * Template สำหรับ fetch + parse ที่ปลอดภัย
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
// ===== ROOM CREATION FUNCTIONS =====

/**
 * Open Create Room Modal
 */
function openCreateRoomModal() {
  const stationName = document.getElementById("stationDetailTitle").textContent;
  document.getElementById("createRoomStationName").textContent = stationName;
  document.getElementById("createRoomModal").style.display = "block";
  document.getElementById("newRoomName").value = ""; // Clear previous input
  document.getElementById("newRoomNumber").value = ""; // Clear previous input
}

/**
 * Close Create Room Modal
 */
function closeCreateRoomModal() {
  document.getElementById("createRoomModal").style.display = "none";
}

/**
 * Create New Room
 */
async function createNewRoom() {
  const roomName = document.getElementById("newRoomName").value.trim();
  const roomNumber = document.getElementById("newRoomNumber").value.trim();

  if (!roomName) {
    alert("กรุณากรอกชื่อห้อง");
    return;
  }

  const payload = {
    station_id: currentStationId,
    room_name: roomName,
    room_number: roomNumber, // Can be empty, backend will generate
  };

  try {
    const response = await fetch(`${API_BASE_URL}/create_room.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (result.success) {
      alert("✅ สร้างห้องใหม่สำเร็จ: " + result.data.room_name);
      closeCreateRoomModal();
      // Reload station detail to show the new room
      openStationDetail(currentStationId);
    } else {
      alert("❌ สร้างห้องไม่สำเร็จ: " + result.message);
    }
  } catch (error) {
    console.error("Error creating new room:", error);
    alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ");
  }
}

// ===== END ROOM CREATION FUNCTIONS =====
let currentStationId = null;
let currentRoomId = null;
// 🔄 Cache ข้อมูลพนักงาน (ตัวแปร global)
let staffCache = {};
let staffCacheTime = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 นาที
// Use existing global `API_BASE_URL` if present (declared in `main.php`),
// otherwise fall back to the local relative path.
const _API_BASE = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : ".";

// --- NEW STAFF MANAGEMENT FUNCTIONS ---

// 1. Show Modal for Monthly Staff Import (Excel)
function showMonthlyStaffImportModal(stationId) {
  const html = `
        <div id="monthlyStaffImportModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="monthlyStaffImportModalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="monthlyStaffImportModalLabel">เพิ่มพนักงานรายเดือน (Excel Import)</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="monthlyStaffImportForm" enctype="multipart/form-data">
                            <input type="hidden" name="station_id" value="${stationId}">
                            <div class="form-group">
                                <label for="excel_file">เลือกไฟล์ Excel (.xlsx, .csv)</label>
                                <input type="file" class="form-control-file" id="excel_file" name="excel_file" accept=".xlsx, .xls, .csv" required>
                            </div>
                            <p class="text-muted" style="font-size: 0.85em;">
                                *ไฟล์ต้องมีคอลัมน์ตามลำดับ: รหัสพนักงาน, ชื่อ, นามสกุล, เวลาเข้างาน, เวลาพัก, เลิกพัก, เลิกงาน, วันที่ทำงาน
                            </p>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">ยกเลิก</button>
                        <button type="button" class="btn btn-primary" id="submitMonthlyImport">นำเข้าข้อมูล</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  $("body").append(html);
  $("#monthlyStaffImportModal").modal("show");

  $("#submitMonthlyImport")
    .off("click")
    .on("click", function () {
      handleMonthlyStaffImport(stationId);
    });

  $("#monthlyStaffImportModal").on("hidden.bs.modal", function (e) {
    $(this).remove(); // Clean up modal after closing
  });
}

// 2. Handle Monthly Staff Import Submission
// 2. Handle Monthly Staff Import Submission
function handleMonthlyStaffImport(stationId) {
  const form = $("#monthlyStaffImportForm")[0];
  const formData = new FormData(form);

  // ✅ ตรวจสอบว่า station_id ถูกส่งไปด้วยหรือไม่
  if (!formData.has("station_id")) {
    console.error("❌ station_id is missing in FormData");
    alert("❌ ข้อผิดพลาด: ไม่พบรหัสสถานี (station_id)");
    return;
  }

  console.log("📤 Uploading with station_id:", formData.get("station_id"));

  $.ajax({
    url: `${API_BASE_URL}/import_staff_monthly.php`,
    type: "POST",
    data: formData,
    processData: false,
    contentType: false, // ✅ ปล่อยให้ jQuery ตั้ง Content-Type
    beforeSend: function () {
      $("#submitMonthlyImport").prop("disabled", true).text("กำลังนำเข้า...");
    },
    success: function (response) {
      console.log("✅ Import Response:", response);

      // ✅ ตรวจสอบ response ให้ดี
      if (!response || typeof response !== "object") {
        throw new Error("Invalid response format");
      }

      const msg = response.message || "ดำเนินการเสร็จสิ้น";
      const importedCount = response.imported_count || 0;
      const totalRows = response.total_rows_processed || 0;

      const details = `
📊 สรุปผลการนำเข้า:
✅ สำเร็จ: ${importedCount} รายการ
📝 ประมวลผลทั้งหมด: ${totalRows} แถว
${
  response.errors && response.errors.length > 0
    ? "\n⚠️ ข้อผิดพลาด:\n" + response.errors.join("\n")
    : ""
}
            `;

      Swal.fire({
        title: msg,
        html: `<pre style="text-align: left; font-size: 12px;">${details}</pre>`,
        icon: importedCount > 0 ? "success" : "warning",
        confirmButtonColor: "#1E8449",
      });

      $("#monthlyStaffImportModal").modal("hide");

      // Reload staff list
      if (currentStationId) {
        loadStationStaff(currentStationId);
      }
    },
    error: function (xhr, status, error) {
      console.error("❌ Import Error:", {
        status: xhr.status,
        statusText: xhr.statusText,
        error: error,
        responseText: xhr.responseText,
        responseJSON: xhr.responseJSON,
      });

      // ✅ ทำการ parse response อย่างปลอดภัย
      let errorMessage = "เกิดข้อผิดพลาดในการนำเข้าข้อมูล";

      try {
        if (xhr.responseJSON && xhr.responseJSON.message) {
          errorMessage = xhr.responseJSON.message;
        } else if (xhr.responseText) {
          const parsed = JSON.parse(xhr.responseText);
          errorMessage = parsed.message || errorMessage;
        }
      } catch (parseError) {
        console.warn("⚠️ ไม่สามารถ parse response:", parseError);
        errorMessage = `HTTP ${xhr.status}: ${xhr.statusText || error}`;
      }

      Swal.fire({
        title: "❌ ข้อผิดพลาด",
        html: `
                    <div style="text-align: left; color: #C0392B;">
                        <strong>${errorMessage}</strong><br><br>
                        <small>HTTP Status: ${xhr.status}</small>
                    </div>
                `,
        icon: "error",
        confirmButtonColor: "#C0392B",
      });
    },
    complete: function () {
      $("#submitMonthlyImport").prop("disabled", false).text("นำเข้าข้อมูล");
    },
  });
}

/**
 * ✅ ปรับปรุง: showDailyStaffAddModal - เพิ่มการ cache
 */
async function showDailyStaffAddModal(stationId) {
  const todayDate = new Date();
  const today =
    String(todayDate.getDate()).padStart(2, "0") +
    "/" +
    String(todayDate.getMonth() + 1).padStart(2, "0") +
    "/" +
    todayDate.getFullYear();

  try {
    // 🟢 แสดง loading
    Swal.fire({
      title: "โปรดรอ...",
      html: '<div style="margin-top: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #0056B3;"></i></div>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    // ✅ แปลงวันที่ เป็น yyyy-mm-dd
    const [day, month, year] = today.split("/");
    const todayApiFormat = `${year}-${month}-${day}`;

    // ✅ ดึงพนักงานทั้งหมด (ไม่จำกัดเฉพาะวันนี้)
    const staffList = await loadAllStationStaffForDaily(
      stationId,
      todayApiFormat
    );

    if (staffList.length === 0) {
      Swal.fire("ไม่มีข้อมูล", "ไม่พบพนักงานในสถานี่นี้", "info");
      return;
    }

    // ✅ สร้าง Options
    const staffOptions = createStaffOptions(staffList, today);

    // ✅ สร้าง Modal HTML
    const html = `
            <div class="modal fade" id="dailyStaffAddModal" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content" style="border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); border: none;">
                        <!-- Header -->
                        <div class="modal-header" style="background: linear-gradient(135deg, #0047AB 0%, #0047AB 100%); border: none; border-radius: 12px 12px 0 0; padding: 28px 30px; display: flex; align-items: center; gap: 15px;">
                            <div style="font-size: 36px; color: white;">👤</div>
                            <div>
                                <h5 class="modal-title" style="color: white; font-weight: 700; font-size: 20px; margin: 0;">เพิ่มพนักงานรายวัน/โอที่</h5>
                                <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0 0; font-size: 12px;">บันทึกข้อมูลพนักงานชั่วคราว</p>
                            </div>
                            <button type="button" class="close" data-dismiss="modal" style="color: white; position: absolute; right: 20px; top: 20px; opacity: 0.8; font-size: 24px;">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>

                        <!-- Body -->
                        <div class="modal-body" style="padding: 30px;">
                            <form id="dailyStaffAddForm">
                                <input type="hidden" name="station_id" value="${stationId}">

                                <!-- วันที่ -->
                                <div class="row" style="margin-bottom: 20px;">
                                    <div class="col-md-12">
                                        <div class="form-group">
                                            <label style="font-weight: 700; color: #212529; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; font-size: 14px;">
                                                <span style="color: #C0392B;">*</span> วันที่ทำงาน
                                            </label>
                                            <input type="text" class="form-control" id="work_date" name="work_date" value="${today}"
                                                   placeholder="dd/mm/yyyy"
                                                   style="border: 1.5px solid #ced4da; border-radius: 8px; padding: 11px 14px; font-size: 14px; background: #f8f9fa; transition: all 0.3s ease; color: #212529;">
                                        </div>
                                    </div>
                                </div>

                                <!-- เลือกพนักงาน -->
                                <div class="row" style="margin-bottom: 20px;">
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label style="font-weight: 700; color: #212529; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; font-size: 14px;">
                                                <span style="color: #C0392B;">*</span> เลือกพนักงาน
                                            </label>
                                            <select id="staff_select" class="form-control" style="border: 1.5px solid #ced4da; border-radius: 8px; padding: 11px 14px; font-size: 14px; background: white; cursor: pointer; transition: all 0.3s ease; flex: 1;" onchange="autoFillStaffName()" required>
                                                ${staffOptions}
                                            </select>
                                            <small style="color: #adb5bd; margin-top: 5px; display: block;">
                                                ✓ = เพิ่มเข้าห้องแล้ว | เลือกคนอื่นเพิ่มเสริม
                                            </small>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label style="font-weight: 700; color: #212529; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; font-size: 14px;">
                                                <span style="color: #C0392B;">*</span> ชื่อ-สกุล
                                            </label>
                                            <input type="text" class="form-control" id="staff_name" name="staff_name" placeholder="auto fill" readonly
                                                   style="border: 1.5px solid #ced4da; border-radius: 8px; padding: 11px 14px; font-size: 14px; background: #f8f9fa; color: #212529;" required>
                                        </div>
                                    </div>
                                </div>

                                <!-- เวลาทำงาน -->
                                <div class="row" style="margin-bottom: 20px;">
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label style="font-weight: 700; color: #212529; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; font-size: 14px;">
                                                <span style="color: #C0392B;">*</span> เวลาเข้างาน
                                            </label>
                                            <input type="text" class="form-control" id="work_start_time" name="work_start_time" value="08:00"
                                                   placeholder="HH:MM (24 ชั่วโมง)"
                                                   style="border: 1.5px solid #ced4da; border-radius: 8px; padding: 11px 14px; font-size: 14px; background: #f8f9fa; transition: all 0.3s ease; color: #212529;"
                                                   onchange="formatTimeInput(this)"
                                                   required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label style="font-weight: 700; color: #212529; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; font-size: 14px;">
                                                <span style="color: #C0392B;">*</span> เวลาออกงาน
                                            </label>
                                            <input type="text" class="form-control" id="work_end_time" name="work_end_time" value="17:00"
                                                   placeholder="HH:MM (24 ชั่วโมง)"
                                                   style="border: 1.5px solid #ced4da; border-radius: 8px; padding: 11px 14px; font-size: 14px; background: #f8f9fa; transition: all 0.3s ease; color: #212529;"
                                                   onchange="formatTimeInput(this)"
                                                   required>
                                        </div>
                                    </div>
                                </div>

                                <!-- พักเบรค -->
                                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 16px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #6c757d;">
                                    <div style="font-weight: 700; color: #495057; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; font-size: 14px;">
                                        <i class="fas fa-coffee" style="font-size: 16px;"></i> เวลาพักเบรค
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-group" style="margin-bottom: 0;">
                                                <label style="font-weight: 600; color: #6c757d; margin-bottom: 8px; font-size: 12px;">เวลาเริ่มพักเบรค (HH:MM)</label>
                                                <input type="text" class="form-control" id="break_start_time" name="break_start_time"
                                                       placeholder="12:00" value="12:00"
                                                       style="border: 1.5px solid #ced4da; border-radius: 8px; padding: 11px 14px; font-size: 14px; background: #f8f9fa; transition: all 0.3s ease; color: #212529;"
                                                       onchange="formatTimeInput(this)">
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group" style="margin-bottom: 0;">
                                                <label style="font-weight: 600; color: #6c757d; margin-bottom: 8px; font-size: 12px;">เวลาสิ้นสุดพักเบรค (HH:MM)</label>
                                                <input type="text" class="form-control" id="break_end_time" name="break_end_time"
                                                       placeholder="13:00" value="13:00"
                                                       style="border: 1.5px solid #ced4da; border-radius: 8px; padding: 11px 14px; font-size: 14px; background: #f8f9fa; transition: all 0.3s ease; color: #212529;"
                                                       onchange="formatTimeInput(this)">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <!-- Footer -->
                        <div class="modal-footer" style="border-top: 1px solid #e9ecef; padding: 18px 30px; background: #f8f9fa; border-radius: 0 0 12px 12px; display: flex; gap: 10px;">
                            <button type="button" class="btn" data-dismiss="modal"
                                    style="padding: 10px 22px; background: #e9ecef; color: #495057; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-size: 14px;">
                                <i class="fas fa-times"></i> ยกเลิก
                            </button>
                            <button type="button" class="btn btn-success" id="submitDailyAdd"
                                    style="padding: 10px 22px; background: linear-gradient(135deg, #0047AB 0%, #0047AB 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0, 71, 171, 0.25); font-size: 14px;">
                                <i class="fas fa-save"></i> บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // ❌ ปิด loading
    Swal.close();
    $("body").append(html);
    $("#dailyStaffAddModal").modal("show");

    // 📌 Event listeners
    $("#submitDailyAdd")
      .off("click")
      .on("click", function () {
        handleDailyStaffAdd(stationId);
      });

    $("#dailyStaffAddModal").on("hidden.bs.modal", function (e) {
      $(this).remove();
    });
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire(
      "ข้อผิดพลาด",
      "ไม่สามารถโหลดข้อมูลพนักงาน: " + error.message,
      "error"
    );
  }
}
/**
 * ⚡ ล้าง cache เมื่อเปลี่ยนวันที่
 */
function clearStaffCache(stationId, workDate) {
  const cacheKey = `staff_${stationId}_${workDate}`;
  delete staffCache[cacheKey];
  delete staffCacheTime[cacheKey];
  console.log(`🗑️ ล้าง cache: ${cacheKey}`);
}
/**
 * ✅ Format time to 24-hour (HH:MM) - ใช้ได้ทั้ง input และ display
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
 * ✅ NEW: Reload staff list when date changes
 * โหลดพนักงานใหม่เมื่อเลือกวันที่ต่างไป (ดึงเฉพาะวันนั้นจาก database)
 */
async function reloadStaffListForDate(workDateStr, stationId) {
  if (!workDateStr) return;

  try {
    console.log(`📅 Reloading staff for date: ${workDateStr}`);

    // ✅ Convert dd/mm/yyyy to yyyy-mm-dd
    const [day, month, year] = workDateStr.split("/");
    const apiDate = `${year}-${month}-${day}`;

    console.log(
      `🔗 API URL: ${API_BASE_URL}/get_station_staff_list.php?station_id=${stationId}&work_date=${apiDate}`
    );

    // ✅ SEND work_date parameter
    const response = await fetch(
      `${API_BASE_URL}/get_station_staff_list.php?station_id=${stationId}&work_date=${apiDate}`
    );
    const result = await response.json();

    console.log("📊 API Response:", result);

    if (!result.success) {
      console.warn("⚠️ ไม่สามารถดึงข้อมูล:", result.message);
      return;
    }

    const staffList = result.data || [];
    console.log(`✅ Found ${staffList.length} staff for ${workDateStr}`);

    // ✅ Update dropdown
    let staffOptions = '<option value="">-- เลือกพนักงาน --</option>';
    staffList.forEach((staff) => {
      const statusIcon = staff.is_assigned_today ? "✓ (บันทึกแล้ว) " : "";
      const dataAttrs = staff.today_assignment
        ? `data-assignment-id="${staff.today_assignment.station_staff_id}"
                 data-work-start="${staff.today_assignment.work_start_time}"
                 data-work-end="${staff.today_assignment.work_end_time}"
                 data-break-start="${
                   staff.today_assignment.break_start_time || ""
                 }"
                 data-break-end="${
                   staff.today_assignment.break_end_time || ""
                 }"`
        : "";

      staffOptions += `
                <option value="${staff.staff_id}"
                        data-name="${staff.staff_name}"
                        data-type="${staff.staff_type}"
                        ${dataAttrs}>
                    ${statusIcon}${staff.staff_name} (${staff.staff_type})
                </option>
            `;
    });

    // ✅ Update dropdown
    const staffSelect = document.getElementById("staff_select");
    if (staffSelect) {
      staffSelect.innerHTML = staffOptions;
      staffSelect.value = "";
      document.getElementById("staff_name").value = "";
    }

    // ✅ Update no staff message
    const noStaffMsg = document.getElementById("noStaffMessage");
    if (noStaffMsg) {
      if (staffList.length === 0) {
        noStaffMsg.innerHTML = `
                    <div style="background: rgba(192, 57, 43, 0.1); border: 1px solid #C0392B; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                        <span style="color: #C0392B; font-weight: 600;">⚠️ ไม่มีพนักงานบันทึกวันที่ ${workDateStr}</span><br>
                        <span style="color: #C0392B; font-size: 12px;">เลือกวันที่อื่นหรือเพิ่มพนักงานใหม่</span>
                    </div>
                `;
      } else {
        noStaffMsg.innerHTML = "";
      }
    }
  } catch (error) {
    console.error("❌ Error reloading staff:", error);
  }
}

/**
 * ✅ NEW: Auto-fill staff name เมื่อเลือกจากไฟล์
 */
function autoFillStaffName() {
  const select = document.getElementById("staff_select");
  const staffNameInput = document.getElementById("staff_name");
  const cancelBtn = document.getElementById("cancelTodayBtn");
  const workStartInput = document.getElementById("work_start_time");
  const workEndInput = document.getElementById("work_end_time");
  const breakStartInput = document.getElementById("break_start_time");
  const breakEndInput = document.getElementById("break_end_time");

  const selectedOption = select.options[select.selectedIndex];
  if (selectedOption.value) {
    staffNameInput.value = selectedOption.getAttribute("data-name");

    const dataset = selectedOption.dataset;
    if (dataset.assignmentId) {
      cancelBtn.style.display = "block";
      cancelBtn.dataset.assignmentId = dataset.assignmentId;
      cancelBtn.onclick = function () {
        cancelTodayAssignment(
          parseInt(dataset.assignmentId),
          staffNameInput.value
        );
      };

      // ✅ Show time in 24-hour format
      workStartInput.value = dataset.workStart || "08:00";
      workEndInput.value = dataset.workEnd || "17:00";
      breakStartInput.value = dataset.breakStart || "12:00";
      breakEndInput.value = dataset.breakEnd || "13:00";

      Swal.fire({
        title: "OT ต่อ",
        html: `
                    <div style="text-align: left;">
                        <p><strong>${staffNameInput.value}</strong></p>
                        <p>ทำงานวันนี้แล้ว:</p>
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin: 10px 0;">
                            เข้า: ${workStartInput.value}<br>
                            ออก: ${workEndInput.value}
                        </div>
                        <p style="color: #0047AB; font-weight: bold;">
                            ✓ สามารถเพิ่มเวลาสำหรับ OT ต่อ
                        </p>
                    </div>
                `,
        icon: "info",
        showConfirmButton: false,
        timer: 2000,
      });
    } else {
      cancelBtn.style.display = "none";
      workStartInput.value = "08:00";
      workEndInput.value = "17:00";
      breakStartInput.value = "12:00";
      breakEndInput.value = "13:00";
    }
  } else {
    staffNameInput.value = "";
    cancelBtn.style.display = "none";
    workStartInput.value = "08:00";
    workEndInput.value = "17:00";
    breakStartInput.value = "12:00";
    breakEndInput.value = "13:00";
  }
}

/**
 * ✅ NEW: Convert 12-hour format to 24-hour (if needed)
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

/**
 * ✅ UPDATED: convertDateDDMMToYYYYMM - แปลงวันที่จากฟอร์ม dd/mm/yyyy เป็น yyyy-mm-dd
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
/**
 * ✅ NEW: Format date input (dd/mm/yyyy)
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
 * ✅ NEW: Format time input (HH:MM in 24-hour format)
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
 * ✅ NEW: Convert dd/mm/yyyy to yyyy-mm-dd for API
 */
function convertDateFormat(dateStr) {
  // dateStr = "12/02/2025"
  // return = "2025-02-12"
  if (!dateStr || dateStr.length !== 10) return dateStr;
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month}-${day}`;
}
async function cancelTodayAssignment(stationStaffId, staffName) {
  const result = await Swal.fire({
    title: "ยกเลิกการทำงาน?",
    text: `ต้องการยกเลิกการบันทึก "${staffName}" สำหรับวันนี้ใช่ไหม?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ใช่ ยกเลิก",
    cancelButtonText: "ไม่",
    confirmButtonColor: "#C0392B",
    cancelButtonColor: "#6c757d",
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/cancel_staff_assignment.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ station_staff_id: stationStaffId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        Swal.fire("สำเร็จ", data.message, "success");
        // ✅ refresh modal
        setTimeout(() => {
          $("#dailyStaffAddModal").modal("hide");
          showDailyStaffAddModal(
            document.querySelector('input[name="station_id"]').value
          );
        }, 500);
      } else {
        Swal.fire("ข้อผิดพลาด", data.message, "error");
      }
    } catch (error) {
      Swal.fire("ข้อผิดพลาด", "เกิดข้อผิดพลาด: " + error.message, "error");
    }
  }
}
// 4. Handle Daily Staff Add Submission
function handleDailyStaffAdd(stationId) {
  const staffSelect = document.getElementById("staff_select");
  const staffId = staffSelect.value;
  const staffName = document.getElementById("staff_name").value;
  const workDateInput = document.getElementById("work_date").value; // ✅ ดึงวันที่จากฟอร์ม
  const workStart = document.getElementById("work_start_time").value;
  const workEnd = document.getElementById("work_end_time").value;
  const breakStart = document.getElementById("break_start_time").value;
  const breakEnd = document.getElementById("break_end_time").value;

  console.log("📝 Form Data:", {
    staffId,
    staffName,
    workDateInput,
    workStart,
    workEnd,
    breakStart,
    breakEnd,
  });

  // ✅ Validation
  if (!staffId || staffId.trim() === "") {
    Swal.fire("⚠️ ข้อผิดพลาด", "โปรดเลือกพนักงาน", "error");
    return;
  }

  if (!staffName || staffName.trim() === "") {
    Swal.fire("⚠️ ข้อผิดพลาด", "ชื่อพนักงานไม่ถูกต้อง", "error");
    return;
  }

  if (!workStart || !workEnd || !breakStart || !breakEnd) {
    Swal.fire("⚠️ ข้อผิดพลาด", "โปรดระบุเวลาทั้งหมด", "error");
    return;
  }

  if (
    workStart >= breakStart ||
    breakStart >= breakEnd ||
    breakEnd >= workEnd
  ) {
    Swal.fire(
      "⚠️ ข้อผิดพลาด",
      "ลำดับเวลาไม่ถูกต้อง\n" +
        "ต้องเป็น: เข้า < เบรกเริ่ม < เบรกจบ < ออก\n" +
        `ตัวอย่าง: 08:00 < 12:00 < 13:00 < 17:00`,
      "error"
    );
    return;
  }

  // ✅ แปลงวันที่จาก dd/mm/yyyy เป็น yyyy-mm-dd
  const workDate = convertDateDDMMToYYYYMM(workDateInput);

  // ✅ สร้าง payload
  const payload = {
    station_id: stationId,
    staff_id: staffId.trim(),
    staff_name: staffName.trim(),
    work_date: workDate, // ✅ ใช้วันที่จากฟอร์ม
    work_start_time: workStart + ":00",
    work_end_time: workEnd + ":00",
    break_start_time: breakStart + ":00",
    break_end_time: breakEnd + ":00",
  };

  console.log("🔄 Sending Payload:", payload);

  Swal.fire({
    title: "กำลังบันทึกข้อมูล...",
    html: '<div style="margin-top: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #0056B3;"></i></div>',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
  });

  $.ajax({
    url: API_BASE_URL + "/add_staff_daily.php",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: function (response) {
      console.log("✅ Success Response:", response);
      Swal.close();

      if (response.success) {
        Swal.fire({
          title: "✅ สำเร็จ!",
          html: `
                        <div style="text-align: left; padding: 20px;">
                            <p><strong>${staffName}</strong></p>
                            <p>📅 วันที่: ${workDateInput}</p>
                            <p>⏰ เวลา: ${workStart} - ${workEnd}</p>
                            <p>☕ พักเบรก: ${breakStart} - ${breakEnd}</p>
                        </div>
                    `,
          icon: "success",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#1E8449",
        }).then(() => {
          $("#dailyStaffAddModal").modal("hide");
          loadStationStaff(stationId);
        });
      } else {
        Swal.fire("❌ ข้อผิดพลาด", response.message, "error");
      }
    },
    error: function (xhr, status, error) {
      console.error("❌ Error Response:", xhr);
      Swal.close();

      let errorMsg = "เกิดข้อผิดพลาดในการเชื่อมต่อ";

      if (xhr.responseJSON) {
        errorMsg = xhr.responseJSON.message || errorMsg;
      }

      Swal.fire({
        title: "❌ ข้อผิดพลาด!",
        html: `
                    <div style="text-align: left;">
                        <p><strong>${errorMsg}</strong></p>
                        <small style="color: #adb5bd;">
                            Status: ${xhr.status}<br>
                            Error: ${error}
                        </small>
                    </div>
                `,
        icon: "error",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#C0392B",
      });
    },
  });
}

/**
 * Display Station Detail
 */
async function displayStationDetail(data) {
  const station = data.station;
  currentStationData = station;

  // Set header
  document.getElementById("stationDetailTitle").textContent =
    station.station_name;
  document.getElementById("stationDetailSubtitle").textContent =
    `${station.station_code} | Floor ${station.floor}`;

  // Display all tabs with real data
  displayStationRooms(data.rooms || []);
  loadStationStaff(station.station_id);
  displayStationDoctors(data.doctors || []);
  displayStationProcedures(data.station_procedures || []);
  
  // ✅ NEW: ดึงข้อมูลคนไข้จาก RealTime API
  await loadStationPatients(station.station_id, station.department_id);

  // Ensure the first tab is active
  switchStationTab("Rooms"); 
  // ✅ ดึงข้อมูลคนไข้
  if (station.department_ids || station.department_id) {
    const deptIds = station.department_ids || [station.department_id];
    await loadStationPatients(station.station_id, deptIds);
  }
}

/**
 * Display Rooms
 */

function displayStationRooms(rooms) {
  const now = new Date();
  const currentTime =
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0");

  function normalizeTime(timeStr) {
    if (!timeStr) return "00:00";
    const parts = timeStr.split(":");
    const hours = parts[0].padStart(2, "0");
    const minutes = parts[1] ? parts[1].padStart(2, "0") : "00";
    return `${hours}:${minutes}`;
  }

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3 style="margin: 0; font-size: 16px;">🏠 ห้อง (${rooms.length})</h3>
      <button class="btn" style="background: #0047AB; color: white;" onclick="openCreateRoomModal()">
        <i class="fas fa-plus"></i> สร้างห้องใหม่
      </button>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
  `;

  rooms.forEach((room) => {
    const hasStaff = room.staff_count > 0;
    const hasDoctor = room.doctor_count > 0;

    console.log(
      `📍 ${room.room_name}: Staff=${hasStaff} (${room.staff_count}), Doctor=${hasDoctor} (${room.doctor_count})`
    );
    console.log(`   Doctor Work Times:`, room.doctor_work_times);
    console.log(`   Staff Work Times:`, room.staff_work_times);

    // ✅ ตรวจสอบเวลาแพทย์
    let isDoctorOnDuty = false;
    if (
      hasDoctor &&
      room.doctor_work_times &&
      Array.isArray(room.doctor_work_times) &&
      room.doctor_work_times.length > 0
    ) {
      isDoctorOnDuty = room.doctor_work_times.some((time) => {
        const start = normalizeTime(time.work_start_time);
        const end = time.work_end_time
          ? normalizeTime(time.work_end_time)
          : null;

        console.log(
          `   ⏰ Doctor: ${start} <= ${currentTime}${
            end ? ` <= ${end}` : " (ยังไม่ออกงาน)"
          }`
        );

        if (currentTime >= start) {
          if (!end) {
            console.log(`      ✅ Doctor On Duty (ยังทำงาน)`);
            return true;
          }
          if (currentTime < end) {
            console.log(`      ✅ Doctor On Duty (อยู่ในช่วงทำงาน)`);
            return true;
          }
          console.log(`      ❌ Doctor Off Duty (เลิกงาน)`);
          return false;
        }
        console.log(`      ❌ Doctor not started (ยังไม่เข้างาน)`);
        return false;
      });
    }

    // ✅ ตรวจสอบเวลาพนักงาน
    let isStaffOnDuty = false;
    if (
      hasStaff &&
      room.staff_work_times &&
      Array.isArray(room.staff_work_times) &&
      room.staff_work_times.length > 0
    ) {
      isStaffOnDuty = room.staff_work_times.some((time) => {
        const start = normalizeTime(time.work_start_time);
        const end = time.work_end_time
          ? normalizeTime(time.work_end_time)
          : null;

        console.log(
          `   ⏰ Staff: ${start} <= ${currentTime}${
            end ? ` <= ${end}` : " (ยังไม่ออกงาน)"
          }`
        );

        if (currentTime >= start) {
          if (!end) {
            console.log(`      ✅ Staff On Duty (ยังทำงาน)`);
            return true;
          }
          if (currentTime < end) {
            console.log(`      ✅ Staff On Duty (อยู่ในช่วงทำงาน)`);
            return true;
          }
          console.log(`      ❌ Staff Off Duty (เลิกงาน)`);
          return false;
        }
        console.log(`      ❌ Staff not started (ยังไม่เข้างาน)`);
        return false;
      });
    }

    console.log(
      `  📊 isDoctorOnDuty: ${isDoctorOnDuty}, isStaffOnDuty: ${isStaffOnDuty}`
    );

    // ✅ ห้องเปิด = มีแพทย์อยู่ OR มีพนักงานอยู่ (อย่างน้อยหนึ่งคน)
    const isActive = isDoctorOnDuty || isStaffOnDuty;

    console.log(`  ✅ Room Active: ${isActive}`);

    const isDisabled = !isActive;

    let statusColor = "#999";
    let statusBgColor = "rgba(0, 0, 0, 0.1)";

    if (isActive) {
      statusColor = "#1E8449"; // สีเขียว - เปิด
      statusBgColor = "rgba(30, 132, 73, 0.1)";
    } else if (hasDoctor || hasStaff) {
      statusColor = "#FFC107"; // สีเหลือง - รอเวลา
      statusBgColor = "rgba(255, 193, 7, 0.1)";
    }

    // ✅ สร้างข้อความเตือน
    let warningMsg = "🔒 ปิดใช้งาน";
    if (!hasDoctor && !hasStaff) {
      warningMsg = "🔒 ปิดใช้งาน - ไม่มีแพทย์หรือพนักงาน";
    } else if (!isActive) {
      // แสดงช่วงเวลาถ้ามี
      const firstTime =
        room.doctor_work_times?.[0] || room.staff_work_times?.[0];
      if (firstTime) {
        const start = normalizeTime(firstTime.work_start_time);
        warningMsg = `⏳ รอเวลา (เปิด ${start})`;
      } else {
        warningMsg = `⏳ รอเวลา (${currentTime})`;
      }
    }

    html += `
      <div 
        class="room-card" 
        style="
          cursor: ${isDisabled ? "not-allowed" : "pointer"};
          border-left-color: ${statusColor};
          opacity: ${isDisabled ? "0.6" : "1"};
          background: ${statusBgColor};
          ${isDisabled ? "pointer-events: none;" : ""}
        "
        ${!isDisabled ? `onclick="openRoomDetail(${room.room_id})"` : ""}
      >
        <button 
          onclick="event.stopPropagation(); deleteRoomConfirm(${
            room.room_id
          }, '${room.room_name}')"
          style="position: absolute; top: 10px; right: 10px; background: #C0392B; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; z-index: 10;"
        >
          <i class="fas fa-trash"></i>
        </button>

        <div style="padding-right: 40px;">
          <div style="font-weight: bold; margin-bottom: 10px;">
            ${room.room_name}
          </div>
          <div style="font-size: 12px; color: var(--text-light); line-height: 1.8;">
            👥 พนักงาน: ${room.staff_count} คน<br>
            👨‍⚕️ แพทย์: ${room.doctor_count} คน<br>
            🛏️ คนไข้: ${room.patient_count} คน
          </div>

          ${
            isDisabled
              ? `
            <div style="
              margin-top: 10px; 
              padding: 8px 12px; 
              background: rgba(192, 57, 43, 0.15);
              color: #C0392B; 
              border-radius: 5px; 
              font-size: 11px;
              text-align: center;
              font-weight: 600;
              border: 1px solid rgba(192, 57, 43, 0.3);
            ">
              ${warningMsg}
            </div>
            `
              : ""
          }
        </div>
      </div>
    `;
  });

  html += "</div>";
  document.getElementById("stationRoomsContent").innerHTML = html;
}

/**
 * ✅ Delete Room Confirmation
 */
function deleteRoomConfirm(roomId, roomName) {
  event.stopPropagation(); // ป้องกัน event bubble

  Swal.fire({
    title: "⚠️ ยืนยันการลบห้อง",
    html: `
            <div style="text-align: left; color: #212529;">
                <p>คุณต้องการลบห้อง <strong>${roomName}</strong> ใช่หรือไม่?</p>
                <div style="
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    padding: 12px;
                    border-radius: 8px;
                    margin: 15px 0;
                    font-size: 13px;
                    color: #856404;
                ">
                    <strong>⚠️ คำเตือน:</strong><br>
                    - การลบห้องจะลบข้อมูลทั้งหมดของห้องนี้<br>
                    - ไม่สามารถกู้คืนข้อมูลได้<br>
                    - กรุณาตรวจสอบให้แน่ใจก่อนลบ
                </div>
            </div>
        `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ใช่ ลบห้องนี้",
    cancelButtonText: "ไม่ ยกเลิก",
    confirmButtonColor: "#C0392B",
    cancelButtonColor: "#6c757d",
    reverseButtons: true,
  }).then(async (result) => {
    if (result.isConfirmed) {
      await deleteRoom(roomId, roomName);
    }
  });
}

/**
 * ✅ Delete Room API Call (แก้ไขให้ลบข้อมูลที่เกี่ยวข้องด้วย)
 */
async function deleteRoom(roomId, roomName) {
  try {
    // แสดง loading
    Swal.fire({
      title: "กำลังลบห้อง...",
      html: '<div style="margin-top: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #C0392B;"></i></div>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    const response = await fetch(`${API_BASE_URL}/delete_room.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room_id: roomId,
        force: true, // ✅ เปลี่ยนเป็น true เพื่อลบข้อมูลที่เกี่ยวข้องด้วย
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ ลบห้องสำเร็จ:", result);

    if (result.success) {
      Swal.fire({
        title: "✅ ลบห้องสำเร็จ!",
        html: `
                    <div style="text-align: left;">
                        <p>ห้อง <strong>${roomName}</strong> ถูกลบเรียบร้อยแล้ว</p>
                        ${
                          result.data.deleted_staff > 0
                            ? `<p style="color: #666; font-size: 13px;">🗑️ ลบพนักงาน: ${result.data.deleted_staff} คน</p>`
                            : ""
                        }
                        ${
                          result.data.deleted_equipment > 0
                            ? `<p style="color: #666; font-size: 13px;">🗑️ ลบเครื่องมือ: ${result.data.deleted_equipment} รายการ</p>`
                            : ""
                        }
                        ${
                          result.data.deleted_procedures > 0
                            ? `<p style="color: #666; font-size: 13px;">🗑️ ลบการดำเนินการ: ${result.data.deleted_procedures} รายการ</p>`
                            : ""
                        }
                    </div>
                `,
        icon: "success",
        confirmButtonColor: "#1E8449",
      });

      // รีโหลดข้อมูลห้อง
      openStationDetail(currentStationId);
    } else {
      throw new Error(result.message || "ไม่สามารถลบห้องได้");
    }
  } catch (error) {
    console.error("❌ ข้อผิดพลาด:", error);
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      html: `
                <div style="text-align: left;">
                    <p><strong>${error.message}</strong></p>
                    <small style="color: #999;">กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ</small>
                </div>
            `,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}

/**
 * ✅ Add CSS for Room Card Styling
 */
function addRoomCardStyles() {
  if (document.getElementById("room-card-styles")) return;

  const style = document.createElement("style");
  style.id = "room-card-styles";
  style.textContent = `
        .room-card {
            background: white;
            border: 1px solid #e9ecef;
            border-left: 4px solid;
            border-radius: 12px;
            padding: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            position: relative;
            overflow: hidden;
        }

        .room-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.12);
            border-color: #0056B3;
        }

        .room-card:hover .delete-btn {
            opacity: 1;
            visibility: visible;
        }

        @media (max-width: 768px) {
            .room-card {
                padding: 12px;
            }
        }
    `;
  document.head.appendChild(style);
}

// เรียกใช้ฟังชั้นเพื่อเพิ่ม CSS
addRoomCardStyles();

/**
 * Load Staff in Station with Enhanced Status
 */
/**
 * ✅ FIXED: Load Station Staff with work_date
 */
async function loadStationStaff(stationId) {
  try {
    const today = new Date().toISOString().split("T")[0];

    console.log(
      `📊 ดึงข้อมูลพนักงาน - Station: ${stationId}, วันที่: ${today}`
    );

    // ✅ ใช้ getApiUrl
    const url =
      getApiUrl("get_station_staff_status.php") +
      `?station_id=${stationId}&work_date=${today}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      console.log(`✅ พบพนักงาน: ${result.data.staff.length} คน`);
      displayStaffWithSchedule(result.data.staff, result.data.stats);
    } else {
      console.error("❌ ข้อผิดพลาด:", result.message);
      displayStationStaffSimple([]);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    displayStationStaffSimple([]);
  }
}

/**
 * Fallback: Display Staff in Station (Simple)
 */
function displayStationStaffSimple(staff) {
  let html = `
        <!-- ✅ ADD STAFF BUTTONS SECTION -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 10px;">
            <h3 style="margin: 0; font-size: 16px; color: #212529;">👥 พนักงาน (${staff.length} คน)</h3>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button onclick="showMonthlyStaffImportModal(${currentStationId})"
                        style="
                            background: #0056B3;
                            color: white;
                            border: none;
                            padding: 10px 16px;
                            border-radius: 6px;
                            font-weight: 600;
                            font-size: 13px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            transition: all 0.3s ease;
                            box-shadow: 0 2px 6px rgba(0, 86, 179, 0.2);
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0, 86, 179, 0.3)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(0, 86, 179, 0.2)';">
                    <i class="fas fa-file-excel"></i> Excel
                </button>
                <button onclick="showDailyStaffAddModal(${currentStationId})"
                        style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 10px 16px;
                            border-radius: 6px;
                            font-weight: 600;
                            font-size: 13px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            transition: all 0.3s ease;
                            box-shadow: 0 2px 6px rgba(108, 117, 125, 0.2);
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(108, 117, 125, 0.3)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(108, 117, 125, 0.2)';">
                    <i class="fas fa-user-plus"></i> วัน/OT
                </button>
            </div>
        </div>

        <div style="display: grid; gap: 10px;">
    `;

  staff.forEach((s) => {
    const roomInfo = s.room_name
      ? `<div style="font-size: 11px; color: #0047AB;">🚪 ห้อง: ${s.room_name}</div>`
      : "";

    html += `
            <div style="background: rgba(255,255,255,0.7); padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #0056B3; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 14px; color: #212529;">${
                      s.staff_name
                    }</div>
                    <div style="font-size: 12px; color: #6c757d; margin-top: 4px;">${
                      s.staff_type
                    }</div>
                    ${roomInfo}
                </div>
                <div style="font-size: 11px; color: #6c757d; text-align: right; min-width: 120px;">
                    ⏱️ ${s.work_start_time || "-"} - ${
      s.work_end_time || "-"
    }<br>
                    📅 บันทึก: ${new Date(s.assigned_at).toLocaleDateString(
                      "th-TH"
                    )}
                </div>
            </div>
        `;
  });

  if (staff.length === 0) {
    html +=
      '<div style="text-align: center; padding: 40px; color: #adb5bd; background: rgba(200,200,200,0.1); border-radius: 8px;">ไม่มีพนักงาน<br><small style="margin-top: 10px; display: block;">👆 คลิกปุ่มด้านบนเพื่อเพิ่มพนักงาน</small></div>';
  }

  html += "</div>";
  document.getElementById("stationStaffContent").innerHTML = html;
}

// ==================== DISPLAY PROCEDURES ====================

function displayStationProcedures(procedures) {
  const container = document.getElementById("stationProceduresContent");

  if (!container) {
    console.error("❌ Container not found: stationProceduresContent");
    return;
  }

  if (!procedures || procedures.length === 0) {
    container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; font-size: 16px; font-weight: 700;">💉 หัตถการ (0)</h3>
                <button class="btn btn-success" onclick="openAddStationProcedureModal()" 
                        style="background: #1E8449; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">
                    <i class="fas fa-plus"></i> เพิ่มหัตถการ
                </button>
            </div>
            <div style="text-align: center; padding: 30px; color: #adb5bd;">
                <i class="fas fa-syringe" style="font-size: 36px; margin-bottom: 10px; opacity: 0.3;"></i>
                <div>ไม่มีหัตถการในสถานีนี้</div>
            </div>
        `;
    return;
  }

  let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 10px;">
            <h3 style="margin: 0; font-size: 15px; font-weight: 700;">💉 หัตถการ (${
              procedures.length
            })</h3>
            <button class="btn btn-success" onclick="openAddStationProcedureModal()" 
                    style="background: #1E8449; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 11px; cursor: pointer;">
                <i class="fas fa-plus"></i> เพิ่ม
            </button>
        </div>

        <div style="margin-bottom: 12px; position: relative;">
            <input type="text" 
                   id="procedureSearchInput"
                   placeholder="🔍 ค้นหาหัตถการ..."
                   onkeyup="filterProcedures()"
                   oninput="filterProcedures()"
                   style="
                       width: 100%;
                       padding: 8px 12px 8px 35px;
                       border: 1px solid #ced4da;
                       border-radius: 6px;
                       font-size: 12px;
                       box-sizing: border-box;
                       outline: none;
                   ">
            <div style="
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: #6c757d;
                pointer-events: none;
            ">
                <i class="fas fa-search"></i>
            </div>
            ${
              procedures.length > 5
                ? `
            <button onclick="clearProcedureSearch()" 
                    id="clearSearchBtn"
                    style="
                        position: absolute;
                        right: 8px;
                        top: 50%;
                        transform: translateY(-50%);
                        background: none;
                        border: none;
                        color: #6c757d;
                        cursor: pointer;
                        font-size: 12px;
                        padding: 4px;
                        display: none;
                    "
                    onmouseover="this.style.color='#e74c3c'"
                    onmouseout="this.style.color='#6c757d'">
                <i class="fas fa-times"></i>
            </button>
            `
                : ""
            }
        </div>

        <div style="display: grid; gap: 8px;" id="proceduresListContainer">
        </div>
    `;

  container.innerHTML = html;

  // แสดงรายการเริ่มต้น
  renderProceduresList(
    procedures,
    document.getElementById("proceduresListContainer")
  );

  // Store procedures data globally for search
  window.allProcedures = procedures;

  console.log("✅ displayStationProcedures สำเร็จ");
}

// ==================== SMOOTH SEARCH FUNCTIONS ====================
let searchTimeout = null;
let isSearching = false;

function filterProcedures() {
  const searchInput = document.getElementById("procedureSearchInput");
  const clearBtn = document.getElementById("clearSearchBtn");

  if (!searchInput) return;

  const searchTerm = searchInput.value.trim();

  // แสดง/ซ่อนปุ่ม clear
  if (clearBtn) {
    clearBtn.style.display = searchTerm ? "block" : "none";
  }

  // หยุดการค้นหาก่อนหน้า
  clearTimeout(searchTimeout);

  // ถ้าไม่มีข้อความค้นหา
  if (!searchTerm) {
    showAllProcedures();
    return;
  }

  // ใช้ debounce แบบเร็ว (50ms) สำหรับการค้นหาทันที
  searchTimeout = setTimeout(() => {
    performSearch(searchTerm);
  }, 50);
}

function showAllProcedures() {
  const container = document.getElementById("proceduresListContainer");
  if (!container || !window.allProcedures) return;

  renderProceduresList(window.allProcedures, container);
}

function performSearch(searchTerm) {
  const container = document.getElementById("proceduresListContainer");

  if (!container || !window.allProcedures) return;

  const searchTermLower = searchTerm.toLowerCase();

  // Filter procedures
  const filtered = window.allProcedures.filter((proc) => {
    const name = (proc.procedure_name || "").toLowerCase();
    return name.includes(searchTermLower);
  });

  renderProceduresList(filtered, container, searchTerm);
}

function renderProceduresList(procedures, container, searchTerm = "") {
  if (!container) return;

  let html = "";

  if (procedures.length === 0) {
    html = `
            <div style="text-align: center; padding: 20px; color: #adb5bd;">
                <i class="fas fa-search" style="font-size: 24px; margin-bottom: 8px; opacity: 0.3;"></i>
                <div style="font-size: 12px;">
                    ${
                      searchTerm
                        ? `ไม่พบหัตถการ "${searchTerm}"`
                        : "ไม่มีหัตถการ"
                    }
                </div>
            </div>
        `;
  } else {
    procedures.forEach((proc, idx) => {
      const isEquipmentRequired =
        proc.equipment_required == 1 || proc.equipment_required === true;
      const procId = `proc-${proc.procedure_id || idx}`;
      const displayModeId = `display-${procId}`;
      const editModeId = `edit-${procId}`;
      const waitTime = parseInt(proc.wait_time ?? 0);
      const procTime = parseInt(proc.procedure_time ?? 0);
      const totalTime = waitTime + procTime;

      // Highlight search term in procedure name
      let displayName = proc.procedure_name || "ไม่มีชื่อ";
      if (searchTerm && searchTerm.length > 0) {
        const regex = new RegExp(`(${searchTerm})`, "gi");
        displayName = displayName.replace(
          regex,
          '<mark style="background-color: #FFF3CD; color: #856404; padding: 0 2px; border-radius: 2px;">$1</mark>'
        );
      }

      html += `
                <div id="${procId}">
                    <!-- Display Mode -->
                    <div id="${displayModeId}" style="
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        border-left: 3px solid #3f51b5;
                        background: rgba(255,255,255,0.95);
                        border-radius: 6px;
                        padding: 8px 10px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                    ">
                        <!-- ชื่อหัตถการ -->
                        <div style="flex: 1; min-width: 0;">
                            <div style="
                                font-weight: 700;
                                font-size: 12px;
                                color: #212529;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                            ">
                                <span style="
                                    background: #3f51b5;
                                    color: white;
                                    width: 22px;
                                    height: 22px;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 9px;
                                    font-weight: 700;
                                    flex-shrink: 0;
                                ">•</span>
                                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${displayName}
                                </span>
                            </div>
                        </div>

                        <!-- Stats แนวนอนกระชับ -->
                        <div style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
                            <div style="text-align: center; min-width: 38px;">
                                <div style="color: #6c757d; font-size: 8px;">รอ</div>
                                <div style="font-weight: 700; color: #009688; font-size: 12px;">${waitTime}</div>
                                <div style="color: #adb5bd; font-size: 7px;">นาที</div>
                            </div>

                            <div style="text-align: center; min-width: 38px;">
                                <div style="color: #6c757d; font-size: 8px;">ทำ</div>
                                <div style="font-weight: 700; color: #3f51b5; font-size: 12px;">${procTime}</div>
                                <div style="color: #adb5bd; font-size: 7px;">นาที</div>
                            </div>

                            <div style="text-align: center; min-width: 38px;">
                                <div style="color: #6c757d; font-size: 8px;">คน</div>
                                <div style="font-weight: 700; color: #ff5722; font-size: 12px;">${
                                  proc.staff_required ?? 0
                                }</div>
                                <div style="color: #adb5bd; font-size: 7px;">คน</div>
                            </div>

                            <div style="text-align: center; min-width: 38px;">
                                <div style="color: #6c757d; font-size: 8px;">อุป</div>
                                <div style="font-weight: 700; color: ${
                                  isEquipmentRequired ? "#f44336" : "#4caf50"
                                }; font-size: 12px;">
                                    ${isEquipmentRequired ? "ใช่" : "ไม่"}
                                </div>
                                <div style="color: #adb5bd; font-size: 7px;">กรณ์</div>
                            </div>

                            <div style="
                                background: rgba(63, 81, 181, 0.1);
                                padding: 2px 8px;
                                border-radius: 3px;
                                font-size: 9px;
                                font-weight: 600;
                                color: #3f51b5;
                                white-space: nowrap;
                            ">
                                รวม: ${totalTime}นาที
                            </div>
                        </div>

                        <!-- ปุ่มแก้ไข/ลบ -->
                        <div style="display: flex; gap: 3px; flex-shrink: 0;">
                            <button onclick="toggleProcedureEditMode('${procId}'); return false;"
                                    style="
                                        background: #F39C12;
                                        color: white;
                                        border: none;
                                        padding: 5px 8px;
                                        border-radius: 4px;
                                        font-weight: 600;
                                        cursor: pointer;
                                        font-size: 10px;
                                    "
                                    onmouseover="this.style.background='#D68910'"
                                    onmouseout="this.style.background='#F39C12'">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                            <button onclick="deleteProcedure('${procId}', '${
        proc.procedure_id
      }', '${proc.procedure_name}'); return false;"
                                    style="
                                        background: #e74c3c;
                                        color: white;
                                        border: none;
                                        padding: 5px 8px;
                                        border-radius: 4px;
                                        font-weight: 600;
                                        cursor: pointer;
                                        font-size: 10px;
                                    "
                                    onmouseover="this.style.background='#c0392b'"
                                    onmouseout="this.style.background='#e74c3c'">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Edit Mode -->
                    <div id="${editModeId}" style="
                        display: none;
                        background: #f8f9fa;
                        padding: 8px;
                        border-radius: 6px;
                        border-left: 3px solid #F39C12;
                        margin-top: 2px;
                    ">
                        <div style="
                            background: #F39C12;
                            color: white;
                            padding: 5px 8px;
                            border-radius: 4px;
                            margin-bottom: 8px;
                            font-size: 10px;
                            font-weight: 700;
                        ">
                            ✏️ แก้ไข: ${proc.procedure_name}
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px;">
                            <div>
                                <label style="font-weight: 600; color: #495057; font-size: 9px; display: block; margin-bottom: 3px;">รอ (นาที)</label>
                                <input type="number" 
                                       id="wait-time-${procId}" 
                                       value="${waitTime}" 
                                       min="0"
                                       style="width: 100%; padding: 4px; border: 1px solid #ced4da; border-radius: 3px; font-size: 10px; box-sizing: border-box;">
                            </div>
                            <div>
                                <label style="font-weight: 600; color: #495057; font-size: 9px; display: block; margin-bottom: 3px;">ทำ (นาที)</label>
                                <input type="number" 
                                       id="proc-time-${procId}" 
                                       value="${procTime}" 
                                       min="1"
                                       style="width: 100%; padding: 4px; border: 1px solid #ced4da; border-radius: 3px; font-size: 10px; box-sizing: border-box;">
                            </div>
                            <div>
                                <label style="font-weight: 600; color: #495057; font-size: 9px; display: block; margin-bottom: 3px;">คน</label>
                                <input type="number" 
                                       id="staff-req-${procId}" 
                                       value="${proc.staff_required ?? 0}" 
                                       min="0"
                                       style="width: 100%; padding: 4px; border: 1px solid #ced4da; border-radius: 3px; font-size: 10px; box-sizing: border-box;">
                            </div>
                            <div>
                                <label style="font-weight: 600; color: #495057; font-size: 9px; display: block; margin-bottom: 3px;">อุปกรณ์</label>
                                <select id="equip-req-${procId}" style="width: 100%; padding: 4px; border: 1px solid #ced4da; border-radius: 3px; font-size: 10px; box-sizing: border-box;">
                                    <option value="0" ${
                                      !isEquipmentRequired ? "selected" : ""
                                    }>ไม่ใช่</option>
                                    <option value="1" ${
                                      isEquipmentRequired ? "selected" : ""
                                    }>ใช่</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; gap: 4px;">
                            <button onclick="saveProcedureChanges('${procId}'); return false;"
                                    style="
                                        flex: 1;
                                        padding: 5px;
                                        background: #1E8449;
                                        color: white;
                                        border: none;
                                        border-radius: 3px;
                                        font-weight: 600;
                                        cursor: pointer;
                                        font-size: 10px;
                                    "
                                    onmouseover="this.style.background='#186838'"
                                    onmouseout="this.style.background='#1E8449'">
                                ✓ บันทึก
                            </button>
                            <button onclick="cancelProcedureEdit('${procId}'); return false;"
                                    style="
                                        flex: 1;
                                        padding: 5px;
                                        background: #6c757d;
                                        color: white;
                                        border: none;
                                        border-radius: 3px;
                                        font-weight: 600;
                                        cursor: pointer;
                                        font-size: 10px;
                                    "
                                    onmouseover="this.style.background='#5a6268'"
                                    onmouseout="this.style.background='#6c757d'">
                                ✕ ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            `;
    });
  }

  // อัปเดต HTML ทันที
  container.innerHTML = html;
}

function clearProcedureSearch() {
  const searchInput = document.getElementById("procedureSearchInput");
  if (searchInput) {
    searchInput.value = "";

    // ซ่อนปุ่ม clear
    const clearBtn = document.getElementById("clearSearchBtn");
    if (clearBtn) {
      clearBtn.style.display = "none";
    }

    // โฟกัสที่ search input
    searchInput.focus();

    // แสดงทั้งหมด
    showAllProcedures();
  }
}

function focusProcedureSearch() {
  const searchInput = document.getElementById("procedureSearchInput");
  if (searchInput) {
    searchInput.focus();
    searchInput.select();
  }
}

// ==================== TOGGLE EDIT MODE ====================
/**
 * Toggle procedure edit mode
 */
function toggleProcedureEditMode(procId) {
  const displayMode = document.querySelector(
    `#${procId} .procedure-display-mode`
  );
  const expanded = document.getElementById(`${procId}-expanded`);
  const editMode = document.getElementById(`edit-${procId}`);

  if (displayMode) displayMode.style.display = "none";
  if (expanded) expanded.style.display = "none";
  if (editMode) editMode.style.display = "block";
}

// ==================== CANCEL EDIT ====================

function cancelProcedureEdit(procId) {
  const displayMode = document.querySelector(
    `#${procId} .procedure-display-mode`
  );
  const editMode = document.getElementById(`edit-${procId}`);

  if (editMode) editMode.style.display = "none";
  if (displayMode) displayMode.style.display = "flex";
}

console.log("✨ Modern Professional UI loaded successfully");

// ==================== SAVE CHANGES ====================
async function saveProcedureChanges(procedureId) {
  procedureId = String(procedureId).trim();

  const numericId = procedureId.replace("proc-", "").replace("room-", "");
  const isRoomProcedure = procedureId.startsWith("room-");

  const waitTimeElem = document.getElementById(`wait-time-${procedureId}`);
  const procTimeElem = document.getElementById(`proc-time-${procedureId}`);
  const staffReqElem = document.getElementById(`staff-req-${procedureId}`);
  const equipReqElem = document.getElementById(`equip-req-${procedureId}`);

  if (!waitTimeElem || !procTimeElem || !staffReqElem || !equipReqElem) {
    console.error(`❌ Input elements not found`);
    Swal.fire("⚠️ ข้อผิดพลาด", "ไม่พบฟิลด์อินพุต", "error");
    return;
  }

  const waitTime = parseInt(waitTimeElem.value);
  const procedureTime = parseInt(procTimeElem.value);
  const staffRequired = parseInt(staffReqElem.value);
  const equipmentRequired = equipReqElem.value === "1";

  // Validation
  if (isNaN(waitTime) || waitTime < 0) {
    Swal.fire("⚠️ ข้อมูลไม่ถูกต้อง", "เวลารอต้องไม่ติดลบ", "warning");
    waitTimeElem.focus();
    return;
  }

  if (isNaN(procedureTime) || procedureTime < 1) {
    Swal.fire("⚠️ ข้อมูลไม่ถูกต้อง", "เวลาทำต้องมากกว่า 0 นาที", "warning");
    procTimeElem.focus();
    return;
  }

  try {
    let endpoint, payload;

    if (isRoomProcedure) {
      endpoint = `${API_BASE_URL}/update_room_procedure.php`;
      payload = {
        room_procedure_id: parseInt(numericId),
        wait_time: waitTime,
        procedure_time: procedureTime,
        staff_required: staffRequired,
        equipment_required: equipmentRequired ? 1 : 0,
      };
    } else {
      endpoint = `${API_BASE_URL}/update_procedure_details.php`;
      payload = {
        procedure_id: parseInt(numericId),
        station_id: currentStationId,
        wait_time: waitTime,
        procedure_time: procedureTime,
        staff_required: staffRequired,
        equipment_required: equipmentRequired ? 1 : 0,
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      Swal.fire({
        title: "บันทึกสำเร็จ! ✅",
        text: "อัปเดตข้อมูลหัตถการเรียบร้อย",
        icon: "success",
        confirmButtonColor: "#1E8449",
      });

      cancelProcedureEdit(procedureId);

      // Reload data
      if (currentStationId) {
        await loadProceduresForStation(currentStationId);
      }

      if (currentRoomId) {
        setTimeout(() => {
          openRoomDetail(currentRoomId);
        }, 500);
      }
    } else {
      Swal.fire(
        "❌ เกิดข้อผิดพลาด",
        result.message || "ไม่สามารถบันทึกข้อมูล",
        "error"
      );
    }
  } catch (error) {
    console.error("Error:", error);
    Swal.fire("❌ เกิดข้อผิดพลาด", error.message, "error");
  }
}

// ==================== DELETE PROCEDURE ====================
async function deleteProcedure(procedureId, procedureDbId, procedureName) {
  const confirm = await Swal.fire({
    title: "ยืนยันการลบ",
    text: `คุณต้องการลบหัตถการ "${procedureName}" หรือไม่?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e74c3c",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "ลบ",
    cancelButtonText: "ยกเลิก",
  });

  if (!confirm.isConfirmed) return;

  try {
    const endpoint = `${API_BASE_URL}/delete_procedure.php`;
    const payload = {
      procedure_id: parseInt(procedureDbId),
      station_id: currentStationId,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      Swal.fire({
        title: "ลบสำเร็จ! ✅",
        text: "หัตถการได้ถูกลบแล้ว",
        icon: "success",
        confirmButtonColor: "#1E8449",
      });

      if (currentStationId) {
        await loadProceduresForStation(currentStationId);
      }
    } else {
      Swal.fire(
        "❌ เกิดข้อผิดพลาด",
        result.message || "ไม่สามารถลบข้อมูล",
        "error"
      );
    }
  } catch (error) {
    console.error("Error:", error);
    Swal.fire("❌ เกิดข้อผิดพลาด", error.message, "error");
  }
}

// ==================== LOAD PROCEDURES ====================
async function loadProceduresForStation(stationId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/get_station_procedures.php?station_id=${stationId}`
    );
    const result = await response.json();

    if (result.success) {
      displayStationProcedures(result.data.procedures);
    } else {
      console.error("Failed to load procedures:", result.message);
      displayStationProcedures([]);
    }
  } catch (error) {
    console.error("Error loading procedures:", error);
    displayStationProcedures([]);
  }
}
/**
 * Display Patients in Station
 */
function displayStationPatients(patients) {
  let html = '<div style="display: grid; gap: 10px;">';

  patients.forEach((p) => {
    const overdueClass = p.is_overdue
      ? "background: rgba(192, 57, 43, 0.1); border-left: 4px solid #C0392B;"
      : "background: rgba(255,255,255,0.5); border-left: 4px solid #1E8449;";
    const overdueIcon = p.is_overdue ? "🔴" : "🟢";

    html += `
            <div style="${overdueClass} padding: 12px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <div style="font-weight: 600;">${overdueIcon} ${
      p.patient_name
    }</div>
                        <div style="font-size: 12px; color: var(--text-light); margin-top: 5px;">
                            HN: ${p.hn} | ${p.procedure_name || "N/A"}<br>
                            ${
                              p.room_name ? `ห้อง: ${p.room_name}` : "รอห้อง"
                            }<br>
                            สถานะ: ${p.status}
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 11px;">
                        <div>มาถึง: ${new Date(
                          p.arrival_time
                        ).toLocaleTimeString("th-TH")}</div>
                        <div style="font-weight: 600; margin-top: 5px; ${
                          p.is_overdue ? "color: #C0392B;" : ""
                        }">
                            รอ: ${p.wait_duration} นาที
                        </div>
                        ${
                          p.is_overdue
                            ? '<div style="color: #C0392B; font-weight: 600;">⚠️ เกิดเวลา</div>'
                            : ""
                        }
                    </div>
                </div>
            </div>
        `;
  });

  if (patients.length === 0) {
    html +=
      '<div style="text-align: center; padding: 20px; color: var(--text-light);">ไม่มีคนไข้</div>';
  }

  html += "</div>";
  document.getElementById("stationPatientsContent").innerHTML = html;
}

/**
 * Display Station Settings (for Simple Station)
 */
// function displayStationSettings(station) {
//   const settingsDiv = document.getElementById("simpleStationSettings");

//   // Only show settings for simple station
//   if (station.station_type !== "simple") {
//     settingsDiv.innerHTML =
//       '<p style="color: var(--text-light);">การตั้งค่านี้ใช้ได้เฉพาะกับ Simple Station เท่านั้น</p>';
//     return;
//   }

//   settingsDiv.innerHTML = `
//         <h3 style="margin-bottom: 20px;">⚙️ การตั้งค่าเวลาจำลอง (Simulation Time Settings)</h3>
//         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
//             <div class="form-group">
//                 <label for="wait_time_${station.station_id}" class="form-label">เวลารอ (นาที) *</label>
//                 <input type="number" id="wait_time_${station.station_id}" class="form-control" 
//                        value="${station.default_wait_time}" min="0" 
//                        onchange="updateStationTime(${station.station_id}, 'default_wait_time', this.value)">
//                 <small style="color: var(--text-light);">เวลารอคาดการณ์</small>
//             </div>
//             <div class="form-group">
//                 <label for="service_time_${station.station_id}" class="form-label">เวลาทำงาน (นาที) *</label>
//                 <input type="number" id="service_time_${station.station_id}" class="form-control" 
//                        value="${station.default_service_time}" min="1" 
//                        onchange="updateStationTime(${station.station_id}, 'default_service_time', this.value)">
//                 <small style="color: var(--text-light);">เวลาให้บริการ</small>
//             </div>
//         </div>
//     `;
// }

/**
 * Update Station Time (default_wait_time or default_service_time)
 */
async function updateStationTime(stationId, field, value) {
  // Basic validation
  if (field === "default_service_time" && value < 1) {
    Swal.fire("ข้อผิดพลาด", "เวลาทำงานต้องมากกว่า 0 นาที", "error");
    // Revert the input value to the default value on failure
    document.getElementById(`service_time_${stationId}`).value =
      document.getElementById(`service_time_${stationId}`).defaultValue;
    return;
  }
  if (field === "default_wait_time" && value < 0) {
    Swal.fire("ข้อผิดพลาด", "เวลารอต้องไม่เป็นค่าลบ", "error");
    // Revert the input value to the default value on failure
    document.getElementById(`wait_time_${stationId}`).value =
      document.getElementById(`wait_time_${stationId}`).defaultValue;
    return;
  }

  const payload = {
    station_id: stationId,
    [field]: parseInt(value),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/update_station_time.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      Swal.fire("สำเร็จ", "อัปเดตเวลาของ Station เรียบร้อยแล้ว", "success");
      // Update the default value to reflect the change
      if (field === "default_wait_time") {
        document.getElementById(`wait_time_${stationId}`).defaultValue = value;
      } else if (field === "default_service_time") {
        document.getElementById(`service_time_${stationId}`).defaultValue =
          value;
      }
    } else {
      Swal.fire(
        "ข้อผิดพลาด",
        "ไม่สามารถอัปเดตเวลาของ Station ได้: " + result.message,
        "error"
      );
      // Revert the input value to the default value on failure
      if (field === "default_wait_time") {
        document.getElementById(`wait_time_${stationId}`).value =
          document.getElementById(`wait_time_${stationId}`).defaultValue;
      } else if (field === "default_service_time") {
        document.getElementById(`service_time_${stationId}`).value =
          document.getElementById(`service_time_${stationId}`).defaultValue;
      }
    }
  } catch (error) {
    console.error("Error updating station time:", error);
    Swal.fire("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    // Revert the input value to the default value on failure
    if (field === "default_wait_time") {
      document.getElementById(`wait_time_${stationId}`).value =
        document.getElementById(`wait_time_${stationId}`).defaultValue;
    } else if (field === "default_service_time") {
      document.getElementById(`service_time_${stationId}`).value =
        document.getElementById(`service_time_${stationId}`).defaultValue;
    }
  }
}

/**
 * Switch Station Detail Tab
 */
function switchStationTab(tabName) {
  document.querySelectorAll(".station-tab-content").forEach((tab) => {
    tab.style.display = "none";
  });
  document.querySelectorAll(".station-tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.getElementById(`station${tabName}Content`).style.display = "block";
  document
    .querySelector(`[onclick="switchStationTab('${tabName}')"]`)
    .classList.add("active");
}

/**
 * Close Station Detail Modal
 */
function closeStationDetail() {
  document.getElementById("stationDetailModal").style.display = "none";
  currentStationId = null;

  // ✅ เพิ่มบรรทัดนี้ - หยุด timer เมื่อปิด
  cleanupStatusAutoUpdate();
  stopAutoStaffSystem();
}

// ===== ROOM DETAIL FUNCTIONS =====

/**
 * Open Room Detail Modal
 */
async function openRoomDetail(roomId) {
  currentRoomId = roomId;

  try {
    const today = new Date().toISOString().split("T")[0];
    const apiUrl =
      getApiUrl("get_room_detail.php") +
      `?room_id=${roomId}&work_date=${today}&t=${Date.now()}`;

    const response = await fetch(apiUrl);
    const result = await response.json();

    if (result.success) {
      const room = result.data.room;
      const staff = result.data.staff || [];
      const doctors = result.data.doctors || [];

      // ✅ ตรวจสอบเวลาปัจจุบัน
      const now = new Date();
      const currentTime =
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0");

      // ✅ ตรวจสอบว่าแพทย์/พนักงานเข้างานแล้วหรือยัง
      let hasStaffOnDuty = false;
      let hasDoctoronDuty = false;

      // ✅ ตรวจสอบพนักงาน
      staff.forEach((s) => {
        const workStart = s.work_start_time
          ? s.work_start_time.substring(0, 5)
          : "08:00";
        const workEnd = s.work_end_time
          ? s.work_end_time.substring(0, 5)
          : "17:00";

        if (currentTime >= workStart && currentTime < workEnd) {
          hasStaffOnDuty = true;
        }
      });

      // ✅ ตรวจสอบแพทย์
      doctors.forEach((d) => {
        const workStart = d.work_start_time
          ? d.work_start_time.substring(0, 5)
          : "08:00";
        const workEnd = d.work_end_time
          ? d.work_end_time.substring(0, 5)
          : "17:00";

        if (currentTime >= workStart && currentTime < workEnd) {
          hasDoctoronDuty = true;
        }
      });

      // ❌ OLD LOGIC (ต้องมี AND)
      // const isRoomActive =
      //   hasStaff &&
      //   hasDoctor &&
      //   hasStaffOnDuty &&
      //   hasDoctoronDuty;

      // ✅ NEW LOGIC (มี OR - อย่างน้อยหนึ่งคน)
      const isRoomActive = hasStaffOnDuty || hasDoctoronDuty;

      const hasStaff = staff.length > 0;
      const hasDoctor = doctors.length > 0;

      console.log(`📊 ตรวจสอบห้อง ${room.room_name}:`, {
        hasStaff,
        hasDoctor,
        hasStaffOnDuty,
        hasDoctoronDuty,
        currentTime,
        isRoomActive,
      });

      if (!isRoomActive) {
        // ✅ ห้องปิดใช้งาน
        let reason = [];
        if (!hasStaffOnDuty && hasStaff) reason.push("พนักงานยังไม่เข้างาน");
        if (!hasDoctoronDuty && hasDoctor) reason.push("แพทย์ยังไม่เข้างาน");
        if (!hasStaff && !hasDoctor) reason.push("ไม่มีพนักงานและแพทย์");

        Swal.fire({
          title: "🔒 ห้องปิดใช้งาน",
          html: `
            <div style="text-align: left; padding: 20px;">
              <p><strong>${room.room_name}</strong></p>
              <p style="color: #adb5bd; font-size: 13px; margin: 10px 0;">
                ⏰ เวลาปัจจุบัน: ${currentTime}
              </p>
              <div style="background: #fff3cd; padding: 12px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 5px 0; font-size: 13px;">
                  ${reason.map((r) => `✗ ${r}`).join("<br>")}
                </p>
              </div>
              <p style="color: #adb5bd; font-size: 12px; margin-top: 15px;">
                💡 ห้องจะเปิดเมื่อ:
              </p>
              <ul style="color: #6c757d; font-size: 12px; margin: 10px 0;">
                <li>✓ มีแพทย์ หรือ พนักงาน (อย่างน้อยหนึ่งคน)</li>
                <li>✓ แพทย์/พนักงาน เข้างานแล้ว</li>
              </ul>
            </div>
          `,
          icon: "warning",
          confirmButtonColor: "#D68910",
          confirmButtonText: "ตกลง",
        });

        return;
      }

      // ✅ ห้องเปิดใช้งาน - แสดง modal ตามปกติ
      displayRoomDetail(result.data);

      const roomModal = document.getElementById("roomDetailModal");
      if (roomModal) {
        roomModal.style.display = "block";
      }
    } else {
      Swal.fire({
        title: "❌ ข้อผิดพลาด",
        text: result.message,
        icon: "error",
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      title: "❌ ข้อผิดพลาด",
      text: error.message,
      icon: "error",
    });
  }
}
/**
 * Modern Professional UI Styles
 */
const modernStyles = document.createElement("style");
modernStyles.textContent = `
    :root {
        --primary-color: #1e3a8a;
        --primary-light: #3b82f6;
        --primary-dark: #1e40af;
        --secondary-color: #64748b;
        --success-color: #059669;
        --danger-color: #dc2626;
        --warning-color: #d97706;
        --background: #f8fafc;
        --surface: #ffffff;
        --border: #e2e8f0;
        --text-primary: #0f172a;
        --text-secondary: #475569;
        --text-muted: #94a3b8;
    }

    /* Modal Improvements */
    .modal-content {
        background: var(--surface);
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        border: 1px solid var(--border);
    }

    /* Header Section */
    #roomDetailTitle {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: -0.025em;
    }

    #roomDetailSubtitle {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary);
        margin-top: 4px;
    }

    /* Section Headers */
    .room-section h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 8px;
    }

    /* Modern Button Styles */
    .btn {
        font-family: inherit;
        font-weight: 600;
        font-size: 14px;
        padding: 10px 20px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }

    .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }

    .btn:active {
        transform: translateY(0);
    }

    .btn-success {
        background: var(--success-color);
        color: white;
    }

    .btn-success:hover {
        background: #047857;
    }

    .btn-primary {
        background: var(--primary-color);
        color: white;
    }

    .btn-primary:hover {
        background: var(--primary-dark);
    }

    .btn-danger {
        background: var(--danger-color);
        color: white;
        padding: 6px 12px;
        font-size: 13px;
    }

    .btn-danger:hover {
        background: #b91c1c;
    }

    /* Card Styles */
    .room-card, .staff-card, .doctor-card, .equipment-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 16px;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
    }

    .room-card:hover {
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        border-color: var(--primary-light);
    }

    /* Empty State */
    .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: var(--text-muted);
        background: var(--background);
        border-radius: 12px;
        border: 2px dashed var(--border);
    }

    .empty-state i {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
    }

    /* Status Badge */
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
    }

    .status-active {
        background: #dcfce7;
        color: #166534;
    }

    .status-inactive {
        background: #f1f5f9;
        color: #475569;
    }

    /* Toggle Switch - Modern Design */
    .switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
    }

    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #cbd5e1;
        transition: 0.3s;
        border-radius: 24px;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }

    input:checked + .slider {
        background-color: var(--success-color);
    }

    input:checked + .slider:before {
        transform: translateX(20px);
    }

    input:disabled + .slider {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Procedure Toggle Button */
    #procedureToggleBtn {
        background: var(--primary-color);
        color: white;
        width: 100%;
        padding: 14px 20px;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }

    #procedureToggleBtn:hover {
        background: var(--primary-dark);
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    /* Procedure Card - Professional Design */
    .procedure-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
    }

    .procedure-card:hover {
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        border-color: var(--primary-light);
    }

    .procedure-display-mode {
        padding: 16px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
    }

    .procedure-number-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: var(--primary-color);
        color: white;
        border-radius: 8px;
        font-weight: 700;
        font-size: 14px;
        flex-shrink: 0;
    }

    .procedure-title {
        flex: 1;
        font-weight: 600;
        font-size: 15px;
        color: var(--text-primary);
        min-width: 0;
    }

    .procedure-time-badge {
        background: var(--background);
        color: var(--text-primary);
        padding: 6px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        flex-shrink: 0;
        border: 1px solid var(--border);
    }

    .procedure-stats {
        font-size: 12px;
        color: var(--text-secondary);
        display: flex;
        gap: 12px;
        margin-top: 6px;
    }

    /* Warning Alert */
    .warning-alert {
        background: #fef3c7;
        border-left: 4px solid var(--warning-color);
        padding: 16px;
        margin-bottom: 20px;
        border-radius: 8px;
    }

    .warning-alert-title {
        font-weight: 600;
        color: #92400e;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    /* Patient Card */
    .patient-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-left: 4px solid var(--success-color);
        padding: 16px;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    .patient-card.overdue {
        border-left-color: var(--danger-color);
        background: #fef2f2;
    }

    .patient-card:hover {
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    /* Responsive */
    @media (max-width: 768px) {
        .btn {
            font-size: 13px;
            padding: 8px 16px;
        }

        .procedure-display-mode {
            flex-direction: column;
            align-items: flex-start;
        }

        .procedure-time-badge {
            align-self: flex-end;
        }
    }
`;
document.head.appendChild(modernStyles);
/**
 * ✅ CSS Styling สำหรับห้องปิดใช้งาน
 */
const disabledRoomStyle = document.createElement("style");
disabledRoomStyle.textContent = `
    .room-card {
        background: white;
        border: 1px solid #e9ecef;
        border-left: 4px solid;
        border-radius: 12px;
        padding: 16px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        position: relative;
        overflow: hidden;
    }

    .room-card:not([style*="opacity: 0.6"]):hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        border-color: #0056B3;
    }

    /* ✅ ห้องที่ปิดใช้งาน */
    .room-card[style*="opacity: 0.6"] {
        background: rgba(200, 200, 200, 0.05);
        cursor: not-allowed !important;
    }

    .room-card[style*="opacity: 0.6"]:hover {
        transform: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    @media (max-width: 768px) {
        .room-card {
            padding: 12px;
        }
    }
`;
document.head.appendChild(disabledRoomStyle);

/**
 * Display Room Detail
 */
async function displayRoomDetail(data) {
  try {
    // ✅ ตรวจสอบ input
    if (!data || !data.room) {
      throw new Error("ข้อมูลห้องไม่ครบ");
    }

    const room = data.room;

    console.log("📊 แสดงรายละเอียดห้อง:", room.room_name);

    // ✅ ตั้งค่า Header
    const titleEl = document.getElementById("roomDetailTitle");
    const subtitleEl = document.getElementById("roomDetailSubtitle");

    if (!titleEl || !subtitleEl) {
      console.error("❌ Header elements ไม่พบ");
      throw new Error("UI elements ไม่พบ");
    }

    titleEl.textContent = room.room_name || "ไม่มีชื่อ";
    subtitleEl.textContent = `${room.station_name || "N/A"} (${
      room.station_code || "N/A"
    }) | Floor ${room.floor || "N/A"}`;

    // ✅ แสดงข้อมูลแต่ละส่วน
    // 1. พนักงาน
    const staffSection = document.getElementById("roomStaffSection");
    if (staffSection) {
      displayRoomStaff(data.staff || [], (data.staff || []).length);
      console.log(`✅ แสดงพนักงาน: ${data.staff?.length || 0} คน`);
    }

    // 2. แพทย์
    const doctorSection = document.getElementById("roomDoctorsSection");
    if (doctorSection) {
      displayRoomDoctors(data.doctors || []);
      console.log(`✅ แสดงแพทย์: ${data.doctors?.length || 0} คน`);
    }

    // 3. เครื่องมือ
    const equipmentSection = document.getElementById("roomEquipmentSection");
    if (equipmentSection) {
      displayRoomEquipment(data.equipment || [], (data.staff || []).length);
      console.log(`✅ แสดงเครื่องมือ: ${data.equipment?.length || 0} รายการ`);
    }

    // 4. เตือน equipment
    if (data.equipment_warnings && data.equipment_warnings.length > 0) {
      displayEquipmentWarnings(data.equipment_warnings);
      console.log(`⚠️ เตือน: ${data.equipment_warnings.length} รายการ`);
    }

    // 5. หัตถการ
    const procedureSection = document.getElementById("roomProceduresSection");
    if (procedureSection) {
      displayRoomProcedures(data.procedures || []);
      console.log(`✅ แสดงหัตถการ: ${data.procedures?.length || 0} รายการ`);
    }

    // 6. คนไข้
    const patientSection = document.getElementById("roomPatientsSection");
    if (patientSection) {
      displayRoomPatients(data.patients || []);
      console.log(`✅ แสดงคนไข้: ${data.patients?.length || 0} คน`);
    }

    console.log("✅ displayRoomDetail สำเร็จ");
  } catch (error) {
    console.error("❌ Error in displayRoomDetail:", error);

    // ✅ แสดง fallback UI
    Swal.fire({
      title: "⚠️ ข้อมูลไม่ครบ",
      text: error.message,
      icon: "warning",
      confirmButtonColor: "#D68910",
    });
  }
}

/**
 * Display Room Staff (Staff currently IN the room)
 */
function displayRoomStaff(staff, staffCount) {
  let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">
                <span style="color: var(--text-secondary);">👥</span> พนักงาน 
                <span style="color: var(--text-muted); font-weight: 500;">(${staffCount} คน)</span>
            </h3>
            <button class="btn btn-success" onclick="openAddStaffModal(${currentRoomId})">
                <i class="fas fa-plus"></i> เพิ่มพนักงาน
            </button>
        </div>
        <div style="display: grid; gap: 12px;">
    `;

  staff.forEach((s) => {
    const formatTime = (time) => {
      if (!time) return "-";
      return time.substring(0, 5);
    };

    const workStart = formatTime(s.work_start_time);
    const workEnd = formatTime(s.work_end_time);
    const breakStart = formatTime(s.break_start_time);
    const breakEnd = formatTime(s.break_end_time);

    html += `
            <div class="staff-card" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-left: 3px solid var(--primary-color);
            ">
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 15px; color: var(--text-primary); margin-bottom: 6px;">
                        ${s.staff_name}
                    </div>
                    <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                        <div>🕐 ${workStart} - ${workEnd}</div>
                        ${
                          breakStart !== "-"
                            ? `<div>☕ ${breakStart} - ${breakEnd}</div>`
                            : ""
                        }
                    </div>
                </div>
                <!-- ✅ ใช้ removeRoomStaff เฉพาะในห้องที่เปิดอยู่ -->
                <button class="btn btn-danger" onclick="removeRoomStaff(${
                  s.station_staff_id
                }, '${s.staff_name}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
  });

  if (staff.length === 0) {
    html += `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <div style="font-size: 15px; font-weight: 500; margin-bottom: 4px;">ไม่มีพนักงานในห้องนี้</div>
                <div style="font-size: 13px;">คลิกปุ่ม "เพิ่มพนักงาน" เพื่อเพิ่มพนักงาน</div>
            </div>
        `;
  }

  html += "</div>";
  document.getElementById("roomStaffSection").innerHTML = html;
}

/**
 * Display Room Equipment - Modern Design
 */
function displayRoomEquipment(equipment, staffCount) {
  let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">
                <span style="color: var(--text-secondary);">🔧</span> เครื่องมือ 
                <span style="color: var(--text-muted); font-weight: 500;">(${equipment.length})</span>
            </h3>
            <button class="btn btn-success" onclick="openAddEquipmentModal()">
                <i class="fas fa-plus"></i> เพิ่มเครื่องมือ
            </button>
        </div>
        <div style="display: grid; gap: 12px;">
    `;

  equipment.forEach((eq) => {
    const canToggle = !eq.require_staff || staffCount > 0;
    const toggleDisabled = !canToggle ? "disabled" : "";
    const warningMsg =
      eq.require_staff && staffCount === 0
        ? '<div style="font-size: 12px; color: var(--danger-color); margin-top: 6px; display: flex; align-items: center; gap: 6px;"><i class="fas fa-exclamation-circle"></i> ต้องมีพนักงานถึงจะเปิดได้</div>'
        : "";

    html += `
            <div class="equipment-card" style="border-left: 3px solid ${
              eq.is_active ? "var(--success-color)" : "var(--secondary-color)"
            };">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 15px; color: var(--text-primary); margin-bottom: 6px;">
                            ${eq.equipment_name}
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary);">
                            ${eq.equipment_type || "N/A"} 
                            ${eq.require_staff ? "• ต้องใช้พนักงาน" : ""}
                        </div>
                        ${warningMsg}
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
                        <button class="btn btn-danger" onclick="removeEquipment(${
                          eq.equipment_id
                        }, '${eq.equipment_name}')">
                            <i class="fas fa-trash"></i>
                        </button>
                        <label class="switch">
                            <input type="checkbox" ${
                              eq.is_active ? "checked" : ""
                            } ${toggleDisabled} 
                                   onchange="toggleEquipment(${
                                     eq.equipment_id
                                   }, this.checked, ${staffCount})">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `;
  });

  if (equipment.length === 0) {
    html += `
            <div class="empty-state">
                <i class="fas fa-tools"></i>
                <div style="font-size: 15px; font-weight: 500; margin-bottom: 4px;">ไม่มีเครื่องมือ</div>
                <div style="font-size: 13px;">คลิกปุ่ม "เพิ่มเครื่องมือ" เพื่อเพิ่มเครื่องมือ</div>
            </div>
        `;
  }

  html += "</div>";
  document.getElementById("roomEquipmentSection").innerHTML = html;
}
/**
 * Display Equipment Warnings
 */
function displayEquipmentWarnings(warnings) {
  if (warnings.length === 0) return;

  let warningHtml = `
        <div style="
            background: rgba(255, 193, 7, 0.1); 
            border-left: 4px solid #FFC107; 
            padding: 15px; 
            margin-bottom: 15px; 
            border-radius: 5px;
        ">
            <div style="
                font-weight: bold; 
                color: #F57F17; 
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <i class="fas fa-exclamation-triangle"></i>
                เตือน: เครื่องมือที่ต้องการพนักงาน
            </div>
    `;

  warnings.forEach((w) => {
    warningHtml += `
            <div style="color: #F57F17; margin: 5px 0; padding-left: 10px;">
                • ${w.equipment_name}: ${w.warning}
            </div>
        `;
  });

  warningHtml += "</div>";

  // ✅ แทรก warning ที่ด้านบนของ modal
  const warningContainer = document.querySelector("[data-warning-container]");
  if (warningContainer) {
    warningContainer.innerHTML = warningHtml;
  } else {
    const newDiv = document.createElement("div");
    newDiv.setAttribute("data-warning-container", "true");
    newDiv.innerHTML = warningHtml;
    const modalContent = document.querySelector(".modal-content");
    if (modalContent) {
      modalContent.insertBefore(newDiv, modalContent.firstChild);
    }
  }
}
/**
 * Display Room Doctors - Modern Design
 */
function displayRoomDoctors(doctors) {
  let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">
                <span style="color: var(--text-secondary);">👨‍⚕️</span> แพทย์ 
                <span style="color: var(--text-muted); font-weight: 500;">(${doctors.length} คน)</span>
            </h3>
            <button class="btn btn-success" onclick="openAssignDoctorModal(${currentRoomId})">
                <i class="fas fa-plus"></i> เพิ่มแพทย์
            </button>
        </div>
        <div style="display: grid; gap: 12px;">
    `;

  doctors.forEach((d) => {
    const formatTime = (time) => {
      if (!time) return "-";
      return time.substring(0, 5);
    };

    const workStart = formatTime(d.work_start_time);
    const workEnd = formatTime(d.work_end_time);
    const breakStart = formatTime(d.break_start_time);
    const breakEnd = formatTime(d.break_end_time);

    html += `
            <div class="doctor-card" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-left: 3px solid var(--primary-color);
            ">
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 15px; color: var(--text-primary); margin-bottom: 6px;">
                        ${d.doctor_name}
                    </div>
                    <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                        <div>🕐 ${workStart} - ${workEnd}</div>
                        ${
                          breakStart !== "-"
                            ? `<div>☕ ${breakStart} - ${breakEnd}</div>`
                            : ""
                        }
                    </div>
                </div>
                <button class="btn btn-danger" onclick="removeRoomDoctor(${
                  d.station_doctor_id
                }, '${d.doctor_name}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
  });
  if (doctors.length === 0) {
    html += `
            <div class="empty-state">
                <i class="fas fa-user-md"></i>
                <div style="font-size: 15px; font-weight: 500; margin-bottom: 4px;">ไม่มีแพทย์ในห้องนี้</div>
                <div style="font-size: 13px;">คลิกปุ่ม "เพิ่มแพทย์" เพื่อเพิ่มแพทย์</div>
            </div>
        `;
  }

  html += "</div>";
  document.getElementById("roomDoctorsSection").innerHTML = html;
}
async function openRoomProcedureSettings(roomId) {
  currentRoomId = roomId;
  const modal = document.getElementById("roomProcedureSettingsModal");
  const title = document.getElementById("roomProcedureSettingsTitle");
  const procedureList = document.getElementById("roomProcedureList");

  title.textContent = `ตั้งค่าหัตถการสำหรับห้อง ${roomId}`;
  procedureList.innerHTML = '<div class="loading-spinner"></div>';
  modal.style.display = "block";

  try {
    // 1. ดึงข้อมูลหัตถการทั้งหมดที่เป็นไปได้สำหรับ station นี้
    const stationId = await getStationIdForRoom(roomId);
    if (!stationId) throw new Error("ไม่พบ Station ID สำหรับห้องนี้");

    // API get_station_procedures.php ควรจะดึงหัตถการทั้งหมดที่เกี่ยวข้องกับ station นี้
    const allProceduresResponse = await fetch(
      `${API_BASE_URL}/get_station_procedures.php?station_id=${stationId}`
    );
    const allProceduresResult = await allProceduresResponse.json();
    if (!allProceduresResult.success)
      throw new Error(allProceduresResult.message);
    const allProcedures = allProceduresResult.data.procedures;

    // 2. ดึงข้อมูลหัตถการที่ห้องนี้เลือกไว้แล้ว
    const roomProceduresResponse = await fetch(
      `${API_BASE_URL}/get_room_detail.php?room_id=${roomId}`
    );
    const roomProceduresResult = await roomProceduresResponse.json();
    if (!roomProceduresResult.success)
      throw new Error(roomProceduresResult.message);
    const selectedProcedureIds = new Set(
      roomProceduresResult.data.procedures.map((p) => p.procedure_id)
    );

    // 3. สร้าง UI
    let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-left: 2.5rem;">
<div class="form-check">
	                    <input class="form-check-input" type="checkbox" id="selectAllProcedures" onchange="toggleAllProcedures(this)" ${
                        allProcedures.length > 0 &&
                        allProcedures.length === selectedProcedureIds.size
                          ? "checked"
                          : ""
                      }>
	                    <label class="form-check-label" for="selectAllProcedures" style="font-weight: bold;">
	                        สามารถทำหัตถการทั้งหมด
	                    </label>
	                </div>
	                <button class="btn btn-sm btn-primary" onclick="toggleAllProcedures({checked: true})" style="padding: 5px 10px; font-size: 12px;">
	                    <i class="fas fa-check-double"></i> เลือกทั้งหมด
	                </button>
	            </div>
               <input class="form-check-input" type="checkbox" id="selectAllProcedures" onchange="toggleAllProcedures(this)" ${
                 allProcedures.length > 0 &&
                 allProcedures.length === selectedProcedureIds.size
                   ? "checked"
                   : ""
               }>
                <label class="form-check-label" for="selectAllProcedures" style="font-weight: bold;">
                    สามารถทำหัตถการทั้งหมด
                </label>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
        `;

    if (allProcedures.length > 0) {
      allProcedures.forEach((proc) => {
        const isChecked = selectedProcedureIds.has(proc.procedure_id);
        html += `
                    <div class="form-check">
                        <input class="form-check-input procedure-checkbox" type="checkbox" value="${
                          proc.procedure_id
                        }" id="proc_${proc.procedure_id}" ${
          isChecked ? "checked" : ""
        } data-name="${proc.procedure_name}">
                        <label class="form-check-label" for="proc_${
                          proc.procedure_id
                        }">
                            ${
                              proc.procedure_name ||
                              `Procedure ID: ${proc.procedure_id}`
                            }
                        </label>
                    </div>
                `;
      });
    } else {
      html +=
        '<p style="color: var(--text-light);">ไม่พบหัตถการที่สามารถกำหนดได้สำหรับ Station นี้</p>';
    }

    html += "</div>";
    procedureList.innerHTML = html;
  } catch (error) {
    console.error("Error opening room procedure settings:", error);
    procedureList.innerHTML = `<div class="error-message">❌ เกิดข้อผิดพลาด: ${error.message}</div>`;
  }
}

/**
 * Toggle procedure collapse/expand
 */
function toggleAllProcedures() {
  const container = document.getElementById("proceduresContainer");
  const icon = document.getElementById("procedureToggleIcon");
  const text = document.getElementById("procedureToggleText");

  if (!container) return;

  const isCollapsed =
    container.style.maxHeight === "0px" || !container.style.maxHeight;

  if (isCollapsed) {
    container.style.maxHeight = container.scrollHeight + "px";
    container.style.opacity = "1";
    icon.style.transform = "rotate(180deg)";
    text.textContent = "ซ่อนหัตถการ";
    setTimeout(() => {
      container.style.maxHeight = "none";
    }, 400);
  } else {
    container.style.maxHeight = container.scrollHeight + "px";
    void container.offsetHeight;
    container.style.maxHeight = "0px";
    container.style.opacity = "0";
    icon.style.transform = "rotate(0deg)";
    text.textContent = "แสดงหัตถการ";
  }
}

/**
 * Save Room Procedure Settings
 */

async function saveRoomProcedureSettings() {
  const selectedProcedures = [];
  document
    .querySelectorAll(".procedure-checkbox:checked")
    .forEach((checkbox) => {
      selectedProcedures.push({
        procedure_id: checkbox.value,
        procedure_name: checkbox.dataset.name,
      });
    });

  try {
    const response = await fetch(`${API_BASE_URL}/manage_room_procedures.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: currentRoomId,
        procedures: selectedProcedures,
      }),
    });

    const result = await response.json();

    if (result.success) {
      alert("✅ บันทึกการตั้งค่าหัตถการสำเร็จ");
      closeRoomProcedureSettings();
      // Refresh room detail view if it's open
      openRoomDetail(currentRoomId);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error saving room procedure settings:", error);
    alert(`❌ เกิดข้อผิดพลาดในการบันทึก: ${error.message}`);
  }
}

/**
 * Close Room Procedure Settings Modal
 */
function closeRoomProcedureSettings() {
  document.getElementById("roomProcedureSettingsModal").style.display = "none";
}

// Helper function to get station_id for a room_id
async function getStationIdForRoom(roomId) {
  // This is a simplified helper. In a real app, you might have this data already available.
  try {
    const response = await fetch(
      `${API_BASE_URL}/get_room_detail.php?room_id=${roomId}`
    );
    const result = await response.json();
    if (result.success) {
      return result.data.room.station_id;
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}
function addProcedureAnimations() {
  if (document.getElementById("procedure-animations")) return;

  const style = document.createElement("style");
  style.id = "procedure-animations";
  style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                max-height: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                max-height: 1000px;
                transform: translateY(0);
            }
        }

        @keyframes slideUp {
            from {
                opacity: 1;
                max-height: 1000px;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                max-height: 0;
                transform: translateY(-10px);
            }
        }

        #proceduresContainer {
            transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease;
        }

        #procedureToggleIcon {
            transition: transform 0.3s ease;
        }

        #procedureToggleBtn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(63, 81, 181, 0.4);
        }
    `;
  document.head.appendChild(style);
}
/**
 * Display Room Procedures - Modern Design
 */
function displayRoomProcedures(procedures) {
  const container = document.getElementById("roomProceduresSection");

  if (!procedures || procedures.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-syringe"></i>
                <div style="font-size: 15px; font-weight: 500; margin-bottom: 4px;">ไม่มีข้อมูลหัตถการในห้องนี้</div>
                <button class="btn btn-success" onclick="openAssignProcedureModal(${currentRoomId})" 
                        style="margin-top: 16px;">
                    <i class="fas fa-plus"></i> เพิ่มหัตถการ
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">
                <span style="color: var(--text-secondary);">💉</span> หัตถการ 
                <span style="color: var(--text-muted); font-weight: 500;">(${procedures.length})</span>
            </h3>
            <button class="btn btn-success" onclick="openAssignProcedureModal(${currentRoomId})">
                <i class="fas fa-plus"></i> เพิ่มหัตถการ
            </button>
        </div>
        <div style="margin-bottom: 16px;">
            <button id="procedureToggleBtn" onclick="toggleAllProcedures()">
                <span style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-chevron-down" id="procedureToggleIcon" style="transition: transform 0.3s;"></i> 
                    <span id="procedureToggleText">แสดงหัตถการ</span>
                </span>
                <i class="fas fa-list"></i>
            </button>
        </div>

        <div id="proceduresContainer" style="
            display: grid;
            gap: 12px;
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
            opacity: 0;
        ">
    `;

  procedures.forEach((proc, idx) => {
    const isEquipmentRequired =
      proc.equipment_required == 1 || proc.equipment_required === true;
    const procId = `proc-${proc.procedure_id || idx}`;
    const totalTime =
      parseInt(proc.wait_time ?? 0) + parseInt(proc.procedure_time ?? 0);

    html += `
            <div class="procedure-card" id="${procId}">
                <div class="procedure-display-mode" onclick="toggleProcedureDetail('${procId}')">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                        <div class="procedure-number-badge">${idx + 1}</div>
                        <div style="flex: 1; min-width: 0;">
                            <div class="procedure-title">${
                              proc.procedure_name || "ไม่มีชื่อหัตถการ"
                            }</div>
                            <div class="procedure-stats">
                                <span>⏱️ ${proc.wait_time ?? 0}น</span>
                                <span>•</span>
                                <span>⚕️ ${proc.procedure_time ?? 0}น</span>
                                <span>•</span>
                                <span>👥 ${proc.staff_required ?? 0}คน</span>
                            </div>
                        </div>
                    </div>
                    <div class="procedure-time-badge">
                        ${totalTime} นาที
                    </div>
                </div>

                <div id="${procId}-expanded" style="
                    display: none;
                    background: var(--background);
                    border-top: 1px solid var(--border);
                    padding: 20px;
                ">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px;">
                        <div style="background: var(--surface); padding: 16px; border-radius: 10px; border: 1px solid var(--border);">
                            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 6px;">⏳ เวลารอ</div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${
                              proc.wait_time ?? 0
                            }</div>
                            <div style="font-size: 11px; color: var(--text-muted);">นาที</div>
                        </div>
                        
                        <div style="background: var(--surface); padding: 16px; border-radius: 10px; border: 1px solid var(--border);">
                            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 6px;">⚕️ เวลาทำ</div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${
                              proc.procedure_time ?? 0
                            }</div>
                            <div style="font-size: 11px; color: var(--text-muted);">นาที</div>
                        </div>

                        <div style="background: var(--surface); padding: 16px; border-radius: 10px; border: 1px solid var(--border);">
                            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 6px;">👥 พนักงาน</div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${
                              proc.staff_required ?? 0
                            }</div>
                            <div style="font-size: 11px; color: var(--text-muted);">คน</div>
                        </div>

                        <div style="background: var(--surface); padding: 16px; border-radius: 10px; border: 1px solid var(--border);">
                            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 6px;">🔧 อุปกรณ์</div>
                            <div style="font-size: 16px; font-weight: 700; color: ${
                              isEquipmentRequired
                                ? "var(--danger-color)"
                                : "var(--success-color)"
                            };">
                                ${isEquipmentRequired ? "ต้องใช้" : "ไม่ต้อง"}
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px;">
                       <!-- <button class="btn" style="flex: 1; background: var(--warning-color); color: white;" onclick="toggleProcedureEditMode('${procId}'); event.stopPropagation();">
                            <i class="fas fa-edit"></i> แก้ไข
                        </button> -->
                        
                        <button class="btn" style="background: var(--secondary-color); color: white;" onclick="toggleProcedureDetail('${procId}'); event.stopPropagation();">
                            <i class="fas fa-chevron-up"></i> ปิด
                        </button>
                        
                        <button class="btn btn-danger" onclick="removeProcedureFromRoom(${
                          proc.room_procedure_id
                        }, '${proc.procedure_name}'); event.stopPropagation();">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div> 
                </div>

                <!-- Edit Mode (ยังคงฟังก์ชันเดิม) -->
                <div id="edit-${procId}" style="display: none; background: var(--background); border-top: 1px solid var(--border);">
                    <div style="background: var(--primary-color); color: white; padding: 16px; font-weight: 600;">
                        ✏️ แก้ไข: ${proc.procedure_name}
                    </div>
                    <div style="padding: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div>
                            <label style="font-weight: 600; color: var(--text-primary); font-size: 13px; display: block; margin-bottom: 8px;">⏳ เวลารอ (นาที)</label>
                            <input type="number" id="wait-time-${procId}" value="${
      proc.wait_time ?? 0
    }" min="0"
                                   style="width: 100%; padding: 10px 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 14px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; color: var(--text-primary); font-size: 13px; display: block; margin-bottom: 8px;">⚕️ เวลาทำ (นาที)</label>
                            <input type="number" id="proc-time-${procId}" value="${
      proc.procedure_time ?? 0
    }" min="1"
                                   style="width: 100%; padding: 10px 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 14px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; color: var(--text-primary); font-size: 13px; display: block; margin-bottom: 8px;">👥 จำนวนพนักงาน</label>
                            <input type="number" id="staff-req-${procId}" value="${
      proc.staff_required ?? 0
    }" min="0"
                                   style="width: 100%; padding: 10px 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 14px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; color: var(--text-primary); font-size: 13px; display: block; margin-bottom: 8px;">🔧 ต้องใช้อุปกรณ์</label>
                            <select id="equip-req-${procId}" style="width: 100%; padding: 10px 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 14px;">
                                <option value="0" ${
                                  !isEquipmentRequired ? "selected" : ""
                                }>ไม่ต้องใช้</option>
                                <option value="1" ${
                                  isEquipmentRequired ? "selected" : ""
                                }>ต้องใช้</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; padding: 0 20px 20px;">
                        <button class="btn btn-success" style="flex: 1;" onclick="saveProcedureChanges('${procId}')">
                            <i class="fas fa-check"></i> บันทึก
                        </button>
                        <button class="btn" style="flex: 1; background: var(--secondary-color); color: white;" onclick="cancelProcedureEdit('${procId}')">
                            <i class="fas fa-times"></i> ยกเลิก
                        </button>
                    </div>
                </div>
            </div>
        `;
  });

  html += "</div>";
  container.innerHTML = html;
}

async function openAssignProcedureModal(roomId) {
  try {
    currentRoomId = roomId;

    console.log("🔋 โหลดหัตถการสำหรับห้อง:", roomId);

    // ✅ ดึงข้อมูลห้องและหัตถการที่มีอยู่
    const roomDetailResponse = await fetch(
      `${API_BASE_URL}/get_room_detail.php?room_id=${roomId}`
    );

    if (!roomDetailResponse.ok) {
      throw new Error(`HTTP ${roomDetailResponse.status}`);
    }

    const roomDetailResult = await roomDetailResponse.json();
    if (!roomDetailResult.success) {
      throw new Error(roomDetailResult.message);
    }

    const room = roomDetailResult.data.room;
    const existingProcedures = roomDetailResult.data.procedures || [];
    const existingProcedureIds = new Set(
      existingProcedures.map((p) => p.procedure_id)
    );

    console.log(`✅ หัตถการในห้องแล้ว: ${existingProcedureIds.size} รายการ`);

    // ✅ ดึงรายการหัตถการทั้งหมดของสเตชัน
    const stationProceduresResponse = await fetch(
      `${API_BASE_URL}/get_station_procedures.php?station_id=${currentStationId}`
    );

    if (!stationProceduresResponse.ok) {
      throw new Error(`HTTP ${stationProceduresResponse.status}`);
    }

    const stationProceduresResult = await stationProceduresResponse.json();
    if (!stationProceduresResult.success) {
      throw new Error(stationProceduresResult.message);
    }

    const allProcedures = stationProceduresResult.data.procedures || [];

    // ✅ กรองหัตถการที่ยังไม่ได้เพิ่ม
    const availableProcedures = allProcedures.filter(
      (p) => !existingProcedureIds.has(p.procedure_id)
    );

    console.log(
      `📊 หัตถการทั้งหมด: ${allProcedures.length}, พร้อมเพิ่ม: ${availableProcedures.length}`
    );

    if (availableProcedures.length === 0) {
      Swal.fire({
        icon: "info",
        title: "ไม่มีหัตถการ",
        text: "หัตถการทั้งหมดของสเตชันนี้มีในห้องแล้ว หรือไม่มีหัตถการที่ได้กำหนด",
        confirmButtonColor: "#0056B3",
      });
      return;
    }

    // ✅ สร้าง Modal HTML พร้อมฟีเจอร์ค้นหา
    await displayAssignProcedureModalWithSearch(
      availableProcedures,
      existingProcedures,
      room
    );
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      icon: "error",
      title: "ข้อผิดพลาด",
      text: error.message,
      confirmButtonColor: "#C0392B",
    });
  }
}
async function displayAssignProcedureModalWithSearch(
  availableProcedures,
  existingProcedures,
  room
) {
  const searchInput = `
        <input type="text" id="procedureSearch" placeholder="🔍 ค้นหา..." 
               style="
                   width: 100%;
                   padding: 12px 14px;
                   border: 2px solid #e0e0e0;
                   border-radius: 8px;
                   font-size: 14px;
                   transition: border-color 0.3s ease;
               "
               oninput="filterProcedureList(this.value)">
    `;

  let existingProceduresHtml = "";
  if (existingProcedures.length > 0) {
    existingProceduresHtml = `
            <div style="
                background: #f0f7ff;
                padding: 14px;
                border-radius: 8px;
                margin-bottom: 16px;
                border-left: 4px solid #1976d2;
            ">
                <div style="
                    font-weight: 600;
                    color: #1976d2;
                    margin-bottom: 10px;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                ">
                    <i class="fas fa-check-circle"></i> เพิ่มแล้ว (${
                      existingProcedures.length
                    })
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${existingProcedures
                      .map(
                        (proc) => `
                        <div style="
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                            background: white;
                            padding: 8px 12px;
                            border-radius: 6px;
                            font-size: 12px;
                            border: 1px solid #e0e0e0;
                        ">
                            <span style="color: #1976d2; font-weight: 600;">${proc.procedure_name}</span>
                            <button onclick="removeProcedureFromRoom(${proc.room_procedure_id}, '${proc.procedure_name}')"
                                    style="
                                        background: none;
                                        border: none;
                                        color: #d32f2f;
                                        cursor: pointer;
                                        padding: 0;
                                        font-size: 14px;
                                    ">
                                ✕
                            </button>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `;
  }

  let procedureOptions = "";
  availableProcedures.forEach((proc, idx) => {
    // ✅ Convert ให้ string เพราะ existingProcedures มี procedure_id เป็น string
    const isAlreadyAdded = existingProcedures.some(
      (p) => String(p.procedure_id) === String(proc.procedure_id)
    );

    const disabledStyle = isAlreadyAdded
      ? "opacity: 0.5; cursor: not-allowed; background: #f5f5f5;"
      : "";
    const borderStyle = isAlreadyAdded ? "#ccc" : "#f0f0f0";

    procedureOptions += `
            <div class="procedure-option" data-id="${
              proc.procedure_id
            }" data-name="${proc.procedure_name}" style="
                padding: 12px 14px;
                border: 2px solid ${borderStyle};
                border-radius: 8px;
                cursor: ${isAlreadyAdded ? "not-allowed" : "pointer"};
                transition: all 0.2s ease;
                background: white;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 12px;
                ${disabledStyle}
            "
            onclick="${
              isAlreadyAdded
                ? ""
                : "toggleProcedureOption(this, " +
                  proc.procedure_id +
                  ", '" +
                  proc.procedure_name +
                  "')"
            }"
            onmouseover="this.style.borderColor='${
              isAlreadyAdded ? "#ccc" : "#d0d0d0"
            }'; this.style.background='${
      isAlreadyAdded ? "#f5f5f5" : "#fafafa"
    }';"
            onmouseout="this.style.borderColor='${borderStyle}'; this.style.background='white';">
                <input type="checkbox" class="procedure-checkbox" value="${
                  proc.procedure_id
                }" style="
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                    flex-shrink: 0;
                    ${isAlreadyAdded ? "cursor: not-allowed;" : ""}
                " ${isAlreadyAdded ? "disabled" : ""}>
                <div style="flex: 1; min-width: 0;">
                    <div style="
                        font-weight: 600;
                        color: ${isAlreadyAdded ? "#999" : "#212529"};
                        font-size: 13px;
                        margin-bottom: 4px;
                    ">
                        ${proc.procedure_name}
                        ${
                          isAlreadyAdded
                            ? '<span style="color: #4caf50; font-size: 11px; margin-left: 8px;">✓ เพิ่มแล้ว</span>'
                            : ""
                        }
                    </div>
                    <div style="
                        font-size: 11px;
                        color: #888;
                        display: flex;
                        gap: 12px;
                    ">
                        <span>⏱️ รอ ${proc.wait_time || 0}น</span>
                        <span>ทำ ${proc.procedure_time || 0}น</span>
                        <span>👥 ${proc.staff_required || 0}คน</span>
                    </div>
                </div>
            </div>
        `;
  });

  const { value: selectedProcedures } = await Swal.fire({
    title: `เพิ่มหัตถการ: ${room.room_name}`,
    html: `
            <div style="text-align: left;">
                ${existingProceduresHtml}

                <div style="margin-bottom: 12px;">
                    <label style="
                        font-weight: 600;
                        display: block;
                        margin-bottom: 8px;
                        color: #212529;
                        font-size: 13px;
                    ">
                        ค้นหาและเลือกหัตถการ *
                    </label>
                    ${searchInput}
                    <small style="color: #999; display: block; margin-top: 4px;">
                        ${availableProcedures.length} รายการ
                    </small>
                </div>

                <div id="procedureListContainer" style="
                    max-height: 350px;
                    overflow-y: auto;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 8px;
                    background: #fafafa;
                ">
                    ${procedureOptions}
                </div>

                <div id="selectedCount" style="
                    margin-top: 12px;
                    padding: 10px;
                    background: #e8f5e9;
                    border-radius: 6px;
                    font-size: 12px;
                    color: #2e7d32;
                    text-align: center;
                    font-weight: 600;
                    display: none;
                ">
                    เลือก 0 รายการ
                </div>
            </div>
        `,
    showCancelButton: true,
    confirmButtonText: "✅ เพิ่ม",
    cancelButtonText: "❌ ยกเลิก",
    confirmButtonColor: "#4caf50",
    cancelButtonColor: "#9e9e9e",
    width: "500px",
    didOpen: () => {
      window.currentProceduresList = availableProcedures;

      // 🔍 Debug log ดูรายละเอียด
      console.log(
        "🔍 existingProcedures:",
        JSON.stringify(existingProcedures, null, 2)
      );
      console.log(
        "🔍 availableProcedures sample:",
        JSON.stringify(availableProcedures[0], null, 2)
      );

      // ✅ เช็คว่า procedure 1219 อยู่ในรายการแล้วหรือไม่
      const proc1219 = existingProcedures.find(
        (p) => p.procedure_id === 1219 || p.id === 1219
      );
      console.log("🔍 procedure 1219 in existing?", proc1219);

      updateSelectedCount();

      // Add event listeners to checkboxes
      document.querySelectorAll(".procedure-checkbox").forEach((checkbox) => {
        checkbox.addEventListener("change", updateSelectedCount);
      });
    },
    preConfirm: () => {
      const selectedCheckboxes = document.querySelectorAll(
        ".procedure-checkbox:checked"
      );

      if (selectedCheckboxes.length === 0) {
        Swal.showValidationMessage("โปรดเลือกอย่างน้อย 1 หัตถการ");
        return false;
      }

      return Array.from(selectedCheckboxes).map((cb) => parseInt(cb.value, 10));
    },
  });

  if (selectedProcedures && selectedProcedures.length > 0) {
    await assignProceduresToRoom(currentRoomId, selectedProcedures);
  }
}

function toggleProcedureOption(element, procedureId, procedureName) {
  const checkbox = element.querySelector(".procedure-checkbox");
  checkbox.checked = !checkbox.checked;

  if (checkbox.checked) {
    element.style.borderColor = "#1976d2";
    element.style.background = "#e3f2fd";
  } else {
    element.style.borderColor = "#f0f0f0";
    element.style.background = "white";
  }

  updateSelectedCount();
}

function updateSelectedCount() {
  const selectedCheckboxes = document.querySelectorAll(
    ".procedure-checkbox:checked"
  );
  const countDiv = document.getElementById("selectedCount");

  if (selectedCheckboxes.length > 0) {
    countDiv.textContent = `เลือก ${selectedCheckboxes.length} รายการ`;
    countDiv.style.display = "block";
  } else {
    countDiv.style.display = "none";
  }
}

/**
 * ✅ Select Procedure Option
 */
function selectProcedureOption(element, procedureId, procedureName) {
  const radio = element.querySelector('input[type="radio"]');
  radio.checked = true;

  document.querySelectorAll(".procedure-option").forEach((opt) => {
    opt.style.borderColor = "#f0f0f0";
    opt.style.background = "white";
  });

  element.style.borderColor = "#1976d2";
  element.style.background = "#e3f2fd";
}

/**
 * ✅ Filter Procedure List
 */
function filterProcedureList(searchText) {
  const options = document.querySelectorAll(".procedure-option");
  const searchLower = searchText.toLowerCase().trim();

  let visibleCount = 0;

  options.forEach((option) => {
    const matches = option.dataset.name.toLowerCase().includes(searchLower);
    const shouldShow = searchText === "" || matches;

    option.style.display = shouldShow ? "flex" : "none";
    if (shouldShow) visibleCount++;
  });

  let noResultDiv = document.getElementById("noResultMessage");

  if (visibleCount === 0 && searchText !== "") {
    if (noResultDiv) noResultDiv.remove();

    const noResult = document.createElement("div");
    noResult.id = "noResultMessage";
    noResult.style.cssText = `
            text-align: center;
            padding: 24px;
            color: #bbb;
            font-size: 13px;
        `;
    noResult.innerHTML = `ไม่พบ "${searchText}"`;
    document.getElementById("procedureListContainer").appendChild(noResult);
  } else if (noResultDiv) {
    noResultDiv.remove();
  }
}

async function assignProceduresToRoom(roomId, procedureIds) {
  try {
    Swal.fire({
      title: "กำลังบันทึก...",
      html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #1976d2; margin-top: 12px;"></i>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    console.log("📤 ส่งข้อมูล:", {
      room_id: roomId,
      procedure_ids: procedureIds,
    });

    // Loop through each procedure and add them
    let successCount = 0;
    let failedCount = 0;
    let failedProcedures = [];

    for (const procedureId of procedureIds) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/assign_procedure_to_room.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              room_id: roomId,
              procedure_id: parseInt(procedureId, 10),
            }),
          }
        );

        const result = await response.json();
        console.log(`📊 Response for procedure ${procedureId}:`, result);

        if (response.ok && result.success) {
          successCount++;
          console.log(`✅ เพิ่ม ${result.data.procedure_name} สำเร็จ`);
        } else {
          failedCount++;
          // ถ้า result มี errors array ให้ดึงมาแสดง
          if (result.errors && Array.isArray(result.errors)) {
            const errorMsg = result.errors.map((e) => e.error).join("; ");
            failedProcedures.push(`ID ${procedureId}: ${errorMsg}`);
            console.warn(`⚠️ Error details:`, result.errors);
          } else {
            failedProcedures.push(
              result.message || `Procedure ID ${procedureId}`
            );
          }
          console.warn(
            `⚠️ เพิ่มไม่สำเร็จ (${response.status}): ${result.message}`
          );
        }
      } catch (error) {
        failedCount++;
        failedProcedures.push(`Procedure ID ${procedureId}: ${error.message}`);
        console.error(`❌ Error with procedure ${procedureId}:`, error);
      }
    }

    // Show result
    if (successCount > 0) {
      let message = `บันทึกหัตถการ ${successCount} รายการเรียบร้อย`;
      if (failedCount > 0) {
        message += `\n⚠️ ล้มเหลว ${failedCount} รายการ`;
      }

      Swal.fire({
        icon: failedCount === 0 ? "success" : "warning",
        title: "เสร็จสิ้น",
        text: message,
        confirmButtonColor: "#4caf50",
      });
      openRoomDetail(roomId);
    } else {
      throw new Error(
        `ไม่สามารถเพิ่มหัตถการได้: ${failedProcedures.join(", ")}`
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      icon: "error",
      title: "ข้อผิดพลาด",
      text: error.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่",
      confirmButtonColor: "#d32f2f",
    });
  }
}

async function displayAssignProcedureModal(availableProcedures, room) {
  let procedureOptions = '<option value="">-- เลือกหัตถการ --</option>';

  availableProcedures.forEach((proc) => {
    procedureOptions += `
            <option value="${proc.procedure_id}" data-name="${proc.procedure_name}">
                #${proc.procedure_id} | ${proc.procedure_name}
                (รอ: ${proc.wait_time}น | ทำ: ${proc.procedure_time}น)
            </option>
        `;
  });

  const { value: selectedProcedures } = await Swal.fire({
    title: `➕ เพิ่มหัตถการให้ห้อง: ${room.room_name}`,
    html: `
            <div style="text-align: left; padding: 20px;">
                <div style="
                    background: linear-gradient(135deg, #0056B3 0%, #0047AB 100%);
                    color: white;
                    padding: 16px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    text-align: center;
                ">
                    <div style="font-size: 14px; opacity: 0.9;">ห้อง</div>
                    <div style="font-size: 20px; font-weight: 700; margin-top: 4px;">
                        ${room.room_name}
                    </div>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
                        ${room.station_name}
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        font-weight: 700;
                        margin-bottom: 10px;
                        color: #212529;
                    ">
                        หัตถการที่พร้อมเพิ่ม (${availableProcedures.length} รายการ) *
                    </label>
                    <select id="procedureSelect" class="form-control" style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #ced4da;
                        border-radius: 8px;
                        font-size: 14px;
                        background: white;
                    " required>
                        ${procedureOptions}
                    </select>
                    <small style="color: #6c757d; display: block; margin-top: 6px;">
                        ✓ เลือกหัตถการที่ต้องการเพิ่มให้ห้องนี้
                    </small>
                </div>

                <div id="procedureDetails" style="
                    background: #f8f9fa;
                    padding: 14px;
                    border-radius: 8px;
                    border-left: 4px solid #0056B3;
                    display: none;
                ">
                    <div style="font-size: 12px; color: #495057; margin-bottom: 8px;">
                        <strong>รายละเอียด:</strong>
                    </div>
                    <div id="procedureInfo"></div>
                </div>
            </div>
        `,
    showCancelButton: true,
    confirmButtonText: "✅ เพิ่มหัตถการ",
    cancelButtonText: "❌ ยกเลิก",
    confirmButtonColor: "#1E8449",
    cancelButtonColor: "#6c757d",
    didOpen: () => {
      const select = document.getElementById("procedureSelect");
      const detailsDiv = document.getElementById("procedureDetails");
      const infoDiv = document.getElementById("procedureInfo");

      select.addEventListener("change", () => {
        if (select.value) {
          const proc = availableProcedures.find(
            (p) => p.procedure_id == select.value
          );
          if (proc) {
            infoDiv.innerHTML = `
                            <div style="line-height: 1.8;">
                                <div>
                                    <span style="color: #6c757d;">⏳ เวลารอ:</span>
                                    <strong style="color: #009688; font-size: 16px; margin-left: 8px;">
                                        ${proc.wait_time || 0}
                                    </strong>
                                    <span style="color: #6c757d;">นาที</span>
                                </div>
                                <div style="margin-top: 4px;">
                                    <span style="color: #6c757d;">⚕️ เวลาทำ:</span>
                                    <strong style="color: #3f51b5; font-size: 16px; margin-left: 8px;">
                                        ${proc.procedure_time || 0}
                                    </strong>
                                    <span style="color: #6c757d;">นาที</span>
                                </div>
                                <div style="margin-top: 4px;">
                                    <span style="color: #6c757d;">👥 พนักงาน:</span>
                                    <strong style="color: #ff5722; margin-left: 8px;">
                                        ${proc.staff_required || 0} คน
                                    </strong>
                                </div>
                                <div style="margin-top: 4px;">
                                    <span style="color: #6c757d;">🔧 อุปกรณ์:</span>
                                    <strong style="color: ${
                                      proc.equipment_required
                                        ? "#f44336"
                                        : "#4caf50"
                                    }; margin-left: 8px;">
                                        ${
                                          proc.equipment_required
                                            ? "⚠️ ต้องใช้"
                                            : "✓ ไม่ต้องใช้"
                                        }
                                    </strong>
                                </div>
                            </div>
                        `;
            detailsDiv.style.display = "block";
          }
        } else {
          detailsDiv.style.display = "none";
        }
      });
    },
    preConfirm: () => {
      const select = document.getElementById("procedureSelect");
      if (!select.value) {
        Swal.showValidationMessage("⚠️ โปรดเลือกหัตถการ");
        return false;
      }
      return select.value;
    },
  });

  if (selectedProcedures) {
    await assignProcedureToRoom(currentRoomId, selectedProcedures);
  }
}

async function assignProcedureToRoom(roomId, procedureId) {
  try {
    Swal.fire({
      title: "กำลังบันทึก...",
      html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #1976d2; margin-top: 12px;"></i>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    const response = await fetch(
      `${API_BASE_URL}/assign_procedure_to_room.php`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, procedure_id: procedureId }),
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();

    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "บันทึกหัตถการเรียบร้อย",
        confirmButtonColor: "#4caf50",
      });
      openRoomDetail(roomId);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error:", error);
    Swal.fire({
      icon: "error",
      title: "ข้อผิดพลาด",
      text: error.message,
      confirmButtonColor: "#d32f2f",
    });
  }
}

function displayRoomProceduresWithAddButton(procedures, roomId) {
  let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3>💉 หัตถการในห้อง (${procedures.length})</h3>
            <button class="btn btn-success" onclick="openAssignProcedureModal(${roomId})" style="
                background: #1E8449;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 6px;
            ">
                <i class="fas fa-plus"></i> เพิ่มหัตถการ
            </button>
        </div>
    `;

  // เพิ่มส่วนแสดงรายละเอียดหัตถการที่มีอยู่
  if (procedures.length === 0) {
    html += `
            <div style="
                text-align: center;
                padding: 30px;
                background: #f8f9fa;
                border-radius: 8px;
                color: #adb5bd;
            ">
                <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px;"></i>
                <div>ยังไม่มีหัตถการในห้องนี้</div>
                <small style="display: block; margin-top: 8px;">
                    👆 คลิก "เพิ่มหัตถการ" เพื่อเพิ่มหัตถการจากสเตชัน
                </small>
            </div>
        `;
  } else {
    html += '<div style="display: grid; gap: 10px;">';
    procedures.forEach((proc, idx) => {
      html += `
                <div style="
                    background: white;
                    border-left: 4px solid #3f51b5;
                    border-radius: 8px;
                    padding: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                ">
                    <div style="flex: 1;">
                        <div style="font-weight: 700; color: #212529; margin-bottom: 4px;">
                            #${idx + 1}. ${proc.procedure_name}
                        </div>
                        <div style="font-size: 12px; color: #6c757d;">
                            ⏳ รอ: ${proc.wait_time}น | ⚕️ ทำ: ${
        proc.procedure_time
      }น | 👥 ${proc.staff_required}คน
                        </div>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="removeProcedureFromRoom(${
                      proc.room_procedure_id
                    }, '${proc.procedure_name}')" style="
                        padding: 5px 10px;
                        font-size: 12px;
                        background: #C0392B;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
    });
    html += "</div>";
  }

  return html;
}

async function removeProcedureFromRoom(roomProcedureId, procedureName) {
  const result = await Swal.fire({
    title: "⚠️ ยืนยันการลบ",
    text: `ต้องการลบหัตถการ "${procedureName}" ออกจากห้องนี้หรือไม่?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "✓ ลบ",
    cancelButtonText: "✕ ยกเลิก",
    confirmButtonColor: "#C0392B",
    cancelButtonColor: "#6c757d",
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/manage_room_procedures.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "remove",
            room_procedure_id: roomProcedureId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          icon: "success",
          title: "✅ ลบสำเร็จ",
          text: `ลบหัตถการ "${procedureName}" ออกเรียบร้อย`,
          confirmButtonColor: "#1E8449",
        });

        openRoomDetail(currentRoomId);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Swal.fire("❌ ข้อผิดพลาด", error.message, "error");
    }
  }
}

/**
 * Toggle individual procedure detail
 */
function toggleProcedureDetail(procId) {
  const expanded = document.getElementById(`${procId}-expanded`);
  if (!expanded) return;

  if (expanded.style.display === "none") {
    expanded.style.display = "block";
  } else {
    expanded.style.display = "none";
  }
}

/**
 * ✅ ADD CSS ANIMATIONS
 */
function addProcedureStyles() {
  if (document.getElementById("procedure-styles-improved")) return;

  const style = document.createElement("style");
  style.id = "procedure-styles-improved";
  style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                max-height: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                max-height: 1000px;
                transform: translateY(0);
            }
        }

        @keyframes slideUp {
            from {
                opacity: 1;
                max-height: 1000px;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                max-height: 0;
                transform: translateY(-10px);
            }
        }

        .procedure-card {
            animation: slideInProcedure 0.3s ease-out;
        }

        @keyframes slideInProcedure {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        #procedureToggleBtn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(63, 81, 181, 0.4);
        }

        #proceduresContainer {
            animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
  document.head.appendChild(style);
}
// Add CSS styles for procedure cards
function addProcedureStyles() {
  if (document.getElementById("procedure-styles-enhanced")) return;

  const style = document.createElement("style");
  style.id = "procedure-styles-enhanced";
  style.textContent = `
        .procedure-card {
            background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
            border: 1px solid #e0e6f2;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            animation: slideInProcedure 0.3s ease-out;
        }

        .procedure-card:hover {
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            border-color: #3f51b5;
            transform: translateY(-2px);
        }

        @keyframes slideInProcedure {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .procedure-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 18px;
            border-bottom: 1px solid #eee;
        }

        .procedure-number-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%);
            color: white;
            border-radius: 50%;
            font-weight: 700;
            font-size: 14px;
            flex-shrink: 0;
        }

        .procedure-title {
            flex: 1;
            font-weight: 700;
            font-size: 15px;
            color: #212529;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .procedure-edit-btn {
            background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
            color: white;
            border: none;
            padding: 8px 14px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }

        .procedure-edit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(243, 156, 18, 0.4);
        }

        .procedure-display-mode {
            padding: 16px 18px;
        }

        .procedure-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
            margin-bottom: 16px;
        }

        .procedure-stat-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(0, 0, 0, 0.02);
            border-radius: 8px;
            transition: all 0.3s ease;
        }

        .procedure-stat-item:hover {
            background: rgba(0, 0, 0, 0.04);
            transform: translateY(-2px);
        }

        .stat-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            font-size: 18px;
            flex-shrink: 0;
        }

        .stat-content {
            flex: 1;
            min-width: 0;
        }

        .stat-label {
            font-size: 11px;
            color: #6c757d;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .stat-value {
            font-size: 18px;
            font-weight: 700;
            color: #212529;
            line-height: 1;
        }

        .stat-unit {
            font-size: 10px;
            color: #adb5bd;
            margin-top: 2px;
        }

        .procedure-total-time {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 14px;
            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
            border-radius: 8px;
            border-left: 4px solid #3f51b5;
        }

        .procedure-total-time span:first-child {
            font-weight: 600;
            color: #495057;
        }

        .total-time-badge {
            background: linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%);
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 13px;
        }

        /* Edit Mode Styles */
        .procedure-edit-mode {
            background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
        }

        .edit-mode-header {
            background: linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%);
            color: white;
            padding: 14px 18px;
            font-weight: 600;
        }

        .edit-mode-body {
            padding: 20px 18px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
        }

        .edit-form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .edit-form-label {
            font-weight: 700;
            color: #495057;
            font-size: 13px;
        }

        .edit-form-input,
        .edit-form-select {
            padding: 10px 12px;
            border: 2px solid #e0e6f2;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            transition: all 0.3s ease;
        }

        .edit-form-input:focus,
        .edit-form-select:focus {
            outline: none;
            border-color: #3f51b5;
            box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.1);
        }

        .form-helper-text {
            font-size: 11px;
            color: #adb5bd;
            margin-top: 4px;
        }

        .edit-form-actions {
            grid-column: 1 / -1;
            display: flex;
            gap: 10px;
            margin-top: 10px;
            padding-top: 16px;
            border-top: 1px solid #eee;
        }

        .btn-edit-save,
        .btn-edit-cancel {
            flex: 1;
            padding: 12px 16px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s ease;
        }

        .btn-edit-save {
            background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }

        .btn-edit-save:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
        }

        .btn-edit-cancel {
            background: linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%);
            color: #424242;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .btn-edit-cancel:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        @media (max-width: 768px) {
            .procedure-header {
                flex-wrap: wrap;
            }

            .procedure-stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .edit-mode-body {
                grid-template-columns: 1fr;
            }
        }
    `;
  document.head.appendChild(style);
}

/**
 * Display Room Patients - Modern Design
 */
function displayRoomPatients(patients) {
  let html = `
        <div style="margin-bottom: 20px;">
            <h3 style="margin: 0;">
                <span style="color: var(--text-secondary);">🛏️</span> คนไข้ในห้อง 
                <span style="color: var(--text-muted); font-weight: 500;">(${patients.length})</span>
            </h3>
        </div>
        <div style="display: grid; gap: 12px;">
    `;

  patients.forEach((p) => {
    const isOverdue = p.is_overdue;
    const borderColor = isOverdue
      ? "var(--danger-color)"
      : "var(--success-color)";
    const bgColor = isOverdue ? "#fef2f2" : "var(--surface)";

    html += `
            <div class="patient-card ${isOverdue ? "overdue" : ""}" style="
                background: ${bgColor};
                border-left-color: ${borderColor};
            ">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 15px; color: var(--text-primary); margin-bottom: 8px;">
                            ${isOverdue ? "🔴" : "🟢"} ${p.patient_name}
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                            <div>HN: <strong>${p.hn}</strong></div>
                            <div>${p.procedure_name || "N/A"}</div>
                            <div style="margin-top: 4px;">
                                <span class="status-badge ${
                                  isOverdue
                                    ? "status-inactive"
                                    : "status-active"
                                }">
                                    ${p.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 13px; color: var(--text-secondary);">
                        <div style="margin-bottom: 4px;">มาถึง: ${new Date(
                          p.arrival_time
                        ).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</div>
                        <div style="font-weight: 700; font-size: 16px; color: ${
                          isOverdue
                            ? "var(--danger-color)"
                            : "var(--text-primary)"
                        };">
                            ${p.wait_duration} นาที
                        </div>
                        ${
                          isOverdue
                            ? '<div style="color: var(--danger-color); font-weight: 600; margin-top: 4px;">⚠️ เกินเวลา</div>'
                            : ""
                        }
                    </div>
                </div>
            </div>
        `;
  });

  if (patients.length === 0) {
    html += `
            <div class="empty-state">
                <i class="fas fa-bed"></i>
                <div style="font-size: 15px; font-weight: 500; margin-bottom: 4px;">ไม่มีคนไข้ในห้องนี้</div>
            </div>
        `;
  }

  html += "</div>";
  document.getElementById("roomPatientsSection").innerHTML = html;
}

/**
 * Close Room Detail Modal
 */
function closeRoomDetail() {
  console.log("❌ ปิด Room Detail Modal");
  document.getElementById("roomDetailModal").style.display = "none";
  currentRoomId = null;
}

/**
 * Open Add Equipment Modal
 */
function openAddEquipmentModal() {
  if (!currentRoomId) {
    alert("❌ ไม่พบข้อมูลห้องปัจจุบัน");
    return;
  }
  document.getElementById("addEquipmentModal").style.display = "block";
  document.getElementById("newEquipmentName").value = "";
  document.getElementById("newEquipmentRequireStaff").checked = false;
}

/**
 * Close Add Equipment Modal
 */
function closeAddEquipmentModal() {
  document.getElementById("addEquipmentModal").style.display = "none";
}

/**
 * Add Equipment to Room
 */
async function addEquipmentToRoom() {
  const equipmentName = document
    .getElementById("newEquipmentName")
    .value.trim();
  const requireStaff = document.getElementById(
    "newEquipmentRequireStaff"
  ).checked;

  if (!equipmentName) {
    alert("กรุณากรอกชื่อเครื่องมือ");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/manage_room_equipment.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add",
        room_id: currentRoomId,
        equipment_name: equipmentName,
        require_staff: requireStaff,
      }),
    });

    const result = await response.json();

    if (result.success) {
      alert(`✅ เพิ่มเครื่องมือ "${equipmentName}" สำเร็จ`);
      closeAddEquipmentModal();
      openRoomDetail(currentRoomId); // Reload room detail
    } else {
      alert("❌ เพิ่มเครื่องมือไม่สำเร็จ: " + result.message);
    }
  } catch (error) {
    console.error("Error adding equipment:", error);
    alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ");
  }
}

// ===== ACTION FUNCTIONS =====

/**
 * Toggle Equipment
 */
async function removeEquipment(equipmentId, equipmentName) {
  if (!confirm(`ต้องการลบเครื่องมือ "${equipmentName}" ออกจากห้องนี้?`)) return;

  try {
    const response = await fetch(`${API_BASE_URL}/manage_room_equipment.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remove",
        equipment_id: equipmentId,
      }),
    });

    const result = await response.json();

    if (result.success) {
      alert(`✅ ลบเครื่องมือ "${equipmentName}" สำเร็จ`);
      openRoomDetail(currentRoomId);
    } else {
      alert("❌ " + result.message);
    }
  } catch (error) {
    console.error("Error removing equipment:", error);
    alert("❌ เกิดข้อผิดพลาด");
  }
}

async function toggleEquipment(equipmentId, isActive, staffCount) {
  try {
    const response = await fetch(`${API_BASE_URL}/manage_room_equipment.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle",
        equipment_id: equipmentId,
        is_active: isActive,
        room_id: currentRoomId,
      }),
    });

    const result = await response.json();

    if (result.success) {
      openRoomDetail(currentRoomId);
    } else {
      alert("❌ " + result.message);
      openRoomDetail(currentRoomId);
    }
  } catch (error) {
    console.error("Error toggling equipment:", error);
    alert("❌ เกิดข้อผิดพลาด");
    openRoomDetail(currentRoomId);
  }
}

/**
 * Update Procedure Times on input change
 */
async function updateProcedureTimes(roomProcedureId) {
  const waitInput = document.getElementById(`wait_${roomProcedureId}`);
  const procInput = document.getElementById(`proc_${roomProcedureId}`);
  const staffReqInput = document.getElementById(`staffreq_${roomProcedureId}`);
  const equipReqInput = document.getElementById(`equipreq_${roomProcedureId}`);

  const waitTime = parseInt(waitInput.value);
  const procedureTime = parseInt(procInput.value);
  const staffRequired = parseInt(staffReqInput.value);
  const equipmentRequired = equipReqInput.value === "1";

  if (waitTime < 0 || procedureTime < 0 || staffRequired < 0) {
    alert("❌ เวลาและจำนวนพนักงานต้องไม่ติดลบ");
    openRoomDetail(currentRoomId);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/manage_procedure_times.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        room_procedure_id: roomProcedureId,
        wait_time: waitTime,
        procedure_time: procedureTime,
        staff_required: staffRequired,
        equipment_required: equipmentRequired,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      alert("❌ " + result.message);
      openRoomDetail(currentRoomId);
    }
  } catch (error) {
    console.error("Error updating procedure times:", error);
    alert("❌ เกิดข้อผิดพลาด");
    openRoomDetail(currentRoomId);
  }
}

/**
 * Remove Room Staff - FIXED: Use _API_BASE instead of API_BASE_URL
 */
async function removeRoomStaff(stationStaffId, staffName) {
  try {
    // ✅ ใช้ Swal Modal แทน confirm()
    const confirmResult = await Swal.fire({
      title: "⚠️ ยืนยันการลบ",
      html: `
        <div style="text-align: left; padding: 15px;">
          <p>ต้องการลบ <strong>${staffName}</strong></p>
          <p>ออกจากห้องนี้ใช่หรือ?</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "✅ ใช่ ลบเลย",
      cancelButtonText: "❌ ยกเลิก",
      confirmButtonColor: "#C0392B",
      cancelButtonColor: "#6c757d",
      reverseButtons: true,
    });

    // ✅ ถ้ายกเลิก ออกจากฟังก์ชัน
    if (!confirmResult.isConfirmed) {
      console.log("❌ ผู้ใช้ยกเลิกการลบ");
      return;
    }

    console.log(`🗑️ ลบพนักงานออกจากห้อง - station_staff_id: ${stationStaffId}`);

    // ✅ แสดง loading
    Swal.fire({
      title: "กำลังลบ...",
      html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #C0392B; margin-top: 12px;"></i>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    // ✅ อัพเดท assigned_room_id = NULL
    const response = await fetch(`${API_BASE_URL}/manage_room_staff.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remove_from_room",
        station_staff_id: stationStaffId,
        assigned_room_id: null,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ ผลลัพธ์:", result);

    if (result.success) {
      // ✅ ปิด loading
      Swal.close();

      // ✅ แสดงข้อความสำเร็จ
      await Swal.fire({
        title: "✅ ลบสำเร็จ",
        html: `
          <div style="text-align: left;">
            <p>ลบ <strong>${staffName}</strong> ออกจากห้องเรียบร้อย</p>
            <p style="color: #adb5bd; font-size: 12px; margin-top: 10px;">
              กำลังรีเฟรชหน้าเว็บ...
            </p>
          </div>
        `,
        icon: "success",
        confirmButtonColor: "#1E8449",
        allowOutsideClick: false,
        allowEscapeKey: false,
        timer: 2000,
        timerProgressBar: true,
      });

      // ✅ รีเฟรชทั้งหน้าเว็บ
      console.log("🔄 กำลังรีเฟรชทั้งหน้าเว็บ...");
      location.reload();
    } else {
      Swal.close();
      throw new Error(result.message || "ไม่สามารถลบได้");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      html: `
        <div style="text-align: left;">
          <p><strong>${error.message}</strong></p>
          <p style="color: #adb5bd; font-size: 12px; margin-top: 10px;">
            กรุณาลองใหม่อีกครั้ง
          </p>
        </div>
      `,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}
/**
 * ✅ ทำเดียวกัน: removeStaffFromRoom (แท็บพนักงาน)
 */
async function removeStaffFromRoom(stationStaffId, staffName, roomName) {
  try {
    // ✅ Swal Modal สำหรับยืนยัน
    const confirmResult = await Swal.fire({
      title: "⚠️ ยืนยันการลบ",
      html: `
        <div style="text-align: left;">
          <p>ต้องการลบ <strong>${staffName}</strong></p>
          <p>ออกจากห้อง <strong>${roomName}</strong> ใช่หรือ?</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "✅ ใช่ ลบเลย",
      cancelButtonText: "❌ ยกเลิก",
      confirmButtonColor: "#C0392B",
      cancelButtonColor: "#6c757d",
      reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    console.log(`🗑️ ลบพนักงาน - station_staff_id: ${stationStaffId}`);

    Swal.fire({
      title: "กำลังลบ...",
      html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #C0392B; margin-top: 12px;"></i>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    const response = await fetch(`${API_BASE_URL}/manage_room_staff.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remove_from_room",
        station_staff_id: stationStaffId,
        assigned_room_id: null,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      Swal.close();

      await Swal.fire({
        title: "✅ ลบสำเร็จ",
        html: `
          <div style="text-align: left;">
            <p>ลบ <strong>${staffName}</strong> ออกจากห้องเรียบร้อย</p>
            <p style="color: #adb5bd; font-size: 12px; margin-top: 10px;">
              กำลังรีเฟรชหน้าเว็บ...
            </p>
          </div>
        `,
        icon: "success",
        confirmButtonColor: "#1E8449",
        allowOutsideClick: false,
        allowEscapeKey: false,
        timer: 2000,
        timerProgressBar: true,
      });

      console.log("🔄 รีเฟรชทั้งหน้า");
      location.reload();
    } else {
      Swal.close();
      throw new Error(result.message || "ไม่สามารถลบได้");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      html: `
        <div style="text-align: left;">
          <p><strong>${error.message}</strong></p>
        </div>
      `,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}
// ============================================
// 2. ลบแพทย์ออกจากห้อง
// ============================================
async function removeRoomDoctor(stationDoctorId, doctorName) {
  const result = await Swal.fire({
    title: "⚠️ ยืนยันการลบ",
    text: `ต้องการลบ ${doctorName} ออกจากห้องนี้หรือไม่?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "✅ ยืนยันลบ",
    cancelButtonText: "❌ ยกเลิก",
    confirmButtonColor: "#C0392B",
    cancelButtonColor: "#6c757d",
  });

  if (result.isConfirmed) {
    try {
      console.log(`🗑️ ลบแพทย์ออกจากห้อง - stationDoctorId: ${stationDoctorId}`);

      const response = await fetch(`${API_BASE_URL}manage_room_doctors.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          station_doctor_id: stationDoctorId,
        }),
      });

      const data = await response.json();
      console.log("✅ ผลลัพธ์:", data);

      if (data.success) {
        // ============================================
        // ✅ STEP 1: ลบ Doctor Card ออกจาก Room Detail
        // ============================================
        const doctorCards = document.querySelectorAll(".doctor-card");
        let removedCard = null;

        doctorCards.forEach((card) => {
          // หา button ลบที่มี onclick ตรงกับ stationDoctorId
          const deleteBtn = card.querySelector(
            `button[onclick*="removeRoomDoctor(${stationDoctorId}"]`
          );
          if (deleteBtn) {
            removedCard = card;
            // Animation ก่อนลบ
            card.style.transition = "all 0.3s ease";
            card.style.opacity = "0";
            card.style.transform = "translateX(-20px)";

            setTimeout(() => {
              card.remove();
              console.log("✅ ลบ doctor card ออกจาก DOM แล้ว");

              // ตรวจสอบว่ามีแพทย์เหลือไหม
              const remainingDoctors =
                document.querySelectorAll(".doctor-card").length;
              updateDoctorSection(remainingDoctors);
            }, 300);
          }
        });

        // ============================================
        // ✅ STEP 2: อัพเดทจำนวนแพทย์ใน Header
        // ============================================
        function updateDoctorSection(remainingCount) {
          const doctorHeader = document.querySelector("#roomDoctorsSection h3");
          if (doctorHeader) {
            doctorHeader.innerHTML = `
              <span style="color: var(--text-secondary);">👨‍⚕️</span> แพทย์ 
              <span style="color: var(--text-muted); font-weight: 500;">(${remainingCount} คน)</span>
            `;
          }

          // ถ้าไม่มีแพทย์เหลือ แสดง empty state
          if (remainingCount === 0) {
            const container = document.getElementById("roomDoctorsSection");
            if (container) {
              const addButton = container.querySelector("button");
              const buttonHtml = addButton
                ? addButton.outerHTML
                : `
                <button class="btn btn-success" onclick="openAssignDoctorModal(${currentRoomId})">
                  <i class="fas fa-plus"></i> เพิ่มแพทย์
                </button>
              `;

              container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                  <h3 style="margin: 0;">
                    <span style="color: var(--text-secondary);">👨‍⚕️</span> แพทย์ 
                    <span style="color: var(--text-muted); font-weight: 500;">(0 คน)</span>
                  </h3>
                  ${buttonHtml}
                </div>
                <div class="empty-state">
                  <i class="fas fa-user-md"></i>
                  <div style="font-size: 15px; font-weight: 500; margin-bottom: 4px;">ไม่มีแพทย์ในห้องนี้</div>
                  <div style="font-size: 13px;">คลิกปุ่ม "เพิ่มแพทย์" เพื่อเพิ่มแพทย์</div>
                </div>
              `;
            }
          }
        }

        // ============================================
        // ✅ STEP 3: อัพเดท Room Card ใน Station Detail
        // ============================================
        if (currentRoomId && currentStationId) {
          updateRoomCardInStation(currentRoomId);
        }

        function updateRoomCardInStation(roomId) {
          const roomCards = document.querySelectorAll(".room-card");

          roomCards.forEach((card) => {
            const onclickAttr = card.getAttribute("onclick");

            if (
              onclickAttr &&
              onclickAttr.includes(`openRoomDetail(${roomId})`)
            ) {
              const infoDiv = card.querySelector(
                'div[style*="font-size: 12px"]'
              );

              if (infoDiv) {
                const html = infoDiv.innerHTML;

                // ดึงจำนวนปัจจุบัน
                const doctorMatch = html.match(/👨‍⚕️ แพทย์: (\d+) คน/);
                const staffMatch = html.match(/👥 พนักงาน: (\d+) คน/);

                if (doctorMatch) {
                  const currentDoctorCount = parseInt(doctorMatch[1]);
                  const newDoctorCount = Math.max(0, currentDoctorCount - 1);
                  const staffCount = staffMatch ? parseInt(staffMatch[1]) : 0;

                  // อัพเดทจำนวนแพทย์
                  infoDiv.innerHTML = html.replace(
                    /👨‍⚕️ แพทย์: \d+ คน/,
                    `👨‍⚕️ แพทย์: ${newDoctorCount} คน`
                  );

                  console.log(
                    `✅ อัพเดท room card: แพทย์ ${currentDoctorCount} → ${newDoctorCount}`
                  );

                  // ============================================
                  // ✅ STEP 4: ตรวจสอบการปิดใช้งานห้อง
                  // ============================================
                  if (newDoctorCount === 0 && staffCount === 0) {
                    // ปิดใช้งานห้อง
                    card.style.opacity = "0.6";
                    card.style.cursor = "not-allowed";
                    card.style.pointerEvents = "none";
                    card.style.borderLeftColor = "#999";
                    card.style.background = "rgba(0, 0, 0, 0.1)";
                    card.removeAttribute("onclick");

                    // เพิ่มข้อความเตือน
                    const contentDiv = card.querySelector(
                      'div[style*="padding-right"]'
                    );
                    if (
                      contentDiv &&
                      !contentDiv.querySelector(".disabled-warning")
                    ) {
                      contentDiv.innerHTML += `
                        <div class="disabled-warning" style="
                          margin-top: 10px; 
                          padding: 8px 12px; 
                          background: rgba(192, 57, 43, 0.15);
                          color: #C0392B; 
                          border-radius: 5px; 
                          font-size: 11px;
                          text-align: center;
                          font-weight: 600;
                          border: 1px solid rgba(192, 57, 43, 0.3);
                        ">
                          🔒 ปิดใช้งาน - ไม่มีพนักงาน/แพทย์
                        </div>
                      `;

                      console.log("🔒 ปิดใช้งานห้องแล้ว (ไม่มีพนักงาน/แพทย์)");
                    }
                  }
                }
              }
            }
          });
        }

        // ============================================
        // ✅ STEP 5: แสดงข้อความสำเร็จ
        // ============================================
        await Swal.fire({
          title: "✅ ลบสำเร็จ",
          text: `ลบแพทย์ "${doctorName}" ออกจากห้องแล้ว`,
          icon: "success",
          confirmButtonColor: "#1E8449",
        });

        // ============================================
        // ✅ STEP 6: อัพเดทรายการแพทย์ของสถานี
        // ============================================
        if (currentStationId) {
          console.log("🔄 อัพเดทรายการแพทย์ของสถานี...");
          loadDoctorsForStation(currentStationId);
        }
      } else {
        Swal.fire({
          title: "❌ ข้อผิดพลาด",
          text: data.message || "ไม่สามารถลบได้",
          icon: "error",
          confirmButtonColor: "#C0392B",
        });
      }
    } catch (error) {
      console.error("❌ Error:", error);
      Swal.fire({
        title: "❌ เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์",
        icon: "error",
        confirmButtonColor: "#C0392B",
      });
    }
  }
}
/**
 * Open Add Staff Modal to show available staff
 */
async function openAddStaffModal(roomId) {
  currentRoomId = roomId;
  if (!currentRoomId) {
    alert("❌ ไม่พบข้อมูลห้องปัจจุบัน");
    return;
  }

  try {
    const today = new Date();
    const workDate = today.toISOString().split("T")[0];

    const staffResponse = await fetch(
      `${API_BASE_URL}/get_available_staff.php?room_id=${currentRoomId}&work_date=${workDate}`
    );
    const staffResult = await staffResponse.json();
    if (!staffResult.success) throw new Error(staffResult.message);

    displayAvailableStaff(staffResult.data);
    document.getElementById("addStaffModal").style.display = "block";
  } catch (error) {
    console.error("Error opening add staff modal:", error);
    alert(`❌ ไม่สามารถโหลดรายชื่อพนักงานได้: ${error.message}`);
  }
}

/**
 * Display the list of available staff in the modal for selection
 */
function displayAvailableStaff(staff) {
  const modalContent = document.getElementById("addStaffModalContent");

  if (staff.length === 0) {
    modalContent.innerHTML =
      '<div style="text-align: center; padding: 20px; color: var(--text-light);">ℹ️ ไม่มีพนักงานที่พร้อมให้เพิ่มเข้าห้องนี้ (พนักงานทั้งหมดอยู่ในห้องนี้แล้ว)</div>';
    return;
  }

  let options = '<option value="">-- เลือกพนักงาน --</option>';
  staff.forEach((s) => {
    const currentInfo = s.current_room
      ? ` (ปัจจุบันอยู่ใน: ${s.current_room})`
      : " (ว่าง)";
    options += `<option value="${s.station_staff_id}" data-staff-id="${
      s.staff_id
    }" data-name="${s.staff_name}" data-type="${s.staff_type || "Staff"}">${
      s.staff_name
    } - ${s.staff_type}${currentInfo}</option>`;
  });

  const html = `
        <div style="margin-bottom: 15px;">
            <label class="form-label">เลือกพนักงานที่ต้องการเพิ่มเข้าห้อง</label>
            <select id="addStaffSelect" class="form-control">${options}</select>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn" onclick="closeAddStaffModal()">ยกเลิก</button>
            <button class="btn btn-success" onclick="addStaffToRoom()">เพิ่มเข้าห้อง</button>
        </div>
    `;

  modalContent.innerHTML = html;
}

function closeAddStaffModal() {
  document.getElementById("addStaffModal").style.display = "none";
  document.getElementById("addStaffModalContent").innerHTML = "";
}

async function addStaffToRoom() {
  const select = document.getElementById("addStaffSelect");
  const stationStaffId = select.value;

  if (!stationStaffId) {
    alert("โปรดเลือกพนักงาน");
    return;
  }

  const selectedOption = select.options[select.selectedIndex];

  try {
    const response = await fetch(`${API_BASE_URL}/manage_room_staff.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add",
        room_id: currentRoomId,
        station_staff_id: stationStaffId,
        staff_name: selectedOption.getAttribute("data-name"),
        staff_type: selectedOption.getAttribute("data-type") || "Staff",
      }),
    });

    const result = await response.json();

    if (result.success) {
      closeAddStaffModal();
      openRoomDetail(currentRoomId);

      if (currentStationId) {
        loadStationStaff(currentStationId);
      }

      Swal.fire({
        title: "สำเร็จ!",
        text: "เพิ่มพนักงานสำเร็จ",
        icon: "success",
        timer: 1500,
        timerProgressBar: true,
      });
    } else {
      Swal.fire("ข้อผิดพลาด", result.message, "error");
    }
  } catch (error) {
    console.error("Error:", error);
    Swal.fire("ข้อผิดพลาด", "ไม่สามารถเพิ่มพนักงานได้", "error");
  }
}

/**
 * Open Add Doctor Modal (Placeholder)
 */
function openAddDoctorModal() {
  alert(
    "ℹ️ ฟีเจอร์เพิ่มแพทย์จะพัฒนาในเวอร์ชันถัดไป\n(ต้องเชื่อมต่อกับระบบ PDP เพื่อดึงรายชื่อแพทย์)"
  );
}

// ===== STAFF MANAGEMENT FUNCTIONS =====

/**
 * Toggle Edit Staff Schedule
 */

// Helper function to convert 12-hour time (e.g., "08:00 AM") to 24-hour time (e.g., "08:00")
function convertTo24Hour(time12h) {
  if (!time12h || time12h === "-") return "";
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");
  if (hours === "12") {
    hours = "00";
  }
  if (modifier === "PM") {
    hours = parseInt(hours, 10) + 12;
  }
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

// Helper function to format time as 24-hour (HH:MM)
function convertTo12Hour(time24h) {
  if (!time24h) return "-";
  // แสดงเวลาแบบ 24 ชั่วโมง (ตัดวินาทีออก)
  const parts = time24h.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`; // HH:MM
  }
  return time24h;
}

// New function to save staff schedule
async function saveStaffSchedule(staffId) {
  const fields = [
    { id: `work-start-${staffId}`, fieldName: "work_start_time" },
    { id: `work-end-${staffId}`, fieldName: "work_end_time" },
    { id: `break-start-${staffId}`, fieldName: "break_start_time" },
    { id: `break-end-${staffId}`, fieldName: "break_end_time" },
  ];

  const updates = {};
  let hasChanges = false;

  fields.forEach((field) => {
    const input = document.getElementById(field.id + "-input");
    const originalValue = convertTo24Hour(
      input.getAttribute("data-original-value")
    );
    const newValue = input.value;

    // Check if value is not empty and has changed
    if (newValue && newValue !== originalValue) {
      updates[field.fieldName] = newValue + ":00"; // Add seconds for database
      hasChanges = true;
    } else if (newValue === "" && originalValue !== "") {
      // Allow clearing the time if it was previously set
      updates[field.fieldName] = null; // Send null to clear the time
      hasChanges = true;
    }
  });

  if (!hasChanges) {
    alert("ไม่มีการเปลี่ยนแปลงข้อมูล");
    toggleEditStaffSchedule(staffId); // Cancel edit mode
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/update_staff_schedule.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: staffId,
        updates: updates,
      }),
    });

    const result = await response.json();
    if (result.success) {
      alert("✅ บันทึกเวลาทำงานสำเร็จ");
      // Update the displayed times with the new values and switch back to view mode
      fields.forEach((field) => {
        const input = document.getElementById(field.id + "-input");
        const span = document.getElementById(field.id);
        if (updates[field.fieldName]) {
          span.textContent = input.value; // แสดงเวลาแบบ 24 ชั่วโมง
        }
      });
      toggleEditStaffSchedule(staffId); // Switch back to view mode
    } else {
      alert("❌ " + result.message);
      // Revert to original values and switch back to view mode
      fields.forEach((field) => {
        const span = document.getElementById(field.id);
        span.textContent = span.getAttribute("data-original-value");
      });
      toggleEditStaffSchedule(staffId); // Switch back to view mode
    }
  } catch (error) {
    console.error("Error saving staff schedule:", error);
    alert("❌ เกิดข้อผิดพลาดในการบันทึกเวลาทำงาน");
    toggleEditStaffSchedule(staffId); // Switch back to view mode
  }
}

/**
 * Open Assign Room Modal for Staff
 */
let selectedStaffIdForRoom = null;
let selectedRoomIdForStaff = null;

async function openAssignRoomModalForStaff(staffId) {
  selectedStaffIdForRoom = staffId;

  try {
    const response = await fetch(
      `${API_BASE_URL}/manage_staff_status.php?action=available_rooms`
    );
    const result = await response.json();

    if (result.success) {
      const rooms = result.data;

      let html = `
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 600;">เลือกห้อง:</label>
                    <div style="max-height: 300px; overflow-y: auto; display: grid; gap: 10px;">
            `;

      rooms.forEach((room) => {
        html += `
                    <div class="room-select-item" onclick="selectRoomForStaff(${room.room_id})" style="padding: 12px; border: 2px solid #e9ecef; border-radius: 10px; cursor: pointer; transition: all 0.3s;">
                        <div style="font-weight: bold; margin-bottom: 5px;">${room.room_name}</div>
                        <div style="font-size: 0.85em; color: var(--text-light);">
                            ${room.station_name} | พนักงาน: ${room.staff_count} คน
                        </div>
                    </div>
                `;
      });

      html += `
                    </div>
                </div>
                <button class="btn btn-success" style="width: 100%;" onclick="assignRoomToStaff()">
                    <i class="fas fa-check"></i> ยืนยัน
                </button>
            `;

      document.getElementById("addStaffModalContent").innerHTML = html;
      document.getElementById("addStaffModal").style.display = "block";

      // Add hover effect
      setTimeout(() => {
        document.querySelectorAll(".room-select-item").forEach((item) => {
          item.addEventListener("mouseenter", function () {
            this.style.borderColor = "#0056B3";
            this.style.background = "rgba(0, 86, 179, 0.05)";
          });
          item.addEventListener("mouseleave", function () {
            if (!this.classList.contains("selected")) {
              this.style.borderColor = "#e9ecef";
              this.style.background = "transparent";
            }
          });
        });
      }, 100);
    } else {
      alert("❌ เกิดข้อผิดพลาด: " + result.message);
    }
  } catch (error) {
    console.error("Error loading rooms:", error);
    alert("❌ ไม่สามารถโหลดรายการห้องได้");
  }
}

/**
 * Select Room for Staff
 */
function selectRoomForStaff(roomId) {
  selectedRoomIdForStaff = roomId;

  document.querySelectorAll(".room-select-item").forEach((item) => {
    item.classList.remove("selected");
    item.style.borderColor = "#e9ecef";
    item.style.background = "transparent";
  });

  event.target.closest(".room-select-item").classList.add("selected");
  event.target.closest(".room-select-item").style.borderColor = "#0056B3";
  event.target.closest(".room-select-item").style.background =
    "rgba(0, 86, 179, 0.1)";
}

/**
 * Assign Room to Staff
 */
async function assignRoomToStaff() {
  if (!selectedRoomIdForStaff) {
    alert("กรุณาเลือกห้อง");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/manage_staff_status.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "assign_room",
        staff_id: selectedStaffIdForRoom,
        room_id: selectedRoomIdForStaff,
      }),
    });

    const result = await response.json();

    if (result.success) {
      alert("✅ กำหนดห้องสำเร็จ");
      closeAddStaffModal();
      // Reload station detail
      if (currentStationId) {
        openStationDetail(currentStationId);
      }
    } else {
      alert("❌ เกิดข้อผิดพลาด: " + result.message);
    }
  } catch (error) {
    console.error("Error assigning room:", error);
    alert("❌ ไม่สามารถกำหนดห้องได้");
  }
}

/**
 * Unassign All Rooms for Staff
 */
async function unassignAllRoomsForStaff(staffId) {
  if (!confirm("ต้องการยกเลิกการกำหนดห้องทั้งหมดของพนักงานคนนี้หรือไม่?")) {
    return;
  }

  try {
    // We need to get all room assignments and remove them
    // For simplicity, we'll use room_id = 0 as a signal to remove all
    const response = await fetch(`${API_BASE_URL}/manage_staff_status.php`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "unassign_room",
        staff_id: staffId,
        room_id: 0, // Special value to indicate "all rooms"
      }),
    });

    const result = await response.json();

    if (result.success) {
      alert("✅ ยกเลิกการกำหนดห้องสำเร็จ");
      // Reload station detail
      if (currentStationId) {
        openStationDetail(currentStationId);
      }
    } else {
      alert("❌ เกิดข้อผิดพลาด: " + result.message);
    }
  } catch (error) {
    console.error("Error unassigning rooms:", error);
    alert("❌ ไม่สามารถยกเลิกการกำหนดห้องได้");
  }
}

/**
 * Render the list of staff cards.
 */
function renderStaffList(staffList) {
  const container = document.getElementById("staffListContainer");
  if (staffList.length === 0) {
    container.innerHTML = "<p>ไม่พบข้อมูลพนักงานในสถานีนี้</p>";
    return;
  }

  container.innerHTML = staffList
    .map((staff) => {
      const statusInfo = {
        available: { label: "ว่าง", color: "#1E8449", icon: "fa-check-circle" },
        working: { label: "ทำงาน", color: "#0056B3", icon: "fa-briefcase" },
        break: { label: "พักเบรก", color: "#C0392B", icon: "fa-coffee" },
      }[staff.status] || {
        label: "ไม่ทราบ",
        color: "#6c757d",
        icon: "fa-question-circle",
      };

      return `
            <div class="staff-card" id="staff-card-${staff.staff_id}">
                <div class="staff-card-header">
                    <div>
                        <div class="staff-name">${staff.staff_name}</div>
                        <div class="staff-role">${staff.staff_type}</div>
                    </div>
                    <div class="staff-status-badge" style="background-color: ${
                      statusInfo.color
                    };">
                        <i class="fas ${statusInfo.icon}"></i> ${
        statusInfo.label
      }
                    </div>
                </div>
                <div class="staff-card-body">
                    <div class="staff-room-info">
                        📍 <strong>ห้องที่ประจำ:</strong> ${
                          staff.assigned_room_name || "-"
                        }
                    </div>
                    <div class="staff-schedule" id="schedule-display-${
                      staff.staff_id
                    }">
                        <div>⏰ <strong>เข้างาน:</strong> <span>${
                          staff.work_start_time
                        }</span></div>
                        <div>🏁 <strong>เลิกงาน:</strong> <span>${
                          staff.work_end_time
                        }</span></div>
                        <div>☕ <strong>พักเบรก:</strong> <span>${
                          staff.break_start_time
                        }</span></div>
                        <div>🔙 <strong>กลับมา:</strong> <span>${
                          staff.break_end_time
                        }</span></div>
                    </div>
                    <div class="staff-schedule-edit" id="schedule-edit-${
                      staff.staff_id
                    }" style="display:none;">
                         <div><label>เข้างาน:</label> <input type="time" value="${
                           staff.work_start_time
                         }"></div>
                         <div><label>เลิกงาน:</label> <input type="time" value="${
                           staff.work_end_time
                         }"></div>
                         <div><label>พักเบรก:</label> <input type="time" value="${
                           staff.break_start_time
                         }"></div>
                         <div><label>กลับมา:</label> <input type="time" value="${
                           staff.break_end_time
                         }"></div>
                    </div>
                </div>
                <div class="staff-card-actions">
                    ${
                      staff.status === "available"
                        ? `<button class="btn btn-primary" onclick="openAssignRoomModal(${staff.staff_id}, '${staff.staff_name}')">กำหนดห้อง</button>`
                        : ""
                    }
                    ${
                      staff.assigned_room_name
                        ? `<button class="btn btn-warning" onclick="unassignRoom(${staff.staff_id})">ยกเลิกห้อง</button>`
                        : ""
                    }
                    <button class="btn btn-secondary" id="edit-btn-${
                      staff.staff_id
                    }" onclick="toggleEditMode(${
        staff.staff_id
      })">แก้ไข</button>
                </div>
            </div>
        `;
    })
    .join("");
}

/**
 * Toggle between display and edit mode for staff schedule.
 */
function toggleEditMode(staffId) {
  const displayDiv = document.getElementById(`schedule-display-${staffId}`);
  const editDiv = document.getElementById(`schedule-edit-${staffId}`);
  const editBtn = document.getElementById(`edit-btn-${staffId}`);

  if (editDiv.style.display === "none") {
    displayDiv.style.display = "none";
    editDiv.style.display = "grid";
    editBtn.textContent = "บันทึก";
    editBtn.classList.replace("btn-secondary", "btn-success");
  } else {
    // Save data
    const inputs = editDiv.querySelectorAll('input[type="time"]');
    const schedule = {
      work_start_time: inputs[0].value,
      work_end_time: inputs[1].value,
      break_start_time: inputs[2].value,
      break_end_time: inputs[3].value,
    };
    updateStaffSchedule(staffId, schedule);

    displayDiv.style.display = "grid";
    editDiv.style.display = "none";
    editBtn.textContent = "แก้ไข";
    editBtn.classList.replace("btn-success", "btn-secondary");
  }
}

/**
 * Send schedule update to the server.
 */
async function updateStaffSchedule(staffId, schedule) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/manage_staff_status.php?action=update_schedule`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_staff_id: staffId, ...schedule }),
      }
    );
    const result = await response.json();
    if (result.success) {
      alert("บันทึกเวลาทำงานสำเร็จ");
      loadStaffStatus(currentStationId);
    } else {
      alert(`เกิดข้อผิดพลาด: ${result.message}`);
    }
  } catch (error) {
    console.error("Error updating schedule:", error);
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
  }
}

/**
 * Open modal to assign a room to a staff member.
 */

function closeAssignRoomModal() {
  document.getElementById("assignRoomModal").style.display = "none";
}

/**
 * Confirm and execute room assignment.
 */
async function assignRoomConfirmed() {
  const staffId = document.getElementById("staffToAssignId").value;
  const roomId = document.getElementById("roomSelect").value;

  if (!roomId) {
    alert("กรุณาเลือกห้อง");
    return;
  }

  // Ensure staffId is not empty and is a valid number
  const staffIdInt = parseInt(staffId);
  if (isNaN(staffIdInt) || staffIdInt <= 0) {
    alert("❌ Staff ID ไม่ถูกต้อง");
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/manage_staff_status.php?action=assign_room`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id: staffIdInt, room_id: roomId }),
      }
    );
    const result = await response.json();
    if (result.success) {
      alert("กำหนดห้องสำเร็จ");
      closeAssignRoomModal();
      loadStaffStatus(currentStationId);
    } else {
      alert(`เกิดข้อผิดพลาด: ${result.message}`);
    }
  } catch (error) {
    console.error("Error assigning room:", error);
  }
}

/**
 * Unassign a room from a staff member.
 */
async function unassignRoom(staffId) {
  if (!confirm("คุณต้องการยกเลิกการกำหนดห้องสำหรับพนักงานคนนี้ใช่หรือไม่?"))
    return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/manage_staff_status.php?action=unassign_room`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id: staffId }),
      }
    );
    const result = await response.json();
    if (result.success) {
      alert("ยกเลิกการกำหนดห้องสำเร็จ");
      loadStaffStatus(currentStationId);
    } else {
      alert(`เกิดข้อผิดพลาด: ${result.message}`);
    }
  } catch (error) {
    console.error("Error unassigning room:", error);
  }
}

// Modify the existing switchStationTab function to handle the new tab
const originalSwitchStationTab = window.switchStationTab;
window.switchStationTab = function (tabName) {
  // Call the original function if it exists, for other tabs
  if (
    typeof originalSwitchStationTab === "function" &&
    tabName !== "StaffStatus"
  ) {
    originalSwitchStationTab(tabName);
    return;
  }

  // Handle all tabs within this modal
  ["Rooms", "Staff", "Doctors", "Procedures", "Patients"].forEach((tab) => {
    const content = document.getElementById(`station${tab}Content`);
    const button = document.querySelector(
      `button[onclick="switchStationTab('${tab}')"]`
    );
    if (content) content.style.display = "none";
    if (button) button.classList.remove("active");
  });

  const activeContent = document.getElementById(`station${tabName}Content`);
  const activeButton = document.querySelector(
    `button[onclick="switchStationTab('${tabName}')"]`
  );
  if (activeContent) activeContent.style.display = "block";
  if (activeButton) activeButton.classList.add("active");

  // Load data for the new tab when it's clicked
};
/**
 * Load and display staff for station
 */
async function loadStationStaff(stationId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/get_station_staff.php?station_id=${stationId}`
    );
    const result = await response.json();

    if (result.success) {
      // ✅ ใช้ displayStaffWithSchedule ที่มี stats
      displayStaffWithSchedule(result.data.staff, result.data.stats);
    } else {
      console.error("Failed to load station staff:", result.message);
      // ✅ Fallback: ยังคงมีปุ่มเพิ่มพนักงาน
      displayStationStaffSimple(result.data?.staff || []);
    }
  } catch (error) {
    console.error("Error loading station staff:", error);
    // ✅ Fallback: ยังคงมีปุ่มเพิ่มพนักงาน
    displayStationStaffSimple([]);
  }
}
/**
 * ✅ Helper: ตรวจสอบว่าพนักงานทำ OT หรือไม่
 * - OT = work_end_time > 17:00 หรือ work_start_time < 08:00
 * - Daily/OT = staff_type == 'Daily/OT'
 */
function isOvertimeStaff(staff) {
  // ✅ Check staff_type ONLY
  if (!staff || !staff.staff_type) {
    return false;
  }

  const staffType = staff.staff_type.trim().toUpperCase();

  // ✅ Only return true for Daily/OT or OT types
  return staffType === "DAILY/OT" || staffType === "OT";
}

/**
 * ✅ NEW: สร้าง OT Badge
 */
function getOTBadge(staff) {
  if (!isOvertimeStaff(staff)) {
    return ""; // ไม่มี badge ถ้า staff_type ไม่ใช่ OT
  }

  // ✅ OT Badge
  return `
        <span style="
            display: inline-block;
            background: linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            margin-left: 8px;
            box-shadow: 0 2px 6px rgba(255, 107, 107, 0.3);
            animation: pulse-ot 2s infinite;
        ">
            ⏱️ OT
        </span>
    `;
}

/**
 * Display staff with editable schedule like in image 1
 */

async function displayStaffWithSchedule(staffList, stats) {
  const container = document.getElementById("stationStaffContent");

  if (staffList.length === 0) {
    container.innerHTML = `
             <div style="text-align: center; padding: 40px; color: #adb5bd;">
                <i class="fas fa-users" style="font-size: 48px; margin-bottom: 15px;"></i>
                <div style="margin-bottom: 20px;">ไม่มีพนักงานในวันนี้</div>
                <div style="display: flex; justify-content: center; gap: 10px;">
                    <button onclick="showMonthlyStaffImportModal(${currentStationId})"
                            style="background: #0056B3; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">
                        <i class="fas fa-file-excel"></i> นำเข้า Excel
                    </button>
                    <button onclick="showDailyStaffAddModal(${currentStationId})"
                            style="background: #6c757d; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">
                        <i class="fas fa-user-plus"></i> วัน/OT
                    </button>
                </div>
            </div>
        `;
    return;
  }

  let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 10px;">
            <h3 style="margin: 0; font-size: 15px;">👥 พนักงาน (${staffList.length} คน)</h3>
            <div style="display: flex; gap: 8px;">
                <button onclick="showMonthlyStaffImportModal(${currentStationId})"
                        style="background: #0056B3; color: white; border: none; padding: 7px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">
                    <i class="fas fa-file-excel"></i> Excel
                </button>
                <button onclick="showDailyStaffAddModal(${currentStationId})"
                        style="background: #6c757d; color: white; border: none; padding: 7px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">
                    <i class="fas fa-user-plus"></i> วัน/OT
                </button>
            </div>
        </div>

        <div style="display: grid; gap: 8px;">
    `;

  const now = new Date();
  const currentTime =
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0");

  staffList.forEach((staff) => {
    const workStart = formatTime24Hour(staff.work_start_time);
    const workEnd = formatTime24Hour(staff.work_end_time);
    const breakStart = formatTime24Hour(staff.break_start_time);
    const breakEnd = formatTime24Hour(staff.break_end_time);
    const roomName = staff.room_name || "-";

    // ✅ ตรวจสอบว่ามี room ที่ assign หรือไม่
    const hasAssignedRoom = staff.room_id || staff.assigned_room_id;

    // ✅ สร้างตัวแปรตรวจสอบห้อง (รองรับทั้ง room_id และ assigned_room_id)
    const hasRoom = staff.room_id || staff.assigned_room_id;

    // กำหนด status และสี
    let status, statusColor, statusIcon, statusText, statusBgColor;

    const currentTimeShort = currentTime.substring(0, 5);

    if (currentTimeShort < workStart) {
      status = "waiting_to_start";
      statusColor = "#FFC107";
      statusIcon = "fa-hourglass-start";
      statusText = "รอเข้างาน";
      statusBgColor = "rgba(255, 193, 7, 0.1)";
    } else if (currentTimeShort >= breakStart && currentTimeShort < breakEnd) {
      status = "on_break";
      statusColor = "#D68910";
      statusIcon = "fa-coffee";
      statusText = "พักเบรค";
      statusBgColor = "rgba(214, 137, 16, 0.1)";
    } else if (currentTimeShort >= workEnd && hasRoom) {
      status = "overtime";
      statusColor = "#9C27B0";
      statusIcon = "fa-clock";
      statusText = "ทำ OT";
      statusBgColor = "rgba(156, 39, 176, 0.1)";
    } else if (
      hasRoom &&
      currentTimeShort >= workStart &&
      currentTimeShort < workEnd
    ) {
      status = "working";
      statusColor = "#0056B3";
      statusIcon = "fa-briefcase";
      statusText = "ทำงาน";
      statusBgColor = "rgba(0, 86, 179, 0.1)";
    } else if (
      !hasRoom &&
      currentTimeShort >= workStart &&
      currentTimeShort < workEnd
    ) {
      status = "available";
      statusColor = "#1E8449";
      statusIcon = "fa-check-circle";
      statusText = "ว่าง";
      statusBgColor = "rgba(30, 132, 73, 0.1)";
    } else if (currentTimeShort >= workEnd && !hasRoom) {
      status = "off_duty";
      statusColor = "#6c757d";
      statusIcon = "fa-power-off";
      statusText = "เลิกงาน";
      statusBgColor = "rgba(108, 117, 125, 0.1)";
    } else {
      status = "available";
      statusColor = "#1E8449";
      statusIcon = "fa-check-circle";
      statusText = "ว่าง";
      statusBgColor = "rgba(30, 132, 73, 0.1)";
    }

    // ✅ ข้อมูลห้อง (รองรับ room_id และ assigned_room_id)
    const roomInfo =
      staff.room_id || staff.assigned_room_id
        ? `
            <div style="font-size: 11px; color: #0056B3; margin: 3px 0; font-weight: 600;">
                🚪 ${
                  staff.room_name ||
                  "Room " + (staff.room_id || staff.assigned_room_id)
                }
            </div>
        `
        : "";

    // ✅ ปุ่มแอด/ลบห้อง
    let roomButtonHtml = "";
    if (hasRoom) {
      // ถ้ามีห้องแล้ว แสดงปุ่มลบ
      roomButtonHtml = `
                <button 
                    onclick="removeStaffFromRoom(${staff.station_staff_id}, '${
        staff.staff_name
      }', '${staff.room_name || roomName}')"
                    style="
                        background: #6C757D;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        white-space: nowrap;
                        flex-shrink: 0;
                        transition: all 0.2s;
                    "
                    onmouseover="this.style.background='#5a6268'"
                    onmouseout="this.style.background='#6C757D'"
                    title="ลบพนักงานออกจากห้อง"
                >
                    <i class="fas fa-times"></i> ลบห้อง
                </button>
            `;
    } else {
      // ถ้าไม่มีห้อง แสดงปุ่มแอด
      roomButtonHtml = `
                <button 
                    onclick="openAssignRoomToStaffModal(${staff.station_staff_id}, '${staff.staff_name}')"
                    style="
                        background: #17A2B8;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        white-space: nowrap;
                        flex-shrink: 0;
                        transition: all 0.2s;
                    "
                    onmouseover="this.style.background='#138496'"
                    onmouseout="this.style.background='#17A2B8'"
                    title="แอดพนักงานเข้าห้อง"
                >
                    <i class="fas fa-door-open"></i> แอดห้อง
                </button>
            `;
    }

    html += `
            <div style="
                display: flex;
                align-items: center;
                gap: 12px;
                border-left: 3px solid ${statusColor};
                background: ${statusBgColor};
                border-radius: 8px;
                padding: 10px;
                box-shadow: 0 1px 4px rgba(0,0,0,0.08);
            ">
                <!-- ชื่อและประเภท -->
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 700; font-size: 13px; color: #212529; margin-bottom: 2px;">
                        ${staff.staff_name}
                    </div>
                    <div style="font-size: 10px; color: #adb5bd;">
                        ${staff.staff_type || "พนักงาน"}
                    </div>
                    ${roomInfo}
                </div>

                <!-- เวลาทำงาน -->
                <div style="display: flex; align-items: center; gap: 8px; font-size: 11px;">
                    <div style="text-align: center;">
                        <div style="color: #6c757d; font-size: 9px;">เข้า</div>
                        <div style="font-weight: 700; color: #0056B3;">${workStart}</div>
                    </div>
                    <div>-</div>
                    <div style="text-align: center;">
                        <div style="color: #6c757d; font-size: 9px;">ออก</div>
                        <div style="font-weight: 700; color: #C0392B;">${workEnd}</div>
                    </div>
                </div>

                <!-- สถานะ Badge -->
                <span style="
                    background: ${statusColor};
                    color: white;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 600;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">
                    <i class="fas ${statusIcon}" style="margin-right: 3px;"></i>${statusText}
                </span>

                <!-- ปุ่มแอด/ลบห้อง -->
                ${roomButtonHtml}
                
                <!-- ปุ่มแก้ไข -->
                <button 
                    onclick="openEditStaffScheduleModal('${
                      staff.station_staff_id
                    }', '${staff.staff_name}', '${staff.work_start_time}', '${
      staff.break_start_time
    }', '${staff.break_end_time}', '${staff.work_end_time}')"
                    style="
                        background: #0056B3;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        white-space: nowrap;
                        flex-shrink: 0;
                        transition: all 0.2s;
                    "
                    onmouseover="this.style.background='#003d82'"
                    onmouseout="this.style.background='#0056B3'"
                >
                    <i class="fas fa-edit" style="margin-right: 4px;"></i>แก้ไข
                </button>
            </div>
        `;
  });

  html += "</div>";
  container.innerHTML = html;

  console.log("✅ displayStaffWithSchedule สำเร็จ");
}

async function openAssignRoomToStaffModal(stationStaffId, staffName) {
  try {
    console.log(
      `🏥 เปิด Modal แอดห้อง - staff_id: ${stationStaffId}, name: ${staffName}`
    );

    if (!currentStationId) {
      Swal.fire("ข้อผิดพลาด", "ไม่พบข้อมูล station", "error");
      return;
    }

    // ✅ ดึงห้องของ station นี้เท่านั้น
    const roomsResponse = await fetch(
      getApiUrl("get_station_rooms.php") + `?station_id=${currentStationId}`
    );

    if (!roomsResponse.ok) {
      throw new Error(`HTTP ${roomsResponse.status}`);
    }

    const roomsResult = await roomsResponse.json();

    if (!roomsResult.success) {
      throw new Error(roomsResult.message || "ไม่สามารถดึงข้อมูลห้อง");
    }

    const rooms = roomsResult.data || [];

    console.log(`✅ พบห้อง: ${rooms.length} ห้อง`);

    if (rooms.length === 0) {
      Swal.fire({
        title: "ไม่มีห้อง",
        text: "ยังไม่มีห้องในสถานีนี้",
        icon: "info",
        confirmButtonColor: "#0056B3",
      });
      return;
    }

    // ✅ สร้าง dropdown options
    let roomOptions = '<option value="">-- เลือกห้อง --</option>';

    rooms.forEach((room) => {
      const roomNum = room.room_number || room.room_id;
      const roomName = room.room_name || `ห้อง ${roomNum}`;

      roomOptions += `
                <option value="${room.room_id}">
                    ${roomNum} - ${roomName}
                </option>
            `;
    });

    // ✅ เปิด Modal
    const { value: roomId } = await Swal.fire({
      title: `🚪 แอดห้องให้พนักงาน`,
      html: `
                <div style="text-align: left; padding: 10px;">
                    <div style="
                        background: linear-gradient(135deg, #0056B3 0%, #0047AB 100%);
                        color: white;
                        padding: 16px;
                        border-radius: 10px;
                        margin-bottom: 20px;
                        text-align: center;
                    ">
                        <div style="font-size: 14px; opacity: 0.9;">พนักงาน</div>
                        <div style="font-size: 18px; font-weight: 700; margin-top: 4px;">
                            👤 ${staffName}
                        </div>
                    </div>
                    
                    <label style="font-weight: 600; display: block; margin-bottom: 8px; color: #212529;">
                        เลือกห้อง (จาก Station นี้) *
                    </label>
                    <select id="assignRoomSelect" style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #ced4da;
                        border-radius: 8px;
                        font-size: 14px;
                        background: white;
                        cursor: pointer;
                    ">
                        ${roomOptions}
                    </select>
                    
                    <div style="
                        color: #6c757d;
                        font-size: 12px;
                        margin-top: 8px;
                    ">
                        📌 มี ${rooms.length} ห้องให้เลือก
                    </div>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "✅ แอดห้อง",
      cancelButtonText: "❌ ยกเลิก",
      confirmButtonColor: "#1E8449",
      cancelButtonColor: "#6c757d",
      preConfirm: () => {
        const select = document.getElementById("assignRoomSelect");
        if (!select || !select.value) {
          Swal.showValidationMessage("โปรดเลือกห้อง");
          return false;
        }
        return select.value;
      },
    });

    if (roomId) {
      console.log(`📤 แอดพนักงานเข้าห้อง ${roomId}`);
      await assignStaffToRoomFromStaffTab(stationStaffId, roomId, staffName);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      text: error.message,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}

async function assignStaffToRoomFromStaffTab(
  stationStaffId,
  roomId,
  staffName
) {
  try {
    console.log(`📝 บันทึกข้อมูล:`, {
      station_staff_id: stationStaffId,
      room_id: roomId,
      staff_name: staffName,
    });

    Swal.fire({
      title: "กำลังบันทึก...",
      html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #0056B3; margin-top: 12px;"></i>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    // ✅ ส่ง request
    const response = await fetch(`${API_BASE_URL}/manage_room_staff.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add",
        station_staff_id: stationStaffId,
        room_id: parseInt(roomId),
        staff_name: staffName,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ ผลลัพธ์:", result);

    if (result.success) {
      Swal.fire({
        title: "✅ แอดสำเร็จ",
        html: `
                    <div style="text-align: left; padding: 15px;">
                        <p>✅ แอดพนักงาน</p>
                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 10px 0; font-size: 13px;">
                            👤 <strong>${staffName}</strong><br>
                            🚪 เข้าห้อง <strong>${
                              result.data.room_name || "Room " + roomId
                            }</strong>
                        </div>
                    </div>
                `,
        icon: "success",
        confirmButtonColor: "#1E8449",
      });

      // ✅ รีเฟรชข้อมูล
      openStationDetail(currentStationId);
    } else {
      throw new Error(result.message || "ไม่สามารถแอดได้");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      text: error.message,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}

/**
 * ✅ NEW: เพิ่ม CSS animation สำหรับ OT Badge
 */
function addOTBadgeStyles() {
  if (document.getElementById("ot-badge-styles")) return;

  const style = document.createElement("style");
  style.id = "ot-badge-styles";
  style.textContent = `
        @keyframes pulse-ot {
            0%, 100% {
                box-shadow: 0 2px 6px rgba(255, 107, 107, 0.3);
                transform: scale(1);
            }
            50% {
                box-shadow: 0 2px 12px rgba(255, 107, 107, 0.6);
                transform: scale(1.05);
            }
        }
    `;
  document.head.appendChild(style);
}

// Helper functions for status display
function getStatusColor(status) {
  const colors = {
    available: "#1E8449",
    working: "#0056B3",
    break: "#D68910",
    offline: "#6c757d",
  };
  return colors[status] || "#6c757d";
}

function getStatusIcon(status) {
  const icons = {
    available: "fa-check-circle",
    working: "fa-briefcase",
    break: "fa-coffee",
    offline: "fa-power-off",
  };
  return icons[status] || "fa-question-circle";
}

function getStatusText(status) {
  const texts = {
    available: "ว่าง",
    working: "ทำงาน",
    break: "พักเบรก",
    offline: "ไม่ได้ทำงาน",
  };
  return texts[status] || "ไม่ทราบสถานะ";
}

// Helper functions for status display
function getStatusColor(status) {
  const colors = {
    waiting_to_start: "#FFC107", // 🟡 รอเข้างาน
    available: "#1E8449", // 🟢 ว่าง
    working: "#0056B3", // 🔵 ทำงาน
    on_break: "#D68910", // 🟠 พักเบรค
    overtime: "#9C27B0", // 🟣 ทำ OT
    offline: "#6c757d", // ⚫ เลิกงาน
  };
  return colors[status] || "#6c757d";
}

function getStatusIcon(status) {
  const icons = {
    waiting_to_start: "fa-clock",
    available: "fa-check-circle",
    working: "fa-briefcase",
    on_break: "fa-coffee",
    overtime: "fa-hourglass-half",
    offline: "fa-power-off",
  };
  return icons[status] || "fa-question-circle";
}

function getStatusText(status) {
  const texts = {
    waiting_to_start: "รอเข้างาน",
    available: "ว่าง",
    working: "ทำงาน",
    on_break: "พักเบรค",
    overtime: "ทำ OT",
    offline: "เลิกงาน",
  };
  return texts[status] || "ไม่ทราบสถานะ";
}
/**
 * Update staff working time
 */
async function updateStaffTime(staffId, field, value) {
  try {
    const response = await fetch(`${API_BASE_URL}/update_staff_schedule.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: staffId,
        field: field,
        value: value + ":00", // Convert to SQL time format
      }),
    });

    const result = await response.json();
    if (!result.success) {
      alert("❌ " + result.message);
    }
  } catch (error) {
    console.error("Error updating staff time:", error);
    alert("❌ เกิดข้อผิดพลาดในการอัพเดทเวลา");
  }
}

/**
 * Confirm room assignment
 */
async function confirmAssignRoom(staffId) {
  const roomSelect = document.getElementById("roomSelect");
  const roomId = roomSelect.value;

  if (!roomId) {
    alert("กรุณาเลือกห้อง");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/assign_staff_room.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: staffId,
        room_id: roomId,
      }),
    });

    const result = await response.json();
    if (result.success) {
      alert("✅ กำหนดห้องสำเร็จ");
      closeAddStaffModal();
      loadStationStaff(currentStationId);
    } else {
      alert("❌ " + result.message);
    }
  } catch (error) {
    console.error("Error assigning room:", error);
    alert("❌ เกิดข้อผิดพลาดในการกำหนดห้อง");
  }
}

/**
 * Toggle staff active status
 */
async function toggleStaffStatus(staffId) {
  try {
    const response = await fetch(`${API_BASE_URL}/toggle_staff_status.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: staffId }),
    });

    const result = await response.json();
    if (result.success) {
      loadStationStaff(currentStationId);
    } else {
      alert("❌ " + result.message);
    }
  } catch (error) {
    console.error("Error toggling staff status:", error);
    alert("❌ เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
  }
}

/**
 * Remove staff from station
 */
async function removeStaffFromStation(staffId, staffName) {
  if (!confirm(`ต้องการลบพนักงาน "${staffName}" ออกจากสถานีนี้ใช่หรือไม่?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/remove_staff.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: staffId }),
    });

    const result = await response.json();
    if (result.success) {
      alert("✅ ลบพนักงานสำเร็จ");
      loadStationStaff(currentStationId);
    } else {
      alert("❌ " + result.message);
    }
  } catch (error) {
    console.error("Error removing staff:", error);
    alert("❌ เกิดข้อผิดพลาดในการลบพนักงาน");
  }
}

/**
 * Add staff to station
 */
async function addStaffToStation(stationId) {
  // เปิด modal สำหรับเพิ่มพนักงานใหม่
  const modalContent = document.getElementById("addStaffModalContent");
  modalContent.innerHTML = `
        <div style="padding: 20px;">
            <h4>เพิ่มพนักงานใหม่เข้าสู่สถานี</h4>
            <div class="form-group">
                <label class="form-label">เลขที่พนักงาน (Staff ID):</label>
                <input type="number" id="newStaffIdInput" class="form-control" placeholder="กรอกเลขที่พนักงาน">
            </div>
            <div class="form-group">
                <label class="form-label">ชื่อพนักงาน (สำหรับแสดงผล):</label>
                <input type="text" id="newStaffNameInput" class="form-control" placeholder="กรอกชื่อ-สกุล">
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button class="btn" onclick="closeAddStaffModal()">ยกเลิก</button>
                <button class="btn btn-success" onclick="confirmAddStaffToStation()">เพิ่มพนักงาน</button>
            </div>
        </div>
    `;

  document.getElementById("addStaffModal").style.display = "block";
}

async function confirmAddStaffToStation() {
  const staffId = document.getElementById("newStaffIdInput").value.trim();
  const staffName = document.getElementById("newStaffNameInput").value.trim();

  if (!staffId || !staffName) {
    alert("กรุณากรอกทั้งเลขที่พนักงานและชื่อพนักงาน");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/manage_station_staff.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add",
        station_id: currentStationId,
        staff_id: parseInt(staffId),
        staff_name: staffName,
        staff_type: "พนักงาน", // Default value
      }),
    });

    const result = await response.json();
    if (result.success) {
      alert("✅ เพิ่มพนักงาน ID: " + staffId + " เข้าสู่สถานีสำเร็จ");
      closeAddStaffModal();
      loadStationStaff(currentStationId);
    } else {
      alert("❌ " + result.message);
    }
  } catch (error) {
    console.error("Error adding staff to station:", error);
    alert("❌ เกิดข้อผิดพลาดในการเพิ่มพนักงาน");
  }
}

/**
 * Toggle between display and edit mode
 */
function toggleEditMode(staffId) {
  const displayMode = document.getElementById(`display-mode-${staffId}`);
  const editMode = document.getElementById(`edit-mode-${staffId}`);
  const editBtn = document.getElementById(`edit-btn-${staffId}`);
  const saveBtn = document.getElementById(`save-btn-${staffId}`);
  const cancelBtn = document.getElementById(`cancel-btn-${staffId}`);

  displayMode.style.display = "none";
  editMode.style.display = "grid";
  editBtn.style.display = "none";
  saveBtn.style.display = "block";
  cancelBtn.style.display = "block";
}

/**
 * Cancel edit mode without saving
 */
function cancelEditMode(staffId) {
  const displayMode = document.getElementById(`display-mode-${staffId}`);
  const editMode = document.getElementById(`edit-mode-${staffId}`);
  const editBtn = document.getElementById(`edit-btn-${staffId}`);
  const saveBtn = document.getElementById(`save-btn-${staffId}`);
  const cancelBtn = document.getElementById(`cancel-btn-${staffId}`);

  displayMode.style.display = "block";
  editMode.style.display = "none";
  editBtn.style.display = "block";
  saveBtn.style.display = "none";
  cancelBtn.style.display = "none";
}

/**
 * Save staff schedule changes
 */
async function saveStaffScheduleChanges(staffId) {
  const workStart = document.getElementById(`work-start-${staffId}`).value;
  const workEnd = document.getElementById(`work-end-${staffId}`).value;
  const breakStart = document.getElementById(`break-start-${staffId}`).value;
  const breakEnd = document.getElementById(`break-end-${staffId}`).value;

  // Validation
  if (!workStart || !workEnd || !breakStart || !breakEnd) {
    alert("⚠️ โปรดกรอกเวลาทั้งหมด");
    return;
  }

  // Check time logic
  if (
    workStart >= breakStart ||
    breakStart >= breakEnd ||
    breakEnd >= workEnd
  ) {
    alert(
      "⚠️ ลำดับเวลาไม่ถูกต้อง\nต้องเป็น: เข้างาน < พักเบรก < กลับมา < เลิกงาน"
    );
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/update_staff_schedule.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: staffId,
        updates: {
          work_start_time: workStart + ":00",
          work_end_time: workEnd + ":00",
          break_start_time: breakStart + ":00",
          break_end_time: breakEnd + ":00",
        },
      }),
    });

    const result = await response.json();

    if (result.success) {
      Swal.fire({
        title: "สำเร็จ",
        text: "อัปเดตเวลาทำงานสำเร็จ",
        icon: "success",
        confirmButtonText: "ตกลง",
      });

      // อัปเดตเวลาแสดงผล
      const displayMode = document.getElementById(`display-mode-${staffId}`);
      displayMode.innerHTML = `
                <div class="staff-schedule">
                    <div>
                        <span style="font-weight: 600; color: var(--text-light);">🕐 เข้างาน:</span>
                        <span style="font-weight: bold; margin-left: 5px;">${workStart}</span>
                    </div>
                    <div>
                        <span style="font-weight: 600; color: var(--text-light);">🏁 เลิกงาน:</span>
                        <span style="font-weight: bold; margin-left: 5px;">${workEnd}</span>
                    </div>
                    <div>
                        <span style="font-weight: 600; color: var(--text-light);">☕ พักเบรก:</span>
                        <span style="font-weight: bold; margin-left: 5px;">${breakStart}</span>
                    </div>
                    <div>
                        <span style="font-weight: 600; color: var(--text-light);">📙 กลับมา:</span>
                        <span style="font-weight: bold; margin-left: 5px;">${breakEnd}</span>
                    </div>
                </div>
            `;

      cancelEditMode(staffId);
    } else {
      Swal.fire("ข้อผิดพลาด", result.message || "ไม่สามารถอัปเดตเวลา", "error");
    }
  } catch (error) {
    console.error("Error saving schedule:", error);
    Swal.fire("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ASSIGN STAFF TO ROOM - FIXED
// ═══════════════════════════════════════════════════════════════════════════

// 🔧 FIX: openAssignStaffModal - ให้ส่ง station_staff_id ถูกต้อง
async function openAssignStaffModal(roomId) {
  try {
    console.log("🔍 โหลดพนักงานที่พร้อมสำหรับห้อง:", roomId);

    // ✅ ได้วันที่วันนี้ในรูปแบบ yyyy-mm-dd
    const today = new Date();
    const workDate = today.toISOString().split("T")[0];

    const staffResponse = await fetch(
      `${API_BASE_URL}/get_available_staff.php?room_id=${roomId}&work_date=${workDate}`
    );

    if (!staffResponse.ok) {
      throw new Error(
        `HTTP ${staffResponse.status}: ${staffResponse.statusText}`
      );
    }

    const staffResult = await staffResponse.json();
    console.log("✅ ตัวอักษรตอบสนอง:", staffResult);

    if (!staffResult.success) {
      Swal.fire("ข้อผิดพลาด", staffResult.message, "error");
      return;
    }

    const staffList = staffResult.data;
    console.log(`📊 พบพนักงาน ${staffList.length} คน`);

    if (staffList.length === 0) {
      Swal.fire("ไม่มีข้อมูล", "ไม่มีพนักงานที่พร้อมเพิ่มเข้าหลังนี้", "info");
      return;
    }

    // ✅ สร้าง dropdown options พร้อม station_staff_id ที่ถูกต้อง
    let optionsHtml = "";
    staffList.forEach((staff) => {
      // ✅ ตรวจสอบว่า station_staff_id มีค่า
      const stationStaffId = staff.station_staff_id || staff.id;

      if (!stationStaffId) {
        console.warn("⚠️ ไม่มี station_staff_id สำหรับพนักงาน:", staff);
        return; // ข้ามพนักงานนี้
      }

      optionsHtml += `
                <option value="${stationStaffId}" 
                        data-name="${staff.staff_name}"
                        data-staff-id="${staff.staff_id || ""}"
                        data-type="${staff.staff_type || "พนักงาน"}">
                    ${staff.staff_name} • ${staff.staff_type || "พนักงาน"}
                </option>
            `;
    });

    if (optionsHtml === "") {
      Swal.fire("ไม่มีข้อมูล", "ไม่มีพนักงานที่สามารถเพิ่มได้", "warning");
      return;
    }

    // ✅ แสดง modal พร้อมการตั้งค่า modal ที่เหมาะสม
    const modalHtml = `
            <div style="text-align: left; padding: 10px 0;">
                <div style="
                    background: linear-gradient(135deg, #0056B3 0%, #0047AB 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 12px 12px 0 0;
                    margin: -16px -16px 20px -16px;
                    text-align: center;
                ">
                    <div style="font-size: 24px; margin-bottom: 8px;">👥</div>
                    <div style="font-size: 18px; font-weight: 700;">เลือกพนักงาน</div>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
                        มีพนักงานที่พร้อม ${staffList.length} คน
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="
                        font-weight: 700;
                        display: block;
                        margin-bottom: 12px;
                        color: #212529;
                        font-size: 14px;
                    ">
                        เลือกพนักงาน *
                    </label>
                    <select id="staffSelect" style="
                        width: 100%;
                        padding: 14px 16px;
                        border: 2px solid #ced4da;
                        border-radius: 10px;
                        font-size: 15px;
                        font-family: inherit;
                        background: white;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        color: #212529;
                    " onchange="updateStaffInfo()">
                        <option value="">-- เลือกพนักงาน --</option>
                        ${optionsHtml}
                    </select>
                </div>

                <div id="staffInfoCard" style="
                    background: #f8f9fa;
                    padding: 16px;
                    border-radius: 10px;
                    border-left: 4px solid #0056B3;
                    display: none;
                ">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                        <div>
                            <span style="color: #adb5bd; font-weight: 600;">ชื่อ</span><br>
                            <span id="infoName" style="font-weight: 700; color: #212529;"></span>
                        </div>
                        <div>
                            <span style="color: #adb5bd; font-weight: 600;">ตำแหน่ง</span><br>
                            <span id="infoType" style="font-weight: 700; color: #0056B3;"></span>
                        </div>
                    </div>
                </div>
            </div>
        `;

    const { value: selectedStaffId } = await Swal.fire({
      html: modalHtml,
      showCancelButton: true,
      confirmButtonText: "✅ เพิ่มเข้าหลัง",
      cancelButtonText: "❌ ยกเลิก",
      confirmButtonColor: "#1E8449",
      cancelButtonColor: "#adb5bd",
      didOpen: () => {
        // ✅ เก็บ roomId ไว้ใช้ในการเรียก callback
        window.currentRoomIdForStaffAssignment = roomId;
      },
      preConfirm: () => {
        const selectEl = document.getElementById("staffSelect");
        const stationStaffId = selectEl.value;

        if (!stationStaffId || stationStaffId.trim() === "") {
          Swal.showValidationMessage("⚠️ กรุณาเลือกพนักงาน");
          return false;
        }

        // ✅ ตรวจสอบว่า stationStaffId เป็นตัวเลขที่ถูกต้อง
        const staffIdInt = parseInt(stationStaffId, 10);
        if (isNaN(staffIdInt) || staffIdInt < 1) {
          Swal.showValidationMessage("Station Staff ID ไม่ถูกต้อง");
          return false;
        }

        const selectedOption = selectEl.options[selectEl.selectedIndex];

        return {
          station_staff_id: staffIdInt, // ✅ ใช้ตัวเลขที่ถูกต้อง
          staff_id: selectedOption.getAttribute("data-staff-id"),
          staff_name: selectedOption.getAttribute("data-name"),
          staff_type: selectedOption.getAttribute("data-type") || "พนักงาน",
        };
      },
    });

    if (selectedStaffId) {
      console.log("📤 ข้อมูลพนักงานที่เลือก:", selectedStaffId);
      await assignStaffToRoom(
        window.currentRoomIdForStaffAssignment,
        selectedStaffId
      );
    }
  } catch (error) {
    console.error("❌ ข้อผิดพลาด:", error);
    Swal.fire("ข้อผิดพลาด", error.message, "error");
  }
}
/**
 * ✅ ฟังก์ชันช่วยเหลือ: อัปเดตการแสดงข้อมูลพนักงาน
 */
function updateStaffInfo() {
  const selectEl = document.getElementById("staffSelect");
  const infoCard = document.getElementById("staffInfoCard");

  if (selectEl.value) {
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    document.getElementById("infoName").textContent =
      selectedOption.getAttribute("data-name");
    document.getElementById("infoType").textContent =
      selectedOption.getAttribute("data-type");
    infoCard.style.display = "block";
    infoCard.style.animation = "slideIn 0.3s ease-out";
  } else {
    infoCard.style.display = "none";
  }
}
// ✅ FIX: assignStaffToRoom - ส่ง station_staff_id ถูกต้อง
async function assignStaffToRoom(roomId, staffData) {
  // แสดงการโหลด
  Swal.fire({
    title: "กำลังบันทึก...",
    html: '<div style="margin-top: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #0056B3;"></i></div>',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
  });

  try {
    console.log("📝 กำลังเพิ่มพนักงานพร้อมข้อมูล:", staffData);

    // ✅ ใช้ endpoint manage_room_staff.php พร้อม payload ที่เหมาะสม
    const response = await fetch(`${API_BASE_URL}/manage_room_staff.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add",
        room_id: roomId,
        station_staff_id: staffData.station_staff_id, // ✅ ต้องส่งค่านี้
        staff_name: staffData.staff_name,
        staff_type: staffData.staff_type,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ ตัวอักษรตอบสนอง API:", result);

    if (result.success) {
      await Swal.fire({
        icon: "success",
        title: "สำเร็จ! 🎉",
        html: `
                    <div style="text-align: left; padding: 20px;">
                        <div style="margin-bottom: 12px;">
                            ✅ เพิ่มพนักงาน<br>
                            <span style="font-weight: 700; color: #0056B3; font-size: 16px;">
                                ${staffData.staff_name}
                            </span>
                        </div>
                        <div style="color: #adb5bd; font-size: 13px;">
                            ประเภท: ${staffData.staff_type}
                        </div>
                    </div>
                `,
        confirmButtonColor: "#1E8449",
        confirmButtonText: "ตกลง",
      });

      // ✅ รีเฟรชรายละเอียดห้อง
      openRoomDetail(roomId);

      // ✅ รีเฟรชรายชื่อพนักงานในสถานีย่อย
      if (currentStationId) {
        setTimeout(() => {
          loadStationStaff(currentStationId);
        }, 500);
      }
    } else {
      throw new Error(result.message || "ไม่สามารถเพิ่มพนักงานได้");
    }
  } catch (error) {
    console.error("❌ ข้อผิดพลาดในการเพิ่มพนักงาน:", error);
    Swal.fire({
      icon: "error",
      title: "ข้อผิดพลาด ❌",
      text: error.message || "ไม่สามารถเพิ่มพนักงานได้",
      confirmButtonColor: "#C0392B",
    });
  }
}

// 🎨 Add CSS for animations
const beautifulModalStyle = document.createElement("style");
beautifulModalStyle.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .beautiful-modal {
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
        overflow: hidden;
    }

    .beautiful-modal .swal2-html-container {
        padding: 0 !important;
    }

    .beautiful-btn-confirm {
        background: linear-gradient(135deg, #1E8449 0%, #229954 100%) !important;
        color: white !important;
        font-weight: 700 !important;
        padding: 12px 30px !important;
        border-radius: 10px !important;
        border: none !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3) !important;
    }

    .beautiful-btn-confirm:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4) !important;
    }

    .beautiful-btn-cancel {
        background: linear-gradient(135deg, #adb5bd 0%, #6c757d 100%) !important;
        color: white !important;
        font-weight: 700 !important;
        padding: 12px 30px !important;
        border-radius: 10px !important;
        border: none !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 4px 12px rgba(158, 158, 158, 0.3) !important;
    }

    .beautiful-btn-cancel:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 16px rgba(158, 158, 158, 0.4) !important;
    }

    #staffSelect:focus {
        outline: none;
        border-color: #0056B3 !important;
        box-shadow: 0 0 0 3px rgba(0, 86, 179, 0.1) !important;
    }

    #staffSelect option {
        padding: 12px;
        background: white;
        color: #212529;
    }

    #staffSelect option:checked {
        background: linear-gradient(#0056B3, #0056B3);
        background-color: #0056B3 !important;
        color: white !important;
    }
`;
document.head.appendChild(beautifulModalStyle);
// ═══════════════════════════════════════════════════════════════════════════
// ASSIGN DOCTOR TO ROOM - FIXED
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ✅ เปิด Modal มอบหมายห้องให้แพทย์
 */
async function openAssignDoctorRoomModal(stationDoctorId) {
  try {
    console.log(
      `📋 เปิด Modal มอบหมายห้องให้แพทย์ - station_doctor_id: ${stationDoctorId}`
    );

    // ✅ ดึงข้อมูล doctor
    const doctorUrl =
      getApiUrl("get_doctor_details.php") +
      `?station_doctor_id=${stationDoctorId}&station_id=${currentStationId}`;

    const doctorResponse = await fetch(doctorUrl);

    if (!doctorResponse.ok) {
      throw new Error(`HTTP ${doctorResponse.status}`);
    }

    const responseText = await doctorResponse.text();
    const doctorResult = safeJsonParse(responseText);

    if (!doctorResult || !doctorResult.success) {
      throw new Error(doctorResult?.message || "ไม่สามารถดึงข้อมูลแพทย์");
    }

    const doctor = doctorResult.data;

    console.log(`✅ ดึงข้อมูลแพทย์: ${doctor.doctor_name}`);

    // ✅ ดึงห้องของ STATION นี้เท่านั้น
    const roomsResponse = await fetch(
      `${API_BASE_URL}get_station_rooms.php?station_id=${currentStationId}`
    );

    if (!roomsResponse.ok) {
      throw new Error(`HTTP ${roomsResponse.status}`);
    }

    const roomsResult = await roomsResponse.json();

    if (!roomsResult.success) {
      throw new Error(roomsResult.message || "ไม่สามารถดึงข้อมูลห้อง");
    }

    const rooms = roomsResult.data || [];

    console.log(
      `✅ พบห้อง: ${rooms.length} ห้องของ station ${currentStationId}`
    );

    if (rooms.length === 0) {
      Swal.fire({
        title: "ไม่มีห้อง",
        text: "ไม่พบห้องในสถานีนี้",
        icon: "info",
        confirmButtonColor: "#0056B3",
      });
      return;
    }

    // ✅ สร้าง dropdown options เฉพาะห้องของ station นี้
    let roomOptions = '<option value="">-- เลือกห้อง --</option>';

    rooms.forEach((room) => {
      const roomName = room.room_name || `ห้อง ${room.room_number}`;
      const roomNum = room.room_number || room.room_id;
      roomOptions += `
                <option value="${room.room_id}">
                    ${roomNum} - ${roomName}
                </option>
            `;
    });

    // ✅ เปิด Modal
    const { value: roomId } = await Swal.fire({
      title: `🏥 มอบหมายห้องให้แพทย์`,
      html: `
                <div style="text-align: left; padding: 10px;">
                    <div style="
                        background: linear-gradient(135deg, #0056B3 0%, #0047AB 100%);
                        color: white;
                        padding: 16px;
                        border-radius: 10px;
                        margin-bottom: 20px;
                        text-align: center;
                    ">
                        <div style="font-size: 14px; opacity: 0.9;">แพทย์</div>
                        <div style="font-size: 18px; font-weight: 700; margin-top: 4px;">
                            👨‍⚕️ ${doctor.doctor_name}
                        </div>
                    </div>
                    
                    <label style="font-weight: 600; display: block; margin-bottom: 8px; color: #212529;">
                        เลือกห้อง (จาก Station นี้) *
                    </label>
                    <select id="doctorRoomSelect" style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #ced4da;
                        border-radius: 8px;
                        font-size: 14px;
                        background: white;
                        cursor: pointer;
                    ">
                        ${roomOptions}
                    </select>
                    
                    <div style="
                        color: #6c757d;
                        font-size: 12px;
                        margin-top: 8px;
                    ">
                        📌 มี ${rooms.length} ห้องให้เลือก
                    </div>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "✅ มอบหมาย",
      cancelButtonText: "❌ ยกเลิก",
      confirmButtonColor: "#1E8449",
      cancelButtonColor: "#6c757d",
      preConfirm: () => {
        const select = document.getElementById("doctorRoomSelect");
        if (!select || !select.value) {
          Swal.showValidationMessage("โปรดเลือกห้อง");
          return false;
        }
        return select.value;
      },
    });

    if (roomId) {
      console.log(`📤 มอบหมายห้อง ${roomId} ให้แพทย์ ${doctor.doctor_name}`);
      await assignDoctorToRoomByStationDoctorId(
        stationDoctorId,
        parseInt(roomId),
        doctor.doctor_name
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      text: error.message,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}

/**
 * ✅ มอบหมายห้องให้แพทย์ (อัพเดท assigned_room_id)
 */
async function assignDoctorToRoomByStationDoctorId(
  stationDoctorId,
  roomId,
  doctorName
) {
  try {
    Swal.fire({
      title: "กำลังบันทึก...",
      html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #0056B3;"></i>',
      allowOutsideClick: false,
      showConfirmButton: false,
    });

    // ✅ ส่ง station_doctor_id ไปยัง API
    const response = await fetch(getApiUrl("assign_doctor_to_room.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_doctor_id: stationDoctorId, // ✅ KEY FIX
        room_id: roomId,
        station_id: currentStationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      Swal.fire({
        title: "✅ มอบหมายสำเร็จ",
        text: `มอบหมายห้องให้ ${doctorName} เรียบร้อย`,
        icon: "success",
        confirmButtonColor: "#1E8449",
      });

      // รีโหลดข้อมูลแพทย์
      if (currentStationId) {
        loadDoctorsForStation(currentStationId);
      }
    } else {
      throw new Error(result.message || "ไม่สามารถมอบหมายได้");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      text: error.message,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}
async function openAssignDoctorModal(roomId) {
  try {
    console.log(`📋 เปิด Modal เลือกแพทย์ - room_id: ${roomId}`);

    const today = new Date().toISOString().split("T")[0];

    // ✅ ดึงแพทย์ที่พร้อมใช้ (ยังไม่ได้มอบหมายห้อง)
    const response = await fetch(
      `${API_BASE_URL}get_available_doctors.php?station_id=${currentStationId}&work_date=${today}`
    );

    const result = await response.json();
    console.log("✅ ผลลัพธ์:", result);

    if (!result.success) {
      Swal.fire({
        title: "ข้อผิดพลาด",
        text: result.message || "ไม่สามารถดึงข้อมูลแพทย์",
        icon: "error",
        confirmButtonColor: "#C0392B",
      });
      return;
    }

    const doctorList = result.data || [];
    console.log(`👥 พบแพทย์พร้อมใช้: ${doctorList.length} คน`);

    if (doctorList.length === 0) {
      Swal.fire({
        title: "ไม่มีแพทย์พร้อม",
        text: "ไม่มีแพทย์ที่พร้อมสำหรับมอบหมายห้อง",
        icon: "info",
        confirmButtonColor: "#0056B3",
      });
      return;
    }

    // ✅ สร้าง options สำหรับ dropdown
    let doctorOptions = '<option value="">-- เลือกแพทย์ --</option>';

    doctorList.forEach((doctor) => {
      const workStart = doctor.work_start_time
        ? doctor.work_start_time.substring(0, 5)
        : "08:00";
      const workEnd = doctor.work_end_time
        ? doctor.work_end_time.substring(0, 5)
        : "17:00";

      doctorOptions += `
                <option 
                    value="${doctor.doctor_id}"
                    data-name="${doctor.doctor_name}"
                    data-work-start="${doctor.work_start_time || "08:00:00"}"
                    data-work-end="${doctor.work_end_time || "17:00:00"}"
                    data-break-start="${doctor.break_start_time || "12:00:00"}"
                    data-break-end="${doctor.break_end_time || "13:00:00"}"
                >
                    👨‍⚕️ ${doctor.doctor_name} [${workStart}-${workEnd}]
                </option>
            `;
    });

    // ✅ เปิด Modal
    const { value: doctorData } = await Swal.fire({
      title: "👨‍⚕️ เลือกแพทย์เข้าห้อง",
      html: `
                <div style="text-align: left; padding: 20px;">
                    <label style="
                        font-weight: 700; 
                        display: block; 
                        margin-bottom: 12px;
                        color: #212529;
                        font-size: 14px;
                    ">
                        เลือกแพทย์ที่ต้องการเพิ่ม *
                    </label>
                    <select 
                        id="doctorSelect" 
                        style="
                            width: 100%;
                            padding: 12px 14px;
                            border: 2px solid #ced4da;
                            border-radius: 8px;
                            font-size: 14px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                        onchange="updateDoctorInfo()">
                        ${doctorOptions}
                    </select>
                    
                    <div id="doctorInfoCard" style="
                        display: none;
                        background: #f8f9fa;
                        padding: 14px;
                        border-radius: 8px;
                        border-left: 4px solid #0056B3;
                        margin-top: 15px;
                    ">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                            <div>
                                <span style="color: #6c757d; font-weight: 600;">ชื่อ</span><br>
                                <span id="infoName" style="font-weight: 700; color: #212529;"></span>
                            </div>
                            <div>
                                <span style="color: #6c757d; font-weight: 600;">เวลาทำงาน</span><br>
                                <span id="infoTime" style="font-weight: 700; color: #0056B3;"></span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "✅ เพิ่มแพทย์",
      cancelButtonText: "❌ ยกเลิก",
      confirmButtonColor: "#1E8449",
      cancelButtonColor: "#6c757d",
      didOpen: () => {
        // ✅ เพิ่ม event listener
        const select = document.getElementById("doctorSelect");
        if (select) {
          select.addEventListener("change", updateDoctorInfo);
        }
      },
      preConfirm: () => {
        const select = document.getElementById("doctorSelect");
        const doctorId = select.value;

        if (!doctorId) {
          Swal.showValidationMessage("⚠️ กรุณาเลือกแพทย์");
          return false;
        }

        const selectedOption = select.options[select.selectedIndex];

        return {
          doctor_id: parseInt(doctorId, 10),
          doctor_name: selectedOption.getAttribute("data-name"),
          work_start_time: selectedOption.getAttribute("data-work-start"),
          work_end_time: selectedOption.getAttribute("data-work-end"),
          break_start_time: selectedOption.getAttribute("data-break-start"),
          break_end_time: selectedOption.getAttribute("data-break-end"),
        };
      },
    });

    // ✅ ถ้าเลือกแพทย์ให้เพิ่มเข้าห้อง
    if (doctorData) {
      console.log("📤 ส่งข้อมูลแพทย์:", doctorData);
      await assignDoctorToRoom(roomId, doctorData);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      text: error.message,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}

/**
 * ✅ มอบหมายห้องให้แพทย์
 */
async function assignDoctorToRoom(doctorId, roomId, doctorName) {
  try {
    Swal.fire({
      title: "กำลังบันทึก...",
      html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #0056B3; margin-top: 12px;"></i>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    const response = await fetch(`${API_BASE_URL}assign_doctor_to_room.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctor_id: doctorId,
        room_id: roomId,
        station_id: currentStationId,
      }),
    });

    const result = await response.json();

    if (result.success) {
      Swal.fire({
        title: "✅ สำเร็จ",
        text: `มอบหมายห้องให้ ${doctorName} เรียบร้อย`,
        icon: "success",
        confirmButtonColor: "#1E8449",
      });

      loadDoctorsForStation(currentStationId);
    } else {
      throw new Error(result.message || "ไม่สามารถมอบหมายได้");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire("❌ เกิดข้อผิดพลาด", error.message, "error");
  }
}
/**
 * ✅ ยกเลิกการมอบหมายห้อง
 */
async function unassignDoctorRoom(stationDoctorId) {
  const confirm = await Swal.fire({
    title: "⚠️ ยืนยันการยกเลิก",
    text: "คุณต้องการยกเลิกการมอบหมายห้องให้แพทย์นี้หรือไม่?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "✅ ยกเลิก",
    cancelButtonText: "❌ ไม่",
    confirmButtonColor: "#C0392B",
    cancelButtonColor: "#6c757d",
  });

  if (!confirm.isConfirmed) return;

  try {
    console.log(
      `🗑️ ยกเลิกการมอบหมายห้อง - station_doctor_id: ${stationDoctorId}`
    );

    const response = await fetch(getApiUrl("unassign_doctor_room.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_doctor_id: stationDoctorId, // ✅ KEY FIX: ใช้ station_doctor_id
        station_id: currentStationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      Swal.fire({
        title: "✅ สำเร็จ",
        text: "ยกเลิกการมอบหมายห้องแล้ว",
        icon: "success",
        confirmButtonColor: "#1E8449",
      });

      loadDoctorsForStation(currentStationId);
    } else {
      throw new Error(result.message || "ไม่สามารถยกเลิกได้");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      text: error.message,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}
// ============================================
// 4. ฟังก์ชันช่วยเหลือ - อัปเดตข้อมูลแพทย์ในการเลือก
// ============================================
function updateDoctorInfo() {
  const selectEl = document.getElementById("doctorSelect");
  const infoCard = document.getElementById("doctorInfoCard");

  if (!selectEl || !infoCard) {
    console.error("❌ ไม่พบ element");
    return;
  }

  if (selectEl.value) {
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    const workStart = selectedOption
      .getAttribute("data-work-start")
      .substring(0, 5);
    const workEnd = selectedOption
      .getAttribute("data-work-end")
      .substring(0, 5);

    document.getElementById("infoName").textContent =
      selectedOption.getAttribute("data-name");
    document.getElementById(
      "infoTime"
    ).textContent = `${workStart} - ${workEnd}`;

    infoCard.style.display = "block";
    infoCard.style.animation = "slideIn 0.3s ease-out";
  } else {
    infoCard.style.display = "none";
  }
}

// ============================================
// 5. เพิ่มแพทย์เข้าห้อง
// ============================================
async function assignDoctorToRoom(roomId, doctorData) {
  try {
    console.log("📤 เพิ่มแพทย์เข้าห้อง:", {
      room_id: roomId,
      doctor_id: doctorData.doctor_id,
      doctor_name: doctorData.doctor_name,
    });

    Swal.fire({
      title: "กำลังบันทึก...",
      html: '<div style="margin-top: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #0056B3;"></i></div>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    const response = await fetch(`${API_BASE_URL}assign_doctor_to_room.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: roomId, // ✅ ใช้ room_id (ไม่ใช่ room_number)
        doctor_id: doctorData.doctor_id, // ✅ ใช้ doctor_id
        doctor_name: doctorData.doctor_name,
        work_date: new Date().toISOString().split("T")[0], // ✅ เพิ่ม work_date
        work_start_time: (doctorData.work_start_time || "08:00") + ":00",
        work_end_time: (doctorData.work_end_time || "17:00") + ":00",
        break_start_time: (doctorData.break_start_time || "12:00") + ":00",
        break_end_time: (doctorData.break_end_time || "13:00") + ":00",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ ผลลัพธ์:", result);

    if (result.success) {
      Swal.fire({
        title: "✅ สำเร็จ",
        text: `เพิ่ม ${doctorData.doctor_name} เข้าห้องแล้ว`,
        icon: "success",
        confirmButtonColor: "#1E8449",
      });

      // ✅ รีเฟรชข้อมูล
      openRoomDetail(roomId);

      if (currentStationId) {
        setTimeout(() => {
          loadDoctorsForStation(currentStationId);
        }, 500);
      }
    } else {
      throw new Error(result.message || "ไม่สามารถเพิ่มแพทย์ได้");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      text: error.message,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}

// ============================================
// เพิ่มฟังก์ชันใหม่: อัพเดทสถานะการมอบหมายแพทย์
// ============================================

async function updateDoctorAssignmentStatus(doctorId, roomId, status) {
  /**
   * อัพเดทสถานะของแพทย์เมื่อเพิ่มหรือลบออกจากห้อง
   * @param doctorId - รหัสแพทย์
   * @param roomId - รหัสห้อง (หรือ null หากลบออก)
   * @param status - 'working' (ทำงาน) | 'available' (ว่าง) | 'break' (พักเบรก)
   */
  try {
    const response = await fetch(
      `${API_BASE_URL}/update_doctor_assignment_status.php`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: doctorId,
          room_id: roomId,
          status: status,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      console.warn("⚠️ เตือน: อัพเดทสถานะแพทย์ล้มเหลว:", result.message);
    }

    return result.success;
  } catch (error) {
    console.warn("⚠️ เกิดข้อผิดพลาดในการอัพเดทสถานะ:", error);
    return false;
  }
}

/**
 * ✅ FIXED: displayStationDoctors - ปุ่มทั้งหมดใช้ station_doctor_id
 */
function displayStationDoctors(doctors) {
  const container = document.getElementById("stationDoctorsContent");

  if (!doctors || doctors.length === 0) {
    container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #adb5bd;">
                <i class="fas fa-user-md" style="font-size: 48px; margin-bottom: 15px;"></i>
                <div>ไม่มีแพทย์ในสถานีนี้</div>
                <button class="btn btn-success" onclick="addDoctorToStation(${currentStationId})" 
                        style="margin-top: 15px;">
                    <i class="fas fa-plus"></i> เพิ่มแพทย์
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 10px;">
            <h3 style="margin: 0; font-size: 15px;">👨‍⚕️ แพทย์ (${doctors.length} คน)</h3>
            <button class="btn btn-success" onclick="addDoctorToStation(${currentStationId})"
                    style="background: #1E8449; color: white; border: none; padding: 7px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">
                <i class="fas fa-plus"></i> เพิ่มแพทย์
            </button>
        </div>

        <div style="display: grid; gap: 8px;">
    `;

  const now = new Date();
  const currentTime =
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0");

  doctors.forEach((doctor) => {
    // ✅ แปลงเวลา
    const workStart = doctor.work_start_time
      ? doctor.work_start_time.substring(0, 5)
      : "08:00";
    const workEnd = doctor.work_end_time
      ? doctor.work_end_time.substring(0, 5)
      : "17:00";
    const breakStart = doctor.break_start_time
      ? doctor.break_start_time.substring(0, 5)
      : "12:00";
    const breakEnd = doctor.break_end_time
      ? doctor.break_end_time.substring(0, 5)
      : "13:00";

    // ✅ ตรวจสอบว่ามี room ที่ assign หรือไม่
    const hasAssignedRoom =
      doctor.assigned_room_id && doctor.assigned_room_id !== null;

    // ============================================
    // ✅ Logic ตรวจสอบสถานะของแพทย์
    // ============================================
    let status, statusColor, statusIcon, statusText, statusBgColor;

    if (currentTime < workStart) {
      status = "waiting_to_start";
      statusColor = "#FFC107";
      statusIcon = "fa-hourglass-start";
      statusText = "รอเข้างาน";
      statusBgColor = "rgba(255, 193, 7, 0.1)";
    } else if (currentTime >= breakStart && currentTime < breakEnd) {
      status = "on_break";
      statusColor = "#D68910";
      statusIcon = "fa-coffee";
      statusText = "พักเบรค";
      statusBgColor = "rgba(214, 137, 16, 0.1)";
    } else if (currentTime >= workEnd) {
      status = "off_duty";
      statusColor = "#6c757d";
      statusIcon = "fa-power-off";
      statusText = "เลิกงาน";
      statusBgColor = "rgba(108, 117, 125, 0.1)";
    } else if (currentTime >= workStart && currentTime < workEnd) {
      if (hasAssignedRoom) {
        status = "working";
        statusColor = "#0056B3";
        statusIcon = "fa-briefcase";
        statusText = "ทำงาน";
        statusBgColor = "rgba(0, 86, 179, 0.1)";
      } else {
        status = "available";
        statusColor = "#1E8449";
        statusIcon = "fa-check-circle";
        statusText = "ว่าง";
        statusBgColor = "rgba(30, 132, 73, 0.1)";
      }
    } else {
      status = "available";
      statusColor = "#1E8449";
      statusIcon = "fa-check-circle";
      statusText = "ว่าง";
      statusBgColor = "rgba(30, 132, 73, 0.1)";
    }

    // ✅ ข้อมูลห้อง (แสดงเฉพาะถ้ามี room)
    const roomInfo = hasAssignedRoom
      ? `
            <div style="font-size: 11px; color: #0056B3; margin: 3px 0; font-weight: 600;">
                🚪 ${doctor.room_name || "Room " + doctor.assigned_room_id}
            </div>
        `
      : "";

    // ✅ HTML Card - แก้ปุ่มให้ใช้ station_doctor_id
    html += `
            <div style="
                display: flex;
                align-items: center;
                gap: 12px;
                border-left: 3px solid ${statusColor};
                background: ${statusBgColor};
                border-radius: 8px;
                padding: 10px;
                box-shadow: 0 1px 4px rgba(0,0,0,0.08);
            ">
                <!-- ชื่อและข้อมูล -->
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 700; font-size: 13px; color: #212529; margin-bottom: 2px;">
                        👨‍⚕️ ${doctor.doctor_name}
                    </div>
                    <div style="font-size: 10px; color: #adb5bd;">
                        🆔 ${doctor.doctor_id || "N/A"}
                    </div>
                    ${roomInfo}
                </div>

                <!-- เวลาทำงาน -->
                <div style="display: flex; align-items: center; gap: 8px; font-size: 11px;">
                    <div style="text-align: center;">
                        <div style="color: #6c757d; font-size: 9px;">เข้า</div>
                        <div style="font-weight: 700; color: #0056B3;">${workStart}</div>
                    </div>
                    <div>-</div>
                    <div style="text-align: center;">
                        <div style="color: #6c757d; font-size: 9px;">ออก</div>
                        <div style="font-weight: 700; color: #C0392B;">${workEnd}</div>
                    </div>
                </div>

                <!-- สถานะ Badge -->
                <span style="
                    background: ${statusColor};
                    color: white;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 600;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">
                    <i class="fas ${statusIcon}" style="margin-right: 3px;"></i>${statusText}
                </span>
                
                <!-- ปุ่มจัดการ -->
                <div style="display: flex; gap: 4px; flex-shrink: 0;">
                    <!-- ✅ แก้ไขเวลา - ใช้ station_doctor_id -->
                    <button 
                        onclick="editDoctor(${doctor.station_doctor_id})"
                        style="
                            background: #F39C12;
                            color: white;
                            border: none;
                            padding: 6px 10px;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 11px;
                        "
                        title="แก้ไขเวลาทำงาน"
                    >
                        <i class="fas fa-pencil-alt"></i>
                    </button>

                    <!-- ✅ มอบหมายห้อง - ใช้ station_doctor_id -->
                    ${
                      !hasAssignedRoom
                        ? `
                    <button 
                        onclick="openAssignDoctorRoomModal(${doctor.station_doctor_id})"
                        style="
                            background: #17A2B8;
                            color: white;
                            border: none;
                            padding: 6px 10px;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 11px;
                        "
                        title="มอบหมายห้อง"
                    >
                        <i class="fas fa-door-open"></i>
                    </button>
                    `
                        : `
                    <button 
                        onclick="unassignDoctorRoom(${doctor.station_doctor_id})"
                        style="
                            background: #6C757D;
                            color: white;
                            border: none;
                            padding: 6px 10px;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 11px;
                        "
                        title="ยกเลิกการมอบหมายห้อง"
                    >
                        <i class="fas fa-times"></i>
                    </button>
                    `
                    }

                    <!-- ✅ ลบ - ใช้ station_doctor_id -->
                    <button 
                        onclick="removeDoctor(${doctor.station_doctor_id}, '${
      doctor.doctor_name
    }')"
                        style="
                            background: #C0392B;
                            color: white;
                            border: none;
                            padding: 6px 10px;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 11px;
                        "
                        title="ลบแพทย์"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
  });

  html += "</div>";
  container.innerHTML = html;

  console.log("✅ displayStationDoctors สำเร็จ");
}
// ============================================
// 3. แก้ไขแพทย์
// ============================================
async function editDoctor(doctorId) {
  try {
    console.log(`📝 แก้ไขแพทย์ - doctor_id: ${doctorId}`);

    // ดึงข้อมูลแพทย์
    const url =
      getApiUrl("get_doctor_details.php") +
      `?station_doctor_id=${doctorId}&station_id=${currentStationId}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // ✅ แก้ไข: รับ text ก่อน แล้วทำความสะอาด
    const responseText = await response.text();
    console.log("📄 Raw response:", responseText.substring(0, 200));

    // ✅ Parse ด้วย safeJsonParse
    const result = safeJsonParse(responseText);

    if (!result) {
      throw new Error("ไม่สามารถ parse response ได้");
    }

    if (!result.success) {
      throw new Error(result.message);
    }

    const doctor = result.data;
    console.log("✅ ดึงข้อมูลแพทย์:", doctor);

    // แปลงเวลา
    const formatTimeForInput = (time) => {
      if (!time) return "08:00";
      return time.substring(0, 5);
    };

    // แสดง Modal แก้ไข
    const { value: formData } = await Swal.fire({
      title: `แก้ไขแพทย์: ${doctor.doctor_name}`,
      html: `
                <div style="text-align: left; padding: 15px;">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                            ⏰ เวลาเข้างาน
                        </label>
                        <input type="time" id="editWorkStart" 
                               value="${formatTimeForInput(
                                 doctor.work_start_time
                               )}" 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>

                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                            🕔 เวลาออกงาน
                        </label>
                        <input type="time" id="editWorkEnd" 
                               value="${formatTimeForInput(
                                 doctor.work_end_time
                               )}" 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>

                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                            ☕ เวลาพักเริ่ม
                        </label>
                        <input type="time" id="editBreakStart" 
                               value="${formatTimeForInput(
                                 doctor.break_start_time
                               )}" 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>

                    <div class="form-group">
                        <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                            🕐 เวลาพักจบ
                        </label>
                        <input type="time" id="editBreakEnd" 
                               value="${formatTimeForInput(
                                 doctor.break_end_time
                               )}" 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "💾 บันทึก",
      cancelButtonText: "❌ ยกเลิก",
      confirmButtonColor: "#1E8449",
      cancelButtonColor: "#6c757d",
      preConfirm: () => {
        const workStart = document.getElementById("editWorkStart").value;
        const workEnd = document.getElementById("editWorkEnd").value;
        const breakStart = document.getElementById("editBreakStart").value;
        const breakEnd = document.getElementById("editBreakEnd").value;

        if (!workStart || !workEnd || !breakStart || !breakEnd) {
          Swal.showValidationMessage("⚠️ กรุณากรอกเวลาทั้งหมด");
          return false;
        }

        if (
          workStart >= breakStart ||
          breakStart >= breakEnd ||
          breakEnd >= workEnd
        ) {
          Swal.showValidationMessage("⚠️ ลำดับเวลาไม่ถูกต้อง");
          return false;
        }

        return { workStart, workEnd, breakStart, breakEnd };
      },
    });

    if (formData) {
      console.log("📤 บันทึกข้อมูล:", formData);

      // บันทึกข้อมูล
      const updateUrl = getApiUrl("update_doctor_schedule.php");

      const updateResponse = await fetch(updateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: doctorId,
          station_id: currentStationId,
          work_start_time: formData.workStart + ":00",
          work_end_time: formData.workEnd + ":00",
          break_start_time: formData.breakStart + ":00",
          break_end_time: formData.breakEnd + ":00",
        }),
      });

      // ✅ แก้ไข: ทำความสะอาดก่อน parse
      const updateText = await updateResponse.text();
      const updateResult = safeJsonParse(updateText);

      if (updateResult && updateResult.success) {
        await Swal.fire({
          title: "✅ บันทึกสำเร็จ",
          text: "อัปเดตเวลาทำงานแพทย์เรียบร้อย",
          icon: "success",
          confirmButtonColor: "#1E8449",
        });

        // รีโหลดข้อมูล
        loadDoctorsForStation(currentStationId);
      } else {
        throw new Error(updateResult?.message || "ไม่สามารถบันทึกได้");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      text: error.message,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}

/**
 * Toggle Edit Mode for Doctor
 */
function toggleEditDoctorMode(doctorId) {
  const displayMode = document.getElementById(`display-mode-doc-${doctorId}`);
  const editMode = document.getElementById(`edit-mode-doc-${doctorId}`);
  const editBtn = document.getElementById(`edit-btn-doc-${doctorId}`);
  const saveBtn = document.getElementById(`save-btn-doc-${doctorId}`);
  const cancelBtn = document.getElementById(`cancel-btn-doc-${doctorId}`);

  displayMode.style.display = "none";
  editMode.style.display = "grid";
  editBtn.style.display = "none";
  saveBtn.style.display = "block";
  cancelBtn.style.display = "block";
}

/**
 * Cancel Edit Mode for Doctor
 */
function cancelEditDoctorMode(doctorId) {
  const displayMode = document.getElementById(`display-mode-doc-${doctorId}`);
  const editMode = document.getElementById(`edit-mode-doc-${doctorId}`);
  const editBtn = document.getElementById(`edit-btn-doc-${doctorId}`);
  const saveBtn = document.getElementById(`save-btn-doc-${doctorId}`);
  const cancelBtn = document.getElementById(`cancel-btn-doc-${doctorId}`);

  displayMode.style.display = "block";
  editMode.style.display = "none";
  editBtn.style.display = "block";
  saveBtn.style.display = "none";
  cancelBtn.style.display = "none";
}

/**
 * Save Doctor Schedule Changes
 */
async function saveDoctorScheduleChanges(doctorId) {
  const workStart = document.getElementById(`doc-work-start-${doctorId}`).value;
  const workEnd = document.getElementById(`doc-work-end-${doctorId}`).value;
  const breakStart = document.getElementById(
    `doc-break-start-${doctorId}`
  ).value;
  const breakEnd = document.getElementById(`doc-break-end-${doctorId}`).value;

  // Validation
  if (!workStart || !workEnd || !breakStart || !breakEnd) {
    alert("⚠️ โปรดกรอกเวลาทั้งหมด");
    return;
  }

  // Check time logic
  if (
    workStart >= breakStart ||
    breakStart >= breakEnd ||
    breakEnd >= workEnd
  ) {
    alert(
      "⚠️ ลำดับเวลาไม่ถูกต้อง\nต้องเป็น: เข้างาน < พักเบรก < กลับมา < เลิกงาน"
    );
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/update_doctor_schedule.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctor_id: doctorId,
        updates: {
          work_start_time: workStart + ":00",
          work_end_time: workEnd + ":00",
          break_start_time: breakStart + ":00",
          break_end_time: breakEnd + ":00",
        },
      }),
    });

    const result = await response.json();

    if (result.success) {
      Swal.fire({
        title: "สำเร็จ",
        text: "อัปเดตเวลาทำงานแพทย์สำเร็จ",
        icon: "success",
        confirmButtonText: "ตกลง",
      });

      // อัปเดตข้อมูลแสดงผล
      const displayMode = document.getElementById(
        `display-mode-doc-${doctorId}`
      );
      displayMode.innerHTML = `
                <div class="staff-schedule">
                    <div>
                        <span style="font-weight: 600; color: var(--text-light);">🕐 เข้างาน:</span>
                        <span style="font-weight: bold; margin-left: 5px;">${workStart}</span>
                    </div>
                    <div>
                        <span style="font-weight: 600; color: var(--text-light);">🕑 เลิกงาน:</span>
                        <span style="font-weight: bold; margin-left: 5px;">${workEnd}</span>
                    </div>
                    <div>
                        <span style="font-weight: 600; color: var(--text-light);">☕ พักเบรก:</span>
                        <span style="font-weight: bold; margin-left: 5px;">${breakStart}</span>
                    </div>
                    <div>
                        <span style="font-weight: 600; color: var(--text-light);">🔙 กลับมา:</span>
                        <span style="font-weight: bold; margin-left: 5px;">${breakEnd}</span>
                    </div>
                </div>
            `;

      cancelEditDoctorMode(doctorId);
    } else {
      Swal.fire(
        "ข้อผิดพลาด",
        result.message || "ไม่สามารถอัปเดตเวลาได้",
        "error"
      );
    }
  } catch (error) {
    console.error("Error saving schedule:", error);
    Swal.fire("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
  }
}

/**
 * Toggle Doctor Status
 */
async function toggleDoctorStatus(doctorId) {
  try {
    const response = await fetch(`${API_BASE_URL}/toggle_doctor_status.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor_id: doctorId }),
    });

    const result = await response.json();
    if (result.success) {
      // โหลดข้อมูลแพทย์ใหม่
      loadDoctorsForStation(currentStationId);
    } else {
      alert("❌ " + result.message);
    }
  } catch (error) {
    console.error("Error toggling doctor status:", error);
    alert("❌ เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
  }
}

// ============================================
// 4. ลบแพทย์
// ============================================
async function removeDoctor(stationDoctorId, doctorName) {
  const result = await Swal.fire({
    title: "⚠️ ยืนยันการลบ",
    text: `ต้องการลบแพทย์ "${doctorName}" ออกจากสถานีนี้ใช่หรือไม่?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "✅ ยืนยันลบ",
    cancelButtonText: "❌ ยกเลิก",
    confirmButtonColor: "#C0392B",
    cancelButtonColor: "#6c757d",
  });

  if (result.isConfirmed) {
    try {
      console.log(`🗑️ ลบแพทย์ - station_doctor_id: ${stationDoctorId}`);

      // ✅ ส่ง station_doctor_id ไปยัง API
      const response = await fetch(getApiUrl("manage_station_doctors.php"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_doctor_id: stationDoctorId, // ✅ KEY FIX
          station_id: currentStationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const resultData = await response.json();
      console.log("✅ ผลลัพธ์:", resultData);

      if (resultData.success) {
        await Swal.fire({
          title: "✅ ลบสำเร็จ",
          text: `ลบแพทย์ "${doctorName}" ออกจากสถานีแล้ว`,
          icon: "success",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#1E8449",
        });

        // ✅ รีโหลดข้อมูลแพทย์
        loadDoctorsForStation(currentStationId);
      } else {
        throw new Error(resultData.message || "ไม่สามารถลบได้");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      await Swal.fire({
        title: "❌ ข้อผิดพลาด",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#C0392B",
      });
    }
  }
}

/**
 * Add Doctor to Station
 */
async function addDoctorToStation(stationId) {
  try {
    console.log(`➕ เพิ่มแพทย์ใหม่ - station_id: ${stationId}`);

    // ✅ ตรวจสอบ API_BASE_URL
    if (!API_BASE_URL) {
      throw new Error("API_BASE_URL ไม่ได้ประกาศ");
    }

    // ✅ ส่วนที่ 1: ดึงข้อมูล department_id สำหรับ station นี้
    console.log("📥 ดึงข้อมูล station...");

    const stationResponse = await fetch(
      `${API_BASE_URL}get_station_detail.php?station_id=${stationId}`
    );

    if (!stationResponse.ok) {
      throw new Error(
        `ไม่สามารถดึงข้อมูล station: HTTP ${stationResponse.status}`
      );
    }

    const stationResult = await stationResponse.json();

    if (!stationResult.success) {
      throw new Error(stationResult.message || "ไม่สามารถดึงข้อมูล station");
    }

    const station = stationResult.data.station;
    const departmentId = station.department_id;

    if (!departmentId) {
      throw new Error("ไม่พบ department_id สำหรับ station นี้");
    }

    console.log(`✅ department_id: ${departmentId}`);

    // ✅ ส่วนที่ 2: แสดง Modal สำหรับกรอกข้อมูลแพทย์
    const today = new Date().toISOString().split("T")[0];

    const { value: formData } = await Swal.fire({
      title: "➕ เพิ่มแพทย์ใหม่",
      html: `
                <div style="text-align: left; padding: 20px;">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                            🆔 รหัสแพทย์ *
                        </label>
                        <input 
                            type="text" 
                            id="newDoctorId" 
                            placeholder="เช่น DOC001"
                            style="
                                width: 100%;
                                padding: 10px 12px;
                                border: 2px solid #ced4da;
                                border-radius: 8px;
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                    </div>

                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                            👨‍⚕️ ชื่อแพทย์ *
                        </label>
                        <input 
                            type="text" 
                            id="newDoctorName" 
                            placeholder="เช่น ดร.สมชาย มาศวร"
                            style="
                                width: 100%;
                                padding: 10px 12px;
                                border: 2px solid #ced4da;
                                border-radius: 8px;
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                    </div>

                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                            ⏰ เวลาเข้างาน
                        </label>
                        <input 
                            type="time" 
                            id="newWorkStart" 
                            value="08:00"
                            style="
                                width: 100%;
                                padding: 10px 12px;
                                border: 2px solid #ced4da;
                                border-radius: 8px;
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                    </div>

                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                            🕔 เวลาออกงาน
                        </label>
                        <input 
                            type="time" 
                            id="newWorkEnd" 
                            value="17:00"
                            style="
                                width: 100%;
                                padding: 10px 12px;
                                border: 2px solid #ced4da;
                                border-radius: 8px;
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                    </div>

                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                            ☕ เวลาพักเริ่ม
                        </label>
                        <input 
                            type="time" 
                            id="newBreakStart" 
                            value="12:00"
                            style="
                                width: 100%;
                                padding: 10px 12px;
                                border: 2px solid #ced4da;
                                border-radius: 8px;
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                    </div>

                    <div class="form-group">
                        <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                            🕐 เวลาพักจบ
                        </label>
                        <input 
                            type="time" 
                            id="newBreakEnd" 
                            value="13:00"
                            style="
                                width: 100%;
                                padding: 10px 12px;
                                border: 2px solid #ced4da;
                                border-radius: 8px;
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                    </div>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "✅ เพิ่มแพทย์",
      cancelButtonText: "❌ ยกเลิก",
      confirmButtonColor: "#1E8449",
      cancelButtonColor: "#6c757d",
      preConfirm: () => {
        const doctorId = document.getElementById("newDoctorId").value.trim();
        const doctorName = document
          .getElementById("newDoctorName")
          .value.trim();
        const workStart = document.getElementById("newWorkStart").value;
        const workEnd = document.getElementById("newWorkEnd").value;
        const breakStart = document.getElementById("newBreakStart").value;
        const breakEnd = document.getElementById("newBreakEnd").value;

        // ✅ Validation
        if (!doctorId) {
          Swal.showValidationMessage("⚠️ กรุณากรอกรหัสแพทย์");
          return false;
        }

        if (!doctorName) {
          Swal.showValidationMessage("⚠️ กรุณากรอกชื่อแพทย์");
          return false;
        }

        if (!workStart || !workEnd || !breakStart || !breakEnd) {
          Swal.showValidationMessage("⚠️ กรุณากรอกเวลาทั้งหมด");
          return false;
        }

        if (
          workStart >= breakStart ||
          breakStart >= breakEnd ||
          breakEnd >= workEnd
        ) {
          Swal.showValidationMessage("⚠️ ลำดับเวลาไม่ถูกต้อง");
          return false;
        }

        return {
          doctor_id: doctorId,
          doctor_name: doctorName,
          work_start_time: workStart,
          work_end_time: workEnd,
          break_start_time: breakStart,
          break_end_time: breakEnd,
        };
      },
    });

    if (!formData) {
      console.log("❌ ผู้ใช้ยกเลิกการเพิ่มแพทย์");
      return;
    }

    console.log("📤 ส่งข้อมูลแพทย์ไปยัง API:", {
      station_id: stationId,
      department_id: departmentId,
      doctor_id: formData.doctor_id,
      doctor_name: formData.doctor_name,
    });

    // ✅ ส่วนที่ 3: ส่ง request ไปยัง API
    Swal.fire({
      title: "กำลังบันทึก...",
      html: '<div style="margin-top: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #0056B3;"></i></div>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    const addResponse = await fetch(
      `${API_BASE_URL}add_doctor_to_station.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          station_id: stationId,
          department_id: departmentId, // ✅ KEY FIX: ส่ง department_id
          doctor_id: formData.doctor_id,
          doctor_name: formData.doctor_name,
          work_date: today,
          work_start_time: formData.work_start_time + ":00",
          work_end_time: formData.work_end_time + ":00",
          break_start_time: formData.break_start_time + ":00",
          break_end_time: formData.break_end_time + ":00",
        }),
      }
    );

    // ✅ ตรวจสอบ response
    if (!addResponse.ok) {
      const errorText = await addResponse.text();
      throw new Error(
        `HTTP ${addResponse.status}: ${errorText.substring(0, 100)}`
      );
    }

    const result = await addResponse.json();
    console.log("✅ ผลลัพธ์:", result);

    // ✅ ส่วนที่ 4: แสดงผลลัพธ์
    if (result.success) {
      Swal.fire({
        title: "✅ เพิ่มสำเร็จ",
        html: `
                    <div style="text-align: left; padding: 15px;">
                        <p><strong>👨‍⚕️ ${formData.doctor_name}</strong></p>
                        <p style="color: #666; font-size: 13px; margin-top: 10px;">
                            เพิ่มแพทย์เข้าสถานีแล้ว
                        </p>
                    </div>
                `,
        icon: "success",
        confirmButtonColor: "#1E8449",
      });

      // ✅ รีโหลดข้อมูลแพทย์
      loadDoctorsForStation(stationId);
    } else {
      throw new Error(result.message || "ไม่สามารถเพิ่มแพทย์ได้");
    }
  } catch (error) {
    console.error("❌ Error:", error);

    // ✅ แสดง error message ที่ชัดเจน
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      html: `
                <div style="text-align: left; padding: 15px;">
                    <p><strong>${error.message}</strong></p>
                    <small style="color: #999; display: block; margin-top: 10px;">
                        ลองตรวจสอบ:<br>
                        • เชื่อมต่อเซิร์ฟเวอร์<br>
                        • ข้อมูลที่กรอก<br>
                        • ไฟล์ add_doctor_to_station.php
                    </small>
                </div>
            `,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}

async function confirmAddDoctor(stationId, doctorData) {
  try {
    console.log("📝 Adding doctor:", doctorData);

    const response = await fetch(`${API_BASE_URL}/manage_doctor_stations.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctor_name: doctorData.doctor_name,
        station_id: parseInt(stationId),
        specialization: doctorData.specialization,
        work_start_time: doctorData.work_start_time,
        work_end_time: doctorData.work_end_time,
        break_start_time: doctorData.break_start_time,
        break_end_time: doctorData.break_end_time,
        doctor_id: doctorData.doctor_id, // เก็บรหัสแพทย์แทนความเชี่ยวชาญ
      }),
    });

    const result = await response.json();
    console.log("✅ API Response:", result);

    if (result.success) {
      await Swal.fire({
        title: "✅ สำเร็จ",
        html: `
                    <div style="text-align: left;">
                        <strong>เพิ่มแพทย์สำเร็จ!</strong><br><br>
                        🆔 รหัส: ${doctorData.doctor_id}<br>
                        👨‍⚕️ ชื่อ: ${doctorData.doctor_name}<br>
                        🏥 ความเชี่ยวชาญ: ${doctorData.specialization}<br>
                        ⏰ เวลาทำงาน: ${doctorData.work_start_time.substring(
                          0,
                          5
                        )} - ${doctorData.work_end_time.substring(0, 5)}<br>
                        ☕ เวลาพัก: ${doctorData.break_start_time.substring(
                          0,
                          5
                        )} - ${doctorData.break_end_time.substring(0, 5)}
                    </div>
                `,
        icon: "success",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#1E8449",
      });

      // รีโหลดข้อมูลแพทย์
      if (currentStationId) {
        loadDoctorsForStation(currentStationId);
      }
    } else {
      throw new Error(result.message || "ไม่สามารถเพิ่มแพทย์ได้");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    await Swal.fire({
      title: "❌ ข้อผิดพลาด",
      text: error.message || "ไม่สามารถเพิ่มแพทย์ได้",
      icon: "error",
      confirmButtonText: "ตกลง",
      confirmButtonColor: "#C0392B",
    });
  }
}

/**
 * ✅ FIXED: Load Doctors for Station
 * ส่งคำขอไปให้ server ตัดสินใจว่าจะใช้วันไหน
 */
async function loadDoctorsForStation(stationId) {
  const response = await fetch(
    `${API_BASE_URL}get_station_doctors.php?station_id=${stationId}`
  );

  const result = await response.json();

  if (result.success) {
    console.log(`👥 ดึงข้อมูล: ${result.data.doctors.length} แพทย์`);
    displayStationDoctors(result.data.doctors || []);
  } else {
    console.error("❌ ไม่สามารถดึงข้อมูลแพทย์:", result.message);
    displayStationDoctors([]);
  }
}
// สร้าง Floor Station Card ที่แสดงข้อมูลจริงจาก database
async function createFloorStationCardHTML(station) {
  try {
    // ✅ ใช้ getApiUrl() แทนการเชื่อมต่อ URL เอง
    const detailUrl =
      getApiUrl("get_station_detail.php") + `?station_id=${station.station_id}`;

    console.log(`📥 ดึงข้อมูล: ${detailUrl}`);

    const detailResponse = await fetch(detailUrl);

    if (!detailResponse.ok) {
      const errorText = await detailResponse.text();
      console.error(
        `❌ HTTP ${detailResponse.status}: ${errorText.substring(0, 100)}`
      );
      throw new Error(`HTTP ${detailResponse.status}`);
    }

    const detailResult = await detailResponse.json();

    if (!detailResult.success) {
      throw new Error(detailResult.message || "ไม่สามารถโหลดข้อมูล");
    }

    const data = detailResult.data;
    const patients = data.patients || [];

    // ✅ นับ patients ตามสถานะ
    const totalPatients = patients.length;
    const inProgressPatients = patients.filter(
      (p) => p.status === "in_progress"
    ).length;
    const waitingPatients = patients.filter(
      (p) => p.status === "waiting"
    ).length;
    const overduePatients = patients.filter((p) => p.is_overdue).length;

    const procedures = data.procedures || [];
    const totalProcedures = procedures.length;
    const completedProcedures = Math.max(1, Math.floor(totalProcedures * 0.2));
    const pendingProcedures = totalProcedures - completedProcedures;

    // ✅ สร้าง Card HTML
    const cardHTML = `
            <div class="floor-station-card" onclick="openStationDetail(${
              station.station_id
            })">
                <div class="floor-station-card-header">
                    <div class="floor-station-card-icon">
                        <i class="fas fa-hospital"></i>
                    </div>
                    <div class="floor-station-card-title">
                        <div class="station-name">${station.station_name}</div>
                        <div class="station-code">${station.station_code}</div>
                    </div>
                    <div class="floor-station-card-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>

                <div class="floor-station-card-subtitle">
                    ${station.department_name || "N/A"}
                </div>

                <div class="floor-station-card-stats">
                    <div class="stat-box stat-patients">
                        <div class="stat-number">${totalPatients}</div>
                        <div class="stat-unit">👥 คนไข้</div>
                    </div>

                    <div class="stat-box stat-in-progress">
                        <div class="stat-number">${inProgressPatients}</div>
                        <div class="stat-unit">⏳ ทำหัตถการ</div>
                    </div>

                    <div class="stat-box stat-pending">
                        <div class="stat-number">${waitingPatients}</div>
                        <div class="stat-unit">⏸️ รอทำ</div>
                    </div>

                    <div class="stat-box stat-overdue ${
                      overduePatients > 0 ? "stat-overdue-active" : ""
                    }">
                        <div class="stat-number">${overduePatients}</div>
                        <div class="stat-unit">⚠️ เกินเวลา</div>
                    </div>
                </div>
            </div>
        `;

    return cardHTML;
  } catch (error) {
    console.error(
      `❌ Error creating card for station ${station.station_id}:`,
      error
    );

    // ✅ Fallback Card
    return `
            <div class="floor-station-card floor-station-card-error">
                <div class="floor-station-card-header">
                    <div class="floor-station-card-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <div class="floor-station-card-title">
                        <div class="station-name">${station.station_name}</div>
                        <div class="station-code">${station.station_code}</div>
                    </div>
                </div>
                <div style="padding: 12px; text-align: center; color: #999; font-size: 12px;">
                    ⚠️ ไม่สามารถโหลดข้อมูล: ${error.message}
                </div>
            </div>
        `;
  }
}

// อัปเดตฟังก์ชัน createFloorSection เพื่อใช้ card ใหม่
async function createFloorSectionNew(floor, stations, stats) {
  const expandId = `floor-${floor}-expand`;
  const contentId = `floor-${floor}-content`;
  const isExpanded = sessionStorage.getItem(expandId) === "true";

  let stationsHTML = "";

  if (stations.length === 0) {
    stationsHTML = `
            <div style="text-align: center; padding: 20px; color: #adb5bd;">
                ยังไม่มีสเตชั่นบนชั้นนี้
            </div>
        `;
  } else {
    for (const station of stations) {
      const cardHTML = await createFloorStationCardHTML(station);
      stationsHTML += cardHTML;
    }
  }

  return `
        <div class="floor-section">
            <div class="floor-section-header" onclick="toggleFloorExpand(${floor})">
                <div class="floor-section-title">
                    <i class="fas fa-chevron-${
                      isExpanded ? "down" : "right"
                    }" style="margin-right: 8px; color: #0056B3;"></i>
                    <span>🏢 Floor ${floor}</span>
                </div>
                <div class="floor-section-stats">
                    <span style="background: rgba(100,200,100,0.2); padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                        ${stations.length} สเตชั่น
                    </span>
                    <span style="background: rgba(100,150,255,0.2); padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                        🏨 ${stats.roomCount}
                    </span>
                    <span style="background: rgba(255,150,100,0.2); padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                        👥 ${stats.staffCount}
                    </span>
                </div>
            </div>
            <div id="${contentId}" class="floor-section-content" style="display: ${
    isExpanded ? "block" : "none"
  };">
                ${stationsHTML}
            </div>
        </div>
    `;
}

// เพิ่ม CSS styling สำหรับ card ใหม่
const floorStationCardStyle = document.createElement("style");
floorStationCardStyle.textContent = `
    .floor-station-card {
        background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%);
        border: 1px solid rgba(200, 200, 200, 0.3);
        border-radius: 10px;
        padding: 12px 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .floor-station-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: rgba(102, 126, 234, 0.5);
    }

    .floor-station-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
    }

    .floor-station-card-icon {
        font-size: 28px;
        color: #0056B3;
        flex-shrink: 0;
    }

    .floor-station-card-title {
        flex: 1;
    }

    .station-name {
        font-weight: 700;
        font-size: 14px;
        color: #212529;
        margin-bottom: 2px;
    }

    .station-code {
        font-size: 11px;
        color: #495057;
    }

    .floor-station-card-arrow {
        font-size: 18px;
        color: #adb5bd;
        flex-shrink: 0;
    }

    .floor-station-card:hover .floor-station-card-arrow {
        color: #0056B3;
        transform: translateX(4px);
    }

    .floor-station-card-subtitle {
        font-size: 10px;
        color: #adb5bd;
        margin-bottom: 10px;
        padding-left: 40px;
    }

    .floor-station-card-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        padding: 0 0 0 40px;
    }

    .stat-box {
        background: rgba(0, 0, 0, 0.02);
        border-radius: 6px;
        padding: 8px;
        border-left: 3px solid;
        text-align: center;
        transition: all 0.3s ease;
    }

    .stat-box:hover {
        background: rgba(0, 0, 0, 0.04);
    }

    .stat-patients {
        border-left-color: #D68910;
        background: rgba(214, 137, 16, 0.08);
    }

    .stat-in-progress {
        border-left-color: #0056B3;
        background: rgba(0, 86, 179, 0.08);
    }

    .stat-pending {
        border-left-color: #D68910;
        background: rgba(214, 137, 16, 0.08);
    }

    .stat-overdue {
        border-left-color: #dee2e6;
        background: rgba(0, 0, 0, 0.02);
    }

    .stat-overdue-active {
        border-left-color: #C0392B !important;
        background: rgba(192, 57, 43, 0.08) !important;
    }

    .stat-number {
        font-weight: 700;
        font-size: 16px;
        color: inherit;
    }

    .stat-patients .stat-number {
        color: #D68910;
    }

    .stat-in-progress .stat-number {
        color: #0056B3;
    }

    .stat-pending .stat-number {
        color: #D68910;
    }

    .stat-overdue-active .stat-number {
        color: #C0392B;
    }

    .stat-unit {
        font-size: 10px;
        color: #495057;
        margin-top: 4px;
        white-space: nowrap;
    }

    .floor-station-card-error {
        opacity: 0.6;
    }

    @media (max-width: 1200px) {
        .floor-station-card-stats {
            grid-template-columns: repeat(2, 1fr);
        }
    }
`;
document.head.appendChild(floorStationCardStyle);

// ฟังก์ชัน Toggle Floor Expand (เดิม)
function toggleFloorExpand(floor) {
  const expandId = `floor-${floor}-expand`;
  const contentId = `floor-${floor}-content`;
  const content = document.getElementById(contentId);
  const header = event.target.closest(".floor-section-header");
  const icon = header.querySelector("i");

  const isExpanded = sessionStorage.getItem(expandId) === "true";

  if (isExpanded) {
    content.style.display = "none";
    icon.classList.remove("fa-chevron-down");
    icon.classList.add("fa-chevron-right");
    sessionStorage.setItem(expandId, "false");
  } else {
    content.style.display = "block";
    icon.classList.remove("fa-chevron-right");
    icon.classList.add("fa-chevron-down");
    sessionStorage.setItem(expandId, "true");
  }
}

async function syncProcedureTimesFromStationToRooms(
  stationId,
  procedureId,
  updatedData
) {
  try {
    console.log(
      `🔄 Syncing procedure times from station ${stationId} to all rooms...`
    );

    // Payload สำหรับ sync
    const syncPayload = {
      action: "sync_from_station",
      station_id: stationId,
      procedure_id: procedureId,
      wait_time: updatedData.wait_time,
      procedure_time: updatedData.procedure_time,
      staff_required: updatedData.staff_required,
      equipment_required: updatedData.equipment_required,
    };

    const response = await fetch(`${API_BASE_URL}/sync_procedure_times.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(syncPayload),
    });

    const result = await response.json();

    if (result.success) {
      console.log(
        `✅ Synced procedure times to ${result.data.rooms_updated} rooms`
      );

      // Reload room display ถ้ามีห้องเปิดอยู่
      if (currentRoomId) {
        setTimeout(() => {
          openRoomDetail(currentRoomId);
        }, 500);
      }

      return true;
    } else {
      console.error("❌ Sync failed:", result.message);
      return false;
    }
  } catch (error) {
    console.error("❌ Error syncing procedure times:", error);
    return false;
  }
}

/**
 * ✅ NEW: Toggle Edit Staff Schedule
 * สลับระหว่างโหมดแสดงผลและโหมดแก้ไขเวลาทำงานของพนักงาน
 */
function toggleEditStaffSchedule(staffId) {
  console.log(`🔄 สลับโหมด - staff_id: ${staffId}`);

  // ✅ หา elements ด้วยวิธีต่างๆ เพื่อรองรับทั้ง format เก่าและใหม่
  const displayMode = document.getElementById(`display-mode-staff-${staffId}`);
  const editMode = document.getElementById(`edit-mode-staff-${staffId}`);

  if (!displayMode || !editMode) {
    console.error(`❌ ไม่พบ elements สำหรับ staff_id: ${staffId}`);
    console.log("IDs ที่หา:", {
      displayId: `display-mode-staff-${staffId}`,
      editId: `edit-mode-staff-${staffId}`,
    });
    return;
  }

  // ✅ สลับการแสดง
  if (displayMode.style.display === "none") {
    // เปิดโหมดแสดง ปิดโหมดแก้ไข
    displayMode.style.display = "flex";
    editMode.style.display = "none";
    console.log(`✅ สลับไปโหมดแสดง`);
  } else {
    // เปิดโหมดแก้ไข ปิดโหมดแสดง
    displayMode.style.display = "none";
    editMode.style.display = "block";
    console.log(`✅ สลับไปโหมดแก้ไข`);
  }
}

/**
 * ✅ Save Staff Schedule
 */
async function saveStaffSchedule(staffId) {
  console.log(`💾 บันทึกเวลาทำงานสำหรับ staff_id: ${staffId}`);

  // ✅ ดึงค่าเวลาจาก input
  const workStart = document.getElementById(`edit-work-start-${staffId}`).value;
  const workEnd = document.getElementById(`edit-work-end-${staffId}`).value;
  const breakStart = document.getElementById(
    `edit-break-start-${staffId}`
  ).value;
  const breakEnd = document.getElementById(`edit-break-end-${staffId}`).value;

  // ✅ ตรวจสอบว่ามีค่าหรือไม่
  if (!workStart || !workEnd || !breakStart || !breakEnd) {
    Swal.fire({
      icon: "warning",
      title: "โปรดตรวจสอบ",
      text: "โปรดกรอกเวลาทั้งหมด",
      confirmButtonColor: "#D68910",
    });
    return;
  }

  // ✅ ตรวจสอบลำดับเวลา
  if (
    workStart >= breakStart ||
    breakStart >= breakEnd ||
    breakEnd >= workEnd
  ) {
    Swal.fire({
      icon: "warning",
      title: "ลำดับเวลาไม่ถูกต้อง",
      html: `
                <div style="text-align: left; color: #C0392B;">
                    โปรดตรวจสอบลำดับเวลา:<br><br>
                    <strong>✓ ต้องเป็น:</strong><br>
                    เข้างาน &lt; เริ่มพักเบรก &lt; จบพักเบรก &lt; เลิกงาน<br><br>
                    <strong>ตัวอย่าง:</strong><br>
                    08:00 &lt; 12:00 &lt; 13:00 &lt; 17:00
                </div>
            `,
      confirmButtonColor: "#D68910",
    });
    return;
  }

  try {
    // ✅ ตรวจสอบให้แน่ใจว่า staffId เป็นตัวเลข
    const staffIdInt = parseInt(staffId, 10);
    if (isNaN(staffIdInt) || staffIdInt < 1) {
      throw new Error("Staff ID ไม่ถูกต้อง");
    }

    console.log("📤 ส่งข้อมูล:", {
      station_staff_id: staffIdInt,
      work_start_time: workStart + ":00",
      work_end_time: workEnd + ":00",
      break_start_time: breakStart + ":00",
      break_end_time: breakEnd + ":00",
    });

    // ✅ ส่งคำขอไปยัง API
    const response = await fetch(`${API_BASE_URL}/update_staff_schedule.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        station_staff_id: staffIdInt, // ✅ ใช้ station_staff_id ไม่ใช่ staff_id
        work_start_time: workStart + ":00",
        work_end_time: workEnd + ":00",
        break_start_time: breakStart + ":00",
        break_end_time: breakEnd + ":00",
        work_date: new Date().toISOString().split("T")[0], // วันที่วันนี้
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ ตัวอักษรตอบสนอง:", result);

    if (result.success) {
      // ✅ แสดงข้อความสำเร็จ
      await Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ! ✅",
        html: `
                    <div style="text-align: left;">
                        <p><strong>อัปเดตเวลาทำงาน</strong></p>
                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 10px 0; font-size: 13px;">
                            ⏱️ เข้างาน: <strong>${workStart}</strong><br>
                            🚪 เลิกงาน: <strong>${workEnd}</strong><br>
                            ☕ พักเบรก: <strong>${breakStart} - ${breakEnd}</strong>
                        </div>
                    </div>
                `,
        confirmButtonColor: "#1E8449",
        confirmButtonText: "ตกลง",
      });

      // ✅ ปิดโหมดแก้ไข
      toggleEditStaffSchedule(staffId);

      // ✅ รีเฟรชรายการพนักงาน
      if (currentStationId) {
        setTimeout(() => {
          loadStationStaff(currentStationId);
        }, 500);
      }
    } else {
      throw new Error(result.message || "ไม่สามารถบันทึกได้");
    }
  } catch (error) {
    console.error("❌ ข้อผิดพลาด:", error);
    await Swal.fire({
      icon: "error",
      title: "เกิดข้อผิดพลาด ❌",
      text: error.message || "ไม่สามารถบันทึกเวลาทำงานได้",
      confirmButtonColor: "#C0392B",
    });
  }
}

// ===== ADD STATION PROCEDURE FUNCTIONS (VERSION 2) =====

// ✅ เก็บข้อมูล station ปัจจุบัน
let currentStationData = null;

async function openAddStationProcedureModal() {
  if (!currentStationId) {
    alert("❌ ไม่พบข้อมูล station");
    return;
  }

  // ✅ ตรวจสอบว่ามีข้อมูล station หรือไม่
  if (!currentStationData || !currentStationData.department_id) {
    Swal.fire(
      "ข้อผิดพลาด",
      "ไม่พบข้อมูล department_id ของ station นี้",
      "error"
    );
    return;
  }

  // สร้าง modal HTML
  const modalHtml = `
        <div id="addStationProcedureModal" class="modal" style="display: block; z-index: 10000;">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 class="modal-title">💉 เพิ่มหัตถการใหม่</h2>
                    <button class="close-modal" onclick="closeAddStationProcedureModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addStationProcedureForm">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label class="form-label" style="display: block; margin-bottom: 8px; font-weight: 600;">
                                <span style="color: #C0392B;">*</span> ชื่อหัตถการ:
                            </label>
                            <input type="text" id="newStationProcedureName" class="form-control" 
                                   placeholder="กรอกชื่อหัตถการ" required
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                            <small style="color: #6c757d; display: block; margin-top: 5px;">
                                ตัวอย่าง: ICG BE สแกนระบบในเรียบเอือจอประสาทตา + ฉีดสี
                            </small>
                        </div>

                        <div class="row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div class="form-group">
                                <label class="form-label" style="display: block; margin-bottom: 8px; font-weight: 600;">
                                    ⏳ เวลารอ (นาที):
                                </label>
                                <input type="number" id="newProcedureWaitTime" class="form-control" 
                                       value="10" min="0"
                                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            </div>
                            <div class="form-group">
                                <label class="form-label" style="display: block; margin-bottom: 8px; font-weight: 600;">
                                    ⏱️ เวลาทำหัตถการ (นาที):
                                </label>
                                <input type="number" id="newProcedureProcedureTime" class="form-control" 
                                       value="30" min="1"
                                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            </div>
                        </div>

                        <div class="row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div class="form-group">
                                <label class="form-label" style="display: block; margin-bottom: 8px; font-weight: 600;">
                                    👥 จำนวนพนักงานที่ต้องการ:
                                </label>
                                <input type="number" id="newProcedureStaffRequired" class="form-control" 
                                       value="0" min="0"
                                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                <small style="color: #6c757d; display: block; margin-top: 5px;">
                                    0 = ไม่ต้องใช้พนักงาน
                                </small>
                            </div>
                            <div class="form-group">
                                <label class="form-label" style="display: block; margin-bottom: 8px; font-weight: 600;">
                                    🔧 ต้องใช้เครื่องมือ:
                                </label>
                                <select id="newProcedureEquipmentRequired" class="form-control"
                                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                    <option value="0">ไม่ต้องใช้</option>
                                    <option value="1">ต้องใช้</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; border-top: 1px solid var(--glass-border); padding-top: 15px;">
                            <button type="button" class="btn btn-danger" onclick="closeAddStationProcedureModal()">
                                <i class="fas fa-times"></i> ยกเลิก
                            </button>
                            <button type="button" class="btn btn-success" onclick="addStationProcedure()">
                                <i class="fas fa-plus"></i> เพิ่มหัตถการ
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

  // เพิ่ม modal เข้าไปใน body
  const existingModal = document.getElementById("addStationProcedureModal");
  if (existingModal) {
    existingModal.remove();
  }
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

/**
 * Close Add Station Procedure Modal
 */
function closeAddStationProcedureModal() {
  const modal = document.getElementById("addStationProcedureModal");
  if (modal) {
    modal.remove();
  }
}

/**
 * Add Station Procedure
 * สร้างหัตถการใหม่พร้อม department_id
 */
async function addStationProcedure() {
  const procedureName = document
    .getElementById("newStationProcedureName")
    .value.trim();
  const waitTime = document.getElementById("newProcedureWaitTime").value;
  const procedureTime = document.getElementById(
    "newProcedureProcedureTime"
  ).value;
  const staffRequired = document.getElementById(
    "newProcedureStaffRequired"
  ).value;
  const equipmentRequired = document.getElementById(
    "newProcedureEquipmentRequired"
  ).value;

  // Validation
  if (!procedureName) {
    Swal.fire("แจ้งเตือน", "กรุณากรอกชื่อหัตถการ", "warning");
    return;
  }

  if (!waitTime || waitTime < 0) {
    Swal.fire("แจ้งเตือน", "กรุณาระบุเวลารอที่ถูกต้อง", "warning");
    return;
  }

  if (!procedureTime || procedureTime < 1) {
    Swal.fire("แจ้งเตือน", "กรุณาระบุเวลาทำหัตถการที่ถูกต้อง", "warning");
    return;
  }

  try {
    // เรียก API เพื่อเพิ่มหัตถการ
    const response = await fetch(`${API_BASE_URL}/add_station_procedure.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        station_id: currentStationId,
        department_id: currentStationData.department_id, // ✅ ส่ง department_id
        procedure_name: procedureName,
        wait_time: parseInt(waitTime),
        procedure_time: parseInt(procedureTime),
        staff_required: parseInt(staffRequired),
        equipment_required: parseInt(equipmentRequired),
      }),
    });

    const result = await response.json();

    if (result.success) {
      Swal.fire({
        title: "สำเร็จ! ✅",
        text: "เพิ่มหัตถการเรียบร้อยแล้ว",
        icon: "success",
        confirmButtonColor: "#1E8449",
      });

      // ปิด modal
      closeAddStationProcedureModal();

      // โหลดข้อมูลหัตถการใหม่
      await loadProceduresForStation(currentStationId);
    } else {
      Swal.fire({
        title: "ข้อผิดพลาด ❌",
        text: result.message || "ไม่สามารถเพิ่มหัตถการได้",
        icon: "error",
        confirmButtonColor: "#C0392B",
      });
    }
  } catch (error) {
    console.error("Error adding station procedure:", error);
    Swal.fire({
      title: "ข้อผิดพลาด ❌",
      text: "เกิดข้อผิดพลาดในการเชื่อมต่อ: " + error.message,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}

async function resetDailyRooms() {
  try {
    const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    console.log("🔄 กำลังรีเซ็ตห้องวันที่:", currentDate);

    // ✅ ไม่ต้องแสดง loading ถ้าเป็นการ auto reset
    // เพียงแต่ส่ง request ไปเบื้องหลัง

    const response = await fetch(`${API_BASE_URL}/reset_daily_rooms.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_date: currentDate,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log("✅ รีเซ็ตห้องสำเร็จ:", result.data);

      // ✅ ถ้ามีข้อมูล logs ให้บันทึก
      const logs = [
        `🗑️ ลบพนักงาน: ${result.data.reset_count} คน`,
        `✅ มอบหมายพนักงาน: ${result.data.auto_assign_count} คน`,
        `📍 ประมวลผลห้อง: ${result.data.rooms_processed} ห้อง`,
      ];

      if (result.data.errors.length > 0) {
        logs.push(`⚠️ ข้อผิดพลาด: ${result.data.errors.length} รายการ`);
        result.data.errors.forEach((err) => {
          console.warn("  -", err);
        });
      }

      console.log("📊 สรุปการรีเซ็ต:\n" + logs.join("\n"));

      // ✅ รีโหลดข้อมูลสถานีถ้ากำลังดูอยู่
      if (currentStationId) {
        setTimeout(() => {
          console.log("🔄 รีโหลดข้อมูลสถานี...");
          openStationDetail(currentStationId);
        }, 500);
      }
    } else {
      console.error("❌ รีเซ็ตล้มเหลว:", result.message);
    }
  } catch (error) {
    console.error("❌ Error resetting daily rooms:", error);
  }
}

/**
 * Auto Reset Daily Rooms on Page Load
 * เรียกใช้อัตโนมัติเมื่อโหลดหน้า
 */
let lastResetDate = null;

/**
 * ✅ AUTO RESET: ตรวจสอบและรีเซ็ตห้องทุกวัน
 */
function autoResetDailyRooms() {
  const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // ✅ ตรวจสอบจาก localStorage ว่าวันนี้รีเซ็ตแล้วหรือยัง
  const storedResetDate = localStorage.getItem("lastDailyResetDate");

  console.log("📅 ตรวจสอบรีเซ็ต:", {
    currentDate: currentDate,
    storedResetDate: storedResetDate,
    needsReset: currentDate !== storedResetDate,
  });

  // ✅ ถ้าวันนี้ยังไม่ได้รีเซ็ต ให้รีเซ็ตทั้งระบบ
  if (currentDate !== storedResetDate) {
    console.log("🔄 รีเซ็ตห้องวันใหม่:", currentDate);
    resetDailyRooms();
    localStorage.setItem("lastDailyResetDate", currentDate);
  } else {
    console.log("✅ รีเซ็ตแล้วในวันนี้");
  }
}
/**
 * ✅ SCHEDULED RESET: รีเซ็ตอัตโนมัติในเที่ยงคืน
 */
function scheduleNextMidnightReset() {
  // ✅ คำนวณเวลาถึงเที่ยงคืนครั้งต่อไป
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const msUntilMidnight = tomorrow - now;

  console.log(
    `⏰ ตั้งค่า reset ให้ทำงานในอีก ${(
      msUntilMidnight /
      1000 /
      60 /
      60
    ).toFixed(2)} ชั่วโมง`
  );

  // ✅ ตั้ง timeout ให้รีเซ็ตเมื่อถึงเที่ยงคืน
  setTimeout(() => {
    console.log("🌙 ถึงเที่ยงคืนแล้ว ทำการรีเซ็ต...");
    autoResetDailyRooms();
    // ✅ หลังจากรีเซ็ต ตั้งค่าให้รีเซ็ตอีกครั้งพรุ่งนี้เที่ยงคืน
    scheduleNextMidnightReset();
  }, msUntilMidnight);
}
/**
 * ✅ MANUAL RESET: ให้ผู้ใช้สามารถรีเซ็ตได้ด้วยตนเอง
 */

async function manualResetDailyRooms() {
  const result = await Swal.fire({
    title: "🔄 รีเซ็ตห้องและพนักงาน?",
    text: "การรีเซ็ตจะลบการมอบหมายของวันนี้ และมอบหมายพนักงานใหม่ให้กับห้อง คุณแน่ใจหรือ?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "✅ ใช่ รีเซ็ตเลย",
    cancelButtonText: "❌ ยกเลิก",
    confirmButtonColor: "#0056B3",
    cancelButtonColor: "#6c757d",
  });

  if (result.isConfirmed) {
    // แสดง loading
    Swal.fire({
      title: "⏳ กำลังรีเซ็ต...",
      html: '<div style="margin-top: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #0056B3;"></i></div>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    try {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];

      // ✅ ส่งเวลาจาก client ไปให้เซิร์ฟเวอร์
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const clientTime = `${hours}:${minutes}:${seconds}`;

      console.log("📤 ส่งคำขอรีเซ็ต...", {
        currentDate,
        clientTime,
        serverExpected: "09:32:00 (เวลาไทย)",
      });

      const response = await fetch("/hospital/api/reset_daily_rooms.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_date: currentDate,
          client_time: clientTime, // ✅ ส่งเวลาจาก client ด้วย
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ HTTP Error:",
          response.status,
          errorText.substring(0, 200)
        );
        throw new Error(
          `HTTP ${response.status}: ${errorText.substring(0, 100)}`
        );
      }

      const resultData = await response.json();
      console.log("📊 ผลลัพธ์รีเซ็ต:", resultData);

      // ✅ ปิด loading ก่อนแสดงผล
      Swal.close();

      if (resultData.success) {
        // ✅ ดึงข้อมูลที่อาจไม่มีใน response (ใช้ค่า default)
        const resetCount = resultData.data?.reset_count || 0;
        const autoAssignCount = resultData.data?.auto_assign_count || 0;
        const roomsProcessed = resultData.data?.rooms_processed || 0;
        const staffOnShift = resultData.data?.staff_on_shift || 0;
        const totalStaffToday = resultData.data?.total_staff_today || 0;
        const unassignedStaff = resultData.data?.unassigned_staff || 0;
        const currentTime = resultData.data?.current_time || clientTime;

        const errors = resultData.data?.errors || [];
        const assignmentLog = resultData.data?.assignment_log || [];

        // ✅ สร้างข้อความ error
        let errorText = "";
        if (errors.length > 0) {
          errorText =
            '<div style="margin-top: 10px; padding: 10px; background: #ffeaa7; border-radius: 5px;">';
          errorText += "<strong>⚠️ เตือน:</strong><br>";
          errors.forEach((error) => {
            errorText += `• ${error}<br>`;
          });
          errorText += "</div>";
        }

        // ✅ สร้างข้อความ log
        let logText = "";
        if (assignmentLog.length > 0) {
          logText =
            '<div style="margin-top: 10px; max-height: 200px; overflow-y: auto; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 12px;">';
          assignmentLog.forEach((log) => {
            logText += `${log}<br>`;
          });
          logText += "</div>";
        }

        // ✅ แสดงผลลัพธ์ตามสถานการณ์
        if (staffOnShift === 0) {
          // กรณีไม่มีพนักงานเข้างาน
          Swal.fire({
            title: "ℹ️ ไม่มีพนักงานที่เข้างานแล้ว",
            html: `
                            <div style="text-align: left; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                                <p style="margin: 8px 0;">
                                    📅 <strong>วันที่:</strong> ${currentDate}
                                </p>
                                <p style="margin: 8px 0;">
                                    ⏰ <strong>เวลา:</strong> ${currentTime}
                                </p>
                                <p style="margin: 8px 0;">
                                    📊 <strong>พนักงานทั้งหมดวันนี้:</strong> ${totalStaffToday} คน
                                </p>
                                <p style="margin: 8px 0;">
                                    👥 <strong>พนักงานที่เข้างานแล้ว:</strong> 0 คน
                                </p>
                                <p style="margin: 8px 0; color: #e74c3c;">
                                    ⚠️ <strong>สถานะ:</strong> รอจนกว่าจะถึงเวลาเริ่มงานของพนักงาน
                                </p>
                                ${logText}
                                ${errorText}
                            </div>
                        `,
            icon: "info",
            confirmButtonColor: "#3498db",
            confirmButtonText: "ตกลง",
            width: "600px",
          });
        } else {
          // กรณีมีพนักงานเข้างาน
          Swal.fire({
            title: "✅ รีเซ็ตสำเร็จ!",
            html: `
                            <div style="text-align: left; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                                <p style="margin: 8px 0;">
                                    📅 <strong>วันที่:</strong> ${currentDate}
                                </p>
                                <p style="margin: 8px 0;">
                                    ⏰ <strong>เวลา:</strong> ${currentTime}
                                </p>
                                <p style="margin: 8px 0;">
                                    📊 <strong>พนักงานทั้งหมดวันนี้:</strong> ${totalStaffToday} คน
                                </p>
                                <p style="margin: 8px 0;">
                                    👥 <strong>พนักงานที่เข้างานแล้ว:</strong> ${staffOnShift} คน
                                </p>
                                <p style="margin: 8px 0;">
                                    🗑️ <strong>ลบรายการเก่า:</strong> <span style="color: #C0392B; font-weight: 700;">${resetCount}</span> คน
                                </p>
                                <p style="margin: 8px 0;">
                                    ✅ <strong>มอบหมายใหม่:</strong> <span style="color: #1E8449; font-weight: 700;">${autoAssignCount}</span> คน
                                </p>
                                <p style="margin: 8px 0;">
                                    🏥 <strong>ห้องที่ประมวล:</strong> <span style="color: #0056B3; font-weight: 700;">${roomsProcessed}</span> ห้อง
                                </p>
                                <p style="margin: 8px 0;">
                                    👤 <strong>พนักงานไม่ได้รับการมอบหมาย:</strong> <span style="color: #f39c12; font-weight: 700;">${unassignedStaff}</span> คน
                                </p>
                                ${logText}
                                ${errorText}
                            </div>
                        `,
            icon: "success",
            confirmButtonColor: "#1E8449",
            confirmButtonText: "ตกลง",
            width: "650px",
          });
        }

        // ✅ รีโหลดข้อมูลสถานี (ถ้ามี currentStationId)
        if (typeof currentStationId !== "undefined" && currentStationId) {
          setTimeout(() => {
            console.log("🔄 กำลังรีโหลดข้อมูลสถานี...");
            // ตรวจสอบว่ามีฟังก์ชัน openStationDetail หรือไม่
            if (typeof openStationDetail === "function") {
              openStationDetail(currentStationId);
            } else if (typeof loadStationData === "function") {
              loadStationData(currentStationId);
            } else {
              location.reload(); // ถ้าไม่มีฟังก์ชันให้รีโหลดหน้า
            }
          }, 500);
        }
      } else {
        throw new Error(resultData.message || "ไม่ทราบสาเหตุ");
      }
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error);
      Swal.fire({
        title: "❌ เกิดข้อผิดพลาด",
        html: `
                    <div style="text-align: left; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                        <p style="margin: 8px 0; color: #e74c3c;">
                            <strong>ข้อผิดพลาด:</strong> ${
                              error.message || "ไม่สามารถรีเซ็ตได้"
                            }
                        </p>
                        <p style="margin: 8px 0;">
                            ⚠️ กรุณาตรวจสอบ:
                        </p>
                        <ul style="margin: 8px 0; padding-left: 20px;">
                            <li>เวลาเซิร์ฟเวอร์ (ควรเป็น Asia/Bangkok)</li>
                            <li>การเชื่อมต่อฐานข้อมูล</li>
                            <li>ไฟล์ reset_daily_rooms.php</li>
                        </ul>
                    </div>
                `,
        icon: "error",
        confirmButtonColor: "#C0392B",
        width: "550px",
      });
    }
  }
}
/**
 * ✅ INIT: เรียกเมื่อโหลดหน้าเสร็จ
 */
document.addEventListener("DOMContentLoaded", function () {
  console.log("📱 หน้าเพจโหลดเสร็จ เริ่มการรีเซ็ตอัตโนมัติ...");

  // ✅ รีเซ็ตตอนเปิดหน้า
  autoResetDailyRooms();

  // ✅ ตั้ง schedule สำหรับรีเซ็ตเที่ยงคืนพรุ่งนี้
  scheduleNextMidnightReset();
});

// ✅ Visibility API: ตรวจสอบการรีเซ็ตเมื่อกลับเข้ามาดูหน้า
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    console.log("👁️ กลับมาดูหน้าแล้ว ตรวจสอบการรีเซ็ต...");
    autoResetDailyRooms();
  }
});
// ===== END DAILY ROOM RESET FUNCTIONS =====

// เชื่อมต่อปุ่มกับฟังก์ชัน
document.addEventListener("DOMContentLoaded", function () {
  const resetBtn = document.getElementById("manualResetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", manualResetDailyRooms);
    console.log("✅ ปุ่มรีเซ็ตพร้อมใช้งาน");
  }
});

let breakCheckInterval = null;

/**
 * ✅ ตรวจสอบและจัดการพักเบรค
 */
async function checkAndManageBreakTime() {
  try {
    const currentTime = new Date();
    const hours = String(currentTime.getHours()).padStart(2, "0");
    const minutes = String(currentTime.getMinutes()).padStart(2, "0");
    const seconds = String(currentTime.getSeconds()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}:${seconds}`;
    const currentDate = new Date().toISOString().split("T")[0];

    console.log(`⏰ [${formattedTime}] ตรวจสอบการพักผ่อน...`);

    // ✅ ใช้ API_BASE ให้สอดคล้องกัน
    const response = await fetch(API_BASE + "manage_break_time.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_time: formattedTime,
        current_date: currentDate,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ HTTP Error:", response.status, text.substring(0, 100));
      return false;
    }

    const result = await response.json();
    console.log("📊 manage_break_time response:", result);

    if (result.success) {
      console.log(`📊 พบพนักงานที่พัก: ${result.data.on_break_count || 0} คน`);
      console.log(`📊 แทนที่พนักงาน: ${result.data.replaced_count || 0} คน`);

      // ✅ รีโหลดเฉพาะส่วนที่จำเป็น (ไม่ต้องรีโหลดทั้งหน้า)
      if (result.data.on_break_count > 0 || result.data.replaced_count > 0) {
        // ถ้ามี currentStationId ให้โหลดข้อมูลสถานีนั้น
        if (typeof currentStationId !== "undefined" && currentStationId) {
          console.log(`🔄 รีโหลดข้อมูลสถานี: ${currentStationId}`);
          await loadStationStaff(currentStationId);

          // แสดง notification แบบไม่รบกวน
          if (typeof showNotification !== "undefined") {
            showNotification(
              "🔄 อัพเดทพนักงานสำเร็จ",
              `พักเบรค: ${result.data.on_break_count} คน, แทนที่: ${result.data.replaced_count} คน`,
              "success"
            );
          }
        }
      }

      return true;
    } else {
      console.warn("⚠️ manage_break_time ไม่สำเร็จ:", result.message);
      return false;
    }
  } catch (error) {
    console.error("❌ Error in checkAndManageBreakTime:", error.message);
    return false;
  }
}
/**
 * ✅ เริ่มตัวจับเวลา
 */
function startBreakTimeChecker() {
  // ✅ ตรวจสอบทันทีเมื่อเปิดหน้า
  checkAndManageBreakTime();

  // ✅ ตรวจสอบทุก 1 นาที (60000 มิลลิวินาที)
  breakCheckInterval = setInterval(() => {
    checkAndManageBreakTime();
  }, 60000);

  console.log("✅ เปิดตัวจับเวลาพักเบรค - ตรวจสอบทุก 1 นาที");
}

/**
 * ✅ หยุดตัวจับเวลา
 */
function stopBreakTimeChecker() {
  if (breakCheckInterval) {
    clearInterval(breakCheckInterval);
    breakCheckInterval = null;
    console.log("⏹️ หยุดตัวจับเวลาพักเบรค");
  }
}

/**
 * ✅ เริ่มเมื่อหน้าโหลด
 */
document.addEventListener("DOMContentLoaded", function () {
  console.log("📱 เริ่มระบบจัดการพักเบรคอัตโนมัติ...");
  startBreakTimeChecker();
});

/**
 * ✅ หยุดเมื่อปิดหน้า
 */
window.addEventListener("beforeunload", function () {
  stopBreakTimeChecker();
});

/**
 * ✅ ตรวจสอบเมื่อหน้ากลับมาโฟกัส
 */
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    console.log("👁️ หน้ากลับมาโฟกัส - ตรวจสอบพักเบรคทันที");
    checkAndManageBreakTime();
  }
});
async function loadAllStationStaffForDaily(stationId, workDate) {
  try {
    console.log(
      `📊 ดึงพนักงานทั้งหมด - Station: ${stationId}, Date: ${workDate}`
    );

    const response = await fetch(
      `${API_BASE_URL}/get_all_station_staff_for_daily.php?station_id=${stationId}&work_date=${workDate}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "ไม่สามารถดึงข้อมูลพนักงาน");
    }

    const staffList = result.data || [];
    console.log(`👥 พบพนักงาน: ${staffList.length} คน`);

    return staffList;
  } catch (error) {
    console.error("❌ ข้อผิดพลาด:", error);
    throw error;
  }
}
function createStaffOptions(staffList, workDate) {
  let options = '<option value="">-- เลือกพนักงาน --</option>';

  staffList.forEach((staff) => {
    // ✅ ถ้าเพิ่มเข้าห้องแล้ว แสดง ✓
    const statusIcon = staff.is_assigned_today
      ? `✓ (บันทึกแล้ว: ${staff.assigned_rooms}) `
      : "";

    // ✅ เวลาทำงาน
    const workStart = staff.work_start_time
      ? staff.work_start_time.substring(0, 5)
      : "08:00";
    const workEnd = staff.work_end_time
      ? staff.work_end_time.substring(0, 5)
      : "17:00";

    // ✅ Data attributes
    const workStartFull = staff.work_start_time || "08:00:00";
    const workEndFull = staff.work_end_time || "17:00:00";
    const breakStartFull = staff.break_start_time || "12:00:00";
    const breakEndFull = staff.break_end_time || "13:00:00";

    options += `
            <option 
                value="${staff.station_staff_id}" 
                data-name="${staff.staff_name}"
                data-type="${staff.staff_type || "Staff"}"
                data-work-start="${workStartFull}"
                data-work-end="${workEndFull}"
                data-break-start="${breakStartFull}"
                data-break-end="${breakEndFull}"
                ${
                  staff.is_assigned_today
                    ? 'style="color: #999; font-style: italic;"'
                    : ""
                }
            >
                ${statusIcon}${staff.staff_name} (${
      staff.staff_type || "Staff"
    }) [${workStart}-${workEnd}]
            </option>
        `;
  });

  return options;
}

// ===== EDIT STAFF SCHEDULE FUNCTIONS =====

/**
 * เปิด Modal แก้ไขตารางเวลาพนักงาน
 */
async function openEditStaffScheduleModal(
  stationStaffId,
  staffName,
  workStartTime,
  breakStartTime,
  breakEndTime,
  workEndTime
) {
  // ตั้งค่า form
  document.getElementById("editStationStaffId").value = stationStaffId;
  document.getElementById("editStaffName").value = staffName;

  // แปลงเวลา
  document.getElementById("editWorkStartTime").value = workStartTime
    ? workStartTime.substring(0, 5)
    : "08:00";
  document.getElementById("editBreakStartTime").value = breakStartTime
    ? breakStartTime.substring(0, 5)
    : "12:00";
  document.getElementById("editBreakEndTime").value = breakEndTime
    ? breakEndTime.substring(0, 5)
    : "13:00";
  document.getElementById("editWorkEndTime").value = workEndTime
    ? workEndTime.substring(0, 5)
    : "17:00";

  // เปิด Modal
  document.getElementById("editStaffScheduleModal").style.display = "block";
}

/**
 * ปิด Modal แก้ไขตารางเวลาพนักงาน
 */
function closeEditStaffScheduleModal() {
  document.getElementById("editStaffScheduleModal").style.display = "none";
}

/**
 * บันทึกการแก้ไขตารางเวลาทำงานพนักงาน
 */ async function saveEditStaffSchedule() {
  const stationStaffId = document.getElementById("editStationStaffId").value;
  const workStartTime = document.getElementById("editWorkStartTime").value;
  const breakStartTime = document.getElementById("editBreakStartTime").value;
  const breakEndTime = document.getElementById("editBreakEndTime").value;
  const workEndTime = document.getElementById("editWorkEndTime").value;

  // ตรวจสอบ
  if (!workStartTime || !breakStartTime || !breakEndTime || !workEndTime) {
    Swal.fire({
      icon: "warning",
      title: "โปรดตรวจสอบ",
      text: "โปรดกรอกเวลาทั้งหมด",
      confirmButtonColor: "#D68910",
    });
    return;
  }

  if (
    workStartTime >= breakStartTime ||
    breakStartTime >= breakEndTime ||
    breakEndTime >= workEndTime
  ) {
    Swal.fire({
      icon: "warning",
      title: "ลำดับเวลาไม่ถูกต้อง",
      html: `
                <div style="text-align: left; color: #C0392B;">
                    โปรดตรวจสอบลำดับเวลา:<br><br>
                    <strong>✓ ต้องเป็น:</strong><br>
                    เข้างาน &lt; เริ่มพักเบรก &lt; จบพักเบรก &lt; เลิกงาน
                </div>
            `,
      confirmButtonColor: "#D68910",
    });
    return;
  }

  try {
    console.log("📤 ส่งข้อมูล:", {
      station_staff_id: stationStaffId,
      work_start_time: workStartTime + ":00",
      work_end_time: workEndTime + ":00",
      break_start_time: breakStartTime + ":00",
      break_end_time: breakEndTime + ":00",
    });

    // ✅ ใช้ station_staff_id ไม่ใช่ room_staff_id
    const response = await fetch(`${API_BASE_URL}/update_staff_schedule.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        station_staff_id: stationStaffId, // ✅ KEY FIX
        work_start_time: workStartTime + ":00",
        work_end_time: workEndTime + ":00",
        break_start_time: breakStartTime + ":00",
        break_end_time: breakEndTime + ":00",
        work_date: new Date().toISOString().split("T")[0],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ ตัวอักษรตอบสนอง:", result);

    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ! ✅",
        html: `
                    <div style="text-align: left;">
                        <p><strong>อัปเดตเวลาทำงาน</strong></p>
                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 10px 0; font-size: 13px;">
                            ⏱️ เข้างาน: <strong>${workStartTime}</strong><br>
                            🚪 เลิกงาน: <strong>${workEndTime}</strong><br>
                            ☕ พักเบรก: <strong>${breakStartTime} - ${breakEndTime}</strong>
                        </div>
                    </div>
                `,
        confirmButtonColor: "#1E8449",
        confirmButtonText: "ตกลง",
      });

      // ปิด Modal
      document.getElementById("editStaffScheduleModal").style.display = "none";

      // รีโหลด
      if (currentStationId) {
        setTimeout(() => {
          loadStationStaff(currentStationId);
        }, 500);
      }
    } else {
      throw new Error(result.message || "ไม่สามารถบันทึกได้");
    }
  } catch (error) {
    console.error("❌ ข้อผิดพลาด:", error);
    Swal.fire({
      icon: "error",
      title: "เกิดข้อผิดพลาด ❌",
      text: error.message || "ไม่สามารถบันทึกเวลาทำงานได้",
      confirmButtonColor: "#C0392B",
    });
  }
}
// ===== END EDIT STAFF SCHEDULE FUNCTIONS =====

/**
 * ตรวจสอบรูปแบบเวลา 24 ชั่วโมง (HH:MM)
 */
function isValidTime24Hour(timeStr) {
  // ตรวจสอบรูปแบบ HH:MM
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

/**
 * แปลงเวลาจาก HH:MM:SS เป็น HH:MM
 */
function formatTime24Hour(timeStr) {
  if (!timeStr || timeStr === "-") return "08:00";

  if (timeStr.includes(":")) {
    return timeStr.substring(0, 5);
  }

  return "08:00";
}

let lastCheckedMinute = -1;

function startBreakTimeAutoCheck() {
  console.log("📅 เริ่มตรวจสอบเบรคอัตโนมัติ...");

  // ✅ ตรวจสอบทุก 10 วินาที (แทน 1 นาที)
  breakCheckInterval = setInterval(() => {
    const now = new Date();
    const currentTime =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0") +
      ":" +
      String(now.getSeconds()).padStart(2, "0");
    const currentMinute = now.getMinutes();

    // ✅ ป้องกัน check ซ้ำในนาทีเดียวกัน
    if (currentMinute !== lastCheckedMinute) {
      lastCheckedMinute = currentMinute;

      console.log(`⏰ [${currentTime}] ตรวจสอบเวลาพักเบรค...`);

      // ✅ เรียก manage_break_time.php (เข้าเบรค)
      checkAndManageBreakTime();

      // ✅ เรียก restore_break_staff.php (ออกเบรค)
      checkAndRestoreBreakStaff();
    }
  }, 10000); // ตรวจสอบทุก 10 วินาที
}

/**
 * ✅ Get API base path (auto detect)
 */
function getApiBasePath() {
  const currentPath = window.location.pathname;

  // ถ้า URL มี /hospital/ ให้เอาออก
  if (currentPath.includes("/hospital/")) {
    return "/hospital/api/";
  }

  // ถ้า URL มี /api/ แล้ว ให้ใช้เลย
  if (currentPath.includes("/api/")) {
    return "/api/";
  }

  // Default
  return "api/";
}
// ✅ เพิ่มแทน:
if (typeof API_BASE_URL === "undefined") {
  // ถ้า main.php ยังไม่ได้ประกาศ ให้ประกาศเอง
  const currentPath = window.location.pathname;

  if (currentPath.includes("/hospital/")) {
    window.API_BASE_URL = "/hospital/api/";
  } else if (currentPath.includes("/api/")) {
    window.API_BASE_URL = "/api/";
  } else {
    window.API_BASE_URL = "/api/";
  }

  console.log(
    "⚠️ API_BASE_URL ไม่ได้ประกาศจาก main.php - ใช้ default:",
    window.API_BASE_URL
  );
} else {
  console.log("✅ API_BASE_URL ประกาศจาก main.php:", API_BASE_URL);
}

// ✅ ตรวจสอบว่า API_BASE_URL มีตัวคั่น / ที่ท้าย
if (!API_BASE_URL.endsWith("/")) {
  window.API_BASE_URL = API_BASE_URL + "/";
  console.log("✅ เพิ่มตัวคั่น / ที่ท้าย:", API_BASE_URL);
}

// ✅ ใช้ API_BASE_URL ทุกที่ (ลบการใช้ API_BASE)
const USE_API_BASE_URL = API_BASE_URL;
console.log("🔗 API Base URL ขั้นสุดท้าย:", USE_API_BASE_URL);
// const API_BASE = getApiBasePath();
// console.log("🔗 API Base Path:", API_BASE);

/**
 * ✅ เรียก manage_break_time.php
 */
async function checkAndManageBreakTime() {
  try {
    const currentTime = new Date();
    const hours = String(currentTime.getHours()).padStart(2, "0");
    const minutes = String(currentTime.getMinutes()).padStart(2, "0");
    const seconds = String(currentTime.getSeconds()).padStart(2, "0");

    console.log(`⏰ [${hours}:${minutes}:${seconds}] ตรวจสอบการพักผ่อน...`);

    // ✅ เปลี่ยนเป็น absolute path
    const response = await fetch("/hospital/api/manage_break_time.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_time: `${hours}:${minutes}:${seconds}`,
        current_date: new Date().toISOString().split("T")[0],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("HTTP Error:", response.status, text.substring(0, 100));
      return;
    }

    const result = await response.json();
    console.log("📊 API Response:", result);

    if (result.success && result.data.on_break_count > 0) {
      console.log(`✅ Found ${result.data.on_break_count} staff on break`);
      console.log(`✅ Replaced: ${result.data.replaced_count}`);
      console.log(`📋 Log:`, result.data.replacement_log);

      if (currentStationId) {
        setTimeout(() => {
          loadStationStaff(currentStationId);
        }, 500);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}
/**
 * ✅ เรียก restore_break_staff.php
 */
async function checkAndRestoreBreakStaff() {
  try {
    console.log("🔄 ตรวจสอบพนักงานที่พักเบรคเสร็จ...");

    const response = await fetch(getApiUrl("restore_break_staff.php"), {
      method: "POST", // ✅ เปลี่ยนเป็น POST
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_date: new Date().toISOString().split("T")[0],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("📊 restore_break_staff response:", result);

    if (result.success) {
      const restoredCount = result.data.restored_count || 0;
      console.log(`✅ ฟื้นคืนพนักงาน: ${restoredCount} คน`);

      if (restoredCount > 0) {
        // ✅ ไม่ใช้ location.reload() แต่ใช้การรีโหลดแบบเฉพาะส่วน
        console.log("🔄 อัพเดท UI หลังฟื้นคืนพนักงาน...");

        // 1. อัพเดทสถานีปัจจุบัน
        if (typeof currentStationId !== "undefined" && currentStationId) {
          console.log(`🔄 รีโหลดข้อมูลสถานี: ${currentStationId}`);

          // รีโหลดข้อมูลพนักงาน
          if (typeof loadStationStaff !== "undefined") {
            await loadStationStaff(currentStationId);
          }

          // รีโหลดข้อมูลห้อง
          if (typeof loadRoomsForStation !== "undefined") {
            await loadRoomsForStation(currentStationId);
          }
        }

        // 3. อัพเดทข้อมูลทั่วไป (ถ้ามี)
        if (typeof refreshAllData !== "undefined") {
          refreshAllData();
        }
      }

      return restoredCount;
    } else {
      console.warn("⚠️ restore_break_staff ไม่สำเร็จ:", result.message);

      // แสดงข้อความแจ้งเตือนถ้าจำเป็น
      if (typeof showNotification !== "undefined") {
        showNotification("⚠️ เกิดข้อผิดพลาด", result.message, "warning");
      }

      return 0;
    }
  } catch (error) {
    console.error("❌ Error in checkAndRestoreBreakStaff:", error.message);

    // แสดง error
    if (typeof showNotification !== "undefined") {
      showNotification("❌ เกิดข้อผิดพลาด", error.message, "error");
    }

    return 0;
  }
}
/**
 * ✅ ฟังก์ชันหลักสำหรับจัดการเบรค (รวมทั้งตรวจสอบและฟื้นคืน)
 */

async function manageBreakSystem() {
  try {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    console.log(`⏰ [${currentHour}:${currentMinute}] ตรวจสอบระบบพักเบรค...`);

    // ✅ ตรวจสอบและจัดการพนักงานที่พักเบรค
    const breakResult = await checkAndManageBreakTime();

    // ✅ ตรวจสอบและฟื้นคืนพนักงานที่พักเสร็จแล้ว (เฉพาะบางเวลา)
    // เช่น ตรวจสอบทุก 30 นาที หรือหลังเวลาเลิกเบรคทั่วไป
    const shouldCheckRestore =
      currentMinute === 0 || // ทุกชั่วโมงเต็ม
      currentMinute === 30 || // ทุกครึ่งชั่วโมง
      currentHour >= 12; // ช่วงบ่ายเป็นต้นไป (อาจมีคนพักเสร็จแล้ว)

    if (shouldCheckRestore) {
      console.log("🔄 ตรวจสอบพนักงานที่พักเสร็จแล้ว...");
      await checkAndRestoreBreakStaff();
    }
  } catch (error) {
    console.error("❌ Error in manageBreakSystem:", error.message);
  }
}

/**
 * ✅ ตั้งค่า timer สำหรับตรวจสอบพักเบรค
 */
function setupBreakTimer() {
  try {
    console.log("⏰ ตั้งค่าตัวจับเวลาตรวจสอบพักเบรค...");

    // ตรวจสอบทันทีที่โหลด
    setTimeout(() => {
      manageBreakSystem();
    }, 3000); // รอ 3 วินาทีให้หน้าพร้อม

    // ตั้ง timer ตรวจสอบทุก 1 นาที
    const breakCheckInterval = setInterval(() => {
      manageBreakSystem();
    }, 300000); // 60,000ms = 1 นาที

    console.log(`✅ ตัวจับเวลาตรวจสอบพักเบรคทำงานทุก 1 นาที`);

    // บันทึก interval ID สำหรับล้างทิ้งทีหลัง
    window.breakCheckInterval = breakCheckInterval;

    return true;
  } catch (error) {
    console.error("❌ Error setting up break timer:", error.message);
    return false;
  }
}

/**
 * ✅ ล้าง timer เมื่อไม่ต้องการใช้งาน
 */
function clearBreakTimer() {
  if (window.breakCheckInterval) {
    clearInterval(window.breakCheckInterval);
    console.log("✅ ล้างตัวจับเวลาตรวจสอบพักเบรคแล้ว");
  }
}

/**
 * ✅ เรียก check_equipment_status.php
 */
async function checkEquipmentStatus() {
  try {
    const response = await fetch(API_BASE + "check_equipment_status.php", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success && result.data.update_log.length > 0) {
      console.log("⚙️ check_equipment_status:", result.data.update_log);
    }
  } catch (error) {
    console.error("❌ Error in checkEquipmentStatus:", error);
  }
}

function reloadRoomDetail(roomId) {
  console.log(`🔄 Reloading room ${roomId}...`);

  // ถ้ามี jQuery UI dialog เปิดอยู่
  if (typeof displayRoomDetail === "function") {
    displayRoomDetail(roomId);
  }
}

/**
 * ✅ Stop check
 */
function stopBreakTimeAutoCheck() {
  if (breakCheckInterval) {
    clearInterval(breakCheckInterval);
    console.log("⏹️ หยุดตรวจสอบเบรค");
  }
}

// ✅ เริ่มต้อเมื่อ page load
document.addEventListener("DOMContentLoaded", () => {
  startBreakTimeAutoCheck();
});

// แก้ไขใน station_room_management.js

// ใช้ sessionStorage แทน localStorage
function getResetData() {
  try {
    const data = sessionStorage.getItem("daily_reset_data");
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("❌ Error reading sessionStorage:", e);
    return null;
  }
}

function setResetData(data) {
  try {
    sessionStorage.setItem("daily_reset_data", JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("❌ Error writing to sessionStorage:", e);
    return false;
  }
}

function clearResetData() {
  try {
    sessionStorage.removeItem("daily_reset_data");
  } catch (e) {
    console.error("❌ Error clearing sessionStorage:", e);
  }
}

// ===== AUTO UPDATE STAFF STATUS EVERY MINUTE =====

/**
 * ✅ ตั้ง Timer เรียก autoUpdateStaffStatus ทุก 1 นาที
 */
let statusUpdateInterval = null;

function startAutoStatusUpdate() {
  console.log("⏰ เปิดตัวจับเวลาอัพเดท status - ตรวจสอบทุก 1 นาที");

  // ตรวจสอบทันทีตอนเปิด
  refreshStaffStatus();

  // ตั้ง interval ตรวจสอบทุก 60 วินาที
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
  }

  statusUpdateInterval = setInterval(() => {
    refreshStaffStatus();
  }, 60000); // 60,000ms = 1 นาที

  console.log("✅ Timer ทำงานแล้ว");
}

/**
 * ✅ หยุด Timer
 */
function stopAutoStatusUpdate() {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
    console.log("⏹️ หยุดอัพเดท status");
  }
}

/**
 * ✅ FIXED: refreshStaffStatus - ใช้ API_BASE_URL ที่ถูกต้อง
 */
async function refreshStaffStatus() {
  try {
    if (!currentStationId) {
      console.log("⏭️ ข้ามการอัพเดท - ยังไม่ได้เลือก station");
      return false;
    }

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMinute = String(now.getMinutes()).padStart(2, "0");
    const currentSecond = String(now.getSeconds()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}:${currentSecond}`;

    console.log(`⏰ [${currentTime}] เริ่มอัพเดท status ของพนักงาน...`);

    // ================================================
    // STEP 1: ดึงข้อมูลพนักงาน
    // ================================================
    const apiUrl =
      getApiUrl("get_station_staff_status.php") +
      `?station_id=${currentStationId}&work_date=${today}`;

    const response = await fetch(apiUrl);
    const result = await response.json();

    if (!result.success) {
      console.error("❌ API Error:", result.message);
      return false;
    }

    let staff = result.data?.staff || [];

    console.log(`✅ ดึงข้อมูล: ${staff.length} พนักงาน`);

    // ✅ ตรวจสอบว่า staff ว่างเปล่า
    if (!staff || staff.length === 0) {
      console.warn("⚠️ ไม่มีข้อมูลพนักงาน - ข้ามการอัพเดท");
      console.warn(
        "📊 ดีบัก response.data:",
        JSON.stringify(result.data, null, 2)
      );
      return false;
    }

    // ================================================
    // STEP 2: คำนวณ status
    // ================================================
    staff = staff.map((s) => {
      const workStart = s.work_start_time
        ? s.work_start_time.substring(0, 5)
        : "08:00";
      const workEnd = s.work_end_time
        ? s.work_end_time.substring(0, 5)
        : "17:00";
      const breakStart = s.break_start_time
        ? s.break_start_time.substring(0, 5)
        : "12:00";
      const breakEnd = s.break_end_time
        ? s.break_end_time.substring(0, 5)
        : "13:00";

      const currentTimeShort = currentTime.substring(0, 5);

      let status = "offline";

      if (currentTimeShort < workStart) {
        status = "waiting_to_start";
      } else if (
        currentTimeShort >= breakStart &&
        currentTimeShort < breakEnd
      ) {
        status = "on_break";
      } else if (currentTimeShort >= workEnd) {
        status = s.assigned_room_id ? "overtime" : "offline";
      } else if (currentTimeShort >= workStart && currentTimeShort < workEnd) {
        status = s.assigned_room_id ? "working" : "available";
      }

      s.status = status;

      return s;
    });

    console.log(
      `📊 Status ที่คำนวณได้:`,
      staff.slice(0, 3).map((s) => ({
        name: s.staff_name,
        status: s.status,
      }))
    );

    // ================================================
    // STEP 3: คำนวณ Stats
    // ================================================
    const stats = {
      total: staff.length,
      working: staff.filter((s) => s.status === "working").length,
      available: staff.filter((s) => s.status === "available").length,
      on_break: staff.filter((s) => s.status === "on_break").length,
      waiting_to_start: staff.filter((s) => s.status === "waiting_to_start")
        .length,
      offline: staff.filter((s) => s.status === "offline").length,
      overtime: staff.filter((s) => s.status === "overtime").length,
    };

    console.log(`📊 Stats:`, stats);

    // ================================================
    // STEP 4: อัพเดท UI
    // ================================================
    if (typeof displayStaffWithSchedule === "function") {
      console.log("🎨 เรียก displayStaffWithSchedule...");
      displayStaffWithSchedule(staff, stats);
      console.log("✅ UI อัพเดทเสร็จ");
    }

    // ================================================
    // ✅ STEP 5: บันทึก Status ลง Database
    // ================================================
    console.log(`📝 กำลังบันทึก status ลง database...`);

    const staffStatusUpdates = staff.map((s) => ({
      station_staff_id: s.station_staff_id,
      status: s.status,
      staff_name: s.staff_name,
    }));

    // 🔥 DEBUG: ตรวจสอบ payload ก่อนส่ง
    const payload = {
      station_id: currentStationId,
      work_date: today,
      staff_updates: staffStatusUpdates,
      current_time: currentTime,
    };

    console.log(`🔍 DEBUG: Payload ที่จะส่ง:`, {
      station_id: payload.station_id,
      work_date: payload.work_date,
      current_time: payload.current_time,
      staff_updates_count: payload.staff_updates.length,
      staff_updates_sample: payload.staff_updates.slice(0, 2),
    });

    console.log(`📤 Full payload:`, JSON.stringify(payload, null, 2));

    const saveResponse = await fetch(getApiUrl("update_staff_status.php"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // 🔥 DEBUG: ตรวจสอบ response
    const responseText = await saveResponse.text();
    console.log(`📥 Response Text:`, responseText);

    let saveResult;
    try {
      saveResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ JSON Parse Error:", parseError.message);
      console.error("📄 Response body:", responseText.substring(0, 500));
      throw new Error("Invalid JSON response from server");
    }

    if (saveResult.success) {
      const updatedCount = saveResult.data?.updated_count || 0;

      console.log(`✅ บันทึก status สำเร็จ: ${updatedCount} รายการ`);
      console.log(`📊 Source:`, saveResult.data?.source);

      if (saveResult.data?.updates) {
        saveResult.data.updates.slice(0, 3).forEach((update) => {
          console.log(
            `  📋 ${update.staff_name}: ${update.old_status} → ${update.new_status}`
          );
        });
      }
    } else {
      console.warn("⚠️ บันทึกล้มเหลว:", saveResult.message);
      console.warn("📊 ข้อมูลที่ส่ง:", payload);
    }

    return true;
  } catch (error) {
    console.error("❌ Exception:", error.message);
    console.error("Stack:", error.stack);
    return false;
  }
}
// ============================================
// ✅ ทดสอบ API โดยตรง
// ============================================

async function testAPIConnection() {
  console.log("🧪 ทดสอบการเชื่อมต่อ API...");

  // ✅ สมมติ station_id = 77
  const testStationId = 77;
  const testUrl = `/hospital/api/get_station_staff_status.php?station_id=${testStationId}`;

  console.log(`🔗 Test URL: ${testUrl}`);

  try {
    const response = await fetch(testUrl);
    const text = await response.text();

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📄 Response Text:`, text.substring(0, 500));

    // ✅ ลองแปลง JSON
    try {
      const json = JSON.parse(text);
      console.log("✅ JSON ถูกต้อง:", json);
    } catch (e) {
      console.error("❌ ไม่ใช่ JSON:", e.message);
    }
  } catch (error) {
    console.error("❌ Fetch Error:", error);
  }
}

/**
 * ✅ เรียกใช้เมื่อโหลดห้อง (openStationDetail)
 * เพิ่มบรรทัดนี้ลงในฟังก์ชัน openStationDetail
 */
function setupStatusAutoUpdate(stationId) {
  console.log(`🔧 ตั้งค่า status auto-update สำหรับ station: ${stationId}`);
  stopAutoStatusUpdate();
  startAutoStatusUpdate();
}

/**
 * ✅ หยุด timer เมื่อปิดห้อง (closeStationDetail)
 */
function cleanupStatusAutoUpdate() {
  console.log("🧹 ล้าง status auto-update");
  stopAutoStatusUpdate();
}

// ===== FALLBACK: Auto-update บน page load =====

document.addEventListener("DOMContentLoaded", function () {
  console.log("📱 Page loaded - ตั้งค่า auto status update");

  // ✅ ตั้งค่า timer ให้พร้อม (จะเปิดเมื่อเลือก station)
  // startAutoStatusUpdate();  // เรียก startAutoStatusUpdate ที่ setupStatusAutoUpdate instead
});

// ===== VISIBILITY API: ตรวจสอบเมื่อกลับเข้ามาดูหน้า =====

document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    console.log("👁️ กลับมาดูหน้าแล้ว - ตรวจสอบ status ทันที");

    // ✅ เรียก autoUpdateStaffStatus ทันที
    // autoUpdateStaffStatus();
  }
});

document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    console.log("👁️ กลับมาดูหน้าแล้ว - ตรวจสอบ status ทันที");

    if (currentStationId) {
      refreshStaffStatus();
    }
  }
});

let autoStaffCheckInterval = null;
let lastStaffCheckTime = null;

/**
 * ✅ เริ่มระบบจัดการพนักงานอัตโนมัติ
 */
function initAutoStaffSystem() {
  console.log("🚀 เริ่มระบบจัดการพนักงานอัตโนมัติ");

  // ✅ ตรวจสอบทันที
  checkAndAutoAssignStaff();

  // ✅ ตรวจสอบทุก 1 นาที
  if (autoStaffCheckInterval) {
    clearInterval(autoStaffCheckInterval);
  }

  autoStaffCheckInterval = setInterval(() => {
    checkAndAutoAssignStaff();
  }, 3000); // 3 วินาที = 1 นาที

  console.log("✅ ระบบจัดการพนักงานอัตโนมัติทำงานแล้ว (ตรวจสอบทุก 1 นาที)");
}

/**
 * ✅ ตรวจสอบและเพิ่มพนักงานอัตโนมัติ
 */
async function checkAndAutoAssignStaff() {
  try {
    const now = new Date();
    const currentTime =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0") +
      ":" +
      String(now.getSeconds()).padStart(2, "0");
    const currentDate = now.toISOString().split("T")[0];

    // ✅ ตรวจสอบเพื่อไม่ให้ทำซ้ำในนาทีเดียวกัน
    if (lastStaffCheckTime === currentTime.substring(0, 5)) {
      return;
    }
    lastStaffCheckTime = currentTime.substring(0, 5);

    console.log(`⏰ [${currentTime}] ตรวจสอบและจัดการพนักงาน...`);

    // ============================================
    // CALL 1: เพิ่มพนักงานอัตโนมัติในห้องที่ว่าง
    // ============================================
    const autoAssignResponse = await fetch(getApiUrl("auto_assign_staff.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_date: currentDate,
        current_time: currentTime,
      }),
    });

    const autoAssignResult = await autoAssignResponse.json();

    if (autoAssignResult.success) {
      const assignedCount = autoAssignResult.data.auto_assigned_count;

      if (assignedCount > 0) {
        console.log(`✅ เพิ่มพนักงาน: ${assignedCount} คน`);

        autoAssignResult.data.assignments.forEach((assign) => {
          console.log(`   📝 ${assign.message}`);
        });

        // อัพเดท UI ทันที
        if (currentStationId) {
          setTimeout(() => {
            loadStationStaff(currentStationId);
          }, 500);
        }
      }
    }

    // ============================================
    // CALL 2: จัดการการแทนพนักงานเบรค
    // ============================================
    const breakResponse = await fetch(
      getApiUrl("manage_break_replacement.php"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_date: currentDate,
          current_time: currentTime,
        }),
      }
    );

    const breakResult = await breakResponse.json();

    if (breakResult.success) {
      const replacementCount = breakResult.data.replacements_count;
      const restorationCount = breakResult.data.restorations_count;

      if (replacementCount > 0) {
        console.log(`🔄 แทนพนักงาน: ${replacementCount} คน`);

        breakResult.data.replacements.forEach((repl) => {
          console.log(
            `   📝 ${repl.original_staff} → ${repl.replacement_staff}`
          );
        });
      }

      if (restorationCount > 0) {
        console.log(`✅ คืนพนักงาน: ${restorationCount} คน`);

        breakResult.data.restorations.forEach((rest) => {
          console.log(`   📝 ${rest.message}`);
        });
      }

      // อัพเดท UI ถ้ามีการเปลี่ยนแปลง
      if ((replacementCount > 0 || restorationCount > 0) && currentStationId) {
        setTimeout(() => {
          loadStationStaff(currentStationId);

          // อัพเดทห้องปัจจุบันถ้าเปิดอยู่
          if (currentRoomId) {
            openRoomDetail(currentRoomId);
          }
        }, 500);
      }
    }
  } catch (error) {
    console.error("❌ ข้อผิดพลาดในการจัดการพนักงาน:", error);
  }
}

/**
 * ✅ หยุดระบบ
 */
function stopAutoStaffSystem() {
  if (autoStaffCheckInterval) {
    clearInterval(autoStaffCheckInterval);
    autoStaffCheckInterval = null;
    console.log("⏹️ หยุดระบบจัดการพนักงานอัตโนมัติ");
  }
}

/**
 * ✅ รีสตาร์ทระบบ
 */
function restartAutoStaffSystem() {
  stopAutoStaffSystem();
  setTimeout(() => {
    initAutoStaffSystem();
  }, 1000);
}

/**
 * ✅ เรียกใช้เมื่อหน้าโหลด
 */
document.addEventListener("DOMContentLoaded", function () {
  console.log("📱 หน้าโหลดเสร็จ - ตั้งค่าระบบจัดการพนักงานอัตโนมัติ");

  // ไม่ต้องเรียก initAutoStaffSystem() ที่นี่
  // เพราะจะเรียกเมื่อเปิด Station
});

/**
 * ✅ Visibility API - ตรวจสอบเมื่อกลับเข้ามาดูหน้า
 */
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    console.log("👁️ กลับมาดูหน้าแล้ว - รีสตาร์ทระบบจัดการพนักงาน");

    if (currentStationId && !autoStaffCheckInterval) {
      initAutoStaffSystem();
    } else if (!currentStationId) {
      stopAutoStaffSystem();
    }
  }
});

/**
 * ✅ ล้าง interval เมื่อปิดหน้า
 */
window.addEventListener("beforeunload", function () {
  stopAutoStaffSystem();
});

/**
 * ✅ ตรวจสอบสถานะห้องและขอเพิ่มพนักงาน
 */
async function checkRoomStaffAndRequest(roomId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}get_room_detail.php?room_id=${roomId}`
    );
    const result = await response.json();

    if (result.success) {
      const staff = result.data.staff || [];

      if (staff.length === 0) {
        console.log(`⚠️ ห้อง ${roomId} ไม่มีพนักงาน - ขอเพิ่มอัตโนมัติ`);
        await checkAndAutoAssignStaff();
      }
    }
  } catch (error) {
    console.error("❌ ข้อผิดพลาด:", error);
  }
}
/**
 * ✅ ดึงสถิติการจัดการพนักงาน
 */
async function getAutoStaffStats() {
  try {
    const response = await fetch(getApiUrl("get_staff_auto_assign_stats.php"));
    const result = await response.json();

    if (result.success) {
      return {
        total_auto_assigned: result.data.total_auto_assigned,
        total_replacements: result.data.total_replacements,
        last_update: result.data.last_update,
      };
    }
  } catch (error) {
    console.error("❌ ข้อผิดพลาด:", error);
    return null;
  }
}

/**
 * ✅ AUTO ASSIGN DOCTORS TO ROOMS
 * เพิ่มแพทย์เข้าห้องอัตโนมัติตามเลขห้องของพวกเขา
 */

/**
 * ✅ ตรวจสอบและเพิ่มแพทย์เข้าห้องอัตโนมัติ
 */
async function autoAssignDoctorsToRooms() {
  try {
    console.log("🏥 เริ่มเพิ่มแพทย์เข้าห้องอัตโนมัติ...");

    // ✅ ถ้าไม่มี currentStationId ให้ข้ามไป (ไม่ใช่ error)
    if (!currentStationId) {
      console.log(
        "⏭️ ยังไม่ได้เลือก Station - ข้ามการทำงาน (รอการเรียกครั้งต่อไป)"
      );
      return {
        success: false,
        error: "ยังไม่ได้เลือก Station",
        skipped: true,
      };
    }

    console.log(`✅ ใช้ Station ID: ${currentStationId}`);

    const currentDate = new Date().toISOString().split("T")[0];

    // ✅ STEP 1: ดึงแพทย์ที่ยังไม่ได้มอบหมายห้อง (assigned_room_id IS NULL)
    const unassignedResponse = await fetch(
      getApiUrl("get_unassigned_doctors.php") +
        `?station_id=${currentStationId}&work_date=${currentDate}`
    );

    if (!unassignedResponse.ok) {
      throw new Error(`HTTP ${unassignedResponse.status}`);
    }

    const unassignedResult = await unassignedResponse.json();

    if (!unassignedResult.success) {
      console.warn(
        "⚠️ ไม่สามารถดึงแพทย์ที่ยังไม่ได้มอบหมาย:",
        unassignedResult.message
      );
      return false;
    }

    const unassignedDoctors = unassignedResult.data || [];
    console.log(
      `👨‍⚕️ พบแพทย์ที่ยังไม่ได้มอบหมาย: ${unassignedDoctors.length} คน`
    );

    if (unassignedDoctors.length === 0) {
      console.log("✅ แพทย์ทั้งหมดได้รับการมอบหมายแล้ว");
      return true;
    }

    // ✅ STEP 2: สำหรับแต่ละแพทย์ เพิ่มเข้าห้องตามเลขห้อง
    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const doctor of unassignedDoctors) {
      try {
        // ✅ ตรวจสอบว่าแพทย์มี room_number หรือไม่
        if (!doctor.room_number) {
          console.warn(
            `⚠️ แพทย์ ${doctor.doctor_name} ไม่มี room_number - ข้าม`
          );
          failCount++;
          results.push({
            doctor_name: doctor.doctor_name,
            status: "skip",
            reason: "ไม่มี room_number",
          });
          continue;
        }

        // ✅ ใช้ currentStationId เพื่อค้นหาห้อง
        const roomResponse = await fetch(
          getApiUrl("get_room_by_number.php") +
            `?station_id=${currentStationId}&room_number=${doctor.room_number}`
        );

        if (!roomResponse.ok) {
          throw new Error(`HTTP ${roomResponse.status}`);
        }

        const roomResult = await roomResponse.json();

        if (!roomResult.success) {
          console.warn(
            `⚠️ ไม่พบห้องหมายเลข ${doctor.room_number} สำหรับแพทย์ ${doctor.doctor_name}`
          );
          failCount++;
          results.push({
            doctor_name: doctor.doctor_name,
            status: "error",
            reason: `ไม่พบห้องหมายเลข ${doctor.room_number}`,
          });
          continue;
        }

        const room = roomResult.data;
        const roomId = room.room_id;

        // ✅ STEP 3: เรียก assign_doctor_to_room.php เพื่อเพิ่มแพทย์เข้าห้อง
        const assignResponse = await fetch(
          getApiUrl("assign_doctor_to_room.php"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              station_doctor_id: doctor.station_doctor_id,
              room_id: roomId,
              station_id: currentStationId,
              work_date: currentDate,
            }),
          }
        );

        if (!assignResponse.ok) {
          throw new Error(`HTTP ${assignResponse.status}`);
        }

        const assignResult = await assignResponse.json();

        if (assignResult.success) {
          console.log(
            `✅ เพิ่มแพทย์ ${doctor.doctor_name} เข้าห้อง ${room.room_name} สำเร็จ`
          );
          successCount++;
          results.push({
            doctor_name: doctor.doctor_name,
            room_name: room.room_name,
            status: "success",
          });
        } else {
          console.error(
            `❌ ไม่สามารถเพิ่มแพทย์ ${doctor.doctor_name}:`,
            assignResult.message
          );
          failCount++;
          results.push({
            doctor_name: doctor.doctor_name,
            status: "error",
            reason: assignResult.message,
          });
        }
      } catch (error) {
        console.error(
          `❌ เกิดข้อผิดพลาดในการเพิ่มแพทย์ ${doctor.doctor_name}:`,
          error.message
        );
        failCount++;
        results.push({
          doctor_name: doctor.doctor_name,
          status: "error",
          reason: error.message,
        });
      }
    }

    // ✅ STEP 4: สรุปผลลัพธ์
    console.log(`📊 สรุป:`);
    console.log(`  ✅ สำเร็จ: ${successCount} คน`);
    console.log(`  ❌ ล้มเหลว: ${failCount} คน`);
    console.log(`  📋 รายละเอียด:`, results);

    return {
      success: true,
      successCount,
      failCount,
      results,
    };
  } catch (error) {
    console.error("❌ ข้อผิดพลาดในการเพิ่มแพทย์อัตโนมัติ:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * ✅ ตั้ง Timer สำหรับเพิ่มแพทย์อัตโนมัติ
 */
let autoAssignDoctorInterval = null;

function startAutoAssignDoctors() {
  // ✅ ถ้ามี timer อยู่แล้ว ให้หยุดก่อน
  if (autoAssignDoctorInterval) {
    clearInterval(autoAssignDoctorInterval);
    autoAssignDoctorInterval = null;
  }

  console.log("⏰ เปิดตัวจับเวลาเพิ่มแพทย์อัตโนมัติ - ตรวจสอบทุก 5 นาที");

  // ✅ ตรวจสอบทันทีตอนเปิด
  autoAssignDoctorsToRooms();

  // ✅ ตั้ง interval ตรวจสอบทุก 5 นาที
  autoAssignDoctorInterval = setInterval(() => {
    if (currentStationId) {
      autoAssignDoctorsToRooms();
    } else {
      console.log("⏭️ ไม่มี currentStationId - ข้ามรอบนี้");
    }
  }, 3000); // 300,000ms = 5 นาที

  console.log("✅ ตัวจับเวลาเพิ่มแพทย์ทำงานแล้ว");
}

/**
 * ✅ หยุดตัวจับเวลา
 */
function stopAutoAssignDoctors() {
  if (autoAssignDoctorInterval) {
    clearInterval(autoAssignDoctorInterval);
    autoAssignDoctorInterval = null;
    console.log("⏹️ หยุดตัวจับเวลาเพิ่มแพทย์");
  }
}

/**
 * ✅ เรียกใช้เมื่อโหลดหน้า
 */
document.addEventListener("DOMContentLoaded", function () {
  console.log("📱 หน้าโหลดเสร็จ - เริ่มระบบเพิ่มแพทย์อัตโนมัติ");
  startAutoAssignDoctors();
});

/**
 * ✅ Visibility API - ตรวจสอบเมื่อกลับเข้ามาดูหน้า
 */
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    console.log("👁️ กลับมาดูหน้าแล้ว - ตรวจสอบแพทย์ที่ยังไม่ได้มอบหมาย");
    autoAssignDoctorsToRooms();
  }
});

/**
 * ✅ ล้าง interval เมื่อปิดหน้า
 */
window.addEventListener("beforeunload", function () {
  stopAutoAssignDoctors();
});

/**
 * ✅ Manual Button - ให้ผู้ใช้ทริกเกอร์เพิ่มแพทย์เอง
 */
async function manualTriggerAutoAssignDoctors() {
  Swal.fire({
    title: "⏳ กำลังเพิ่มแพทย์เข้าห้อง...",
    html: '<div style="margin-top: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #0056B3;"></i></div>',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
  });

  const result = await autoAssignDoctorsToRooms();

  if (result.success) {
    Swal.fire({
      title: "✅ สำเร็จ",
      html: `
        <div style="text-align: left; padding: 15px;">
          <p><strong>📊 ผลลัพธ์การเพิ่มแพทย์:</strong></p>
          <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 10px 0;">
            <p style="margin: 5px 0; color: #1E8449;">✅ สำเร็จ: <strong>${
              result.successCount
            }</strong> คน</p>
            <p style="margin: 5px 0; color: #C0392B;">❌ ล้มเหลว: <strong>${
              result.failCount
            }</strong> คน</p>
          </div>
          ${
            result.results.length > 0
              ? `
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 12px;">
              <strong>รายละเอียด:</strong><br>
              ${result.results
                .map((r) => `• ${r.doctor_name}: ${r.status}`)
                .join("<br>")}
            </div>
            `
              : ""
          }
        </div>
      `,
      icon: "success",
      confirmButtonColor: "#1E8449",
    });

    // รีโหลดข้อมูลห้องถ้ามี
    if (currentRoomId) {
      setTimeout(() => {
        openRoomDetail(currentRoomId);
      }, 500);
    }
  } else {
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      text: result.error || "ไม่สามารถเพิ่มแพทย์ได้",
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}
/** ====================================PATIENT API ================================================================*/

// ✅ ดึงข้อมูลคนไข้จาก RealTime API + DB
async function loadStationPatients(stationId, departmentIds) {
  try {
    const deptString = Array.isArray(departmentIds) 
      ? departmentIds.join(',') 
      : departmentIds;
    
    console.log(`🔄 ดึงข้อมูลคนไข้ (วันนี้): Station ${stationId}, Departments: ${deptString}`);
    
    // ✅ เปลี่ยน endpoint เป็น get_station_today_patients.php
    const response = await fetch(
      `http://localhost/hospital/api/get_station_today_patients.php?station_id=${stationId}&department_ids=${deptString}`
    );
    
    const result = await response.json();
    
    console.log('📋 API Response:', result);
    console.log('📅 Query Date:', result.data?.query_date);
    console.log('📊 ข้อมูลตัวอย่าง:', {
      inprocess_first: result.data?.inprocess_patients?.[0],
      waiting_first: result.data?.waiting_patients?.[0]
    });
    
    if (!result.success) {
      console.warn(`⚠️ ${result.message}`);
      displayPatients([], []);
      return;
    }

    const data = result.data;
    console.log(`✅ ได้รับคนไข้ของวันนี้ ${data.total_patients} คน`);
    console.log(`📊 Inprocess: ${data.inprocess_count}, Waiting: ${data.waiting_count}`);
    
    // ✅ เรียกฟังก์ชันแสดงผล
    displayPatients(data.inprocess_patients, data.waiting_patients);

  } catch (error) {
    console.error("❌ Error loading patients:", error);
    displayPatients([], []);
  }
}
// ✅ แสดงคนไข้ที่กำลังทำหัตถการ
function displayPatients(inprocessPatients, waitingPatients) {
  const container = document.getElementById("patients");
  
  console.log('🔍 Container found:', !!container);
  
  if (!container) {
    console.error("❌ Element #patients ไม่พบ!");
    return;
  }

  // ✅ ตรวจสอบว่ามีข้อมูลไหม
  const hasInprocess = inprocessPatients && inprocessPatients.length > 0;
  const hasWaiting = waitingPatients && waitingPatients.length > 0;
  
  console.log(`📌 Inprocess: ${inprocessPatients?.length || 0}, Waiting: ${waitingPatients?.length || 0}`);
  
  if (!hasInprocess && !hasWaiting) {
    container.innerHTML = `
      <div class="no-data">
        <p>❌ ไม่มีข้อมูลคนไข้</p>
      </div>
    `;
    return;
  }

  let html = '';

  // ✅ แสดงคนไข้ที่กำลังทำหัตถการ
  if (hasInprocess) {
    html += `
      <div class="patients-section">
        <div class="section-title">⏳ กำลังทำหัตถการ (${inprocessPatients.length})</div>
        <div class="patients-list">
    `;
    
    inprocessPatients.forEach(p => {
      const roomDisplay = p.room_id && p.room_id > 0 ? p.room_id : 'รอห้อง';
      const procedureDisplay = p.procedures || p.procedure_code || 'N/A';
      const timeStartDisplay = p.time_start || p.create_date || '-';
      
      html += `
        <div class="patient-card patient-inprocess">
          <div class="patient-header">
            <span class="appointment-no">${p.appointmentno || '-'}</span>
            <span class="badge badge-inprocess">🏥 กำลังทำ</span>
          </div>
          <div class="patient-details">
            <p><strong>หัตถการ:</strong> ${procedureDisplay}</p>
            <p><strong>เวลาเริ่ม:</strong> ${timeStartDisplay}</p>
            <p><strong>ห้อง:</strong> ${roomDisplay}</p>
            <p style="font-size: 12px; color: #999;"><strong>ID:</strong> ${p.id}</p>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  }

  // ✅ แสดงคนไข้ที่รอคิว
  if (hasWaiting) {
    html += `
      <div class="patients-section">
        <div class="section-title">⏰ รอคิว (${waitingPatients.length})</div>
        <div class="patients-list">
    `;
    
    waitingPatients.forEach((p, idx) => {
      const procedureDisplay = p.procedures || p.procedure_code || 'N/A';
      const timeTargetDisplay = p.time_target || p.time_start || '-';
      
      html += `
        <div class="patient-card patient-waiting">
          <div class="patient-header">
            <span class="queue-number">${idx + 1}</span>
            <span class="appointment-no">${p.appointmentno || '-'}</span>
            <span class="badge badge-waiting">⏰ รอคิว</span>
          </div>
          <div class="patient-details">
            <p><strong>หัตถการ:</strong> ${procedureDisplay}</p>
            <p><strong>เวลาที่กำหนด:</strong> ${timeTargetDisplay}</p>
            <p style="font-size: 12px; color: #999;"><strong>ID:</strong> ${p.id}</p>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  }

  // ✅ เขียนข้อมูลลงใน HTML
  console.log(`📝 เขียน HTML: ${(inprocessPatients?.length || 0) + (waitingPatients?.length || 0)} คนไข้`);
  container.innerHTML = html;
  console.log('✅ HTML written successfully');
}

// ✅ แสดงคนไข้ที่รอคิว
function displayPatientsWaiting(patients) {
  const container = document.getElementById("stationPatientsTab");
  if (!patients || patients.length === 0) return;

  let html = `<h3>⏰ รอคิว (${patients.length})</h3><div class="patients-list">`;
  
  patients.forEach((p, idx) => {
    html += `
      <div class="patient-card waiting">
        <strong>#${idx + 1} ${p.appointmentno}</strong>
        <p>หัตถการ: ${p.procedures}</p>
      </div>
    `;
  });
  
  html += `</div>`;
  container.innerHTML = (container.innerHTML || "") + html;
}

// ✅ แสดงข้อความเมื่อไม่มีคนไข้
function displayNoPatients(message) {
  const container = document.getElementById("stationPatientsTab");
  container.innerHTML = `
    <div class="no-data">
      <p>${message}</p>
    </div>
  `;
}

// ✅ CSS (เพิ่มในไฟล์ CSS ของคุณ)
const patientStyles = `
.patients-section {
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
  background: #f9f9f9;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #2c3e50;
  background: #ecf0f1;
  padding: 12px 16px;
  margin: 0;
  border-bottom: 3px solid #3498db;
}

.patients-list {
  display: grid;
  gap: 12px;
  padding: 16px;
  max-height: 600px;
  overflow-y: auto;
}

.patient-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.patient-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  transform: translateY(-2px);
  border-color: #bdc3c7;
}

.patient-inprocess {
  border-left: 5px solid #f39c12;
  background: linear-gradient(to right, rgba(243,156,18,0.05), #fff);
}

.patient-waiting {
  border-left: 5px solid #3498db;
  background: linear-gradient(to right, rgba(52,152,219,0.05), #fff);
}

.patient-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.appointment-no {
  font-weight: 700;
  color: #2c3e50;
  font-size: 14px;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 4px;
}

.queue-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.badge-inprocess {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

.badge-waiting {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.patient-details {
  font-size: 13px;
  line-height: 1.8;
  color: #555;
}

.patient-details p {
  margin: 6px 0;
  padding: 0;
}

.patient-details strong {
  color: #2c3e50;
  font-weight: 600;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #bdc3c7;
  font-size: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

/* Scrollbar style */
.patients-list::-webkit-scrollbar {
  width: 6px;
}

.patients-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.patients-list::-webkit-scrollbar-thumb {
  background: #bdc3c7;
  border-radius: 3px;
}

.patients-list::-webkit-scrollbar-thumb:hover {
  background: #95a5a6;
}
`;