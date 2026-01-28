/**
 * 👥 Room Display Module - WITH SWEETALERT2
 * Beautiful alerts using SweetAlert2
 */

// ========================================
// ✅ OPEN ROOM DETAIL
// ========================================

async function openRoomDetail(roomId) {
  currentRoomId = roomId;

  // ✅ Clean up old countdown timers before loading new room detail
  Object.keys(countdownTimers).forEach(patientId => {
    clearInterval(countdownTimers[patientId]);
    delete countdownTimers[patientId];
  });

  try {
    const today = new Date().toISOString().split("T")[0];
    const apiUrl = getApiUrl("get_room_detail.php") + `?room_id=${roomId}&work_date=${today}&t=${Date.now()}`;

    console.log("🔍 Fetching room detail...");

    // ✅ FIXED: Add cache busting headers
    const response = await fetch(apiUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    const result = await response.json();

    if (result.success) {
      const data = result.data;
      
      const roomTitle = document.getElementById("roomDetailTitle");
      if (roomTitle) {
        roomTitle.textContent = `${data.room.room_name}`;
      }

      const roomSubtitle = document.getElementById("roomDetailSubtitle");
      if (roomSubtitle) {
        roomSubtitle.textContent = `${data.room.station_name} • Floor ${data.room.floor}`;
      }

      displayRoomStaffModern(data.staff || []);
      displayRoomDoctorsModern(data.doctors || []);
      displayRoomEquipmentModern(data.equipment || []);
      displayRoomProceduresVertical(data.procedures || []);
      displayRoomPatientsModern(data.patients || []);

      const roomModal = document.getElementById("roomDetailModal");
      if (roomModal) {
        roomModal.style.display = "block";
      }

      console.log("✅ Room detail loaded");
    } else {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: result.message,
        confirmButtonText: 'ตกลง'
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message,
      confirmButtonText: 'ตกลง'
    });
  }
}

// ========================================
// ✅ STAFF
// ========================================

function displayRoomStaffModern(staff) {
  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">👥</span>
        <h4 style="margin: 0; color: #1a1a1a; font-weight: 700;">พนักงานในห้อง</h4>
        <span style="background: #e8f4f8; color: #0056b3; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
          ${staff.length}
        </span>
      </div>
      <button class="btn btn-success" onclick="openAddStaffModal(${currentRoomId})" style="padding: 8px 16px; font-size: 13px; border-radius: 6px;">
        <i class="fas fa-plus"></i> เพิ่ม
      </button>
    </div>
  `;

  staff.forEach((s) => {
    const formatTime = (time) => time ? time.substring(0, 5) : "-";
    const workStart = formatTime(s.work_start_time);
    const workEnd = formatTime(s.work_end_time);
    const breakStart = formatTime(s.break_start_time);
    const breakEnd = formatTime(s.break_end_time);

    html += `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        transition: all 0.2s ease;
      " onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'; this.style.transform='translateY(-2px)';" 
         onmouseout="this.style.boxShadow=''; this.style.transform='';">
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #1a1a1a; font-size: 14px; margin-bottom: 4px;">
            ${s.staff_name}
          </div>
          <div style="font-size: 12px; color: #6b7280;">
            🕐 ${workStart} - ${workEnd}
            ${breakStart !== "-" ? `<br>☕ ${breakStart} - ${breakEnd}` : ""}
          </div>
        </div>
        <button class="btn btn-danger" onclick="removeRoomStaff(${s.station_staff_id}, '${s.staff_name}')" 
                style="padding: 6px 10px; font-size: 12px; border-radius: 4px;">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  });

  if (staff.length === 0) {
    html += `<div style="text-align: center; padding: 24px; background: #f9fafb; border-radius: 8px; color: #9ca3af; font-size: 13px;"><i class="fas fa-users" style="font-size: 24px; opacity: 0.4; display: block; margin-bottom: 8px;"></i>ไม่มีพนักงาน</div>`;
  }

  const container = document.getElementById("roomStaffContainer");
  if (container) container.innerHTML = html;
}

// ========================================
// ✅ DOCTORS
// ========================================

