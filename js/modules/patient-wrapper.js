// ========================================
// 🔄 WRAPPER: loadPatients -> loadPatientsList
// ========================================
// เพื่อให้เข้ากันกับ main.php เดิม

function loadPatients() {
    console.log('🔄 Redirecting loadPatients() → loadPatientsList()');
    
    // Ensure UI exists
    if (!document.getElementById('patientsLoading')) {
        createPatientTabUI();
    }
    
    return loadPatientsList();
}

// ========================================
// 🔄 WRAPPER: viewPatientDetail -> openPatientModal
// ========================================
function viewPatientDetail(patientId) {
    console.log(`🔄 Redirecting viewPatientDetail(${patientId}) → openPatientModal()`);
    
    // ดึงชื่อคนไข้จาก card ที่คลิก
    const patientCard = event.target.closest('[data-patient-id]');
    const patientName = patientCard ? patientCard.dataset.patientName : 'Patient';
    
    return openPatientModal(patientId, patientName);
}

// ========================================
// 🔄 WRAPPER: deletePatient (ซ่อนไว้)
// ========================================
function deletePatient(patientId) {
    console.warn('⚠️ deletePatient() not implemented in new system');
    alert('ยังไม่เปิดใช้งาน');
}