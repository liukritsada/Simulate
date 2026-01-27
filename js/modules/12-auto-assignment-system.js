/**
 * ✅ 11-auto-assignment-system.js - FIXED
 * ใช้ auto_assign_doctor.php แทน get_unassigned_doctors.php
 */

// ✅ Variables
let autoAssignDoctorTimer = null;
let autoUpdateStatusTimer = null;
let autoUpdatePatientStatusTimer = null;
let autoAssignPatientToRoomTimer = null;
let resetCheckTimer = null;

const AUTO_ASSIGN_DOCTOR_INTERVAL = 5 * 1000; // 5 seconds (เร็วขึ้น)
const AUTO_UPDATE_STATUS_INTERVAL = 5 * 1000; // 5 seconds (เร็วขึ้น)
const AUTO_UPDATE_PATIENT_STATUS_INTERVAL = 10 * 1000; // 10 seconds
const AUTO_ASSIGN_PATIENT_TO_ROOM_INTERVAL = 15 * 1000; // 15 seconds
const RESET_TIME = "00:00:00"; // Reset at midnight

// 🔴 WebSocket Real-time Configuration (ยังไม่มี WebSocket server ให้ใช้ interval แล้ว)
let wsConnection = null;
const WS_URL = "ws://localhost:8080"; // เปลี่ยนเป็น wss:// ใน production

/**
 * 🔴 WEBSOCKET SUPPORT (Future Implementation)
 * เตรียมไว้สำหรับการเชื่อมต่อ WebSocket server
 */
function initializeWebSocket() {
    try {
        wsConnection = new WebSocket(WS_URL);
        
        wsConnection.onopen = () => {
            console.log("✅ WebSocket Connected!");
            wsConnection.send(JSON.stringify({
                type: "subscribe",
                station_id: currentStationId
            }));
        };
        
        wsConnection.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("📡 WebSocket Message:", data);
            
            if (data.type === "status_update") {
                // อัพเดท UI ทันที
                handleStatusUpdate(data);
            } else if (data.type === "doctor_assigned") {
                // ตีความ Doctor ถูก assign
                handleDoctorAssignment(data);
            }
        };
        
        wsConnection.onerror = (error) => {
            console.warn("⚠️ WebSocket Error:", error);
            console.log("📍 ใช้ Polling แทน (fallback)");
        };
        
        wsConnection.onclose = () => {
            console.log("❌ WebSocket Closed - reconnecting in 5s...");
            setTimeout(initializeWebSocket, 5000);
        };
    } catch (error) {
        console.warn("⚠️ WebSocket not available:", error);
        console.log("📍 ใช้ Polling แทน (fallback)");
    }
}

/**
 * ✅ Auto Assign Doctors to Rooms (FIXED - use auto_assign_doctor.php)
 */
async function autoAssignDoctorsToRooms() {
    try {
        console.log("🏥 เริ่มเพิ่มแพทย์เข้าห้องอัตโนมัติ...");

        if (!currentStationId) {
            console.log("⏭️ ยังไม่ได้เลือก Station - ข้ามการทำงาน");
            return {
                success: false,
                error: "ยังไม่ได้เลือก Station",
                skipped: true,
            };
        }

        const currentDate = new Date().toISOString().split("T")[0];
        const currentTime = new Date().toTimeString().split(" ")[0];

        // ✅ FIXED: Use auto_assign_doctor.php instead of get_unassigned_doctors.php
        const assignResponse = await fetch(
            getApiUrl("auto_assign_doctor.php"),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    station_id: currentStationId,
                    current_date: currentDate,
                    current_time: currentTime,
                }),
            }
        );

        const result = await assignResponse.json();

        if (!assignResponse.ok) {
            console.error("❌ API Error:", result);
            throw new Error(result.message || `HTTP ${assignResponse.status}`);
        }

        if (!result.success) {
            console.warn("⚠️ Auto-assign failed:", result.message);
            return false;
        }

        console.log("✅ Auto-assign doctor completed");
        console.log(
            `📊 Empty rooms: ${result.data.empty_rooms_count}, Auto assigned: ${result.data.auto_assigned_count}`
        );

        // Log each assignment
        if (result.data.assignments && result.data.assignments.length > 0) {
            result.data.assignments.forEach((assignment) => {
                console.log(`   ${assignment.message}`);
            });
        } else {
            console.log("   ⏭️ ไม่มีห้องว่างหรือแพทย์ว่าง");
        }

        return true;

    } catch (error) {
        console.error("❌ ข้อผิดพลาดในการเพิ่มแพทย์อัตโนมัติ:", error);
        return false;
    }
}

