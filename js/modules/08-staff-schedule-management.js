/**
 * ⏰ Staff Schedule Management Module - Part 3 - COMPLETE WITH ALL FEATURES
 * จัดการตารางเวลาพนักงาน, แก้ไขเวลาทำงาน, มอบหมายห้อง, เพิ่มพนักงาน, OT
 * 
 * ✅ FIXED: updateStaffScheduleFromModal() - ส่ง station_staff_id + เวลา
 * ✅ NEW: showDailyStaffAddModal() - เพิ่มพนักงาน วัน/OT
 * ✅ NEW: openAssignOTModal() - มอบหมาย OT ให้พนักงาน
 * 
 * Features:
 * - Display staff with schedule
 * - Edit staff schedule (✅ API save with station_staff_id)
 * - Assign/Unassign room
 * - Add daily staff (✅ NEW)
 * - Assign OT (✅ NEW)
 * - Import monthly staff
 */

// ========================================
// ✅ HELPER: FORMAT TIME 24 HOUR
// ========================================

/**
 * Format time to 24-hour format (HH:MM)
 * @param {string} time - Time string (e.g., "08:00:00" or "08:00")
 * @returns {string} Formatted time (e.g., "08:00")
 */
function formatTime24Hour(time) {
  if (!time) return "00:00";
  
  if (time.length >= 5) {
    return time.substring(0, 5);
  }
  
  return time;
}

// ========================================
// ✅ LOAD STATION STAFF
// ========================================

/**
 * Load and display staff for station
 * @param {number} stationId - Station ID
 */
