// ========================================
// 👥 PATIENTS MANAGEMENT MODULE (FIXED DRAG & DROP)
// ========================================
// Note: API_BASE_URL is declared in 01-api-config.js

// ========================================
// 🕐 COUNTDOWN TIMER FOR STATION LEVEL
// ========================================

const stationCountdownTimers = {}; // Store active station-level timers

function startStationCountdownTimer(patientId, countdownExitTime, displayElementId) {
  if (!patientId || !countdownExitTime) return;

  // ✅ Defensive: Validate countdown_exit_time format
  if (typeof countdownExitTime !== 'string' || countdownExitTime.trim() === '') {
    console.warn(`⚠️ Invalid countdown_exit_time for patient ${patientId}:`, countdownExitTime);
    return;
  }

  // Clear existing timer if any
  if (stationCountdownTimers[patientId]) {
    clearInterval(stationCountdownTimers[patientId]);
  }

  const updateCountdown = () => {
    const now = new Date();

    // ✅ Parse countdown_exit_time (format: YYYY-MM-DD HH:MM:SS or YYYY-MM-DD)
    const parts = countdownExitTime.split(' ');
    if (parts.length < 2) {
      // If no time component, assume 00:00:00
      console.warn(`⚠️ countdown_exit_time missing time component for patient ${patientId}:`, countdownExitTime);
      return;
    }

    const datePart = parts[0];
    const timePart = parts[1];

    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    const targetTime = new Date(year, month - 1, day, hours, minutes, seconds);
    const diffMs = targetTime - now;
    const minutes_remaining = Math.ceil(diffMs / 60000);

    const element = document.getElementById(displayElementId);
    if (!element) {
      clearInterval(stationCountdownTimers[patientId]);
      delete stationCountdownTimers[patientId];
      return;
    }

    if (minutes_remaining <= 0) {
      element.innerHTML = '<span style="font-size: 14px;">⏱️</span> หมดเวลา';
      element.style.color = '#ef4444';
      element.style.fontWeight = '700';
      clearInterval(stationCountdownTimers[patientId]);
      delete stationCountdownTimers[patientId];
    } else {
      const color = minutes_remaining <= 5 ? '#ef4444' : (minutes_remaining <= 10 ? '#f59e0b' : '#10b981');
      element.innerHTML = `<span style="font-size: 14px;">⏱️</span> ${minutes_remaining}น`;
      element.style.color = color;
      element.style.fontWeight = minutes_remaining <= 5 ? '700' : '600';
    }
  };

  updateCountdown(); // Initial update
  stationCountdownTimers[patientId] = setInterval(updateCountdown, 1000);
}