/**
 * ✅ Start Auto Assign Doctor Timer
 */
function startAutoAssignDoctorTimer() {
    console.log("⏰ เปิดตัวจับเวลาเพิ่มแพทย์อัตโนมัติ");

    // Clear existing timer
    if (autoAssignDoctorTimer) {
        clearInterval(autoAssignDoctorTimer);
    }

    // Run immediately
    autoAssignDoctorsToRooms();

    // Run every 30 seconds
    autoAssignDoctorTimer = setInterval(() => {
        autoAssignDoctorsToRooms();
    }, AUTO_ASSIGN_DOCTOR_INTERVAL);

    console.log("✅ ตัวจับเวลาเพิ่มแพทย์ทำงานแล้ว");
}

/**
 * ✅ Stop Auto Assign Doctor Timer
 */
function stopAutoAssignDoctorTimer() {
    if (autoAssignDoctorTimer) {
        clearInterval(autoAssignDoctorTimer);
        autoAssignDoctorTimer = null;
        console.log("⏹️ ตัวจับเวลาเพิ่มแพทย์หยุดแล้ว");
    }
}

/**
 * ✅ Auto Update Status
 */
async function autoUpdateStatus() {
    console.log("🔄 เริ่มตัวอัพเดต status อัตโนมัติ (ทุก 60 วิ)");

    try {
        const statusResponse = await fetch(
            getApiUrl("update_staff_status_by_time.php"),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    station_id: currentStationId || 0,
                    current_date: new Date().toISOString().split("T")[0],
                    current_time: new Date().toTimeString().split(" ")[0],
                }),
            }
        );

        if (statusResponse.ok) {
            const result = await statusResponse.json();
            if (result.success) {
                console.log(
                    `✅ Status updated: ${result.data.updated_count} staff at ${new Date().toLocaleTimeString()}`
                );
            }
        }
    } catch (error) {
        console.warn("⚠️ Status update error:", error);
    }
}

/**
 * ✅ Auto Update Patient Status
 * อัปเดตสถานะผู้ป่วยอัตโนมัติตามเวลา
 */
async function autoUpdatePatientStatus() {
    console.log("🏥 เริ่มอัพเดตสถานะผู้ป่วยอัตโนมัติ...");

    try {
        const response = await fetch(
            getApiUrl("auto_update_patient_status.php"),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    current_date: new Date().toISOString().split("T")[0],
                    current_time: new Date().toTimeString().split(" ")[0],
                }),
            }
        );

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const inProcess = result.data.updated_to_in_process;
                const completed = result.data.updated_to_completed;

                if (inProcess > 0 || completed > 0) {
                    console.log(
                        `✅ Patient status updated: ${inProcess} started, ${completed} completed at ${new Date().toLocaleTimeString()}`
                    );

                    // รีเฟรช patient list ถ้าอยู่หน้า patient management
                    if (typeof refreshPatientList === 'function') {
                        refreshPatientList();
                    }
                }
            }
        }
    } catch (error) {
        console.warn("⚠️ Patient status update error:", error);
    }
}

/**
 * ✅ Auto Assign Patient to Room
 * แอดคนไข้เข้าห้องอัตโนมัติ เมื่อห้องว่าง
 */