function displayRoomDoctorsModern(doctors) {
  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">👨‍⚕️</span>
        <h4 style="margin: 0; color: #1a1a1a; font-weight: 700;">แพทย์ในห้อง</h4>
        <span style="background: #e8f4f8; color: #0056b3; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
          ${doctors.length}
        </span>
      </div>
      <button class="btn btn-success" onclick="openAddDoctorModal(${currentRoomId})" style="padding: 8px 16px; font-size: 13px; border-radius: 6px;">
        <i class="fas fa-plus"></i> เพิ่ม
      </button>
    </div>
  `;

  doctors.forEach((d) => {
    const formatTime = (time) => time ? time.substring(0, 5) : "-";
    const workStart = formatTime(d.work_start_time);
    const workEnd = formatTime(d.work_end_time);

    html += `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        transition: all 0.2s ease;
      " onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'; this.style.transform='translateY(-2px)';" 
         onmouseout="this.style.boxShadow=''; this.style.transform='';">
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #1a1a1a; font-size: 14px; margin-bottom: 4px;">
            ${d.doctor_name}
          </div>
          <div style="font-size: 12px; color: #6b7280;">
            🕐 ${workStart} - ${workEnd}
          </div>
        </div>
        <button class="btn btn-danger" onclick="removeRoomDoctor(${d.station_doctor_id}, '${d.doctor_name}')" 
                style="padding: 6px 10px; font-size: 12px; border-radius: 4px;">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  });

  if (doctors.length === 0) {
    html += `<div style="text-align: center; padding: 24px; background: #f9fafb; border-radius: 8px; color: #9ca3af; font-size: 13px;"><i class="fas fa-user-md" style="font-size: 24px; opacity: 0.4; display: block; margin-bottom: 8px;"></i>ไม่มีแพทย์</div>`;
  }

  const container = document.getElementById("roomDoctorContainer");
  if (container) container.innerHTML = html;
}

// ========================================
// ✅ EQUIPMENT
// ========================================

function displayRoomEquipmentModern(equipment) {
  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">🔧</span>
        <h4 style="margin: 0; color: #1a1a1a; font-weight: 700;">เครื่องมือในห้อง</h4>
        <span style="background: #e8f4f8; color: #0056b3; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
          ${equipment.length}
        </span>
      </div>
      <button class="btn btn-success" onclick="openAddEquipmentModal(${currentRoomId})" style="padding: 8px 16px; font-size: 13px; border-radius: 6px;">
        <i class="fas fa-plus"></i> เพิ่ม
      </button>
    </div>
  `;

  equipment.forEach((eq) => {
    html += `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        transition: all 0.2s ease;
      " onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'; this.style.transform='translateY(-2px)';" 
         onmouseout="this.style.boxShadow=''; this.style.transform='';">
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #1a1a1a; font-size: 14px; margin-bottom: 4px;">
            ${eq.equipment_name}
          </div>
          <div style="font-size: 12px; color: #6b7280;">
            ${eq.require_staff ? "⚠️ ต้องใช้พนักงาน" : "✓ สามารถใช้ได้"}
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <label class="switch" style="margin: 0;">
            <input type="checkbox" ${eq.is_active ? "checked" : ""} onchange="toggleEquipment(${eq.equipment_id}, this.checked)">
            <span class="slider"></span>
          </label>
          <button class="btn btn-danger" onclick="removeEquipment(${eq.equipment_id}, '${eq.equipment_name}')" 
                  style="padding: 6px 10px; font-size: 12px; border-radius: 4px;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  });

  if (equipment.length === 0) {
    html += `<div style="text-align: center; padding: 24px; background: #f9fafb; border-radius: 8px; color: #9ca3af; font-size: 13px;"><i class="fas fa-tools" style="font-size: 24px; opacity: 0.4; display: block; margin-bottom: 8px;"></i>ไม่มีเครื่องมือ</div>`;
  }

  const container = document.getElementById("roomEquipmentContainer");
  if (container) container.innerHTML = html;
}

// ========================================
// ✅ PROCEDURES - WITH SWEETALERT2
// ========================================

