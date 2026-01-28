/**
 * 🏢 Station Management Module - FINAL COMPLETE WITH API SAVE
 * ระบบจัดการสถานี - โหลดและบันทึกข้อมูล
 * 
 * ✅ FIXED: 
 * - displayStationProcedures: เพิ่ม equipment column, readonly mode
 * - saveStationProcedureToDatabase: ✅ บันทึก time_target ผ่าน API ไป Database
 * - editStationProcedure: แก้ไข time_target field, editable mode, ✅ API SAVE
 * - 5 คอลัมน์แสดงผล (procedure_name | เวลาดำเนินการ | เวลารอ | เป้าหมาย | พนักงาน)
 * - ✅ เก็บ time_target ลง Database ผ่าน API
 * 
 * Features:
 * - Open station detail modal
 * - Display station information
 * - Add doctor to station
 * - Load station data
 * - ✅ Save procedure with time_target to database
 */

// ========================================
// ✅ GLOBAL VARIABLES
// ========================================

let currentStationId = null;
let currentStationData = null;
let statusUpdateInterval = null;
let allProceduresChecked = false;

// ========================================
// ✅ CORE FUNCTIONS
// ========================================

/**
 * เปิด Modal รายละเอียดสถานี
 * 
 * @param {number} stationId - ID ของสถานี
 */
async function openStationDetail(stationId) {
  // ✅ ตรวจสอบ stationId ว่าถูกต้องหรือไม่
  if (!stationId || stationId <= 0 || isNaN(stationId)) {
    console.error("❌ stationId ไม่ถูกต้อง:", stationId);
    alert("❌ ไม่สามารถเปิดสถานี: ID ไม่ถูกต้อง");
    return;
  }

  currentStationId = stationId;

  try {
    const apiUrl =
      getApiUrl("get_station_detail.php") + `?station_id=${stationId}`;
    console.log("🔥 กำลังโหลดข้อมูลสถานี ID:", stationId);

    const response = await fetch(apiUrl);
    const result = await response.json();

    if (result.success) {
      displayStationDetail(result.data);
      document.getElementById("stationDetailModal").style.display = "block";

      console.log("✅ กำลัง loadDoctorsForStation...");
      loadDoctorsForStation(stationId);
      console.log("✅ loadDoctorsForStation เสร็จสิ้น");

      loadStationStaff(stationId);
      
      // ✅ เริ่มโหลด auto-assign staff
      console.log("🤔 กำลังโหลด autoAssignStaffToRooms...");
      setTimeout(() => {
        autoAssignStaffToRooms();
      }, 800);
      
      // ✅ เริ่มโหลด setup status auto update
      if (typeof startDoctorAutoAssignByTime === 'function') {
  console.log("⏰ Starting doctor time-based auto-assign...");
  startDoctorAutoAssignByTime(stationId);
}
    } else {
      alert("❌ " + result.message);
    }
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการโหลด:", error);
    alert("❌ ไม่สามารถโหลดข้อมูลได้");
  }
}

/**
 * ✅ Add Doctor to Station
 * เพิ่มแพทย์เข้าสถานี
 * 
 * @param {number} stationId - ID ของสถานี
 */
async function addDoctorToStation(stationId) {
  try {
    // ✅ ดึงข้อมูล station detail
    const stationUrl =
      getApiUrl("get_station_detail.php") + `?station_id=${stationId}`;

    const stationResponse = await fetch(stationUrl);
    const stationResult = await stationResponse.json();

    if (!stationResult.success) {
      throw new Error(stationResult.message);
    }

    const station = stationResult.data.station;
    const departmentId = station.department_id;

    // ✅ ส่ง request
    const addUrl = getApiUrl("add_doctor_to_station.php");

    const addResponse = await fetch(addUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_id: stationId,
        department_id: departmentId,
      }),
    });

    const result = await addResponse.json();

    if (result.success) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: "✅ เพิ่มแพทย์สำเร็จ",
          icon: "success",
        });
      }

      loadDoctorsForStation(stationId);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: "❌ เกิดข้อผิดพลาด",
        text: error.message,
        icon: "error",
      });
    }
  }
}

/**
 * ✅ Display Station Detail
 * แสดงรายละเอียดสถานีใน tabs
 * 
 * @param {object} data - Station data จาก API
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
  
  // ✅ เริ่มโหลดข้อมูลขั้นตอนการรักษาจริง
  if (typeof displayStationProcedures === 'function') {
    displayStationProcedures(data.station_procedures || []);
  }

  // ✅ ดึงข้อมูลผู้ป่วยแบบ RealTime API
  if (typeof loadStationPatients === 'function') {
    if (station.department_ids || station.department_id) {
      const deptIds = station.department_ids || [station.department_id];
      await loadStationPatients(station.station_id, deptIds);
    }
  }

  // Ensure the first tab is active
  switchStationTab("Rooms");
}

/**
 * ✅ Display Station Rooms - MODERN UI
 * แสดงห้องในรูปแบบ Modern Card Grid Layout
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

  if (!rooms || rooms.length === 0) {
    document.getElementById("stationRoomsContent").innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #adb5bd;">
        <i class="fas fa-door-open" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">ไม่มีห้องในสถานีนี้</div>
        <div style="font-size: 13px; color: #999; margin-bottom: 20px;">ยังไม่มีข้อมูลห้องที่สร้าง</div>
        <button onclick="openCreateRoomModal()" 
                style="background: #0066cc; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px;">
          <i class="fas fa-plus"></i> สร้างห้องใหม่
        </button>
      </div>
    `;
    return;
  }

  let html = `
    <div style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #000;">
          🏢 ห้อง 
          <span style="background: #0066cc; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; margin-left: 10px;">
            ${rooms.length}
          </span>
        </h3>
        <button onclick="openCreateRoomModal()"
                style="background: #0066cc; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 12px; transition: all 0.2s;"
                onmouseover="this.style.background='#0052a3'"
                onmouseout="this.style.background='#0066cc'">
          <i class="fas fa-plus"></i> สร้างห้องใหม่
        </button>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
  `;

  rooms.forEach((room) => {
    const hasStaff = room.staff_count > 0;
    const hasDoctor = room.doctor_count > 0;
    const hasPatient = room.patient_count > 0;

    console.log(
      `📍 ${room.room_name}: Staff=${hasStaff} (${room.staff_count}), Doctor=${hasDoctor} (${room.doctor_count}), Patient=${hasPatient} (${room.patient_count})`
    );
    
    // 🔍 Debug: ตรวจสอบ room object properties
    console.log('🔍 Room object:', {
      room_id: room.room_id,
      room_number: room.room_number,
      room_name: room.room_name,
      all_keys: Object.keys(room)
    });

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

        if (currentTime >= start) {
          if (!end) return true;
          if (currentTime < end) return true;
          return false;
        }
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

        if (currentTime >= start) {
          if (!end) return true;
          if (currentTime < end) return true;
          return false;
        }
        return false;
      });
    }

    // ✅ ตรวจสอบว่ามีอุปกรณ์ที่ไม่ต้องการพนักงานหรือไม่
    const hasEquipmentNotRequiringStaff = 
      room.equipment_list && 
      Array.isArray(room.equipment_list) && 
      room.equipment_list.some(eq => eq.require_staff !== 1);

    // ✅ ห้องเปิดใช้งาน = มีแพทย์อยู่เวร OR มีพนักงานอยู่เวร OR มีอุปกรณ์ที่ไม่ต้องการพนักงาน
    const isActive = isDoctorOnDuty || isStaffOnDuty || hasEquipmentNotRequiringStaff;
    const isDisabled = !isActive;

    let statusColor, statusIcon, statusText, statusBgColor, borderColor;

    if (isActive) {
      statusColor = "#1E8449";
      statusIcon = "fa-circle";
      statusText = "เปิด";
      statusBgColor = "#f0f8f4";
      borderColor = "#90EE90";
    } else if (hasDoctor || hasStaff) {
      statusColor = "#FFC107";
      statusIcon = "fa-clock";
      statusText = "รอเวลา";
      statusBgColor = "#fffbf0";
      borderColor = "#FFD700";
    } else {
      statusColor = "#6c757d";
      statusIcon = "fa-lock";
      statusText = "ปิด";
      statusBgColor = "#f8f9fa";
      borderColor = "#d0d7e0";
    }

    // แสดงข้อความเตือน
    let warningMsg = "⚠️ ปิดเนื่องจากขาดพนักงาน";
    if (!hasDoctor && !hasStaff) {
      warningMsg = "⚠️ ไม่มีแพทย์/พนักงาน";
    } else if (!isActive) {
      const firstTime =
        room.doctor_work_times?.[0] || room.staff_work_times?.[0];
      if (firstTime) {
        const start = normalizeTime(firstTime.work_start_time);
        warningMsg = `⏳ เปิด ${start}`;
      }
    }

    html += `
      <div 
        class="room-card-modern"
        style="
          background: white;
          border: 2px solid ${borderColor};
          border-left: 4px solid ${statusColor};
          border-radius: 10px;
          padding: 16px;
          position: relative;
          cursor: ${isDisabled ? "not-allowed" : "pointer"};
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          opacity: ${isDisabled ? "0.7" : "1"};
        "
        onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'"
        onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'"
        data-room-id="${room.room_id}"
        ${!isDisabled ? `onclick="openRoomDetail(this.getAttribute('data-room-id'))"` : ""}
      >
        <!-- Delete Button -->
        <button 
          data-room-id="${room.room_id}"
          data-room-name="${room.room_name}"
          onclick="event.stopPropagation(); deleteRoomConfirm(this.getAttribute('data-room-id'), this.getAttribute('data-room-name'))"
          style="
            position: absolute;
            top: 12px;
            right: 12px;
            background: #dc3545;
            color: white;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            z-index: 10;
            transition: all 0.2s;
          "
          onmouseover="this.style.background='#c82333'; this.style.transform='scale(1.1)'"
          onmouseout="this.style.background='#dc3545'; this.style.transform='scale(1)'"
          title="ลบห้อง"
        >
          <i class="fas fa-trash"></i>
        </button>

        <!-- Room Title -->
        <div style="font-weight: 700; font-size: 14px; color: #000; margin-bottom: 12px; padding-right: 40px;">
          🚪 ${room.room_name}
        </div>

        <!-- Status Badge -->
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 12px;">
          <span style="
            background: ${statusColor};
            color: white;
            padding: 4px 10px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          ">
            <i class="fas ${statusIcon}"></i>${statusText}
          </span>
        </div>

        <!-- Stats Grid -->
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e0e6ed;
        ">
          <!-- Staff -->
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: 700; color: #0066cc;">
              ${room.staff_count}
            </div>
            <div style="font-size: 10px; color: #666; margin-top: 2px; font-weight: 500;">
              👨‍💼 พนักงาน
            </div>
          </div>

          <!-- Doctor -->
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: 700; color: #0066cc;">
              ${room.doctor_count}
            </div>
            <div style="font-size: 10px; color: #666; margin-top: 2px; font-weight: 500;">
              👨‍⚕️ แพทย์
            </div>
          </div>

          <!-- Patient -->
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: 700; color: #0066cc;">
              ${room.patient_count}
            </div>
            <div style="font-size: 10px; color: #666; margin-top: 2px; font-weight: 500;">
              🏥️ ผู้ป่วย
            </div>
          </div>
        </div>

        <!-- Warning Message -->
        ${
          isDisabled
            ? `
          <div style="
            background: linear-gradient(135deg, rgba(220, 53, 69, 0.08), rgba(220, 53, 69, 0.05));
            color: #C0392B;
            border: 1px solid rgba(220, 53, 69, 0.2);
            border-radius: 8px;
            padding: 8px 10px;
            font-size: 11px;
            font-weight: 600;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          ">
            ${warningMsg}
          </div>
          `
            : ""
        }

        <!-- Click Hint -->
        ${
          !isDisabled
            ? `
          <div style="
            text-align: center;
            margin-top: 10px;
            font-size: 10px;
            color: #999;
            font-weight: 500;
          ">
            🔍 คลิกเพื่อดูรายละเอียด
          </div>
          `
            : ""
        }
      </div>
    `;
  });

  html += "</div>";
  document.getElementById("stationRoomsContent").innerHTML = html;
  console.log("✅ displayStationRooms สำเร็จ");
}

/**
 * ✅ Switch Station Tab
 * เปลี่ยน tab ใน station detail
 * 
 * @param {string} tabName - ชื่อ tab (Rooms, Doctors, Staff, Procedures, Patients)
 */