// ========================================
// 📋 Load Patients List (ENHANCED)
// ========================================
async function loadPatientsList() {
    try {
        const dateEl = document.getElementById('patientDateFilter');
        const statusEl = document.getElementById('patientStatusFilter');
        const doctorEl = document.getElementById('patientDoctorFilter');
        
        if (!dateEl) {
            console.warn('⚠️ patientDateFilter not found - creating UI elements');
            createPatientTabUI();
            return;
        }

        const date = dateEl.value;
        const status = statusEl ? statusEl.value : '';
        const doctor_code = doctorEl ? doctorEl.value : '';

        if (!date) {
            alert('กรุณาเลือกวันที่');
            return;
        }

        // ✅ Populate doctors dropdown เมื่อเปลี่ยนวันที่
        if (typeof populateDoctorsDropdown === 'function') {
            await populateDoctorsDropdown(date);
        }

        const loading = document.getElementById('patientsLoading');
        const patientsList = document.getElementById('patientsList');
        const noPatients = document.getElementById('noPatients');

        if (loading) loading.style.display = 'block';
        if (patientsList) patientsList.innerHTML = '';
        if (noPatients) noPatients.style.display = 'none';

        let query = `date=${date}`;
        if (status) query += `&status=${status}`;
        if (doctor_code) query += `&doctor_code=${doctor_code}`;

        console.log(`🔄 Loading patients: ${query}`);

        const cleanApiUrl = API_BASE_URL.replace(/\/+$/, '');
        const apiUrl = `${cleanApiUrl}/get_patients_list.php?${query}`;
        console.log(`🔗 API URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // ✅ Better error handling for JSON parsing
        let text = await response.text();
        console.log(`📨 Response length: ${text.length} chars`);
        console.log(`📨 Response text: ${text.substring(0, 300)}`);
        
        if (!text || text.trim() === '') {
            throw new Error('❌ API returned empty response.\n\n📍 Check if file exists:\n/hospital/api/get_patients_list.php\n\n🔧 Or run diagnostic:\nhttp://127.0.0.1/hospital/api/diagnostic.php');
        }
        
        // Try to parse JSON
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('❌ JSON Parse Error:', e);
            console.error('Response was:', text);
            throw new Error(`❌ Invalid JSON response (${e.message}).\n\nPossible causes:\n1. File not uploaded to /hospital/api/\n2. Database connection error\n3. PHP syntax error\n4. No data for selected date\n\n📍 Test: http://127.0.0.1/hospital/api/get_patients_list.php?date=2026-01-22`);
        }
        
        if (!result.success) throw new Error(result.message);

        const patients = result.data.patients;

        if (patients.length === 0) {
            if (loading) loading.style.display = 'none';
            if (noPatients) noPatients.style.display = 'block';
            return;
        }

        // ✅ Clear all existing station-level countdown timers to prevent memory leak
        Object.keys(stationCountdownTimers).forEach(patientId => {
            clearInterval(stationCountdownTimers[patientId]);
            delete stationCountdownTimers[patientId];
        });
        console.log('🧹 Cleared all previous station countdown timers');

        // Display patient table with enhanced design
        if (patientsList) {
            patientsList.innerHTML = '';

            const tableHtml = `
                <div style="overflow-x: auto; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <table style="width: 100%; border-collapse: collapse; background: white;">
                        <thead>
                            <tr style="background: linear-gradient(135deg, #1F4788 0%, #145A7E 100%); color: white; font-weight: 600;">
                                <th style="padding: 16px 12px; text-align: center; font-size: 13px; letter-spacing: 0.5px;">#</th>
                                <th style="padding: 16px 12px; text-align: center; font-size: 13px; letter-spacing: 0.5px;">เพศ</th>
                                <th style="padding: 16px 12px; text-align: left; font-size: 13px; letter-spacing: 0.5px;">ชื่อ-สกุล</th>
                                <th style="padding: 16px 12px; text-align: center; font-size: 13px; letter-spacing: 0.5px;">HN</th>
                                <th style="padding: 16px 12px; text-align: center; font-size: 13px; letter-spacing: 0.5px;">วันที่นัด</th>
                                <th style="padding: 16px 12px; text-align: center; font-size: 13px; letter-spacing: 0.5px;">เวลาเริ่ม</th>
                                <th style="padding: 16px 12px; text-align: center; font-size: 13px; letter-spacing: 0.5px;">เวลารอ</th>
                                <th style="padding: 16px 12px; text-align: center; font-size: 13px; letter-spacing: 0.5px;">แพทย์</th>
                                <th style="padding: 16px 12px; text-align: center; font-size: 13px; letter-spacing: 0.5px;">Station ปัจจุบัน</th>
                                <th style="padding: 16px 12px; text-align: center; font-size: 13px; letter-spacing: 0.5px;">สถานะ</th>
                                <th style="padding: 16px 12px; text-align: center; font-size: 13px; letter-spacing: 0.5px;">จำนวนหัตถการ</th>
                                <th style="padding: 16px 12px; text-align: center; font-size: 13px; letter-spacing: 0.5px;">แอ็กชั่น</th>
                            </tr>
                        </thead>
                        <tbody id="patientTableBody">
                        </tbody>
                    </table>
                </div>
            `;
            
            patientsList.innerHTML = tableHtml;
            const tbody = document.getElementById('patientTableBody');
            
            patients.forEach((patient, index) => {
                const row = document.createElement('tr');

                // 🎯 ฟังก์ชันคำนวณเวลารอ (ใช้ time_target และ time_target_wait จาก station_patients)
                function getWaitingTimeStatus(appointmentDate, arrivalTime, startTime, timeTarget, timeTargetWait) {
                    if (!appointmentDate) return { emoji: '⏳', color: '#3498db', text: 'ไม่ทราบ', bgColor: '#e8f4f8' };

                    // ถ้ากำลังทำหัตถการ (มี start_time แล้ว)
                    if (startTime) {
                        return { emoji: '⚕️', color: '#f39c12', text: 'กำลังรักษา', bgColor: '#fffaf0' };
                    }

                    // ถ้ายังไม่มาถึง (ไม่มี arrival_time)
                    if (!arrivalTime) {
                        return { emoji: '📅', color: '#9b59b6', text: 'ยังไม่มาถึง', bgColor: '#f5f0fa' };
                    }

                    // คำนวณเวลารอ (จาก arrival_time)
                    const arrivalDateTime = new Date(appointmentDate + 'T' + arrivalTime).getTime();
                    const now = new Date().getTime();
                    const diffMs = now - arrivalDateTime;
                    const diffMinutes = Math.floor(diffMs / 60000);

                    // ถ้ายังไม่ถึงเวลา
                    if (diffMinutes < 0) {
                        return { emoji: '📅', color: '#9b59b6', text: 'ยังไม่ถึงเวลา', bgColor: '#f5f0fa' };
                    }

                    // ✅ เกณฑ์ใหม่: เปรียบเทียบเวลาปัจจุบันกับ time_target และ time_target_wait
                    const currentTime = new Date();
                    const currentTimeStr = currentTime.toTimeString().split(' ')[0]; // HH:MM:SS

                    // 😊 ได้ทำเลย = เวลาปัจจุบัน ≤ time_target (ยังไม่เกินเวลาที่ต้องเสร็จ)
                    if (timeTarget && currentTimeStr <= timeTarget) {
                        return { emoji: '😊', color: '#27ae60', text: `รอ ${diffMinutes} นาที`, bgColor: '#f0fdf4' };
                    }
                    // 😐 รอไม่เกิน = time_target < เวลาปัจจุบัน ≤ time_target_wait
                    else if (timeTargetWait && currentTimeStr <= timeTargetWait) {
                        return { emoji: '😐', color: '#f39c12', text: `รอ ${diffMinutes} นาที`, bgColor: '#fffbf0' };
                    }
                    // 😡 รอเกินไป = เวลาปัจจุบัน > time_target_wait
                    else {
                        return { emoji: '😡', color: '#e74c3c', text: `รอ ${diffMinutes} นาที`, bgColor: '#fef2f2' };
                    }
                }

                // 🎭 ฟังก์ชันแสดงเพศ
                function getGenderIcon(gender) {
                    // ถ้าไม่มีข้อมูล ให้แสดง ?
                    if (!gender && gender !== 0) return { icon: '?', color: '#95a5a6', bgColor: '#ecf0f1', text: 'ไม่ระบุ' };

                    // ✅ Handle both string and numeric values
                    let genderStr = String(gender).toLowerCase().trim();

                    if (genderStr === 'm' || genderStr === 'male' || gender === 1) {
                        return { icon: 'M', color: '#3498db', bgColor: '#ebf5fb', text: 'ชาย' };
                    } else if (genderStr === 'f' || genderStr === 'female' || gender === 2) {
                        return { icon: 'F', color: '#e91e63', bgColor: '#fce4ec', text: 'หญิง' };
                    }

                    return { icon: '?', color: '#95a5a6', bgColor: '#ecf0f1', text: 'ไม่ระบุ' };
                }

                // สถานะ: สี และ ข้อความ
                const statusConfig = {
                    'waiting': { color: '#3498db', text: 'รอคิว', icon: '⏳' },
                    'in_process': { color: '#f39c12', text: 'กำลังทำ', icon: '⚕️' },
                    'completed': { color: '#27ae60', text: 'เสร็จสิ้น', icon: '✅' }
                };

                const status = statusConfig[patient.status] || { color: '#95a5a6', text: 'ไม่ทราบ', icon: '❓' };
                const genderIcon = getGenderIcon(patient.gender);
                const waitingTimeData = getWaitingTimeStatus(
                    patient.appointment_date,
                    patient.arrival_time,
                    patient.start_time,
                    patient.time_target,      // ✅ เวลาที่ต้องเสร็จ
                    patient.time_target_wait  // ✅ ช้าสุดที่ทำเสร็จได้
                );

                // ✅ Set row background color based on waiting time status
                row.style.cssText = `
                    background: ${waitingTimeData.bgColor};
                    transition: all 0.2s ease;
                    border-bottom: 1px solid #f0f0f0;
                `;
                
                row.innerHTML = `
                    <td style="padding: 14px 12px; text-align: center; color: #333; font-weight: 700; font-size: 13px;">
                        ${index + 1}
                    </td>
                    <td style="padding: 14px 12px; text-align: center;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                            <span style="
                                display: inline-block;
                                width: 32px;
                                height: 32px;
                                line-height: 32px;
                                border-radius: 50%;
                                background: ${genderIcon.bgColor};
                                color: ${genderIcon.color};
                                font-weight: 700;
                                font-size: 13px;
                            ">
                                ${genderIcon.icon}
                            </span>
                            <span style="font-size: 11px; color: ${genderIcon.color}; font-weight: 600;">
                                ${genderIcon.text}
                            </span>
                        </div>
                    </td>
                    <td style="padding: 14px 12px; color: #333; font-weight: 600; font-size: 13px;">
                        ${patient.patient_name}
                    </td>
                    <td style="padding: 14px 12px; text-align: center; color: #1F4788; font-weight: 700; font-size: 13px;">
                        ${patient.hn}
                    </td>
                    <td style="padding: 14px 12px; text-align: center; color: #666; font-size: 13px;">
                        ${formatDate(patient.appointment_date)}
                    </td>
                    <td style="padding: 14px 12px; text-align: center; color: #666; font-size: 13px;">
                        ${patient.start_time || '-'}
                    </td>
                    <td style="padding: 14px 12px; text-align: center;">
                        ${patient.status === 'in_process' && patient.countdown_exit_time ? `
                            <span id="countdown_${patient.patient_id}" style="
                                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                                color: white;
                                padding: 6px 12px;
                                border-radius: 20px;
                                font-size: 12px;
                                font-weight: 700;
                                display: inline-block;
                                border: 1px solid #f59e0b;
                                white-space: nowrap;
                            ">
                                <span style="font-size: 14px;">⏱️</span> นับถอยหลัง...
                            </span>
                        ` : `
                            <span style="
                                background: ${waitingTimeData.color}22;
                                color: ${waitingTimeData.color};
                                padding: 6px 12px;
                                border-radius: 20px;
                                font-size: 12px;
                                font-weight: 700;
                                display: inline-block;
                                border: 1px solid ${waitingTimeData.color}44;
                                white-space: nowrap;
                            ">
                                <span style="font-size: 16px;">${waitingTimeData.emoji}</span>
                                ${waitingTimeData.text}
                            </span>
                        `}
                    </td>
                    
                    <td style="padding: 14px 12px; text-align: center; color: #666; font-size: 13px;">
                        ${patient.doctor_name || patient.doctor_code || '-'}
                    </td>
                    <!-- ✅ Current Station Name -->
                    <td style="padding: 14px 12px; text-align: center; color: #1F4788; font-weight: 600; font-size: 13px;">
                        ${patient.current_station_name || '-'}
                    </td>
                    <!-- ✅ Station Status & Procedure -->
                    <td style="padding: 14px 12px; text-align: center;">
                        ${patient.current_station_name ? `
                            <div style="text-align: center;">
                                <div style="font-size: 13px; font-weight: 600; color: #333; margin-bottom: 4px;">
                                    ${patient.current_procedure_code || 'ไม่ระบุ'}
                                </div>
                                <span style="
                                    background: ${patient.current_station_status === 'in_process' ? '#fff9e6' : '#e8f4f8'};
                                    color: ${patient.current_station_status === 'in_process' ? '#f39c12' : '#0056b3'};
                                    padding: 4px 10px;
                                    border-radius: 12px;
                                    font-size: 11px;
                                    font-weight: 600;
                                    display: inline-block;
                                    border: 1px solid ${patient.current_station_status === 'in_process' ? '#f39c1244' : '#0056b344'};
                                ">
                                    ${patient.current_station_status === 'in_process' ? '⚕️ เข้าห้อง' : '⏳ รอคิว'}
                                </span>
                            </div>
                        ` : `
                            <span style="color: #999; font-size: 12px;">-</span>
                        `}
                    </td>
                    <td style="padding: 14px 12px; text-align: center; font-weight: 700; color: #1F4788; font-size: 13px;">
                        ${patient.total_procedures || patient.procedure_count || 0}
                    </td>
                    <td style="padding: 14px 12px; text-align: center;">
                        <button onclick="openPatientModal(${patient.patient_id}, '${patient.patient_name}', '${patient.hn}', '${patient.appointment_date}', ${patient.total_procedures})" 
                            style="
                                padding: 8px 16px;
                                background: linear-gradient(135deg, #1F4788 0%, #145A7E 100%);
                                border: none;
                                border-radius: 6px;
                                color: white;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 12px;
                                transition: all 0.3s;
                                box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
                            "
                            onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';"
                            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(102, 126, 234, 0.2)';"
                        >
                            <i class="fas fa-eye"></i> ดูรายละเอียด
                        </button>
                    </td>
                `;
                
                // Hover effect
                row.addEventListener('mouseover', () => {
                    row.style.background = 'linear-gradient(90deg, rgba(102, 126, 234, 0.08) 0%, rgba(102, 126, 234, 0) 100%)';
                });
                
                row.addEventListener('mouseout', () => {
                    row.style.background = 'white';
                });

                tbody.appendChild(row);

                // ✅ Initialize countdown timer for in-process patients
                if (patient.status === 'in_process' && patient.countdown_exit_time) {
                    startStationCountdownTimer(
                        patient.patient_id,
                        patient.countdown_exit_time,
                        `countdown_${patient.patient_id}`
                    );
                }
            });

            // Add summary at bottom
            const summaryHtml = `
                <div style="
                    margin-top: 20px;
                    padding: 16px;
                    background: rgba(102, 126, 234, 0.05);
                    border-radius: 8px;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    border: 1px solid rgba(102, 126, 234, 0.2);
                ">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #1F4788;">${patients.length}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">จำนวนผู้ป่วยทั้งหมด</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #3498db;">${patients.filter(p => p.status === 'waiting').length}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">รอคิว</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #f39c12;">${patients.filter(p => p.status === 'in_process').length}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">กำลังทำ</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #27ae60;">${patients.filter(p => p.status === 'completed').length}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">เสร็จสิ้น</div>
                    </div>
                </div>
            `;

            patientsList.innerHTML += summaryHtml;
        }

        if (loading) loading.style.display = 'none';
        console.log(`✅ Loaded ${patients.length} patients`);

    } catch (error) {
        console.error('❌ Error loading patients:', error);
        alert('เกิดข้อผิดพลาด: ' + error.message);
        const loading = document.getElementById('patientsLoading');
        if (loading) loading.style.display = 'none';
    }
}

