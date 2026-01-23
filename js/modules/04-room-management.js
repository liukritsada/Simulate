/**
 * ✅ FIXED: 04-room-management.js - Placeholder Functions Implemented
 * 
 * ✅ FIXES:
 * 1. removeRoomStaff() - IMPLEMENTED with API call
 * 2. removeRoomDoctor() - IMPLEMENTED with API call
 * 3. removeEquipment() - IMPLEMENTED with API call
 * 4. toggleEquipment() - IMPLEMENTED with API call
 * 5. Add proper error handling and notifications
 */

// ========================================
// ✅ IMPLEMENTATION: Remove Room Staff
// ========================================
/**
 * Remove staff member from room
 * @param {number} stationStaffId - Staff ID to remove
 * @param {string} staffName - Staff name for confirmation
 */
async function removeRoomStaff(stationStaffId, staffName) {
    if (!confirm(`ลบ ${staffName} ออกจากห้องนี้?`)) {
        return;
    }

    console.log("🗑️ Removing staff from room:", stationStaffId);

    try {
        // ✅ Show loading state
        const button = event?.target?.closest('button');
        if (button) button.disabled = true;

        const response = await fetch(getApiUrl('remove_staff_from_room.php'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                station_staff_id: stationStaffId,
                room_id: currentRoomId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log("✅ Staff removed successfully");

            // ✅ Show notification
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: "✅ ลบพนักงานสำเร็จ",
                    text: `${staffName} ถูกลบออกจากห้องแล้ว`,
                    icon: "success",
                    timer: 1500
                });
            } else {
                alert(`✅ ลบ ${staffName} สำเร็จแล้ว`);
            }

            // ✅ Refresh room detail
            if (typeof loadRoomDetail === 'function') {
                setTimeout(() => loadRoomDetail(currentRoomId), 500);
            }
        } else {
            throw new Error(result.message || 'Failed to remove staff');
        }

    } catch (error) {
        console.error("❌ Error removing staff:", error);

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: "❌ เกิดข้อผิดพลาด",
                text: error.message,
                icon: "error"
            });
        } else {
            alert(`❌ ไม่สามารถลบพนักงาน: ${error.message}`);
        }

    } finally {
        // ✅ Restore button state
        if (button) button.disabled = false;
    }
}

// ========================================
// ✅ IMPLEMENTATION: Remove Room Doctor
// ========================================
/**
 * Remove doctor from room
 * @param {number} stationDoctorId - Doctor ID to remove
 * @param {string} doctorName - Doctor name for confirmation
 */
async function removeRoomDoctor(stationDoctorId, doctorName) {
    if (!confirm(`ลบ ${doctorName} ออกจากห้องนี้?`)) {
        return;
    }

    console.log("🗑️ Removing doctor from room:", stationDoctorId);

    try {
        // ✅ Show loading state
        const button = event?.target?.closest('button');
        if (button) button.disabled = true;

        const response = await fetch(getApiUrl('remove_doctor_from_room.php'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                station_doctor_id: stationDoctorId,
                room_id: currentRoomId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log("✅ Doctor removed successfully");

            // ✅ Show notification
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: "✅ ลบแพทย์สำเร็จ",
                    text: `${doctorName} ถูกลบออกจากห้องแล้ว`,
                    icon: "success",
                    timer: 1500
                });
            } else {
                alert(`✅ ลบ ${doctorName} สำเร็จแล้ว`);
            }

            // ✅ Refresh room detail
            if (typeof loadRoomDetail === 'function') {
                setTimeout(() => loadRoomDetail(currentRoomId), 500);
            }

            // ✅ Trigger auto-assign doctor
            if (typeof triggerAutoAssignDoctor === 'function') {
                setTimeout(() => {
                    triggerAutoAssignDoctor(currentStationId);
                }, 800);
            }

        } else {
            throw new Error(result.message || 'Failed to remove doctor');
        }

    } catch (error) {
        console.error("❌ Error removing doctor:", error);

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: "❌ เกิดข้อผิดพลาด",
                text: error.message,
                icon: "error"
            });
        } else {
            alert(`❌ ไม่สามารถลบแพทย์: ${error.message}`);
        }

    } finally {
        // ✅ Restore button state
        if (button) button.disabled = false;
    }
}