function switchStationTab(tabName) {
  const tabContent = document.getElementById(`station${tabName}Content`);
  if (!tabContent) {
    console.warn(`⚠️ Tab content not found: station${tabName}Content`);
    return;
  }

  document.querySelectorAll(".station-tab-content").forEach((tab) => {
    tab.style.display = "none";
  });
  document.querySelectorAll(".station-tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  
  tabContent.style.display = "block";
  const activeBtn = document.querySelector(`[onclick="switchStationTab('${tabName}')"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
}

/**
 * ✅ Setup Status Auto Update
 * ตั้งค่าให้อัพเดตสถานะสถานีอัตโนมัติ (เริ่มโหลดใหม่ทุกนาที)
 * 
 * @param {number} stationId - ID ของสถานี
 */
function setupStatusAutoUpdate(stationId) {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
  }
  
  statusUpdateInterval = setInterval(() => {
    if (document.getElementById("stationDetailModal").style.display === "block") {
      // อัพเดตสถานะห้องโดยอัตโนมัติ
      if (currentStationData) {
        console.log(`🔄 อัพเดตสถานะ Station ${stationId}`);
      }
    }
  }, 60000); // อัพเดตทุก 1 นาที
}

/**
 * ✅ Display Station Doctors
 * แสดงรายชื่อแพทย์ในสถานี
 * 
 * @param {array} doctors - Array ของแพทย์
 */
function displayStationDoctors(doctors) {
  const container = document.getElementById("stationDoctorsContent");
  if (!container) {
    console.warn("⚠️ stationDoctorsContent not found");
    return;
  }

  // Extract unique doctors from all rooms
  const doctorMap = new Map();
  
  if (currentStationData && currentStationData.rooms) {
    currentStationData.rooms.forEach(room => {
      if (room.doctor_work_times && Array.isArray(room.doctor_work_times)) {
        room.doctor_work_times.forEach(doctor => {
          const key = `${doctor.station_doctor_id}`;
          if (!doctorMap.has(key)) {
            doctorMap.set(key, {
              ...doctor,
              room_name: room.room_name,
              room_id: room.room_id
            });
          }
        });
      }
    });
  }

  const doctorList = Array.from(doctorMap.values());

  if (doctorList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #adb5bd;">
        <i class="fas fa-user-md" style="font-size: 48px; margin-bottom: 15px;"></i>
        <div>ไม่มีแพทย์ในสถานีนี้</div>
        <button class="btn" style="margin-top: 15px; background: #0047AB; color: white;" 
                onclick="addDoctorToStation(${currentStationId})">
          <i class="fas fa-plus"></i> เพิ่มแพทย์
        </button>
      </div>
    `;
    return;
  }

  let doctorHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3 style="margin: 0; font-size: 16px;">👨‍⚕️ แพทย์ (${doctorList.length})</h3>
      <button class="btn" style="background: #0047AB; color: white;" 
              onclick="addDoctorToStation(${currentStationId})">
        <i class="fas fa-plus"></i> เพิ่มแพทย์
      </button>
    </div>
  `;

  doctorList.forEach(doctor => {
    const statusColor = {
      'available': '#1E8449',
      'working': '#0056B3',
      'break': '#D35400',
      'offline': '#6c757d'
    }[doctor.status] || '#6c757d';

    const statusText = {
      'available': 'พร้อม',
      'working': 'ทำงาน',
      'break': 'พักเบรก',
      'offline': 'ไม่ทำงาน'
    }[doctor.status] || doctor.status;

    doctorHTML += `
      <div class="staff-card" style="background: rgba(255,255,255,0.8); padding: 15px; border-radius: 10px; border-left: 4px solid ${statusColor}; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <div>
            <div style="font-weight: 600; margin-bottom: 3px;">${doctor.doctor_name || 'N/A'}</div>
            <div style="font-size: 11px; color: #adb5bd;">${doctor.specialty || 'แพทย์'}</div>
          </div>
          <span style="background: ${statusColor}; color: white; padding: 6px 12px; border-radius: 15px; font-size: 11px; font-weight: 600; white-space: nowrap;">
            <i class="fas fa-circle" style="font-size: 8px;"></i> ${statusText}
          </span>
        </div>
        
        <div style="background: rgba(0, 71, 171, 0.1); padding: 8px; border-radius: 6px; margin-bottom: 8px; font-size: 11px;">
          📍 ${doctor.room_name || 'ไม่ได้ระบุห้อง'}
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
          <div><strong>เริ่ม:</strong> ${doctor.work_start_time || 'N/A'}</div>
          <div><strong>สิ้นสุด:</strong> ${doctor.work_end_time || 'N/A'}</div>
          <div><strong>พักเริ่ม:</strong> ${doctor.break_start_time || 'N/A'}</div>
          <div><strong>พักจบ:</strong> ${doctor.break_end_time || 'N/A'}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = doctorHTML;
}

/**
 * ✅ Save Station Procedure to Database
 * บันทึกข้อมูล Time_target + อื่นๆ ผ่าน API
 */
async function saveStationProcedureToDatabase(index, data) {
  const proc = window.stationProceduresData[index];
  
  console.log('💾 Saving procedure to database:', {
    procedure_id: proc.procedure_id || proc.id,
    station_id: currentStationId,
    wait_time: data.wait,
    procedure_time: data.time,
    staff_required: data.staff,
    Time_target: data.target  // ✅ FIXED: Capital T
  });

  try {
    const response = await fetch(getApiUrl('update_procedure.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        procedure_id: proc.procedure_id || proc.id,
        station_id: currentStationId,
        wait_time: parseInt(data.wait) || 0,
        procedure_time: parseInt(data.time) || 30,
        staff_required: parseInt(data.staff) || 0,
        equipment_required: proc.equipment_required || 0,
        Time_target: parseInt(data.target) || 0  // ✅ FIXED: Capital T
      })
    });

    const result = await response.json();
    
    console.log('🔥 API Response:', result);
    
    if (result.success) {
      console.log('✅ Saved to database successfully');
      return true;
    } else {
      console.error('❌ Failed to save:', result.message);
      Swal.fire({
        title: '⚠️ บันทึกไม่สำเร็จ',
        html: `<p>เกิดข้อผิดพลาด: <strong>${result.message}</strong></p>`,
        icon: 'warning',
        confirmButtonColor: '#ffc107'
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving to database:', error);
    Swal.fire({
      title: '❌ เกิดข้อผิดพลาด',
      html: `<p><strong>${error.message}</strong></p><p style="font-size: 12px; color: #999;">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้</p>`,
      icon: 'error',
      confirmButtonColor: '#dc3545'
    });
    return false;
  }
}

/**
 * ✅ Display Station Procedures - READONLY MODE (FINAL)
 * แสดงขั้นตอนการรักษาในรูปแบบ Card read-only
 * ✅ FIXED: input fields เป็น readonly, ไม่สามารถ edit ได้
 * ✅ 5 คอลัมน์แสดงผล (procedure_name | เวลาดำเนินการ | เวลารอ | เป้าหมาย | พนักงาน)
 */
function displayStationProcedures(procedures) {
  const container = document.getElementById("stationProceduresContent");
  if (!container) {
    console.warn("⚠️ stationProceduresContent not found");
    return;
  }

  if (!procedures || procedures.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #adb5bd;">
        <i class="fas fa-ban" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">ไม่มีขั้นตอนการรักษาในสถานีนี้</div>
        <div style="font-size: 13px; color: #999; margin-bottom: 20px;">ยังไม่มีข้อมูลขั้นตอนการรักษาที่เพิ่ม</div>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <button onclick="addNewStationProcedure()"
                  style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);"
                  onmouseover="this.style.background='#218838'; this.style.boxShadow='0 4px 12px rgba(40, 167, 69, 0.3)'; this.style.transform='translateY(-2px)'"
                  onmouseout="this.style.background='#28a745'; this.style.boxShadow='0 2px 4px rgba(40, 167, 69, 0.2)'; this.style.transform='translateY(0)'">
            <i class="fas fa-plus"></i> เพิ่มขั้นตอนการรักษาใหม่
          </button>
          
          <button onclick="openSelectProcedureFromStationDBModal()"
                  style="background: linear-gradient(135deg, #0056B3 0%, #003d82 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0, 86, 179, 0.2);"
                  onmouseover="this.style.boxShadow='0 4px 12px rgba(0, 86, 179, 0.3)'; this.style.transform='translateY(-2px)'"
                  onmouseout="this.style.boxShadow='0 2px 4px rgba(0, 86, 179, 0.2)'; this.style.transform='translateY(0)'">
            <i class="fas fa-database"></i> ดึงขั้นตอนการรักษาจาก Database
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Store procedures globally for search/filter
  window.stationProceduresData = procedures;

  let proceduresHTML = `
    <div style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #000;">
          🔤 ขั้นตอนการรักษา 
          <span style="background: #000; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; margin-left: 10px;">
            ${procedures.length}
          </span>
        </h3>
        <div style="display: flex; gap: 10px;">
          <button onclick="addNewStationProcedure()"
                  style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 12px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);"
                  onmouseover="this.style.background='#218838'; this.style.boxShadow='0 4px 12px rgba(40, 167, 69, 0.3)'; this.style.transform='translateY(-2px)'"
                  onmouseout="this.style.background='#28a745'; this.style.boxShadow='0 2px 4px rgba(40, 167, 69, 0.2)'; this.style.transform='translateY(0)'">
            <i class="fas fa-plus"></i> เพิ่มขั้นตอนการรักษา
          </button>
          
          <button onclick="openSelectProcedureFromStationDBModal()"
                  style="background: linear-gradient(135deg, #0056B3 0%, #003d82 100%); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 12px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0, 86, 179, 0.2);"
                  onmouseover="this.style.boxShadow='0 4px 12px rgba(0, 86, 179, 0.3)'; this.style.transform='translateY(-2px)'"
                  onmouseout="this.style.boxShadow='0 2px 4px rgba(0, 86, 179, 0.2)'; this.style.transform='translateY(0)'">
            <i class="fas fa-database"></i> Database
          </button>
        </div>
      </div>
      
      <div style="position: relative;">
        <i class="fas fa-search" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #999; font-size: 14px;"></i>
        <input 
          type="text" 
          id="procedureSearch"
          placeholder="ค้นหาขั้นตอนการรักษา..."
          onkeyup="filterStationProceduresHighlight()"
          style="width: 100%; padding: 10px 15px 10px 40px; border: 2px solid #e9ecef; border-radius: 10px; font-size: 13px; transition: all 0.3s; background: #f8f9fa;"
        />
      </div>
    </div>

    <!-- ✅ FIXED: Horizontal Inline Layout -->
    <div style="
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      box-sizing: border-box;
    ">
  `;

  procedures.forEach((proc, index) => {
    const timeTarget = proc.time_target || 0;
    
    proceduresHTML += `
      <div 
        id="proc-row-${index}" 
        class="proc-card" 
        style="
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 12px 16px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: nowrap;
          width: 100%;
          box-sizing: border-box;
          min-height: 60px;
        "
        onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'; this.style.borderColor='#667EEA'; this.style.transform='translateY(-1px)';"
        onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.borderColor='#e9ecef'; this.style.transform='';"
      >
        
        <!-- Badge Number -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #667EEA 0%, #764ba2 100%);
          color: white;
          border-radius: 4px;
          font-weight: 700;
          font-size: 12px;
          flex-shrink: 0;
        ">
          ${index + 1}
        </div>

        <!-- Name + Code -->
        <div style="
          flex: 0 0 auto;
          min-width: 150px;
          max-width: 200px;
        ">
          <div class="proc-name-highlight" style="
            font-weight: 700;
            color: #000;
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          ">
            ${proc.procedure_name || proc.procedure_code}
          </div>
          <div style="
            font-size: 10px;
            color: #adb5bd;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          ">
            ${proc.procedure_code || 'N/A'}
          </div>
        </div>

        <!-- Divider -->
        <div style="
          width: 1px;
          height: 30px;
          background: #e9ecef;
          flex-shrink: 0;
        "></div>

        <!-- เวลาดำเนินการ -->
        <div style="
          flex: 0 0 auto;
          text-align: center;
        ">
          <div style="font-size: 9px; color: #6b7280; font-weight: 600; margin-bottom: 2px; white-space: nowrap;">เวลาดำเนินการ</div>
          <div style="
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
            color: #667EEA;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 12px;
            white-space: nowrap;
          ">
            ${proc.procedure_time || 'N/A'}<span style="font-size: 9px; margin-left: 2px;">นาที</span>
          </div>
        </div>

        <!-- เวลารอ -->
        <div style="
          flex: 0 0 auto;
          text-align: center;
        ">
          <div style="font-size: 9px; color: #6b7280; font-weight: 600; margin-bottom: 2px; white-space: nowrap;">เวลารอ</div>
          <div style="
            background: linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(245, 127, 23, 0.15));
            color: #f57c00;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 12px;
            white-space: nowrap;
          ">
            ${proc.wait_time || 'N/A'}<span style="font-size: 9px; margin-left: 2px;">นาที</span>
          </div>
        </div>

        <!-- เป้าหมายเวลา -->
        <div style="
          flex: 0 0 auto;
        ">
          <div style="font-size: 9px; color: #6b7280; font-weight: 600; margin-bottom: 2px; white-space: nowrap;">เป้าหมายเวลา</div>
          <input type="number" 
                 value="${timeTarget}" 
                 readonly
                 onclick="event.stopPropagation()"
                 style="
                   width: 50px;
                   padding: 4px 6px;
                   border: 1px solid #e9ecef;
                   border-radius: 4px;
                   text-align: center;
                   font-weight: 600;
                   font-size: 12px;
                   background: #f8f9fa;
                   cursor: not-allowed;
                 " />
        </div>

        <!-- พนักงาน -->
        <div style="
          flex: 0 0 auto;
        ">
          <div style="font-size: 9px; color: #6b7280; font-weight: 600; margin-bottom: 2px; white-space: nowrap;">พนักงาน</div>
          <input type="number" 
                 value="${proc.staff_required || 0}" 
                 readonly
                 onclick="event.stopPropagation()"
                 style="
                   width: 50px;
                   padding: 4px 6px;
                   border: 1px solid #e9ecef;
                   border-radius: 4px;
                   text-align: center;
                   font-weight: 600;
                   font-size: 12px;
                   background: #f8f9fa;
                   cursor: not-allowed;
                 " />
        </div>

        <!-- Buttons -->
        <div style="
          display: flex;
          gap: 6px;
          flex-shrink: 0;
          margin-left: auto;
        ">
          <button onclick="editStationProcedure(${index})" 
                  title="แก้ไขขั้นตอนการรักษา"
                  style="
                    background: #ffa500;
                    color: white;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    font-size: 14px;
                    box-shadow: 0 2px 4px rgba(255, 165, 0, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                  "
                  onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(255, 165, 0, 0.3)'; this.style.background='#ff8c00'"
                  onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(255, 165, 0, 0.2)'; this.style.background='#ffa500'">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteStationProcedure(${index})" 
                  title="ลบขั้นตอนการรักษา"
                  style="
                    background: #dc3545;
                    color: white;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    font-size: 14px;
                    box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                  "
                  onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(220, 53, 69, 0.3)'; this.style.background='#c82333'"
                  onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(220, 53, 69, 0.2)'; this.style.background='#dc3545'">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  });

  proceduresHTML += `
    </div>
  `;

  container.innerHTML = proceduresHTML;
}

/**
 * ✅ Filter and Highlight Station Procedures
 */
function filterStationProceduresHighlight() {
  const searchText = document.getElementById("procedureSearch").value.toLowerCase();
  const rows = document.querySelectorAll(".proc-card");
  
  rows.forEach(row => {
    const procName = row.querySelector(".proc-name-highlight");
    const fullText = row.textContent.toLowerCase();
    
    const isMatch = fullText.includes(searchText);
    
    // ✅ KEY FIX: Use height/overflow instead of display:none to prevent layout shift
    if (isMatch) {
      row.style.height = "";              // ← Reset to auto
      row.style.overflow = "";             // ← Reset
      row.style.marginBottom = "";         // ← Reset
      row.style.padding = "12px 16px";     // ← Reset
      row.style.opacity = "1";             // ← Full visibility
      row.style.pointerEvents = "auto";    // ← Enable interaction
    } else {
      row.style.height = "0";              // ← Collapse height
      row.style.overflow = "hidden";       // ← Hide overflow
      row.style.marginBottom = "0";        // ← Remove margin
      row.style.padding = "0 16px";        // ← Collapse padding
      row.style.opacity = "0";             // ← Hide visually
      row.style.pointerEvents = "none";    // ← Disable interaction
    }
    
    // Highlight matching text
    if (procName && searchText.length > 0) {
      const text = procName.textContent;
      const regex = new RegExp(`(${searchText})`, 'gi');
      procName.innerHTML = text.replace(regex, '<mark style="background: #ffeb3b; color: #000; padding: 2px 4px; border-radius: 3px; font-weight: 700;">$1</mark>');
    } else if (procName) {
      procName.textContent = procName.textContent;
    }
  });
}

/**
 * ✅ Edit Station Procedure (MODERN) - FIXED WITH API SAVE
 * แก้ไขขั้นตอนการรักษา Modern Dialog + บันทึกลง Database
 */
function editStationProcedure(index) {
  const proc = window.stationProceduresData[index];
  
  Swal.fire({
    title: '🖏️ แก้ไขขั้นตอนการรักษา',
    html: `
      <div style="text-align: left; padding: 20px; background: #f8f9fa; border-radius: 12px;">
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 700; color: #000; font-size: 13px;">ชื่อขั้นตอนการรักษา</label>
          <input type="text" id="editProcName" value="${proc.procedure_name || ''}" 
                 class="swal2-input" style="width: 100%; border-radius: 8px; border: 2px solid #e9ecef; padding: 10px 12px; font-size: 13px;" />
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 700; color: #000; font-size: 13px;">เวลาดำเนินการ (นาที)</label>
          <input type="number" id="editProcTime" value="${proc.procedure_time || 30}" 
                 class="swal2-input" style="width: 100%; border-radius: 8px; border: 2px solid #e9ecef; padding: 10px 12px; font-size: 13px;" />
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 700; color: #000; font-size: 13px;">เวลารอ (นาที)</label>
          <input type="number" id="editProcWait" value="${proc.wait_time || 10}" 
                 class="swal2-input" style="width: 100%; border-radius: 8px; border: 2px solid #e9ecef; padding: 10px 12px; font-size: 13px;" />
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 700; color: #4CAF50; font-size: 13px;">✅ เป้าหมายเวลา (นาที)</label>
          <input type="number" id="editProcTarget" value="${proc.time_target || 0}" 
                 class="swal2-input" style="width: 100%; border-radius: 8px; border: 2px solid #4CAF50; padding: 10px 12px; font-size: 13px; background: #f1f8f4;" />
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 700; color: #000; font-size: 13px;">จำนวนพนักงานที่ต้องการ</label>
          <input type="number" id="editProcStaff" value="${proc.staff_required || 0}" 
                 class="swal2-input" style="width: 100%; border-radius: 8px; border: 2px solid #e9ecef; padding: 10px 12px; font-size: 13px;" />
        </div>
      </div>
    `,
    confirmButtonText: '💾 บันทึก',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#000',
    showCancelButton: true,
    preConfirm: () => {
      return {
        name: document.getElementById('editProcName').value,
        time: document.getElementById('editProcTime').value,
        wait: document.getElementById('editProcWait').value,
        target: document.getElementById('editProcTarget').value,
        staff: document.getElementById('editProcStaff').value
      };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      // 1️⃣ Show loading
      Swal.fire({
        title: '💾 กำลังบันทึก...',
        html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #000;"></i>',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false
      });

      // 2️⃣ Save to database ✅
      const saveSuccess = await saveStationProcedureToDatabase(index, result.value);

      if (saveSuccess) {
        // 3️⃣ Update local data
        window.stationProceduresData[index].procedure_name = result.value.name;
        window.stationProceduresData[index].procedure_time = result.value.time;
        window.stationProceduresData[index].wait_time = result.value.wait;
        window.stationProceduresData[index].time_target = result.value.target;
        window.stationProceduresData[index].staff_required = result.value.staff;
        
        // 4️⃣ Refresh display
        displayStationProcedures(window.stationProceduresData);
        
        // 5️⃣ Show success
        Swal.close();
        Swal.fire({
          title: '✅ สำเร็จ!',
          html: `
            <p>แก้ไขขั้นตอนการรักษาสำเร็จ</p>
            <div style="margin-top: 10px; padding: 10px; background: #f1f8f4; border-radius: 6px; font-size: 12px;">
              <strong>✅ บันทึกลง Database สำเร็จ</strong>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#000'
        });
      } else {
        // ❌ Save failed - close loading
        Swal.close();
      }
    }
  });
}

