<!-- Test auto_assign_doctor.php -->
<!DOCTYPE html>
<html>
<head>
    <title>Debug Auto-Assign Doctor</title>
</head>
<body>
    <h1>Test Auto-Assign Doctor API</h1>
    
    <button onclick="testAutoAssign()">Test API</button>
    <pre id="result"></pre>
    
    <script>
    async function testAutoAssign() {
        const station_id = 63;
        const current_date = '2026-01-26';
        const current_time = new Date().toTimeString().split(' ')[0];
        
        console.log('Testing auto_assign_doctor.php');
        console.log('station_id:', station_id);
        console.log('current_date:', current_date);
        console.log('current_time:', current_time);
        
        try {
            const response = await fetch('/hospital/api/auto_assign_doctor.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    station_id: station_id,
                    current_date: current_date,
                    current_time: current_time
                })
            });
            
            const data = await response.json();
            
            const result = document.getElementById('result');
            result.textContent = JSON.stringify(data, null, 2);
            
            // ✅ Show summary
            console.log('Response:', data);
            if (data.success) {
                console.log('✅ unassigned_doctors_count:', data.data.unassigned_doctors_count);
                console.log('✅ available_rooms_count:', data.data.available_rooms_count);
                console.log('✅ auto_assigned_count:', data.data.auto_assigned_count);
                
                if (data.data.assignments && data.data.assignments.length > 0) {
                    console.log('✅ Assignments:');
                    data.data.assignments.forEach(a => {
                        console.log(`   - ${a.doctor_name} → ${a.room_name}`);
                    });
                }
            } else {
                console.error('❌ Error:', data.message);
            }
        } catch (error) {
            console.error('❌ API Error:', error);
            document.getElementById('result').textContent = '❌ ' + error.message;
        }
    }
    
    // Auto test on load
    window.addEventListener('load', () => {
        setTimeout(testAutoAssign, 1000);
    });
    </script>
</body>
</html>