// ========================================
// 🗓️ Format Date (Thai Format)
// ========================================
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    });
}

// ========================================
// 📋 Open Patient Modal with Procedures
// ========================================
async function openPatientModal(patientId, patientName, hn, appointmentDate, totalProcedures) {
    try {
        console.log(`📋 Opening modal for patient: ${patientId} (${hn}, ${appointmentDate})`);

        const cleanApiUrl = API_BASE_URL.replace(/\/+$/, '');
        const apiUrl = `${cleanApiUrl}/get_patient_procedures.php?patient_id=${patientId}&hn=${hn}&appointment_date=${appointmentDate}`;
        
        console.log(`🔗 API URL: ${apiUrl}`);

        const response = await fetch(apiUrl);
        
        console.log(`📊 Response status: ${response.status}`);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        
        console.log(`✅ API Response:`, result);

        if (!result.success) throw new Error(result.message);

        // Store procedures data globally for drag & drop
        window.currentPatientProcedures = result.data.procedures;
        window.currentPatientId = patientId;
        window.currentPatientHN = hn;
        window.currentAppointmentDate = appointmentDate;

        // Create modal HTML with Drag & Drop support
        const proceduresHtml = result.data.procedures.map((proc, idx) => {
            // ✅ Determine completion status
            const isCompleted = proc.Actual_Time !== null && proc.Actual_Time !== undefined;
            const completionEmoji = isCompleted ? '✅' : '⏳';
            const completionTime = isCompleted ? proc.Actual_Time : '-';
            const borderColor = isCompleted ? '#10b981' : '#1F4788';
            const backgroundColor = isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'white';

            return `
            <div
                draggable="true"
                class="procedure-item"
                data-procedure-id="${proc.id}"
                data-running-number="${proc.running_number}"
                data-procedure-name="${proc.procedure_name.replace(/"/g, '&quot;')}"
                style="
                    padding: 16px;
                    background: ${backgroundColor};
                    border-left: 4px solid ${borderColor};
                    margin-bottom: 12px;
                    border-radius: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                    cursor: grab;
                    transition: all 0.2s ease;
                    user-select: none;
                    position: relative;
                "
            >
                <div style="flex: 1; display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 20px; cursor: grab;">≡</span>
                    <div>
                        <div style="font-weight: 700; color: var(--text); font-size: 15px;" class="procedure-name">
                            ${proc.running_number}. ${proc.procedure_name}
                        </div>
                        <div style="font-size: 11px; color: #999; margin-top: 2px;">
                            ลาก-วางเพื่อจัดลำดับ
                        </div>
                    </div>
                </div>
                <div style="text-align: right; min-width: 140px;">
                    <!-- Status Indicator -->
                    <div style="font-weight: 700; font-size: 18px; margin-bottom: 6px; color: ${isCompleted ? '#10b981' : '#f59e0b'};">
                        ${completionEmoji}
                    </div>
                    <!-- Scheduled Time -->
                    <div style="font-weight: 600; color: #1F4788; font-size: 13px;">
                        📅 ${proc.time_start ? proc.time_start : '-'}
                    </div>
                    <!-- Actual Completion Time -->
                    <div style="font-size: 12px; color: ${isCompleted ? '#10b981' : '#999'}; margin-top: 4px; font-weight: ${isCompleted ? '600' : '400'};">
                        ${isCompleted ? '✓ เสร็จ: ' + completionTime : 'รอ'}
                    </div>
                </div>
            </div>
        `;
        }).join('');

        const modalHtml = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                padding: 20px;
            " id="patientModalOverlay" onclick="if(event.target.id === 'patientModalOverlay') closePatientModal();">
                <div style="
                    background: white;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    animation: slideIn 0.3s ease;
                " id="patientModal">
                    <!-- Header -->
                    <div style="
                        padding: 20px;
                        background: linear-gradient(135deg, #1F4788 0%, #145A7E 100%);
                        color: white;
                        border-radius: 12px 12px 0 0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <div style="font-size: 18px; font-weight: 700;">👥 ${patientName}</div>
                            <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">HN: ${hn} | วันนัด: ${formatDate(appointmentDate)}</div>
                            <div style="font-size: 12px; opacity: 0.8; margin-top: 6px;">📋 รวม ${totalProcedures || result.data.procedures.length} หัตถการ</div>
                        </div>
                        <button onclick="closePatientModal()" style="
                            background: rgba(255,255,255,0.3);
                            border: none;
                            color: white;
                            width: 36px;
                            height: 36px;
                            border-radius: 50%;
                            cursor: pointer;
                            font-size: 18px;
                            transition: all 0.3s;
                        " onmouseover="this.style.background='rgba(255,255,255,0.5)';" onmouseout="this.style.background='rgba(255,255,255,0.3)';">
                            ✕
                        </button>
                    </div>

                    <!-- Content -->
                    <div style="padding: 20px;">
                        <div style="margin-bottom: 20px;">
                            <div style="font-weight: 700; font-size: 14px; margin-bottom: 12px; color: var(--text);">
                                📋 รายการหัตถการ (${result.data.procedures.length} รายการ)
                            </div>
                            <div id="proceduresList">
                                ${proceduresHtml}
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="
                        padding: 16px 20px;
                        border-top: 1px solid #f0f0f0;
                        display: flex;
                        gap: 10px;
                        justify-content: flex-end;
                    ">
                        <button onclick="closePatientModal()" style="
                            padding: 10px 20px;
                            background: #f0f0f0;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            color: #666;
                            transition: all 0.3s;
                        " onmouseover="this.style.background='#e0e0e0';" onmouseout="this.style.background='#f0f0f0';">
                            ปิด
                        </button>
                    </div>
                </div>
            </div>
            <style>
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // ✅ Attach event listeners to procedure items
        setTimeout(() => {
            initProcedureDragDrop();
        }, 100);

    } catch (error) {
        console.error('❌ Error opening modal:', error);
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
}

// ========================================
// ❌ Close Patient Modal
// ========================================
function closePatientModal() {
    const modal = document.getElementById('patientModalOverlay');
    if (modal) {
        modal.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    }
}

// ========================================
// 🎯 PROCEDURE Drag & Drop Functions (Unique Names)
// ========================================

let procDraggedElement = null;
let procDraggedId = null;
let procDraggedRunningNumber = null;

function initProcedureDragDrop() {
    const procedureItems = document.querySelectorAll('.procedure-item');
    procedureItems.forEach(item => {
        item.addEventListener('dragstart', handleProcedureDragStart, false);
        item.addEventListener('dragover', handleProcedureDragOver, false);
        item.addEventListener('drop', handleProcedureDrop, false);
        item.addEventListener('dragend', handleProcedureDragEnd, false);
        item.addEventListener('dragenter', handleProcedureDragEnter, false);
        item.addEventListener('dragleave', handleProcedureDragLeave, false);
    });
    console.log(`✅ Attached drag event listeners to ${procedureItems.length} procedure items`);
}

function handleProcedureDragStart(event) {
    procDraggedElement = event.currentTarget;
    procDraggedId = parseInt(procDraggedElement.getAttribute('data-procedure-id'));
    procDraggedRunningNumber = parseInt(procDraggedElement.getAttribute('data-running-number'));
    
    event.dataTransfer.effectAllowed = 'move';
    procDraggedElement.style.opacity = '0.4';
    procDraggedElement.style.background = 'rgba(102, 126, 234, 0.2)';
    procDraggedElement.style.transform = 'scale(0.98) rotate(2deg)';
    
    console.log(`🎯 Dragging: Procedure ${procDraggedId} (order: ${procDraggedRunningNumber})`);
}

function handleProcedureDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function handleProcedureDragEnter(event) {
    const element = event.target.closest('.procedure-item');
    if (element && element !== procDraggedElement) {
        element.style.transform = 'scale(1.02)';
        element.style.background = 'rgba(102, 126, 234, 0.05)';
        element.style.borderLeft = '4px solid #51cf66';
    }
}

function handleProcedureDragLeave(event) {
    const element = event.target.closest('.procedure-item');
    if (element && element !== procDraggedElement) {
        element.style.transform = 'scale(1)';
        element.style.background = 'white';
        element.style.borderLeft = '4px solid #1F4788';
    }
}

function handleProcedureDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const targetElement = event.target.closest('.procedure-item');
    if (!targetElement) return;
    
    const targetProcedureId = parseInt(targetElement.getAttribute('data-procedure-id'));
    
    // Clear all styling
    document.querySelectorAll('.procedure-item').forEach(el => {
        el.style.transform = 'scale(1)';
        el.style.background = 'white';
        el.style.borderLeft = '4px solid #1F4788';
    });
    
    // Only proceed if dropped on different element
    if (procDraggedId !== targetProcedureId && procDraggedElement) {
        // Get current running numbers from DOM
        const draggedRunNum = parseInt(procDraggedElement.getAttribute('data-running-number'));
        const targetRunNum = parseInt(targetElement.getAttribute('data-running-number'));
        
        console.log(`📍 Swapping: Procedure ${procDraggedId} (order ${draggedRunNum}) ↔️ Procedure ${targetProcedureId} (order ${targetRunNum})`);
        
        // Reorder in DOM
        const parent = targetElement.parentElement;
        
        if (draggedRunNum < targetRunNum) {
            // Dragging down - insert after target
            parent.insertBefore(procDraggedElement, targetElement.nextSibling);
        } else {
            // Dragging up - insert before target
            parent.insertBefore(procDraggedElement, targetElement);
        }
        
        // Reorder ALL running numbers sequentially
        reorderProcedureNumbers();
        
        // Get the NEW running number of dragged item after reordering
        const newRunningNum = parseInt(procDraggedElement.getAttribute('data-running-number'));
        
        // Show toast notification
        showProcedureUpdateToast(draggedRunNum, newRunningNum);
        
        // ✅ Call API with FULL list of procedures
        updateAllProcedureOrdersAsync();
    }
}

function handleProcedureDragEnd(event) {
    // ลบ styling
    document.querySelectorAll('.procedure-item').forEach(el => {
        el.style.opacity = '1';
        el.style.background = 'white';
        el.style.borderLeft = '4px solid #1F4788';
        el.style.transform = 'scale(1)';
    });
    
    procDraggedElement = null;
    procDraggedId = null;
    procDraggedRunningNumber = null;
    
    console.log(`✅ Drag ended`);
}

// ✅ Show toast notification
function showProcedureUpdateToast(oldOrder, newOrder) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'อัพเดทแล้ว!',
            html: `ลำดับ <strong style="color: #ff6b6b;">${oldOrder}</strong> → <strong style="color: #51cf66;">${newOrder}</strong>`,
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: false,
            background: '#fff',
            didOpen: (modal) => {
                modal.style.zIndex = '10001';
            }
        });
    }
}