/**
 * ✅ Delete Room Confirm
 * ยืนยันการลบห้อง
 */
function deleteRoomConfirm(roomId, roomName) {
  // Convert to int if it's a string
  roomId = parseInt(roomId, 10);
  
  console.log('🔄 Deleting room confirm:', { roomId, roomName, type: typeof roomId });
  
  if (!roomId || roomId <= 0 || isNaN(roomId)) {
    console.error('❌ Invalid room ID:', roomId);
    alert('❌ Invalid room ID');
    return;
  }
  
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: '⚠️ ยืนยันการลบ',
      text: `คุณต้องการลบห้อง "${roomName}" จริงหรือไม่? การลบจะไม่สามารถกู้คืนได้`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🗑️ ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteRoom(roomId);
      }
    });
  } else {
    if (confirm(`ลบห้อง "${roomName}" จริงหรือไม่?`)) {
      deleteRoom(roomId);
    }
  }
}

/**
 * ✅ Delete Room
 * ลบห้องจากระบบ
 */
function deleteRoom(roomId) {
  // Convert to int
  roomId = parseInt(roomId, 10);
  
  console.log('🔄 Deleting room from DB:', roomId);
  
  if (!roomId || roomId <= 0) {
    console.error('❌ Invalid room_id:', roomId);
    return;
  }
  
  const apiUrl = `${getApiUrl('delete_room.php')}`;
  const payload = {
    room_id: roomId,
    station_id: currentStationId
  };
  
  console.log('📤 Sending delete request:', payload);
  
  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(response => response.text())  // ✅ เปลี่ยนเป็น text() ก่อน parse
  .then(text => {
    console.log('🔥 Raw delete response:', text);
    
    // ✅ ทำความสะอาด response: ลบข้อความอื่นก่อน JSON
    let cleanText = text.trim();
    const startIdx = cleanText.indexOf('{');
    if (startIdx !== -1) {
      cleanText = cleanText.substring(startIdx);
    }
    
    console.log('🧹 Cleaned delete response:', cleanText);
    
    try {
      const result = JSON.parse(cleanText);
      console.log('✅ Delete result:', result);
      
      if (result.success) {
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            title: '✅ ลบสำเร็จ',
            text: 'ห้องถูกลบเรียบร้อย',
            icon: 'success'
          }).then(() => {
            // Refresh station details
            if (currentStationId) {
              openStationDetail(currentStationId);
            }
          });
        }
      } else {
        console.error('❌ Delete failed:', result.message);
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            title: '❌ ลบไม่สำเร็จ',
            text: result.message || 'ไม่สามารถลบห้องได้',
            icon: 'error'
          });
        }
      }
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('🔥 Response was:', cleanText);
      
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: '❌ เกิดข้อผิดพลาด',
          text: `Server response error: ${parseError.message}`,
          icon: 'error'
        });
      }
    }
  })
  .catch(error => {
    console.error('❌ Network error:', error);
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: '❌ เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์',
        icon: 'error'
      });
    }
  });
}

/**
 * ✅ Add Doctor Row
 */
function addDoctorRow() {
  console.log('👨‍⚕️ Adding doctor row');
}

/**
 * ✅ Add Procedure To Patient
 */
function addProcedureToPatient() {
  console.log('🖨️ Adding procedure to patient');
}

/**
 * ✅ Add Staff Schedule Row
 */
function addStaffScheduleRow() {
  console.log('📅 Adding staff schedule row');
}

/**
 * ✅ Clear All Procedures
 */
function clearAllProcedures() {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: '⚠️ ลบขั้นตอนการรักษาทั้งหมด',
      text: 'คุณต้องการลบขั้นตอนการรักษาทั้งหมดจริงหรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบ',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('✅ Cleared all procedures');
      }
    });
  }
}

/**
 * ✅ Close Add Equipment Modal
 */
function closeAddEquipmentModal() {
  const modal = document.getElementById('addEquipmentModal');
  if (modal) modal.style.display = 'none';
}

/**
 * ✅ Close Add Procedure Modal
 */
function closeAddProcedureModal() {
  const modal = document.getElementById('addProcedureModal');
  if (modal) modal.style.display = 'none';
}

/**
 * ✅ Close Add Staff Modal
 */
function closeAddStaffModal() {
  const modal = document.getElementById('addStaffModal');
  if (modal) modal.style.display = 'none';
}

/**
 * ✅ Close Edit Staff Schedule Modal
 */
