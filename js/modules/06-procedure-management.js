/**
 * 💉 Procedure Management Module - FIXED
 * จัดการหัตถการในห้อง - เพิ่ม ลบ แก้ไข
 * ✅ Fixed: Safe null checks before accessing container
 * 
 * Features:
 * - Display room procedures
 * - Assign procedures to room
 * - Remove procedure from room
 * - Edit procedure details
 * - Search & filter procedures
 */

// ========================================
// ✅ GLOBAL VARIABLES
// ========================================

let currentProceduresList = [];

// ========================================
// ✅ VERIFY PROCEDURES ADDED TO DATABASE
// ========================================

/**
 * Verify that procedures were actually added to the database
 * @param {number} roomId - Room ID
 * @param {array} procedureIds - Array of procedure IDs that should exist
 * @returns {Promise<boolean>} true if all procedures found in DB
 */
async function verifyProceduresAdded(roomId, procedureIds) {
  try {
    console.log(`🔍 Verifying ${procedureIds.length} procedures in DB...`);
    
    const response = await fetch(
      `${getApiUrl('get_room_detail.php')}?room_id=${roomId}&t=${Date.now()}`,
      { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
    
    const result = await response.json();
    const addedProcedures = result.data.procedures || [];
    const addedIds = new Set(addedProcedures.map(p => parseInt(p.procedure_id)));
    
    const allFound = procedureIds.every(id => addedIds.has(parseInt(id)));
    
    console.log(`✅ Verification result: ${allFound ? 'PASSED ✓' : 'FAILED ✗'}`);
    console.log(`   Expected: ${procedureIds.length} procedures`);
    console.log(`   Found: ${addedProcedures.length} procedures`);
    
    return allFound;
  } catch (error) {
    console.error("❌ Verification error:", error);
    return false;
  }
}

// ========================================
// ✅ DISPLAY ROOM PROCEDURES - FIXED
// ========================================

/**
 * Display Room Procedures - Modern Design
 * ✅ Fixed: Safe null check on container
 * 
 * @param {array} procedures - Array of procedure objects
 */
function displayRoomProcedures(procedures) {
  const container = document.getElementById("roomProceduresSection");

  // ✅ Safe check: if container not found, skip
  if (!container) {
    console.warn("⚠️ roomProceduresSection not found - skipping procedures display");
    return;
  }

  if (!procedures || procedures.length === 0) {
    container.innerHTML = `
      <div style="
        text-align: center;
        padding: 30px 20px;
        background: #f8f9fa;
        border-radius: 8px;
        color: #adb5bd;
      ">
        <i class="fas fa-syringe" style="font-size: 32px; margin-bottom: 10px; opacity: 0.5;"></i>
        <div style="font-size: 13px;">ไม่มีหัตถการในห้องนี้</div>
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
    <div style="display: grid; gap: 12px;">
  `;

  procedures.forEach((proc, idx) => {
    const isEquipmentRequired =
      proc.equipment_required == 1 || proc.equipment_required === true;
    const procId = `proc-${proc.procedure_id || idx}`;
    const totalTime =
      parseInt(proc.wait_time ?? 0) + parseInt(proc.procedure_time ?? 0);
    const Procedurepdp_id = proc.Procedurepdp_id || 'N/A';  // ✅ เพิ่ม

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
              <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${proc.wait_time ?? 0}</div>
              <div style="font-size: 11px; color: var(--text-muted);">นาที</div>
            </div>
            
            <div style="background: var(--surface); padding: 16px; border-radius: 10px; border: 1px solid var(--border);">
              <div style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 6px;">⚕️ เวลาทำ</div>
              <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${proc.procedure_time ?? 0}</div>
              <div style="font-size: 11px; color: var(--text-muted);">นาที</div>
            </div>

            <div style="background: var(--surface); padding: 16px; border-radius: 10px; border: 1px solid var(--border);">
              <div style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 6px;">👥 พนักงาน</div>
              <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${proc.staff_required ?? 0}</div>
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
            <button class="btn" style="background: var(--secondary-color); color: white;" onclick="toggleProcedureDetail('${procId}'); event.stopPropagation();">
              <i class="fas fa-chevron-up"></i> ปิด
            </button>
            
            <button class="btn btn-danger" onclick="removeProcedureFromRoom(${proc.room_procedure_id}, '${proc.procedure_name}'); event.stopPropagation();">
              <i class="fas fa-trash"></i>
            </button>
          </div> 
        </div>
      </div>
    `;
  });

  html += "</div>";
  
  // ✅ Safe update with check
  if (container) {
    container.innerHTML = html;
    console.log("✅ Procedures section updated:", procedures.length, "items");
  }
}

// ========================================
// ✅ TOGGLE PROCEDURE DETAIL
// ========================================

/**
 * Toggle individual procedure detail
 * 
 * @param {string} procId - Procedure ID
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

// ========================================
// ✅ OPEN ASSIGN PROCEDURE MODAL
// ========================================

/**
 * Open Modal to Assign Procedure to Room
 * 
 * @param {number} roomId - Room ID
 */
async function openAssignProcedureModal(roomId) {
  try {
    currentRoomId = roomId;

    console.log("🔋 โหลดหัตถการสำหรับห้อง:", roomId);

    // ✅ ดึงข้อมูลห้องและหัตถการที่มีอยู่
    const roomDetailResponse = await fetch(
      `${getApiUrl('get_room_detail.php')}?room_id=${roomId}`
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
      `${getApiUrl('get_station_procedures.php')}?station_id=${currentStationId}`
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
        text: "หัตถการทั้งหมดของสเตชันนี้มีในห้องแล้ว",
        confirmButtonColor: "#0056B3",
      });
      return;
    }

    // ✅ สร้าง Modal พร้อมฟีเจอร์ค้นหา
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

// ========================================
// ✅ DISPLAY ASSIGN PROCEDURE MODAL WITH SEARCH
// ========================================

/**
 * Display Assign Procedure Modal with Search Functionality
 * 
 * @param {array} availableProcedures - Available procedures
 * @param {array} existingProcedures - Existing procedures in room
 * @param {object} room - Room object
 */
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
              <i class="fas fa-check-circle"></i> เพิ่มแล้ว (${existingProcedures.length})
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
    procedureOptions += `
      <div class="procedure-option" data-id="${proc.procedure_id}" data-name="${proc.procedure_name}" style="
          padding: 12px 14px;
          border: 2px solid #f0f0f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
      "
      onclick="toggleProcedureOption(this, ${proc.procedure_id}, '${proc.procedure_name.replace(/'/g, "\\'")}')"
      onmouseover="this.style.borderColor='#d0d0d0'; this.style.background='#fafafa';"
      onmouseout="this.style.borderColor='#f0f0f0'; this.style.background='white';">
          <input type="checkbox" class="procedure-checkbox" value="${proc.procedure_id}" style="
              width: 18px;
              height: 18px;
              cursor: pointer;
              flex-shrink: 0;
          ">
          <div style="flex: 1; min-width: 0;">
              <div style="
                  font-weight: 600;
                  color: #212529;
                  font-size: 13px;
                  margin-bottom: 4px;
              ">
                  ${proc.procedure_name}
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
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <label style="
                      font-weight: 600;
                      color: #212529;
                      font-size: 13px;
                      margin: 0;
                  ">
                      ค้นหาและเลือกหัตถการ *
                  </label>
                  <div style="display: flex; gap: 6px;">
                      <button onclick="selectAllProcedures()" style="
                          padding: 4px 12px;
                          font-size: 11px;
                          border: 1px solid #4caf50;
                          background: #e8f5e9;
                          color: #2e7d32;
                          border-radius: 4px;
                          cursor: pointer;
                          font-weight: 600;
                          transition: all 0.2s;
                      " onmouseover="this.style.background='#c8e6c9'" onmouseout="this.style.background='#e8f5e9'">
                          ✅ เลือกทั้งหมด
                      </button>
                      <button onclick="deselectAllProcedures()" style="
                          padding: 4px 12px;
                          font-size: 11px;
                          border: 1px solid #f44336;
                          background: #ffebee;
                          color: #c62828;
                          border-radius: 4px;
                          cursor: pointer;
                          font-weight: 600;
                          transition: all 0.2s;
                      " onmouseover="this.style.background='#ef9a9a'" onmouseout="this.style.background='#ffebee'">
                          ❌ ล้างทั้งหมด
                      </button>
                  </div>
              </div>
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
      updateSelectedCount();

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

// ========================================
// ✅ TOGGLE PROCEDURE OPTION & SEARCH
// ========================================

/**
 * ✅ Select All Procedures
 */
function selectAllProcedures() {
  document.querySelectorAll(".procedure-checkbox").forEach((checkbox) => {
    if (!checkbox.checked) {
      checkbox.checked = true;
      const container = checkbox.closest("div[onclick*='toggleProcedureOption']");
      if (container) {
        container.style.borderColor = "#1976d2";
        container.style.background = "#e3f2fd";
      }
    }
  });
  updateSelectedCount();
}

/**
 * ❌ Deselect All Procedures
 */
function deselectAllProcedures() {
  document.querySelectorAll(".procedure-checkbox").forEach((checkbox) => {
    if (checkbox.checked) {
      checkbox.checked = false;
      const container = checkbox.closest("div[onclick*='toggleProcedureOption']");
      if (container) {
        container.style.borderColor = "#f0f0f0";
        container.style.background = "white";
      }
    }
  });
  updateSelectedCount();
}

/**
 * Toggle Procedure Option (checkbox)
 */
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

/**
 * Update Selected Count Display
 */
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
 * Filter Procedure List by Search
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

// ========================================
// ✅ ASSIGN PROCEDURES TO ROOM
// ========================================

/**
 * Assign Multiple Procedures to Room
 * 
 * @param {number} roomId - Room ID
 * @param {array} procedureIds - Array of procedure IDs
 */
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

    let successCount = 0;
    let failedCount = 0;
    let failedProcedures = [];

    for (const procedureId of procedureIds) {
      try {
        const apiUrl = getApiUrl('assign_procedure_to_room.php');
        console.log(`🔗 API URL: ${apiUrl}`);
        console.log(`📝 Request method: POST`);
        console.log(`📦 Request body: `, {
          room_id: roomId,
          procedure_id: parseInt(procedureId, 10),
        });

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_id: roomId,
            procedure_id: parseInt(procedureId, 10),
          }),
        });

        console.log(`📊 Response status for procedure ${procedureId}: ${response.status}`);

        // ✅ FIXED: Handle 500 errors properly
        if (!response.ok) {
          console.error(`❌ API Error ${response.status} for procedure ${procedureId}`);
          const errorText = await response.text();
          console.error(`   Response text: ${errorText.substring(0, 200)}`);
          failedCount++;
          failedProcedures.push(`Procedure ID ${procedureId}: API Error ${response.status}`);
          continue;
        }

        // ✅ FIXED: Handle JSON parsing errors
        let result;
        try {
          const responseText = await response.text();
          console.log(`📊 Raw response for procedure ${procedureId}: ${responseText.substring(0, 200)}`);
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`❌ JSON Parse Error for procedure ${procedureId}:`, parseError);
          failedCount++;
          failedProcedures.push(`Procedure ID ${procedureId}: Invalid API Response`);
          continue;
        }

        console.log(`📊 Parsed result for procedure ${procedureId}:`, result);

        if (result.success) {
          successCount++;
          console.log(`✅ Procedure ${procedureId} added successfully`);
        } else {
          failedCount++;
          failedProcedures.push(
            result.message || `Procedure ID ${procedureId}`
          );
          console.warn(`⚠️ Procedure ${procedureId} failed: ${result.message}`);
        }
      } catch (error) {
        failedCount++;
        failedProcedures.push(`Procedure ID ${procedureId}: ${error.message}`);
        console.error(`❌ Exception for procedure ${procedureId}:`, error);
      }
    }

    if (successCount > 0) {
      let message = `บันทึกหัตถการ ${successCount} รายการเรียบร้อย`;
      if (failedCount > 0) {
        message += `\n⚠️ ล้มเหลว ${failedCount} รายการ`;
      }

      // ✅ FIXED: Verify procedures were added
      console.log("⏳ Waiting for DB commit (1 second)...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const verified = await verifyProceduresAdded(roomId, procedureIds);
      
      if (!verified) {
        console.warn("⚠️ Verification failed - procedures may not have saved");
        message += "\n⚠️ หมายเหตุ: โปรดตรวจสอบข้อมูล";
      } else {
        console.log("✅ Verification passed - all procedures found in DB");
      }

      Swal.fire({
        icon: verified && failedCount === 0 ? "success" : "warning",
        title: "เสร็จสิ้น",
        text: message,
        confirmButtonColor: "#4caf50",
      });
      
      // ✅ FIXED: Wait 1.5 seconds before reloading to ensure DB commit
      console.log("⏳ Waiting 1.5 seconds before reloading...");
      setTimeout(() => {
        console.log("🔄 Reloading room detail...");
        openRoomDetail(roomId);
      }, 1500);
      
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
      text: error.message || "บันทึกไม่สำเร็จ",
      confirmButtonColor: "#d32f2f",
    });
  }
}

