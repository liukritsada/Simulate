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
    currentStationId = stationId;
    
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
    
    // ✅ SET UP AUTO-REFRESH EVERY 1 MINUTE
    if (autoDoctorStatusInterval) {
      clearInterval(autoDoctorStatusInterval);
    }
    autoDoctorStatusInterval = setInterval(() => {
      console.log("🔄 Auto-refreshing doctor status...");
      loadDoctorsForStation(currentStationId);
    }, 60000); // Refresh every 60 seconds
    
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
    // ✅ Logic ตรวจสอบสถานะของแพทย์ (Auto by Time)
    // ============================================
    let status, statusColor, statusIcon, statusText, statusBgColor, borderColor;

    // ✅ ตรวจสอบว่าได้กำหนด work_start_time หรือยัง
    if (!doctor.work_start_time || doctor.work_start_time === "00:00:00") {
      // ⏰ ยังไม่เริ่มเวลาทำงาน (ไม่มี start time)
      status = "not_started";
      statusColor = "#9ca3af";
      statusIcon = "fa-clock";
      statusText = "ยังไม่เริ่ม";
      statusBgColor = "#f3f4f6";
      borderColor = "#d1d5db";
    } else if (currentTime >= workEnd) {
      // ⏰ เลิกตรวจแล้ว (เกินเวลา end time)
      status = "off_duty";
      statusColor = "#6c757d";
      statusIcon = "fa-power-off";
      statusText = "เลิกตรวจแล้ว";
      statusBgColor = "#f8f9fa";
      borderColor = "#d0d7e0";
    } else if (currentTime >= workStart && currentTime < workEnd) {
      // ⏰ กำลังตรวจ (อยู่ในเวลา start-end)
      if (hasAssignedRoom) {
        status = "working";
        statusColor = "#0066cc";
        statusIcon = "fa-briefcase";
        statusText = "กำลังตรวจ";
        statusBgColor = "#f0f4ff";
        borderColor = "#c6e0ff";
      } else {
        status = "available";
        statusColor = "#1E8449";
        statusIcon = "fa-check-circle";
        statusText = "ว่าง";
        statusBgColor = "#f0f8f4";
        borderColor = "#90EE90";
      }
    } else {
      // ⏰ ยังไม่ถึงเวลาทำงาน (ก่อน start time)
      status = "not_started";
      statusColor = "#9ca3af";
      statusIcon = "fa-clock";
      statusText = "ยังไม่เริ่ม";
      statusBgColor = "#f3f4f6";
      borderColor = "#d1d5db";
    }

    // ✅ ข้อมูลห้อง
    const roomInfo = hasAssignedRoom
      ? `<div style="font-size: 11px; color: #0066cc; margin-top: 4px; font-weight: 600;">🚪 ${doctor.room_name || "Room " + doctor.assigned_room_id}</div>`
      : `<div style="font-size: 11px; color: #d32f2f; margin-top: 4px; font-weight: 600;">❌ N/A</div>`;

    // ✅ ลบปุ่ม Start/Break/End เนื่องจากเป็นอัตโนมัติตามเวลา

    // ✅ HTML Card - Modern Design
    html += `
      <div style="
        background: white;
        border: 2px solid ${borderColor};
        border-left: 4px solid ${statusColor};
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
        
        <!-- ข้อมูลแพทย์ -->
        <div>
          <div style="font-weight: 700; font-size: 13px; color: #000; margin-bottom: 4px;">
            👨‍⚕️ ${doctor.doctor_name}
          </div>
          <div style="font-size: 11px; color: #666; margin-bottom: 6px;">
            🆔 ${doctor.doctor_id || "N/A"}
          </div>
          ${roomInfo}
        </div>

        <!-- เวลาทำงาน -->
        <div style="text-align: center;">
          <div style="font-size: 10px; color: #666; margin-bottom: 4px; font-weight: 500;">เวลาทำงาน</div>
          <div style="background: #f0f4ff; color: #0066cc; padding: 6px 10px; border-radius: 8px; font-weight: 700; font-size: 12px;">
            ${workStart} <span style="color: #999;">-</span> ${workEnd}
          </div>
        </div>

        <!-- สถานะ Badge -->
        <div>
          <span style="
            background: ${statusColor};
            color: white;
            padding: 6px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 5px;
          ">
            <i class="fas ${statusIcon}"></i>${statusText}
          </span>
        </div>
        
        <!-- ปุ่มจัดการ -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
          
          <!-- มอบหมายห้อง -->
          ${
            !hasAssignedRoom
              ? `
          <button 
            onclick="openAssignDoctorRoomModal(${doctor.station_doctor_id})"
            style="
              background: #0066cc;
              color: white;
              border: none;
              padding: 6px 10px;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
              font-size: 12px;
              transition: all 0.2s;
            "
            onmouseover="this.style.background='#0052a3'; this.style.transform='translateY(-2px)'"
            onmouseout="this.style.background='#0066cc'; this.style.transform='translateY(0)'"
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
              font-size: 12px;
              transition: all 0.2s;
            "
            onmouseover="this.style.background='#555'; this.style.transform='translateY(-2px)'"
            onmouseout="this.style.background='#6C757D'; this.style.transform='translateY(0)'"
            title="ยกเลิกการมอบหมายห้อง"
          >
            <i class="fas fa-times"></i>
          </button>
          `
          }

          <!-- แก้ไขเวลา -->
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
              font-size: 12px;
              transition: all 0.2s;
            "
            onmouseover="this.style.background='#E67E22'; this.style.transform='translateY(-2px)'"
            onmouseout="this.style.background='#F39C12'; this.style.transform='translateY(0)'"
            title="แก้ไขเวลาทำงาน"
          >
            <i class="fas fa-pencil-alt"></i>
          </button>

          <!-- ลบ -->
          <button 
            onclick="removeDoctor(${doctor.station_doctor_id}, '${doctor.doctor_name}')"
            style="
              background: #dc3545;
              color: white;
              border: none;
              padding: 6px 10px;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
              font-size: 12px;
              transition: all 0.2s;
            "
            onmouseover="this.style.background='#c82333'; this.style.transform='translateY(-2px)'"
            onmouseout="this.style.background='#dc3545'; this.style.transform='translateY(0)'"
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

// ========================================
// ✅ ADD DOCTOR TO STATION
// ========================================

/**
 * ✅ Add Doctor to Station
 *//**
 * ✅ 09-doctor-management-PATCH.js
 * 
 * ใช้ script นี้ patch ฟังก์ชัน addDoctorToStation ใน 09-doctor-management.js
 * 
 * วิธีการ:
 * 1. แทนที่ส่วน addDoctorToStation (บรรทัด ~500-720)
 * 2. หรือ เพิ่มไฟล์นี้หลังจากโหลด 09-doctor-management.js
 */

// ========================================
// ✅ ADD DOCTOR TO STATION (PATCHED VERSION)
// ========================================

async function addDoctorToStation(stationId) {
  try {
    // ✅ ดึง list doctors
    const doctorsResponse = await fetch(`${API_BASE_URL}/get_all_doctors.php`);
    if (!doctorsResponse.ok) throw new Error("ไม่สามารถดึงรายชื่อแพทย์");
    const doctorsResult = await doctorsResponse.json();
    const doctors = doctorsResult.data?.doctors || [];

    if (doctors.length === 0) {
      throw new Error("ไม่มีแพทย์ในระบบ");
    }

    const today = new Date().toISOString().split("T")[0];
    
    // ✅ ตรวจสอบว่าแพทย์คนนี้มีอยู่ใน station นี้แล้วหรือไม่
    const stationDoctorsResponse = await fetch(`${API_BASE_URL}/get_station_doctors.php?station_id=${stationId}`);
    const stationDoctorsResult = await stationDoctorsResponse.json();
    const existingDoctors = stationDoctorsResult.data?.doctors || [];
    const existingDoctorIds = existingDoctors.map(d => d.doctor_id);

    const availableDoctors = doctors.filter(d => !existingDoctorIds.includes(d.doctor_id));

    if (availableDoctors.length === 0) {
      throw new Error("แพทย์ทั้งหมดมีการเพิ่มแล้ว");
    }

    // ✅ สร้าง dropdown
    const doctorOptions = availableDoctors
      .map(doc => `<option value="${doc.doctor_id}|${doc.doctor_code}|${doc.doctor_name}">
        👨‍⚕️ ${doc.doctor_name} (${doc.doctor_code})
      </option>`)
      .join("");

    const { value: formData } = await Swal.fire({
      title: "➕ เพิ่มแพทย์",
      html: `
        <div style="text-align: left; padding: 20px 0;">
          <!-- Doctor Selection -->
          <div style="margin-bottom: 20px;">
            <label style="font-size: 13px; color: #333; font-weight: 600; display: block; margin-bottom: 8px;">
              👨‍⚕️ เลือกแพทย์
            </label>
            <select id="doctorSelect" 
                    style="
                      width: 100%;
                      padding: 12px;
                      border: 1px solid #d0d7e0;
                      border-radius: 8px;
                      font-size: 13px;
                      background: white;
                    ">
              <option value="">-- เลือกแพทย์ --</option>
              ${doctorOptions}
            </select>
          </div>

          <!-- Work Start Time -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
            <div>
              <label style="font-size: 13px; color: #333; font-weight: 600; display: block; margin-bottom: 8px;">
                📍 เข้างาน
              </label>
              <input 
                type="time" 
                id="workStart" 
                value="08:00"
                style="
                  width: 100%;
                  padding: 10px 12px;
                  border: 1px solid #d0d7e0;
                  border-radius: 8px;
                  font-size: 13px;
                  box-sizing: border-box;
                ">
            </div>
            <div>
              <label style="font-size: 13px; color: #333; font-weight: 600; display: block; margin-bottom: 8px;">
                📍 ออกงาน
              </label>
              <input 
                type="time" 
                id="workEnd" 
                value="17:00"
                style="
                  width: 100%;
                  padding: 10px 12px;
                  border: 1px solid #d0d7e0;
                  border-radius: 8px;
                  font-size: 13px;
                  box-sizing: border-box;
                ">
            </div>
          </div>

          <!-- Break Time -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 13px; color: #333; font-weight: 600; display: block; margin-bottom: 8px;">
                🍽️ เบรก เริ่ม
              </label>
              <input 
                type="time" 
                id="breakStart" 
                value="12:00"
                style="
                  width: 100%;
                  padding: 10px 12px;
                  border: 1px solid #d0d7e0;
                  border-radius: 8px;
                  font-size: 13px;
                  box-sizing: border-box;
                ">
            </div>
            <div>
              <label style="font-size: 13px; color: #333; font-weight: 600; display: block; margin-bottom: 8px;">
                🍽️ เบรก จบ
              </label>
              <input 
                type="time" 
                id="breakEnd" 
                value="13:00"
                style="
                  width: 100%;
                  padding: 10px 12px;
                  border: 1px solid #d0d7e0;
                  border-radius: 8px;
                  font-size: 13px;
                  box-sizing: border-box;
                ">
            </div>
          </div>
        </div>
      `,
      confirmButtonText: "✅ บันทึก",
      cancelButtonText: "❌ ยกเลิก",
      showCancelButton: true,
      confirmButtonColor: "#0066cc",
    });

    if (!formData) return;

    const [doctor_id, doctor_code, doctor_name] = document.getElementById("doctorSelect").value.split("|");
    
    if (!doctor_id) {
      throw new Error("กรุณาเลือกแพทย์");
    }

    // ✅ Show loading
    Swal.fire({
      title: "⏳ กำลังบันทึก...",
      html: '<div style="margin-top: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #0066cc;"></i></div>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    // ✅ Add doctor to station
    const apiUrl = `${API_BASE_URL}/add_doctor_to_station.php`;

    const addResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        station_id: stationId,
        doctor_id: doctor_id,
        doctor_code: doctor_code,
        doctor_name: doctor_name,
        work_date: today,
        work_start_time: document.getElementById("workStart").value + ":00",
        work_end_time: document.getElementById("workEnd").value + ":00",
        break_start_time: document.getElementById("breakStart").value + ":00",
        break_end_time: document.getElementById("breakEnd").value + ":00",
      }),
    });

    if (!addResponse.ok) {
      throw new Error(`เกิดข้อผิดพลาด ${addResponse.status}`);
    }

    const result = await addResponse.json();

    if (result.success) {
      // ✅ SUCCESS
      Swal.fire({
        title: "✅ สำเร็จ!",
        html: `
          <div style="text-align: left; padding: 15px;">
            <p style="margin-bottom: 10px;">
              <strong>👨‍⚕️ ${doctor_name}</strong>
            </p>
            <p style="color: #28a745; font-size: 13px; margin-bottom: 8px;">
              ✓ เพิ่มแพทย์เข้าสถานีสำเร็จ
            </p>
            <p style="color: #666; font-size: 12px; line-height: 1.6;">
              ⏰ เวลาทำงาน: ${document.getElementById("workStart").value} - ${document.getElementById("workEnd").value}<br>
              🍽️ พักเบรก: ${document.getElementById("breakStart").value} - ${document.getElementById("breakEnd").value}<br>
              <br>
              🔄 กำลังมอบหมายห้อง...
            </p>
          </div>
        `,
        icon: "success",
        confirmButtonColor: "#0066cc",
      });

      // ✅ Reload doctors
      await loadDoctorsForStation(stationId);

      // ✅ TRIGGER AUTO-ASSIGN
      console.log("🔄 Auto-assigning doctor to room...");
      
      try {
        const autoAssignResponse = await fetch(`${API_BASE_URL}/auto_assign_doctor.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            station_id: stationId,
            current_date: today,
            current_time: new Date().toTimeString().split(' ')[0]
          }),
        });

        if (autoAssignResponse.ok) {
          const autoAssignResult = await autoAssignResponse.json();
          console.log("✅ Auto-assign result:", autoAssignResult);

          // ✅ Reload UI after 1 second
          setTimeout(async () => {
            console.log("🔄 Refreshing UI...");
            await loadDoctorsForStation(stationId);
            if (typeof loadStationRooms === 'function') {
              await loadStationRooms(stationId);
            }
            
            // ✅ Show success message
            if (autoAssignResult.data.auto_assigned_count > 0) {
              Swal.fire({
                title: "✅ มอบหมายห้องสำเร็จ",
                html: `
                  <div style="text-align: left; padding: 15px;">
                    <p style="color: #28a745; font-size: 13px;">
                      ✓ เพิ่มแพทย์: ${doctor_name}<br>
                      ✓ มอบหมายห้อง: ${autoAssignResult.data.assignments[0]?.room_name || 'N/A'}<br>
                      <br>
                      <strong>Ready to work!</strong> 🎉
                    </p>
                  </div>
                `,
                icon: "success",
                confirmButtonColor: "#0066cc",
                timer: 3000
              });
            }
          }, 1000);
        }
      } catch (autoAssignError) {
        console.warn("⚠️ Auto-assign warning:", autoAssignError.message);
        // ✅ ไม่ throw error - just warn
      }

    } else {
      throw new Error(result.message || "ไม่สามารถเพิ่มแพทย์");
    }

  } catch (error) {
    console.error("❌ Error:", error);

    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      text: error.message,
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

// ========================================
// ✅ FIXED: AUTO-ASSIGN ROOM FUNCTIONS
// ========================================

/**
 * ✅ START DOCTOR WORK + AUTO-ASSIGN ROOM
 * กด "ขึ้นทำงาน" → status="working" + auto-assign ห้อง
 */
async function startDoctorWorkWithRoomAssignment(stationDoctorId, doctorCode) {
  try {
    const currentDate = new Date().toISOString().split("T")[0];
    const currentTime = new Date().toTimeString().split(" ")[0];

    console.log(`🏥 เริ่มทำงาน + Auto-assign ห้องให้ Doctor: ${doctorCode}`);

    // 1️⃣ Update status → "working"
    const statusResponse = await fetch(`${API_BASE_URL}/update_doctor_status.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_doctor_id: stationDoctorId,
        status: "working",
        work_start_time: currentTime
      })
    });

    if (!statusResponse.ok) throw new Error("Status update failed");
    const statusResult = await statusResponse.json();

    if (!statusResult.success) {
      showNotificationMessage("❌ อัพเดท status ไม่สำเร็จ: " + statusResult.message, "error");
      return false;
    }

    console.log("✅ Status updated to working");

    // 2️⃣ Auto-assign ห้อง
    const assignResponse = await fetch(`${API_BASE_URL}/auto_assign_doctor_to_room.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_doctor_id: stationDoctorId,
        station_id: currentStationId,
        work_date: currentDate
      })
    });

    if (!assignResponse.ok) throw new Error("Room assignment failed");
    const assignResult = await assignResponse.json();

    if (assignResult.success && assignResult.data.assigned_room_id) {
      console.log(`✅ Doctor assigned to room ${assignResult.data.room_name}`);
      showNotificationMessage(
        `✅ ${doctorCode} เข้าห้อง ${assignResult.data.room_name}`,
        "success"
      );
    } else {
      console.warn("⚠️ ไม่มีห้องว่าง - Doctor อยู่ในสถานะ working แต่ยังไม่เข้าห้อง");
      showNotificationMessage("⚠️ ไม่มีห้องว่าง - Doctor เข้าสถานะทำงาน แต่ยังไม่มีห้อง", "warning");
    }

    // 3️⃣ Reload doctors to refresh UI
    await loadDoctorsForStation(currentStationId);
    return true;

  } catch (error) {
    console.error("❌ Error in startDoctorWorkWithRoomAssignment:", error);
    showNotificationMessage("❌ เกิดข้อผิดพลาด: " + error.message, "error");
    return false;
  }
}

