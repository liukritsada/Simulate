/**
 * ✅ auto-assign-doctor.js - FIXED VERSION
 * Auto-assign doctors to rooms when doctor is added or status changes
 * 
 * NOTE: 09-doctor-management.js ทำ auto-assign โดยตรงแล้ว
 *       ไฟล์นี้ใช้สำหรับ status updates และ timer อย่างเดียว
 */



/**
 * ✅ Trigger auto-assign doctor
 * เรียกใช้เมื่อ status เปลี่ยนหรือ trigger แบบ manual
 */
async function triggerAutoAssignDoctor(stationId = null) {
    console.log("🏥 Triggering auto-assign doctor...");
    
    try {
        const apiUrl = typeof getApiUrl === 'function'
            ? getApiUrl('auto_assign_doctor.php')
            : `/hospital/api/auto_assign_doctor.php`;

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                station_id: stationId || 0,
                current_date: new Date().toISOString().split('T')[0],
                current_time: new Date().toTimeString().split(' ')[0]
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log("✅ Auto-assign doctor completed");
            console.log("📊 Data:", result.data);

            // ✅ Log each assignment
            if (result.data.assignments && result.data.assignments.length > 0) {
                result.data.assignments.forEach(assignment => {
                    console.log(`   ${assignment.message}`);
                });
            } else {
                console.log("   ⏭️ ไม่มีห้องว่างหรือแพทย์ว่าง");
            }

            // ✅ Reload UI
            if (stationId && typeof loadStationDetail === 'function') {
                setTimeout(() => {
                    console.log("🔄 Reloading station detail...");
                    loadStationDetail(stationId);
                }, 500);
            }
        } else {
            console.error("❌ Error:", result.message);
        }
    } catch (error) {
        console.error("❌ Auto-assign doctor error:", error);
    }
}

/**
 * ✅ Start auto-assign doctor timer
 */
function startAutoAssignDoctorTimer(stationId = null) {
    console.log("⏰ Starting auto-assign doctor timer...");
    
    // ✅ Clear existing interval
    if (autoAssignDoctorInterval) {
        clearInterval(autoAssignDoctorInterval);
    }

    // ✅ Run immediately
    triggerAutoAssignDoctor(stationId);

    // ✅ Run every 30 seconds
    autoAssignDoctorInterval = setInterval(() => {
        triggerAutoAssignDoctor(stationId);
    }, AUTO_ASSIGN_DOCTOR_INTERVAL);

    console.log(`✅ Auto-assign doctor timer started (every ${AUTO_ASSIGN_DOCTOR_INTERVAL / 1000}s)`);
}

/**
 * ✅ Stop auto-assign doctor timer
 */
function stopAutoAssignDoctorTimer() {
    if (autoAssignDoctorInterval) {
        clearInterval(autoAssignDoctorInterval);
        autoAssignDoctorInterval = null;
        console.log("⏹️ Auto-assign doctor timer stopped");
    }
}

/**
 * ✅ Auto-Assign Doctor After Add (SIMPLIFIED)
 * 
 * NOTE: 09-doctor-management.js ทำ auto-assign โดยตรงแล้ว (line 712-740)
 *       ไฟล์นี้ใช้สำหรับ status updates และ timer อย่างเดียว
 */
function hookAutoAssignDoctorAfterAdd() {
    console.log("🔗 Auto-assign doctor integration ready");
    console.log("✅ [09] will trigger auto-assign on doctor add");
    console.log("✅ [13] will handle status updates & timers");
    // Hook ไม่จำเป็น - 09-doctor-management.js เรียก auto-assign โดยตรง (line 712-740)
}

/**
 * ✅ Update doctor status by time
 */
async function updateDoctorStatusByTime(stationId = null) {
    console.log("🔄 Updating doctor status by time...");

    try {
        const apiUrl = typeof getApiUrl === 'function'
            ? getApiUrl('update_doctor_status_by_time.php')
            : `/hospital/api/update_doctor_status_by_time.php`;

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                station_id: stationId || 0,
                current_date: new Date().toISOString().split('T')[0],
                current_time: new Date().toTimeString().split(' ')[0]
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            if (result.data.updated_count > 0) {
                console.log(`✅ Doctor status updated: ${result.data.updated_count} changes`);
                
                // ✅ Log each update
                result.data.updates.forEach(update => {
                    console.log(`   📝 ${update.doctor}: ${update.action}`);
                });

                // ✅ Trigger auto-assign if doctors were cleared from rooms
                const hasRoomClear = result.data.updates.some(u => u.room_cleared);
                if (hasRoomClear) {
                    console.log("🏪 Some doctors were cleared from rooms, triggering auto-assign...");
                    setTimeout(() => {
                        triggerAutoAssignDoctor(stationId);
                    }, 500);
                }
            } else {
                console.log("ℹ️ No doctor status changes");
            }
        } else {
            console.error("❌ Error:", result.message);
        }
    } catch (error) {
        console.error("❌ Update doctor status error:", error);
    }
}

/**
 * ✅ Start status update timer
 */
function startDoctorStatusUpdateTimer(stationId = null) {
    console.log("⏰ Starting doctor status update timer...");

    // ✅ Run every 10 seconds (check time-based status changes)
    setInterval(() => {
        updateDoctorStatusByTime(stationId);
    }, 10 * 1000);

    console.log("✅ Doctor status update timer started");
}

/**
 * ✅ Initialize when page loads
 */
window.addEventListener('load', () => {
    console.log("📝 Page loaded - Initializing auto-assign doctor");

    setTimeout(() => {
        // ✅ Setup integration (hook is now disabled)
        hookAutoAssignDoctorAfterAdd();

        // ✅ Start status update timer
        startDoctorStatusUpdateTimer();

        console.log("✅ Auto-assign doctor initialized");
    }, 1000);
});