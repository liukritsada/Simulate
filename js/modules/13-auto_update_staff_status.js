/**
 * ✅ auto_update_staff_status.js (REALTIME VERSION)
 * Auto update staff status ตามเวลาปัจจุบัน (Client-side realtime)
 * ไม่ต้อง API call - คำนวณจากเวลา client
 */

// ✅ ตัวแปร global
let autoUpdateInterval = null;
const AUTO_UPDATE_INTERVAL = 10 * 1000; // 10 วินาที (realtime check)

/**
 * ✅ Calculate staff status based on current time (realtime)
 */
function calculateRealtimeStaffStatus(workStart, workEnd, breakStart, breakEnd) {
    const now = new Date();
    const currentTime = String(now.getHours()).padStart(2, '0') + ':' + 
                       String(now.getMinutes()).padStart(2, '0') + ':' + 
                       String(now.getSeconds()).padStart(2, '0');
    
    // ✅ Compare as strings (HH:mm:ss format)
    let status = 'waiting_to_start';
    let label = '⏳ ยังไม่ถึง';
    let badgeClass = 'badge-warning';
    
    try {
        // Check if after work end time
        if (currentTime >= workEnd) {
            status = 'off_duty';
            label = '🏁 เลิกงาน';
            badgeClass = 'badge-secondary';
        }
        // Check if in break time
        else if (breakStart && breakEnd && 
                 currentTime >= breakStart && currentTime < breakEnd) {
            status = 'on_break';
            label = '🍽️ พักเบรค';
            badgeClass = 'badge-info';
        }
        // Check if in work time
        else if (currentTime >= workStart && currentTime < workEnd) {
            status = 'working';
            label = '🟢 ว่าง';
            badgeClass = 'badge-success';
        }
        // Before work start time
        else {
            status = 'waiting_to_start';
            label = '⏳ ยังไม่ถึง';
            badgeClass = 'badge-warning';
        }
    } catch (e) {
        console.error('❌ Error calculating status:', e);
    }
    
    return { status, label, badgeClass, currentTime };
}

/**
 * ✅ Update all staff status display in DOM
 */
function updateAllStaffStatusDisplay() {
    // ✅ Find all staff elements with time data attributes
    const staffElements = document.querySelectorAll('[data-work-start][data-work-end]');
    
    if (staffElements.length === 0) {
        console.log('ℹ️ No staff elements found to update');
        return;
    }
    
    staffElements.forEach(element => {
        const workStart = element.getAttribute('data-work-start');
        const workEnd = element.getAttribute('data-work-end');
        const breakStart = element.getAttribute('data-break-start');
        const breakEnd = element.getAttribute('data-break-end');
        
        if (!workStart || !workEnd) {
            console.warn('⚠️ Missing work time attributes');
            return;
        }
        
        // Calculate status
        const { status, label, badgeClass } = calculateRealtimeStaffStatus(workStart, workEnd, breakStart, breakEnd);
        
        // Update all status elements in this parent
        const statusBadges = element.querySelectorAll('.staff-status-badge, [data-status-display]');
        statusBadges.forEach(badge => {
            badge.textContent = label;
            // Remove old classes and add new
            badge.className = badge.className.split(' ').filter(c => !c.startsWith('badge-')).join(' ') + ' ' + badgeClass;
        });
    });
}

/**
 * ✅ Start realtime auto update
 */
function startAutoUpdateStaffStatus(stationId = null) {
    console.log('🚀 Starting Realtime Staff Status Updates (Client-side)');
    
    // ✅ Clear existing interval
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
    }
    
    // ✅ Update immediately
    updateAllStaffStatusDisplay();
    
    // ✅ Update every 10 seconds (realtime)
    autoUpdateInterval = setInterval(() => {
        updateAllStaffStatusDisplay();
    }, AUTO_UPDATE_INTERVAL);
    
    console.log(`✅ Realtime Status Updates Enabled - Check every ${AUTO_UPDATE_INTERVAL / 1000}s`);
}

/**
 * ✅ Stop auto update
 */
function stopAutoUpdateStaffStatus() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
        autoUpdateInterval = null;
        console.log('⏹️ Staff Status Updates Stopped');
    }
}

/**
 * ✅ Restart auto update
 */
function restartAutoUpdateStaffStatus(stationId = null) {
    stopAutoUpdateStaffStatus();
    setTimeout(() => {
        startAutoUpdateStaffStatus(stationId);
    }, 3000);
}

/**
 * ✅ Force manual update
 */
function manualUpdateStaffStatus() {
    console.log('🔄 Manual Staff Status Update');
    updateAllStaffStatusDisplay();
}

// ✅ Auto start when page loads
window.addEventListener('load', () => {
    console.log('📝 Page loaded - Initializing Realtime Staff Status');
    
    setTimeout(() => {
        startAutoUpdateStaffStatus();
    }, 500);
});

// ✅ Stop on page unload
window.addEventListener('beforeunload', () => {
    stopAutoUpdateStaffStatus();
});

// ✅ Resume when tab becomes visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('👁️ Page hidden - pausing updates');
        stopAutoUpdateStaffStatus();
    } else {
        console.log('👁️ Page visible - resuming updates');
        startAutoUpdateStaffStatus();
    }
});