async function loadStationStaff(stationId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/get_station_staff.php?station_id=${stationId}`
    );
    const result = await response.json();

    if (result.success) {
      displayStaffWithSchedule(result.data.staff, result.data.stats);
    } else {
      console.error("Failed to load station staff:", result.message);
      displayStaffWithSchedule([], null);
    }
  } catch (error) {
    console.error("Error loading station staff:", error);
    displayStaffWithSchedule([], null);
  }
}

// ========================================
// ✅ HELPER: CHECK IF OT STAFF
// ========================================

function isOvertimeStaff(staff) {
  if (!staff || !staff.staff_type) {
    return false;
  }

  const staffType = staff.staff_type.trim().toUpperCase();
  return staffType === "DAILY/OT" || staffType === "OT";
}

function getOTBadge(staff) {
  if (!isOvertimeStaff(staff)) {
    return "";
  }

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

// ========================================
// ✅ DISPLAY STAFF WITH SCHEDULE
// ========================================
// ========================================
// 🎨 FRONTEND: displayStaffWithSchedule()
// ✅ แสดง OT time + รองรับ 7 Status
// ========================================
// ========================================
// CORRECTED: displayStaffWithSchedule()
// - Priority: Database status first
// - Fallback: Automatic status calculation
// ========================================

async function displayStaffWithSchedule(staffList, stats) {
  const container = document.getElementById("stationStaffContent");

  if (!container) {
    console.warn("Container not found");
    return;
  }

  if (staffList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #adb5bd;">
        <i class="fas fa-users" style="font-size: 48px; margin-bottom: 15px;"></i>
        <div style="margin-bottom: 20px;">ไม่มีพนักงานในวันนี้</div>
        <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
          <button onclick="showMonthlyStaffImportModal(${currentStationId})"
                  style="background: #0056B3; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">
            <i class="fas fa-file-excel"></i> นำเข้า Excel
          </button>
          <button onclick="showDailyStaffAddModal(${currentStationId})"
                  style="background: #6c757d; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">
            <i class="fas fa-user-plus"></i> วัน/OT
          </button>
          <button onclick="openAssignOTModal(${currentStationId})"
                  style="background: #FF6B6B; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">
            <i class="fas fa-clock"></i> OT
          </button>
        </div>
      </div>
    `;
    return;
  }

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 10px; flex-wrap: wrap;">
      <h3 style="margin: 0; font-size: 15px;">👥 พนักงาน (${staffList.length} คน)</h3>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button onclick="showMonthlyStaffImportModal(${currentStationId})"
                style="background: #0056B3; color: white; border: none; padding: 7px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">
          <i class="fas fa-file-excel"></i> Excel
        </button>
        <button onclick="showDailyStaffAddModal(${currentStationId})"
                style="background: #6c757d; color: white; border: none; padding: 7px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">
          <i class="fas fa-user-plus"></i> วัน/OT
        </button>
        <button onclick="openAssignOTModal(${currentStationId})"
                style="background: #FF6B6B; color: white; border: none; padding: 7px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">
          <i class="fas fa-clock"></i> OT
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
    
    const otStartTime = staff.ot_start_time ? formatTime24Hour(staff.ot_start_time) : null;
    const otEndTime = staff.ot_end_time ? formatTime24Hour(staff.ot_end_time) : null;
    
    const roomName = staff.room_name || "-";
    const hasAssignedRoom = staff.room_id || staff.assigned_room_id;

    let status, statusColor, statusIcon, statusText, statusBgColor;
    const currentTimeShort = currentTime.substring(0, 5);
    const dbStatus = staff.status ? staff.status.toLowerCase() : null;

    // ========================================
    // PRIORITY 1: Check Database Status First
    // ========================================
    if (dbStatus === 'overtime') {
      status = "overtime";
      statusColor = "#FF6B6B";
      statusIcon = "fa-clock";
      statusText = "ทำ OT";
      statusBgColor = "rgba(255, 107, 107, 0.1)";
    } else if (dbStatus === 'offline') {
      status = "offline";
      statusColor = "#6c757d";
      statusIcon = "fa-power-off";
      statusText = "ออฟไลน์";
      statusBgColor = "rgba(108, 117, 125, 0.1)";
    } else if (dbStatus === 'waiting_to_start') {
      status = "waiting_to_start";
      statusColor = "#FFC107";
      statusIcon = "fa-hourglass-start";
      statusText = "รอเข้างาน";
      statusBgColor = "rgba(255, 193, 7, 0.1)";
    } else if (dbStatus === 'on_break') {
      status = "on_break";
      statusColor = "#D68910";
      statusIcon = "fa-coffee";
      statusText = "พักเบรค";
      statusBgColor = "rgba(214, 137, 16, 0.1)";
    } else if (dbStatus === 'working') {
      status = "working";
      statusColor = "#0056B3";
      statusIcon = "fa-briefcase";
      statusText = "ทำงาน";
      statusBgColor = "rgba(0, 86, 179, 0.1)";
    }
    // ========================================
    // PRIORITY 2: Fallback - Calculate from time
    // ========================================
    else {
      // If no database status, calculate from current time
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
      } else if (
        hasAssignedRoom &&
        currentTimeShort >= workStart &&
        currentTimeShort < workEnd
      ) {
        status = "working";
        statusColor = "#0056B3";
        statusIcon = "fa-briefcase";
        statusText = "ทำงาน";
        statusBgColor = "rgba(0, 86, 179, 0.1)";
      } else if (currentTimeShort >= workStart && currentTimeShort < workEnd) {
        // Within work time but no room assigned
        status = "available";
        statusColor = "#1E8449";
        statusIcon = "fa-check-circle";
        statusText = "ว่าง";
        statusBgColor = "rgba(30, 132, 73, 0.1)";
      } else {
        // After work time
        status = "off_duty";
        statusColor = "#6c757d";
        statusIcon = "fa-power-off";
        statusText = "เลิกงาน";
        statusBgColor = "rgba(108, 117, 125, 0.1)";
      }
    }

    const roomInfo = hasAssignedRoom
      ? `
        <div style="font-size: 11px; color: #0056B3; margin: 3px 0; font-weight: 600;">
          🚪 ${staff.room_name || "Room " + (staff.room_id || staff.assigned_room_id)}
        </div>
      `
      : "";

    const otTimeInfo = otStartTime && otEndTime
      ? `
        <div style="font-size: 11px; color: #FF6B6B; margin: 3px 0; font-weight: 600;">
          ⏱️ OT: ${otStartTime} - ${otEndTime}
        </div>
      `
      : "";

    let roomButtonHtml = "";
    if (hasAssignedRoom) {
      roomButtonHtml = `
        <button 
          onclick="removeStaffFromRoom(${staff.station_staff_id}, '${staff.staff_name}', '${staff.room_name || roomName}')"
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
      roomButtonHtml = `
        <button 
          onclick="openAssignRoomToStaffModal(${staff.station_staff_id || staff.id || 0}, '${staff.staff_name}')"
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
        <!-- Name & Type -->
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; font-size: 13px; color: #212529; margin-bottom: 2px;">
            ${staff.staff_name}
          </div>
          <div style="font-size: 10px; color: #adb5bd;">
            ${staff.staff_type || "พนักงาน"}
          </div>
          ${roomInfo}
          ${otTimeInfo}
        </div>

        <!-- Work Time -->
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

        <!-- Status Badge -->
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

        <!-- Room Button -->
        ${roomButtonHtml}
        
        <!-- Edit Button -->
        <button 
          onclick="openEditStaffScheduleModal('${staff.station_staff_id}', '${staff.staff_name}', '${staff.work_start_time}', '${staff.break_start_time}', '${staff.break_end_time}', '${staff.work_end_time}')"
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
  addOTBadgeStyles();

  console.log("Display Staff Schedule Complete");
}

// ========================================
// ✅ OPEN ASSIGN ROOM MODAL
// ========================================