async function autoAssignPatientToRoom() {
    try {
        if (!currentStationId) {
            console.log("⏭️ ยังไม่ได้เลือก Station - ข้ามการทำงาน");
            return;
        }

        console.log("🏥 เริ่มแอดคนไข้เข้าห้องอัตโนมัติ...");

        const response = await fetch(
            getApiUrl("auto_assign_patient_to_room.php"),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    station_id: currentStationId,
                    current_date: new Date().toISOString().split("T")[0],
                    current_time: new Date().toTimeString().split(" ")[0],
                }),
            }
        );

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const assigned = result.data.assigned_count;
                if (assigned > 0) {
                    console.log(
                        `✅ Assigned ${assigned} patients to rooms at ${new Date().toLocaleTimeString()}`
                    );

                    // รีเฟรช patient list ถ้าอยู่หน้า patient management
                    if (typeof refreshPatientList === 'function') {
                        refreshPatientList();
                    }
                }
            }
        }
    } catch (error) {
        console.warn("⚠️ Auto assign patient to room error:", error);
    }
}

/**
 * ✅ Start Auto Assign Patient to Room Timer
 */
function startAutoAssignPatientToRoomTimer() {
    console.log("⏰ เปิดตัวจับเวลาแอดคนไข้เข้าห้องอัตโนมัติ");

    if (autoAssignPatientToRoomTimer) {
        clearInterval(autoAssignPatientToRoomTimer);
    }

    autoAssignPatientToRoom();

    autoAssignPatientToRoomTimer = setInterval(() => {
        autoAssignPatientToRoom();
    }, AUTO_ASSIGN_PATIENT_TO_ROOM_INTERVAL);

    console.log("✅ Interval auto assign patient to room ทำงาน (ทุก 15 วิ)");
}

/**
 * ✅ Stop Auto Assign Patient to Room Timer
 */
function stopAutoAssignPatientToRoomTimer() {
    if (autoAssignPatientToRoomTimer) {
        clearInterval(autoAssignPatientToRoomTimer);
        autoAssignPatientToRoomTimer = null;
        console.log("⏹️ ตัวจับเวลาแอดคนไข้เข้าห้องหยุดแล้ว");
    }
}

/**
 * ✅ Start Status Update Timer
 */
function startAutoUpdateStatusTimer() {
    console.log("⏰ เปิดตัวจับเวลาอัพเดต status");

    if (autoUpdateStatusTimer) {
        clearInterval(autoUpdateStatusTimer);
    }

    autoUpdateStatus();

    autoUpdateStatusTimer = setInterval(() => {
        autoUpdateStatus();
    }, AUTO_UPDATE_STATUS_INTERVAL);

    console.log("✅ Interval status update ทำงาน (ทุก 60วิ)");
}

/**
 * ✅ Stop Status Update Timer
 */
function stopAutoUpdateStatusTimer() {
    if (autoUpdateStatusTimer) {
        clearInterval(autoUpdateStatusTimer);
        autoUpdateStatusTimer = null;
    }
}

/**
 * ✅ Start Patient Status Update Timer
 */
function startAutoUpdatePatientStatusTimer() {
    console.log("⏰ เปิดตัวจับเวลาอัพเดตสถานะผู้ป่วย");

    if (autoUpdatePatientStatusTimer) {
        clearInterval(autoUpdatePatientStatusTimer);
    }

    autoUpdatePatientStatus();

    autoUpdatePatientStatusTimer = setInterval(() => {
        autoUpdatePatientStatus();
    }, AUTO_UPDATE_PATIENT_STATUS_INTERVAL);

    console.log("✅ Interval patient status update ทำงาน (ทุก 10 วิ)");
}

/**
 * ✅ Stop Patient Status Update Timer
 */
function stopAutoUpdatePatientStatusTimer() {
    if (autoUpdatePatientStatusTimer) {
        clearInterval(autoUpdatePatientStatusTimer);
        autoUpdatePatientStatusTimer = null;
        console.log("⏹️ ตัวจับเวลาอัพเดตสถานะผู้ป่วยหยุดแล้ว");
    }
}

/**
 * ✅ Set Station ID
 */
function setCurrentStationId(stationId) {
    currentStationId = stationId;
    console.log(`✅ Set current station to: ${stationId}`);

    // Restart timers
    stopAutoAssignDoctorTimer();
    startAutoAssignDoctorTimer();
}

/**
 * ✅ Get Current Station ID
 */
function getCurrentStationId() {
    return currentStationId;
}