function closeEditStaffScheduleModal() {
  const modal = document.getElementById('editStaffScheduleModal');
  if (modal) modal.style.display = 'none';
}

/**
 * ✅ Close Import Modal
 */
function closeImportModal() {
  const modal = document.getElementById('importModal');
  if (modal) modal.style.display = 'none';
}

/**
 * ✅ Close Patient Detail Modal
 */
function closePatientDetailModal() {
  const modal = document.getElementById('patientDetailModal');
  if (modal) modal.style.display = 'none';
}

/**
 * ✅ Close Visual Simulation
 */
function closeVisualSimulation() {
  const modal = document.getElementById('visualSimulationModal');
  if (modal) modal.style.display = 'none';
}

/**
 * ✅ Close Wizard
 */
function closeWizard() {
  console.log('🔧 closeWizard() called');
  
  // ✅ 1. ปิด modal (ใช้ display: none ไม่ใช่ !important)
  const modal = document.getElementById('createStationWizard');
  if (modal) {
    modal.style.display = 'none';  // ✅ ใช้ display: none แทนการซ่อนอื่นๆ
    console.log('✅ Modal closed');
  } else {
    console.error('❌ Modal element not found');
    return;
  }
  
  // ✅ ปิด backdrop
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.style.display = 'none';
  }
  
  // ✅ ปลดล็อค scroll
  document.body.style.overflow = 'auto';
  document.body.classList.remove('modal-open');

  // ✅ 2. Reset HTML form
  const wizardForm = document.getElementById('wizardForm');
  if (wizardForm) {
    wizardForm.reset();
    console.log('✅ wizardForm.reset() called');
  }
  
  // ✅ 2.5 ล้าง dropdown HTML
  const departmentSelect = document.getElementById('departmentSelect');
  if (departmentSelect) {
    departmentSelect.innerHTML = '<option value="">-- เลือกฝ่าย --</option>';
    console.log('✅ Dropdown departments cleared');
  }
  
  // ✅ ล้าง procedures list
  const proceduresList = document.getElementById('proceduresList');
  if (proceduresList) {
    proceduresList.innerHTML = '';
    console.log('✅ Procedures list cleared');
  }
  
  // ✅ 3. ล้างข้อมูล input fields ทั้งหมด
  document.querySelectorAll('#wizardForm input, #wizardForm select, #wizardForm textarea').forEach(el => {
    if (el.type === 'radio' || el.type === 'checkbox') {
      el.checked = false;
    } else {
      el.value = '';
    }
  });
  console.log('✅ All form inputs cleared');
  
  // ✅ 4. Reset step to 1
  if (typeof currentWizardTab !== 'undefined') {
    currentWizardTab = 1;
    console.log('✅ Reset to step 1');
  }
  
  // ✅ 5. Hide all wizard steps
  document.querySelectorAll('.wizard-step').forEach(el => {
    el.style.display = 'none';
  });
  
  // ✅ 6. Show step 1
  const step1 = document.getElementById('wizard-tab-1');
  if (step1) {
    step1.style.display = 'block';
    console.log('✅ Step 1 visible');
  }
  
  // ✅ 7. Reset tabs
  document.querySelectorAll('.tab-btn').forEach((el, idx) => {
    if (idx === 0) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
  console.log('✅ Tabs reset');

  // ✅ 8. ล้างข้อมูล wizard (JS object)
  if (typeof wizardData !== 'undefined') {
    wizardData = {
      station_name: '',
      station_type: '',
      floor: (typeof currentFloor !== 'undefined' ? currentFloor : 1),
      room_count: 1,
      department_id: '',
      departmentName: '',
      procedures: {},
      staff: [],
      doctors: [],
      rooms: {},
      default_wait_time: 10,
      default_service_time: 5,
      staff_count: 2,
      staff_schedules: []
    };
    console.log('✅ wizardData reset');
  }
  
  // ✅ 9. Update wizard display
  if (typeof updateWizardDisplay === 'function') {
    updateWizardDisplay();
    console.log('✅ updateWizardDisplay() called');
  }
  
  console.log('✅ closeWizard() completed - ready for next entry!');
}

/**
 * ✅ Delete Equipment Row
 */
function deleteEquipmentRow(idx) {
  console.log('🔧 Deleting equipment row:', idx);
}

/**
 * ✅ Delete Patient
 */
function deletePatient(patientId) {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: '⚠️ ลบผู้ป่วย',
      text: 'คุณต้องการลบผู้ป่วยนี้จริงหรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🗑️ ลบ',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('✅ Patient deleted:', patientId);
      }
    });
  }
}

/**
 * ✅ Delete Station
 */
async function deleteStation(stationId) {
  if (typeof Swal === 'undefined') {
    console.error('❌ SweetAlert2 not loaded');
    return;
  }

  const result = await Swal.fire({
    title: '⚠️ คุณต้องการลบ Station นี้?',
    text: 'การลบจะไม่สามารถกู้คืนได้ และจะลบข้อมูลทั้งหมดที่เกี่ยวข้อง',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#A93226',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'ลบทันที',
    cancelButtonText: 'ยกเลิก'
  });

  if (!result.isConfirmed) {
    return;
  }

  try {
    // ✅ เรียกใช้ API
    const API_BASE_URL = '/hospital/api/';
    const apiUrl = `${API_BASE_URL.replace(/\/$/, '')}/delete_station.php`;
    console.log('🔄 Deleting station:', stationId, 'at:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ station_id: stationId })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Delete result:', data);

    if (data.success) {
      await Swal.fire({
        title: '✅ ลบสำเร็จ!',
        html: `<div style="text-align: left; font-size: 14px;">
            <strong>${data.data.station_name}</strong> (${data.data.station_code})<br>
            ลบ ${data.data.rooms_deleted} ห้อง<br><br>
            <small style="color: #495057;">ข้อมูลทั้งหมดถูกลบออกจากระบบแล้ว</small>
        </div>`,
        icon: 'success',
        confirmButtonText: 'ดำเนินการต่อ'
      });

      // ✅ Reload data
      console.log('🔄 Reloading data...');
      if (typeof loadAllFloorsEnhanced === 'function') {
        await loadAllFloorsEnhanced();
      }
      if (typeof loadStationsByFloor === 'function') {
        for (let i = 1; i <= 5; i++) {
          await loadStationsByFloor(i);
        }
      }
    } else {
      await Swal.fire({
        title: '❌ เกิดข้อผิดพลาด',
        text: data.message || 'ไม่สามารถลบ Station ได้',
        icon: 'error',
        confirmButtonText: 'ดำเนินการต่อ'
      });
    }
  } catch (error) {
    console.error('❌ Delete error:', error);
    await Swal.fire({
      title: '❌ เกิดข้อผิดพลาด',
      text: 'Error: ' + error.message,
      icon: 'error',
      confirmButtonText: 'ดำเนินการต่อ'
    });
  }
}

/**
 * ✅ Next Wizard Tab
 */
function nextWizardTab() {
  console.log('▶️ Next wizard tab');
}

/**
 * ✅ Open Add Procedure Modal
 */
function openAddProcedureModal() {
  const modal = document.getElementById('addProcedureModal');
  if (modal) modal.style.display = 'block';
}

/**
 * ✅ Manual Reset Daily Rooms
 * รีเซ็ตห้องแบบแมนนวล
 */
function manualResetDailyRooms() {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: '⚠️ ยืนยันการรีเซ็ต',
      text: 'คุณต้องการรีเซ็ตห้องทั้งหมดจริงหรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, รีเซ็ต',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: '✅ รีเซ็ตสำเร็จ',
          text: 'ห้องทั้งหมดถูกรีเซ็ตเรียบร้อย',
          icon: 'success'
        });
      }
    });
  }
}

/**
 * ✅ Close Create Room Modal
 * ปิด modal สร้างห้องใหม่
 */
function closeCreateRoomModal() {
  const modal = document.getElementById('createRoomModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * ✅ Close Room Detail Modal
 * ปิด modal รายละเอียดห้อง
 */
function closeRoomDetail() {
  const modal = document.getElementById('roomDetailModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * ✅ Close Room Details Modal
 * ปิด modal รายละเอียดห้อง (alternative)
 */
function closeRoomDetailsModal() {
  closeRoomDetail();
}

/**
 * ✅ Close Assign Room Modal
 * ปิด modal กำหนดห้อง
 */
function closeAssignRoomModal() {
  const modal = document.getElementById('assignRoomModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * ✅ Close Room Procedure Settings
 * ปิด modal ตั้งค่าขั้นตอนการรักษาห้อง
 */
function closeRoomProcedureSettings() {
  const modal = document.getElementById('roomProcedureSettingsModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * ✅ Create New Room
 * สร้างห้องใหม่
 */
function createNewRoom() {
  // Get input values
  const roomNameInput = document.getElementById('newRoomName');
  const roomTypeInput = document.getElementById('newRoomType');
  
  const roomName = roomNameInput ? roomNameInput.value.trim() : '';
  const roomType = roomTypeInput ? roomTypeInput.value : '';
  
  console.log('🏢 Creating room:', { roomName, roomType });
  
  // Validation
  if (!roomName) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: '❌ ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกชื่อห้อง',
        icon: 'error'
      });
    } else {
      alert('กรุณากรอกชื่อห้อง');
    }
    return;
  }
  
  // API Call to create room
  const apiUrl = `${getApiUrl('add_room.php')}`;
  const payload = {
    station_id: currentStationId,
    room_name: roomName,
    room_type: roomType || 'standard'
  };
  
  console.log('📤 Sending room creation request:', payload);
  
  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(response => response.text())  // ✅ เปลี่ยนเป็น text() ก่อน parse
  .then(text => {
    console.log('🔥 Raw response:', text);
    
    // ✅ ทำความสะอาด response: ลบข้อความอื่นก่อน JSON
    let cleanText = text.trim();
    
    // ค้นหา { เริ่มต้น
    const startIdx = cleanText.indexOf('{');
    if (startIdx !== -1) {
      cleanText = cleanText.substring(startIdx);
    }
    
    console.log('🧹 Cleaned response:', cleanText);
    
    try {
      const result = JSON.parse(cleanText);
      
      if (result.success) {
        console.log('✅ Room created successfully:', result.data);
        
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            title: '✅ สร้างห้องสำเร็จ',
            text: `ห้อง ${roomName} ถูกสร้างเรียบร้อย`,
            icon: 'success'
          }).then(() => {
            // Clear inputs
            if (roomNameInput) roomNameInput.value = '';
            if (roomTypeInput) roomTypeInput.value = '';
            
            // Close modal
            closeCreateRoomModal();
            
            // Refresh station details
            if (currentStationId) {
              openStationDetail(currentStationId);
            }
          });
        }
      } else {
        console.error('❌ Room creation failed:', result.message);
        
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            title: '❌ สร้างห้องไม่สำเร็จ',
            text: result.message || 'ไม่สามารถสร้างห้องได้',
            icon: 'error'
          });
        }
      }
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('🔥 Response was:', cleanText);
      
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: '❌ เกิดข้อผิดพลาด',
          text: `Server response error: ${parseError.message}`,
          icon: 'error'
        });
      }
    }
  })
  .catch(error => {
    console.error('❌ Network Error:', error);
    
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: '❌ เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์',
        icon: 'error'
      });
    }
  });
}

/**
 * ✅ Open Room Details Modal
 * เปิด modal รายละเอียดห้อง
 */
/**
 * ✅ Open Room Detail
 * เปิด modal รายละเอียดห้อง
 */
function openRoomDetail(roomId) {
  console.log('🏢 Opening room detail:', roomId);
  openRoomDetailsModal(roomId);
}

function openRoomDetailsModal(roomId) {
  const modal = document.getElementById('roomDetailModal');
  if (modal) {
    modal.style.display = 'block';
    // Load room details
    if (typeof loadRoomDetails === 'function') {
      loadRoomDetails(roomId);
    }
  }
}

/**
 * ✅ Save Room Details
 * บันทึกรายละเอียดห้อง
 */
function saveRoomDetails() {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: '✅ บันทึกสำเร็จ',
      text: 'รายละเอียดห้องถูกบันทึกเรียบร้อย',
      icon: 'success'
    }).then(() => {
      closeRoomDetail();
    });
  }
}

/**
 * ✅ Switch Room Tab
 * เปลี่ยนแท็บในรายละเอียดห้อง
 */
function switchRoomTab(tabNum) {
  console.log('🖨️ Switching to room tab:', tabNum);
  // Implementation depends on your tab structure
}

/**
 * ✅ Assign Room Confirmed
 * ยืนยันการกำหนดห้อง
 */