function displayRoomProceduresVertical(procedures) {
  const procId = `proc_${currentRoomId}`;
  
  console.log("🔍 [DEBUG] displayRoomProceduresVertical START");
  console.log("🔍 [DEBUG] procedures count:", procedures.length);
  console.log("🔍 [DEBUG] procedures data:", JSON.stringify(procedures.slice(0, 2)));
  
  if (procedures.length > 0) {
    console.log("🔍 [DEBUG] First procedure object:");
    console.log("  - room_procedure_id:", procedures[0].room_procedure_id);
    console.log("  - room_id:", procedures[0].room_id);
    console.log("  - procedure_id:", procedures[0].procedure_id);
    console.log("  - procedure_name:", procedures[0].procedure_name);
    console.log("  - All keys:", Object.keys(procedures[0]));
  }
  
  let html = `
    <!-- 📊 Header Section -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #f0f0f0;">
      <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
        <span style="font-size: 24px; flex-shrink: 0;">⚙️</span>
        <div style="min-width: 0;">
          <h3 style="margin: 0; color: #1a1a1a; font-size: 18px; font-weight: 700;">หัตถการในห้อง</h3>
          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">รวม ${procedures.length} รายการ</p>
        </div>
      </div>
      <button class="btn btn-success" onclick="openAssignProcedureModal(${currentRoomId})" style="
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        transition: all 0.3s ease;
        flex-shrink: 0;
        white-space: nowrap;
      " onmouseover="this.style.boxShadow='0 6px 20px rgba(16, 185, 129, 0.4)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.3)'; this.style.transform='';">
        <span>➕</span> เพิ่มหัตถการ
      </button>
    </div>

    <!-- 📋 Procedures List - FIXED LAYOUT -->
    <div id="${procId}" style="
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      box-sizing: border-box;
    ">
  `;

  if (procedures.length === 0) {
    html += `
      <div style="text-align: center; padding: 32px 16px; background: #f9fafb; border-radius: 12px; border: 2px dashed #e5e7eb;">
        <p style="margin: 0; color: #9ca3af; font-size: 14px;">❌ ยังไม่มีหัตถการในห้องนี้</p>
        <p style="margin: 8px 0 0 0; color: #d1d5db; font-size: 12px;">คลิก "เพิ่มหัตถการ" เพื่อเพิ่มรายการใหม่</p>
      </div>
    `;
  } else {
    procedures.forEach((proc, idx) => {
      // ✅ FIX: Get ID with fallback
      const procId = proc.room_procedure_id !== undefined ? proc.room_procedure_id : proc.id || proc.procedure_id;
      
      console.log(`🔍 [DEBUG] Procedure ${idx}: room_procedure_id=${proc.room_procedure_id}, using=${procId}`);
      
      const totalProcTime = parseInt(proc.wait_time ?? 0) + parseInt(proc.procedure_time ?? 0);
      const isHighPriority = totalProcTime > 60;
      
      html += `
        <div style="
          display: flex;
          gap: 12px;
          padding: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.3s ease;
          position: relative;
          box-sizing: border-box;
          width: 100%;
          flex-wrap: wrap;
          align-items: flex-start;
        " onmouseover="this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'; this.style.borderColor='#3b82f6'; this.style.transform='translateY(-4px)';" onmouseout="this.style.boxShadow=''; this.style.borderColor='#e5e7eb'; this.style.transform='';">
          
          <!-- Left accent bar + number badge -->
          <div style="display: flex; gap: 12px; align-items: center; flex-shrink: 0;">
            <div style="width: 4px; background: ${isHighPriority ? '#ef4444' : '#10b981'}; border-radius: 4px; height: 80px; flex-shrink: 0;"></div>
            <div style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; border-radius: 8px; font-weight: 700; font-size: 14px; flex-shrink: 0;">
              ${idx + 1}
            </div>
          </div>
          
          <!-- Main content -->
          <div style="flex: 1; min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              ${proc.procedure_name}
              <!-- ✅ PDP ID -->
              <div style="font-size: 11px; color: #0066cc; font-weight: 600; margin-top: 4px;">
                🔗 PDP ID: ${proc.Procedurepdp_id || 'N/A'}
              </div>
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; font-size: 13px;">
              <div style="display: flex; align-items: center; gap: 4px; color: #0284c7;">
                <span>⏳</span>
                <span>รอ: ${proc.wait_time || 0} นาที</span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px; color: #db2777;">
                <span>⚡</span>
                <span>ทำ: ${proc.procedure_time || 0} นาที</span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px; color: #059669; font-weight: 600;">
                <span>📊</span>
                <span>รวม: ${totalProcTime} นาที</span>
              </div>
            </div>
            ${proc.procedure_type ? `
              <div style="margin-top: 8px;">
                <span style="display: inline-block; background: #f3f4f6; color: #6b7280; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">
                  ${proc.procedure_type}
                </span>
              </div>
            ` : ''}
          </div>
          
          <!-- Delete button - stays on right -->
          <div style="display: flex; align-items: center; flex-shrink: 0;">
            <button class="btn btn-danger" onclick="removeProcedureFromRoom(${procId}, '${proc.procedure_name}')" 
                    style="
                      width: 36px;
                      height: 36px;
                      border: none;
                      background: #fee2e2;
                      color: #dc2626;
                      border-radius: 8px;
                      cursor: pointer;
                      font-size: 16px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      transition: all 0.2s ease;
                    "
                    onmouseover="this.style.background='#fecaca'; this.style.transform='scale(1.1)';"
                    onmouseout="this.style.background='#fee2e2'; this.style.transform='scale(1)';"
                    title="ลบหัตถการนี้">
              🗑️
            </button>
          </div>
        </div>
      `;
    });
  }

  html += '</div>';
  const container = document.getElementById("roomProcedureContainer");
  if (container) {
    container.innerHTML = html;
    console.log("🔍 [DEBUG] displayRoomProceduresVertical END - HTML updated");
  }
}