// ========================================
// ✅ IMPLEMENTATION: Remove Equipment
// ========================================
/**
 * Remove equipment from room
 * @param {number} equipmentId - Equipment ID to remove
 */
async function removeEquipment(equipmentId) {
    if (!confirm('ลบเครื่องมือนี้ออกจากห้อง?')) {
        return;
    }

    console.log("🗑️ Removing equipment from room:", equipmentId);

    try {
        // ✅ Show loading state
        const button = event?.target?.closest('button');
        if (button) button.disabled = true;

        const response = await fetch(getApiUrl('remove_equipment_from_room.php'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                equipment_id: equipmentId,
                room_id: currentRoomId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log("✅ Equipment removed successfully");

            // ✅ Show notification
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: "✅ ลบเครื่องมือสำเร็จ",
                    icon: "success",
                    timer: 1500
                });
            } else {
                alert("✅ ลบเครื่องมือสำเร็จแล้ว");
            }

            // ✅ Refresh room detail
            if (typeof loadRoomDetail === 'function') {
                setTimeout(() => loadRoomDetail(currentRoomId), 500);
            }

        } else {
            throw new Error(result.message || 'Failed to remove equipment');
        }

    } catch (error) {
        console.error("❌ Error removing equipment:", error);

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: "❌ เกิดข้อผิดพลาด",
                text: error.message,
                icon: "error"
            });
        } else {
            alert(`❌ ไม่สามารถลบเครื่องมือ: ${error.message}`);
        }

    } finally {
        // ✅ Restore button state
        if (button) button.disabled = false;
    }
}

// ========================================
// ✅ IMPLEMENTATION: Toggle Equipment Active
// ========================================
/**
 * Toggle equipment active status
 * @param {number} equipmentId - Equipment ID to toggle
 * @param {boolean} isActive - Current active status
 */
async function toggleEquipment(equipmentId, isActive) {
    const newStatus = !isActive;
    const statusText = newStatus ? 'เปิด' : 'ปิด';

    console.log(`🔄 Toggling equipment ${equipmentId} to ${statusText}`);

    try {
        // ✅ Show loading state
        const button = event?.target?.closest('button');
        if (button) button.disabled = true;

        const response = await fetch(getApiUrl('manage_room_equipment.php'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                equipment_id: equipmentId,
                is_active: newStatus ? 1 : 0,
                room_id: currentRoomId,
                action: 'toggle'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Equipment toggled to ${statusText}`);

            // ✅ Refresh room detail
            if (typeof loadRoomDetail === 'function') {
                setTimeout(() => loadRoomDetail(currentRoomId), 300);
            }

        } else {
            throw new Error(result.message || 'Failed to toggle equipment');
        }

    } catch (error) {
        console.error("❌ Error toggling equipment:", error);

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: "❌ เกิดข้อผิดพลาด",
                text: error.message,
                icon: "error"
            });
        } else {
            alert(`❌ ไม่สามารถเปลี่ยนสถานะเครื่องมือ: ${error.message}`);
        }

    } finally {
        // ✅ Restore button state
        if (button) button.disabled = false;
    }
}

// ========================================
// ✅ Add These to Existing File
// ========================================

/**
 * Note: These implementations should be added to the existing 04-room-management.js file
 * Replace the placeholder functions starting at line 521 with these implementations.
 * 
 * The functions require:
 * - getApiUrl() function to build API endpoints
 * - currentRoomId global variable
 * - currentStationId global variable (for doctor auto-assign)
 * - Swal library (optional, falls back to alert)
 * - loadRoomDetail() function to refresh after changes
 * 
 * Also ensure these API endpoints exist:
 * - /api/remove_staff_from_room.php
 * - /api/remove_doctor_from_room.php
 * - /api/remove_equipment_from_room.php
 * - /api/manage_room_equipment.php (with toggle action)
 */