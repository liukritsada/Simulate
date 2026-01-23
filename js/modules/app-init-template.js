/**
 * 🚀 Hospital Management System - App Initialization
 * 
 * ⚠️  IMPORTANT: Copy this file to your project as js/app-init.js
 * และแก้ไข API_BASE_URL ให้ตรงกับ project ของคุณ
 * 
 * Loading Order:
 * 1. External libraries (SweetAlert2, FontAwesome)
 * 2. Modules 01-11
 * 3. app-init.js (this file)
 * 4. Your custom scripts
 */

// ============================================
// ✅ GLOBAL CONFIGURATION
// ============================================

/**
 * API Base URL
 * ⚠️ MUST CONFIGURE: Change this to match your backend
 */
const API_BASE_URL = '/hospital/api/';  // ← Change this!

/**
 * Optional: Auto-detect API URL
 * Uncomment if you want auto-detection
 */
// const API_BASE_URL = (() => {
//     const currentPath = window.location.pathname;
//     if (currentPath.includes('/hospital/')) {
//         return '/hospital/api/';
//     } else if (currentPath.includes('/api/')) {
//         return '/api/';
//     }
//     return '/api/';
// })();

// ============================================
// ✅ GLOBAL VARIABLES
// ============================================

/** Station & Room Management */
let currentStationId = null;
let currentRoomId = null;
let currentFloor = 1;
let currentRoomTab = 1;

/** Wizard State */
let currentWizardTab = 1;
let totalWizardTabs = 4;
let wizardData = {
    station_name: '',
    station_type: '', // 'with_rooms' or 'simple'
    floor: '',
    room_count: 1,
    department_id: '',
    departmentName: '',
    procedures: {},
    staff: [],
    doctors: [],
    rooms: {},
    default_wait_time: 10,
    default_service_time: 5,
    staff_count: 2,
    staff_schedules: []
};

/** Patient Management */
let currentPatientId = null;
let simulationRunning = false;

/** Data Caches */
let departments = [];
let allProcedures = [];

// ============================================
// ✅ INITIALIZATION
// ============================================

/**
 * Main initialization function
 * Called when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log("🚀 Hospital Management System - Initializing...\n");
    
    try {
        // Step 1: Verify modules loaded
        verifyModulesLoaded();
        
        // Step 2: Log configuration
        logConfiguration();
        
        // Step 3: Initialize UI components
        await initializeUI();
        
        // Step 4: Load initial data
        await loadInitialData();
        
        console.log("✅ Initialization complete!\n");
        
    } catch (error) {
        console.error("❌ Initialization error:", error);
        showNotification('⚠️ เกิดข้อผิดพลาดในการเริ่มต้นระบบ: ' + error.message, 'error');
    }
});

/**
 * Verify all required modules are loaded
 */
function verifyModulesLoaded() {
    console.log("🔍 Verifying modules...");
    
    const requiredFunctions = [
        'formatTime24Hour',    // 02-utilities.js
        'getApiUrl',          // 02-utilities.js
        'loadStations',       // 03-station-management.js
        'openStationDetail',  // 04-room-management.js
        'loadStationStaff',   // 08-staff-schedule-management.js
        'loadPatients',       // 10-patient-management.js
        'autoResetDailyRooms' // 11-auto-assignment-system.js
    ];
    
    let missing = [];
    requiredFunctions.forEach(func => {
        if (typeof window[func] !== 'function') {
            missing.push(func);
            console.warn(`  ❌ Missing: ${func}`);
        } else {
            console.log(`  ✅ Loaded: ${func}`);
        }
    });
    
    if (missing.length > 0) {
        throw new Error(`Missing functions: ${missing.join(', ')}`);
    }
    
    console.log("✅ All modules verified\n");
}

/**
 * Log current configuration
 */
function logConfiguration() {
    console.log("⚙️  Configuration:");
    console.log(`  API Base URL: ${API_BASE_URL}`);
    console.log(`  Current Floor: ${currentFloor}`);
    console.log(`  Total Wizard Tabs: ${totalWizardTabs}`);
    console.log("");
}

/**
 * Initialize UI components
 */
async function initializeUI() {
    console.log("🎨 Initializing UI components...");
    
    // Verify container elements exist
    verifyContainers();
    
    // Add keyboard shortcuts (optional)
    setupKeyboardShortcuts();
    
    // Add responsive listeners
    setupResponsiveListeners();
    
    console.log("✅ UI components initialized\n");
}

/**
 * Load initial data
 */
async function loadInitialData() {
    console.log("📚 Loading initial data...");
    
    try {
        // Load departments for wizard
        await loadDepartmentsIfNeeded();
        
        // Load patient filters
        await loadPatientFiltersIfExists();
        
        // Auto-load all floors
        await loadAllFloorsEnhanced();
        
        console.log("✅ Initial data loaded\n");
        
    } catch (error) {
        console.warn("⚠️  Some initial data failed to load:", error.message);
        // Don't throw - allow partial initialization
    }
}

/**
 * Load departments (for wizard department select)
 */