// ========================================
// ✅ PATIENTS
// ========================================

// ========================================
// 👥 GENDER HELPER FUNCTION
// ========================================

function getGenderInfo(sex) {
  if (!sex && sex !== 0) {
    return { emoji: '👤', text: 'ไม่ระบุ', color: '#95a5a6' };
  }

  // ✅ Handle both string and numeric values (M/F or 1/2)
  let sexStr = String(sex).toUpperCase().trim();

  if (sex === 1 || sexStr === 'M' || sexStr === 'MALE') {
    return { emoji: '👨', text: 'ชาย', color: '#3498db' };
  }
  if (sex === 2 || sexStr === 'F' || sexStr === 'FEMALE') {
    return { emoji: '👩', text: 'หญิง', color: '#e91e63' };
  }
  return { emoji: '👤', text: 'ไม่ระบุ', color: '#95a5a6' };
}

// ========================================
// 🕐 COUNTDOWN TIMER MANAGEMENT
// ========================================

const countdownTimers = {}; // Store active timers

function startCountdownTimer(patientId, countdownExitTime, procedureDuration) {
  if (!patientId || !countdownExitTime) return;

  // ✅ Defensive: Validate countdown_exit_time format
  if (typeof countdownExitTime !== 'string' || countdownExitTime.trim() === '') {
    console.warn(`⚠️ Invalid countdown_exit_time for patient ${patientId}:`, countdownExitTime);
    return;
  }

  // Clear existing timer if any
  if (countdownTimers[patientId]) {
    clearInterval(countdownTimers[patientId]);
  }

  const updateCountdown = () => {
    const now = new Date();

    // ✅ Parse countdown_exit_time (format: YYYY-MM-DD HH:MM:SS or YYYY-MM-DD)
    const parts = countdownExitTime.split(' ');
    if (parts.length < 2) {
      // If no time component, assume 00:00:00
      console.warn(`⚠️ countdown_exit_time missing time component for patient ${patientId}:`, countdownExitTime);
      return;
    }

    const datePart = parts[0];
    const timePart = parts[1];

    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    const targetTime = new Date(year, month - 1, day, hours, minutes, seconds);
    const diffMs = targetTime - now;
    const minutes_remaining = Math.ceil(diffMs / 60000);

    const element = document.getElementById(`countdown-${patientId}`);
    if (!element) {
      clearInterval(countdownTimers[patientId]);
      delete countdownTimers[patientId];
      return;
    }

    if (minutes_remaining <= 0) {
      // Time's up - auto-complete patient
      element.innerHTML = '⏱️ หมดเวลา';
      element.style.color = '#ef4444';
      element.style.fontWeight = '700';
      clearInterval(countdownTimers[patientId]);
      delete countdownTimers[patientId];

      // Auto-complete patient
      autoCompletePatient(patientId);
    } else {
      // Show remaining time
      const color = minutes_remaining <= 5 ? '#ef4444' : (minutes_remaining <= 10 ? '#f59e0b' : '#10b981');
      element.innerHTML = `⏱️ ${minutes_remaining}น`;
      element.style.color = color;
      element.style.fontWeight = minutes_remaining <= 5 ? '700' : '600';
    }
  };

  updateCountdown(); // Initial update
  countdownTimers[patientId] = setInterval(updateCountdown, 1000);
}

