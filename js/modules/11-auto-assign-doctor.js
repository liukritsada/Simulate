/**
 * ✅ auto-assign-doctor.js - FIXED VERSION
 * Auto-assign doctors to rooms when doctor is added or status changes
 * 
 * ✅ FIXES:
 * 1. Global variables declared at top (autoAssignDoctorInterval, doctorStatusUpdateInterval)
 * 2. Proper interval cleanup
 * 3. Memory leak prevention
 */

// ========================================
// ✅ GLOBAL VARIABLES - DECLARED FIRST
// ========================================
let autoAssignDoctorInterval = null;
let doctorStatusUpdateInterval = null;
let AUTO_ASSIGN_DOCTOR_INTERVAL = 30 * 1000; // 30 seconds

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
    
    // ✅ Clear existing interval SAFELY
    if (autoAssignDoctorInterval !== null) {
        clearInterval(autoAssignDoctorInterval);
        autoAssignDoctorInterval = null;
        console.log("🧹 Cleared previous interval");
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
    console.log("⏹️ Stopping auto-assign doctor timer...");
    
    if (autoAssignDoctorInterval !== null) {
        clearInterval(autoAssignDoctorInterval);
        autoAssignDoctorInterval = null;
        console.log("✅ Auto-assign doctor timer stopped");
    } else {
        console.log("ℹ️ No active timer to stop");
    }
}

/**
 * ✅ Auto-Assign Doctor After Add (SIMPLIFIED)
 * 
 * NOTE: 09-doctor-management.js ทำ auto-assign โดยตรงแล้ว
 *       ไฟล์นี้ใช้สำหรับ status updates และ timer อย่างเดียว
 */
function hookAutoAssignDoctorAfterAdd() {
    console.log("🔗 Auto-assign doctor integration ready");
    console.log("✅ [09] will trigger auto-assign on doctor add");
    console.log("✅ [13] will handle status updates & timers");
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

    // ✅ Clear existing interval SAFELY
    if (doctorStatusUpdateInterval !== null) {
        clearInterval(doctorStatusUpdateInterval);
        doctorStatusUpdateInterval = null;
        console.log("🧹 Cleared previous status update interval");
    }

    // ✅ Run immediately
    updateDoctorStatusByTime(stationId);

    // ✅ Run every 10 seconds (check time-based status changes)
    doctorStatusUpdateInterval = setInterval(() => {
        updateDoctorStatusByTime(stationId);
    }, 10 * 1000);

    console.log("✅ Doctor status update timer started (every 10s)");
}

/**
 * ✅ Stop status update timer
 */
function stopDoctorStatusUpdateTimer() {
    console.log("⏹️ Stopping doctor status update timer...");
    
    if (doctorStatusUpdateInterval !== null) {
        clearInterval(doctorStatusUpdateInterval);
        doctorStatusUpdateInterval = null;
        console.log("✅ Doctor status update timer stopped");
    } else {
        console.log("ℹ️ No active status timer to stop");
    }
}

/**
 * ✅ Stop all timers
 */
function stopAllTimers() {
    console.log("🛑 Stopping ALL timers...");
    stopAutoAssignDoctorTimer();
    stopDoctorStatusUpdateTimer();
    console.log("✅ All timers stopped");
}

/**
 * ✅ Initialize when page loads
 */
window.addEventListener('load', () => {
    console.log("📝 Page loaded - Initializing auto-assign doctor");

    setTimeout(() => {
        // ✅ Setup integration
        hookAutoAssignDoctorAfterAdd();

        // ✅ Start status update timer
        startDoctorStatusUpdateTimer();

        console.log("✅ Auto-assign doctor initialized");
    }, 1000);
});

/**
 * ✅ Cleanup on page unload (prevent memory leak)
 */
window.addEventListener('beforeunload', () => {
    console.log("🧹 Page unloading - Cleaning up timers");
    stopAllTimers();
});