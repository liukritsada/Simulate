/**
 * ✅ 12-auto-assignment-system.js - FIXED v3 (NO WebSocket)
 * ใช้ Polling โดยตรง ไม่ลอง WebSocket
 * 
 * ✅ FIX: ปิด WebSocket attempt ไม่ให้ error
 * ไปเข้า Polling เลย
 */

// ✅ Variables
let autoAssignDoctorTimer = null;
let autoUpdateStatusTimer = null;
let resetCheckTimer = null;

// ✅ ใช้จากไฟล์ 11-auto-assign-doctor.js แล้ว
// AUTO_ASSIGN_DOCTOR_INTERVAL ถูกประกาศใน 11-auto-assign-doctor.js

// ตัวแปรอื่นๆ ที่ไม่ซ้ำ
const RESET_TIME = "00:00:00"; // Reset at midnight

/**
 * ✅ Helper: Get active station ID
 * ตรวจสอบหลายตัวแปร
 */
function getActiveStationId() {
    // ✅ ตรวจสอบ window.currentStationId
    if (window.currentStationId && window.currentStationId > 0) {
        return window.currentStationId;
    }
    
    // ✅ ตรวจสอบ stationId
    if (typeof stationId !== 'undefined' && stationId > 0) {
        return stationId;
    }
    
    // ✅ ตรวจสอบ currentStation
    if (typeof currentStation !== 'undefined' && currentStation && currentStation.station_id > 0) {
        return currentStation.station_id;
    }
    
    return 0; // ❌ ไม่มี station ID
}

/**
 * ✅ Initialize Polling (ไม่ลอง WebSocket)
 * ใช้เมื่อหลัก
 */
function initializePolling() {
    console.log("📍 Initializing Polling System...");
    
    // ใช้ AUTO_ASSIGN_DOCTOR_INTERVAL จาก 11-auto-assign-doctor.js
    // ค่า default: 30 * 1000 (30 seconds)
    
    if (autoAssignDoctorTimer) clearInterval(autoAssignDoctorTimer);
    if (autoUpdateStatusTimer) clearInterval(autoUpdateStatusTimer);
    if (resetCheckTimer) clearInterval(resetCheckTimer);

    // Start auto-assign doctor polling
    triggerAutoAssignDoctor();
    autoAssignDoctorTimer = setInterval(() => {
        triggerAutoAssignDoctor();
    }, AUTO_ASSIGN_DOCTOR_INTERVAL || 30000); // Use global or default 30s

    // Start auto-update status polling
    triggerUpdateDoctorStatus();
    autoUpdateStatusTimer = setInterval(() => {
        triggerUpdateDoctorStatus();
    }, 10 * 1000); // Every 10 seconds

    // Daily reset check
    resetCheckTimer = setInterval(() => {
        checkAndResetDaily();
    }, 60 * 1000); // Every minute

    console.log("✅ Polling System Initialized");
}

/**
 * ✅ Trigger auto-assign doctor
 * ✅ FIX: ใช้ getActiveStationId() แทน currentStationId
 */
async function triggerAutoAssignDoctor() {
    // ✅ ตรวจสอบ station ID ก่อน
    const stationId = getActiveStationId();
    if (!stationId || stationId === 0) {
        // ข้าม API call ถ้าไม่มี station_id (ปกติในหน้า All Floors)
        return;
    }

    console.log(`🏥 [Polling] Auto-assign doctor trigger... (Station ${stationId})`);
    
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
                station_id: stationId,  // ✅ ใช้ getActiveStationId() ที่ได้
                current_date: new Date().toISOString().split('T')[0],
                current_time: new Date().toTimeString().split(' ')[0]
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data.assignments && result.data.assignments.length > 0) {
            console.log(`✅ Auto-assigned: ${result.data.assignments.length} doctor(s)`);
            
            // Reload UI
            if (typeof loadStationDetail === 'function') {
                setTimeout(() => loadStationDetail(stationId), 500);
            }
        }
    } catch (error) {
        console.warn("⚠️ Auto-assign doctor error:", error.message);
    }
}

/**
 * ✅ Trigger update doctor status by time
 * ✅ FIX: ใช้ getActiveStationId() แทน currentStationId
 */
async function triggerUpdateDoctorStatus() {
    const stationId = getActiveStationId();
    if (!stationId || stationId === 0) {
        // ข้าม update ถ้าไม่มี station_id
        return;
    }

    console.log(`🔄 [Polling] Update doctor status by time... (Station ${stationId})`);
    
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
                station_id: stationId,  // ✅ ใช้ getActiveStationId() ที่ได้
                current_date: new Date().toISOString().split('T')[0],
                current_time: new Date().toTimeString().split(' ')[0]
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data.updated_count > 0) {
            console.log(`✅ Status updated: ${result.data.updated_count} change(s)`);
            
            // Check if rooms were cleared
            const hasRoomClear = result.data.updates.some(u => u.room_cleared);
            if (hasRoomClear) {
                console.log("🏪 Room cleared - Triggering auto-assign...");
                setTimeout(() => triggerAutoAssignDoctor(), 500);
            }
        }
    } catch (error) {
        console.warn("⚠️ Update doctor status error:", error.message);
    }
}

/**
 * ✅ Check and reset daily data
 */
async function checkAndResetDaily() {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    
    if (timeStr === RESET_TIME) {
        console.log("🔄 Resetting daily data...");
        
        try {
            const apiUrl = typeof getApiUrl === 'function'
                ? getApiUrl('reset_daily_data.php')
                : `/hospital/api/reset_daily_data.php`;

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reset_date: new Date().toISOString().split('T')[0]
                }),
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const result = await response.json();
            if (result.success) {
                console.log("✅ Daily reset completed");
                
                // Reload page
                if (typeof location !== 'undefined') {
                    setTimeout(() => location.reload(), 1000);
                }
            }
        } catch (error) {
            console.error("❌ Reset error:", error.message);
        }
    }
}

/**
 * ✅ Stop all timers
 */
function stopAllPolling() {
    console.log("🛑 Stopping all polling...");
    
    if (autoAssignDoctorTimer) clearInterval(autoAssignDoctorTimer);
    if (autoUpdateStatusTimer) clearInterval(autoUpdateStatusTimer);
    if (resetCheckTimer) clearInterval(resetCheckTimer);
    
    console.log("✅ All polling stopped");
}

/**
 * ✅ Initialize on page load
 * ✅ FIX: ไม่ลอง WebSocket เลย ไปเข้า Polling เลย
 */
window.addEventListener('load', () => {
    console.log("📡 Page loaded - Initializing auto-assignment system (Polling mode)...");
    
    setTimeout(() => {
        // ✅ ไปเข้า Polling เลย ไม่ลอง WebSocket
        console.log("📍 Using Polling System directly...");
        initializePolling();

        console.log("✅ Auto-assignment system initialized (Polling)");
    }, 1000);
});

/**
 * ✅ Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
    console.log("🧹 Page unloading - Stopping all timers");
    stopAllPolling();
});

/**
 * ✅ Stop polling when leaving station
 */
function stopAutoAssignment() {
    console.log("⏹️ Stopping auto-assignment...");
    stopAllPolling();
}

/**
 * ✅ Start polling when entering station
 */
function startAutoAssignment() {
    console.log("▶️ Starting auto-assignment...");
    initializePolling();
}