async function autoCompletePatient(patientId) {
  try {
    // Get patient details first
    const patientElement = document.querySelector(`[data-patient-id="${patientId}"]`);
    if (!patientElement) {
      console.warn("Patient element not found");
      return;
    }

    const hn = patientElement.getAttribute('data-patient-hn');
    const appointmentDate = patientElement.getAttribute('data-appointment-date');

    if (!hn || !appointmentDate) {
      console.warn("Missing patient details for auto-complete");
      return;
    }

    const payload = {
      patient_id: patientId,
      hn: hn,
      appointment_date: appointmentDate,
      status: 'completed'
    };

    console.log("🔄 Auto-completing patient:", payload);

    const response = await fetch(getApiUrl("update_patient_status.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ Patient auto-completed:", result.data);

      // Show notification
      Swal.fire({
        icon: 'success',
        title: 'เสร็จสิ้น',
        text: `${result.data.hn} ถูกย้ายออกจากห้องแล้ว`,
        timer: 2000,
        showConfirmButton: false
      });

      // Refresh room detail
      setTimeout(() => openRoomDetail(currentRoomId), 1500);
    } else {
      console.error("❌ Auto-complete failed:", result.message);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: result.message,
        confirmButtonText: 'ตกลง'
      });
    }
  } catch (error) {
    console.error("❌ Error auto-completing patient:", error);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message,
      confirmButtonText: 'ตกลง'
    });
  }
}

function displayRoomPatientsModern(patients) {
  let html = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
      <span style="font-size: 18px;">🛏️</span>
      <h4 style="margin: 0; color: #1a1a1a; font-weight: 700;">คนไข้ในห้อง</h4>
      <span style="background: #e8f4f8; color: #0056b3; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
        ${patients.length}
      </span>
    </div>
  `;

  patients.forEach((p) => {
    const isOverdue = p.is_overdue;
    const isInProcess = p.status === 'in_process';
    const borderColor = isOverdue ? "#ef4444" : "#10b981";
    const bgColor = isOverdue ? "#fef2f2" : "#f0fdf4";

    // ✅ Get gender info
    const genderInfo = getGenderInfo(p.sex);

    html += `
      <div style="
        padding: 12px;
        margin-bottom: 8px;
        background: ${bgColor};
        border: 1px solid #e5e7eb;
        border-left: 4px solid ${borderColor};
        border-radius: 8px;
        transition: all 0.2s ease;
      " onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.boxShadow=''; this.style.transform='';"
          data-patient-id="${p.patient_id}"
          data-patient-hn="${p.hn}"
          data-appointment-date="${p.appointment_date || new Date().toISOString().split('T')[0]}">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #1a1a1a; font-size: 14px; margin-bottom: 4px;">
              ${isOverdue ? "🔴" : "🟢"} ${p.patient_name}
            </div>
            <div style="font-size: 12px; color: #6b7280;">
              <div style="display: flex; gap: 12px; align-items: center;">
                <div>HN: <strong>${p.hn}</strong></div>
                <div style="text-align: center;">
                  <div style="font-size: 16px;">${genderInfo.emoji}</div>
                  <div style="font-size: 10px; color: #666; margin-top: 2px;">${genderInfo.text}</div>
                </div>
              </div>
              <div>
                ${p.procedure_name || "ไม่ระบุ"}
              </div>
              <div style="margin-top: 4px;">
                <span style="
                  background: ${isOverdue ? "#fee2e2" : "#dbeafe"};
                  color: ${isOverdue ? "#ef4444" : "#0056b3"};
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 11px;
                  font-weight: 600;
                ">
                  ${p.status}
                </span>
              </div>
            </div>
          </div>
          <div style="text-align: right; font-size: 12px;">
            <div style="color: #6b7280; margin-bottom: 4px;">เข้า: ${p.arrival_time}</div>
            <div style="font-weight: 700; font-size: 16px; color: ${isOverdue ? "#ef4444" : "#10b981"};">
              ${p.wait_duration}น
            </div>
            ${isOverdue ? '<div style="color: #ef4444; font-weight: 600; margin-top: 4px;">⚠️ เกินเวลา</div>' : ""}
            ${isInProcess && p.countdown_exit_time ? `
              <div style="
                margin-top: 8px;
                padding: 8px;
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                border-radius: 6px;
                font-weight: 700;
                color: white;
                font-size: 13px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1);
              " id="countdown-${p.patient_id}">
                ⏱️ นับถอยหลัง...
              </div>
            ` : ""}
          </div>
        </div>
      </div>
    `;
  });

  if (patients.length === 0) {
    html += `<div style="text-align: center; padding: 24px; background: #f9fafb; border-radius: 8px; color: #9ca3af; font-size: 13px;"><i class="fas fa-bed" style="font-size: 24px; opacity: 0.4; display: block; margin-bottom: 8px;"></i>ไม่มีคนไข้</div>`;
  }

  const container = document.getElementById("roomPatientContainer");
  if (container) {
    container.innerHTML = html;

    // Start countdown timers for in-process patients (using procedure_time-based exit time)
    patients.forEach((p) => {
      if (p.status === 'in_process' && p.countdown_exit_time) {
        startCountdownTimer(p.patient_id, p.countdown_exit_time, p.procedure_duration_minutes);
      }
    });
  }
}

// ========================================
// ✅ UTILITY FUNCTIONS
// ========================================

function closeRoomDetail() {
  const modal = document.getElementById("roomDetailModal");
  if (modal) {
    modal.style.display = "none";
  }

  // ✅ Clean up countdown timers to prevent memory leaks
  Object.keys(countdownTimers).forEach(patientId => {
    clearInterval(countdownTimers[patientId]);
    delete countdownTimers[patientId];
  });

  currentRoomId = null;
}

// ========================================
// ✅ PROCEDURES MODAL FUNCTIONS
// ========================================

async function openAddProcedureModal(roomId) {
  try {
    if (!currentStationId) {
      throw new Error("Station ID not set");
    }

    const apiUrl = getApiUrl("get_station_procedures.php") + `?station_id=${currentStationId}&t=${Date.now()}`;
    console.log("📥 Fetching procedures from:", apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: API endpoint not found or server error`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ API returned non-JSON response:", text.substring(0, 100));
      throw new Error("API endpoint not found or misconfigured - check server configuration");
    }

    const result = await response.json();

    if (result.success) {
      const stationProcedures = result.data.procedures || [];
      showProcedureSelectionModal(roomId, stationProcedures);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: result.message,
        confirmButtonText: 'ตกลง'
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message,
      confirmButtonText: 'ตกลง'
    });
  }
}