async function openAssignRoomToStaffModal(stationStaffId, staffName) {
  try {
    console.log(
      `🏥 เปิด Modal แอดห้อง - staff_id: ${stationStaffId}, name: ${staffName}`
    );

    if (!currentStationId) {
      Swal.fire("ข้อผิดพลาด", "ไม่พบข้อมูล station", "error");
      return;
    }

    const roomsResponse = await fetch(
      `${API_BASE_URL}/get_station_rooms.php?station_id=${currentStationId}`.replace('//', '/')
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
                            🚪 เข้าห้อง <strong>${result.data.room_name || "Room " + roomId}</strong>
                        </div>
                    </div>
                `,
        icon: "success",
        confirmButtonColor: "#1E8449",
      });

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

// ========================================
// ✅ REMOVE STAFF FROM ROOM
// ========================================

async function removeStaffFromRoom(stationStaffId, staffName, roomName) {
  try {
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
          </div>
        `,
        icon: "success",
        confirmButtonColor: "#1E8449",
        timer: 2000,
        timerProgressBar: true,
      });

      location.reload();
    } else {
      Swal.close();
      throw new Error(result.message || "ไม่สามารถลบได้");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      html: `<p><strong>${error.message}</strong></p>`,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}

// ========================================
// ✅ OPEN EDIT SCHEDULE MODAL
// ========================================

async function openEditStaffScheduleModal(
  staffId,
  staffName,
  workStart,
  breakStart,
  breakEnd,
  workEnd
) {
  const formatTimeForInput = (time) => {
    if (!time) return "08:00";
    return time.substring(0, 5);
  };

  const { value: formData } = await Swal.fire({
    title: `⏰ แก้ไขเวลาทำงาน: ${staffName}`,
    html: `
            <div style="text-align: left; padding: 15px;">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                        ⏰ เวลาเข้างาน
                    </label>
                    <input type="time" id="editWorkStart" 
                           value="${formatTimeForInput(workStart)}" 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                </div>

                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                        🕔 เวลาออกงาน
                    </label>
                    <input type="time" id="editWorkEnd" 
                           value="${formatTimeForInput(workEnd)}" 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                </div>

                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                        ☕ เวลาพักเริ่ม
                    </label>
                    <input type="time" id="editBreakStart" 
                           value="${formatTimeForInput(breakStart)}" 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                </div>

                <div class="form-group">
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                        🕐 เวลาพักจบ
                    </label>
                    <input type="time" id="editBreakEnd" 
                           value="${formatTimeForInput(breakEnd)}" 
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
      const wStart = document.getElementById("editWorkStart").value;
      const wEnd = document.getElementById("editWorkEnd").value;
      const bStart = document.getElementById("editBreakStart").value;
      const bEnd = document.getElementById("editBreakEnd").value;

      if (!wStart || !wEnd || !bStart || !bEnd) {
        Swal.showValidationMessage("⚠️ กรุณากรอกเวลาทั้งหมด");
        return false;
      }

      if (wStart >= bStart || bStart >= bEnd || bEnd >= wEnd) {
        Swal.showValidationMessage("⚠️ ลำดับเวลาไม่ถูกต้อง");
        return false;
      }

      return { wStart, wEnd, bStart, bEnd };
    },
  });

  if (formData) {
    await updateStaffScheduleFromModal(
      staffId,
      formData.wStart,
      formData.wEnd,
      formData.bStart,
      formData.bEnd
    );
  }
}

/**
 * ✅ UPDATE STAFF SCHEDULE - FIXED
 * เปลี่ยน staff_id → station_staff_id
 * ส่งเวลาครบถ้วน
 */
async function updateStaffScheduleFromModal(
  staffId,
  workStart,
  workEnd,
  breakStart,
  breakEnd
) {
  try {
    Swal.fire({
      title: "กำลังบันทึก...",
      html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #0056B3; margin-top: 12px;"></i>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    console.log('💾 Sending staff schedule update:', {
      station_staff_id: staffId,
      work_start_time: workStart + ":00",
      work_end_time: workEnd + ":00",
      break_start_time: breakStart + ":00",
      break_end_time: breakEnd + ":00",
    });

    const response = await fetch(`${API_BASE_URL}/update_staff_schedule.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_staff_id: staffId,
        work_start_time: workStart + ":00",
        work_end_time: workEnd + ":00",
        break_start_time: breakStart + ":00",
        break_end_time: breakEnd + ":00",
      }),
    });

    const result = await response.json();

    console.log('📥 API Response:', result);

    if (result.success) {
      Swal.close();
      await Swal.fire({
        title: "✅ บันทึกสำเร็จ",
        text: "อัปเดตเวลาทำงานสำเร็จ",
        icon: "success",
        confirmButtonColor: "#1E8449",
      });

      loadStationStaff(currentStationId);
    } else {
      throw new Error(result.message || 'ไม่สามารถบันทึกได้');
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.close();
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      text: error.message,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}