// ✅ Reorder running numbers after drag & drop
function reorderProcedureNumbers() {
    const items = document.querySelectorAll('.procedure-item');
    
    // Assign sequential numbers based on current DOM order
    items.forEach((item, index) => {
        const newRunningNum = index + 1;
        item.setAttribute('data-running-number', newRunningNum);
        
        // Update display text with new number
        const nameElement = item.querySelector('.procedure-name');
        if (nameElement) {
            // Get original procedure name from data attribute
            const procName = item.getAttribute('data-procedure-name');
            
            // Set new text with only the current running number
            nameElement.textContent = `${newRunningNum}. ${procName}`;
        }
    });
    
    console.log(`✅ Reordered procedure numbers (total: ${items.length})`);
}

// ✅ Update ALL procedures order at once (sends complete array to API)
async function updateAllProcedureOrdersAsync() {
    const cleanApiUrl = API_BASE_URL.replace(/\/+$/, '');
    const url = `${cleanApiUrl}/update_procedure_order.php`;
    
    // ✅ Collect ALL procedures with their NEW running numbers
    const items = document.querySelectorAll('.procedure-item');
    const procedures = Array.from(items).map(item => ({
        id: parseInt(item.getAttribute('data-procedure-id')),
        running_number: parseInt(item.getAttribute('data-running-number'))
    }));
    
    const requestBody = {
        hn: window.currentPatientHN,
        appointment_date: window.currentAppointmentDate,
        procedures: procedures  // ✅ Send complete array
    };
    
    console.log(`💾 Saving ALL procedure orders:`, requestBody);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`✅ Saved: ${data.message}`, data.data);
        } else {
            console.log(`⚠️ Error: ${data.message}`);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: data.message,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            }
        }
    } catch (error) {
        console.error(`❌ API Error:`, error);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกลำดับได้',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    }
}