async function loadDepartmentsIfNeeded() {
    try {
        const response = await fetch(`${API_BASE_URL}/get_departments.php`);
        
        if (!response.ok) {
            console.warn(`⚠️  Failed to load departments: HTTP ${response.status}`);
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            departments = result.data;
            console.log(`  ✅ Loaded ${departments.length} departments`);
        } else {
            console.warn("⚠️  Department load returned no data");
        }
        
    } catch (error) {
        console.warn("⚠️  Error loading departments:", error.message);
    }
}

/**
 * Load patient filters (if patient tab exists)
 */
async function loadPatientFiltersIfExists() {
    // Only load if we're going to use patient features
    const patientTab = document.getElementById('patients');
    if (!patientTab) {
        console.log("  ℹ️  Patient tab not found, skipping filter load");
        return;
    }
    
    try {
        if (typeof loadPatientFilters === 'function') {
            await loadPatientFilters();
            console.log("  ✅ Patient filters loaded");
        }
    } catch (error) {
        console.warn("⚠️  Error loading patient filters:", error.message);
    }
}

// ============================================
// ✅ UTILITY FUNCTIONS
// ============================================

/**
 * Verify required container elements exist
 */
function verifyContainers() {
    const requiredContainers = [
        'floor1-stations',
        'floor2-stations',
        'floor3-stations',
        'floor4-stations',
        'floor5-stations',
        'allfloors-stats',
        'allfloors-list'
    ];
    
    let missing = [];
    requiredContainers.forEach(id => {
        if (!document.getElementById(id)) {
            missing.push(id);
        }
    });
    
    if (missing.length > 0) {
        console.warn(`⚠️  Missing containers: ${missing.join(', ')}`);
    } else {
        console.log("  ✅ All containers found");
    }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K: Focus search (if search exists)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            // Add search functionality if needed
        }
        
        // Escape: Close modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    console.log("  ✅ Keyboard shortcuts registered");
}

/**
 * Close all open modals
 */
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        if (modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}

/**
 * Setup responsive listeners
 */
function setupResponsiveListeners() {
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Recalculate layouts if needed
        }, 250);
    });
    
    // Handle online/offline status
    window.addEventListener('online', () => {
        console.log("🌐 Back online");
        showNotification('✅ เชื่อมต่อเรียบร้อย', 'success');
    });
    
    window.addEventListener('offline', () => {
        console.log("📴 Lost connection");
        showNotification('❌ ออฟไลน์', 'error');
    });
    
    console.log("  ✅ Responsive listeners registered");
}

/**
 * Show notification toast
 * Wrapper for SweetAlert2
 */
function showNotification(message, type = 'info') {
    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
        
        Toast.fire({
            icon: type,
            title: message
        });
    } else {
        // Fallback if SweetAlert2 not loaded
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message);
    }
}

/**
 * Log API configuration status
 */
function logAPIStatus() {
    console.log("\n🔌 API Status:");
    console.log(`  Base URL: ${API_BASE_URL}`);
    
    // Test API connection
    fetch(`${API_BASE_URL}get_stations.php`)
        .then(r => {
            if (r.ok) {
                console.log("  ✅ API accessible");
            } else {
                console.warn(`  ⚠️  HTTP ${r.status} - API may not be configured correctly`);
            }
        })
        .catch(error => {
            console.error("  ❌ API connection failed:", error.message);
        });
}

// ============================================
// ✅ PAGE VISIBILITY HANDLING
// ============================================

/**
 * Handle page visibility changes
 * Reload data when user comes back to tab
 */
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log("👁️  Page became visible - checking data...");
        
        // Reload data if needed
        if (currentStationId) {
            console.log("  🔄 Refreshing station data...");
            loadStationData(currentStationId);
        }
    } else {
        console.log("👁️  Page hidden");
    }
});

// ============================================
// ✅ EXPORT FOR DEBUGGING
// ============================================

/**
 * Expose debug utilities to window
 * Use in console: window.__DEBUG.status()
 */
window.__DEBUG = {
    status: () => {
        console.table({
            'API_BASE_URL': API_BASE_URL,
            'currentStationId': currentStationId,
            'currentRoomId': currentRoomId,
            'currentFloor': currentFloor,
            'Departments Loaded': departments.length,
            'Procedures Loaded': allProcedures.length,
            'Swal Loaded': typeof Swal !== 'undefined'
        });
    },
    
    testAPI: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}get_stations.php`);
            const result = await response.json();
            console.log("API Test Result:", result);
            return result;
        } catch (error) {
            console.error("API Test Error:", error);
        }
    },
    
    reloadAll: async () => {
        console.log("🔄 Reloading all data...");
        await loadAllFloorsEnhanced();
        console.log("✅ Reload complete");
    },
    
    resetState: () => {
        currentStationId = null;
        currentRoomId = null;
        currentPatientId = null;
        console.log("✅ State reset");
    }
};

console.log("💡 Debug utilities available: window.__DEBUG.status(), .testAPI(), .reloadAll(), .resetState()");

// ============================================
// ✅ DONE!
// ============================================

console.log("━".repeat(50));
console.log("✅ app-init.js loaded successfully!");
console.log("━".repeat(50));
console.log("\nNext: Your custom scripts and station_room_management.js will load\n");