/**
 * ✅ Reset Daily Data
 */
async function resetDailyData() {
    console.log("🔄 รีเซ็ตข้อมูลประจำวัน");

    try {
        const response = await fetch(getApiUrl("reset_daily_data.php"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                current_date: new Date().toISOString().split("T")[0],
            }),
        });

        if (response.ok) {
            console.log("✅ รีเซ็ตข้อมูลประจำวันสำเร็จ");
        }
    } catch (error) {
        console.warn("⚠️ Reset daily data error:", error);
    }
}

/**
 * ✅ Check Reset Time
 */
function checkResetTime() {
    const now = new Date();
    const currentTime =
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0") +
        ":" +
        String(now.getSeconds()).padStart(2, "0");

    // Store reset date in localStorage
    const today = new Date().toISOString().split("T")[0];
    const storedResetDate = localStorage.getItem("lastResetDate") || today;

    const needsReset = storedResetDate !== today;

    console.log(
        `📅 ตรวจสอบรีเซ็ต: {currentDate: '${today}', storedResetDate: '${storedResetDate}', needsReset: ${needsReset}}`
    );

    if (needsReset) {
        console.log("🔄 ต้องรีเซ็ตข้อมูล");
        resetDailyData();
        localStorage.setItem("lastResetDate", today);
    }

    // Schedule next reset at midnight
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow - now;
    console.log(
        `⏰ ตั้งค่า reset ให้ทำงานในอีก ${(msUntilMidnight / 1000 / 3600).toFixed(2)} ชั่วโมง`
    );

    if (resetCheckTimer) {
        clearTimeout(resetCheckTimer);
    }

    resetCheckTimer = setTimeout(() => {
        checkResetTime();
    }, msUntilMidnight);
}

/**
 * ✅ Handle Status Update from WebSocket
 */
function handleStatusUpdate(data) {
    console.log("✅ Status Updated via WebSocket:", data);
    // ต้องเขียน logic เพื่อ update DOM
    // เช่น update room card, staff status color, etc.
}

/**
 * ✅ Handle Doctor Assignment from WebSocket
 */
function handleDoctorAssignment(data) {
    console.log("✅ Doctor Assigned via WebSocket:", data);
    // ต้องเขียน logic เพื่อ update DOM
    // เช่น show notification, update room list, etc.
}

/**
 * ✅ Initialize System
 */
function initializeSystem() {
    console.log("📱 หน้าโหลดเสร็จ - เริ่มระบบอัตโนมัติ");

    // 🔴 สั่ง WebSocket ถ้ามี (ยังไม่มี server)
    // initializeWebSocket();

    checkResetTime();
    startAutoAssignDoctorTimer();
    startAutoUpdateStatusTimer();
    startAutoUpdatePatientStatusTimer();
    startAutoAssignPatientToRoomTimer();
}

/**
 * ✅ Auto initialize on page load
 */
window.addEventListener("load", () => {
    setTimeout(() => {
        initializeSystem();
    }, 2000);
});

/**
 * ✅ Cleanup on page unload
 */
window.addEventListener("beforeunload", () => {
    stopAutoAssignDoctorTimer();
    stopAutoUpdateStatusTimer();
    stopAutoUpdatePatientStatusTimer();
    stopAutoAssignPatientToRoomTimer();
    if (resetCheckTimer) {
        clearTimeout(resetCheckTimer);
    }
    // 🔴 Close WebSocket if exists
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.close();
    }
});

/**
 * ✅ Handle visibility change
 */
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        console.log("👁️ Page hidden - pausing updates");
        stopAutoAssignDoctorTimer();
        stopAutoUpdateStatusTimer();
        stopAutoUpdatePatientStatusTimer();
        stopAutoAssignPatientToRoomTimer();
    } else {
        console.log("👁️ กลับมาดูหน้าแล้ว - ตรวจสอบระบบอัตโนมัติ");
        checkResetTime();
        startAutoAssignDoctorTimer();
        startAutoUpdateStatusTimer();
        startAutoUpdatePatientStatusTimer();
        startAutoAssignPatientToRoomTimer();
    }
});