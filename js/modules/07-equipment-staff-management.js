/**
 * 🔧 Equipment & Staff Management Module - WITH AUTO TOGGLE
 * จัดการเครื่องมือและพนักงานในห้อง + auto toggle เครื่องมือตามพนักงาน
 * 
 * ✅ FEATURES:
 * - Add/Remove equipment
 * - Toggle equipment status
 * - Add staff to room → auto toggle equipment
 * - Remove staff from room → auto toggle equipment
 * - Auto toggle: เครื่องมือที่ต้องใช้พนักงาน → เปิด/ปิด ตามจำนวนพนักงาน
 * - Auto toggle: เครื่องมือที่ไม่ต้องใช้พนักงาน → เปิดตลอด
 */

// ========================================
// ✅ AUTO TOGGLE EQUIPMENT
// ========================================

/**
 * Auto Toggle Equipment based on Staff Count
 * เรียกฟังก์ชันนี้เมื่อมีการเพิ่ม/ลบพนักงาน
 * 
 * @param {number} roomId - Room ID
 */
async function autoToggleEquipment(roomId) {
  try {
    console.log("🔄 Auto toggling equipment for room:", roomId);

    const response = await fetch(`${API_BASE_URL}/manage_room_equipment.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "auto_toggle",
        room_id: roomId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", errorText);
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Auto toggle result:", result);

    if (result.success) {
      const data = result.data;
      const toggleResults = data.toggle_results || [];
      
      console.log(`📊 Staff count: ${data.staff_count}`);
      
      // แสดง log สำหรับแต่ละเครื่องมือ
      toggleResults.forEach(eq => {
        if (eq.auto_toggled) {
          const status = eq.is_active ? "✓ เปิด" : "✗ ปิด";
          console.log(`🔄 ${eq.equipment_name} → ${status} (auto toggled)`);
        }
      });

      return result.data;
    } else {
      console.error("❌ Error:", result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("❌ Auto toggle error:", error);
    // ไม่ต้องแสดง error alert เพราะเป็น background task
  }
}

// ========================================
// ✅ EQUIPMENT MANAGEMENT
// ========================================

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
    Swal.fire({
      title: '⚠️ กรุณากรอกชื่อเครื่องมือ',
      icon: 'warning',
      confirmButtonColor: '#ffc107',
    });
    return;
  }

  try {
    // Show loading
    Swal.fire({
      title: 'กำลังเพิ่มเครื่องมือ...',
      html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #0066cc;"></i>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

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
      Swal.close();
      
      await Swal.fire({
        title: '✅ เพิ่มสำเร็จ',
        html: `<p>เพิ่มเครื่องมือ <strong>"${equipmentName}"</strong> แล้ว</p>`,
        icon: 'success',
        confirmButtonColor: '#1E8449',
        timer: 1500,
        timerProgressBar: true,
      });

      closeAddEquipmentModal();
      openRoomDetail(currentRoomId);
    } else {
      Swal.close();
      
      Swal.fire({
        title: '❌ ข้อผิดพลาด',
        html: `<p>${result.message}</p>`,
        icon: 'error',
        confirmButtonColor: '#dc3545',
      });
    }
  } catch (error) {
    console.error("Error adding equipment:", error);
    Swal.close();
    
    Swal.fire({
      title: '❌ เกิดข้อผิดพลาด',
      html: `<p><strong>${error.message}</strong></p><p style="font-size: 13px; color: #999;">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์</p>`,
      icon: 'error',
      confirmButtonColor: '#dc3545',
    });
  }
}

/**
 * Remove Equipment from Room
 * ✅ Modern SweetAlert2 modal + handle undefined equipment_name
 * 
 * @param {number} equipmentId - Equipment ID
 * @param {string} equipmentName - Equipment Name
 */
async function removeEquipment(equipmentId, equipmentName) {
  // ✅ Handle undefined equipmentName
  if (!equipmentName || equipmentName === 'undefined') {
    equipmentName = `Equipment #${equipmentId}`;
  }

  // ✅ Modern SweetAlert2 modal
  const result = await Swal.fire({
    title: '⚠️ ยืนยันการลบ',
    html: `
      <div style="text-align: left; padding: 15px;">
        <p>ต้องการลบเครื่องมือ <strong>"${equipmentName}"</strong> ออกจากห้องใช่หรือ?</p>
        <div style="margin-top: 12px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; font-size: 13px; color: #856404;">
          <i class="fas fa-exclamation-triangle"></i> การลบนี้ไม่สามารถกู้คืนได้
        </div>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '🗑️ ลบเลย',
    cancelButtonText: '❌ ยกเลิก',
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    // Show loading
    Swal.fire({
      title: 'กำลังลบ...',
      html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #dc3545;"></i>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    const response = await fetch(`${API_BASE_URL}/manage_room_equipment.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remove",
        equipment_id: equipmentId,
      }),
    });

    const data = await response.json();

    if (data.success) {
      Swal.close();
      
      // ✅ Success modal
      await Swal.fire({
        title: '✅ ลบสำเร็จ',
        html: `<p>ลบเครื่องมือ <strong>"${equipmentName}"</strong> ออกจากห้องแล้ว</p>`,
        icon: 'success',
        confirmButtonColor: '#1E8449',
        timer: 1500,
        timerProgressBar: true,
      });

      openRoomDetail(currentRoomId);
    } else {
      Swal.close();
      
      // ✅ Error modal
      Swal.fire({
        title: '❌ ข้อผิดพลาด',
        html: `<p>${data.message || 'ไม่สามารถลบเครื่องมือได้'}</p>`,
        icon: 'error',
        confirmButtonColor: '#dc3545',
      });
    }
  } catch (error) {
    console.error("Error removing equipment:", error);
    Swal.close();
    
    Swal.fire({
      title: '❌ เกิดข้อผิดพลาด',
      html: `<p><strong>${error.message}</strong></p><p style="font-size: 13px; color: #999;">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์</p>`,
      icon: 'error',
      confirmButtonColor: '#dc3545',
    });
  }
}

