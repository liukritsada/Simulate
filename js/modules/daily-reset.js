/**
 * 🔄 AUTO RESET DAILY DATA
 * Run every day at 00:00:00 to clean up old records
 * ทำงานทุกวันเที่ยงคืน เพื่อลบข้อมูลเก่า
 */

// ========================================
// ✅ INIT AUTO RESET
// ========================================

function initDailyReset() {
  console.log("🔄 Initializing daily reset system...");
  
  // ✅ Check if reset is needed
  checkAndRunReset();
  
  // ✅ Schedule reset at midnight
  scheduleNextReset();
}

// ========================================
// ✅ CHECK AND RUN RESET
// ========================================

async function checkAndRunReset() {
  const today = new Date().toISOString().split('T')[0];
  const lastResetDate = localStorage.getItem('lastResetDate');
  
  console.log("📅 Today:", today);
  console.log("📅 Last reset:", lastResetDate);
  
  // ✅ If not reset today, run reset
  if (lastResetDate !== today) {
    console.log("🔄 Running daily reset...");
    await runReset();
    localStorage.setItem('lastResetDate', today);
  } else {
    console.log("✅ Already reset today");
  }
}

// ========================================
// ✅ RUN RESET API
// ========================================

async function runReset() {
  try {
    // ✅ Step 1: Reset daily data
    const apiUrl = getApiUrl("reset_daily_data.php");
    console.log("📤 Calling reset data API:", apiUrl);
    
    const response = await fetch(apiUrl);
    const result = await response.json();
    
    if (result.success) {
      console.log("✅ Daily data reset completed:");
      console.log("   - Doctors deleted:", result.data.deleted.doctors);
      console.log("   - Staff deleted:", result.data.deleted.staff);
      console.log("   - Patients deleted:", result.data.deleted.patients);
      if (result.data.cleared) {
        console.log("   - Room assignments cleared:", result.data.cleared.room_assignments);
      }
      console.log("   - Total deleted:", result.data.total_deleted);
      console.log("   - Timestamp:", result.data.timestamp);
    } else {
      console.error("❌ Data reset failed:", result.message);
    }

    // ✅ Step 2: Reset room assignments (auto-assign staff to rooms)
    const roomsApiUrl = getApiUrl("reset_daily_rooms.php");
    console.log("📤 Calling reset rooms API:", roomsApiUrl);
    
    const roomsResponse = await fetch(roomsApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_date: new Date().toISOString().split('T')[0] })
    });
    const roomsResult = await roomsResponse.json();
    
    if (roomsResult.success) {
      console.log("✅ Daily rooms reset completed:");
      console.log("   - Staff on shift:", roomsResult.data.staff_on_shift);
      console.log("   - Auto assigned:", roomsResult.data.auto_assign_count);
      console.log("   - Unassigned staff:", roomsResult.data.unassigned_staff);
      console.log("   - Log:", roomsResult.data.assignment_log);
    } else {
      console.error("❌ Rooms reset failed:", roomsResult.message);
    }

  } catch (error) {
    console.error("❌ Reset error:", error);
  }
}

// ========================================
// ✅ SCHEDULE NEXT RESET
// ========================================

function scheduleNextReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 1, 0); // 00:00:01 next day
  
  const timeUntilMidnight = tomorrow.getTime() - now.getTime();
  const hoursUntilMidnight = Math.floor(timeUntilMidnight / 3600000);
  const minutesUntilMidnight = Math.floor((timeUntilMidnight % 3600000) / 60000);
  
  console.log(`⏰ Next reset scheduled in: ${hoursUntilMidnight}h ${minutesUntilMidnight}m`);
  
  // ✅ Schedule reset
  setTimeout(() => {
    console.log("🔔 Midnight reached! Running daily reset...");
    checkAndRunReset();
    
    // ✅ Re-schedule for next day
    scheduleNextReset();
  }, timeUntilMidnight);
}

// ========================================
// ✅ MANUAL RESET (For testing)
// ========================================

async function manualReset() {
  console.log("🔄 Running manual reset...");
  localStorage.removeItem('lastResetDate');
  await runReset();
  localStorage.setItem('lastResetDate', new Date().toISOString().split('T')[0]);
  console.log("✅ Manual reset completed");
}

// ========================================
// ✅ START WHEN PAGE LOADS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize daily reset after 5 seconds
  setTimeout(initDailyReset, 5000);
});

// ========================================
// ✅ Export for console testing
// ========================================

window.dailyReset = {
  init: initDailyReset,
  check: checkAndRunReset,
  run: runReset,
  schedule: scheduleNextReset,
  manual: manualReset
};