// ========================================
// ✅ 8. ADD DAILY STAFF - NEW
// ========================================
async function showDailyStaffAddModal(stationId = null) {
  try {
    console.log('📋 Opening Daily Staff Add Modal... Station:', stationId);

    if (!stationId) {
      Swal.fire({
        title: "❌ ข้อผิดพลาด",
        text: "ไม่พบข้อมูล Station",
        icon: "error",
        confirmButtonColor: "#C0392B",
      });
      return;
    }

    const { value: formData } = await Swal.fire({
      title: "➕ เพิ่มพนักงาน วัน/OT",
      html: `
        <div style="text-align: left; padding: 15px;">
          <div class="form-group" style="margin-bottom: 15px;">
            <label style="font-weight: 600; display: block; margin-bottom: 8px;">🆔 รหัสพนักงาน *</label>
            <input type="text" id="dailyStaffId" placeholder="เช่น ST001" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          </div>
          <div class="form-group" style="margin-bottom: 15px;">
            <label style="font-weight: 600; display: block; margin-bottom: 8px;">👤 ชื่อพนักงาน *</label>
            <input type="text" id="dailyStaffName" placeholder="เช่น นายสมชาย" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          </div>
          <div class="form-group" style="margin-bottom: 15px;">
            <label style="font-weight: 600; display: block; margin-bottom: 8px;">💼 ตำแหน่ง *</label>
            <input type="text" id="dailyStaffPosition" placeholder="เช่น พยาบาล" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          </div>
          <div class="form-group" style="margin-bottom: 15px;">
            <label style="font-weight: 600; display: block; margin-bottom: 8px;">📌 ประเภท *</label>
            <select id="dailyStaffType" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
              <option value="">-- เลือกประเภท --</option>
              <option value="Daily">วัน</option>
              <option value="OT">OT</option>
              <option value="Daily/OT">วัน/OT</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 15px;">
            <label style="font-weight: 600; display: block; margin-bottom: 8px;">⏰ เวลาเข้างาน *</label>
            <input type="time" id="dailyWorkStart" value="08:00" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          </div>
          <div class="form-group" style="margin-bottom: 15px;">
            <label style="font-weight: 600; display: block; margin-bottom: 8px;">🕔 เวลาออกงาน *</label>
            <input type="time" id="dailyWorkEnd" value="17:00" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          </div>
          <div class="form-group" style="margin-bottom: 15px;">
            <label style="font-weight: 600; display: block; margin-bottom: 8px;">☕ เวลาพักเริ่ม *</label>
            <input type="time" id="dailyBreakStart" value="12:00" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 600; display: block; margin-bottom: 8px;">🕐 เวลาพักจบ *</label>
            <input type="time" id="dailyBreakEnd" value="13:00" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "✅ เพิ่มพนักงาน",
      cancelButtonText: "❌ ยกเลิก",
      confirmButtonColor: "#1E8449",
      cancelButtonColor: "#6c757d",
      preConfirm: () => {
        const staffId = document.getElementById("dailyStaffId").value;
        const staffName = document.getElementById("dailyStaffName").value;
        const position = document.getElementById("dailyStaffPosition").value;
        const staffType = document.getElementById("dailyStaffType").value;

        if (!staffId || !staffName || !position || !staffType) {
          Swal.showValidationMessage("⚠️ กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
          return false;
        }

        return {
          staffId,
          staffName,
          position,
          staffType,
          workStart: document.getElementById("dailyWorkStart").value + ":00",
          workEnd: document.getElementById("dailyWorkEnd").value + ":00",
          breakStart: document.getElementById("dailyBreakStart").value + ":00",
          breakEnd: document.getElementById("dailyBreakEnd").value + ":00",
        };
      },
    });

    if (formData) {
      Swal.fire({
        title: "กำลังบันทึก...",
        html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #0056B3; margin-top: 12px;"></i>',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
      });

      const response = await fetch(`${API_BASE_URL}/add_daily_staff.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_id: stationId,
          staff_id: formData.staffId,
          staff_name: formData.staffName,
          position: formData.position,
          staff_type: formData.staffType,
          work_start_time: formData.workStart,
          work_end_time: formData.workEnd,
          break_start_time: formData.breakStart,
          break_end_time: formData.breakEnd,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Swal.fire({
          title: "✅ เพิ่มสำเร็จ",
          html: `
            <div style="text-align: left; padding: 15px;">
              <p>✅ เพิ่มพนักงาน</p>
              <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 10px 0; font-size: 13px;">
                🆔 <strong>${formData.staffId}</strong><br>
                👤 <strong>${formData.staffName}</strong><br>
                💼 <strong>${formData.position}</strong><br>
                📌 <strong>${formData.staffType}</strong>
              </div>
            </div>
          `,
          icon: "success",
          confirmButtonColor: "#1E8449",
        });

        if (typeof loadStationStaff === 'function') {
          loadStationStaff(stationId);
        }
      } else {
        throw new Error(result.message || "ไม่สามารถเพิ่มได้");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.close();
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      text: error.message,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}

// ========================================
// ✅ 9. ASSIGN OT - NEW
// ========================================
async function openAssignOTModal(stationId = null) {
  try {
    console.log('📋 Opening Assign OT Modal... Station:', stationId);

    if (!stationId) {
      Swal.fire({
        title: "❌ ข้อผิดพลาด",
        text: "ไม่พบข้อมูล Station",
        icon: "error",
        confirmButtonColor: "#C0392B",
      });
      return;
    }

    const staffResponse = await fetch(`${API_BASE_URL}/get_station_staff.php?station_id=${stationId}`);
    const staffResult = await staffResponse.json();

    if (!staffResult.success || !staffResult.data.staff || staffResult.data.staff.length === 0) {
      Swal.fire({
        title: "⚠️ ไม่มีพนักงาน",
        text: "ไม่มีพนักงานที่ทำงานในวันนี้",
        icon: "info",
        confirmButtonColor: "#0056B3",
      });
      return;
    }

    const staffList = staffResult.data.staff;
    let staffOptionsHtml = '';
    staffList.forEach((staff) => {
      const workEnd = formatTime24Hour(staff.work_end_time);
      staffOptionsHtml += `
        <div style="padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s;" class="staff-ot-option" onclick="selectStaffForOT(this, '${staff.station_staff_id}', '${staff.staff_name}', '${workEnd}')">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <div style="font-weight: 700; font-size: 14px; color: #212529;">👤 ${staff.staff_name}</div>
              <div style="font-size: 12px; color: #6c757d; margin-top: 4px;">⏰ ${formatTime24Hour(staff.work_start_time)} - ${workEnd}</div>
            </div>
            <div style="width: 24px; height: 24px; border: 2px solid #0056B3; border-radius: 50%; background: white;" id="radio-${staff.station_staff_id}"></div>
          </div>
        </div>
      `;
    });

    const { value: selectedStaffId } = await Swal.fire({
      title: "➕ มอบหมาย OT ให้พนักงาน",
      html: `
        <div style="text-align: left; padding: 15px;">
          <div style="background: linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%); color: white; padding: 16px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
            <div style="font-size: 18px; font-weight: 700;">👥 เลือกพนักงาน</div>
          </div>
          <label style="font-weight: 600; display: block; margin-bottom: 12px; color: #212529;">เลือกพนักงาน (${staffList.length} คน) *</label>
          <div style="max-height: 300px; overflow-y: auto;">${staffOptionsHtml}</div>
          <div id="selectedStaffInfo" style="display: none; background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #0056B3; margin-top: 15px;">
            <div style="font-weight: 600; margin-bottom: 8px;">✅ เลือก:</div>
            <div id="selectedStaffName"></div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "✅ ถัดไป",
      cancelButtonText: "❌ ยกเลิก",
      confirmButtonColor: "#1E8449",
      cancelButtonColor: "#6c757d",
      preConfirm: () => {
        if (!window.selectedStaffForOT) {
          Swal.showValidationMessage("โปรดเลือกพนักงาน");
          return false;
        }
        return window.selectedStaffForOT;
      },
    });

    if (selectedStaffId) {
      const { value: otTimeData } = await Swal.fire({
        title: "⏱️ ใส่เวลา OT",
        html: `
          <div style="text-align: left; padding: 15px;">
            <div style="background: linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%); color: white; padding: 16px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700;">👤 ${selectedStaffId.staffName}</div>
            </div>
            <div style="margin-bottom: 15px;">
              <label style="font-weight: 600; display: block; margin-bottom: 8px;">⏰ เวลาเริ่มทำ OT *</label>
              <input type="time" id="otStartTime" value="${selectedStaffId.workEnd}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
              <small style="color: #6c757d; display: block; margin-top: 4px;">💡 ค่าเริ่มต้น: ${selectedStaffId.workEnd}</small>
            </div>
            <div style="margin-bottom: 15px;">
              <label style="font-weight: 600; display: block; margin-bottom: 8px;">🕐 เวลาเลิกทำ OT *</label>
              <input type="time" id="otEndTime" value="18:00" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>
            <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #FF6B6B; margin-top: 15px;">
              <div style="font-weight: 600; color: #212529;">📊 ชั่วโมง OT</div>
              <div id="otHoursDisplay" style="font-size: 24px; font-weight: 700; color: #FF6B6B; margin-top: 8px;">1.00 ชั่วโมง</div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "✅ บันทึก OT",
        cancelButtonText: "❌ ยกเลิก",
        confirmButtonColor: "#FF6B6B",
        cancelButtonColor: "#6c757d",
        didOpen: () => {
          const otStartInput = document.getElementById('otStartTime');
          const otEndInput = document.getElementById('otEndTime');
          const calculateOTHours = () => {
            const [startH, startM] = otStartInput.value.split(':').map(Number);
            const [endH, endM] = otEndInput.value.split(':').map(Number);
            let diffMin = (endH * 60 + endM) - (startH * 60 + startM);
            if (diffMin < 0) diffMin += 24 * 60;
            document.getElementById('otHoursDisplay').innerHTML = `${(diffMin / 60).toFixed(2)} ชั่วโมง`;
          };
          otStartInput.addEventListener('change', calculateOTHours);
          otEndInput.addEventListener('change', calculateOTHours);
          calculateOTHours();
        },
        preConfirm: () => {
          const otStartTime = document.getElementById('otStartTime').value;
          const otEndTime = document.getElementById('otEndTime').value;
          if (!otStartTime || !otEndTime) {
            Swal.showValidationMessage("⚠️ กรุณาใส่เวลา OT");
            return false;
          }
          if (otStartTime >= otEndTime) {
            Swal.showValidationMessage("⚠️ เวลาเลิก OT ต้องหลังจากเวลาเริ่ม");
            return false;
          }
          return { otStartTime: otStartTime + ':00', otEndTime: otEndTime + ':00' };
        },
      });

      if (otTimeData) {
        Swal.fire({
          title: "กำลังบันทึก OT...",
          html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #FF6B6B; margin-top: 12px;"></i>',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
        });

        const response = await fetch(`${API_BASE_URL}/assign_staff_ot.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            station_staff_id: selectedStaffId.staffId,
            station_id: stationId,
            ot_start_time: otTimeData.otStartTime,
            ot_end_time: otTimeData.otEndTime,
          }),
        });

        const result = await response.json();
        if (result.success) {
          const [startH, startM] = otTimeData.otStartTime.split(':').map(Number);
          const [endH, endM] = otTimeData.otEndTime.split(':').map(Number);
          const hours = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;

          Swal.fire({
            title: "✅ บันทึกสำเร็จ",
            html: `
              <div style="text-align: left; padding: 15px;">
                <p>✅ มอบหมาย OT สำเร็จ</p>
                <div style="background: #fff3cd; padding: 12px; border-radius: 8px; margin: 10px 0; font-size: 13px; border-left: 4px solid #FF6B6B;">
                  👤 <strong>${selectedStaffId.staffName}</strong><br>
                  ⏰ ${otTimeData.otStartTime.substring(0, 5)} - ${otTimeData.otEndTime.substring(0, 5)}<br>
                  📊 <strong>${hours.toFixed(2)} ชั่วโมง</strong>
                </div>
              </div>
            `,
            icon: "success",
            confirmButtonColor: "#FF6B6B",
          });

          if (typeof loadStationStaff === 'function') {
            loadStationStaff(stationId);
          }
        } else {
          throw new Error(result.message || "ไม่สามารถบันทึก OT ได้");
        }
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.close();
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      text: error.message,
      icon: "error",
      confirmButtonColor: "#C0392B",
    });
  }
}

function selectStaffForOT(element, staffId, staffName, workEnd) {
  document.querySelectorAll('.staff-ot-option').forEach(el => {
    el.style.borderColor = '#e9ecef';
    el.style.background = 'white';
  });
  element.style.borderColor = '#0056B3';
  element.style.background = 'rgba(0, 86, 179, 0.05)';
  document.querySelectorAll('[id^="radio-"]').forEach(radio => {
    radio.style.background = 'white';
  });
  document.getElementById(`radio-${staffId}`).style.background = '#0056B3';
  document.getElementById('selectedStaffInfo').style.display = 'block';
  document.getElementById('selectedStaffName').innerHTML = `👤 <strong>${staffName}</strong>`;
  window.selectedStaffForOT = { staffId, staffName, workEnd };
}

// ========================================
// ✅ MONTHLY STAFF IMPORT MODAL
// ========================================

function showMonthlyStaffImportModal(stationId = null) {
    console.log('📋 Opening Monthly Staff Import Modal... Station:', stationId);
    
    try {
        let modal = document.getElementById('monthlyStaffImportModal');
        
        if (!modal) {
            console.log('⚠️ Modal element not found, creating new one...');
            createMonthlyStaffImportModal();
            modal = document.getElementById('monthlyStaffImportModal');
        }
        
        if (stationId) {
            window.currentStationIdForImport = stationId;
            console.log('✅ Set station ID:', stationId);
        }
        
        if (modal) {
            modal.style.display = 'block';
            console.log('✅ Monthly Staff Import Modal opened');
        } else {
            console.error('❌ Failed to create or open modal');
            alert('❌ ไม่สามารถเปิด Modal ได้');
        }
        
    } catch (error) {
        console.error('❌ Error opening modal:', error);
        alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    }
}

function createMonthlyStaffImportModal() {
    const modalHTML = `
    <div id="monthlyStaffImportModal" class="modal" style="z-index: 1005; display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center;">
        <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto; background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div class="modal-header" style="background: linear-gradient(135deg, #0056B3 0%, #0047AB 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
                <h2 class="modal-title" style="margin: 0; font-size: 18px; font-weight: 700;">📋 นำเข้าข้อมูลพนักงานรายเดือน</h2>
                <button class="close-modal" onclick="closeMonthlyStaffImportModal()" style="background: none; border: none; color: white; font-size: 28px; cursor: pointer;">&times;</button>
            </div>
            
            <div class="modal-body" style="padding: 20px;">
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="importMonth" class="form-label" style="font-weight: 600; display: block; margin-bottom: 8px;">เลือกเดือน - ปี:</label>
                    <input type="month" id="importMonth" class="form-control" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;" />
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="staffImportFile" class="form-label" style="font-weight: 600; display: block; margin-bottom: 8px;">อัปโหลดไฟล์ CSV หรือ Excel:</label>
                    <input type="file" id="staffImportFile" class="form-control" accept=".csv,.xlsx,.xls" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" />
                    <small style="color: #666; display: block; margin-top: 8px;">✅ รองรับ: CSV, Excel (.xlsx, .xls)</small>
                </div>

                <div class="form-group" style="background: rgba(173, 216, 230, 0.2); padding: 15px; border-radius: 8px; border-left: 4px solid #0056B3; margin-bottom: 20px;">
                    <label class="form-label" style="font-weight: 700; display: block; margin-bottom: 10px;">📋 รูปแบบไฟล์ที่ต้องใช้:</label>
                    <div style="font-size: 12px; color: #333;">
                        <div style="margin-bottom: 5px;">• <strong>staff_id</strong>: รหัสพนักงาน</div>
                        <div style="margin-bottom: 5px;">• <strong>staff_name</strong>: ชื่อพนักงาน</div>
                        <div style="margin-bottom: 5px;">• <strong>position</strong>: ตำแหน่ง</div>
                        <div>• <strong>work_type</strong>: ประเภท</div>
                    </div>
                </div>

                <div class="form-group" id="importPreviewContainer" style="display: none; margin-bottom: 20px;">
                    <label class="form-label" style="font-weight: 600; display: block; margin-bottom: 8px;">📊 ตัวอย่างข้อมูล:</label>
                    <div id="importPreview" style="background: #f5f5f5; padding: 10px; border-radius: 8px; max-height: 200px; overflow-y: auto; font-size: 12px; font-family: monospace; border: 1px solid #ddd;"></div>
                </div>

                <div id="importMessages" style="display: none; margin-bottom: 20px;"></div>
            </div>

            <div class="modal-footer" style="border-top: 1px solid #ddd; padding: 15px; display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" onclick="closeMonthlyStaffImportModal()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-times"></i> ยกเลิก
                </button>
                <button type="button" onclick="previewStaffImportData()" style="background: #FFC107; color: black; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-eye"></i> ดูตัวอย่าง
                </button>
                <button type="button" onclick="submitStaffImport()" style="background: #1E8449; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-upload"></i> นำเข้าข้อมูล
                </button>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const fileInput = document.getElementById('staffImportFile');
    if (fileInput) {
        fileInput.addEventListener('change', onStaffFileSelected);
    }
    
    const monthInput = document.getElementById('importMonth');
    if (monthInput) {
        monthInput.valueAsDate = new Date();
    }
    
    console.log('✅ Monthly Staff Import Modal created');
}

function onStaffFileSelected(event) {
    const file = event.target.files[0];
    console.log('📁 File selected:', file?.name);
    
    if (!file) {
        document.getElementById('importPreviewContainer').style.display = 'none';
        return;
    }
    
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
        showImportMessage('❌ ชนิดไฟล์ไม่ถูก กรุณาเลือก CSV หรือ Excel', 'error');
        event.target.value = '';
        return;
    }
    
    showImportMessage('✅ ไฟล์พร้อม กรุณากด "ดูตัวอย่าง"', 'success');
}

function previewStaffImportData() {
    const file = document.getElementById('staffImportFile').files[0];
    
    if (!file) {
        showImportMessage('❌ กรุณาเลือกไฟล์', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const lines = content.split('\n').slice(0, 6);
            
            const previewHTML = `<pre style="font-family: 'Courier New'; white-space: pre-wrap;">${
                lines.map(line => {
                    return line.replace(/[<>&'"]/g, c => {
                        return {'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&#39;','"':'&quot;'}[c];
                    });
                }).join('\n')
            }</pre>`;
            
            document.getElementById('importPreview').innerHTML = previewHTML;
            document.getElementById('importPreviewContainer').style.display = 'block';
            showImportMessage('✅ ตัวอย่างข้อมูล พร้อมบันทึก', 'success');
            
        } catch (error) {
            showImportMessage('❌ เกิดข้อผิดพลาดในการอ่านไฟล์', 'error');
        }
    };
    reader.readAsText(file);
}

// ✅ FIXED: submitStaffImport function
// Replace the function in your 08-staff-schedule-management.js with this version

async function submitStaffImport() {
    const file = document.getElementById('staffImportFile').files[0];
    const month = document.getElementById('importMonth').value;
    const stationId = window.currentStationIdForImport || null;
    
    if (!file) {
        showImportMessage('❌ กรุณาเลือกไฟล์', 'error');
        return;
    }
    
    if (!month) {
        showImportMessage('❌ กรุณาเลือกเดือน - ปี', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('month', month);
        if (stationId) {
            formData.append('station_id', stationId);
        }
        
        const apiUrl = typeof getApiUrl === 'function' 
            ? getApiUrl('import_monthly_staff.php')
            : (API_BASE_URL || '/hospital/api') + '/import_monthly_staff.php';
        
        console.log('📤 Uploading file:', file.name, 'to', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Content-Type:', response.headers.get('content-type'));
        
        // ✅ Handle HTTP errors
        if (!response.ok) {
            const text = await response.text();
            console.error('❌ HTTP Error:', response.status, text.substring(0, 200));
            showImportMessage(`❌ Server error (${response.status})`, 'error');
            return;
        }
        
        // ✅ Check Content-Type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Wrong Content-Type:', contentType);
            console.error('Response:', text.substring(0, 200));
            showImportMessage('❌ Server returned wrong content type', 'error');
            return;
        }
        
        // ✅ Parse JSON
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            const text = await response.text();
            console.error('❌ JSON Parse Error:', jsonError);
            console.error('Response:', text.substring(0, 300));
            showImportMessage('❌ Invalid JSON response from server', 'error');
            return;
        }
        
        // ✅ Handle API response
        if (result.success) {
            const importedCount = result.imported_count || 0;
            const totalProcessed = result.total_rows_processed || 0;
            const errorCount = result.errors?.length || 0;
            
            let message = `✅ นำเข้าข้อมูลสำเร็จ (${importedCount}/${totalProcessed} รายการ`;
            if (errorCount > 0) {
                message += `, ข้ามไป ${errorCount}`;
            }
            message += ')';
            
            console.log('✅ Import success:', result);
            showImportMessage(message, 'success');
            
            setTimeout(() => {
                closeMonthlyStaffImportModal();
                if (typeof loadStationStaff === 'function' && stationId) {
                    loadStationStaff(stationId);
                }
            }, 1500);
        } else {
            console.error('❌ Import failed:', result);
            showImportMessage('❌ เกิดข้อผิดพลาด: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        console.error('Error type:', error.constructor.name);
        showImportMessage('❌ เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
}

function showImportMessage(message, type) {
    const messageDiv = document.getElementById('importMessages');
    const bgColor = type === 'error' ? 'rgba(255, 100, 100, 0.15)' : 'rgba(100, 200, 100, 0.15)';
    const borderColor = type === 'error' ? '#ff6464' : '#64c864';
    
    messageDiv.innerHTML = `
        <div style="background: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 12px; border-radius: 4px;">
            ${message}
        </div>
    `;
    messageDiv.style.display = 'block';
}

function closeMonthlyStaffImportModal() {
    const modal = document.getElementById('monthlyStaffImportModal');
    if (modal) {
        modal.style.display = 'none';
        const fileInput = document.getElementById('staffImportFile');
        if (fileInput) fileInput.value = '';
        
        const messagesDiv = document.getElementById('importMessages');
        if (messagesDiv) messagesDiv.style.display = 'none';
        
        const previewContainer = document.getElementById('importPreviewContainer');
        if (previewContainer) previewContainer.style.display = 'none';
        
        console.log('✅ Monthly Staff Import Modal closed');
    }
}

document.addEventListener('click', function(event) {
    const modal = document.getElementById('monthlyStaffImportModal');
    if (modal && event.target === modal) {
        closeMonthlyStaffImportModal();
    }
});