/**
 * Toggle Equipment Status (Manual)
 * 
 * @param {number} equipmentId - Equipment ID
 * @param {boolean} isActive - Is active
 */
async function toggleEquipment(equipmentId, isActive) {
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
      Swal.fire({
        title: '❌ ข้อผิดพลาด',
        html: `<p>${result.message}</p>`,
        icon: 'error',
        confirmButtonColor: '#dc3545',
      });
      openRoomDetail(currentRoomId);
    }
  } catch (error) {
    console.error("Error toggling equipment:", error);
    Swal.fire({
      title: '❌ เกิดข้อผิดพลาด',
      html: `<p><strong>${error.message}</strong></p>`,
      icon: 'error',
      confirmButtonColor: '#dc3545',
    });
    openRoomDetail(currentRoomId);
  }
}

// ========================================
// ✅ STAFF MANAGEMENT
// ========================================

/**
 * Open Add Staff Modal to show available staff
 */
async function openAddStaffModal(roomId) {
  currentRoomId = roomId;
  if (!currentRoomId) {
    Swal.fire({
      title: '❌ ข้อผิดพลาด',
      text: 'ไม่พบข้อมูลห้องปัจจุบัน',
      icon: 'error',
      confirmButtonColor: '#dc3545',
    });
    return;
  }

  try {
    const today = new Date();
    const workDate = today.toISOString().split("T")[0];

    const staffResponse = await fetch(
      `${API_BASE_URL}/get_available_staff.php?room_id=${currentRoomId}&work_date=${workDate}`
    );
    const staffData = await staffResponse.json();

    if (staffData.success) {
      const availableStaff = staffData.data || [];

      if (availableStaff.length === 0) {
        Swal.fire({
          title: "⚠️ ไม่มีพนักงานว่าง",
          text: "ไม่มีพนักงานว่างสำหรับเพิ่มในห้องนี้",
          icon: "info",
          confirmButtonColor: "#0066cc",
        });
        return;
      }

      let staffHTML = `
        <select id="staffSelect" style="width: 100%; padding: 8px; font-size: 14px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="">-- เลือกพนักงาน --</option>
      `;

      availableStaff.forEach((staff) => {
        const workStart = staff.work_start_time
          ? staff.work_start_time.substring(0, 5)
          : "-";
        const workEnd = staff.work_end_time
          ? staff.work_end_time.substring(0, 5)
          : "-";

        staffHTML += `
          <option value="${staff.station_staff_id}" data-name="${staff.staff_name}" data-type="${staff.staff_type || "Staff"}">
            ${staff.staff_name} (${workStart} - ${workEnd})
          </option>
        `;
      });

      staffHTML += `</select>`;

      const confirmResult = await Swal.fire({
        title: "👥 เพิ่มพนักงาน",
        html: staffHTML,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "✅ เพิ่ม",
        cancelButtonText: "❌ ยกเลิก",
        confirmButtonColor: "#1E8449",
        cancelButtonColor: "#6c757d",
        didOpen: () => {
          const selectEl = document.getElementById("staffSelect");
          if (selectEl) {
            selectEl.focus();
          }
        },
      });

      if (confirmResult.isConfirmed) {
        const staffSelect = document.getElementById("staffSelect");
        const selectedValue = staffSelect.value;

        if (!selectedValue) {
          Swal.fire({
            title: "⚠️ กรุณาเลือกพนักงาน",
            icon: "warning",
            confirmButtonColor: "#ffc107",
          });
          return;
        }

        await addStaffToRoom(parseInt(selectedValue));
      }
    } else {
      Swal.fire({
        title: "❌ ข้อผิดพลาด",
        text: staffData.message || "ไม่สามารถดึงข้อมูลพนักงาน",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      text: error.message,
      icon: "error",
      confirmButtonColor: "#dc3545",
    });
  }
}

/**
 * Close Add Staff Modal
 */
function closeAddStaffModal() {
  // ไม่ต้องใช้แล้ว เพราะใช้ Swal modal แทน
}

/**
 * Add Staff to Room + Auto Toggle Equipment
 * 
 * @param {number} stationStaffId - Station Staff ID
 */
async function addStaffToRoom(stationStaffId) {
  try {
    // Show loading
    Swal.fire({
      title: 'กำลังเพิ่มพนักงาน...',
      html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #0066cc;"></i>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    const selectedOption = document.querySelector(
      `#staffSelect option[value="${stationStaffId}"]`
    );

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
      Swal.close();

      // ✅ Auto toggle equipment after adding staff
      console.log("🔄 Auto toggling equipment after adding staff...");
      await autoToggleEquipment(currentRoomId);

      await Swal.fire({
        title: "✅ สำเร็จ",
        text: "เพิ่มพนักงานสำเร็จ",
        icon: "success",
        confirmButtonColor: '#1E8449',
        timer: 1500,
        timerProgressBar: true,
      });

      // Refresh room detail
      openRoomDetail(currentRoomId);

      if (currentStationId) {
        loadStationStaff(currentStationId);
      }
    } else {
      Swal.close();
      
      Swal.fire({
        title: "❌ ข้อผิดพลาด",
        text: result.message,
        icon: "error",
        confirmButtonColor: '#dc3545',
      });
    }
  } catch (error) {
    console.error("Error:", error);
    Swal.close();
    
    Swal.fire({
      title: "❌ เกิดข้อผิดพลาด",
      html: `<p>ไม่สามารถเพิ่มพนักงานได้</p><p style="font-size: 13px; color: #999;">${error.message}</p>`,
      icon: "error",
      confirmButtonColor: '#dc3545',
    });
  }
}

// ========================================
// ✅ REMOVE STAFF FROM ROOM
// ========================================

/**
 * Remove Room Staff + Auto Toggle Equipment
 * 
 * @param {number} stationStaffId - Station Staff ID
 * @param {string} staffName - Staff Name
 */
async function removeRoomStaff(stationStaffId, staffName) {
  try {
    const confirmResult = await Swal.fire({
      title: "⚠️ ยืนยันการลบ",
      html: `
        <div style="text-align: left; padding: 15px;">
          <p>ต้องการลบ <strong>${staffName}</strong> ออกจากห้องนี้ใช่หรือ?</p>
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

    console.log(`🗑️ ลบพนักงานออกจากห้อง - station_staff_id: ${stationStaffId}`);

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

      // ✅ Auto toggle equipment after removing staff
      console.log("🔄 Auto toggling equipment after removing staff...");
      await autoToggleEquipment(currentRoomId);

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

      // Refresh room detail
      openRoomDetail(currentRoomId);
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
// ✅ REMOVE DOCTOR FROM ROOM
// ========================================

/**
 * Remove Room Doctor
 * 
 * @param {number} stationDoctorId - Station Doctor ID
 * @param {string} doctorName - Doctor Name
 */
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

      const response = await fetch(
        `${API_BASE_URL}/manage_room_doctors.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "remove",
            station_doctor_id: stationDoctorId,
          }),
        }
      );

      const data = await response.json();
      console.log("✅ ผลลัพธ์:", data);

      if (data.success) {
        // ✅ ลบ Doctor Card ออกจาก DOM
        const doctorCards = document.querySelectorAll(".doctor-card");
        let removedCard = null;

        doctorCards.forEach((card) => {
          const deleteBtn = card.querySelector(
            `button[onclick*="removeRoomDoctor(${stationDoctorId}"]`
          );
          if (deleteBtn) {
            removedCard = card;
            card.style.transition = "all 0.3s ease";
            card.style.opacity = "0";
            card.style.transform = "translateX(-20px)";

            setTimeout(() => {
              card.remove();
              console.log("✅ ลบ doctor card ออกจาก DOM แล้ว");

              const remainingDoctors =
                document.querySelectorAll(".doctor-card").length;
              updateDoctorSection(remainingDoctors);
            }, 300);
          }
        });

        function updateDoctorSection(remainingCount) {
          const doctorHeader = document.querySelector("#roomDoctorsSection h3");
          if (doctorHeader) {
            doctorHeader.innerHTML = `
              <span style="color: var(--text-secondary);">👨‍⚕️</span> แพทย์ 
              <span style="color: var(--text-muted); font-weight: 500;">(${remainingCount} คน)</span>
            `;
          }

          if (remainingCount === 0) {
            const container = document.getElementById("roomDoctorsSection");
            if (container) {
              const addButton = container.querySelector("button");
              const buttonHtml = addButton ? addButton.outerHTML : "";

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

        await Swal.fire({
          title: "✅ ลบสำเร็จ",
          text: `ลบแพทย์ "${doctorName}" ออกจากห้องแล้ว`,
          icon: "success",
          confirmButtonColor: "#1E8449",
        });

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

// ========================================
// 🛑 EXPORTS (สำหรับ ES Modules)
// ========================================

// export {
//   autoToggleEquipment,
//   openAddEquipmentModal,
//   closeAddEquipmentModal,
//   addEquipmentToRoom,
//   removeEquipment,
//   toggleEquipment,
//   openAddStaffModal,
//   closeAddStaffModal,
//   addStaffToRoom,
//   removeRoomStaff,
//   removeRoomDoctor
// };