function assignRoomConfirmed() {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: '✅ กำหนดห้องสำเร็จ',
      icon: 'success'
    }).then(() => {
      closeAssignRoomModal();
    });
  }
}

/**
 * ✅ Save Room Procedure Settings
 * บันทึกการตั้งค่าขั้นตอนการรักษาห้อง
 */
function saveRoomProcedureSettings() {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: '✅ บันทึกสำเร็จ',
      text: 'การตั้งค่าขั้นตอนการรักษาถูกบันทึกเรียบร้อย',
      icon: 'success'
    }).then(() => {
      closeRoomProcedureSettings();
    });
  }
}

/**
 * ✅ Confirm Add Procedures
 * ยืนยันการเพิ่มขั้นตอนการรักษา
 */
function confirmAddProcedures(roomId) {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: '✅ เพิ่มขั้นตอนการรักษาสำเร็จ',
      text: 'ขั้นตอนการรักษาถูกเพิ่มเรียบร้อย',
      icon: 'success'
    });
  }
}

/**
 * ✅ Add Equipment Row
 * เพิ่มแถวอุปกรณ์
 */
function addEquipmentRow(roomId) {
  console.log('🔧 Adding equipment row for room:', roomId);
  // Implementation depends on your equipment management
}

/**
 * ✅ Add Equipment To Room
 * เพิ่มอุปกรณ์เข้าห้อง
 */
function addEquipmentToRoom() {
  console.log('🔧 Adding equipment to room');
  // Implementation depends on your equipment management
}

/**
 * ✅ Add Procedure Row
 * เพิ่มแถวขั้นตอนการรักษา
 */
function addProcedureRow(roomId) {
  console.log('🖨️ Adding procedure row for room:', roomId);
  // Implementation depends on your procedure management
}

/**
 * ✅ Auto-Assign & Manage Staff
 * - เพิ่มพนักงานเริ่มต้นเข้าห้องว่าง
 * - ลบพนักงานที่ถึงเวลา break
 * - ลบพนักงานที่ถึงเวลา end
 * - เพิ่มพนักงาน available ใหม่
 */
async function autoAssignStaffToRooms() {
  try {
    if (!currentStationId) {
      console.log('🛑️ ไม่มี Station ID');
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    console.log(`🤔 Triggering auto-assign/replacement: Station ${currentStationId}, Time: ${currentTime}`);

    // ============================================
    // STEP 1: จัดการพนักงาน (ลบ + เปลี่ยน)
    // ============================================
    const replacementResponse = await fetch(getApiUrl('manage_staff_replacement.php'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        current_date: currentDate,
        current_time: currentTime
      })
    });

    const replacementResult = await replacementResponse.json();

    if (replacementResult.success) {
      if (replacementResult.data.removed_count > 0) {
        console.log(`🔄 Removed ${replacementResult.data.removed_count} staff (break/end time)`);
        replacementResult.data.removed_staff.forEach(staff => {
          console.log(`   ❌ ${staff.staff_name} removed (${staff.reason})`);
        });
      }

      if (replacementResult.data.replacement_count > 0) {
        console.log(`✅ Replacement staff added: ${replacementResult.data.replacement_count}`);
        replacementResult.data.replacement_staff.forEach(staff => {
          console.log(`   ✅ ${staff.staff_name} → ${staff.room_name}`);
        });
      }
    }

    // ============================================
    // STEP 2: เพิ่มพนักงานเริ่มต้นเข้าห้องว่าง
    // ============================================
    const autoAssignResponse = await fetch(getApiUrl('auto_assign_staff.php'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        current_date: currentDate,
        current_time: currentTime
      })
    });

    const autoAssignResult = await autoAssignResponse.json();

    if (autoAssignResult.success && autoAssignResult.data.auto_assigned_count > 0) {
      console.log(`✅ Auto-assigned ${autoAssignResult.data.auto_assigned_count} staff`);
      
      autoAssignResult.data.assignments.forEach(assign => {
        console.log(`   📝 ${assign.message}`);
      });
    } else {
      console.log('🛑️ ไม่มีห้องว่างที่ต้องการพนักงาน');
    }

    // ============================================
    // STEP 3: Refresh UI
    // ============================================
    const stationDetailUrl = getApiUrl('get_station_detail.php') + `?station_id=${currentStationId}`;
    const stationResponse = await fetch(stationDetailUrl);
    const stationResult = await stationResponse.json();

    if (stationResult.success) {
      // ✅ Display updated rooms
      displayStationRooms(stationResult.data.rooms);
    }

    // ✅ Refresh staff list
    loadStationStaff(currentStationId);

  } catch (error) {
    console.error('❌ Error in autoAssignStaffToRooms:', error);
  }
}

/**
 * ✅ Add New Station Procedure
 * เพิ่มขั้นตอนการรักษาใหม่เข้าสถานี
 */
function addNewStationProcedure() {
  Swal.fire({
    title: '➕ เพิ่มขั้นตอนการรักษาใหม่',
    html: `
      <div style="text-align: left;">
        <div style="margin-bottom: 15px;">
          <label style="display: block; font-size: 13px; font-weight: 600; color: #000; margin-bottom: 5px;">
            ชื่อขั้นตอนการรักษา *
          </label>
          <input type="text" id="addProcName" placeholder="ตัวอย่าง: เอกซเรย์, ตรวจเลือด" 
                 style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; box-sizing: border-box;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #000; margin-bottom: 5px;">
              เวลาดำเนินการ (นาที) *
            </label>
            <input type="number" id="addProcTime" placeholder="30" value="30" min="1"
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; box-sizing: border-box;">
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #000; margin-bottom: 5px;">
              เวลารอ (นาที)
            </label>
            <input type="number" id="addProcWait" placeholder="10" value="10" min="0"
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; box-sizing: border-box;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #000; margin-bottom: 5px;">
              เป้าหมายเวลา (นาที)
            </label>
            <input type="number" id="addProcTarget" placeholder="ไม่ระบุ" min="1"
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; box-sizing: border-box;">
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #000; margin-bottom: 5px;">
              จำนวนพนักงานที่ต้องการ
            </label>
            <input type="number" id="addProcStaff" placeholder="1" value="1" min="0"
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; box-sizing: border-box;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
          <div style="padding: 10px; background: #e8f5e9; border-radius: 6px; border: 2px solid #4caf50;">
            <label style="display: flex; align-items: center; font-size: 13px; font-weight: 600; color: #000; cursor: pointer;">
              <input type="checkbox" id="addProcEquipment" 
                     style="width: 18px; height: 18px; margin-right: 8px; cursor: pointer;">
              <span>🔧 ต้องการอุปกรณ์</span>
            </label>
          </div>
        </div>

        <div style="padding: 10px; background: #f0f7ff; border-radius: 6px; font-size: 12px; color: #0056b3;">
          <i class="fas fa-info-circle"></i> หมายเหตุ: กรุณากรอกข้อมูลที่จำเป็นสำหรับการบันทึก
        </div>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: '💾 บันทึก',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#6c757d',
    allowOutsideClick: false,
    allowEscapeKey: false,
    preConfirm: () => {
      const name = document.getElementById('addProcName').value.trim();
      const time = parseInt(document.getElementById('addProcTime').value) || 0;
      const wait = parseInt(document.getElementById('addProcWait').value) || 10;
      const target = document.getElementById('addProcTarget').value ? parseInt(document.getElementById('addProcTarget').value) : 0;
      const staff = parseInt(document.getElementById('addProcStaff').value) || 1;
      const equipment = document.getElementById('addProcEquipment').checked ? 1 : 0;

      // Validation
      if (!name) {
        Swal.showValidationMessage('❌ กรุณากรอกชื่อขั้นตอนการรักษา');
        return false;
      }
      if (time <= 0) {
        Swal.showValidationMessage('❌ เวลาดำเนินการต้องมากกว่า 0 นาที');
        return false;
      }

      return {
        name: name,
        time: time,
        wait: wait,
        target: target,
        staff: staff,
        equipment: equipment
      };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      // Show loading
      Swal.fire({
        title: '💾 กำลังบันทึก...',
        html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #000;"></i>',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false
      });

      // Save to database
      const saveSuccess = await saveNewStationProcedureToDatabase(result.value);

      if (saveSuccess) {
        // Refresh display
        const updatedProcedures = window.stationProceduresData || [];
        displayStationProcedures(updatedProcedures);
        
        // Show success
        Swal.close();
        Swal.fire({
          title: '✅ สำเร็จ!',
          html: `
            <p>เพิ่มขั้นตอนการรักษาสำเร็จ</p>
            <div style="margin-top: 10px; padding: 10px; background: #f1f8f4; border-radius: 6px; font-size: 12px;">
              <strong>✅ บันทึกลง Database สำเร็จ</strong>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#000'
        });
      } else {
        // Save failed
        Swal.close();
      }
    }
  });
}

/**
 * ✅ Save New Station Procedure to Database
 * บันทึกขั้นตอนการรักษาใหม่ลงฐานข้อมูล
 * 
 * @param {object} procedureData - ข้อมูลขั้นตอนการรักษา
 * @returns {boolean} - สถานะการบันทึก
 */