// ========================================
// 🛠️ Create Patient Tab UI (Enhanced)
// ========================================
function createPatientTabUI() {
    const patientsDiv = document.getElementById('patients');
    if (!patientsDiv) return;

    patientsDiv.innerHTML = `
        <div class="stations-container">
            <div class="stations-header">
                <div class="floor-title">👥 จัดการผู้ป่วย</div>
                <button class="btn btn-success" onclick="loadPatientsList()" style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: linear-gradient(135deg, #51cf66 0%, #37b24d 100%);
                    border: none;
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s;
                    box-shadow: 0 2px 8px rgba(81, 207, 102, 0.3);
                ">
                    <i class="fas fa-search"></i> ค้นหา
                </button>
            </div>
            
            <div style="
                margin-bottom: 20px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 15px;
                padding: 20px;
                background: linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%);
                border-radius: 12px;
                border: 1px solid rgba(102, 126, 234, 0.1);
            ">
                <div>
                    <label for="patientDateFilter" style="
                        display: block;
                        font-weight: 700;
                        margin-bottom: 8px;
                        color: var(--text);
                        font-size: 13px;
                    ">📅 วันที่นัดหมาย</label>
                    <input type="date" id="patientDateFilter" style="
                        width: 100%;
                        padding: 10px 12px;
                        border: 2px solid #e0e0e0;
                        border-radius: 6px;
                        font-size: 14px;
                        transition: all 0.3s;
                    " onfocus="this.style.borderColor='#1F4788'; this.style.boxShadow='0 0 0 3px rgba(102,126,234,0.1)';" onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';">
                </div>
                <div>
                    <label for="patientStatusFilter" style="
                        display: block;
                        font-weight: 700;
                        margin-bottom: 8px;
                        color: var(--text);
                        font-size: 13px;
                    ">📊 สถานะ</label>
                    <select id="patientStatusFilter" style="
                        width: 100%;
                        padding: 10px 12px;
                        border: 2px solid #e0e0e0;
                        border-radius: 6px;
                        font-size: 14px;
                        transition: all 0.3s;
                        background: white;
                    ">
                        <option value="">ทั้งหมด</option>
                        <option value="waiting">⏳ รอคิว</option>
                        <option value="in_process">⚕️ กำลังทำหัตถการ</option>
                        <option value="completed">✅ เสร็จสิ้น</option>
                    </select>
                </div>
                <div>
                    <label for="patientDoctorFilter" style="
                        display: block;
                        font-weight: 700;
                        margin-bottom: 8px;
                        color: var(--text);
                        font-size: 13px;
                    ">👨‍⚕️ แพทย์</label>
                    <select id="patientDoctorFilter" style="
                        width: 100%;
                        padding: 10px 12px;
                        border: 2px solid #e0e0e0;
                        border-radius: 6px;
                        font-size: 14px;
                        transition: all 0.3s;
                        background: white;
                    ">
                        <option value="">ทั้งหมด</option>
                    </select>
                </div>
            </div>

            <div id="patientsLoading" style="
                display: none;
                text-align: center;
                padding: 60px 20px;
            ">
                <div style="
                    display: inline-block;
                    width: 50px;
                    height: 50px;
                    border: 4px solid #e0e0e0;
                    border-top: 4px solid #1F4788;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                <p style="
                    margin-top: 20px;
                    color: #1F4788;
                    font-weight: 600;
                    font-size: 14px;
                ">กำลังโหลดข้อมูล...</p>
            </div>

            <div id="patientsList" style="margin-top: 20px;">
            </div>

            <div id="noPatients" style="
                display: none;
                text-align: center;
                padding: 80px 20px;
                color: #bdc3c7;
            ">
                <i class="fas fa-inbox" style="
                    font-size: 60px;
                    display: block;
                    margin-bottom: 15px;
                    color: #ddd;
                "></i>
                <p style="font-size: 16px; font-weight: 500;">ไม่พบข้อมูลคนไข้</p>
            </div>
        </div>

        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            @keyframes slideOut {
                to {
                    opacity: 0;
                    transform: translateY(20px);
                }
            }
        </style>
    `;

    // Set today's date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateInput = document.getElementById('patientDateFilter');
    if (dateInput) {
        dateInput.value = `${year}-${month}-${day}`;
    }
}