/**
 * ✅ MANUAL ASSIGN ROOM (สำหรับกรณีที่ไม่มีห้องว่างตอน start work)
 * Doctor สามารถเลือกห้องได้เอง
 */
async function manualAssignDoctorToRoom(stationDoctorId, doctorName) {
  try {
    const currentDate = new Date().toISOString().split("T")[0];

    // Fetch available rooms
    const roomsResponse = await fetch(
      `${API_BASE_URL}/get_available_rooms.php?station_id=${currentStationId}&work_date=${currentDate}`
    );
    const roomsResult = await roomsResponse.json();
    
    if (!roomsResult.success || !roomsResult.data.rooms.length) {
      showNotificationMessage("❌ ไม่มีห้องว่าง", "error");
      return;
    }

    const rooms = roomsResult.data.rooms;

    // Create modal for room selection
    const roomOptions = rooms
      .map(room => `<option value="${room.room_id}">${room.room_name}</option>`)
      .join("");

    const modalHtml = `
      <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <h3 style="margin-bottom: 20px; font-weight: 700; color: #000;">🚪 เลือกห้องตรวจ</h3>
        <p style="margin-bottom: 15px; color: #666;">แพทย์: <strong>${doctorName}</strong></p>
        
        <select id="roomSelect" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; margin-bottom: 20px;">
          <option value="">-- เลือกห้อง --</option>
          ${roomOptions}
        </select>

        <div style="display: flex; gap: 10px;">
          <button onclick="confirmRoomAssignment(${stationDoctorId})" 
                  style="flex: 1; background: #0066cc; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
            ✅ ยืนยัน
          </button>
          <button onclick="closeModal()" 
                  style="flex: 1; background: #e9ecef; color: #333; border: none; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
            ❌ ยกเลิก
          </button>
        </div>
      </div>
    `;

    showModal(modalHtml);

  } catch (error) {
    console.error("Error in manualAssignDoctorToRoom:", error);
    showNotificationMessage("❌ เกิดข้อผิดพลาด", "error");
  }
}