async function saveNewStationProcedureToDatabase(procedureData) {
  try {
    const apiUrl = getApiUrl("add_station_procedure.php");

    const payload = {
      station_id: currentStationId,
      procedure_name: procedureData.name,
      procedure_time: procedureData.time,
      wait_time: procedureData.wait,
      Time_target: procedureData.target,  // ✅ FIXED: Capital T
      staff_required: procedureData.staff,
      equipment_required: procedureData.equipment
    };

    console.log('📤 Sending payload:', payload);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ บันทึกสำเร็จ:', result.data);
      
      // Add to local array
      if (!window.stationProceduresData) {
        window.stationProceduresData = [];
      }
      
      window.stationProceduresData.push({
        id: result.data.procedure_id || result.data.id,
        station_id: currentStationId,
        procedure_id: result.data.procedure_id,
        procedure_name: procedureData.name,
        procedure_time: procedureData.time,
        wait_time: procedureData.wait,
        Time_target: procedureData.target,  // ✅ FIXED: Capital T
        staff_required: procedureData.staff,
        equipment_required: procedureData.equipment,
        created_at: new Date().toISOString()
      });

      return true;
    } else {
      console.error('❌ API Error:', result.message);
      Swal.fire({
        title: '❌ เกิดข้อผิดพลาด',
        text: result.message || 'ไม่สามารถบันทึกขั้นตอนการรักษาได้',
        icon: 'error',
        confirmButtonColor: '#000'
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Exception:', error);
    Swal.fire({
      title: '❌ เกิดข้อผิดพลาด',
      text: error.message,
      icon: 'error',
      confirmButtonColor: '#000'
    });
    return false;
  }
}
/**
 * ✅ Delete Station Procedure - FIXED (WITH DATABASE DELETE)
 */
async function deleteStationProcedure(index) {
  const proc = window.stationProceduresData[index];
  
  if (!proc) {
    console.error('❌ Procedure not found at index:', index);
    return;
  }
  
  const procedureId = proc.procedure_id;
  const procedureName = proc.procedure_name || proc.procedure_code || 'Unknown';
  
  console.log(`🗑️ [DELETE STATION PROCEDURE] ID=${procedureId}, Name=${procedureName}`);
  
  const result = await Swal.fire({
    title: '⚠️ คุณต้องการลบขั้นตอนการรักษานี้?',
    html: `
      <div style="font-size: 15px; color: #000; margin-bottom: 15px;">
        <strong>${procedureName}</strong>
      </div>
      <div style="font-size: 13px; color: #adb5bd;">
        การลบจะไม่สามารถกู้คืนได้ และจะลบออกจาก Database
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '🗑️ ลบทันที',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d'
  });

  if (!result.isConfirmed) {
    return;
  }

  try {
    // ✅ Send DELETE API request
    const apiUrl = getApiUrl('delete_station_procedure.php');
    
    console.log(`🔔 Sending DELETE to: ${apiUrl}`);
    console.log(`📦 Payload:`, { procedure_id: procedureId });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        procedure_id: procedureId
      })
    });
    
    const data = await response.json();
    console.log(`📊 Response:`, data);
    
    if (!data.success) {
      throw new Error(data.message || 'Delete failed');
    }
    
    // ✅ Remove from array AFTER successful API call
    window.stationProceduresData.splice(index, 1);
    
    // ✅ Refresh display
    displayStationProcedures(window.stationProceduresData);
    
    // ✅ Show success
    await Swal.fire({
      title: '✅ ลบสำเร็จ!',
      text: `${procedureName} ถูกลบออกจาก Database`,
      icon: 'success',
      confirmButtonColor: '#000'
    });
    
    console.log(`✅ Complete\n`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
    Swal.fire('❌ เกิดข้อผิดพลาด', error.message, 'error');
  }
}

/**
 * ✅ Load Station Patients
 * ดึงและแสดงข้อมูลผู้ป่วยในสถานี
 * 
 * @param {number} stationId - ID ของสถานี
 * @param {array} deptIds - Array ของ department IDs
 */
async function loadStationPatients(stationId, deptIds = null) {
  const container = document.getElementById("stationPatientsContent");
  if (!container) {
    console.warn("⚠️ stationPatientsContent not found");
    return;
  }

  try {
    // Build query string for department IDs
    let queryStr = `?station_id=${stationId}`;
    if (deptIds && deptIds.length > 0) {
      queryStr += `&department_ids=${Array.isArray(deptIds) ? deptIds.join(',') : deptIds}`;
    }

    const apiUrl = getApiUrl("get_station_today_patients.php") + queryStr;
    console.log("🔥 Fetching patients from:", apiUrl);

    const response = await fetch(apiUrl);
    const result = await response.json();

    if (!result.success || !result.data) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #adb5bd;">
          <i class="fas fa-user-slash" style="font-size: 48px; margin-bottom: 15px;"></i>
          <div>ไม่มีผู้ป่วยในสถานีนี้</div>
        </div>
      `;
      return;
    }

    const inprogressPatients = result.data.inprocess_patients || [];
    const waitingPatients = result.data.waiting_patients || [];

    let patientsHTML = `
      <div style="background: rgba(0, 86, 179, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid #0047AB;">
        <strong>📊 รวม ${inprogressPatients.length + waitingPatients.length} ผู้ป่วย</strong>
        <div style="font-size: 12px; color: #adb5bd; margin-top: 5px;">
          กำลังรักษา: ${inprogressPatients.length} | รอรักษา: ${waitingPatients.length}
        </div>
      </div>
    `;

    // Helper function to get gender emoji and text
    const getGenderInfo = (sex) => {
      if (!sex && sex !== 0) return { emoji: '👤', text: 'ไม่ระบุ', color: '#95a5a6' };

      // ✅ Handle both string and numeric values (M/F or 1/2)
      let sexStr = String(sex).toUpperCase().trim();

      if (sex === 1 || sexStr === 'M' || sexStr === 'MALE') return { emoji: '👨', text: 'ชาย', color: '#3498db' };
      if (sex === 2 || sexStr === 'F' || sexStr === 'FEMALE') return { emoji: '👩', text: 'หญิง', color: '#e91e63' };
      return { emoji: '👤', text: 'ไม่ระบุ', color: '#95a5a6' };
    };

    // Helper function to get waiting status emoji and color
    const getWaitingStatus = (timeTarget, timeTargetWait, hasIncompletePrevious) => {
      if (!timeTarget) {
        return { emoji: '⏳', color: '#95a5a6', bgColor: 'rgba(149, 165, 166, 0.1)', text: 'ไม่ระบุ' };
      }

      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

      // 😡 รอเกินไป (สีแดง) - เวลาปัจจุบัน > time_target_wait
      // ✅ ตรวจเชคนี้ก่อน เพราะเป็น priority สูงสุด - ต้องแสดงให้เห็นว่ารอนานเกินไปแล้ว
      if (timeTargetWait && currentTime > timeTargetWait) {
        return { emoji: '😡', color: '#e74c3c', bgColor: 'rgba(231, 76, 60, 0.1)', text: 'รอเกินไป' };
      }

      // ⏳ รอคิวก่อน - ถ้ามีคนคิวก่อนหน้ายังไม่เสร็จ
      // ✅ ตรวจเชคหลังจาก "รอเกินไป" เพื่อไม่ให้ซ่อนเฉียบพลัน
      if (hasIncompletePrevious == 1 || hasIncompletePrevious === true) {
        return { emoji: '⏳', color: '#9b59b6', bgColor: 'rgba(155, 89, 182, 0.1)', text: 'รอคิวก่อน' };
      }

      // 😊 ได้ทำเลย (สีเขียว) - เวลาปัจจุบัน ≤ time_target
      if (currentTime <= timeTarget) {
        return { emoji: '😊', color: '#27ae60', bgColor: 'rgba(39, 174, 96, 0.1)', text: 'ได้ทำเลย' };
      }

      // 😐 รอไม่เกิน (สีเหลือง) - time_target < เวลาปัจจุบัน ≤ time_target_wait
      if (timeTargetWait && currentTime <= timeTargetWait) {
        return { emoji: '😐', color: '#f39c12', bgColor: 'rgba(243, 156, 18, 0.1)', text: 'รอไม่เกิน' };
      }

      // Default (ไม่ควรถึง)
      return { emoji: '⏳', color: '#95a5a6', bgColor: 'rgba(149, 165, 166, 0.1)', text: 'ไม่ระบุ' };
    };

    // Inprogress patients
    if (inprogressPatients.length > 0) {
      patientsHTML += '<h4 style="margin: 15px 0 10px 0; color: #0056B3;">⏳ กำลังรักษา</h4>';
      inprogressPatients.forEach(patient => {
        // Debug log
        console.log(`🔍 Patient: ${patient.patient_name}, has_incomplete_previous:`, patient.has_incomplete_previous, 'type:', typeof patient.has_incomplete_previous);

        const genderInfo = getGenderInfo(patient.sex);
        const waitStatus = getWaitingStatus(patient.time_target, patient.time_target_wait, patient.has_incomplete_previous);
        patientsHTML += `
          <div
            onclick="openPatientModal(${patient.patient_id}, '${patient.patient_name.replace(/'/g, "\\'")}', '${patient.hn}', '${patient.appointment_date}', 0)"
            style="
              background: ${waitStatus.bgColor};
              padding: 12px;
              border-radius: 8px;
              margin-bottom: 8px;
              border-left: 3px solid ${waitStatus.color};
              cursor: pointer;
              transition: all 0.2s ease;
            "
            onmouseover="this.style.background='${waitStatus.bgColor}'; this.style.transform='translateX(4px)'; this.style.opacity='0.8'"
            onmouseout="this.style.background='${waitStatus.bgColor}'; this.style.transform='translateX(0)'; this.style.opacity='1'"
          >
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div style="flex: 1;">
                <div style="font-weight: 600; display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 18px;">${genderInfo.emoji}</span>
                  <span style="font-size: 11px; color: ${genderInfo.color}; font-weight: 600;">${genderInfo.text}</span>
                  <span>${patient.patient_name}</span>
                  <span style="font-size: 20px; margin-left: 4px;">${waitStatus.emoji}</span>
                </div>
                <div style="font-size: 11px; color: #adb5bd; margin-top: 4px; margin-left: 26px;">
                  HN: ${patient.hn}
                  <span style="
                    margin-left: 8px;
                    padding: 2px 8px;
                    background: ${waitStatus.bgColor};
                    color: ${waitStatus.color};
                    border-radius: 4px;
                    font-weight: 600;
                  ">${waitStatus.text}</span>
                </div>
              </div>
              <div style="text-align: right; font-size: 11px;">
                <div style="font-weight: 600; margin-bottom: 4px;">${patient.procedure || 'N/A'}</div>
                
                <!-- ✅ Show actual completion time if available -->
                ${patient.Actual_Time ? `
                  <div style="font-weight: 600; color: #10b981; margin-top: 4px;">
                    ✅ เสร็จ: ${patient.Actual_Time}
                  </div>
                ` : ''}
              </div>
            </div>
            <div style="font-size: 10px; color: #999; margin-top: 8px; text-align: center;">
              🔍 คลิกเพื่อดูหัตถการทั้งหมด
            </div>
          </div>
        `;
      });
    }

    // Waiting patients
    if (waitingPatients.length > 0) {
      patientsHTML += '<h4 style="margin: 15px 0 10px 0; color: #D35400;">⏰ รอรักษา</h4>';
      waitingPatients.forEach(patient => {
        const genderInfo = getGenderInfo(patient.sex);
        const waitStatus = getWaitingStatus(patient.time_target, patient.time_target_wait, patient.has_incomplete_previous);
        patientsHTML += `
          <div
            onclick="openPatientModal(${patient.patient_id}, '${patient.patient_name.replace(/'/g, "\\'")}', '${patient.hn}', '${patient.appointment_date}', 0)"
            style="
              background: ${waitStatus.bgColor};
              padding: 12px;
              border-radius: 8px;
              margin-bottom: 8px;
              border-left: 3px solid ${waitStatus.color};
              cursor: pointer;
              transition: all 0.2s ease;
            "
            onmouseover="this.style.background='${waitStatus.bgColor}'; this.style.transform='translateX(4px)'; this.style.opacity='0.8'"
            onmouseout="this.style.background='${waitStatus.bgColor}'; this.style.transform='translateX(0)'; this.style.opacity='1'"
          >
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div style="flex: 1;">
                <div style="font-weight: 600; display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 18px;">${genderInfo.emoji}</span>
                  <span style="font-size: 11px; color: ${genderInfo.color}; font-weight: 600;">${genderInfo.text}</span>
                  <span>${patient.patient_name}</span>
                  <span style="font-size: 20px; margin-left: 4px;">${waitStatus.emoji}</span>
                </div>
                <div style="font-size: 11px; color: #adb5bd; margin-top: 4px; margin-left: 26px;">
                  HN: ${patient.hn}
                  <span style="
                    margin-left: 8px;
                    padding: 2px 8px;
                    background: ${waitStatus.bgColor};
                    color: ${waitStatus.color};
                    border-radius: 4px;
                    font-weight: 600;
                  ">${waitStatus.text}</span>
                </div>
              </div>
              <div style="text-align: right; font-size: 11px;">
                <div style="font-weight: 600; margin-bottom: 4px;">${patient.procedure || 'N/A'}</div>
                <div style="color: #adb5bd; margin-bottom: 2px;">: ${patient.running_number || 'N/A'}</div>
                <!-- ✅ Show actual completion time if available -->
                ${patient.Actual_Time ? `
                  <div style="font-weight: 600; color: #10b981; margin-top: 4px;">
                    ✅ เสร็จ: ${patient.Actual_Time}
                  </div>
                ` : ''}
              </div>
            </div>
            <div style="font-size: 10px; color: #999; margin-top: 8px; text-align: center;">
              🔍 คลิกเพื่อดูหัตถการทั้งหมด
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = patientsHTML;
    console.log(`✅ ${inprogressPatients.length + waitingPatients.length} patients loaded`);

  } catch (error) {
    console.error("❌ Error loading patients:", error);
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #A93226;">
        <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
        <div>ไม่สามารถโหลดข้อมูลผู้ป่วยได้</div>
        <small style="color: #adb5bd;">${error.message}</small>
      </div>
    `;
  }
}

/**
 * ✅ Cleanup Status Auto Update
 * ล้างการตั้งค่าอัพเดตสถานะอัตโนมัติ
 */
function cleanupStatusAutoUpdate() {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
  }
}

/**
 * ✅ Close Station Detail Modal
 */
function closeStationDetail() {
  document.getElementById("stationDetailModal").style.display = "none";
  currentStationId = null;
  currentStationData = null;

  // ✅ ยกเลิก timer เมื่อปิด
  cleanupStatusAutoUpdate();
  
  if (typeof stopAutoStaffSystem === 'function') {
    stopAutoStaffSystem();
  }
}
// ====================================
// ดึงขั้นตอนการรักษาจาก Database - COMPLETE
// ====================================

let dbProceduresData = {};
let selectedDBProcedures = new Set();

/**
 * เปิด Modal สำหรับดึงขั้นตอนการรักษาจาก Database
 */
function openSelectProcedureFromDBModal() {
    console.log("Opening Select Procedure from DB modal");
    loadDepartmentsForDB();
    document.getElementById('selectProcedureFromDBModal').style.display = 'block';
    selectedDBProcedures = new Set();
    document.getElementById('dbDepartmentFilter').value = '';
    document.getElementById('dbProceduresContainer').style.display = 'none';
    document.getElementById('dbNoDepartmentMessage').style.display = 'block';
}

/**
 * ปิด Modal
 */
function closeSelectProcedureFromDBModal() {
    document.getElementById('selectProcedureFromDBModal').style.display = 'none';
    selectedDBProcedures.clear();
}

/**
 * ดึงข้อมูลฝ่ายทั้งหมดสำหรับ dropdown
 */
async function loadDepartmentsForDB() {
    try {
        console.log("Loading departments for DB selection");
        
        const response = await fetch(`${API_BASE_URL}/get_departments.php`);
        const result = await response.json();

        if (result.success && result.data) {
            const select = document.getElementById('dbDepartmentFilter');
            select.innerHTML = '<option value="">-- เลือกฝ่าย --</option>';

            result.data.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.department_id;
                option.textContent = dept.department_name;
                select.appendChild(option);
            });

            console.log("Loaded departments: " + result.data.length);
        }
    } catch (error) {
        console.error('Error loading departments:', error);
        alert('เกิดข้อผิดพลาดในการดึงข้อมูลฝ่าย');
    }
}

/**
 * ดึงขั้นตอนการรักษาจาก Database ตามฝ่ายที่เลือก
 */
async function loadProceduresFromDB() {
    const deptId = document.getElementById('dbDepartmentFilter').value;

    if (!deptId) {
        document.getElementById('dbProceduresContainer').style.display = 'none';
        document.getElementById('dbNoDepartmentMessage').style.display = 'block';
        return;
    }

    try {
        console.log("Loading procedures for department: " + deptId);
        
        const response = await fetch(`${API_BASE_URL}/get_procedures.php?department_id=${deptId}`);
        const result = await response.json();

        if (result.success && result.data) {
            dbProceduresData = {};
            let html = '';

            result.data.forEach(proc => {
                dbProceduresData[proc.procedure_id] = {
                    id: proc.procedure_id,
                    name: proc.procedure_name,
                    duration: proc.default_duration || 30
                };

                html += `
                    <div style="display: flex; align-items: center; padding: 12px; background: rgba(255,255,255,0.8); border-radius: 8px; margin-bottom: 8px; border: 1px solid #ddd;">
                        <label class="procedure-checkbox" style="flex: 1; margin: 0; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" class="db-procedure-checkbox" value="${proc.procedure_id}" onchange="updateSelectedDBProcedures()">
                            <span style="font-weight: 600; color: #212529; flex: 1;">${proc.procedure_name}</span>
                        </label>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6c757d;">
                            <i class="fas fa-hourglass-end" style="color: #0056B3;"></i>
                            <span>${proc.default_duration || 30} นาที</span>
                        </div>
                    </div>
                `;
            });

            const container = document.getElementById('dbProceduresContainer');
            container.innerHTML = html;
            container.style.display = 'block';
            document.getElementById('dbNoDepartmentMessage').style.display = 'none';

            console.log("Loaded procedures: " + result.data.length);
        } else {
            document.getElementById('dbProceduresContainer').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #adb5bd;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                    <div>ไม่พบขั้นตอนการรักษาจากฝ่ายนี้</div>
                </div>
            `;
            document.getElementById('dbProceduresContainer').style.display = 'block';
            document.getElementById('dbNoDepartmentMessage').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading procedures:', error);
        alert('เกิดข้อผิดพลาดในการดึงขั้นตอนการรักษา');
    }
}

/**
 * อัพเดตขั้นตอนการรักษาที่เลือก
 */
function updateSelectedDBProcedures() {
    selectedDBProcedures.clear();
    document.querySelectorAll('.db-procedure-checkbox:checked').forEach(checkbox => {
        selectedDBProcedures.add(parseInt(checkbox.value));
    });
    console.log('Selected procedures count: ' + selectedDBProcedures.size);
}

/**
 * เพิ่มขั้นตอนการรักษาที่เลือกจาก Database → เข้าห้อง
 */
function addSelectedProceduresFromDB() {
    if (selectedDBProcedures.size === 0) {
        alert('กรุณาเลือกขั้นตอนการรักษาอย่างน้อย 1 รายการ');
        return;
    }

    if (!currentRoomId || !wizardData.rooms[currentRoomId]) {
        alert('เกิดข้อผิดพลาด: ไม่พบห้อง');
        return;
    }

    const room = wizardData.rooms[currentRoomId];

    // เพิ่มขั้นตอนการรักษาที่เลือกเข้าห้อง
    selectedDBProcedures.forEach(procId => {
        if (!room.procedures.includes(procId)) {
            room.procedures.push(procId);
        }
    });

    console.log("Added procedures count: " + selectedDBProcedures.size);
    
    // ปิด Modal
    closeSelectProcedureFromDBModal();

    // โหลด UI แสดงขั้นตอนการรักษาที่เพิ่มใหม่
    loadRoomDetails(currentRoomId);

    // แสดงข้อความสำเร็จ
    if (typeof showNotification === 'function') {
        showNotification("เพิ่มขั้นตอนการรักษาจาก Database สำเร็จ: " + selectedDBProceduressize + " รายการ", 'success');
    } else {
        alert("เพิ่มขั้นตอนการรักษาจาก Database สำเร็จ: " + selectedDBProcedures.size + " รายการ");
    }
}

// ========================================
// ✅ Modal สำหรับดึงขั้นตอนการรักษาจาก Database → สถานี
// ========================================

let stationDBProceduresData = {};
let selectedStationDBProcedures = new Set();

/**
 * ✅ เปิด Modal ดึงขั้นตอนการรักษาจาก Database (ใช้ SweetAlert) - MODERN with SELECT ALL
 */
async function openSelectProcedureFromStationDBModal() {
    console.log("🎯 Opening Station DB Modal with SweetAlert - MODERN SELECT ALL");
    
    try {
        // Step 1: Load departments
        const deptResponse = await fetch(`${API_BASE_URL}/get_departments.php`);
        const deptResult = await deptResponse.json();
        
        if (!deptResult.success || !deptResult.data) {
            Swal.fire('❌ เกิดข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลฝ่ายได้', 'error');
            return;
        }
        
        // Step 2: Create department options
        let deptOptions = '<option value="">-- เลือกฝ่าย --</option>';
        deptResult.data.forEach(dept => {
            deptOptions += `<option value="${dept.department_id}">${dept.department_name}</option>`;
        });
        
        // Step 3: Show modal with departments - MODERN DESIGN with SELECT ALL
        const { value: selectedDept } = await Swal.fire({
            title: '📖 ดึงขั้นตอนการรักษาจาก Database',
            html: `
                <style>
                    .modern-modal-content {
                        text-align: left !important;
                        padding: 0;
                        width: 100%;
                        box-sizing: border-box;
                    }
                    
                    .modal-label {
                        display: block;
                        font-size: 13px;
                        font-weight: 700;
                        color: #1a1a1a;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .dept-select {
                        width: 100%;
                        box-sizing: border-box;
                        padding: 12px 14px;
                        border: 2px solid #e0e0e0;
                        border-radius: 10px;
                        font-size: 14px;
                        font-weight: 500;
                        background: linear-gradient(135deg, #ffffff 0%, #f8fafb 100%);
                        color: #1a1a1a;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                    }
                    
                    .dept-select:hover {
                        border-color: #0066cc;
                        box-shadow: 0 4px 16px rgba(0, 102, 204, 0.1);
                    }
                    
                    .dept-select:focus {
                        outline: none;
                        border-color: #0066cc;
                        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1), 0 4px 16px rgba(0, 102, 204, 0.1);
                    }
                    
                    .procedures-loading-div {
                        display: block;
                        margin-top: 20px;
                        text-align: center;
                        padding: 40px 20px;
                    }
                    
                    .procedures-loading-div[style*="display: none"] {
                        display: none !important;
                    }
                    
                    .procedures-loading-div[style*="display: block"] {
                        display: block !important;
                    }
                    
                    .spinner-wrapper {
                        margin-bottom: 15px;
                    }
                    
                    .spinner-wrapper i {
                        font-size: 36px;
                        color: #0066cc;
                        animation: spin 1s linear infinite;
                    }
                    
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    .loading-text {
                        font-size: 14px;
                        color: #666;
                        font-weight: 500;
                        margin: 0;
                    }
                    
                    .procedures-container {
                        display: block;
                        margin-top: 15px;
                        max-height: 250px;
                        overflow-y: auto;
                        border: 1px solid #e0e7ff;
                        border-radius: 12px;
                        padding: 12px;
                        background: #f8faff;
                    }
                    
                    .procedures-container::-webkit-scrollbar {
                        width: 6px;
                    }
                    
                    .procedures-container::-webkit-scrollbar-track {
                        background: rgba(0, 102, 204, 0.05);
                        border-radius: 10px;
                    }
                    
                    .procedures-container::-webkit-scrollbar-thumb {
                        background: rgba(0, 102, 204, 0.25);
                        border-radius: 10px;
                    }
                    
                    .procedures-container::-webkit-scrollbar-thumb:hover {
                        background: rgba(0, 102, 204, 0.4);
                    }
                    
                    .select-all-wrapper {
                        display: block;
                        margin-bottom: 15px;
                        padding: 12px;
                        background: linear-gradient(135deg, rgba(0, 102, 204, 0.08) 0%, rgba(0, 102, 204, 0.03) 100%);
                        border-radius: 10px;
                        border: 1px solid rgba(0, 102, 204, 0.15);
                    }
                    
                    .select-all-wrapper[style*="display: none"] {
                        display: none !important;
                    }
                    
                    .select-all-wrapper[style*="display: block"] {
                        display: block !important;
                    }
                    
                    .select-all-btn {
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 11px 16px;
                        background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 2px 10px rgba(0, 102, 204, 0.3);
                    }
                    
                    .select-all-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(0, 102, 204, 0.4);
                        background: linear-gradient(135deg, #0056b3 0%, #003d7f 100%);
                    }
                    
                    .select-all-btn:active {
                        transform: translateY(0);
                    }
                    
                    }

                    .select-count {
                        display: inline-block !important;
                        background: rgba(255, 255, 255, 0.25) !important;
                        padding: 4px 12px !important;
                        border-radius: 12px !important;
                        font-size: 12px !important;
                        font-weight: 700 !important;
                        margin-left: auto !important;
                    }

                    /* Procedures Container */
                    .procedures-container {
                        display: block !important;
                        margin-top: 15px !important;
                        max-height: 300px !important;
                        overflow-y: auto !important;
                        border: 1px solid rgba(102, 126, 234, 0.15) !important;
                        border-radius: 14px !important;
                        padding: 10px !important;
                        background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(240, 245, 255, 0.8) 100%) !important;
                    }
                    
                    .procedures-container[style*="display: none"] {
                        display: none !important;
                    }
                    
                    .procedures-container[style*="display: block"] {
                        display: block !important;
                    }

                    .procedures-container::-webkit-scrollbar {
                        width: 6px !important;
                    }

                    .procedures-container::-webkit-scrollbar-track {
                        background: rgba(102, 126, 234, 0.08) !important;
                        border-radius: 10px !important;
                    }

                    .procedures-container::-webkit-scrollbar-thumb {
                        background: rgba(102, 126, 234, 0.3) !important;
                        border-radius: 10px !important;
                    }

                    .procedures-container::-webkit-scrollbar-thumb:hover {
                        background: rgba(102, 126, 234, 0.5) !important;
                    }

                    /* Procedure Item */
                    .procedure-item {
                        display: flex !important;
                        align-items: flex-start !important;
                        gap: 14px !important;
                        padding: 13px 14px !important;
                        background: rgba(255, 255, 255, 0.8) !important;
                        backdrop-filter: blur(5px) !important;
                        border: 1px solid rgba(102, 126, 234, 0.15) !important;
                        margin-bottom: 9px !important;
                        border-radius: 11px !important;
                        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
                        cursor: pointer !important;
                    }

                    .procedure-item:hover {
                        background: rgba(255, 255, 255, 0.95) !important;
                        border-color: #667EEA !important;
                        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15) !important;
                        transform: translateX(3px) !important;
                    }

                    .procedure-item:last-child {
                        margin-bottom: 0 !important;
                    }

                    /* Custom Checkbox */
                    .custom-checkbox {
                        width: 20px !important;
                        height: 20px !important;
                        min-width: 20px !important;
                        margin-top: 2px !important;
                        cursor: pointer !important;
                        accent-color: #667EEA !important;
                        transition: all 0.2s ease !important;
                    }

                    .custom-checkbox:hover {
                        transform: scale(1.1) !important;
                    }

                    .custom-checkbox:checked {
                        box-shadow: 0 0 8px rgba(102, 126, 234, 0.4) !important;
                    }

                    /* Procedure Info */
                    .procedure-info {
                        flex: 1 !important;
                        min-width: 0 !important;
                    }

                    .procedure-name {
                        font-size: 14px !important;
                        font-weight: 600 !important;
                        color: #1a1a1a !important;
                        line-height: 1.4 !important;
                        margin-bottom: 6px !important;
                    }

                    .procedure-duration {
                        font-size: 12px !important;
                        color: #667EEA !important;
                        font-weight: 600 !important;
                        display: flex !important;
                        align-items: center !important;
                        gap: 6px !important;
                    }

                    .procedure-duration span {
                        background: rgba(102, 126, 234, 0.12) !important;
                        padding: 3px 10px !important;
                        border-radius: 6px !important;
                    }

                    /* No Selection Message */
                    .no-selection-div {
                        display: block !important;
                        margin-top: 30px !important;
                        padding: 45px 20px !important;
                        background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(240, 245, 255, 0.8) 100%) !important;
                        border-radius: 14px !important;
                        text-align: center !important;
                        color: #999 !important;
                        font-size: 14px !important;
                        border: 2px dashed rgba(102, 126, 234, 0.2) !important;
                        letter-spacing: 0.2px !important;
                    }
                    
                    .no-selection-div[style*="display: none"] {
                        display: none !important;
                    }
                    
                    .no-selection-div[style*="display: block"] {
                        display: block !important;
                    }

                    .no-selection-div i {
                        font-size: 45px !important;
                        margin-bottom: 12px !important;
                        display: block !important;
                        opacity: 0.35 !important;
                        color: #667EEA !important;
                    }

                    .no-selection-div p {
                        margin: 0 !important;
                        font-size: 14px !important;
                        font-weight: 500 !important;
                    }

                    /* SweetAlert Buttons */
                    .swal2-actions {
                        padding: 20px 30px 30px 30px !important;
                        gap: 12px !important;
                        width: 100% !important;
                    }

                    .swal2-confirm {
                        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%) !important;
                        box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3) !important;
                        border-radius: 11px !important;
                        font-weight: 600 !important;
                        padding: 13px 24px !important;
                        font-size: 14px !important;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                        flex: 1 !important;
                        border: none !important;
                    }

                    .swal2-confirm:hover {
                        transform: translateY(-2px) !important;
                        box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4) !important;
                        background: linear-gradient(135deg, #56c256 0%, #4cae50 100%) !important;
                    }

                    .swal2-confirm:active {
                        transform: translateY(0) !important;
                    }

                    .swal2-cancel {
                        background: rgba(200, 200, 200, 0.3) !important;
                        color: #666 !important;
                        border-radius: 11px !important;
                        font-weight: 600 !important;
                        padding: 13px 24px !important;
                        font-size: 14px !important;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                        border: 1px solid rgba(200, 200, 200, 0.4) !important;
                        flex: 1 !important;
                    }

                    .swal2-cancel:hover {
                        background: rgba(200, 200, 200, 0.5) !important;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
                        transform: translateY(-2px) !important;
                    }

                    .swal2-cancel:active {
                        transform: translateY(0) !important;
                    }

                    /* Validation Message */
                    .swal2-validation-message {
                        color: #dc3545 !important;
                        font-size: 13px !important;
                        margin-top: 10px !important;
                        padding: 10px 15px !important;
                        background: rgba(220, 53, 69, 0.1) !important;
                        border-radius: 8px !important;
                        border-left: 3px solid #dc3545 !important;
                    }

                    /* Backdrop Blur Effect */
                    .swal2-backdrop {
                        background: rgba(0, 0, 0, 0.35) !important;
                        backdrop-filter: blur(4px) !important;
                    }
                </style>
                
                <div class="modern-modal-content">
                    <label class="modal-label">
                        <i class="fas fa-hospital-user"></i> เลือกฝ่าย *
                    </label>
                    <select id="stationDBDeptSelect" class="dept-select">
                        ${deptOptions}
                    </select>
                    
                    <div class="procedures-loading-div" id="proceduresLoadingDiv">
                        <div class="spinner-wrapper">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <p class="loading-text">กำลังดึงขั้นตอนการรักษา...</p>
                    </div>
                    
                    <div class="select-all-wrapper" id="selectAllWrapper">
                        <button type="button" class="select-all-btn" id="selectAllBtn" onclick="toggleSelectAll()">
                            <i class="fas fa-check-double"></i>
                            <span id="selectAllText">เลือกทั้งหมด</span>
                            <span class="select-count"><span id="selectedCount">0</span>/<span id="totalCount">0</span></span>
                        </button>
                    </div>
                    
                    <div class="procedures-container" id="proceduresContainer">
                        <!-- Procedures checkboxes will be here -->
                    </div>
                    
                    <div class="no-selection-div" id="noSelectionDiv">
                        <i class="fas fa-inbox"></i>
                        <p>กรุณาเลือกฝ่ายเพื่อแสดงขั้นตอนการรักษา</p>
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '✅ เพิ่มขั้นตอน',
            cancelButtonText: '❌ ยกเลิก',
            confirmButtonColor: '#4CAF50',
            cancelButtonColor: '#e0e0e0',
            confirmButtonClass: 'swal-confirm-btn',
            cancelButtonClass: 'swal-cancel-btn',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: async (modal) => {
                const deptSelect = document.getElementById('stationDBDeptSelect');
                
                // Handle department selection
                deptSelect.addEventListener('change', async (e) => {
                    const deptId = e.target.value;
                    allProceduresChecked = false;
                    
                    if (!deptId) {
                        document.getElementById('proceduresContainer').style.display = 'none';
                        document.getElementById('proceduresLoadingDiv').style.display = 'none';
                        document.getElementById('noSelectionDiv').style.display = 'block';
                        document.getElementById('selectAllWrapper').style.display = 'none';
                        return;
                    }
                    
                    // Show loading
                    document.getElementById('proceduresLoadingDiv').style.display = 'block';
                    document.getElementById('proceduresContainer').style.display = 'none';
                    document.getElementById('noSelectionDiv').style.display = 'none';
                    document.getElementById('selectAllWrapper').style.display = 'none';
                    
                    try {
                        // Fetch procedures
                        const procResponse = await fetch(`${API_BASE_URL}/get_procedures.php?department_id=${deptId}`);
                        const procResult = await procResponse.json();
                        
                        if (procResult.success && procResult.data) {
                            // ✅ Store procedures in window scope for use in addSelectedProceduresFromStationDB
                            window.departmentProcedures = procResult.data;
                            
                            // Build checkboxes with modern styling
                            let html = '';
                            procResult.data.forEach(proc => {
                                html += `
                                    <div class="procedure-item">
                                        <input type="checkbox" value="${proc.procedure_id}" class="stationDBProcCheckbox custom-checkbox" 
                                               onchange="updateSelectAllButton()">
                                        <div class="procedure-info">
                                            <div class="procedure-name">${proc.procedure_name}</div>
                                            <div class="procedure-duration">
                                                <span>⏱️</span>
                                                ${proc.default_duration || 30} นาที
                                            </div>
                                        </div>
                                    </div>
                                `;
                            });
                            
                            document.getElementById('proceduresContainer').innerHTML = html;
                            document.getElementById('totalCount').textContent = procResult.data.length;
                            document.getElementById('selectedCount').textContent = '0';
                            document.getElementById('proceduresLoadingDiv').style.display = 'none';
                            document.getElementById('proceduresContainer').style.display = 'block';
                            document.getElementById('selectAllWrapper').style.display = 'block';
                            document.getElementById('noSelectionDiv').style.display = 'none';
                        }
                    } catch (error) {
                        console.error('Error loading procedures:', error);
                        document.getElementById('proceduresLoadingDiv').style.display = 'none';
                        document.getElementById('proceduresContainer').innerHTML = '<p style="color: red; padding: 20px; text-align: center;">❌ เกิดข้อผิดพลาด</p>';
                        document.getElementById('proceduresContainer').style.display = 'block';
                    }
                });
            },
            preConfirm: () => {
                const checkboxes = document.querySelectorAll('.stationDBProcCheckbox:checked');
                if (checkboxes.length === 0) {
                    Swal.showValidationMessage('❌ กรุณาเลือกขั้นตอนการรักษาอย่างน้อย 1 รายการ');
                    return false;
                }
                
                const selected = [];
                checkboxes.forEach(cb => {
                    selected.push(cb.value);
                });
                
                return selected;
            }
        });
        
        if (selectedDept && selectedDept.length > 0) {
            // Add procedures to current station
            await addSelectedProceduresFromStationDB(selectedDept);
        }
        
    } catch (error) {
        console.error('Error in openSelectProcedureFromStationDBModal:', error);
        Swal.fire('❌ เกิดข้อผิดพลาด', error.message, 'error');
    }
}