// ========================================
// 🚀 Initialize on Page Load
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Patients Management (FIXED)...');
    
    setTimeout(() => {
        if (!document.getElementById('patientsLoading')) {
            console.log('ℹ️ Creating Patient UI elements...');
            createPatientTabUI();
        }
    }, 100);

    console.log('✅ Patients Management Ready (FIXED)');
});

// ========================================
// 👨‍⚕️ DOCTORS DROPDOWN FUNCTIONS
// ========================================

/**
 * ดึง doctors list จาก API
 */
async function loadDoctorsList(date) {
    try {
        if (!date) {
            console.warn('⚠️ No date provided');
            return [];
        }
        
        const cleanApiUrl = API_BASE_URL.replace(/\/+$/, '');
        const apiUrl = `${cleanApiUrl}/get_doctors_list.php?date=${date}`;
        
        console.log(`🔄 Loading doctors: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        console.log(`✅ Loaded ${data.data.count} doctors`);
        
        return data.data.doctors;
        
    } catch (error) {
        console.error('❌ Error loading doctors:', error);
        return [];
    }
}

/**
 * Populate doctors dropdown
 */
async function populateDoctorsDropdown(dateValue) {
    try {
        const doctorSelect = document.getElementById('patientDoctorFilter');
        
        if (!doctorSelect) {
            console.warn('⚠️ patientDoctorFilter not found');
            return;
        }
        
        // เคลียร์ options เดิม (เก็บ default option)
        const defaultOption = doctorSelect.querySelector('option[value=""]');
        doctorSelect.innerHTML = '';
        
        if (defaultOption) {
            doctorSelect.appendChild(defaultOption);
        } else {
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'ทั้งหมด';
            doctorSelect.appendChild(emptyOption);
        }
        
        // ดึงรายชื่อหมอ
        const doctors = await loadDoctorsList(dateValue);
        
        if (doctors.length === 0) {
            console.log('ℹ️ No doctors found');
            return;
        }
        
        // เพิ่ม options
        doctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.doctor_code || '';
            option.textContent = doctor.doctor_name || 'ไม่ระบุ';
            doctorSelect.appendChild(option);
        });
        
        console.log(`✅ Populated ${doctors.length} doctors in dropdown`);
        
    } catch (error) {
        console.error('❌ Error populating doctors dropdown:', error);
    }
}