function showProcedureSelectionModal(roomId, procedures) {
  const modalId = "procedureModalDialog";
  
  let procList = [];
  if (Array.isArray(procedures)) {
    procList = procedures;
  } else if (procedures && procedures.procedures && Array.isArray(procedures.procedures)) {
    procList = procedures.procedures;
  }
  
  let html = `
    <div id="${modalId}" style="
      display: flex;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      align-items: center;
      justify-content: center;
      z-index: 10000;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #1a1a1a; font-weight: 700;">เพิ่มหัตถการ</h3>
          <button onclick="closeProcedureModal()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
          ">×</button>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f0fdf4; border-radius: 8px; cursor: pointer; border: 2px solid #10b981;">
            <input type="checkbox" id="selectAllProc" onchange="toggleSelectAllProcedures()" style="width: 18px; height: 18px; cursor: pointer;">
            <span style="font-weight: 600; color: #059669;">เลือกทั้งหมด (${procList.length} รายการ)</span>
          </label>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
  `;

  procList.forEach((proc) => {
    const totalTime = parseInt(proc.wait_time ?? 0) + parseInt(proc.procedure_time ?? 0);
    html += `
      <label style="
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.background='#f9fafb'; this.style.borderColor='#0056b3';" onmouseout="this.style.background='white'; this.style.borderColor='#e5e7eb';">
        <input type="checkbox" class="procCheckbox" value="${proc.procedure_id}" style="width: 18px; height: 18px; cursor: pointer;">
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #1a1a1a; font-size: 14px;">
            ${proc.procedure_name}
          </div>
          <div style="font-size: 12px; color: #6b7280;">
            ⏱️ รอ: ${proc.wait_time ?? 0}น • ทำ: ${proc.procedure_time ?? 0}น • รวม: ${totalTime}น
          </div>
        </div>
      </label>
    `;
  });

  html += `
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="closeProcedureModal()" style="
            padding: 10px 20px;
            background: #e5e7eb;
            color: #1a1a1a;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='#d1d5db';" onmouseout="this.style.background='#e5e7eb';">
            ยกเลิก
          </button>
          <button onclick="addSelectedProcedures(${roomId})" style="
            padding: 10px 20px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='#059669';" onmouseout="this.style.background='#10b981';">
            เพิ่มหัตถการ
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
}

function closeProcedureModal() {
  const modal = document.getElementById("procedureModalDialog");
  if (modal) modal.remove();
}

function toggleSelectAllProcedures() {
  const selectAll = document.getElementById("selectAllProc").checked;
  const checkboxes = document.querySelectorAll(".procCheckbox");
  checkboxes.forEach(cb => cb.checked = selectAll);
}

async function addSelectedProcedures(roomId) {
  const checkboxes = document.querySelectorAll(".procCheckbox:checked");
  const procedureIds = Array.from(checkboxes).map(cb => cb.value);

  if (procedureIds.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'โปรดเลือก',
      text: 'กรุณาเลือกหัตถการอย่างน้อย 1 รายการ',
      confirmButtonText: 'ตกลง'
    });
    return;
  }

  try {
    const response = await fetch(getApiUrl("add_room_procedures.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: roomId,
        procedure_ids: procedureIds
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ หัตถการเพิ่มสำเร็จ");
      closeProcedureModal();
      
      Swal.fire({
        icon: 'success',
        title: 'เพิ่มสำเร็จ',
        text: `เพิ่มหัตถการ ${procedureIds.length} รายการแล้ว`,
        timer: 1500,
        showConfirmButton: false
      });
      
      setTimeout(() => openRoomDetail(roomId), 1000);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: result.message,
        confirmButtonText: 'ตกลง'
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message,
      confirmButtonText: 'ตกลง'
    });
  }
}

// ========================================
// ✅ REMOVE ROOM PROCEDURE - WITH SWEETALERT2
// ========================================

async function removeRoomProcedure(roomProcedureId) {
  console.log("🔍 [DEBUG] removeRoomProcedure called with:", roomProcedureId);
  console.log("🔍 [DEBUG] Type:", typeof roomProcedureId);
  console.log("🔍 [DEBUG] currentRoomId:", currentRoomId);
  
  // ✅ Show SweetAlert2 confirmation
  Swal.fire({
    title: 'ยืนยันการลบ',
    text: 'คุณต้องการลบหัตถการนี้ออกจากห้องหรือไม่?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'ลบออก',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const apiUrl = getApiUrl("remove_room_procedure.php");
        console.log("📤 Removing procedure from:", apiUrl);
        
        if (!roomProcedureId || isNaN(roomProcedureId)) {
          throw new Error(`Invalid roomProcedureId: ${roomProcedureId} (type: ${typeof roomProcedureId})`);
        }
        
        const payload = {
          room_procedure_id: parseInt(roomProcedureId)
        };
        
        console.log("📦 [DEBUG] Payload to send:", payload);
        
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        console.log("📊 [DEBUG] Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API Error Response:", errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("❌ API returned non-JSON response:", text.substring(0, 100));
          throw new Error("API returned non-JSON response: " + text.substring(0, 100));
        }

        const result = await response.json();
        console.log("✅ API Response:", result);

        if (result.success) {
          console.log("✅ ลบหัตถการสำเร็จ");
          
          Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
            text: 'หัตถการถูกลบออกจากห้องเรียบร้อยแล้ว',
            timer: 1500,
            showConfirmButton: false
          });
          
          setTimeout(() => openRoomDetail(currentRoomId), 1000);
        } else {
          console.error("❌ API returned success=false:", result.message);
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: result.message,
            confirmButtonText: 'ตกลง'
          });
        }
      } catch (error) {
        console.error("❌ Error:", error);
        console.error("❌ Error stack:", error.stack);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message,
          confirmButtonText: 'ตกลง'
        });
      }
    }
  });
}

// ========================================
// ✅ PLACEHOLDER FUNCTIONS
// ========================================

function openAddStaffModal(roomId) {
  Swal.fire({
    icon: 'info',
    title: 'ฟีเจอร์กำลังพัฒนา',
    text: 'ฟีเจอร์เพิ่มพนักงานจะเปิดใช้งานในเร็วๆนี้',
    confirmButtonText: 'ตกลง'
  });
}

function openAddDoctorModal(roomId) {
  Swal.fire({
    icon: 'info',
    title: 'ฟีเจอร์กำลังพัฒนา',
    text: 'ฟีเจอร์เพิ่มแพทย์จะเปิดใช้งานในเร็วๆนี้',
    confirmButtonText: 'ตกลง'
  });
}

function openAddEquipmentModal(roomId) {
  Swal.fire({
    icon: 'info',
    title: 'ฟีเจอร์กำลังพัฒนา',
    text: 'ฟีเจอร์เพิ่มเครื่องมือจะเปิดใช้งานในเร็วๆนี้',
    confirmButtonText: 'ตกลง'
  });
}

async function removeRoomStaff(id, name) {
  Swal.fire({
    title: 'ยืนยันการลบ',
    text: `ต้องการลบ ${name}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        console.log("🔍 [DEBUG] removeRoomStaff called with:", id);
        console.log("🔍 [DEBUG] Staff name:", name);
        
        const apiUrl = getApiUrl("remove_room_staff.php");
        console.log("📤 Calling API:", apiUrl);
        
        const payload = {
          station_staff_id: parseInt(id)
        };
        
        console.log("📦 Payload:", payload);
        
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        console.log("📊 Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API Error:", errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log("✅ API Response:", result);

        if (result.success) {
          console.log("✅ ลบพนักงานสำเร็จ");
          
          Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
            text: `${name} ถูกลบออกแล้ว`,
            timer: 1500,
            showConfirmButton: false
          });
          
          // Refresh room detail
          setTimeout(() => openRoomDetail(currentRoomId), 1000);
        } else {
          console.error("❌ API Error:", result.message);
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: result.message,
            confirmButtonText: 'ตกลง'
          });
        }
      } catch (error) {
        console.error("❌ Error:", error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message,
          confirmButtonText: 'ตกลง'
        });
      }
    }
  });
}