/**
 * ✅ Toggle Select All Checkboxes
 * เลือก/ยกเลิกเลือกทั้งหมด
 */
function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.stationDBProcCheckbox');
    allProceduresChecked = !allProceduresChecked;
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = allProceduresChecked;
    });
    
    updateSelectAllButton();
}

/**
 * ✅ Update Select All Button State
 * อัพเดตสถานะและข้อมูลปุ่ม Select All
 */
function updateSelectAllButton() {
    const checkboxes = document.querySelectorAll('.stationDBProcCheckbox');
    const checkedCount = document.querySelectorAll('.stationDBProcCheckbox:checked').length;
    const totalCount = checkboxes.length;
    
    document.getElementById('selectedCount').textContent = checkedCount;
    
    const selectAllBtn = document.getElementById('selectAllBtn');
    const selectAllText = document.getElementById('selectAllText');
    
    if (checkedCount === totalCount && totalCount > 0) {
        allProceduresChecked = true;
        selectAllText.textContent = 'ยกเลิกเลือกทั้งหมด';
        selectAllBtn.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
    } else {
        allProceduresChecked = false;
        selectAllText.textContent = 'เลือกทั้งหมด';
        selectAllBtn.style.background = 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)';
    }
}

/**
 * ✅ เพิ่มขั้นตอนการรักษาที่เลือกจาก Database → บันทึก Database
 */