/**
 * ✅ CONFIRM ROOM ASSIGNMENT
 */
async function confirmRoomAssignment(stationDoctorId) {
  const roomSelect = document.getElementById("roomSelect");
  const roomId = roomSelect ? roomSelect.value : null;
  
  if (!roomId) {
    showNotificationMessage("❌ กรุณาเลือกห้อง", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/assign_doctor_to_specific_room.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_doctor_id: stationDoctorId,
        room_id: roomId,
        work_date: new Date().toISOString().split("T")[0]
      })
    });

    const result = await response.json();
    
    if (result.success) {
      closeModal();
      showNotificationMessage(`✅ เข้าห้อง ${result.data.room_name} สำเร็จ`, "success");
      await loadDoctorsForStation(currentStationId);
    } else {
      showNotificationMessage("❌ " + result.message, "error");
    }
  } catch (error) {
    console.error("Error confirming room assignment:", error);
    showNotificationMessage("❌ เกิดข้อผิดพลาด", "error");
  }
}

/**
 * ✅ UNASSIGN DOCTOR FROM ROOM
 * เมื่อ Doctor ออกจากห้อง
 */
async function unassignDoctorFromRoom(stationDoctorId) {
  try {
    const response = await fetch(`${API_BASE_URL}/unassign_doctor_room.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_doctor_id: stationDoctorId
      })
    });

    const result = await response.json();
    
    if (result.success) {
      showNotificationMessage("✅ ออกจากห้องสำเร็จ", "success");
      await loadDoctorsForStation(currentStationId);
    } else {
      showNotificationMessage("❌ " + result.message, "error");
    }
  } catch (error) {
    console.error("Error unassigning room:", error);
    showNotificationMessage("❌ เกิดข้อผิดพลาด", "error");
  }
}

/**
 * ✅ UPDATE DOCTOR STATUS (Generic - for other statuses)
 */
async function updateDoctorStatusOnly(stationDoctorId, newStatus) {
  try {
    const response = await fetch(`${API_BASE_URL}/update_doctor_status.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_doctor_id: stationDoctorId,
        status: newStatus
      })
    });

    const result = await response.json();
    
    if (result.success) {
      await loadDoctorsForStation(currentStationId);
      return true;
    } else {
      showNotificationMessage("❌ " + result.message, "error");
      return false;
    }
  } catch (error) {
    console.error("Error updating status:", error);
    showNotificationMessage("❌ เกิดข้อผิดพลาด", "error");
    return false;
  }
}

/**
 * ✅ HELPER FUNCTIONS
 */

function showModal(content) {
  const modal = document.createElement("div");
  modal.id = "assignRoomModal";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  modal.innerHTML = content;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
  document.body.appendChild(modal);
}

function closeModal() {
  const modal = document.getElementById("assignRoomModal");
  if (modal) modal.remove();
}

function showNotificationMessage(message, type = "info") {
  const notification = document.createElement("div");
  const bgColor = {
    success: "#d4edda",
    error: "#f8d7da",
    warning: "#fff3cd",
    info: "#d1ecf1"
  }[type] || "#d1ecf1";

  const textColor = {
    success: "#155724",
    error: "#721c24",
    warning: "#856404",
    info: "#0c5460"
  }[type] || "#0c5460";

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgColor};
    color: ${textColor};
    padding: 15px 20px;
    border-radius: 8px;
    border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    z-index: 10000;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ✅ Add CSS animation (if not already present)
if (!document.getElementById('notificationStyles')) {
  const style = document.createElement("style");
  style.id = 'notificationStyles';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}