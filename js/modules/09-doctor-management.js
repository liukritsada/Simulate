/**
 * 👨‍⚕️ Doctor Management Module - COMPLETE MERGED VERSION
 * จัดการแพทย์ - เพิ่ม ลบ แก้ไข มอบหมายห้อง + Work Time Management
 * 
 * Features:
 * - Load and display doctors
 * - Add doctor to station
 * - Edit doctor schedule
 * - Assign/Unassign room
 * - Remove doctor
 * ✅ Start/Break/End work buttons (for simulation/manual control)
 * ✅ Auto-update status by time
 * ✅ AUTO-ASSIGN doctor to room (NEW!)
 * ✅ SET currentStationId for auto-assign (FIXED!)
 */

// ========================================
// ✅ GLOBAL VARIABLES
// ========================================

let autoDoctorStatusInterval = null;

// ========================================
// ✅ LOAD DOCTORS FOR STATION
// ========================================

/**
 * Load and display doctors for station
 * 
 * @param {number} stationId - Station ID
 */
async function loadDoctorsForStation(stationId) {
  try {
    // ✅ FIXED: SET STATION ID FOR AUTO-ASSIGN!
    setCurrentStationId(stationId);
    
    const apiUrl = `${API_BASE_URL}/get_station_doctors.php?station_id=${stationId}`.replace(/\/+/g, '/').replace(':/', '://');
    console.log("Fetching from:", apiUrl);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    if (result.success) {
      displayStationDoctors(result.data.doctors || []);
    } else {
      console.error("Failed to load doctors:", result.message);
      displayStationDoctors([]);
    }
  } catch (error) {
    console.error("Error loading doctors:", error);
    displayStationDoctors([]);
  }
}

// ========================================
// ✅ DISPLAY STATION DOCTORS
// ========================================

/**
 * Display Station Doctors - MODERN UI
 * 
 * @param {array} doctors - Array of doctor objects
 */