// ========================================
// ✅ REMOVE PROCEDURE FROM ROOM
// ========================================

/**
 * Remove Procedure from Room - WITH VERIFICATION
 * ✅ Now verifies deletion and forces data refresh
 * 
 * @param {number} roomProcedureId - Room Procedure ID
 * @param {string} procedureName - Procedure Name
 */
async function removeProcedureFromRoom(roomProcedureId, procedureName) {
  console.log(`🗑️ [DELETE] ID=${roomProcedureId}, Name=${procedureName}`);
  
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

  if (!result.isConfirmed) {
    console.log(`❌ Cancelled`);
    return;
  }

  try {
    Swal.fire({
      title: "กำลังลบ...",
      html: '<i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #d32f2f;"></i>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    console.log(`📍 Sending DELETE to API...`);
    
    const apiUrl = getApiUrl('remove_room_procedure.php');
    console.log(`📡 API URL: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remove",
        room_procedure_id: parseInt(roomProcedureId),
      }),
    });

    console.log(`📊 Response: ${response.status}`);

    const data = await response.json();
    console.log(`📊 Data:`, data);

    if (!data.success) {
      throw new Error(data.message || "API failed");
    }

    currentProceduresList = [];
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`🔍 Verifying...`);
    const verifyUrl = getApiUrl('get_room_detail.php');
    const verifyResponse = await fetch(
      `${verifyUrl}?room_id=${currentRoomId}&t=${Date.now()}`,
      { cache: "no-store" }
    );

    const verifyData = await verifyResponse.json();
    const updatedProcedures = verifyData.data.procedures || [];
    
    const stillExists = updatedProcedures.some(p => 
      parseInt(p.room_procedure_id) === parseInt(roomProcedureId)
    );

    console.log(`✅ Exists: ${stillExists ? 'YES ❌' : 'NO ✅'}`);

    if (stillExists) {
      throw new Error("ลบไม่สำเร็จ หัตถการยังอยู่");
    }

    await Swal.fire({
      icon: "success",
      title: "✅ ลบสำเร็จ",
      text: `ลบ "${procedureName}" เรียบร้อย`,
      confirmButtonColor: "#1E8449",
    });

    await openRoomDetail(currentRoomId);
    console.log(`✅ Complete\n`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
    Swal.fire("❌ ข้อผิดพลาด", error.message, "error");
  }
}


// ========================================
// 🛑 EXPORTS (สำหรับ ES Modules)
// ========================================

// export {
//   displayRoomProcedures,
//   openAssignProcedureModal,
//   removeProcedureFromRoom,
//   toggleProcedureDetail,
//   assignProceduresToRoom
// };