async function removeRoomDoctor(id, name) {
  Swal.fire({
    title: 'ยืนยันการลบ',
    text: `ต้องการลบ ${name}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        console.log("🔍 [DEBUG] removeRoomDoctor called with:", id);
        console.log("🔍 [DEBUG] Doctor name:", name);
        
        const apiUrl = getApiUrl("remove_room_doctor.php");
        console.log("📤 Calling API:", apiUrl);
        
        const payload = {
          station_doctor_id: parseInt(id)
        };
        
        console.log("📦 Payload:", payload);
        
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        console.log("📊 Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API Error:", errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log("✅ API Response:", result);

        if (result.success) {
          console.log("✅ ลบแพทย์สำเร็จ");
          
          Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
            text: `${name} ถูกลบออกแล้ว`,
            timer: 1500,
            showConfirmButton: false
          });
          
          // Refresh room detail
          setTimeout(() => openRoomDetail(currentRoomId), 1000);
        } else {
          console.error("❌ API Error:", result.message);
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: result.message,
            confirmButtonText: 'ตกลง'
          });
        }
      } catch (error) {
        console.error("❌ Error:", error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message,
          confirmButtonText: 'ตกลง'
        });
      }
    }
  });
}

async function removeEquipment(id) {
  Swal.fire({
    title: 'ยืนยันการลบ',
    text: 'ต้องการลบเครื่องมือนี้?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        console.log("🔍 [DEBUG] removeEquipment called with:", id);
        
        const apiUrl = getApiUrl("remove_room_equipment.php");
        console.log("📤 Calling API:", apiUrl);
        
        const payload = {
          equipment_id: parseInt(id)
        };
        
        console.log("📦 Payload:", payload);
        
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        console.log("📊 Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API Error:", errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log("✅ API Response:", result);

        if (result.success) {
          console.log("✅ ลบเครื่องมือสำเร็จ");
          
          Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
            text: 'เครื่องมือถูกลบออกแล้ว',
            timer: 1500,
            showConfirmButton: false
          });
          
          // Refresh room detail
          setTimeout(() => openRoomDetail(currentRoomId), 1000);
        } else {
          console.error("❌ API Error:", result.message);
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: result.message,
            confirmButtonText: 'ตกลง'
          });
        }
      } catch (error) {
        console.error("❌ Error:", error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message,
          confirmButtonText: 'ตกลง'
        });
      }
    }
  });
}

async function toggleEquipment(equipmentId, requestedStatus) {
  try {
    console.log("🔄 Toggle equipment:", equipmentId, "to status:", requestedStatus);
    
    const apiUrl = getApiUrl("manage_room_equipment.php");
    
    const payload = {
      action: 'toggle',
      equipment_id: parseInt(equipmentId),
      is_active: requestedStatus,
      room_id: currentRoomId
    };
    
    console.log("📦 Payload:", payload);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ API Response:", result);

    if (result.success) {
      const data = result.data;
      const statusText = data.is_active ? "เปิด" : "ปิด";
      const autoBlockedText = data.auto_blocked ? " (ปิดอัตโนมัติ - ไม่มีพนักงาน)" : "";
      
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: `${data.equipment_name} ${statusText}แล้ว${autoBlockedText}`,
        timer: 1500,
        showConfirmButton: false
      });
      
      // Refresh room detail
      setTimeout(() => openRoomDetail(currentRoomId), 1000);
    } else {
      console.error("❌ API Error:", result.message);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: result.message,
        confirmButtonText: 'ตกลง'
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message,
      confirmButtonText: 'ตกลง'
    });
  }
}

// ========================================
// ✅ END OF MODULE
// ========================================