function displayStationDoctors(doctors) {
  const container = document.getElementById("stationDoctorsContent");

  if (!container) {
    console.warn("⚠️ stationDoctorsContent element not found");
    return;
  }

  if (!doctors || doctors.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #adb5bd;">
        <i class="fas fa-user-md" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">ไม่มีแพทย์ในสถานีนี้</div>
        <div style="font-size: 13px; color: #999; margin-bottom: 20px;">ยังไม่มีการเพิ่มแพทย์เข้ามา</div>
        <button onclick="addDoctorToStation(${currentStationId})" 
                style="background: #0066cc; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px;">
          <i class="fas fa-plus"></i> เพิ่มแพทย์
        </button>
      </div>
    `;
    return;
  }

  let html = `
    <div style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #000;">
          👨‍⚕️ แพทย์ 
          <span style="background: #0066cc; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; margin-left: 10px;">
            ${doctors.length}
          </span>
        </h3>
        <button onclick="addDoctorToStation(${currentStationId})"
                style="background: #0066cc; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 12px; transition: all 0.2s;"
                onmouseover="this.style.background='#0052a3'"
                onmouseout="this.style.background='#0066cc'">
          <i class="fas fa-plus"></i> เพิ่มแพทย์
        </button>
      </div>
    </div>

    <div style="display: grid; gap: 12px;">
  `;

  const now = new Date();
  const currentTime = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");

  doctors.forEach((doctor) => {
    // ✅ ตรวจสอบสถานะตามลอจิก
    const hasWorkStartTime = doctor.work_start_time && doctor.work_start_time !== null;
    const hasWorkEndTime = doctor.work_end_time && doctor.work_end_time !== null;
    const hasAssignedRoom = doctor.assigned_room_id && doctor.assigned_room_id !== null;

    const roomInfo = hasAssignedRoom
      ? `<div style="font-size: 11px; color: #0066cc; margin-top: 4px; font-weight: 600;">🚪 ${doctor.room_name || "Room " + doctor.assigned_room_id}</div>`
      : `<div style="font-size: 11px; color: #d32f2f; margin-top: 4px; font-weight: 600;">❌ N/A</div>`;

    let statusSection = '';
    let borderColor = '#e0e6ed';
    let borderLeftColor = '#6c757d';

    // ✅ ตรวจสอบสถานะตามลอจิกของคุณ
    if (!hasWorkStartTime) {
      // ❌ work_start_time = null → ยังไม่ออกตรวจ
      statusSection = `
        <div colspan="2" style="text-align: center;">
          <span style="
            background: #f8f9fa;
            color: #666;
            padding: 6px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            border: 1px solid #dee2e6;
          ">
            <i class="fas fa-clock"></i>ยังไม่ออกตรวจ
          </span>
        </div>
      `;
      borderColor = '#f5f5f5';
      borderLeftColor = '#6c757d';
    } else if (hasWorkStartTime && !hasWorkEndTime) {
      // ✅ work_start_time มีค่า + work_end_time = null → กำลังตรวจ
      const workStart = doctor.work_start_time.substring(0, 5);
      
      statusSection = `
        <div style="text-align: center;">
          <div style="font-size: 10px; color: #666; margin-bottom: 4px; font-weight: 500;">เวลาเริ่มต้น</div>
          <div style="background: #f0f4ff; color: #0066cc; padding: 6px 10px; border-radius: 8px; font-weight: 700; font-size: 12px;">
            ${workStart}
          </div>
        </div>

        <div>
          <span style="background: #0066cc; color: white; padding: 6px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap; display: inline-flex; align-items: center; gap: 5px;">
            <i class="fas fa-briefcase"></i>กำลังตรวจ
          </span>
        </div>
      `;
      borderColor = '#c6e0ff';
      borderLeftColor = '#0066cc';
    } else if (hasWorkStartTime && hasWorkEndTime) {
      // ✅ work_start_time มีค่า + work_end_time มีค่า → ต้องตรวจสอบเวลาปัจจุบัน
      const workStart = doctor.work_start_time.substring(0, 5);
      const workEnd = doctor.work_end_time.substring(0, 5);

      // 🔧 แปลงเวลาเป็นตัวเลขสำหรับเปรียบเทียบที่ถูกต้อง
      const currentTimeNum = parseInt(currentTime.replace(":", ""));
      const workStartNum = parseInt(workStart.replace(":", ""));
      const workEndNum = parseInt(workEnd.replace(":", ""));

      let statusColor, statusIcon, statusText;

      if (currentTimeNum >= workEndNum) {
        // เกินเวลาเลิกงาน → เลิกงาน
        statusColor = "#6c757d";
        statusIcon = "fa-power-off";
        statusText = "เลิกงาน";
      } else if (currentTimeNum >= workStartNum && currentTimeNum < workEndNum) {
        // อยู่ในเวลาทำงาน → กำลังตรวจ
        statusColor = "#0066cc";
        statusIcon = "fa-briefcase";
        statusText = "กำลังตรวจ";
      } else {
        // ยังไม่ถึงเวลา → ว่าง
        statusColor = "#1E8449";
        statusIcon = "fa-check-circle";
        statusText = "ว่าง";
      }

      statusSection = `
        <div style="text-align: center;">
          <div style="font-size: 10px; color: #666; margin-bottom: 4px; font-weight: 500;">เวลาทำงาน</div>
          <div style="background: #f0f4ff; color: #0066cc; padding: 6px 10px; border-radius: 8px; font-weight: 700; font-size: 12px;">
            ${workStart} <span style="color: #999;">-</span> ${workEnd}
          </div>
        </div>

        <div>
          <span style="background: ${statusColor}; color: white; padding: 6px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap; display: inline-flex; align-items: center; gap: 5px;">
            <i class="fas ${statusIcon}"></i>${statusText}
          </span>
        </div>
      `;
      
      if (currentTimeNum >= workEndNum) {
        borderColor = '#e0e0e0';
        borderLeftColor = '#6c757d';
      } else {
        borderColor = '#c6e0ff';
        borderLeftColor = '#0066cc';
      }
    }

    html += `
      <div style="
        background: white;
        border: 2px solid ${borderColor};
        border-left: 4px solid ${borderLeftColor};
        border-radius: 10px;
        padding: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        display: grid;
        grid-template-columns: 1fr auto auto auto;
        gap: 16px;
        align-items: center;
        transition: all 0.2s;
      "
      onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'"
      onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'">
        
        <div>
          <div style="font-weight: 700; font-size: 13px; color: #000; margin-bottom: 4px;">
            👨‍⚕️ ${doctor.doctor_name}
          </div>
          <div style="font-size: 11px; color: #666; margin-bottom: 6px;">
            🆔 ${doctor.doctor_id || "N/A"}
          </div>
          ${roomInfo}
        </div>

        ${statusSection}
        
        <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
          ${
            !hasAssignedRoom
              ? `<button onclick="openAssignDoctorRoomModal(${doctor.station_doctor_id})"
                  style="background: #0066cc; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px; transition: all 0.2s;"
                  onmouseover="this.style.background='#0052a3'; this.style.transform='translateY(-2px)'"
                  onmouseout="this.style.background='#0066cc'; this.style.transform='translateY(0)'"
                  title="มอบหมายห้อง">
                  <i class="fas fa-door-open"></i>
                </button>`
              : `<button onclick="unassignDoctorRoom(${doctor.station_doctor_id})"
                  style="background: #6C757D; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px; transition: all 0.2s;"
                  onmouseover="this.style.background='#555'; this.style.transform='translateY(-2px)'"
                  onmouseout="this.style.background='#6C757D'; this.style.transform='translateY(0)'"
                  title="ยกเลิกการมอบหมายห้อง">
                  <i class="fas fa-times"></i>
                </button>`
          }

          <button onclick="editDoctor(${doctor.station_doctor_id})"
                  style="background: #F39C12; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px; transition: all 0.2s;"
                  onmouseover="this.style.background='#E67E22'; this.style.transform='translateY(-2px)'"
                  onmouseout="this.style.background='#F39C12'; this.style.transform='translateY(0)'"
                  title="แก้ไขเวลาทำงาน">
            <i class="fas fa-pencil-alt"></i>
          </button>

          <button onclick="removeDoctor(${doctor.station_doctor_id}, '${doctor.doctor_name}')"
                  style="background: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px; transition: all 0.2s;"
                  onmouseover="this.style.background='#c82333'; this.style.transform='translateY(-2px)'"
                  onmouseout="this.style.background='#dc3545'; this.style.transform='translateY(0)'"
                  title="ลบแพทย์">
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

// ========================================
// ✅ ADD DOCTOR TO STATION
// ========================================

/**
 * ✅ Add Doctor to Station
 */
async function addDoctorToStation(stationId) {
  try {
    console.log(`➕ เพิ่มแพทย์ใหม่ - station_id: ${stationId}`);

    if (!API_BASE_URL) {
      throw new Error("API_BASE_URL ไม่ได้ประกาศ");
    }

    console.log("📥 ดึงข้อมูล station...");

    const stationResponse = await fetch(
      `${API_BASE_URL}/get_station_detail.php?station_id=${stationId}`
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

    const today = new Date().toISOString().split("T")[0];

    const { value: formData } = await Swal.fire({
      title: "➕ เพิ่มแพทย์ใหม่",
      html: `
        <div style="text-align: left; padding: 20px 0;">
          <div style="margin-bottom: 20px;">
            <label style="font-weight: 500; display: block; margin-bottom: 8px; color: #333; font-size: 13px;">
              🆔 รหัสแพทย์ <span style="color: #d32f2f;">*</span>
            </label>
            <input 
              type="text" 
              id="newDoctorId" 
              placeholder="เช่น DOC001"
              style="
                width: 100%;
                padding: 11px 14px;
                border: 1px solid #d0d7e0;
                border-radius: 8px;
                font-size: 13px;
                box-sizing: border-box;
                background: white;
                color: #333;
                transition: all 0.2s;
              "
              onfocus="this.style.borderColor='#0066cc'; this.style.boxShadow='0 0 0 3px rgba(0, 102, 204, 0.08)'"
              onblur="this.style.borderColor='#d0d7e0'; this.style.boxShadow='none'">
          </div>

          <div style="margin-bottom: 20px;">
            <label style="font-weight: 500; display: block; margin-bottom: 8px; color: #333; font-size: 13px;">
              👨‍⚕️ ชื่อแพทย์ <span style="color: #d32f2f;">*</span>
            </label>
            <input 
              type="text" 
              id="newDoctorName" 
              placeholder="เช่น ดร.สมชาย มาศวร"
              style="
                width: 100%;
                padding: 11px 14px;
                border: 1px solid #d0d7e0;
                border-radius: 8px;
                font-size: 13px;
                box-sizing: border-box;
                background: white;
                color: #333;
                transition: all 0.2s;
              "
              onfocus="this.style.borderColor='#0066cc'; this.style.boxShadow='0 0 0 3px rgba(0, 102, 204, 0.08)'"
              onblur="this.style.borderColor='#d0d7e0'; this.style.boxShadow='none'">
          </div>

          <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e0e6ed;">
            <div style="font-weight: 500; color: #333; margin-bottom: 12px; font-size: 13px;">
              🕐 เวลาทำงาน
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="font-size: 12px; color: #666; display: block; margin-bottom: 6px;">เข้างาน</label>
                <input 
                  type="time" 
                  id="newWorkStart" 
                  value="08:00"
                  style="
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #d0d7e0;
                    border-radius: 8px;
                    font-size: 13px;
                    box-sizing: border-box;
                    background: white;
                    transition: all 0.2s;
                  "
                  onfocus="this.style.borderColor='#0066cc'; this.style.boxShadow='0 0 0 3px rgba(0, 102, 204, 0.08)'"
                  onblur="this.style.borderColor='#d0d7e0'; this.style.boxShadow='none'">
              </div>
              <div>
                <label style="font-size: 12px; color: #666; display: block; margin-bottom: 6px;">ออกงาน</label>
                <input 
                  type="time" 
                  id="newWorkEnd" 
                  value="17:00"
                  style="
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #d0d7e0;
                    border-radius: 8px;
                    font-size: 13px;
                    box-sizing: border-box;
                    background: white;
                    transition: all 0.2s;
                  "
                  onfocus="this.style.borderColor='#0066cc'; this.style.boxShadow='0 0 0 3px rgba(0, 102, 204, 0.08)'"
                  onblur="this.style.borderColor='#d0d7e0'; this.style.boxShadow='none'">
              </div>
            </div>
          </div>

          <div>
            <div style="font-weight: 500; color: #333; margin-bottom: 12px; font-size: 13px;">
              ☕ เวลาพักเบรก
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="font-size: 12px; color: #666; display: block; margin-bottom: 6px;">พักเริ่ม</label>
                <input 
                  type="time" 
                  id="newBreakStart" 
                  value="12:00"
                  style="
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #d0d7e0;
                    border-radius: 8px;
                    font-size: 13px;
                    box-sizing: border-box;
                    background: white;
                    transition: all 0.2s;
                  "
                  onfocus="this.style.borderColor='#0066cc'; this.style.boxShadow='0 0 0 3px rgba(0, 102, 204, 0.08)'"
                  onblur="this.style.borderColor='#d0d7e0'; this.style.boxShadow='none'">
              </div>
              <div>
                <label style="font-size: 12px; color: #666; display: block; margin-bottom: 6px;">พักจบ</label>
                <input 
                  type="time" 
                  id="newBreakEnd" 
                  value="13:00"
                  style="
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #d0d7e0;
                    border-radius: 8px;
                    font-size: 13px;
                    box-sizing: border-box;
                    background: white;
                    transition: all 0.2s;
                  "
                  onfocus="this.style.borderColor='#0066cc'; this.style.boxShadow='0 0 0 3px rgba(0, 102, 204, 0.08)'"
                  onblur="this.style.borderColor='#d0d7e0'; this.style.boxShadow='none'">
              </div>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "✅ บันทึก",
      cancelButtonText: "❌ ยกเลิก",
      confirmButtonColor: "#0066cc",
      cancelButtonColor: "#6c757d",
      width: "500px",
      preConfirm: () => {
        const doctorId = document.getElementById("newDoctorId").value.trim();
        const doctorName = document
          .getElementById("newDoctorName")
          .value.trim();
        const workStart = document.getElementById("newWorkStart").value;
        const workEnd = document.getElementById("newWorkEnd").value;
        const breakStart = document.getElementById("newBreakStart").value;
        const breakEnd = document.getElementById("newBreakEnd").value;

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

        if (workStart >= workEnd) {
          Swal.showValidationMessage("⚠️ เวลาออกงานต้องหลังเวลาเข้างาน");
          return false;
        }

        if (breakStart >= breakEnd) {
          Swal.showValidationMessage("⚠️ เวลาพักจบต้องหลังเวลาพักเริ่ม");
          return false;
        }

        if (breakStart < workStart || breakEnd > workEnd) {
          Swal.showValidationMessage("⚠️ เวลาพักต้องอยู่ในเวลาทำงาน");
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

    console.log("📤 ส่งข้อมูลแพทย์ไปยัง API");

    Swal.fire({
      title: "กำลังบันทึก...",
      html: '<div style="margin-top: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #0066cc;"></i></div>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    // ✅ FIXED: ใช้ endpoint ที่ถูกต้อง + เพิ่ม doctor_code
    const apiUrl = typeof getApiUrl === 'function'
      ? getApiUrl('add_doctor_to_station.php')
      : `${API_BASE_URL}/add_doctor_to_station.php`;

    const addResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        station_id: stationId,
        doctor_id: formData.doctor_id,
        doctor_code: formData.doctor_id, // ✅ ADD: doctor_code (required by API)
        doctor_name: formData.doctor_name,
        work_date: today,
        work_start_time: formData.work_start_time + ":00",
        work_end_time: formData.work_end_time + ":00",
        break_start_time: formData.break_start_time + ":00",
        break_end_time: formData.break_end_time + ":00",
      }),
    });

    if (!addResponse.ok) {
      const errorText = await addResponse.text();
      throw new Error(
        `HTTP ${addResponse.status}: ${errorText.substring(0, 100)}`
      );
    }

    const result = await addResponse.json();
    console.log("✅ ผลลัพธ์:", result);

    if (result.success) {
      Swal.fire({
        title: "✅ บันทึกเรียบร้อย",
        html: `
          <div style="text-align: left; padding: 15px;">
            <p style="margin-bottom: 10px;">
              <strong>👨‍⚕️ ${formData.doctor_name}</strong>
            </p>
            <p style="color: #666; font-size: 13px;">
              ✓ เพิ่มแพทย์เข้าสถานีสำเร็จ<br>
              ✓ เวลาทำงาน: ${formData.work_start_time} - ${formData.work_end_time}<br>
              ✓ พักเบรก: ${formData.break_start_time} - ${formData.break_end_time}<br>
              ✓ กำลังมอบหมายห้อง...
            </p>
          </div>
        `,
        icon: "success",
        confirmButtonColor: "#0066cc",
      });

      loadDoctorsForStation(stationId);

      // ✅ 🏪 TRIGGER AUTO-ASSIGN DOCTOR TO ROOM (NEW!)
      console.log("🏪 Triggering auto-assign doctor to room...");
      
      const autoAssignUrl = typeof getApiUrl === 'function'
        ? getApiUrl('auto_assign_doctor.php')
        : `${API_BASE_URL}/auto_assign_doctor.php`;

      try {
        const autoAssignResponse = await fetch(autoAssignUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            station_id: stationId,
            current_date: new Date().toISOString().split('T')[0],
            current_time: new Date().toTimeString().split(' ')[0]
          }),
        });

        if (autoAssignResponse.ok) {
          const autoAssignResult = await autoAssignResponse.json();
          
          if (autoAssignResult.success) {
            console.log("✅ Auto-assign completed:", autoAssignResult.data);
            
            // ✅ Reload UI หลังจาก 500ms
            setTimeout(() => {
              console.log("🔄 Reloading doctors and rooms...");
              loadDoctorsForStation(stationId);
              if (typeof loadStationRooms === 'function') {
                loadStationRooms(stationId);
              }
            }, 500);
          }
        }
      } catch (autoAssignError) {
        console.warn("⚠️ Auto-assign warning (non-critical):", autoAssignError.message);
      }

    } else {
      throw new Error(result.message || "ไม่สามารถเพิ่มแพทย์ได้");
    }
  } catch (error) {
    console.error("❌ Error:", error);

    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      html: `
        <div style="text-align: left; padding: 15px;">
          <p style="color: #d32f2f; font-weight: 500;">
            ${error.message}
          </p>
        </div>
      `,
      icon: "error",
      confirmButtonColor: "#0066cc",
    });
  }
}

// ========================================
// ✅ EDIT DOCTOR SCHEDULE
// ========================================

/**
 * ✅ Edit Doctor Schedule
 */
async function editDoctor(doctorId) {
  try {
    console.log(`📝 แก้ไขแพทย์ - doctor_id: ${doctorId}`);

    const url = `${API_BASE_URL}/get_doctor_details.php?station_doctor_id=${doctorId}&station_id=${currentStationId}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const responseText = await response.text();
    const result = safeJsonParse(responseText);

    if (!result || !result.success) {
      throw new Error(result?.message || "ไม่สามารถดึงข้อมูลแพทย์");
    }

    const doctor = result.data;
    console.log("✅ ดึงข้อมูลแพทย์:", doctor);

    const formatTimeForInput = (time) => {
      if (!time) return "08:00";
      return time.substring(0, 5);
    };

    const { value: formData } = await Swal.fire({
      title: "✏️ แก้ไขเวลาทำงาน",
      html: `
        <div style="text-align: left; padding: 20px 0;">
          <div style="
            background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
            color: white;
            padding: 16px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
          ">
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 4px;">แพทย์</div>
            <div style="font-size: 18px; font-weight: 700;">👨‍⚕️ ${doctor.doctor_name}</div>
          </div>

          <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e0e6ed;">
            <div style="font-weight: 600; color: #000; margin-bottom: 12px; font-size: 13px;">
              🕐 เวลาทำงาน
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; color: #666; display: block; margin-bottom: 6px; font-weight: 500;">เข้างาน</label>
                <input 
                  type="time" 
                  id="editWorkStart" 
                  value="${formatTimeForInput(doctor.work_start_time)}"
                  style="
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #d0d7e0;
                    border-radius: 8px;
                    font-size: 13px;
                    box-sizing: border-box;
                    background: white;
                    transition: all 0.2s;
                  "
                  onfocus="this.style.borderColor='#0066cc'; this.style.boxShadow='0 0 0 3px rgba(0, 102, 204, 0.08)'"
                  onblur="this.style.borderColor='#d0d7e0'; this.style.boxShadow='none'">
              </div>
              <div>
                <label style="font-size: 12px; color: #666; display: block; margin-bottom: 6px; font-weight: 500;">ออกงาน</label>
                <input 
                  type="time" 
                  id="editWorkEnd" 
                  value="${formatTimeForInput(doctor.work_end_time)}"
                  style="
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #d0d7e0;
                    border-radius: 8px;
                    font-size: 13px;
                    box-sizing: border-box;
                    background: white;
                    transition: all 0.2s;
                  "
                  onfocus="this.style.borderColor='#0066cc'; this.style.boxShadow='0 0 0 3px rgba(0, 102, 204, 0.08)'"
                  onblur="this.style.borderColor='#d0d7e0'; this.style.boxShadow='none'">
              </div>
            </div>
          </div>

          <div>
            <div style="font-weight: 600; color: #000; margin-bottom: 12px; font-size: 13px;">
              ☕ เวลาพักเบรก
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; color: #666; display: block; margin-bottom: 6px; font-weight: 500;">พักเริ่ม</label>
                <input 
                  type="time" 
                  id="editBreakStart" 
                  value="${formatTimeForInput(doctor.break_start_time)}"
                  style="
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #d0d7e0;
                    border-radius: 8px;
                    font-size: 13px;
                    box-sizing: border-box;
                    background: white;
                    transition: all 0.2s;
                  "
                  onfocus="this.style.borderColor='#0066cc'; this.style.boxShadow='0 0 0 3px rgba(0, 102, 204, 0.08)'"
                  onblur="this.style.borderColor='#d0d7e0'; this.style.boxShadow='none'">
              </div>
              <div>
                <label style="font-size: 12px; color: #666; display: block; margin-bottom: 6px; font-weight: 500;">พักจบ</label>
                <input 
                  type="time" 
                  id="editBreakEnd" 
                  value="${formatTimeForInput(doctor.break_end_time)}"
                  style="
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #d0d7e0;
                    border-radius: 8px;
                    font-size: 13px;
                    box-sizing: border-box;
                    background: white;
                    transition: all 0.2s;
                  "
                  onfocus="this.style.borderColor='#0066cc'; this.style.boxShadow='0 0 0 3px rgba(0, 102, 204, 0.08)'"
                  onblur="this.style.borderColor='#d0d7e0'; this.style.boxShadow='none'">
              </div>
            </div>
          </div>

          <div style="
            background: #f0f4ff;
            border: 1px solid #c6e0ff;
            border-radius: 8px;
            padding: 12px;
            margin-top: 20px;
            font-size: 12px;
            color: #0052a3;
          ">
            <div style="font-weight: 600; margin-bottom: 8px;">📋 สรุปเวลาทำงาน</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>⏰ ทำงาน: <strong id="summaryWork">08:00 - 17:00</strong></div>
              <div>☕ พักเบรก: <strong id="summaryBreak">12:00 - 13:00</strong></div>
            </div>
          </div>
        </div>

        <script>
          const inputs = ['editWorkStart', 'editWorkEnd', 'editBreakStart', 'editBreakEnd'];
          inputs.forEach(id => {
            document.getElementById(id).addEventListener('change', function() {
              const start = document.getElementById('editWorkStart').value;
              const end = document.getElementById('editWorkEnd').value;
              const breakStart = document.getElementById('editBreakStart').value;
              const breakEnd = document.getElementById('editBreakEnd').value;
              
              document.getElementById('summaryWork').textContent = start + ' - ' + end;
              document.getElementById('summaryBreak').textContent = breakStart + ' - ' + breakEnd;
            });
          });
        </script>
      `,
      showCancelButton: true,
      confirmButtonText: "💾 บันทึก",
      cancelButtonText: "❌ ยกเลิก",
      confirmButtonColor: "#0066cc",
      cancelButtonColor: "#6c757d",
      width: "500px",
      preConfirm: () => {
        const workStart = document.getElementById("editWorkStart").value;
        const workEnd = document.getElementById("editWorkEnd").value;
        const breakStart = document.getElementById("editBreakStart").value;
        const breakEnd = document.getElementById("editBreakEnd").value;

        if (!workStart || !workEnd || !breakStart || !breakEnd) {
          Swal.showValidationMessage("⚠️ กรุณากรอกเวลาทั้งหมด");
          return false;
        }

        if (workStart >= workEnd) {
          Swal.showValidationMessage("⚠️ เวลาออกงานต้องหลังเวลาเข้างาน");
          return false;
        }

        if (breakStart >= breakEnd) {
          Swal.showValidationMessage("⚠️ เวลาพักจบต้องหลังเวลาพักเริ่ม");
          return false;
        }

        if (breakStart < workStart || breakEnd > workEnd) {
          Swal.showValidationMessage("⚠️ เวลาพักต้องอยู่ในเวลาทำงาน");
          return false;
        }

        return { workStart, workEnd, breakStart, breakEnd };
      },
    });

    if (formData) {
      console.log("📤 บันทึกข้อมูล:", formData);

      Swal.fire({
        title: "กำลังบันทึก...",
        html: '<i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #0066cc;"></i>',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
      });

      const updateUrl = `${API_BASE_URL}/update_doctor_schedule.php`;

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

      const updateText = await updateResponse.text();
      const updateResult = safeJsonParse(updateText);

      if (updateResult && updateResult.success) {
        await Swal.fire({
          title: "✅ บันทึกเรียบร้อย",
          html: `
            <div style="text-align: left; padding: 15px;">
              <p style="margin-bottom: 10px;">
                <strong>👨‍⚕️ ${doctor.doctor_name}</strong>
              </p>
              <p style="color: #666; font-size: 13px;">
                ✓ อัปเดตเวลาทำงานแล้ว<br>
                ✓ เวลาทำงาน: ${formData.workStart} - ${formData.workEnd}<br>
                ✓ พักเบรก: ${formData.breakStart} - ${formData.breakEnd}
              </p>
            </div>
          `,
          icon: "success",
          confirmButtonColor: "#0066cc",
        });

        loadDoctorsForStation(currentStationId);
      } else {
        throw new Error(updateResult?.message || "ไม่สามารถบันทึกได้");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      html: `
        <div style="text-align: left; padding: 15px;">
          <p style="color: #d32f2f; font-weight: 500;">
            ${error.message}
          </p>
        </div>
      `,
      icon: "error",
      confirmButtonColor: "#0066cc",
    });
  }
}

// ========================================
// ✅ ASSIGN DOCTOR TO ROOM
// ========================================

async function openAssignDoctorRoomModal(stationDoctorId) {
  try {
    console.log(
      `📋 เปิด Modal มอบหมายห้องให้แพทย์ - station_doctor_id: ${stationDoctorId}`
    );

    if (!currentStationId) {
      Swal.fire("ข้อผิดพลาด", "ไม่พบข้อมูล station", "error");
      return;
    }

    const doctorUrl = `${API_BASE_URL}/get_doctor_details.php?station_doctor_id=${stationDoctorId}&station_id=${currentStationId}`;

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

    const roomsResponse = await fetch(
      `${API_BASE_URL}/get_station_rooms.php?station_id=${currentStationId}`
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

    const response = await fetch(`${API_BASE_URL}/assign_doctor_to_room.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_doctor_id: stationDoctorId,
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

      loadDoctorsForStation(currentStationId);
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

// ========================================
// ✅ UNASSIGN DOCTOR ROOM
// ========================================

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

    const response = await fetch(`${API_BASE_URL}/unassign_doctor_room.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_doctor_id: stationDoctorId,
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

// ========================================
// ✅ REMOVE DOCTOR
// ========================================

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

      const response = await fetch(`${API_BASE_URL}/manage_station_doctors.php`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_doctor_id: stationDoctorId,
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

// ========================================
// ✅ DOCTOR WORK TIME MANAGEMENT
// ========================================

// ========================================
// ✅ AUTO UPDATE DOCTOR STATUS BY TIME
// ========================================

function startAutoDoctorStatusUpdate(stationId = null) {
  console.log('🚀 Starting auto doctor status update');

  if (autoDoctorStatusInterval) {
    clearInterval(autoDoctorStatusInterval);
  }

  updateDoctorStatusByTime(stationId);

  autoDoctorStatusInterval = setInterval(() => {
    updateDoctorStatusByTime(stationId);
  }, 30000);

  console.log('✅ Auto doctor status update started (every 30 seconds)');
}

function stopAutoDoctorStatusUpdate() {
  if (autoDoctorStatusInterval) {
    clearInterval(autoDoctorStatusInterval);
    autoDoctorStatusInterval = null;
    console.log('⏹️ Auto doctor status update stopped');
  }
}

async function updateDoctorStatusByTime(stationId = null) {
  try {
    const now = new Date();
    const currentTime = 
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');
    const currentDate = now.toISOString().split('T')[0];

    const response = await fetch(`${API_BASE_URL}/update_doctor_status_by_time.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        station_id: stationId || 0,
        current_date: currentDate,
        current_time: currentTime
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ Doctor status updated: ${result.data.updated_count} doctors at ${currentTime}`);
      return true;
    } else {
      console.warn('⚠️ Doctor status update failed:', result.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Doctor status update error:', error);
    return false;
  }
}

// ========================================
// ✅ INIT ON PAGE LOAD
// ========================================

window.addEventListener('load', () => {
  console.log('📱 Doctor management initialized');
  
  if (currentStationId) {
    startAutoDoctorStatusUpdate(currentStationId);
  }
});

window.addEventListener('beforeunload', () => {
  stopAutoDoctorStatusUpdate();
});