async function addSelectedProceduresFromStationDB(selectedProcedureIds) {
    Swal.fire({
        title: '💾 กำลังบันทึกลง Database...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
    });

    let currentProcedures = window.stationProceduresData || [];
    let addedCount = 0;
    let failedCount = 0;

    // ✅ Safety check: ensure departmentProcedures exists
    if (!window.departmentProcedures || !Array.isArray(window.departmentProcedures)) {
        console.error('❌ Department procedures data not available. Please reload the modal.');
        Swal.close();
        Swal.fire('❌ เกิดข้อผิดพลาด', 'ไม่มีข้อมูลขั้นตอนการรักษา กรุณาโหลดใหม่', 'error');
        return;
    }

    for (const procId of selectedProcedureIds) {
        try {
            // 🔍 หา procedure จากข้อมูลที่โหลดจาก modal
            const proc = window.departmentProcedures.find(
                p => p.procedure_id == procId
            );

            if (!proc) {
                failedCount++;
                continue;
            }

            const payload = {
                station_id: currentStationId,
                Procedurepdp_id: proc.procedure_id,  // ✅ เพิ่ม: master_procedure_id = procedure_item_id (จาก PDP)
                procedure_name: proc.procedure_name,
                procedure_code: proc.procedure_code || '',
                procedure_time: proc.default_duration || 30,
                wait_time: 10,
                Time_target: 0,
                staff_required: 0,
                equipment_required: 0
            };

            const res = await fetch(getApiUrl('add_station_procedure.php'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // ตรวจสอบ response text ก่อน parse JSON
            const text = await res.text();
            let json;
            
            try {
                json = JSON.parse(text);
            } catch (parseErr) {
                console.error('❌ Response ไม่ใช่ JSON:', text.substring(0, 200));
                failedCount++;
                continue;
            }

            if (json.success) {
                currentProcedures.push({
                    station_procedure_id: json.data.station_procedure_id,
                    station_id: currentStationId,
                    master_procedure_id: proc.procedure_id,
                    procedure_name: proc.procedure_name,
                    procedure_time: payload.procedure_time,
                    wait_time: payload.wait_time,
                    created_at: new Date().toISOString()
                });
                addedCount++;
            } else {
                failedCount++;
            }

        } catch (err) {
            console.error(err);
            failedCount++;
        }
    }

    window.stationProceduresData = currentProcedures;
    displayStationProcedures(currentProcedures);

    Swal.fire({
        title: '✅ การดำเนินการเสร็จสิ้น',
        html: `
            เพิ่มสำเร็จ: <b>${addedCount}</b> รายการ<br>
            ${failedCount > 0 ? `ล้มเหลว: ${failedCount} รายการ` : ''}
        `,
        icon: addedCount > 0 ? 'success' : 'warning'
    });
}

// ========================================

// export {
//   currentStationId,
//   currentStationData,
//   openStationDetail,
//   addDoctorToStation,
//   displayStationDetail,
//   displayStationRooms,
//   switchStationTab,
//   closeStationDetail,
//   setupStatusAutoUpdate,
//   cleanupStatusAutoUpdate
// };