<!DOCTYPE html>

<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏥 Hospital Patient Flow Simulator</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        }
        :root {
            /* 🔵 Blue Medical Color Scheme */
            --primary: #0066CC;
            --primary-light: #3399FF;
            --primary-dark: #004A99;
            --primary-lighter: #E6F0FF;
            --primary-50: #F5FAFF;
            
            /* Glassmorphism */
            --glass: rgba(255, 255, 255, 0.15);
            --glass-light: rgba(255, 255, 255, 0.25);
            --glass-border: rgba(255, 255, 255, 0.3);
            --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
            --glass-shadow-sm: 0 4px 16px 0 rgba(31, 38, 135, 0.08);
            
            /* Status Colors */
            --success: #10B981;
            --warning: #F59E0B;
            --danger: #EF4444;
            --info: #3B82F6;
            
            /* Text Colors */
            --text: #1F2937;
            --text-light: #6B7280;
            --text-lighter: #9CA3AF;
            --text-inverse: #FFFFFF;
            
            /* Neutral */
            --gray-50: #F9FAFB;
            --gray-100: #F3F4F6;
            --gray-200: #E5E7EB;
            --gray-300: #D1D5DB;
            --gray-400: #9CA3AF;
            --gray-500: #6B7280;
            --gray-600: #4B5563;
            --gray-700: #374151;
            --gray-800: #1F2937;
            --gray-900: #111827;
        }
        body {
            background: linear-gradient(135deg, #F5FAFF 0%, #E0EEFF 50%, #F0F5FF 100%);
            min-height: 100vh;
            padding: 16px;
            color: var(--text);
            line-height: 1.6;
        }
        .container { max-width: 1600px; margin: 0 auto; }
        .header {
            background: var(--glass);
            backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            border-radius: 16px 16px 0 0;
            padding: 24px 32px;
            box-shadow: var(--glass-shadow);
            display: flex;
            justify-content: space-between;
            align-items: center;
            animation: slideDown 0.4s cubic-bezier(0.23, 1, 0.320, 1);
        }
        @keyframes slideDown {
            from { 
                opacity: 0;
                transform: translateY(-20px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }
        .header h1 { 
            font-size: 1.875rem; 
            font-weight: 700;
            color: var(--text);
            letter-spacing: -0.5px;
        }
        .header-controls { 
            display: flex; 
            gap: 12px;
            align-items: center;
        }
        .btn {
            padding: 10px 18px;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--glass-light);
            color: var(--text);
            border: 1px solid var(--glass-border);
            position: relative;
            overflow: hidden;
        }
        .btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: width 0.5s, height 0.5s;
        }
        .btn:hover::before {
            width: 300px;
            height: 300px;
        }
        .btn:hover { 
            transform: translateY(-2px); 
            box-shadow: var(--glass-shadow);
        }
        .btn-primary {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
            color: var(--text-inverse);
            border: 1px solid rgba(0, 102, 204, 0.3);
        }
        .btn-primary:hover {
            box-shadow: 0 12px 24px rgba(0, 102, 204, 0.25);
        }
        .btn-success { 
            background: linear-gradient(135deg, var(--success) 0%, #34D399 100%);
            color: var(--text-inverse);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .btn-danger { 
            background: linear-gradient(135deg, var(--danger) 0%, #F87171 100%);
            color: var(--text-inverse);
            border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .btn-warning { 
            background: linear-gradient(135deg, var(--warning) 0%, #FBBF24 100%);
            color: var(--text-inverse);
            border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .nav-tabs {
            display: flex;
            background: var(--glass);
            backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            padding: 0 32px;
            box-shadow: var(--glass-shadow-sm);
            overflow-x: auto;
            gap: 8px;
            border-bottom: 2px solid var(--glass-border);
        }
        .nav-tab {
            padding: 16px 24px;
            border: none;
            cursor: pointer;
            font-weight: 600;
            font-size: 15px;
            background: transparent;
            color: var(--text-light);
            border-bottom: 3px solid transparent;
            opacity: 0.8;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
            position: relative;
            white-space: nowrap;
        }
        .nav-tab:hover {
            opacity: 1;
            color: var(--text);
        }
        .nav-tab.active { 
            background: linear-gradient(180deg, rgba(0, 102, 204, 0.08) 0%, transparent 100%);
            border-bottom: 3px solid var(--primary); 
            color: var(--primary);
            opacity: 1;
        }
        .main-content {
            background: var(--glass);
            backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            border-radius: 0 0 16px 16px;
            padding: 32px;
            box-shadow: var(--glass-shadow);
            animation: slideUp 0.4s cubic-bezier(0.23, 1, 0.320, 1);
        }
        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(20px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }
        .tab-content { 
            display: none;
            animation: fadeIn 0.3s ease-in;
        }
        .tab-content.active { 
            display: block;
        }
        @keyframes fadeIn { 
            from { 
                opacity: 0;
                transform: translateY(10px);
            } 
            to { 
                opacity: 1;
                transform: translateY(0);
            } 
        }
        .stations-container {
            background: var(--gray-50);
            border-radius: 16px;
            padding: 28px;
            border: 1px solid var(--gray-200);
            min-height: 500px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .stations-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 28px;
        }
        .floor-title { 
            font-size: 1.625rem; 
            font-weight: 700;
            color: var(--text);
            letter-spacing: -0.3px;
        }
        .stations-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
            gap: 16px;
        }
        .station-icon-card {
            background: var(--text-inverse);
            border: 1px solid var(--gray-200);
            border-radius: 12px;
            padding: 20px 16px;
            text-align: center;
            cursor: pointer;
            box-shadow: var(--glass-shadow-sm);
            transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
            animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes popIn {
            0% {
                opacity: 0;
                transform: scale(0.8);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }
        .station-icon-card:hover { 
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 16px 32px rgba(0, 102, 204, 0.15);
            border-color: var(--primary-light);
        }
        .station-icon { 
            font-size: 2.5rem; 
            margin-bottom: 12px;
            transition: transform 0.3s ease;
        }
        .station-icon-card:hover .station-icon {
            transform: scale(1.1) rotate(5deg);
        }
        .station-icon-name { 
            font-weight: 700;
            margin-bottom: 8px;
            color: var(--text);
            font-size: 0.95rem;
        }
        .station-icon-code {
            background: var(--primary-lighter);
            color: var(--primary);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 700;
            display: inline-block;
            margin-bottom: 8px;
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            z-index: 1000;
            backdrop-filter: blur(4px);
            animation: fadeInBackdrop 0.3s ease;
        }
        @keyframes fadeInBackdrop {
            from { background-color: rgba(0, 0, 0, 0); }
            to { background-color: rgba(0, 0, 0, 0.4); }
        }
        .modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.9);
            border-radius: 16px;
            padding: 36px;
            width: 90%;
            max-width: 1000px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 102, 204, 0.2);
            animation: modalPopIn 0.4s cubic-bezier(0.23, 1, 0.320, 1);
        }
        @keyframes modalPopIn {
            from {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }
        .modal-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 24px; 
            padding-bottom: 16px; 
            border-bottom: 2px solid var(--gray-200);
        }
        .modal-title { 
            font-size: 1.5rem; 
            font-weight: 700;
            color: var(--text);
        }
        .close-modal { 
            background: none; 
            border: none; 
            font-size: 1.75rem; 
            cursor: pointer;
            color: var(--text-light);
            transition: all 0.2s ease;
            padding: 8px;
            border-radius: 8px;
        }
        .close-modal:hover {
            background: var(--gray-100);
            color: var(--text);
            transform: scale(1.1);
        }
        .form-group { 
            margin-bottom: 20px;
        }
        .form-label { 
            display: block; 
            margin-bottom: 8px; 
            font-weight: 600;
            color: var(--text);
            font-size: 0.95rem;
            letter-spacing: 0.3px;
        }
        .form-control {
            width: 100%;
            padding: 12px 16px;
            border-radius: 10px;
            border: 1px solid var(--gray-300);
            background: var(--gray-50);
            color: var(--text);
            font-size: 14px;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .form-control:focus {
            outline: none;
            border-color: var(--primary);
            background: var(--text-inverse);
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(0, 102, 204, 0.1);
        }
        .form-control::placeholder {
            color: var(--gray-400);
        }
        select.form-control {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath fill='%230066CC' d='M0 0l6 8 6-8z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 12px center;
            background-size: 12px 8px;
            padding-right: 36px;
            cursor: pointer;
        }
        .wizard-step { 
            animation: fadeIn 0.3s;
        }
        .wizard-step h3 { 
            margin-bottom: 20px; 
            padding-bottom: 12px; 
            border-bottom: 2px solid var(--gray-200);
            color: var(--text);
            font-weight: 700;
        }
        .tab-btn {
            background: none;
            border: none;
            padding: 12px 20px;
            font-weight: 600;
            color: var(--text-light);
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
            position: relative;
        }
        .tab-btn:hover {
            color: var(--text);
        }
        .tab-btn.active {
            color: var(--primary);
            border-bottom: 3px solid var(--primary);
        }
        .row-item {
            background: var(--text-inverse);
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 16px;
            border: 1px solid var(--gray-200);
            box-shadow: var(--glass-shadow-sm);
            transition: all 0.3s ease;
        }
        .row-item:hover {
            box-shadow: 0 8px 16px rgba(0, 102, 204, 0.1);
            border-color: var(--primary-light);
        }
        .row-header { 
            display: grid; 
            grid-template-columns: 2fr 1.5fr auto; 
            gap: 16px; 
            margin-bottom: 12px; 
            align-items: end;
        }
        .row-details { 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr 1fr; 
            gap: 16px; 
            margin-top: 12px; 
            font-size: 13px;
            color: var(--text-light);
        }
        .room-card {
            background: var(--text-inverse);
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 20px;
            border-left: 4px solid var(--primary);
            box-shadow: var(--glass-shadow-sm);
            transition: all 0.3s ease;
        }
        .room-card:hover {
            box-shadow: 0 8px 16px rgba(0, 102, 204, 0.1);
        }
        .room-header { 
            font-weight: 700; 
            margin-bottom: 16px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            color: var(--text);
        }
        .equipment-list { 
            margin-bottom: 16px;
        }
        .equipment-item {
            display: grid;
            grid-template-columns: 2fr 1fr 150px auto;
            gap: 12px;
            margin-bottom: 12px;
            align-items: center;
            padding: 12px;
            background: var(--gray-50);
            border-radius: 10px;
            transition: all 0.3s ease;
        }
        .equipment-item:hover {
            background: var(--primary-lighter);
        }
        .procedure-list { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); 
            gap: 12px;
        }
        .procedure-checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            background: var(--gray-50);
            border-radius: 10px;
            cursor: pointer;
            border: 1px solid var(--gray-200);
            transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
            font-size: 13px;
            font-weight: 500;
        }
        .procedure-checkbox:hover {
            background: var(--primary-lighter);
            border-color: var(--primary);
        }
        .procedure-checkbox input { 
            cursor: pointer;
            accent-color: var(--primary);
        }
        .progress-bar-container {
            background: var(--gray-200);
            height: 8px;
            margin-bottom: 20px;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .progress-bar {
            background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
            height: 100%;
            width: 25%;
            transition: width 0.4s cubic-bezier(0.23, 1, 0.320, 1);
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 102, 204, 0.3);
        }
        @media (max-width: 1200px) {
            .row-header { grid-template-columns: 1fr; }
            .row-details { grid-template-columns: 1fr 1fr; }
        }
        .station-tab-btn {
            background: none;
            border: none;
            padding: 12px 20px;
            font-weight: 600;
            color: var(--text-light);
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
            font-size: 14px;
            position: relative;
        }
        .station-tab-btn:hover {
            color: var(--text);
        }
        .station-tab-btn.active {
            color: var(--primary);
            border-bottom: 3px solid var(--primary);
        }
        .station-tab-content {
            animation: fadeIn 0.3s;
        }

        /* Toggle Switch */
        .switch {
            position: relative;
            display: inline-block;
            width: 52px;
            height: 28px;
        }
        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--gray-300);
            transition: 0.4s cubic-bezier(0.23, 1, 0.320, 1);
            border-radius: 28px;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: 0.4s cubic-bezier(0.23, 1, 0.320, 1);
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        input:checked + .slider {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
        }
        input:checked + .slider:before {
            transform: translateX(24px);
        }
        input:disabled + .slider {
            background-color: var(--gray-200);
            cursor: not-allowed;
        }
.stat-card {
    background: var(--text-inverse);
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    border-left: 5px solid var(--primary);
    box-shadow: var(--glass-shadow-sm);
    transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
    animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 102, 204, 0.15);
}
.stat-card .stat-value {
    font-size: 2.25rem;
    font-weight: 800;
    color: var(--primary);
    letter-spacing: -1px;
}
.stat-card .stat-label {
    font-size: 0.9rem;
    color: var(--text-light);
    font-weight: 500;
    margin-top: 6px;
}

.staff-card {
    background: var(--text-inverse);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--gray-200);
    box-shadow: var(--glass-shadow-sm);
    transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
    animation: slideUp 0.4s cubic-bezier(0.23, 1, 0.320, 1);
}
.staff-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 102, 204, 0.15);
    border-color: var(--primary-light);
}
.staff-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}
.staff-name {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--text);
}
.staff-role {
    font-size: 0.85rem;
    color: var(--text-light);
    font-weight: 500;
    margin-top: 2px;
}
.staff-status-badge {
    color: white;
    padding: 6px 14px;
    border-radius: 16px;
    font-size: 0.8rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, var(--success) 0%, #34D399 100%);
}
.staff-room-info {
    font-size: 0.95rem;
    color: var(--text);
    margin-bottom: 16px;
    padding: 12px;
    background: var(--primary-lighter);
    border-left: 3px solid var(--primary);
    border-radius: 8px;
    font-weight: 500;
}
.staff-schedule {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    font-size: 0.9rem;
    padding: 12px;
    background: var(--gray-50);
    border-radius: 10px;
    margin-bottom: 16px;
}
.staff-schedule-edit {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    font-size: 0.9rem;
    padding: 12px;
    background: rgba(255, 152, 0, 0.08);
    border-radius: 10px;
    margin-bottom: 16px;
    border: 1px solid rgba(255, 152, 0, 0.2);
}
.staff-schedule-edit label {
    font-weight: 700;
    color: var(--text);
    display: block;
    margin-bottom: 6px;
}
.staff-schedule-edit input[type="time"] {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--gray-300);
    width: 100%;
    background: var(--text-inverse);
    color: var(--text);
    font-weight: 500;
    transition: all 0.3s ease;
}
.staff-schedule-edit input[type="time"]:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}
.staff-card-actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
}
.staff-card-actions .btn {
    flex: 1;
    padding: 10px;
    font-size: 0.9rem;
    border-radius: 8px;
}
/* เพิ่ม CSS นี้ลงในส่วน <style> ของ main.php */

/* Staff Schedule Display */
.staff-schedule {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    font-size: 0.9em;
    padding: 10px;
    background: rgba(0,0,0,0.03);
    border-radius: 8px;
    margin: 15px 0;
}

.staff-schedule div {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

/* Staff Schedule Edit (Input Mode) */
.staff-schedule-edit {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    font-size: 0.9em;
    padding: 15px;
    background: rgba(214, 137, 16, 0.1);
    border: 2px solid rgba(255, 193, 7, 0.3);
    border-radius: 10px;
    margin: 15px 0;
}

.staff-schedule-edit label {
    font-weight: 600;
    color: var(--text-light);
    display: block;
    margin-bottom: 5px;
    font-size: 12px;
}

.staff-schedule-edit input[type="time"] {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #ced4da;
    font-size: 14px;
    font-weight: 600;
    background: white;
    color: var(--text);
    cursor: pointer;
}

.staff-schedule-edit input[type="time"]:focus {
    outline: none;
    border-color: #D35400;
    box-shadow: 0 0 0 3px rgba(214, 137, 16, 0.1);
}

/* Action Buttons */
.staff-card-actions {
    display: flex;
    gap: 8px;
    margin-top: 15px;
    flex-wrap: wrap;
}

.staff-card-actions .btn {
    flex: 1;
    min-width: 120px;
    padding: 10px 12px;
    font-size: 0.85em;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.staff-card-actions .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.staff-card-actions .btn-success {
    background: linear-gradient(135deg, #1E8449, #1E8449);
    color: white;
}

.staff-card-actions .btn-success:hover {
    background: linear-gradient(135deg, #1E8449, #1E8449);
}

.staff-card-actions .btn-danger {
    background: linear-gradient(135deg, #A93226, #A93226);
    color: white;
}

.staff-card-actions .btn-danger:hover {
    background: linear-gradient(135deg, #A93226, #A93226);
}

.staff-card-actions .btn-warning {
    background: linear-gradient(135deg, #D35400, #D35400);
    color: white;
}

.staff-card-actions .btn-warning:hover {
    background: linear-gradient(135deg, #D35400, #D35400);
}

.staff-card-actions .btn-secondary {
    background: linear-gradient(135deg, #6c757d, #495057);
    color: white;
}

.staff-card-actions .btn-secondary:hover {
    background: linear-gradient(135deg, #495057, #212529);
}

/* Responsive Design */
@media (max-width: 1024px) {
    .staff-schedule-edit {
        grid-template-columns: 1fr;
    }
    
    .staff-card-actions {
        flex-direction: column;
    }
    
    .staff-card-actions .btn {
        width: 100%;
        min-width: auto;
    }
}

/* Animation for mode switching */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}


/* Time Input Styling */
input[type="time"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    border-radius: 4px;
    margin-right: 2px;
    opacity: 0.6;
    filter: invert(0.8);
}

input[type="time"]::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
}

/* Style สำหรับปุ่ม Select All และ Clear All */
.btn-success, .btn-warning {
    transition: all 0.3s ease;
}

.btn-success:hover {
    background: linear-gradient(135deg, #1E8449, #1E8449) !important;
    transform: translateY(-2px);
}

.btn-warning:hover {
    background: linear-gradient(135deg, #D35400, #D35400) !important;
    transform: translateY(-2px);
}

/* Style สำหรับ procedure checkbox */
.procedure-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255,255,255,0.6);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
}

.procedure-checkbox:hover {
    background: rgba(0, 71, 171, 0.1);
    border-color: rgba(100,150,255,0.3);
}

.procedure-checkbox input {
    cursor: pointer;
    width: 16px;
    height: 16px;
}


/**
 * ✅ STEP 5: CSS Animation
 * เพิ่มโค้ดนี้ใน CSS ของคุณ หรือ <style> tag
 */

/* ============================================ */
/* 1. Slide In Animation */
/* ============================================ */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ============================================ */
/* 2. Doctor Info Card Styling */
/* ============================================ */
#doctorInfoCard {
    animation: slideIn 0.3s ease-out;
}

/* ============================================ */
/* 3. Doctor List Item Hover */
/* ============================================ */
.doctor-list-item {
    transition: all 0.3s ease;
}

.doctor-list-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 86, 179, 0.15);
}

/* ============================================ */
/* 4. Button Hover Effects */
/* ============================================ */
.btn-doctor-action {
    transition: all 0.3s ease;
}

.btn-doctor-action:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* ============================================ */
/* 5. Modal Styling */
/* ============================================ */
.doctor-modal {
    animation: slideIn 0.3s ease-out;
}

.doctor-modal-header {
    background: linear-gradient(135deg, #0056B3 0%, #004085 100%);
    color: white;
    padding: 20px;
    border-radius: 12px 12px 0 0;
}

/* ============================================ */
/* 6. Status Badge Styling */
/* ============================================ */
.doctor-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 15px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    transition: all 0.3s ease;
}

.status-available {
    background: #1E8449;
    color: white;
}

.status-working {
    background: #0056B3;
    color: white;
}

.status-on-break {
    background: #D68910;
    color: white;
}

.status-offline {
    background: #6c757d;
    color: white;
}

/* ============================================ */
/* 7. Form Input Styling */
/* ============================================ */
.doctor-form-input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #ced4da;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.3s ease;
}

.doctor-form-input:focus {
    outline: none;
    border-color: #0056B3;
    box-shadow: 0 0 0 3px rgba(0, 86, 179, 0.1);
    background: white;
}

.doctor-form-input:hover {
    border-color: #80bdff;
}

/* ============================================ */
/* 8. Room Doctor Card */
/* ============================================ */
.room-doctor-card {
    background: rgba(255, 255, 255, 0.5);
    padding: 12px;
    border-radius: 8px;
    border-left: 4px solid #0056B3;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
}

.room-doctor-card:hover {
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 4px 12px rgba(0, 86, 179, 0.12);
    border-color: #0047AB;
}

/* ============================================ */
/* 9. Info Card Styling */
/* ============================================ */
.doctor-info-card {
    background: #f8f9fa;
    padding: 14px;
    border-radius: 8px;
    border-left: 4px solid #0056B3;
    margin-top: 15px;
}

.doctor-info-card.hidden {
    display: none;
}

/* ============================================ */
/* 10. Loading Spinner */
/* ============================================ */
@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.loading-spinner {
    animation: spin 1s linear infinite;
}

/* ============================================ */
/* 11. Fade In */
/* ============================================ */
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.fade-in {
    animation: fadeIn 0.3s ease-in;
}

/* ============================================ */
/* 12. Responsive Styling */
/* ============================================ */
@media (max-width: 768px) {
    .doctor-modal-header {
        padding: 16px;
    }
    
    .doctor-list-item {
        padding: 10px;
    }
    
    .doctor-status-badge {
        padding: 4px 8px;
        font-size: 10px;
    }
}

/* ============================================ */
/* 13. Form Group */
/* ============================================ */
.doctor-form-group {
    margin-bottom: 15px;
}

.doctor-form-group:last-child {
    margin-bottom: 0;
}

.doctor-form-label {
    font-weight: 700;
    display: block;
    margin-bottom: 8px;
    color: #212529;
    font-size: 14px;
}

/* ============================================ */
/* 14. Disabled State */
/* ============================================ */
.doctor-form-input:disabled {
    background: #e9ecef;
    color: #6c757d;
    cursor: not-allowed;
    border-color: #dee2e6;
}

/* ============================================ */
/* 15. Success/Error States */
/* ============================================ */
.input-success {
    border-color: #1E8449 !important;
    box-shadow: 0 0 0 3px rgba(30, 132, 73, 0.1) !important;
}

.input-error {
    border-color: #C0392B !important;
    box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.1) !important;
}
        /* ============================================ */
        /* 🎨 MODERN UI ENHANCEMENT - INLINE CSS */
        /* ============================================ */

        /* CSS Variables - Modern Color Scheme */
        :root {
            --primary-blue: #0066cc;
            --primary-dark: #0052a3;
            --primary-light: #e8f0ff;
            --success: #1E8449;
            --warning: #D35400;
            --danger: #dc3545;
            --info: #0056B3;
            --text-dark: #1a1a1a;
            --text-light: #495057;
            --text-muted: #adb5bd;
            --border-light: #e0e6ed;
            --bg-light: #f5f7fa;
            --bg-white: #ffffff;
            --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
            --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.10);
            --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
            --radius-sm: 6px;
            --radius-md: 8px;
            --radius-lg: 12px;
            --radius-xl: 16px;
        }

        /* 1. HEADER - MODERN LOOK */
        .header {
            background: linear-gradient(135deg, var(--bg-white) 0%, #f8f9fa 100%) !important;
            border-bottom: 2px solid var(--border-light) !important;
            box-shadow: var(--shadow-sm) !important;
            border-radius: 0 !important;
        }

        .header h1 {
            background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-dark) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 800;
            letter-spacing: -0.5px;
        }

        /* 2. NAVIGATION TABS */
        .nav-tabs {
            background: transparent !important;
            border: none !important;
            border-bottom: 2px solid var(--border-light) !important;
            gap: 2px;
        }

        .nav-tab {
            color: var(--text-light) !important;
            border: none !important;
            border-radius: var(--radius-lg) var(--radius-lg) 0 0 !important;
            padding: 12px 20px !important;
            font-weight: 600 !important;
            font-size: 14px !important;
            transition: all 0.3s ease !important;
            position: relative;
            margin-right: 4px;
        }

        .nav-tab:hover {
            color: var(--primary-blue) !important;
            background: rgba(0, 102, 204, 0.05) !important;
        }

        .nav-tab.active {
            color: var(--primary-blue) !important;
            background: var(--primary-light) !important;
            border-bottom: 3px solid var(--primary-blue) !important;
        }

        /* 3. MAIN CONTENT */
        .main-content {
            background: var(--bg-light) !important;
            border: none !important;
            border-radius: 0 0 var(--radius-xl) var(--radius-xl) !important;
            box-shadow: var(--shadow-sm) !important;
            padding: 24px !important;
        }

        .stations-container {
            background: var(--bg-white) !important;
            border: 2px solid var(--border-light) !important;
            border-radius: var(--radius-xl) !important;
            padding: 24px !important;
            transition: all 0.3s ease !important;
        }

        .stations-container:hover {
            border-color: var(--primary-blue) !important;
            box-shadow: var(--shadow-md) !important;
        }

        /* 4. STATION CARDS */
        .station-icon-card {
            background: linear-gradient(135deg, var(--bg-white) 0%, #f8f9fa 100%) !important;
            border: 2px solid var(--border-light) !important;
            border-radius: var(--radius-lg) !important;
            padding: 20px !important;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            position: relative;
            overflow: hidden;
        }

        .station-icon-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--primary-blue), var(--primary-dark));
            transform: scaleX(0);
            transform-origin: left;
            transition: transform 0.3s ease;
        }

        .station-icon-card:hover {
            transform: translateY(-6px) !important;
            border-color: var(--primary-blue) !important;
            box-shadow: var(--shadow-lg) !important;
            background: linear-gradient(135deg, var(--primary-light) 0%, var(--bg-white) 100%) !important;
        }

        .station-icon-card:hover::before {
            transform: scaleX(1);
        }

        .station-icon {
            font-size: 2.5em !important;
            color: var(--primary-blue) !important;
            margin-bottom: 12px !important;
            transition: transform 0.3s ease !important;
        }

        .station-icon-card:hover .station-icon {
            transform: scale(1.15) rotate(5deg);
        }

        /* 5. BUTTONS */
        .btn {
            padding: 10px 18px !important;
            border: 1.5px solid transparent !important;
            border-radius: var(--radius-md) !important;
            font-weight: 600 !important;
            font-size: 13px !important;
            cursor: pointer;
            transition: all 0.2s ease !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            text-transform: none !important;
        }

        .btn:hover {
            transform: translateY(-2px) !important;
            box-shadow: var(--shadow-md) !important;
        }

        .btn:active {
            transform: translateY(0) !important;
        }

        .btn-success {
            background: linear-gradient(135deg, var(--success) 0%, #157347 100%) !important;
            color: white !important;
            border-color: transparent !important;
        }

        .btn-success:hover {
            background: linear-gradient(135deg, #157347 0%, #0b5345 100%) !important;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-dark) 100%) !important;
            color: white !important;
            border-color: transparent !important;
        }

        .btn-primary:hover {
            background: linear-gradient(135deg, var(--primary-dark) 0%, #003d82 100%) !important;
        }

        .btn-danger {
            background: linear-gradient(135deg, var(--danger) 0%, #bb2d3b 100%) !important;
            color: white !important;
            border-color: transparent !important;
        }

        .btn-danger:hover {
            background: linear-gradient(135deg, #bb2d3b 0%, #a02834 100%) !important;
        }

        .btn-warning {
            background: linear-gradient(135deg, var(--warning) 0%, #c16c1f 100%) !important;
            color: white !important;
            border-color: transparent !important;
        }

        .btn-warning:hover {
            background: linear-gradient(135deg, #c16c1f 0%, #a15a1a 100%) !important;
        }

        /* 6. FORM ELEMENTS */
        .form-control {
            border: 2px solid var(--border-light) !important;
            border-radius: var(--radius-md) !important;
            padding: 10px 12px !important;
            font-size: 13px !important;
            transition: all 0.3s ease !important;
            background: var(--bg-white) !important;
            color: var(--text-dark) !important;
        }

        .form-control:focus {
            outline: none !important;
            border-color: var(--primary-blue) !important;
            background: white !important;
            box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1) !important;
        }

        .form-control:hover {
            border-color: #b8c5d6 !important;
        }

        .form-label {
            color: var(--text-dark) !important;
            font-weight: 600 !important;
            font-size: 13px !important;
            margin-bottom: 8px !important;
        }

        /* 7. MODALS */
        .modal {
            background: rgba(0, 0, 0, 0.5) !important;
            backdrop-filter: blur(8px) !important;
        }


        @keyframes fadeInScale {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        .modal-header {
            border-bottom: 2px solid var(--border-light) !important;
            padding: 20px 24px !important;
        }

        .modal-title {
            color: var(--text-dark) !important;
            font-weight: 700 !important;
            font-size: 18px !important;
        }

        .close-modal {
            background: none !important;
            border: none !important;
            font-size: 24px !important;
            color: var(--text-muted) !important;
            cursor: pointer;
            transition: all 0.2s ease !important;
            width: 32px !important;
            height: 32px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: var(--radius-md) !important;
        }

        .close-modal:hover {
            background: var(--bg-light) !important;
            color: var(--text-dark) !important;
            transform: rotate(90deg) !important;
        }

        /* 8. TABS */
        .tab-btn {
            background: none !important;
            border: none !important;
            padding: 10px 16px !important;
            font-weight: 600 !important;
            font-size: 13px !important;
            color: var(--text-light) !important;
            cursor: pointer;
            border-bottom: 3px solid transparent !important;
            transition: all 0.3s ease !important;
            position: relative;
         
        }

        .tab-btn:hover {
            color: var(--primary-blue) !important;
        }

        .tab-btn.active {
            color: var(--primary-blue) !important;
            border-bottom-color: var(--primary-blue) !important;
        }

        /* 9. CARDS */
        .room-card {
            background: linear-gradient(135deg, var(--bg-white) 0%, #f8f9fa 100%) !important;
            border: 2px solid var(--border-light) !important;
            border-left: 5px solid var(--primary-blue) !important;
            border-radius: var(--radius-lg) !important;
            padding: 16px !important;
            transition: all 0.3s ease !important;
            cursor: pointer;
        }

        .room-card:hover {
            transform: translateY(-4px) !important;
            border-left-color: var(--primary-dark) !important;
            border-color: var(--primary-blue) !important;
            box-shadow: var(--shadow-lg) !important;
        }

        .row-item {
            background: linear-gradient(135deg, var(--bg-white) 0%, #fafbfc 100%) !important;
            border: 1px solid var(--border-light) !important;
            border-left: 4px solid var(--primary-blue) !important;
            border-radius: var(--radius-md) !important;
            padding: 14px !important;
            transition: all 0.2s ease !important;
            margin-bottom: 12px !important;
        }

        .row-item:hover {
            border-left-color: var(--primary-dark) !important;
            box-shadow: var(--shadow-md) !important;
        }

        /* 10. PROGRESS BARS */
        .progress-bar-container {
            background: var(--border-light) !important;
            height: 6px !important;
            border-radius: 3px !important;
            overflow: hidden !important;
            margin-bottom: 20px !important;
        }

        .progress-bar {
            background: linear-gradient(90deg, var(--primary-blue), var(--primary-dark)) !important;
            height: 100% !important;
            width: 0% !important;
            transition: width 0.3s ease !important;
            border-radius: 3px !important;
        }

        /* 11. ANIMATIONS */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .fade-in {
            animation: fadeIn 0.3s ease-in !important;
        }

        .slide-in {
            animation: slideIn 0.3s ease-out !important;
        }

        /* 12. RESPONSIVE */
        @media (max-width: 1200px) {
            .stations-grid {
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;
            }
            .row-details {
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }

        @media (max-width: 768px) {
            .header {
                padding: 16px 20px !important;
            }
            .header h1 {
                font-size: 1.5rem !important;
            }
            .nav-tabs {
                overflow-x: auto !important;
                padding-bottom: 8px !important;
            }
            .nav-tab {
                padding: 10px 14px !important;
                font-size: 12px !important;
            }
            .main-content {
                padding: 16px !important;
            }
            .stations-container {
                padding: 16px !important;
            }
            .station-icon-card {
                padding: 16px !important;
            }
            .station-icon {
                font-size: 2em !important;
            }
            .form-control {
                padding: 8px 10px !important;
                font-size: 12px !important;
            }
            .btn {
                padding: 8px 14px !important;
                font-size: 12px !important;
            }
            .modal-content {
                width: 95% !important;
                max-height: 95vh !important;
                border-radius: var(--radius-lg) !important;
            }
        }

        @media (max-width: 480px) {
            .header h1 {
                font-size: 1.2rem !important;
            }
            .nav-tabs {
                gap: 0 !important;
            }
            .nav-tab {
                padding: 8px 12px !important;
                font-size: 11px !important;
            }
            .stations-grid {
                grid-template-columns: 1fr !important;
            }
            .row-details {
                grid-template-columns: 1fr !important;
            }
            .tab-btn {
                padding: 8px 12px !important;
                font-size: 12px !important;
            }
        }
        
        /* ============================================
           📊 DASHBOARD STYLES - COMPLETE
           ============================================ */

        .dashboard-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
        }

        .dashboard-stat-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%);
            padding: 16px;
            border-radius: 12px;
            border-left: 5px solid;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            text-align: center;
        }

        .dashboard-stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.12);
        }

        .dashboard-stat-card.green { border-left-color: #28a745; }
        .dashboard-stat-card.blue { border-left-color: #0056b3; }
        .dashboard-stat-card.orange { border-left-color: #fd7e14; }
        .dashboard-stat-card.purple { border-left-color: #6610f2; }

        .dashboard-stat-number {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 5px;
            color: #0056b3;
        }

        .dashboard-stat-label {
            font-size: 12px;
            color: #6c757d;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .dashboard-controls {
            background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,249,250,0.9) 100%);
        }

        .control-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .control-label {
            font-weight: 600;
            color: #333;
            font-size: 13px;
        }

        .dashboard-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .dashboard-station-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%);
            border-radius: 14px;
            border: 2px solid #e9ecef;
            border-left: 5px solid #0056b3;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
            cursor: pointer;
            display: flex;
            flex-direction: column;
        }

        .dashboard-station-card:hover {
            transform: translateY(-6px);
            border-color: rgba(0,86,179,0.5);
            box-shadow: 0 12px 30px rgba(0,86,179,0.15);
        }

        .dashboard-card-header {
            background: linear-gradient(135deg, #0056b3 0%, #003d82 100%);
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
        }

        .dashboard-card-title {
            font-size: 16px;
            font-weight: 700;
        }

        .dashboard-card-code {
            font-size: 11px;
            opacity: 0.8;
        }

        .dashboard-card-status {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
            white-space: nowrap;
        }

        .dashboard-status-badge {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .dashboard-status-normal { background: rgba(40,167,69,0.3); color: #1E8449; }
        .dashboard-status-warning { background: rgba(211,84,0,0.3); color: #B8621B; }
        .dashboard-status-critical { background: rgba(220,53,69,0.3); color: #C0392B; }

        .dashboard-card-body {
            padding: 16px;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .dashboard-card-section {
            padding-bottom: 12px;
            border-bottom: 1px solid #f0f0f0;
        }

        .dashboard-card-section:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .dashboard-section-title {
            font-size: 11px;
            color: #0056b3;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .dashboard-info-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            font-size: 13px;
        }

        .dashboard-info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .dashboard-info-label {
            font-size: 10px;
            color: #6c757d;
            font-weight: 600;
            text-transform: uppercase;
        }

        .dashboard-info-value {
            font-size: 16px;
            font-weight: 700;
            color: #0056b3;
        }

        .dashboard-info-value.warning { color: #fd7e14; }
        .dashboard-info-value.danger { color: #dc3545; }

        .dashboard-badges {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }

        .dashboard-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            background: rgba(0,86,179,0.08);
            color: #0056b3;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
        }

        @media (max-width: 1024px) {
            .dashboard-cards-grid {
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            }
        }

        @media (max-width: 768px) {
            .dashboard-cards-grid {
                grid-template-columns: 1fr;
            }
            .dashboard-info-row {
                grid-template-columns: 1fr;
            }
            .dashboard-controls {
                flex-direction: column;
            }
        }

        /* ✅ FIX SweetAlert Modal Input Only */
        .swal2-input,
        .swal2-select,
        input[type="text"],
        input[type="number"] {
            width: 100% !important;
            box-sizing: border-box !important;
            max-width: 100% !important;
        }

        /* 📱 RESPONSIVE DESIGN - Tablet (768px - 1200px) */
        @media (max-width: 1200px) {
            body {
                padding: 12px;
            }
            .header {
                padding: 16px 20px;
                flex-direction: column;
                gap: 12px;
                text-align: center;
            }
            .header h1 {
                font-size: 1.5rem;
            }
            .header-controls {
                width: 100%;
                justify-content: center;
                flex-wrap: wrap;
            }
            .main-content {
                padding: 20px;
            }
            .stations-grid {
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            }
            .row-header {
                grid-template-columns: 1fr;
            }
            .row-details {
                grid-template-columns: 1fr 1fr;
            }
            .equipment-item {
                grid-template-columns: 1.5fr 1fr auto;
            }
            .staff-card {
                padding: 16px;
            }
        }

        /* 📱 RESPONSIVE DESIGN - Mobile (< 768px) */
        @media (max-width: 768px) {
            body {
                padding: 8px;
            }
            .container {
                max-width: 100%;
            }
            .header {
                border-radius: 12px 12px 0 0;
                padding: 12px 16px;
            }
            .header h1 {
                font-size: 1.25rem;
            }
            .header-controls {
                flex-direction: column;
                width: 100%;
                gap: 8px;
            }
            .header-controls .btn {
                width: 100%;
                justify-content: center;
            }
            .nav-tabs {
                padding: 0 16px;
                overflow-x: auto;
                gap: 4px;
            }
            .nav-tab {
                padding: 12px 16px;
                font-size: 13px;
                white-space: nowrap;
            }
            .main-content {
                border-radius: 0 0 12px 12px;
                padding: 16px;
            }
            .stations-container {
                padding: 16px;
            }
            .stations-header {
                flex-direction: column;
                gap: 12px;
                align-items: flex-start;
            }
            .floor-title {
                font-size: 1.25rem;
            }
            .stations-grid {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 12px;
            }
            .station-icon-card {
                padding: 16px 12px;
            }
            .station-icon {
                font-size: 2rem;
            }
            .modal-content {
                width: 95%;
                padding: 20px;
                max-height: 85vh;
            }
            .modal-header {
                flex-direction: column;
                gap: 12px;
                align-items: flex-start;
            }
            .modal-title {
                font-size: 1.25rem;
            }
            .row-item {
                padding: 12px;
                margin-bottom: 12px;
            }
            .row-header {
                grid-template-columns: 1fr;
                gap: 12px;
            }
            .row-details {
                grid-template-columns: 1fr;
                gap: 12px;
            }
            .equipment-item {
                grid-template-columns: 1fr;
                gap: 8px;
            }
            .procedure-list {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            }
            .stat-card {
                padding: 16px;
            }
            .stat-card .stat-value {
                font-size: 1.75rem;
            }
            .staff-card {
                padding: 14px;
            }
            .staff-card-header {
                flex-direction: column;
                gap: 8px;
                align-items: flex-start;
            }
            .staff-schedule {
                grid-template-columns: 1fr;
                gap: 8px;
            }
            .staff-schedule-edit {
                grid-template-columns: 1fr;
                gap: 8px;
            }
            .staff-card-actions {
                gap: 8px;
            }
            .staff-card-actions .btn {
                padding: 8px;
                font-size: 0.85rem;
            }
        }

        /* 📱 RESPONSIVE DESIGN - Small Mobile (< 480px) */
        @media (max-width: 480px) {
            .header h1 {
                font-size: 1.1rem;
            }
            .nav-tab {
                padding: 10px 12px;
                font-size: 12px;
            }
            .modal-content {
                padding: 16px;
            }
            .form-group {
                margin-bottom: 16px;
            }
            .btn {
                padding: 8px 14px;
                font-size: 12px;
            }
            .stations-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            .procedure-checkbox {
                padding: 8px 10px;
                font-size: 12px;
            }
        }

        /* 🎨 ADDITIONAL EFFECTS & UTILITIES */
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .mt-1 { margin-top: 8px; }
        .mt-2 { margin-top: 16px; }
        .mt-3 { margin-top: 24px; }
        .mb-1 { margin-bottom: 8px; }
        .mb-2 { margin-bottom: 16px; }
        .mb-3 { margin-bottom: 24px; }
        .p-1 { padding: 8px; }
        .p-2 { padding: 16px; }
        .p-3 { padding: 24px; }
        
        /* Loading Spinner */
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid var(--gray-300);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        /* Pulse Animation */
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Bounce Animation */
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .bounce {
            animation: bounce 0.6s cubic-bezier(0.36, 0, 0.66, -0.56) infinite;
        }

        /* Shimmer Loading Effect */
        @keyframes shimmer {
            0% { background-position: -1200px 0; }
            100% { background-position: 1200px 0; }
        }
        .shimmer {
            animation: shimmer 2s infinite;
            background: linear-gradient(90deg, var(--gray-200) 0%, var(--gray-100) 20%, var(--gray-200) 40%, var(--gray-200) 100%);
            background-size: 1200px 100%;
        }

        /* Color Status Badges */
        .badge-success { background: linear-gradient(135deg, var(--success) 0%, #34D399 100%); }
        .badge-danger { background: linear-gradient(135deg, var(--danger) 0%, #F87171 100%); }
        .badge-warning { background: linear-gradient(135deg, var(--warning) 0%, #FBBF24 100%); }
        .badge-info { background: linear-gradient(135deg, var(--info) 0%, #60A5FA 100%); }
        .badge-primary { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%); }
        
        /* Scrollbar Styling */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: var(--gray-100);
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: var(--primary-dark);
        }

        /* Dashboard Controls */
        .dashboard-controls {
            margin: 20px 0;
            padding: 20px;
            background: var(--text-inverse);
            border: 1px solid var(--gray-200);
            border-radius: 12px;
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            align-items: flex-end;
            box-shadow: var(--glass-shadow-sm);
        }

        .control-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .control-group .form-control {
            min-width: 200px;
        }

        /* Dashboard Stats Grid */
        .dashboard-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        /* Dashboard Cards Grid */
        .dashboard-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 16px;
        }

        /* ========== DATA VISUALIZATION STYLES ========== */
        
        /* Charts Container */
        .chart-container {
            background: var(--text-inverse);
            border: 1px solid var(--gray-200);
            border-radius: 12px;
            padding: 20px;
            box-shadow: var(--glass-shadow-sm);
            margin-bottom: 24px;
        }

        .chart-title {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 16px;
            color: var(--text);
        }

        /* Bar Chart */
        .bar-chart {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .bar-row {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .bar-label {
            min-width: 120px;
            font-weight: 600;
            color: var(--text);
            font-size: 0.9rem;
        }

        .bar-container {
            flex: 1;
            height: 32px;
            background: var(--gray-100);
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            border: 1px solid var(--gray-200);
        }

        .bar-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
            border-radius: 8px;
            transition: width 0.4s cubic-bezier(0.23, 1, 0.320, 1);
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 12px;
            color: var(--text-inverse);
            font-weight: 700;
            font-size: 0.85rem;
        }

        .bar-fill.success { background: linear-gradient(90deg, var(--success) 0%, #34D399 100%); }
        .bar-fill.warning { background: linear-gradient(90deg, var(--warning) 0%, #FBBF24 100%); }
        .bar-fill.danger { background: linear-gradient(90deg, var(--danger) 0%, #F87171 100%); }
        .bar-fill.info { background: linear-gradient(90deg, var(--info) 0%, #60A5FA 100%); }

        .bar-value {
            font-weight: 700;
            color: var(--text);
            min-width: 50px;
            text-align: right;
            font-size: 0.9rem;
        }

        /* Progress Indicator */
        .progress-indicator {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: var(--gray-50);
            border-radius: 10px;
            margin-bottom: 12px;
        }

        .progress-label {
            font-weight: 600;
            color: var(--text);
            flex: 1;
            font-size: 0.9rem;
        }

        .progress-percent {
            font-weight: 700;
            color: var(--primary);
            min-width: 45px;
            text-align: right;
            font-size: 0.9rem;
        }

        .progress-mini {
            height: 24px;
            background: var(--gray-200);
            border-radius: 12px;
            overflow: hidden;
        }

        .progress-mini-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
            transition: width 0.4s cubic-bezier(0.23, 1, 0.320, 1);
        }

        /* Donut/Pie Chart */
        .donut-chart {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 24px;
        }

        .donut-svg-container {
            position: relative;
            width: 200px;
            height: 200px;
        }

        .donut-legend {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            width: 100%;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: var(--gray-50);
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
        }

        .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 4px;
        }

        /* Table Stats */
        .stats-table {
            width: 100%;
            border-collapse: collapse;
        }

        .stats-table thead tr {
            background: var(--primary-lighter);
            border-bottom: 2px solid var(--primary);
        }

        .stats-table th {
            padding: 12px 16px;
            text-align: left;
            font-weight: 700;
            color: var(--primary);
            font-size: 0.9rem;
        }

        .stats-table tbody tr {
            border-bottom: 1px solid var(--gray-200);
            transition: background 0.2s ease;
        }

        .stats-table tbody tr:hover {
            background: var(--gray-50);
        }

        .stats-table td {
            padding: 12px 16px;
            color: var(--text);
            font-size: 0.9rem;
        }

        .stats-table td:last-child {
            text-align: right;
            font-weight: 700;
        }

        /* Metric Cards */
        .metric-card {
            background: var(--text-inverse);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid var(--gray-200);
            transition: all 0.3s ease;
        }

        .metric-card:hover {
            box-shadow: 0 8px 16px rgba(0, 102, 204, 0.1);
            transform: translateY(-2px);
        }

        .metric-card-value {
            font-size: 1.875rem;
            font-weight: 800;
            color: var(--primary);
            margin-bottom: 4px;
        }

        .metric-card-label {
            font-size: 0.85rem;
            color: var(--text-light);
            font-weight: 500;
        }

        .metric-card-change {
            font-size: 0.8rem;
            margin-top: 8px;
            padding: 4px 8px;
            background: var(--gray-100);
            border-radius: 4px;
            display: inline-block;
            font-weight: 600;
        }

        .metric-card-change.positive {
            color: var(--success);
            background: rgba(16, 185, 129, 0.1);
        }

        .metric-card-change.negative {
            color: var(--danger);
            background: rgba(239, 68, 68, 0.1);
        }

        /* Heatmap */
        .heatmap-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
            gap: 4px;
            margin-bottom: 12px;
        }

        .heatmap-cell {
            aspect-ratio: 1;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.75rem;
            color: white;
        }

        .heatmap-cell:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .heatmap-cell.level-1 { background: rgba(0, 102, 204, 0.2); color: var(--primary); }
        .heatmap-cell.level-2 { background: linear-gradient(135deg, rgba(0, 102, 204, 0.4), rgba(0, 102, 204, 0.5)); color: var(--text-inverse); }
        .heatmap-cell.level-3 { background: linear-gradient(135deg, rgba(0, 102, 204, 0.6), rgba(0, 102, 204, 0.7)); color: var(--text-inverse); }
        .heatmap-cell.level-4 { background: var(--primary); color: var(--text-inverse); }

        /* Timeline */
        .timeline {
            position: relative;
            padding-left: 30px;
        }

        .timeline::before {
            content: '';
            position: absolute;
            left: 8px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: var(--gray-300);
        }

        .timeline-item {
            position: relative;
            margin-bottom: 16px;
            padding-bottom: 16px;
        }

        .timeline-item::before {
            content: '';
            position: absolute;
            left: -22px;
            top: 4px;
            width: 16px;
            height: 16px;
            background: var(--primary);
            border: 3px solid var(--text-inverse);
            border-radius: 50%;
            box-shadow: 0 0 0 2px var(--primary-lighter);
        }

        .timeline-content {
            background: var(--gray-50);
            padding: 12px 16px;
            border-radius: 8px;
            border-left: 3px solid var(--primary);
        }

        .timeline-title {
            font-weight: 700;
            color: var(--text);
            margin-bottom: 4px;
        }

        .timeline-time {
            font-size: 0.8rem;
            color: var(--text-light);
        }

        /* Empty States */
        .empty-state {
            text-align: center;
            padding: 48px 20px;
            color: var(--text-light);
        }

        .empty-state-icon {
            font-size: 3rem;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .empty-state-title {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 8px;
            color: var(--text);
        }

        .empty-state-desc {
            font-size: 0.9rem;
            margin-bottom: 16px;
        }

        /* Status Indicators */
        .status-dot {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 6px;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .status-dot.online { background: var(--success); }
        .status-dot.offline { background: var(--gray-400); }
        .status-dot.busy { background: var(--warning); }
        .status-dot.unavailable { background: var(--danger); }
        
    </style>



</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Hospital Patient Flow Simulator</h1>
            <div class="header-controls">
                <!-- <button class="btn"><i class="fas fa-play"></i> Start</button>
                <button class="btn"><i class="fas fa-pause"></i> Pause</button> -->
                <!-- <button onclick="manualResetDailyRooms()" style="
        padding: 10px 16px;
        background: linear-gradient(135deg, #0047AB 0%, #0056B3 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
    " onmouseover="this.style.transform='scale(1.05)'"
       onmouseout="this.style.transform='scale(1)'">
        <i class="fas fa-sync-alt"></i>
        Reset
    </button> -->
            </div>
        </div>

        <div class="nav-tabs">
            <button class="nav-tab active" onclick="switchTab('allfloors')">📊 All Floors</button>
            <button class="nav-tab" onclick="switchTab('floor1')">Floor 1</button>
            <button class="nav-tab" onclick="switchTab('floor2')">Floor 2</button>
            <button class="nav-tab" onclick="switchTab('floor3')">Floor 3</button>
            <button class="nav-tab" onclick="switchTab('floor4')">Floor 4</button>
            <button class="nav-tab" onclick="switchTab('floor5')">Floor 5</button>
            <button class="nav-tab" onclick="switchTab('floor6')">🏥 ห้องตรวจ</button>
            <button class="nav-tab" onclick="switchTab('patients')">👥 Patients</button>
            
        </div>

        <div class="main-content">
            <div id="allfloors" class="tab-content active">
                <div class="stations-container">
                    <!-- HEADER WITH TITLE AND REFRESH BUTTON -->
                    <div class="stations-header" style="justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <div class="floor-title">📊 Hospital Dashboard - All Stations</div>
                        <button class="btn btn-primary" onclick="loadAllFloorsEnhanced()" style="background: linear-gradient(135deg, #0056B3 0%, #003d82 100%); color: white; padding: 10px 20px;">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>

                    <!-- STATISTICS CARDS -->
                    <div class="dashboard-stats-grid" id="allfloors-stats"></div>

                    <!-- CONTROLS: FILTER, SORT, SEARCH -->
                    <div class="dashboard-controls">
                        <div class="control-group">
                            <label class="form-label">Filter by Floor:</label>
                            <select onchange="filterAllFloorsStations()" id="floorFilter" class="form-control">
                                <option value="">All Floors</option>
                                <option value="1">Floor 1</option>
                                <option value="2">Floor 2</option>
                                <option value="3">Floor 3</option>
                                <option value="4">Floor 4</option>
                                <option value="5">Floor 5</option>
                                <option value="6">ห้องตรวจ</option>
                            </select>
                        </div>

                        <div class="control-group">
                            <label class="form-label">Sort by:</label>
                            <select onchange="sortAllFloorsStations()" id="sortBy" class="form-control">
                                <option value="name">Station Name</option>
                                <option value="patients">Patient Count (High to Low)</option>
                                <option value="occupancy">Occupancy (High to Low)</option>
                            </select>
                        </div>

                        <div class="control-group" style="flex: 1;">
                            <label class="form-label">Search:</label>
                            <input type="text" id="searchInput" onkeyup="filterAllFloorsStations()" placeholder="🔍 Search station name..." class="form-control">
                        </div>
                    </div>

                    <!-- STATIONS GRID -->
                    <div class="dashboard-cards-grid" id="allfloors-list"></div>
                </div>
            </div>
            <div id="floor1" class="tab-content"><div class="stations-container"><div class="stations-header"><div class="floor-title">Floor 1</div><button class="btn btn-success" onclick="openWizard(1)"><i class="fas fa-plus"></i> Add Station</button></div><div class="stations-grid" id="floor1-stations"></div></div></div>
            <div id="floor2" class="tab-content"><div class="stations-container"><div class="stations-header"><div class="floor-title">Floor 2</div><button class="btn btn-success" onclick="openWizard(2)"><i class="fas fa-plus"></i> Add Station</button></div><div class="stations-grid" id="floor2-stations"></div></div></div>
            <div id="floor3" class="tab-content"><div class="stations-container"><div class="stations-header"><div class="floor-title">Floor 3</div><button class="btn btn-success" onclick="openWizard(3)"><i class="fas fa-plus"></i> Add Station</button></div><div class="stations-grid" id="floor3-stations"></div></div></div>
            <div id="floor4" class="tab-content"><div class="stations-container"><div class="stations-header"><div class="floor-title">Floor 4</div><button class="btn btn-success" onclick="openWizard(4)"><i class="fas fa-plus"></i> Add Station</button></div><div class="stations-grid" id="floor4-stations"></div></div></div>
            <div id="floor5" class="tab-content"><div class="stations-container"><div class="stations-header"><div class="floor-title">Floor 5</div><button class="btn btn-success" onclick="openWizard(5)"><i class="fas fa-plus"></i> Add Station</button></div><div class="stations-grid" id="floor5-stations"></div></div></div>
            <div id="floor6" class="tab-content"><div class="stations-container"><div class="stations-header"><div class="floor-title">🏥 ห้องตรวจ</div><button class="btn btn-success" onclick="openWizard(6)"><i class="fas fa-plus"></i> Add Station</button></div><div class="stations-grid" id="floor6-stations"></div></div></div>
            
            <!-- PATIENTS TAB -->
            <div id="patients" class="tab-content">
                <div class="stations-container">
                    <div class="stations-header">
                        <div class="floor-title">👥 จัดการผู้ป่วย</div>
                        <button class="btn btn-success" onclick="openImportModal()"><i class="fas fa-file-import"></i> Import ข้อมูล</button>
                    </div>
                    
                    <div style="margin-bottom: 20px; display: flex; gap: 15px; align-items: center;">
                        <div class="form-group" style="margin: 0; flex: 1;">
                            <label class="form-	                    <div style="flex: 1;">
	                        <label for="patientDateFilter">วันที่นัดหมาย:</label>
	                        <input type="date" id="patientDateFilter" onchange="loadPatients()">
	                    </div>
	                    <div style="flex: 1;">
	                        <label for="patientStatusFilter">สถานะ:</label>
	                        <select id="patientStatusFilter" onchange="loadPatients()">
	                            <option value="">ทั้งหมด</option>
	                            <option value="waiting">รอ</option>
	                            <option value="in_progress">กำลังรักษา</option>
	                            <option value="completed">เสร็จสิ้น</option>
	                        </select>
	                    </div>
	                    <div style="flex: 1;">
	                        <label for="patientDoctorFilter">แพทย์:</label>
	                        <select id="patientDoctorFilter" onchange="loadPatients()">
	                            <option value="">ทั้งหมด</option>
	                            <!-- Options will be loaded by JavaScript -->
	                        </select>
	                    </div>
	                    <div style="flex: 1;">
	                        <label for="patientStationFilter">สถานี:</label>
	                        <select id="patientStationFilter" onchange="loadPatients()">
	                            <option value="">ทั้งหมด</option>
	                            <!-- Options will be loaded by JavaScript -->
	                        </select>
	                    </div>
                    </div>
                    
                    <div id="patientsList"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- WIZARD MODAL -->
    <div id="createStationWizard" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">🏥 สร้างสถานีใหม่ <span id="stepIndicator" style="font-size: 0.7em; color: #0056B3;">(ขั้นตอนที่ 1/4)</span></h2>
                <button class="close-modal" onclick="closeWizard()">&times;</button>
            </div>

            <div class="progress-bar-container">
                <div class="progress-bar" id="progressBar"></div>
            </div>

            <!-- TAB NAVIGATION -->
            <div id="wizardTabNavigation" style="display: flex; gap: 10px; margin-bottom: 30px; border-bottom: 2px solid var(--glass-border); padding-bottom: 10px; overflow-x: auto;">
                <button class="tab-btn active" id="tab-btn-1" onclick="switchWizardTab(1)">
                    <i class="fas fa-info-circle"></i> ข้อมูลพื้นฐาน
                </button>
                <button class="tab-btn" id="tab-btn-2" onclick="switchWizardTab(2)" style="display:none;">
                    <i class="fas fa-users"></i> พนักงาน
                </button>
                <button class="tab-btn" id="tab-btn-3" onclick="switchWizardTab(3)" style="display:none;">
                    <i class="fas fa-user-md"></i> แพทย์
                </button>
                <button class="tab-btn" id="tab-btn-4" onclick="switchWizardTab(4)" style="display:none;">
                    <i class="fas fa-door-open"></i> ห้อง
                </button>
            </div>

            <form id="wizardForm">
                <!-- TAB 1: BASIC INFO -->
                <div id="wizard-tab-1" class="wizard-step">
                    <h3>📋 ข้อมูลพื้นฐาน</h3>
                    <div class="form-group">
                        <label class="form-label">ชื่อสถานี *</label>
                        <input type="text" id="stationName" class="form-control" placeholder="เช่น Registration, X-Ray">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">ประเภทสเตชั่น *</label>
                        <div style="display: grid; gap: 15px; margin-top: 10px;">
                            <label style="display: flex; align-items: start; gap: 12px; padding: 15px; background: rgba(255,255,255,0.5); border-radius: 10px; cursor: pointer; border: 2px solid transparent;" class="station-type-option" data-type="with_rooms">
                                <input type="radio" name="stationType" value="with_rooms" onchange="onStationTypeChange()" style="margin-top: 3px; width: 18px; height: 18px; cursor: pointer;">
                                <div>
                                    <div style="font-weight: 600; margin-bottom: 5px;">🏥 สเตชั่นแบบมีห้อง (With Rooms)</div>
                                    <div style="font-size: 12px; color: var(--text-light);">มีห้อง แผนก หัตถการ พนักงาน และอุปกรณ์<br>เหมาะสำหรับ: X-Ray, Lab, Operating Room</div>
                                </div>
                            </label>
                            <label style="display: flex; align-items: start; gap: 12px; padding: 15px; background: rgba(255,255,255,0.5); border-radius: 10px; cursor: pointer; border: 2px solid transparent;" class="station-type-option" data-type="simple">
                                <input type="radio" name="stationType" value="simple" onchange="onStationTypeChange()" style="margin-top: 3px; width: 18px; height: 18px; cursor: pointer;">
                                <div>
                                    <div style="font-weight: 600; margin-bottom: 5px;">📋 สเตชั่นแบบง่าย (Simple)</div>
                                    <div style="font-size: 12px; color: var(--text-light);">ไม่มีห้อง กำหนดเวลาและจำนวนพนักงานโดยตรง<br>เหมาะสำหรับ: Registration, Triage, Pharmacy</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Simple Station Fields -->
                    <div id="simpleStationFields" style="display: none;">
                        <div style="background: rgba(30, 132, 73, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid #1E8449;">
                            <i class="fas fa-info-circle"></i> <strong>สเตชั่นแบบง่าย</strong> - กำหนดเวลาและจำนวนพนักงานโดยตรง
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                            <div class="form-group">
                                <label class="form-label">เวลารอ (นาที) *</label>
                                <input type="number" id="defaultWaitTime" class="form-control" min="0" max="480"  placeholder="เช่น 10">
                                <small style="font-size: 11px; color: var(--text-light);">เวลารอคาดการณ์</small>
                            </div>
                            <div class="form-group">
                                <label class="form-label">เวลาทำงาน (นาที) *</label>
                                <input type="number" id="defaultServiceTime" class="form-control" min="1" max="480"  placeholder="เช่น 5">
                                <small style="font-size: 11px; color: var(--text-light);">เวลาให้บริการ</small>
                            </div>
                            <div class="form-group">
                                <label class="form-label">จำนวนพนักงาน *</label>
                                <input type="number" id="staffCount" class="form-control" min="1" max="50"  placeholder="เช่น 2">
                                <small style="font-size: 11px; color: var(--text-light);">จำนวนคนให้บริการ</small>
                            </div>
                        </div>
                        
                        <h4 style="margin-top: 20px; border-bottom: 1px solid #e9ecef; padding-bottom: 5px;">ตารางเวลาทำงานของพนักงาน (รายคน)</h4>
                        <div id="staffScheduleContainer">
                            <!-- Staff schedule rows will be injected here -->
                        </div>
                        <button type="button" class="btn btn-sm btn-primary" onclick="addStaffScheduleRow()">
                            <i class="fas fa-plus"></i> เพิ่มตารางเวลาพนักงาน
                        </button>
                    </div>

                    <!-- With Rooms Station Fields -->
                    <div id="withRoomsStationFields" style="display: none;">
                        <div class="form-group">
                            <label class="form-label">แผนก *</label>
                            <select id="departmentSelect" class="form-control" onchange="onDepartmentChange()">
                                <option value="">-- เลือกแผนก --</option>
                            </select>
                        </div>

                        <div id="selectedDepartment" style="display: none;">
                            <div style="background: rgba(0, 71, 171, 0.1); padding: 12px 15px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid #0047AB;">
                                <i class="fas fa-info-circle"></i> แผนก: <strong id="deptName"></strong>
                            </div>

                            <div style="margin-bottom: 20px;">
                                <h4 style="margin-bottom: 15px;">⚕️ หัตถการในแผนก:</h4>
                                <div id="proceduresList" style="max-height: 400px; overflow-y: auto;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: STAFF -->
                <div id="wizard-tab-2" class="wizard-step" style="display:none;">
                    <h3>👥 พนักงานประจำสถานี</h3>
                    <!-- ปุ่ม "+ เพิ่มพนักงาน" ถูกย้ายไปสร้างโดย JavaScript ใน station_room_management.js -->
                    <div id="staffList"></div>
                </div>

                <!-- TAB 3: DOCTOR -->
                <div id="wizard-tab-3" class="wizard-step" style="display:none;">
                    <h3>👨‍⚕️ แพทย์ประจำสถานี</h3>
                    <button type="button" class="btn btn-success" onclick="addDoctorRow()" style="margin-bottom: 15px;">
                        <i class="fas fa-plus"></i> เพิ่มแพทย์
                    </button>
                    <div id="doctorList"></div>
                </div>

                <!-- TAB 4: ROOMS -->
                <div id="wizard-tab-4" class="wizard-step" style="display:none;">
                    <h3>🚪 ห้องและเครื่องมือแพทย์</h3>
                    <div class="form-group">
                        <label class="form-label">จำนวนห้อง (1-10) *</label>
                        <input type="number" id="roomCount" class="form-control" min="1" max="10" value="" onchange="generateRooms()">
                    </div>
                    <div id="roomsContainer"></div>
                </div>
            </form>

            <div style="display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--glass-border); gap: 10px;">
                <button type="button" class="btn" onclick="previousWizardTab()" id="prevTabBtn" style="display: none;"><i class="fas fa-arrow-left"></i> ย้อนหลัง</button>
                <div style="flex: 1;"></div>
                <button type="button" class="btn btn-danger" onclick="closeWizard()"><i class="fas fa-times"></i> ยกเลิก</button>
                <button type="button" class="btn" onclick="nextWizardTab()" id="nextTabBtn" style="background: var(--glass-light);">ถัดไป <i class="fas fa-arrow-right"></i></button>
                <button type="submit" class="btn btn-success" onclick="submitWizard(event)" id="submitTabBtn" style="display: none;"><i class="fas fa-check"></i> บันทึก</button>
            </div>
        </div>
    </div>

    <!-- ROOM DETAILS MODAL -->
    <div id="roomDetailsModal" class="modal">
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <h2 class="modal-title" id="roomDetailsTitle">ตั้งค่าห้อง</h2>
                <button class="close-modal" onclick="closeRoomDetailsModal()">&times;</button>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid var(--glass-border); padding-bottom: 10px;">
                <button class="tab-btn active" id="room-tab-btn-1" onclick="switchRoomTab(1)">
                    <i class="fas fa-stethoscope"></i> เครื่องมือ
                </button>
                <button class="tab-btn" id="room-tab-btn-2" onclick="switchRoomTab(2)">
                    <i class="fas fa-tasks"></i> หัตถการ
                </button>
            </div>

            <!-- Room Equipment Tab -->
            <div id="room-tab-1" class="wizard-step">
                <h4 style="margin-bottom: 15px;">เครื่องมือแพทย์ในห้อง</h4>
                <button type="button" class="btn btn-success" onclick="addEquipmentRow(currentRoomId)" style="margin-bottom: 15px;">
                    <i class="fas fa-plus"></i> เพิ่มเครื่องมือ
                </button>
                <div id="roomEquipmentList"></div>
            </div>

           
           <!-- Room Procedures Tab -->
<!-- Room Procedures Tab -->
<div id="room-tab-2" class="wizard-step" style="display:none;">
    <h4 style="margin-bottom: 15px;">หัตถการที่หอ้งนี้สามารถทำได้</h4>
    
    <!-- ปุ่มเพิ่มหัตถการ -->
    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <!-- ปุ่มเพิ่มหัตถการใหม่ -->
        <button type="button" class="btn btn-success" onclick="addProcedureRow(currentRoomId)" style="padding: 8px 12px; font-size: 12px;">
            <i class="fas fa-plus"></i> เพิ่มหัตถการใหม่
        </button>
        
        <!-- ปุ่มดึงหัตถการจาก Database (ใหม่) -->
        <button type="button" class="btn" onclick="openSelectProcedureFromStationDBModalNew()" style="padding: 8px 12px; font-size: 12px; background: linear-gradient(135deg, #0056B3 0%, #003d82 100%); color: white; border: none;">
            <i class="fas fa-database"></i> ดึงหัตถการจาก Database
        </button>
    </div>
    
    <div id="roomProceduresContainer">
        <div id="allProceduresCheckboxContainer">
            <!-- allProcedures checkbox จะถูกสร้างโดย JavaScript -->
        </div>
        <div id="roomProceduresList" class="procedure-list"></div>
    </div>
</div>


            <div style="display: flex; justify-content: flex-end; margin-top: 20px; gap: 10px; border-top: 1px solid var(--glass-border); padding-top: 15px;">
                <button type="button" class="btn btn-danger" onclick="closeRoomDetailsModal()"><i class="fas fa-times"></i> ปิด</button>
                <button type="button" class="btn btn-success" onclick="saveRoomDetails()"><i class="fas fa-check"></i> บันทึก</button>
            </div>
        </div>
    </div>

    <!-- IMPORT PATIENTS MODAL -->
    <div id="importModal" class="modal">
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2 class="modal-title">📄 Import ข้อมูลผู้ป่วย</h2>
                <button class="close-modal" onclick="closeImportModal()">&times;</button>
            </div>

            <div class="form-group">
                <label class="form-label">รูปแบบข้อมูล:</label>
                <select id="importType" class="form-control" onchange="updateImportPlaceholder()">
                    <option value="text">Text (คัดลอกจาก Excel)</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">วางข้อมูลที่นี่:</label>
                <textarea id="importData" class="form-control" rows="15" placeholder="วางข้อมูลที่คัดลอกจาก Excel..."></textarea>
            </div>

            <div style="background: rgba(0, 71, 171, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px; font-size: 12px;">
                <strong>📌 รูปแบบข้อมูล:</strong><br>
                1&nbsp;&nbsp;&nbsp;&nbsp;20241007-217&nbsp;&nbsp;&nbsp;&nbsp;5218262 สมหมาย ใจดี&nbsp;&nbsp;&nbsp;&nbsp;+66819203788&nbsp;&nbsp;&nbsp;&nbsp;OCT Mac BE,ขยายม่านตา&nbsp;&nbsp;&nbsp;&nbsp;นพ.สมบัติ&nbsp;&nbsp;&nbsp;&nbsp;20/11/2025&nbsp;&nbsp;&nbsp;&nbsp;00:00<br>
                <br>
                <strong>ข้อมูลที่ใช้:</strong> HN, ชื่อ, หัตถการ, แพทย์, วันที่, เวลา
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--glass-border); padding-top: 15px;">
                <button type="button" class="btn btn-danger" onclick="closeImportModal()">
                    <i class="fas fa-times"></i> ยกเลิก
                </button>
                <button type="button" class="btn btn-success" onclick="submitImport()">
                    <i class="fas fa-upload"></i> Import
                </button>
            </div>
        </div>
    </div>

    <!-- PATIENT DETAIL MODAL -->
    <div id="patientDetailModal" class="modal">
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <h2 class="modal-title" id="patientDetailTitle">รายละเอียดผู้ป่วย</h2>
                <button class="close-modal" onclick="closePatientDetailModal()">&times;</button>
            </div>

            <div id="patientDetailContent"></div>

            <div style="display: flex; justify-content: space-between; margin-top: 20px; border-top: 1px solid var(--glass-border); padding-top: 15px;">
                <button type="button" class="btn btn-success" onclick="startVisualSimulation()">
                    <i class="fas fa-play-circle"></i> Visual Simulation
                </button>
                <button type="button" class="btn btn-danger" onclick="closePatientDetailModal()">
                    <i class="fas fa-times"></i> ปิด
                </button>
            </div>
        </div>
    </div>

	    <!-- ADD PROCEDURE MODAL -->
	    <div id="addProcedureModal" class="modal">
	        <div class="modal-content" style="width: 400px;">
	            <div class="modal-header">
	                <h2 class="modal-title">เพิ่มหัตถการระหว่าง Simulation</h2>
	                <button class="close-modal" onclick="closeAddProcedureModal()">&times;</button>
	            </div>
	            <div class="form-group">
	                <label for="newProcedureSelect" class="form-label">หัตถการ:</label>
	                <select id="newProcedureSelect" class="form-control"></select>
	            </div>
	            <div class="form-group">
	                <label for="newProcedureDuration" class="form-label">ระยะเวลา (นาที):</label>
	                <input type="number" id="newProcedureDuration" class="form-control" value="15" min="1">
	            </div>
	            <button class="btn btn-primary" onclick="addProcedureToPatient()">
	                <i class="fas fa-plus"></i> เพิ่มขั้นตอน
	            </button>
	        </div>
	    </div>
	
	    <!-- VISUAL SIMULATION MODAL -->
	    <div id="visualSimulationModal" class="modal">
	        <div class="modal-content" style="max-width: 95%; max-height: 95vh;">
            <div class="modal-header">
                <h2 class="modal-title" id="simulationTitle">🎪 Visual Simulation</h2>
                <button class="close-modal" onclick="closeVisualSimulation()">&times;</button>
            </div>

            <div style="display: flex; gap: 15px; margin-bottom: 15px; align-items: center; background: rgba(0, 71, 171, 0.1); padding: 15px; border-radius: 10px;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 5px;" id="simPatientName"></div>
                    <div style="font-size: 12px; color: var(--text-light);" id="simPatientInfo"></div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #0056B3;" id="simCurrentTime">00:00</div>
                    <div style="font-size: 11px; color: var(--text-light);">เวลาปัจจุบัน</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold;" id="simCurrentStep">-</div>
                    <div style="font-size: 11px; color: var(--text-light);">ขั้นตอนปัจจุบัน</div>
                </div>
	                <div>
	                    <button class="btn btn-info" onclick="openAddProcedureModal()" style="margin-right: 10px;">
	                        <i class="fas fa-plus"></i> เพิ่มหัตถการ
	                    </button>
	                    <button class="btn btn-success" id="simPlayBtn" onclick="toggleSimulation()">
	                        <i class="fas fa-play"></i> Play
	                    </button>
	                    <button class="btn btn-warning" onclick="resetSimulation()" style="margin-left: 5px;">
	                        <i class="fas fa-redo"></i> Reset
	                    </button>
	                </div>
            </div>

            <div style="position: relative; background: linear-gradient(135deg, #0056B3 0%, #0047AB 100%); border-radius: 15px; overflow: hidden; min-height: 600px;">
                <canvas id="simulationCanvas" style="width: 100%; height: 600px; display: block;"></canvas>
            </div>

            <div style="margin-top: 15px; background: rgba(255,255,255,0.5); padding: 10px; border-radius: 10px;">
                <div style="font-weight: bold; margin-bottom: 10px;">📋 Timeline:</div>
                <div id="simulationTimeline" style="max-height: 150px; overflow-y: auto;"></div>
            </div>
        </div>
    </div>
<!-- Modal: Assign Room to Staff -->
<div id="assignRoomModal" class="modal">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h2 class="modal-title">กำหนดห้องให้พนักงาน</h2>
            <button class="close-modal" onclick="closeAssignRoomModal()">&times;</button>
        </div>
        <div class="modal-body">
            <p>กำลังกำหนดห้องให้: <strong id="staffToAssignName"></strong></p>
            <input type="hidden" id="staffToAssignId">
            <div class="form-group">
                <label for="roomSelect" class="form-label">เลือกห้อง:</label>
                <select id="roomSelect" class="form-control">
                    <!-- Options will be loaded by JS -->
                </select>
            </div>
            <button class="btn btn-success" style="width: 100%;" onclick="assignRoomConfirmed()">
                <i class="fas fa-check"></i> ยืนยันการกำหนดห้อง
            </button>
        </div>
    </div>
</div>

<!-- Room Procedure Settings Modal -->
    <div id="roomProcedureSettingsModal" class="modal" style="z-index: 9999;">
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h2 class="modal-title" id="roomProcedureSettingsTitle">ตั้งค่าหัตถการ</h2>
                <button class="close-modal" onclick="closeRoomProcedureSettings()">&times;</button>
            </div>
            <div class="modal-body">
                <div id="roomProcedureList">
                    <!-- Procedure checkboxes will be loaded here by JS -->
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; border-top: 1px solid var(--glass-border); padding-top: 15px;">
                <button class="btn btn-danger" onclick="closeRoomProcedureSettings()">
                    <i class="fas fa-times"></i> ยกเลิก
                </button>
                <button class="btn btn-success" onclick="saveRoomProcedureSettings()">
                    <i class="fas fa-check"></i> บันทึก
                </button>
            </div>
        </div>
    </div>

    <!-- Station Detail Modal -->
<div id="stationDetailModal" class="modal">
    <div class="modal-content" style="max-width: 1200px;">
        <div class="modal-header">
            <div>
                <div class="modal-title" id="stationDetailTitle">Station Name</div>
                <div style="font-size: 14px; color: var(--text-light); margin-top: 5px;" id="stationDetailSubtitle">Station Code | Floor X</div>
            </div>
            <button class="close-modal" onclick="closeStationDetail()">×</button>
        </div>
        
        <!-- Tabs -->
        <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid var(--glass-border); padding-bottom: 10px;">
            <button class="station-tab-btn active" onclick="switchStationTab('Rooms')">🛏️ ห้อง</button>
            <button class="station-tab-btn" onclick="switchStationTab('Staff')">👥 พนักงาน</button>
            <button class="station-tab-btn" onclick="switchStationTab('Doctors')">👨‍⚕️ แพทย์</button>
            <button class="station-tab-btn" onclick="switchStationTab('Procedures')">💉 หัตถการ</button>
            <button class="station-tab-btn" onclick="switchStationTab('Patients')">🛏️ คนไข้</button>
            <!-- <button class="station-tab-btn" onclick="switchStationTab('Settings')" data-tab="settings"><i class="fas fa-cog"></i> ตั้งค่า</button> -->
        </div>
        
        <!-- Tab Contents -->
        <div id="stationRoomsContent" class="station-tab-content" style="display: block;"></div>
        <div id="stationStaffContent" class="station-tab-content" style="display: none;"></div>
        <div id="stationDoctorsContent" class="station-tab-content" style="display: none;"></div>
        <div id="stationProceduresContent" class="station-tab-content" style="display: none;"></div>
        <div id="stationPatientsContent" class="station-tab-content" style="display: none;"></div>
        <div id="stationStaffStatusContent" class="station-tab-content" style="display: none;">
            <div id="staffStatsCards" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                <!-- Staff Stats Cards will be injected here by JS -->
            </div>
            <div id="staffListContainer" style="display: grid; gap: 15px;">
                <!-- Staff Cards will be injected here by JS -->
            </div>
        </div>
        
        <!-- Settings Tab Content (for Simple Station) -->
        <div id="stationSettingsContent" class="station-tab-content" style="display: none;">
            <div id="simpleStationSettings">
                <!-- Settings UI will be injected here by JS -->
            </div>
        </div>


    </div>
</div>

<!-- ✅ EDIT STATION MODAL -->
<div id="editStationModal" class="modal" style="z-index: 1005;">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h2 class="modal-title">แก้ไขชื่อสถานี</h2>
            <button class="close-modal" onclick="closeEditStationModal()">&times;</button>
        </div>
        <div style="padding: 20px;">
            <div class="form-group">
                <label class="form-label">ชื่อสถานี</label>
                <input type="text" id="editStationNameInput" class="form-control" placeholder="กรอกชื่อสถานีใหม่">
                <input type="hidden" id="editStationIdInput">
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 15px;">
                <button class="btn btn-danger" onclick="closeEditStationModal()">
                    <i class="fas fa-times"></i> ยกเลิก
                </button>
                <button class="btn btn-success" onclick="saveEditStation()">
                    <i class="fas fa-save"></i> บันทึก
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Add Equipment Modal -->

    <div id="addEquipmentModal" class="modal" style="z-index: 1002;">
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h2 class="modal-title">เพิ่มเครื่องมือในห้อง</h2>
                <button class="close-modal" onclick="closeAddEquipmentModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="newEquipmentName" class="form-label">ชื่อเครื่องมือ:</label>
                    <input type="text" id="newEquipmentName" class="form-control" placeholder="เช่น เครื่อง X-ray, EKG">
                </div>
                <div class="form-group" style="display: flex; justify-content: space-between; align-items: center;">
                    <label for="newEquipmentRequireStaff" class="form-label" style="margin-bottom: 0;">ต้องใช้พนักงาน:</label>
                    <label class="switch">
                        <input type="checkbox" id="newEquipmentRequireStaff">
                        <span class="slider"></span>
                    </label>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; border-top: 1px solid var(--glass-border); padding-top: 15px;">
                    <button class="btn btn-danger" onclick="closeAddEquipmentModal()">
                        <i class="fas fa-times"></i> ยกเลิก
                    </button>
                    <button class="btn btn-success" onclick="addEquipmentToRoom()">
                        <i class="fas fa-plus"></i> เพิ่มเครื่องมือ
                    </button>
                </div>
            </div>
        </div>
    </div>

<!-- Room Detail Modal -->
<!-- 🚪 Room Detail Modal - FIXED IDs -->
<!-- แทนที่ส่วน roomDetailModal เดิมใน main.php ด้วยโค้ดนี้ -->

<div id="roomDetailModal" class="modal" style="z-index: 1001;">
    <div class="modal-content" style="max-width: 1000px; max-height: 85vh; overflow-y: auto;">
        <!-- Header -->
        <div class="modal-header" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 2px solid #e9ecef;
            background: linear-gradient(135deg, #0056b3 0%, #003d82 100%);
            color: white;
            border-radius: 12px 12px 0 0;
        ">
            <div>
                <div class="modal-title" id="roomDetailTitle" style="margin: 0; font-size: 20px; font-weight: 700;">
                    Room Detail
                </div>
                <div id="roomDetailSubtitle" style="font-size: 14px; color: rgba(255,255,255,0.8); margin-top: 5px;">
                    Station Name | Floor X
                </div>
            </div>
            <button class="close-modal" onclick="closeRoomDetail()" style="
                background: none;
                border: none;
                color: white;
                font-size: 28px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                ×
            </button>
        </div>

        <!-- Content Body -->
        <div style="padding: 20px;">
            <!-- 1. STAFF SECTION -->
            <div style="margin-bottom: 30px;">
                <h3 style="color: #0056b3; font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center;">
                    <i class="fas fa-users" style="margin-right: 8px;"></i>
                    พนักงานในห้อง
                </h3>
                <div id="roomStaffContainer" style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #17a2b8;">
                    <div style="color: #999; font-size: 13px;">กำลังโหลด...</div>
                </div>
            </div>

            <!-- 2. DOCTORS SECTION -->
            <div style="margin-bottom: 30px;">
                <h3 style="color: #0056b3; font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center;">
                    <i class="fas fa-user-md" style="margin-right: 8px;"></i>
                    แพทย์ในห้อง
                </h3>
                <div id="roomDoctorContainer" style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #28a745;">
                    <div style="color: #999; font-size: 13px;">กำลังโหลด...</div>
                </div>
            </div>

            <!-- 3. EQUIPMENT SECTION -->
            <div style="margin-bottom: 30px;">
                <h3 style="color: #0056b3; font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center;">
                    <i class="fas fa-tools" style="margin-right: 8px;"></i>
                    เครื่องมือในห้อง
                </h3>
                <div id="roomEquipmentContainer" style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <div style="color: #999; font-size: 13px;">กำลังโหลด...</div>
                </div>
            </div>

            <!-- 4. PROCEDURES SECTION -->
            <div style="margin-bottom: 30px;">
                <h3 style="color: #0056b3; font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center;">
                    <i class="fas fa-stethoscope" style="margin-right: 8px;"></i>
                    การดำเนินการ (Procedures)
                </h3>
                <div id="roomProcedureContainer" style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #6610f2; max-height: 300px; overflow-y: auto;">
                    <div style="color: #999; font-size: 13px;">กำลังโหลด...</div>
                </div>
            </div>

            <!-- 5. PATIENTS SECTION -->
            <div style="margin-bottom: 20px;">
                <h3 style="color: #0056b3; font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center;">
                    <i class="fas fa-hospital-user" style="margin-right: 8px;"></i>
                    คนไข้ในห้อง
                </h3>
                <div id="roomPatientContainer" style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #e83e8c;">
                    <div style="color: #999; font-size: 13px;">กำลังโหลด...</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="
            padding: 12px 20px;
            border-top: 1px solid #e9ecef;
            background: #f8f9fa;
            display: flex;
            justify-content: flex-end;
            border-radius: 0 0 12px 12px;
        ">
          
        </div>
    </div>
</div>

<!-- Add Staff Modal -->
<div id="addStaffModal" class="modal" style="z-index: 1003;">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <div class="modal-title">เพิ่มพนักงานเข้าห้อง</div>
            <button class="close-modal" onclick="closeAddStaffModal()">×</button>
        </div>
        <div id="addStaffModalContent"></div>
    </div>
</div>

<!-- Edit Staff Schedule Modal -->
<div id="editStaffScheduleModal" class="modal" style="z-index: 1004;">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <div class="modal-title">แก้ไขตารางเวลาทำงาน</div>
            <button class="close-modal" onclick="closeEditStaffScheduleModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label class="form-label">ชื่อพนักงาน</label>
                <input type="text" id="editStaffName" class="form-control" disabled style="background: #f0f0f0;">
                <input type="hidden" id="editStationStaffId">
            </div>
            <div class="form-group">
                <label class="form-label">เข้างาน</label>
                <input type="text" id="editWorkStartTime" class="form-control" placeholder="00:00 - 23:59">
            </div>
            <div class="form-group">
                <label class="form-label">พักเริ่ม</label>
                <input type="text" id="editBreakStartTime" class="form-control" placeholder="00:00 - 23:59">
            </div>
            <div class="form-group">
                <label class="form-label">พักสิ้นสุด</label>
                <input type="text" id="editBreakEndTime" class="form-control" placeholder="00:00 - 23:59">
            </div>
            <div class="form-group">
                <label class="form-label">เลิกงาน</label>
                <input type="text" id="editWorkEndTime" class="form-control" placeholder="00:00 - 23:59">
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn btn-danger" style="flex: 1;" onclick="closeEditStaffScheduleModal()">
                    <i class="fas fa-times"></i> ยกเลิก
                </button>
                <button class="btn btn-success" style="flex: 1;" onclick="saveEditStaffSchedule()">
                    <i class="fas fa-check"></i> บันทึก
                </button>
            </div>
        </div>
    </div>
</div>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.7.32/sweetalert2.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.7.32/sweetalert2.min.js"></script>
    <script>

      
        const API_BASE_URL = '/hospital/api';
        function getApiUrl(endpoint) {
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    return `${API_BASE_URL}/${cleanEndpoint}`;
}
        let currentWizardTab = 1;
        const totalWizardTabs = 4;
        let currentFloor = 1;
        let currentRoomTab = 1;
       // Initialize wizard data
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
            // Simple station fields
            default_wait_time: 10,
            default_service_time: 5,
            staff_count: 2,
            staff_schedules: [] // Array of {start, breakStart, breakEnd, end}
        };


        // ============================================
// AUTO-LOAD ALL FLOORS ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log("📄 Page loaded, auto-loading All Floors...");
    
    // Delay slightly to ensure DOM is ready
    setTimeout(async () => {
        try {
            console.log("🔍 Fetching stations...");
            const response = await fetch(`${API_BASE_URL}/get_stations.php`);
            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Loaded ${result.data.length} stations`);
                // Call the enhanced loader
                await loadAllFloorsEnhanced();
            } else {
                console.warn('⚠️ Failed to load stations:', result.message);
            }
        } catch (error) {
            console.error('❌ Error auto-loading stations:', error);
        }
    }, 800);
});
        // Add event listener for department selection
        document.addEventListener('DOMContentLoaded', () => {
            const departmentSelect = document.getElementById('departmentSelect');
            if (departmentSelect) {
                departmentSelect.addEventListener('change', onDepartmentChange);
            }
        });

        let departments = [];
        let allProcedures = [];

        // MAIN TAB FUNCTIONS
       // แทนที่ฟังก์ชัน switchTab ใน main.php ด้วยนี้
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'allfloors') {
        console.log('Loading all floors tab...');
        // เรียกใช้ฟังก์ชั่นใหม่
        loadAllFloorsEnhanced();
    } else if (tabName.startsWith('floor')) {
        const floor = parseInt(tabName.replace('floor', ''));
        console.log(`Loading floor ${floor}...`);
        loadStationsByFloor(floor);
    } else if (tabName === 'patients') {
        console.log('Loading patients tab...');
        loadPatients();
    }
}

        // WIZARD TAB FUNCTIONS
        function switchWizardTab(tab) {
            // ✅ Validate step ที่กำลังจะออก (currentWizardTab) ไม่ใช่ step ที่เข้า
            if (!validateWizardTab(currentWizardTab)) {
                console.log(`❌ Validation failed for step ${currentWizardTab}`);
                return;
            }
            
            console.log(`🔄 Moving from step ${currentWizardTab} to step ${tab}`);
            
            // ✅ Save data ของ step เก่า
            saveWizardTabData(currentWizardTab);
            
            // ✅ Hide ทั้งหมด แล้ว show step ใหม่
            document.querySelectorAll('.wizard-step').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            
            // ✅ Show step ใหม่
            const newTabElement = document.getElementById(`wizard-tab-${tab}`);
            const newBtnElement = document.getElementById(`tab-btn-${tab}`);
            
            if (!newTabElement || !newBtnElement) {
                console.error(`❌ Tab ${tab} elements not found`);
                return;
            }
            
            newTabElement.style.display = 'block';
            newBtnElement.classList.add('active');
            
            // ✅ Update global variable
            currentWizardTab = tab;
            updateWizardDisplay();
            
            console.log(`✅ Now at step ${currentWizardTab}`);
        }

        function nextWizardTab() {
            const currentTotalTabs = window.totalWizardTabs || totalWizardTabs;
            console.log(`⏭️ nextWizardTab called: current=${currentWizardTab}, total=${currentTotalTabs}`);
            
            if (currentWizardTab < currentTotalTabs) {
                console.log(`✅ Moving to next tab: ${currentWizardTab + 1}`);
                switchWizardTab(currentWizardTab + 1);
            } else {
                console.warn(`⚠️ Already at last tab (${currentWizardTab}/${currentTotalTabs})`);
            }
        }

        function previousWizardTab() {
            if (currentWizardTab > 1) {
                switchWizardTab(currentWizardTab - 1);
            }
        }

        function updateWizardDisplay() {
            const currentTotalTabs = window.totalWizardTabs || totalWizardTabs;
            const progress = (currentWizardTab / currentTotalTabs) * 100;
            document.getElementById('progressBar').style.width = progress + '%';
            document.getElementById('stepIndicator').textContent = `(ขั้นตอนที่ ${currentWizardTab}/${currentTotalTabs})`;
            document.getElementById('prevTabBtn').style.display = currentWizardTab > 1 ? 'block' : 'none';
            document.getElementById('nextTabBtn').style.display = currentWizardTab < currentTotalTabs ? 'block' : 'none';
            document.getElementById('submitTabBtn').style.display = currentWizardTab === currentTotalTabs ? 'block' : 'none';
        }

       function validateWizardTab(tab) {
    switch (tab) {
        case 1:
            // ตรวจสอบชื่อสถานี
            if (!document.getElementById('stationName').value.trim()) {
                alert('❌ กรุณากรอกชื่อสถานี');
                return false;
            }
            
            // ตรวจสอบประเภทสถานี
            const selectedStationType = document.querySelector('input[name="stationType"]:checked');
            if (!selectedStationType) {
                alert('❌ กรุณาเลือกประเภทสเตชั่น');
                return false;
            }
            
            // ตรวจสอบตามประเภทสถานี
            if (selectedStationType.value === 'simple') {
                // สำหรับ simple station ตรวจสอบเฉพาะชื่อสถานีก็พอ
                return true;
                
            } else if (selectedStationType.value === 'with_rooms') {
                // Validate with_rooms station fields
                if (!document.getElementById('departmentSelect').value) {
                    alert('❌ กรุณาเลือกแผนก');
                    return false;
                }
            }
            return true;
            
        case 4:
            // ตรวจสอบเฉพาะเมื่อเป็น with_rooms
            const selectedType = document.querySelector('input[name="stationType"]:checked');
            if (selectedType && selectedType.value === 'with_rooms') {
                const roomCount = parseInt(document.getElementById('roomCount').value);
                if (isNaN(roomCount) || roomCount < 1) {
                    alert('❌ กรุณากำหนดจำนวนห้อง');
                    return false;
                }
            }
            return true;
            
        default:
            return true;
    }
}

        function saveWizardTabData(tab) {
            switch (tab) {
                case 1:
                    wizardData.station_name = document.getElementById('stationName').value.trim();
                    const stationType = document.querySelector('input[name="stationType"]:checked');
                    wizardData.station_type = stationType ? stationType.value : '';
                    
                    if (wizardData.station_type === 'simple') {
                        wizardData.default_wait_time = parseInt(document.getElementById('defaultWaitTime').value) || 10;
                        wizardData.default_service_time = parseInt(document.getElementById('defaultServiceTime').value) || 5;
                        wizardData.staff_count = parseInt(document.getElementById('staffCount').value) || 2;
                        
                        // Save staff schedules
                        wizardData.staff_schedules = collectStaffSchedules();

                        wizardData.department_id = null;
                        wizardData.room_count = 0;
                    } else if (wizardData.station_type === 'with_rooms') {
                        wizardData.department_id = document.getElementById('departmentSelect').value;
                    }
                    break;
                case 2:
                    collectStaffData();
                    break;
                case 3:
                    collectDoctorData();
                    break;
                case 4:
                    saveRoomEquipment();
                    break;
                default:
                    break;
            }
        }

        function openWizard(floor) {
            console.log('🔓 openWizard() called with floor:', floor);
            
            currentFloor = floor;
            wizardData.floor = floor;
            wizardData.rooms = {};
            
            const modal = document.getElementById('createStationWizard');
            if (!modal) {
                console.error('❌ Modal element not found!');
                return;
            }
            
            modal.style.display = 'block';
            console.log('✅ Modal opened');
            
            currentWizardTab = 1;
            console.log('✅ Reset to tab 1');
            
            updateWizardDisplay();
            console.log('✅ updateWizardDisplay() called');
            
            // ✅ เพิ่ม delay เพื่อให้ DOM elements พร้อม
            setTimeout(() => {
                loadDepartments();
                console.log('✅ loadDepartments() called (after delay)');
            }, 100);
        }

       // ✅ FIXED closeWizard() function - แก้ไขโค้ดให้ถูกต้อง
function closeWizard() {
    console.log('🔴 closeWizard() called');
    
    // ✅ 1. ปิด modal ด้วยวิธีต่างๆ (บังคับให้ปิด)
    const modal = document.getElementById('createStationWizard');
    if (modal) {
        // วิธี 1: cssText with !important
        modal.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important;';
        console.log('✅ Modal closed with force');
    } else {
        console.error('❌ Modal element not found');
        return;
    }
    
    // ✅ ปิด backdrop
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.style.display = 'none';
    }
    
    // ✅ อนุญาต scroll
    document.body.style.overflow = 'auto';
    document.body.classList.remove('modal-open');

    // ✅ 2. รีเซ็ตข้อมูล wizard เฉพาะที่จำเป็น
    wizardData = {
        station_name: '',
        station_type: '',
        floor: currentFloor || 1,
        room_count: 1,
        department_id: '',
        departmentName: '',
        procedures: {},
        staff: [],
        doctors: [],
        rooms: {},
        default_wait_time: null,
        default_service_time: null,
        staff_count: 0,
        staff_schedules: []
    };
    
    // ✅ 3. รีเซ็ต UI ฟอร์ม
    const form = document.getElementById('wizardForm');
    if (form) {
        form.reset();
    }
    
    // ✅ 3.5 ล้าง dropdown HTML ให้แน่ใจ
    const departmentSelect = document.getElementById('departmentSelect');
    if (departmentSelect) {
        departmentSelect.innerHTML = '<option value="">-- เลือกแผนก --</option>';
        console.log('✅ Dropdown departments cleared');
    }
    
    // ✅ ล้าง procedures list
    const proceduresList = document.getElementById('proceduresList');
    if (proceduresList) {
        proceduresList.innerHTML = '';
        console.log('✅ Procedures list cleared');
    }
    
    // ✅ 4. รีเซ็ตแท็บกลับไปแท็บ 1
    currentWizardTab = 1;
    
    // ✅ 5. ซ่อน fields ทั้งหมด
    const simpleFields = document.getElementById('simpleStationFields');
    const withRoomsFields = document.getElementById('withRoomsStationFields');
    if (simpleFields) simpleFields.style.display = 'none';
    if (withRoomsFields) withRoomsFields.style.display = 'none';
    
    // ✅ 6. ซ่อนแท็บอื่นๆ และแสดงแค่แท็บ 1
    document.querySelectorAll('.wizard-step').forEach(el => {
        el.style.display = 'none';
    });
    
    const tab1 = document.getElementById('wizard-tab-1');
    if (tab1) {
        tab1.style.display = 'block';
    }
    
    // ✅ 7. รีเซ็ต progress bar
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = '25%';
    }
    
    // ✅ 8. รีเซ็ต navigation tabs
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('active');
    });
    
    const tabBtn1 = document.getElementById('tab-btn-1');
    if (tabBtn1) {
        tabBtn1.classList.add('active');
    }
    
    // ✅ 9. ซ่อนแท็บที่ไม่จำเป็น
    const tabBtn2 = document.getElementById('tab-btn-2');
    const tabBtn3 = document.getElementById('tab-btn-3');
    const tabBtn4 = document.getElementById('tab-btn-4');
    if (tabBtn2) tabBtn2.style.display = 'none';
    if (tabBtn3) tabBtn3.style.display = 'none';
    if (tabBtn4) tabBtn4.style.display = 'none';
    
    // ✅ 10. รีเซ็ต wizard navigation
    window.totalWizardTabs = 4;
    updateWizardDisplay();
    
    console.log('✅ closeWizard() completed successfully');
}

       function updateStaffScheduleUI() {
    const container = document.getElementById('staffScheduleContainer');
    if (!container) return;

    // ✅ ถ้าไม่มี staff_schedules หรือเป็น array ว่าง → แสดง placeholder
      if (!wizardData.staff_schedules || wizardData.staff_schedules.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 12px;">
                <i class="fas fa-info-circle" style="font-size: 48px; color: #0066cc; margin-bottom: 15px; opacity: 0.5;"></i>
                <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    ยังไม่มีตารางพนักงาน<br>
                    <strong>กดปุ่ม "+ เพิ่มตารางเวลาพนักงาน" ด้านล่างเพื่อเพิ่ม</strong>
                </p>
            </div>
        `;
        return;
    }

    // ✅ ถ้ามี staff_schedules แล้ว → แสดงตาราง
    let html = '';
    wizardData.staff_schedules.forEach((schedule, index) => {
        html += `
            <div class="row-item" id="staffScheduleRow-${index}">
                <div class="row-header" style="grid-template-columns: 2fr 1fr auto;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="font-size: 12px;">ชื่อพนักงาน</label>
                        <input type="text" class="form-control" value="${schedule.name || ''}" onchange="updateStaffScheduleData(${index}, 'name', this.value)" placeholder="เช่น พยาบาล A">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="font-size: 12px;">จำนวนคน</label>
                        <input type="number" class="form-control" value="${schedule.count || 1}" min="1" onchange="updateStaffScheduleData(${index}, 'count', parseInt(this.value))">
                    </div>
                    <button type="button" class="btn btn-danger" style="align-self: flex-end; padding: 8px 12px;" onclick="removeStaffScheduleRow(${index})">
                        <i class="fas fa-trash"></i> ลบ
                    </button>
                </div>
                <div class="row-details" style="grid-template-columns: repeat(4, 1fr);">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="font-size: 12px;">เข้างาน</label>
                        <input type="time" class="form-control" value="${schedule.start || '08:00'}" onchange="updateStaffScheduleData(${index}, 'start', this.value)">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="font-size: 12px;">พักเริ่ม</label>
                        <input type="time" class="form-control" value="${schedule.breakStart || '12:00'}" onchange="updateStaffScheduleData(${index}, 'breakStart', this.value)">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="font-size: 12px;">พักสิ้นสุด</label>
                        <input type="time" class="form-control" value="${schedule.breakEnd || '13:00'}" onchange="updateStaffScheduleData(${index}, 'breakEnd', this.value)">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="font-size: 12px;">เลิกงาน</label>
                        <input type="time" class="form-control" value="${schedule.end || '17:00'}" onchange="updateStaffScheduleData(${index}, 'end', this.value)">
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

        function addStaffScheduleRow() {
            wizardData.staff_schedules.push({
                name: `พนักงาน ${wizardData.staff_schedules.length + 1}`,
                count: 1,
                start: '08:00',
                breakStart: '12:00',
                breakEnd: '13:00',
                end: '17:00'
            });
            updateStaffScheduleUI();
        }

        function removeStaffScheduleRow(index) {
            wizardData.staff_schedules.splice(index, 1);
            updateStaffScheduleUI();
        }

        function updateStaffScheduleData(index, key, value) {
            if (wizardData.staff_schedules[index]) {
                wizardData.staff_schedules[index][key] = value;
            }
        }

        function collectStaffSchedules() {
            // In the current implementation, the data is already being updated directly
            // in wizardData.staff_schedules via updateStaffScheduleData.
            // So, we just need to return the current state of the array.
            return wizardData.staff_schedules;
        }

        // Station Type Change Handler
     // Station Type Change Handler
        function onStationTypeChange() {
            // ✅ เพิ่มการตรวจสอบก่อน
            const radioChecked = document.querySelector('input[name="stationType"]:checked');
            
            if (!radioChecked) {
                console.warn('⚠️ No station type selected yet');
                return;
            }
            
            const stationType = radioChecked.value;
            console.log('📋 Station type changed to:', stationType);
            
            if (stationType === 'simple') {
                // แสดง Simple Station Fields
                const simpleFields = document.getElementById('simpleStationFields');
                const withRoomsFields = document.getElementById('withRoomsStationFields');
                
                if (simpleFields) simpleFields.style.display = 'block';
                if (withRoomsFields) withRoomsFields.style.display = 'none';
                
                // ✅ ล้าง staff_schedules ให้เป็น array ว่าง
                wizardData.staff_schedules = [];
                wizardData.default_wait_time = null;
                wizardData.default_service_time = null;
                wizardData.staff_count = 0;
                
                // ✅ อัพเดท UI ให้แสดง placeholder
                updateStaffScheduleUI();
                
            } else if (stationType === 'with_rooms') {
                // แสดง With Rooms Fields
                const simpleFields = document.getElementById('simpleStationFields');
                const withRoomsFields = document.getElementById('withRoomsStationFields');
                
                if (simpleFields) simpleFields.style.display = 'none';
                if (withRoomsFields) withRoomsFields.style.display = 'block';
            }
        }

        async function onDepartmentChange() {
            const deptId = document.getElementById('departmentSelect').value;
            if (!deptId) {
                document.getElementById('selectedDepartment').style.display = 'none';
                return;
            }

            const deptName = document.getElementById('departmentSelect').options[document.getElementById('departmentSelect').selectedIndex].text;
            wizardData.department_id = deptId;
            wizardData.departmentName = deptName;
            document.getElementById('deptName').textContent = deptName;
            document.getElementById('selectedDepartment').style.display = 'block';
            
            // The procedures list is on the same tab (Tab 1), so we load it here
            await loadProcedures(deptId);
        }

        async function loadDepartments() {
            console.log('📥 Loading departments from API...');
            
            // ✅ เช็ค element มีอยู่ไหม
            const select = document.getElementById('departmentSelect');
            if (!select) {
                console.error('❌ departmentSelect element not found!');
                console.log('📋 Available elements:', {
                    'wizardForm': !!document.getElementById('wizardForm'),
                    'wizard-tab-1': !!document.getElementById('wizard-tab-1'),
                    'createStationWizard': !!document.getElementById('createStationWizard')
                });
                return;
            }
            
            try {
                console.log('🔗 Fetching:', `${API_BASE_URL}/get_departments.php`);
                const response = await fetch(`${API_BASE_URL}/get_departments.php`);
                
                if (!response.ok) {
                    console.error(`❌ HTTP Error: ${response.status}`);
                    alert(`API Error: ${response.status}`);
                    return;
                }
                
                const result = await response.json();
                console.log('📊 API Response:', result);
                
                if (result.success && result.data && result.data.length > 0) {
                    departments = result.data;
                    select.innerHTML = '<option value="">-- เลือกแผนก --</option>';
                    
                    result.data.forEach(dept => {
                        const option = document.createElement('option');
                        option.value = dept.department_id;
                        option.textContent = dept.department_name;
                        select.appendChild(option);
                    });
                    
                    console.log(`✅ Loaded ${result.data.length} departments into dropdown`);
                } else {
                    console.warn('⚠️ No departments data received');
                    alert('ไม่สามารถโหลดแผนกได้: ไม่มีข้อมูล');
                }
            } catch (error) {
                console.error('❌ Fetch Error:', error.message);
                alert('ไม่สามารถโหลดแผนกได้: ' + error.message);
            }
        }

        async function loadProcedures(departmentId) {
            try {
                const response = await fetch(`${API_BASE_URL}/get_procedures.php?department_id=${departmentId}`);
                const result = await response.json();
                if (result.success && result.data) {
                    allProcedures = result.data;
                    wizardData.procedures = {};
                    
                    const container = document.getElementById('proceduresList');
                    container.innerHTML = result.data.map(proc => {
                        wizardData.procedures[proc.procedure_id] = { 
                            id: proc.procedure_id,
                            name: proc.procedure_name || proc.procedure_name,
                            duration: 30, 
                            wait: 15 
                        };
                        return `
                            <div style="background: rgba(255, 255, 255, 0.5); padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #0047AB;">
                                <div style="font-weight: 600; margin-bottom: 8px;">${proc.procedure_name || proc.procedure_name}</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div>
                                        <label style="font-size: 11px; color: var(--text-light); display: block; margin-bottom: 4px;">ระยะเวลา (นาที)</label>
                                        <input type="number" class="form-control" min="5" max="480" value="30" onchange="wizardData.procedures[${proc.procedure_id}].duration = parseInt(this.value)" style="font-size: 13px; padding: 8px;">
                                    </div>
                                    <div>
                                        <label style="font-size: 11px; color: var(--text-light); display: block; margin-bottom: 4px;">เวลารอ (นาที)</label>
                                        <input type="number" class="form-control" min="0" max="480" value="15" onchange="wizardData.procedures[${proc.procedure_id}].wait = parseInt(this.value)" style="font-size: 13px; padding: 8px;">
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }

        // STAFF FUNCTIONS
// STAFF FUNCTIONS
function addStaffRow(data = null) {
    const id = Date.now();
    const container = document.getElementById('staffList');
    const row = document.createElement('div');
    row.className = 'row-item';
    row.dataset.staffId = id;
    row.innerHTML = `
        <div class="row-header">
            <input type="text" class="form-control staff-id" placeholder="รหัสพนักงาน (เช่น STAFF001)" value="${data?.staff_id || ''}" style="flex: 1;">
            <input type="text" class="form-control staff-name" placeholder="ชื่อพนักงาน" value="${data?.name || ''}" style="flex: 2;">
            <input type="text" class="form-control staff-type" placeholder="ตำแหน่ง (เช่น พยาบาล)" value="${data?.staff_type || 'Staff'}" style="flex: 1.5;">
            <button type="button" class="btn btn-danger" onclick="removeStaff(${id})" style="padding: 8px 12px;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="row-details">
            <div>
                <label style="font-size: 10px; color: var(--text-light);">เริ่มงาน</label>
                <input type="time" class="form-control staff-work-start" value="${data?.work_start_time || '08:00'}" style="padding: 8px;">
            </div>
            <div>
                <label style="font-size: 10px; color: var(--text-light);">พักเริ่ม</label>
                <input type="time" class="form-control staff-break-start" value="${data?.break_start_time || '12:00'}" style="padding: 8px;">
            </div>
            <div>
                <label style="font-size: 10px; color: var(--text-light);">พักจบ</label>
                <input type="time" class="form-control staff-break-end" value="${data?.break_end_time || '13:00'}" style="padding: 8px;">
            </div>
            <div>
                <label style="font-size: 10px; color: var(--text-light);">เลิกงาน</label>
                <input type="time" class="form-control staff-work-end" value="${data?.work_end_time || '17:00'}" style="padding: 8px;">
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
            <input type="checkbox" class="staff-active" ${data?.is_active !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
            <label style="margin: 0; cursor: pointer; font-size: 13px;">ทำงาน</label>
        </div>
    `;
    container.appendChild(row);
}
        function removeStaff(id) {
            const el = document.querySelector(`[data-staff-id="${id}"]`);
            if (el) el.remove();
        }

       function collectStaffData() {
    wizardData.staff = [];
    document.querySelectorAll('[data-staff-id]').forEach(row => {
        const staffId = row.querySelector('.staff-id').value.trim();
        const name = row.querySelector('.staff-name').value.trim();
        
        // ✅ บันทึก staff_id แทนตำแหน่ง
        if (staffId && name) {
            wizardData.staff.push({
                staff_id: staffId,  // ← ✅ บันทึก ID
                name: name,
                staff_type: row.querySelector('.staff-type').value.trim() || 'Staff',
                work_start_time: row.querySelector('.staff-work-start').value,
                work_end_time: row.querySelector('.staff-work-end').value,
                break_start_time: row.querySelector('.staff-break-start').value,
                break_end_time: row.querySelector('.staff-break-end').value,
                is_active: row.querySelector('.staff-active').checked ? 1 : 0
            });
        }
    });
}

        // DOCTOR FUNCTIONS
function addDoctorRow(data = null) {
    const id = Date.now();
    const container = document.getElementById('doctorList');
    const row = document.createElement('div');
    row.className = 'row-item';
    row.dataset.doctorId = id;
    row.innerHTML = `
        <div class="row-header">
            <input type="text" class="form-control doctor-id" placeholder="รหัสแพทย์ (เช่น DOC001)" value="${data?.doctor_id || ''}" style="flex: 1;">
            <input type="text" class="form-control doctor-name" placeholder="ชื่อแพทย์" value="${data?.name || ''}" style="flex: 2;">
            <input type="text" class="form-control doctor-specialty" placeholder="เชี่ยวชาญด้าน" value="${data?.specialty || ''}" style="flex: 2;">
            <button type="button" class="btn btn-danger" onclick="removeDoctor(${id})" style="padding: 8px 12px;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="row-details">
            <div>
                <label style="font-size: 10px; color: var(--text-light);">เริ่มงาน</label>
                <input type="time" class="form-control doctor-work-start" value="${data?.work_start_time || '08:00'}" style="padding: 8px;">
            </div>
            <div>
                <label style="font-size: 10px; color: var(--text-light);">พักเริ่ม</label>
                <input type="time" class="form-control doctor-break-start" value="${data?.break_start_time || '12:00'}" style="padding: 8px;">
            </div>
            <div>
                <label style="font-size: 10px; color: var(--text-light);">พักจบ</label>
                <input type="time" class="form-control doctor-break-end" value="${data?.break_end_time || '13:00'}" style="padding: 8px;">
            </div>
            <div>
                <label style="font-size: 10px; color: var(--text-light);">เลิกงาน</label>
                <input type="time" class="form-control doctor-work-end" value="${data?.work_end_time || '17:00'}" style="padding: 8px;">
            </div>
        </div>
    `;
    container.appendChild(row);
}

        function removeDoctor(id) {
            const el = document.querySelector(`[data-doctor-id="${id}"]`);
            if (el) el.remove();
        }

        function collectDoctorData() {
    wizardData.doctors = [];
    document.querySelectorAll('[data-doctor-id]').forEach(row => {
        const doctorId = row.querySelector('.doctor-id').value.trim();
        const name = row.querySelector('.doctor-name').value.trim();
        if (name) {
            wizardData.doctors.push({
                doctor_id: doctorId,  // ✅ เพิ่มบรรทัดนี้
                name: name,
                specialty: row.querySelector('.doctor-specialty').value.trim(),
                work_start_time: row.querySelector('.doctor-work-start').value,
                work_end_time: row.querySelector('.doctor-work-end').value,
                break_start_time: row.querySelector('.doctor-break-start').value,
                break_end_time: row.querySelector('.doctor-break-end').value
            });
        }
    });
}

        // ROOM FUNCTIONS
        function generateRooms() {
            const count = parseInt(document.getElementById('roomCount').value) || 1;
            wizardData.room_count = count;
            const container = document.getElementById('roomsContainer');
            container.innerHTML = '';

            for (let i = 1; i <= count; i++) {
                const roomId = `room-${i}`;
                if (!wizardData.rooms[roomId]) {
                    wizardData.rooms[roomId] = { 
                        equipment: [], 
                        procedures: [],
                        all_procedures: false 
                    };
                }

                const group = document.createElement('div');
                group.className = 'room-card';
                group.setAttribute('data-room-id', roomId);
                group.innerHTML = `
                    <div class="room-header">
                        <div class="room-info">
                            <div style="font-size: 14px; margin-bottom: 3px;">🚪 ห้อง ${i}</div>
                            <div style="font-size: 11px; color: var(--text-light);">
                                🛠️ ${wizardData.rooms[roomId].equipment.length} เครื่องมือ
                            </div>
                            <div id="room-procedures-${roomId}" style="font-size: 11px; color: var(--text-light); margin-top: 5px;"></div>
                        </div>
                        <button type="button" class="btn" onclick="openRoomDetailsModal('${roomId}')" style="background: rgba(100,150,255,0.3); padding: 8px 15px;">
                            <i class="fas fa-cog"></i> ตั้งค่า
                        </button>
                    </div>
                `;
                container.appendChild(group);
            }
        }

        function openRoomDetailsModal(roomId) {
            currentRoomId = roomId;
            const roomNum = roomId.split('-')[1];
            document.getElementById('roomDetailsTitle').textContent = `ตั้งค่าห้อง ${roomNum}`;
            document.getElementById('roomDetailsModal').style.display = 'block';
            currentRoomTab = 1;
            switchRoomTab(1);
            loadRoomDetails(roomId);
        }

        function closeRoomDetailsModal() {
            document.getElementById('roomDetailsModal').style.display = 'none';
            currentRoomId = null;
        }

        function switchRoomTab(tab) {
            document.querySelectorAll('[id^="room-tab-"]').forEach((el, idx) => {
                if (el.id.startsWith('room-tab-btn-')) return;
                el.style.display = 'none';
            });
            document.querySelectorAll('[id^="room-tab-btn-"]').forEach(el => el.classList.remove('active'));
            
            const contentEl = document.getElementById(`room-tab-${tab}`);
            if (contentEl) contentEl.style.display = 'block';
            const btnEl = document.getElementById(`room-tab-btn-${tab}`);
            if (btnEl) btnEl.classList.add('active');
            
            currentRoomTab = tab;
        }

       function loadRoomDetails(roomId) {
    const room = wizardData.rooms[roomId] || { equipment: [], procedures: [], all_procedures: false };
    
    // Load equipment
    const equipContainer = document.getElementById('roomEquipmentList');
    if (equipContainer) {
        equipContainer.innerHTML = '';
        
        if (room.equipment && room.equipment.length > 0) {
            room.equipment.forEach((eq, idx) => {
                const row = document.createElement('div');
                row.className = 'equipment-item';
                row.setAttribute('data-eq-idx', idx);
                row.innerHTML = `
                    <input type="text" class="form-control eq-name" placeholder="ชื่อเครื่องมือ" value="${eq.name || ''}" style="padding: 8px;">
                    <input type="number" class="form-control eq-quantity" min="1" value="${eq.quantity || 1}" style="padding: 8px;">
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap;">
                        <input type="checkbox" ${eq.use_staff ? 'checked' : ''} class="eq-use-staff" style="width: 18px; height: 18px; cursor: pointer;">
                        <span style="font-size: 12px;">ต้องใช้พนักงาน</span>
                    </label>
                    <button type="button" class="btn btn-danger" onclick="deleteEquipmentRow(${idx})" style="padding: 6px 12px; font-size: 12px;">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                equipContainer.appendChild(row);
            });
        }
    }

    // Load procedures - สร้าง allProcedures checkbox ถ้ายังไม่มี
    const allProcContainer = document.getElementById('allProceduresCheckboxContainer');
    const proceduresContainer = document.getElementById('roomProceduresContainer');
    const procListContainer = document.getElementById('roomProceduresList');
    
    if (!allProcContainer || !proceduresContainer || !procListContainer) {
        console.error('Required containers not found for room details');
        return;
    }

    // สร้างหรืออัพเดต allProcedures checkbox
    allProcContainer.innerHTML = `
      
        
        <!-- ปุ่มเลือกทั้งหมดและล้างทั้งหมด -->
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <button type="button" class="btn btn-success" onclick="selectAllProcedures()" style="padding: 8px 12px; font-size: 12px;">
                <i class="fas fa-check-square"></i> เลือกทั้งหมด
            </button>
            <button type="button" class="btn btn-warning" onclick="clearAllProcedures()" style="padding: 8px 12px; font-size: 12px;">
                <i class="fas fa-times-circle"></i> ล้างทั้งหมด
            </button>
        </div>
    `;

    // แสดง/ซ่อน procedures list ตามค่า all_procedures
    proceduresContainer.style.display = room.all_procedures ? 'none' : 'block';

    // โหลดรายการ procedures ถ้าไม่ใช่ all_procedures
    if (!room.all_procedures && allProcedures.length > 0) {
        procListContainer.innerHTML = allProcedures.map(proc => {
            const isSelected = room.procedures && room.procedures.includes(proc.procedure_id);
            return `
                <label class="procedure-checkbox">
                    <input type="checkbox" class="room-procedure" value="${proc.procedure_id}" ${isSelected ? 'checked' : ''}>
                    <span>${proc.procedure_name || proc.procedure_name}</span>
                </label>
            `;
        }).join('');
    } else {
        procListContainer.innerHTML = '';
    }
}
        function addEquipmentRow(roomId) {
            if (!wizardData.rooms[roomId]) {
                wizardData.rooms[roomId] = { equipment: [], procedures: [], all_procedures: false };
            }
            const idx = wizardData.rooms[roomId].equipment.length;
            wizardData.rooms[roomId].equipment.push({ name: '', quantity: 1, use_staff: false });
            
            const equipContainer = document.getElementById('roomEquipmentList');
            const row = document.createElement('div');
            row.className = 'equipment-item';
            row.setAttribute('data-eq-idx', idx);
            row.innerHTML = `
                <input type="text" class="form-control eq-name" placeholder="ชื่อเครื่องมือ" value="" style="padding: 8px;">
                <input type="number" class="form-control eq-quantity" min="1" value="1" style="padding: 8px;">
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap;">
                    <input type="checkbox" class="eq-use-staff" style="width: 18px; height: 18px; cursor: pointer;">
                    <span style="font-size: 12px;">ต้องใช้พนักงาน</span>
                </label>
                <button type="button" class="btn btn-danger" onclick="deleteEquipmentRow(${idx})" style="padding: 6px 12px; font-size: 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            equipContainer.appendChild(row);
        }

        function deleteEquipmentRow(idx) {
            const el = document.querySelector(`[data-eq-idx="${idx}"]`);
            if (el) el.remove();
        }

        function addProcedureRow(roomId) {
            if (!wizardData.rooms[roomId]) {
                wizardData.rooms[roomId] = { equipment: [], procedures: [], all_procedures: false };
            }
            
            // Show a selection modal for procedures
            openProcedureSelectionModal(roomId);
        }

        function openProcedureSelectionModal(roomId) {
            // Create a simple modal to select procedures
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            
            const content = document.createElement('div');
            content.className = 'modal-content';
            content.style.maxWidth = '500px';
            content.innerHTML = `
                <div class="modal-header">
                    <h2 class="modal-title">เลือกหัตถการเพื่อเพิ่มในห้อง</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div style="max-height: 400px; overflow-y: auto; padding: 20px;">
                    ${allProcedures.length > 0 ? allProcedures.map(proc => `
                        <label class="procedure-checkbox" style="display: block; margin-bottom: 10px; cursor: pointer;">
                            <input type="checkbox" class="new-procedure-select" value="${proc.procedure_id}" data-name="${proc.procedure_name || proc.procedure_name}">
                            <span style="margin-left: 8px;">${proc.procedure_name || proc.procedure_name}</span>
                        </label>
                    `).join('') : '<p style="color: #666;">ยังไม่มีหัตถการที่สามารถใช้ได้</p>'}
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; padding: 15px; border-top: 1px solid var(--glass-border);">
                    <button class="btn btn-danger" onclick="this.closest('.modal').remove()">ยกเลิก</button>
                    <button class="btn btn-success" onclick="confirmAddProcedures(${roomId})">เพิ่มหัตถการ</button>
                </div>
            `;
            
            modal.appendChild(content);
            document.body.appendChild(modal);
            modal.style.zIndex = '1003';
        }

        function confirmAddProcedures(roomId) {
            const checkboxes = document.querySelectorAll('.new-procedure-select:checked');
            const procListContainer = document.getElementById('roomProceduresList');
            
            if (checkboxes.length === 0) {
                alert('กรุณาเลือกหัตถการอย่างน้อยหนึ่งรายการ');
                return;
            }
            
            checkboxes.forEach(checkbox => {
                const procId = parseInt(checkbox.value);
                if (!wizardData.rooms[roomId].procedures.includes(procId)) {
                    wizardData.rooms[roomId].procedures.push(procId);
                }
            });
            
            // Close the modal
            document.querySelector('.modal').remove();
            
            // Reload the procedures list display
            loadRoomDetails(roomId);
        }

        function toggleAllProcedures() {
    const allProceduresCheckbox = document.getElementById('allProcedures');
    const proceduresContainer = document.getElementById('roomProceduresContainer');
    
    if (!allProceduresCheckbox || !proceduresContainer) {
        console.error('Required elements not found for toggleAllProcedures');
        return;
    }
    
    const isAll = allProceduresCheckbox.checked;
    proceduresContainer.style.display = isAll ? 'none' : 'block';
    
    // อัพเดตข้อมูลใน wizardData
    if (currentRoomId && wizardData.rooms[currentRoomId]) {
        wizardData.rooms[currentRoomId].all_procedures = isAll;
        
        if (isAll) {
            // ถ้าเลือกทั้งหมด ให้ล้างรายการ procedures เจาะจง
            wizardData.rooms[currentRoomId].procedures = [];
            
            // ล้างการเลือกใน checkbox ทั้งหมด
            document.querySelectorAll('.room-procedure').forEach(checkbox => {
                checkbox.checked = false;
            });
        }
    }
    
    showNotification(isAll ? 'เลือกทำหัตถการทั้งหมดได้' : 'ยกเลิกการทำหัตถการทั้งหมด', 'info');
}

        function saveRoomDetails() {
    if (!currentRoomId) return;
    
    const room = wizardData.rooms[currentRoomId] || { equipment: [], procedures: [], all_procedures: false };
    
    // Save equipment
    room.equipment = [];
    document.querySelectorAll('[data-eq-idx]').forEach(row => {
        const name = row.querySelector('.eq-name').value.trim();
        if (name) {
            room.equipment.push({
                name: name,
                quantity: parseInt(row.querySelector('.eq-quantity').value) || 1,
                use_staff: row.querySelector('.eq-use-staff').checked
            });
        }
    });

    // Save procedures - แก้ไขส่วนนี้
    const allProceduresCheckbox = document.getElementById('allProcedures');
    if (allProceduresCheckbox) {
        room.all_procedures = allProceduresCheckbox.checked;
    } else {
        room.all_procedures = false; // Default value ถ้าไม่พบ checkbox
    }
    
    if (!room.all_procedures) {
        room.procedures = [];
        document.querySelectorAll('.room-procedure:checked').forEach(checkbox => {
            room.procedures.push(parseInt(checkbox.value));
        });
    } else {
        room.procedures = []; // ถ้าเลือกทั้งหมด ให้ล้างรายการเจาะจง
    }

    // Assign back to wizardData
    wizardData.rooms[currentRoomId] = room;
    
    // Update room card UI
    const roomCard = document.querySelector(`[data-room-id="${currentRoomId}"]`);
    if (roomCard) {
        const roomNum = currentRoomId.split('-')[1];
        const roomInfo = roomCard.querySelector('.room-info');
        if (roomInfo) {
            // สร้าง text สำหรับหัตถการ
            let procedureText = '';
            if (room.all_procedures) {
                procedureText = '⚕️ ทำได้ทั้งหมด';
            } else if (room.procedures && room.procedures.length > 0) {
                const procNames = room.procedures.map(procId => {
                    const proc = allProcedures.find(p => p.procedure_id == procId);
                    return proc ? (proc.procedure_name || proc.procedure_name) : 'Unknown';
                }).join(', ');
                procedureText = `⚕️ ${procNames.substring(0, 50)}${procNames.length > 50 ? '...' : ''}`;
            } else {
                procedureText = '⚕️ ไม่ได้เลือกหัตถการ';
            }

            roomInfo.innerHTML = `
                <div style="font-size: 14px; margin-bottom: 3px;">🚪 ห้อง ${roomNum}</div>
                <div style="font-size: 11px; color: var(--text-light);">
                    🛠️ ${room.equipment.length} เครื่องมือ
                </div>
                <div style="font-size: 11px; color: var(--text-light); margin-top: 5px;">
                    ${procedureText}
                </div>
            `;
        }
    }
    
    console.log('Saved room data:', currentRoomId, room);
    showNotification('บันทึกการตั้งค่าห้องเรียบร้อยแล้ว', 'success');
    closeRoomDetailsModal();
}

        function saveRoomEquipment() {
            // This is handled by individual room details modal
        }

        // SUBMIT FUNCTION
    // ✅ FIXED: submitWizard() function
// แก้: ใช้ buildApiUrl() ให้ถูกต้อง

async function submitWizard(event) {
    event.preventDefault();
    if (!validateWizardTab(currentWizardTab)) return;
    saveWizardTabData(currentWizardTab);

    let stationData = {
        station_name: wizardData.station_name,
        station_type: wizardData.station_type,
        floor: parseInt(wizardData.floor)
    };

    if (wizardData.station_type === 'simple') {
        // Simple station data
        stationData.default_wait_time = wizardData.default_wait_time;
        stationData.default_service_time = wizardData.default_service_time;
        stationData.staff_count = wizardData.staff_count;
        stationData.staff_schedules = wizardData.staff_schedules;
        stationData.department_id = null;
        stationData.room_count = 0;
    } else if (wizardData.station_type === 'with_rooms') {
        // With rooms station data
        const room_settings = {};
        Object.keys(wizardData.rooms).forEach(roomId => {
            const room = wizardData.rooms[roomId];
            room_settings[roomId] = {
                equipment: room.equipment || [],
                procedures: room.all_procedures ? 'all' : (room.procedures || []),
                staff: wizardData.staff || [],
                doctor: wizardData.doctors.length > 0 ? wizardData.doctors[0] : null
            };
        });

        stationData.department_id = parseInt(wizardData.department_id);
        stationData.room_count = wizardData.room_count;
        stationData.procedure_ids = Object.keys(wizardData.procedures).map(id => parseInt(id));
        stationData.staff = wizardData.staff;
        stationData.doctors = wizardData.doctors;
        stationData.rooms = wizardData.rooms;
        stationData.room_settings = room_settings;
    }

    console.log('Submitting station data:', stationData);

    try {
        // ✅ FIX: ใช้ buildApiUrl() ให้ถูกต้อง
        const apiUrl = '/hospital/api/create_station.php';
        console.log('📡 Calling API:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stationData)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        // ✅ เช็ค content-type
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);

        if (!response.ok) {
            // ✅ ดู error response
            const errorText = await response.text();
            console.error('❌ HTTP Error Response:', response.status, errorText);
            
            // ✅ ลองแปลง JSON ถ้าเป็น
            try {
                const errorJson = JSON.parse(errorText);
                console.error('❌ Error JSON:', errorJson);
                alert(`❌ API Error (${response.status}): ${errorJson.message || errorText.substring(0, 100)}`);
            } catch (e) {
                // ไม่ใช่ JSON → แสดง HTML ที่ได้มา
                console.error('❌ Error (non-JSON HTML):', errorText.substring(0, 200));
                alert(`❌ API Error (${response.status}): ${errorText.substring(0, 100)}`);
            }
            return;
        }

        // ✅ Parse JSON response
        const result = await response.json();
        console.log('✅ API Response:', result);

        if (result.success) {
            const createdFloor = stationData.floor;
            
            // ✅ แสดง success message แบบ Swal
            Swal.fire({
                title: '✅ สร้างสถานีแพทย์สำเร็จ!',
                html: `<strong>รหัส:</strong> ${result.data.station_code}<br><br><small>✅ พร้อมสำหรับสถานีต่อไป...</small>`,
                icon: 'success',
                confirmButtonText: 'เพิ่มสถานีต่อไป',
                showCancelButton: true,
                cancelButtonText: 'ดูรายการ',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.isConfirmed) {
                    // ✅ ปุ่ม "เพิ่มสถานีต่อไป" - อยู่หน้าเดิมเปิด modal ใหม่
                    closeWizard();
                    
                    setTimeout(() => {
                        // ✅ Reset form เต็มๆ
                        const wizardForm = document.getElementById('wizardForm');
                        if (wizardForm) wizardForm.reset();
                        
                        document.querySelectorAll('#wizardForm input, #wizardForm select, #wizardForm textarea').forEach(el => {
                            if (el.type === 'radio' || el.type === 'checkbox') {
                                el.checked = false;
                            } else {
                                el.value = '';
                            }
                        });
                        
                        currentWizardTab = 1;
                        document.querySelectorAll('.wizard-step').forEach(el => el.style.display = 'none');
                        const step1 = document.getElementById('wizard-tab-1');
                        if (step1) step1.style.display = 'block';
                        
                        document.querySelectorAll('.tab-btn').forEach((el, idx) => {
                            el.classList.toggle('active', idx === 0);
                        });
                        
                        updateWizardDisplay();
                        console.log('✅ Form reset - opening wizard again...');
                        
                        // ✅ เปิด modal ใหม่ floor เดิม
                        openWizard(createdFloor);
                    }, 300);
                } else {
                    // ✅ ปุ่ม "ดูรายการ" - ปิด modal
                    closeWizard();
                    loadAllFloorsEnhanced();
                }
            });
            
            // ✅ Update data background
            loadAllFloorsEnhanced();
            loadStationsByFloor(createdFloor);
            console.log('✅ Station created successfully');
            
        } else {
            console.log('API returned success: false');
            const errorMsg = result.errors && result.errors.length > 0 
                ? result.errors.join('\n') 
                : 'Unknown error';
            alert(`❌ เกิดข้อผิดพลาด: ${result.message}\n\nรายละเอียด:\n${errorMsg}`);
        }

    } catch (error) {
        console.error('❌ Fetch Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        alert('❌ Error: ' + error.message);
    }
}

        // เพิ่ม Function ลบ Station ลงในไฟล์ main.php (ใน tag <script>)

async function deleteStation(stationId) {
    // Confirm before delete
    const result = await Swal.fire({
        title: 'ต้องการลบ Station นี้?',
        text: 'การลบจะไม่สามารถกู้คืนได้ และจะลบข้อมูลทั้งหมดที่เกี่ยวข้อง',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#A93226',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'ลบใช่แล้ว',
        cancelButtonText: 'ยกเลิก'
    });

    if (!result.isConfirmed) {
        return;
    }

    try {
        // แก้ไข URL ให้ถูกต้อง - เอา / ซ้ำออก
        const apiUrl = `${API_BASE_URL.replace(/\/$/, '')}/delete_station.php`;
        console.log('Delete URL:', apiUrl, 'Station ID:', stationId);
        
        // เปลี่ยนจาก DELETE เป็น POST เพราะบางเซิร์ฟเวอร์อาจมีปัญหา
        const response = await fetch(apiUrl, {
            method: 'POST',  // เปลี่ยนจาก DELETE เป็น POST
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ station_id: stationId })
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Delete result:', result);

        if (result.success) {
            await Swal.fire({
                title: 'ลบสำเร็จ!',
                html: `<div style="text-align: left; font-size: 14px;">
                    <strong>${result.data.station_name}</strong> (${result.data.station_code})<br>
                    ลบแล้ว ${result.data.rooms_deleted} ห้อง<br><br>
                    <small style="color: #495057;">ข้อมูลทั้งหมดได้ถูกลบออกจากระบบ</small>
                </div>`,
                icon: 'success',
                confirmButtonText: 'ตกลง'
            });

            // Reload data
            loadAllFloorsEnhanced();  // เปลี่ยนจาก loadAllFloorsOld()
            for (let i = 1; i <= 5; i++) {
                await loadStationsByFloor(i);
            }
        } else {
            await Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: result.message || 'ไม่สามารถลบ Station ได้',
                icon: 'error',
                confirmButtonText: 'ตกลง'
            });
        }
    } catch (error) {
        console.error('Error deleting station:', error);
        await Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: 'Error: ' + error.message,
            icon: 'error',
            confirmButtonText: 'ตกลง'
        });
    }
}


// ✅ EDIT STATION FUNCTIONS
// ============================================
function openEditStationModal(stationId, stationName) {
    document.getElementById('editStationIdInput').value = stationId;
    document.getElementById('editStationNameInput').value = stationName;
    document.getElementById('editStationModal').style.display = 'block';
    
    // Focus ที่ input
    setTimeout(() => {
        document.getElementById('editStationNameInput').focus();
        document.getElementById('editStationNameInput').select();
    }, 100);
    
    console.log(`📝 Edit Station modal opened for ID: ${stationId}`);
}

function closeEditStationModal() {
    document.getElementById('editStationModal').style.display = 'none';
    document.getElementById('editStationNameInput').value = '';
    document.getElementById('editStationIdInput').value = '';
    console.log('❌ Edit Station modal closed');
}

async function saveEditStation() {
    const stationId = document.getElementById('editStationIdInput').value;
    const newName = document.getElementById('editStationNameInput').value.trim();
    
    if (!newName) {
        alert('⚠️ กรุณากรอกชื่อสถานี');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/update_station.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                station_id: stationId,
                station_name: newName
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📡 API Response:', result);
        
        if (result.success) {
            await Swal.fire({
                title: '✅ บันทึกสำเร็จ!',
                text: `อัปเดตชื่อสถานีเป็น "${newName}" แล้ว`,
                icon: 'success',
                confirmButtonText: 'ตกลง'
            });
            
            closeEditStationModal();
            
            // ✅ Refresh ข้อมูล
            loadAllFloorsEnhancedNew();
            console.log('✅ Data refreshed');
        } else {
            alert(`❌ เกิดข้อผิดพลาด: ${result.message}`);
        }
    } catch (error) {
        console.error('❌ Error saving station:', error);
        alert('❌ Error: ' + error.message);
    }
}


// FIX 2: loadStationsByFloor()
// ============================================
async function loadStationsByFloor(floor) {
    console.log(`🔄 Loading stations for Floor ${floor}`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/get_stations.php`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();

        if (!result.success) {
            const container = document.getElementById(`floor${floor}-stations`);
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-light);">
                        <div>❌ ไม่สามารถโหลดข้อมูล</div>
                    </div>
                `;
            }
            return;
        }

        // ✅ CORRECT: result.data is the array (API returns stations directly in result.data)
        let allStations = [];
        if (result.data && Array.isArray(result.data)) {
            allStations = result.data;
            console.log("✅ Loaded", allStations.length, "stations");
        } else if (result.data && Array.isArray(result.data.stations)) {
            allStations = result.data.stations;
            console.log("✅ Loaded", allStations.length, "stations");
        } else {
            console.error("❌ Could not find stations array");
            return;
        }

        // Filter by floor
        const stations = allStations.filter(s => parseInt(s.floor) === floor);
        const container = document.getElementById(`floor${floor}-stations`);
        
        if (!container) {
            console.error(`Container #floor${floor}-stations not found`);
            return;
        }

        if (stations.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-light);">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                    <div>ยังไม่มีสเตชั่นบน Floor ${floor}</div>
                </div>
            `;
            return;
        }

        // Build station cards
        let stationsHTML = '';
        for (const station of stations) {
            try {
                const statsResponse = await fetch(
                    `${API_BASE_URL}/get_station_stats.php?station_id=${station.station_id}`
                );
                const statsResult = await statsResponse.json();
                
                let stats = {
                    total_patients: 0,
                    completed_patients: 0,
                    pending_patients: 0,
                    room_count: station.room_count || 0,
                    staff_count: station.staff_count || 0,
                    doctor_count: station.doctor_count || 0
                };

                if (statsResult.success) {
                    stats = statsResult.data;
                }

                const stationType = station.station_type === 'simple' ? 'Simple' : 'With Rooms';
                const cardHTML = createStationCard(station, stats, stationType);
                stationsHTML += cardHTML;

            } catch (error) {
                console.error(`Error loading stats for station ${station.station_id}:`, error);
                const fallbackHTML = createFallbackCard(station);
                stationsHTML += fallbackHTML;
            }
        }

        container.innerHTML = stationsHTML;
        console.log(`✅ Floor ${floor} updated with ${stations.length} stations`);

    } catch (error) {
        console.error(`❌ Error loading floor ${floor}:`, error);
        const container = document.getElementById(`floor${floor}-stations`);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #A93226;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <div>เกิดข้อผิดพลาด</div>
                    <small style="color: #adb5bd;">${error.message}</small>
                </div>
            `;
        }
    }
}


// ฟังก์ชันสร้าง Card
// FIX: createStationCard() - เพิ่ม data attributes
function createStationCard(station, stats, stationType) {
    const cardClass = `station-card-compact`;
    const totalPatients = stats.total_patients || 0;
    const inProgressPatients = stats.in_progress_patients || 0;
    const pendingPatients = stats.pending_patients || 0;

    return `
        <div class="${cardClass}" 
             data-station-id="${station.station_id}"
             data-station-name="${station.station_name}"
             data-station-code="${station.station_code}"
             data-floor="${station.floor}"
             onclick="openStationDetail(${station.station_id})">
            <button 
                class="btn-edit-station" 
                onclick="event.stopPropagation(); openEditStationModal(${station.station_id}, '${station.station_name}')"
                title="แก้ไขชื่อสถานี"
            >
                <i class="fas fa-edit"></i>
            </button>
            <button 
                class="btn-delete-station" 
                onclick="event.stopPropagation(); deleteStation(${station.station_id})"
                title="ลบ Station"
            >
                <i class="fas fa-trash"></i>
            </button>
            
            <div class="card-header">
                <div class="station-info">
                    <div class="station-name">${station.station_name}</div>
                </div>
            </div>

            <div class="card-stats-compact">
                <div class="stat-col">
                    <div class="stat-value total">${totalPatients}</div>
                    <div class="stat-label">ทั้งหมด</div>
                </div>
                <div class="stat-col">
                    <div class="stat-value progress">${inProgressPatients}</div>
                    <div class="stat-label">ทำอยู่</div>
                </div>
                <div class="stat-col">
                    <div class="stat-value waiting">${pendingPatients}</div>
                    <div class="stat-label">รอทำ</div>
                </div>
            </div>
        </div>
    `;
}

// Fallback Card
function createFallbackCard(station) {
    
    const cardClass = `station-card-compact loading`;
    return `
        <div class="${cardClass}">
            <button 
                class="btn-delete-station" 
                onclick="event.stopPropagation(); deleteStation(${station.station_id})"
            >
                <i class="fas fa-trash"></i>
            </button>
            <div class="card-header">
                <div class="station-info">
                    <div class="station-name">${station.station_name}</div>
                    <div class="station-meta">
                        <span>${station.station_code}</span>
                    </div>
                </div>
            </div>
            <div style="text-align: center; padding: 12px 8px; font-size: 11px; color: #999;">
                ⏳ โหลด...
            </div>
        </div>
    `;
}

// CSS สำหรับ Station Card
const stationCardStyle = document.createElement('style');

stationCardStyle.textContent = `
  .station-card-compact {
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border-radius: 16px;
        box-shadow: 
            0 4px 6px rgba(0, 0, 0, 0.07),
            0 1px 3px rgba(0, 0, 0, 0.06);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        position: relative;
        border: 1px solid rgba(0, 86, 179, 0.1);
        border-left: 5px solid #0056B3;
        display: flex;
        flex-direction: column;
        backdrop-filter: blur(10px);
        flex: 0 1 auto;
        min-width: 220px;
        max-width: 280px;
    }

    .station-card-compact:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 
            0 12px 24px rgba(0, 86, 179, 0.15),
            0 6px 12px rgba(0, 0, 0, 0.1);
        border-left-width: 6px;
    }

    /* สไตล์พิเศษสำหรับ Station 83 */
    .station-card-compact.special-station {
        background: linear-gradient(135deg, #ffe8e8 0%, #fdf5f5 100%);
        border: 1px solid rgba(220, 53, 69, 0.2);
        border-left: 5px solid #dc3545;
    }

    .station-card-compact.special-station:hover {
        box-shadow: 
            0 12px 24px rgba(220, 53, 69, 0.15),
            0 6px 12px rgba(0, 0, 0, 0.1);
        border-left-width: 6px;
    }

    .station-card-compact.special-station .card-header {
        background: linear-gradient(135deg, rgba(220, 53, 69, 0.05) 0%, transparent 100%);
        border-bottom-color: rgba(220, 53, 69, 0.15);
    }

    .station-card-compact.loading {
        opacity: 0.6;
        pointer-events: none;
    }

    .btn-delete-station {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%) !important;
        color: white !important;
        border: 2px solid white !important;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        z-index: 10;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
    }

    .btn-delete-station:hover {
        background: linear-gradient(135deg, #c82333 0%, #bd2130 100%) !important;
        transform: scale(1.1) rotate(90deg);
        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.5);
    }

    /* ✅ Edit Button */
    .btn-edit-station {
        position: absolute;
        top: 8px;
        right: 50px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #0056B3 0%, #003d82 100%) !important;
        color: white !important;
        border: 2px solid white !important;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        z-index: 10;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 86, 179, 0.3);
    }

    .btn-edit-station:hover {
        background: linear-gradient(135deg, #003d82 0%, #002556 100%) !important;
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(0, 86, 179, 0.5);
    }

    .card-header {
        padding: 14px 14px 12px 14px;
        border-bottom: 2px solid rgba(0, 86, 179, 0.08);
        padding-right: 42px;
        background: linear-gradient(135deg, rgba(0, 86, 179, 0.03) 0%, transparent 100%);
    }

    .station-info {
        min-width: 0;
    }

    .station-name {
        font-size: 15px;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 6px;
        word-break: break-word;
        letter-spacing: -0.2px;
    }

    .station-meta {
        display: flex;
        gap: 6px;
        font-size: 11px;
        color: #6c757d;
        flex-wrap: wrap;
    }

    .station-meta span {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
        border: 1px solid rgba(0, 0, 0, 0.05);
        transition: all 0.2s;
    }

    .station-meta span:hover {
        background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
        transform: translateY(-1px);
    }

    .card-stats-compact {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        padding: 12px;
        background: rgba(248, 249, 250, 0.5);
    }

    .stat-col {
        text-align: center;
        padding: 10px 6px;
        border-radius: 10px;
        background: white;
        transition: all 0.3s ease;
        border: 1px solid rgba(0, 0, 0, 0.04);
        position: relative;
        overflow: hidden;
    }

    .stat-col::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: currentColor;
        opacity: 0.2;
    }

    .stat-col:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-value {
        font-size: 22px;
        font-weight: 800;
        line-height: 1;
        margin-bottom: 4px;
        letter-spacing: -0.5px;
    }

    .stat-label {
        font-size: 10px;
        color: #6c757d;
        line-height: 1.2;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }

    /* สี */
    .stat-value.total {
        color: #0056B3;
    }

    .stat-col:has(.total) {
        background: linear-gradient(135deg, rgba(0, 86, 179, 0.08) 0%, rgba(0, 86, 179, 0.02) 100%);
        border-color: rgba(0, 86, 179, 0.15);
    }

    .stat-value.progress {
        color: #28a745;
    }

    .stat-col:has(.progress) {
        background: linear-gradient(135deg, rgba(40, 167, 69, 0.08) 0%, rgba(40, 167, 69, 0.02) 100%);
        border-color: rgba(40, 167, 69, 0.15);
    }

    .stat-value.waiting {
        color: #ff9800;
    }

    .stat-col:has(.waiting) {
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.02) 100%);
        border-color: rgba(255, 152, 0, 0.15);
    }

    .stat-value.overtime {
        color: #dc3545;
    }

    .stat-col:has(.overtime) {
        background: linear-gradient(135deg, rgba(220, 53, 69, 0.08) 0%, rgba(220, 53, 69, 0.02) 100%);
        border-color: rgba(220, 53, 69, 0.15);
    }

    /* Responsive - อักษรเล็กลงบนมือถือ */
    @media (max-width: 480px) {
        .station-name {
            font-size: 13px;
        }

        .stat-value {
            font-size: 18px;
        }

        .stat-label {
            font-size: 9px;
        }

        .card-stats-compact {
            gap: 6px;
            padding: 8px;
        }

        .stat-col {
            padding: 8px 4px;
        }

        .btn-delete-station {
            width: 28px;
            height: 28px;
            font-size: 11px;
        }
    }
`;
document.head.appendChild(stationCardStyle);
// เรียกใช้ฟังก์ชันเมื่อหน้าโหลด (เพิ่มเข้าไปในส่วน window.addEventListener('load', ...))
// loadStationsByFloor(1); เป็นต้น
function verifyStationContainers() {
    console.log("\n🔍 Verifying station containers...");
    
    for (let floor = 1; floor <= 5; floor++) {
        const container = document.getElementById(`floor${floor}-stations`);
        if (container) {
            console.log(`✅ floor${floor}-stations found`);
        } else {
            console.warn(`❌ floor${floor}-stations NOT found`);
        }
    }
}
      async function loadAllFloorsOld() {
    console.log("\n🔄 Loading all floors...");
    
    try {
        const response = await fetch(`${API_BASE_URL}/get_stations.php`);
        
        // ✅ ตรวจสอบ HTTP status
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log("✅ Get stations response:", result);

        if (!result.success) {
            console.error("❌ API Error:", result.message);
            // ✅ แสดง warning แต่ไม่ crash
            Swal.fire({
                title: '⚠️ ข้อมูลบางส่วนไม่พร้อม',
                text: result.message,
                icon: 'warning',
                confirmButtonText: 'ยอมรับ'
            });
            return;
        }

        const allStations = result.data || [];
        console.log(`📊 Total stations: ${allStations.length}`);
        
        // ✅ คำนวณ statistics
        const stats = {
            totalStations: allStations.length,
            totalRooms: allStations.reduce((sum, s) => sum + (parseInt(s.total_rooms) || 0), 0),
            departments: new Set(allStations.map(s => s.department_id)).size
        };

        console.log("📈 Statistics:", stats);

        // ✅ แสดง stats ใน all floors tab
        const statsContainer = document.getElementById('allfloors-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div style="background: rgba(30, 132, 73, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #1E8449; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #1E8449;">${stats.totalStations}</div>
                    <div style="font-size: 12px; color: var(--text-light);">สถานีทั้งหมด</div>
                </div>
                <div style="background: rgba(0, 71, 171, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #0047AB; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #0047AB;">${stats.totalRooms}</div>
                    <div style="font-size: 12px; color: var(--text-light);">ห้องทั้งหมด</div>
                </div>
                <div style="background: rgba(214, 137, 16, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #D35400; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #D35400;">${stats.departments}</div>
                    <div style="font-size: 12px; color: var(--text-light);">แผนกที่ใช้</div>
                </div>
            `;
        }

        // ✅ แสดง list all floors
        const floorsList = document.getElementById('allfloors-list');
        if (floorsList) {
            let floorsHtml = '';
            for (let floor = 1; floor <= 5; floor++) {
                const floorStations = allStations.filter(s => parseInt(s.floor) === floor);
                floorsHtml += `
                    <div style="background: rgba(255,255,255,0.7); border-radius: 15px; padding: 15px; border: 1px solid var(--glass-border); margin-bottom: 15px;">
                        <div style="font-weight: bold; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid var(--glass-border);">
                            🏢 Floor ${floor} (${floorStations.length} สถานี)
                        </div>
                        ${floorStations.length > 0 ? floorStations.map(s => `
                            <div style="padding: 10px; margin-bottom: 8px; background: rgba(255,255,255,0.5); border-radius: 8px; border-left: 3px solid #0047AB; font-size: 13px;">
                                <div style="font-weight: 600;">${s.station_name}</div>
                                <div style="color: var(--text-light); font-size: 11px;">
                                    ${s.station_code} • ${s.department_name} • 🛏️ ${s.total_rooms}
                                </div>
                            </div>
                        `).join('') : `
                            <div style="text-align: center; color: var(--text-light); padding: 15px; font-size: 12px;">
                                ยังไม่มีสถานี
                            </div>
                        `}
                    </div>
                `;
            }
            floorsList.innerHTML = floorsHtml;
            console.log("✅ All floors list updated");
        }

    } catch (error) {
        console.error('❌ Error loading all floors:', error);
        Swal.fire({
            title: '❌ ข้อผิดพลาด',
            text: `ไม่สามารถโหลดข้อมูลสถานี: ${error.message}`,
            icon: 'error'
        });
    }
}

        // ===== PATIENTS FUNCTIONS =====
        let currentPatientId = null;

        function openImportModal() {
            document.getElementById('importModal').style.display = 'block';
            document.getElementById('importData').value = '';
        }

        function closeImportModal() {
            document.getElementById('importModal').style.display = 'none';
        }

        function updateImportPlaceholder() {
            // Currently only text format supported
        }

        async function submitImport() {
            const importType = document.getElementById('importType').value;
            const importData = document.getElementById('importData').value.trim();

            if (!importData) {
                alert('⚠️ กรุณาวางข้อมูลที่ต้องการ import');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/import_patients.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        import_type: importType,
                        data: importData
                    })
                });

                const result = await response.json();
                console.log('Import result:', result);

                if (result.success) {
                    let message = `✅ Import สำเร็จ!\n\n`;
                    message += `สำเร็จ: ${result.data.success} คน\n`;
                    message += `ล้มเหลว: ${result.data.failed} คน`;
                    
                    if (result.warnings && result.warnings.length > 0) {
                        message += `\n\n⚠️ คำเตือน:\n${result.warnings.slice(0, 5).join('\n')}`;
                    }

                    alert(message);
                    closeImportModal();
                    loadPatients();
                } else {
                    alert(`❌ เกิดข้อผิดพลาด: ${result.message}`);
                }
            } catch (error) {
                console.error('Import error:', error);
                alert('❌ Error: ' + error.message);
            }
        }

	        async function loadPatientFilters() {
	            try {
	                const response = await fetch(`${API_BASE_URL}/get_patients.php?action=filters`);
	                const result = await response.json();
	
	                if (result.success) {
	                    const doctorSelect = document.getElementById('patientDoctorFilter');
	                    const stationSelect = document.getElementById('patientStationFilter');
	
	                    // Doctors
	                    result.data.doctors.forEach(doctor => {
	                        const option = document.createElement('option');
	                        option.value = doctor;
	                        option.textContent = doctor;
	                        doctorSelect.appendChild(option);
	                    });
	
	                    // Stations
	                    result.data.stations.forEach(station => {
	                        const option = document.createElement('option');
	                        option.value = station.station_id;
	                        option.textContent = station.station_name;
	                        stationSelect.appendChild(option);
	                    });
	                }
	            } catch (error) {
	                console.error('Error loading patient filters:', error);
	            }
	        }
	
	        async function loadPatients() {
	            const date = document.getElementById('patientDateFilter').value || new Date().toISOString().split('T')[0];
	            const status = document.getElementById('patientStatusFilter').value;
	            const doctor = document.getElementById('patientDoctorFilter').value;
	            const station = document.getElementById('patientStationFilter').value;
	
	            try {
	                const response = await fetch(`${API_BASE_URL}/get_patients_list.php?date=${date}&status=${status}&doctor_code=${doctor}`);
                const result = await response.json();

                if (result.success) {
                    const patients = result.data;
                    const container = document.getElementById('patientsList');

                    if (patients.length === 0) {
                        container.innerHTML = `
                            <div style="text-align: center; padding: 40px; color: var(--text-light);">
                                <i class="fas fa-user-slash" style="font-size: 48px; margin-bottom: 15px;"></i>
                                <div>ไม่พบข้อมูลผู้ป่วย</div>
                            </div>
                        `;
                        return;
                    }

                    container.innerHTML = patients.map(p => {
	                        let statusColor = {
	                            'waiting': '#D35400', // Amber
	                            'in_progress': '#0056B3', // Blue
	                            'completed': '#1E8449', // Green
	                            'cancelled': '#A93226' // Red
	                        }[p.status] || '#6c757d'; // Gray
	
	                        let statusText = {
	                            'waiting': 'รอ',
	                            'in_progress': 'กำลังรักษา',
	                            'completed': 'เสร็จสิ้น',
	                            'cancelled': 'ยกเลิก'
	                        }[p.status] || p.status;
	
	                        // --- DELAY LOGIC ---
	                        let delayInfo = '';
	                        if (p.is_delayed) {
	                            statusColor = '#A93226'; // Override to Red for Delayed
	                            statusText = `ล่าช้า (${p.delay_minutes} นาที)`;
	                            delayInfo = `<div style="font-size: 11px; color: ${statusColor}; font-weight: 600;">⚠️ ล่าช้า ${p.delay_minutes} นาที</div>`;
	                        }
	                        // --- END DELAY LOGIC ---

                        const progress = p.total_steps > 0 ? Math.round((p.completed_steps / p.total_steps) * 100) : 0;

                        return `
	                            <div class="row-item" onclick="viewPatientDetail(${p.patient_id})" style="cursor: pointer; border-left: 5px solid ${statusColor};">
	                                <div style="display: grid; grid-template-columns: 1fr 2fr 1fr 1fr 1fr auto; gap: 15px; align-items: center;">
	                                    <div>
	                                        <div style="font-weight: bold; font-size: 14px;">${p.hn}</div>
	                                        <div style="font-size: 11px; color: var(--text-light);">เวลา: ${p.appointment_time}</div>
	                                    </div>
	                                    <div>
	                                        <div style="font-weight: 600;">${p.patient_name}</div>
	                                        <div style="font-size: 11px; color: var(--text-light);">สถานะ: ${p.status}</div>
	                                        ${delayInfo}
	                                    </div>
	                                    <div>
	                                        <div style="font-size: 12px; color: var(--text-light); margin-bottom: 5px;">สถานีปัจจุบัน:</div>
	                                        <div style="font-weight: bold; font-size: 14px; color: ${statusColor};">${p.current_step_station_id || '-'}</div>
	                                    </div>
	                                    <div>
	                                        <div style="font-size: 12px; color: var(--text-light); margin-bottom: 5px;">ขั้นตอน:</div>
	                                        <div style="font-weight: 600; font-size: 13px;">${p.current_step_name}</div>
	                                    </div>
	                                    <div>
	                                        <div style="font-size: 12px; color: var(--text-light); margin-bottom: 5px;">ความคืบหน้า:</div>
	                                        <div style="background: rgba(200,200,200,0.3); height: 6px; border-radius: 3px; overflow: hidden;">
	                                            <div style="background: ${statusColor}; height: 100%; width: ${progress}%; transition: width 0.3s;"></div>
	                                        </div>
	                                        <div style="font-size: 11px; color: var(--text-light); text-align: right;">${progress}%</div>
	                                    </div>
	                                    <div>
	                                        <button class="btn btn-danger" onclick="event.stopPropagation(); deletePatient(${p.patient_id})" style="padding: 5px 10px; font-size: 12px;">
	                                            <i class="fas fa-trash"></i>
	                                        </button>
	                                    </div>
	                                </div>
	                            </div>
                        `;
                    }).join('');
                }
            } catch (error) {
                console.error('Error loading patients:', error);
            }
        }

        async function viewPatientDetail(patientId) {
            currentPatientId = patientId;
            
            try {
                const response = await fetch(`${API_BASE_URL}/get_patients.php?action=detail&patient_id=${patientId}`);
                const result = await response.json();

                if (result.success) {
                    const patient = result.data.patient;
                    const steps = result.data.steps;

                    document.getElementById('patientDetailTitle').textContent = `ผู้ป่วย: ${patient.patient_name} (HN: ${patient.hn})`;

                    const statusColor = {
                        'waiting': '#D35400',
                        'in_progress': '#0056B3',
                        'completed': '#1E8449'
                    }[patient.status] || '#6c757d';

                    let content = `
                        <div style="background: rgba(0, 71, 171, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div><strong>HN:</strong> ${patient.hn}</div>
                                <div><strong>ชื่อ:</strong> ${patient.patient_name}</div>
    
                                <div><strong>วันนัด:</strong> ${patient.appointment_date} ${patient.appointment_time}</div>
                                <div><strong>สถานะ:</strong> <span style="color: ${statusColor}; font-weight: 600;">${patient.status}</span></div>
                            </div>
                        </div>

                        <h4 style="margin-bottom: 15px;">ขั้นตอนการรักษา:</h4>
                    `;

                    steps.forEach((step, index) => {
                        const stepStatusColor = {
                            'pending': '#adb5bd',
                            'in_progress': '#0056B3',
                            'completed': '#1E8449',
                            'skipped': '#A93226'
                        }[step.status] || '#6c757d';

                        content += `
                            <div style="background: rgba(255,255,255,0.5); padding: 15px; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid ${stepStatusColor};">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: bold; margin-bottom: 5px;">
                                            ${step.step_order}. ${step.step_name}
                                        </div>
                                        <div style="font-size: 12px; color: var(--text-light);">
                                            ${step.station_name ? `🏪 ${step.station_name} (${step.station_code})` : ''}
                                            ${step.room_name ? ` - ${step.room_name}` : ''}
                                            ${step.doctor_name ? ` - 👨‍⚕️ ${step.doctor_name}` : ''}
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="background: ${stepStatusColor}22; color: ${stepStatusColor}; padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; margin-bottom: 5px;">
                                            ${step.status}
                                        </div>
                                        <div style="font-size: 11px; color: var(--text-light);">
                                            ⏱️ ${step.estimated_duration} นาที
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });

                    document.getElementById('patientDetailContent').innerHTML = content;
                    document.getElementById('patientDetailModal').style.display = 'block';
                }
            } catch (error) {
                console.error('Error loading patient detail:', error);
            }
        }

        function closePatientDetailModal() {
            document.getElementById('patientDetailModal').style.display = 'none';
            currentPatientId = null;
        }

        async function simulatePatient() {
            if (!currentPatientId) return;

            try {
                const response = await fetch(`${API_BASE_URL}/get_patients.php?action=simulate&patient_id=${currentPatientId}`);
                const result = await response.json();

                if (result.success) {
                    const data = result.data;
                    const timeline = data.timeline;

                    let message = `🕒 Simulation สำหรับ: ${data.patient.patient_name}\n\n`;
                    message += `เวลาเริ่ม: ${data.start_time}\n`;
                    message += `เวลาจบ: ${data.end_time}\n`;
                    message += `รวมเวลา: ${data.total_duration} นาที\n\n`;
                    message += `ขั้นตอน:\n`;

                    timeline.forEach(t => {
                        message += `${t.step_order}. ${t.step_name}\n`;
                        message += `   ${t.start_time} - ${t.end_time} (${t.duration} นาที)\n`;
                        if (t.station_name) {
                            message += `   🏪 ${t.station_name} - Floor ${t.floor}\n`;
                        }
                        message += `\n`;
                    });

                    alert(message);
                }
            } catch (error) {
                console.error('Error simulating patient:', error);
            }
        }

        async function deletePatient(patientId) {
            if (!confirm('คุณต้องการลบผู้ป่วยนี้หรือไม่?')) return;

            try {
                const response = await fetch(`${API_BASE_URL}/get_patients.php?action=delete&patient_id=${patientId}`);
                const result = await response.json();

                if (result.success) {
                    alert('✅ ลบผู้ป่วยสำเร็จ');
                    loadPatients();
                } else {
                    alert('❌ เกิดข้อผิดพลาด');
                }
            } catch (error) {
                console.error('Error deleting patient:', error);
            }
        }

        // ===== VISUAL SIMULATION FUNCTIONS =====
        let simulationData = null;
        let simulationMap = null;
        let simulationCanvas = null;
        let simulationCtx = null;
        let simulationRunning = false;
        let simulationStartTime = 0;
        let simulationCurrentTime = 0;
        let simulationSpeed = 10; // Speed multiplier
        let animationFrameId = null;
	        let patientPosition = { x: 0, y: 0 };
	        let targetPosition = { x: 0, y: 0 };
	
	        // --- Add Procedure Functions ---
	        async function loadAllProceduresForAdd() {
	            try {
	                const response = await fetch(`${API_BASE_URL}/get_procedures.php?action=all`);
	                const result = await response.json();
	                if (result.success) {
	                    const select = document.getElementById('newProcedureSelect');
	                    select.innerHTML = '<option value="">-- เลือกหัตถการ --</option>';
	                    result.data.forEach(proc => {
	                        const option = document.createElement('option');
	                        option.value = proc.procedure_id;
	                        option.textContent = proc.procedure_name; // ใช้ชื่อภาษาอังกฤษตาม get_procedures.php
	                        select.appendChild(option);
	                    });
	                }
	            } catch (error) {
	                console.error('Error loading procedures:', error);
	            }
	        }
	
	        function openAddProcedureModal() {
	            loadAllProceduresForAdd();
	            document.getElementById('addProcedureModal').style.display = 'block';
	        }
	
	        function closeAddProcedureModal() {
	            document.getElementById('addProcedureModal').style.display = 'none';
	        }
	
	        async function addProcedureToPatient() {
	            const procedureId = document.getElementById('newProcedureSelect').value;
	            const duration = document.getElementById('newProcedureDuration').value;
	
	            if (!procedureId) {
	                alert('กรุณาเลือกหัตถการ');
	                return;
	            }
	
	            if (currentPatientId <= 0) {
	                alert('ไม่พบข้อมูลผู้ป่วย');
	                return;
	            }
	
	            try {
	                const response = await fetch(`${API_BASE_URL}/add_patient_procedure.php`, {
	                    method: 'POST',
	                    headers: { 'Content-Type': 'application/json' },
	                    body: JSON.stringify({
	                        patient_id: currentPatientId,
	                        procedure_id: parseInt(procedureId),
	                        estimated_duration: parseInt(duration)
	                    })
	                });
	                const result = await response.json();
	
	                if (result.success) {
	                    alert(`✅ เพิ่มหัตถการ "${result.data.procedure_name}" สำเร็จ! ระบบจะโหลด Simulation ใหม่`);
	                    closeAddProcedureModal();
	                    // Reload simulation data to reflect the change
	                    startVisualSimulation(); 
	                } else {
	                    alert(`❌ เกิดข้อผิดพลาด: ${result.message}`);
	                }
	            } catch (error) {
	                console.error('Error adding procedure:', error);
	                alert('❌ Error: ' + error.message);
	            }
	        }
	        // --- End Add Procedure Functions ---
	
	        async function startVisualSimulation() {
	            if (!currentPatientId) return;

            try {
                // Load map data
                const mapResponse = await fetch(`${API_BASE_URL}/get_simulation_map.php?action=map`);
                const mapResult = await mapResponse.json();

                if (!mapResult.success) {
                    alert('❌ ไม่สามารถโหลดแผนผังได้');
                    return;
                }

                simulationMap = mapResult.data;

                // Load patient path
                const pathResponse = await fetch(`${API_BASE_URL}/get_simulation_map.php?action=patient_path&patient_id=${currentPatientId}`);
                const pathResult = await pathResponse.json();

                if (!pathResult.success) {
                    alert('❌ ไม่สามารถโหลดข้อมูลผู้ป่วยได้');
                    return;
                }

                simulationData = pathResult.data;

                // Setup UI
                document.getElementById('simPatientName').textContent = simulationData.patient.patient_name;
                document.getElementById('simPatientInfo').textContent = `HN: ${simulationData.patient.hn} | เวลานัด: ${simulationData.patient.appointment_time}`;

                // Build timeline
                let timelineHtml = '';
                simulationData.path.forEach((step, index) => {
                    timelineHtml += `
                        <div style="padding: 8px; margin-bottom: 5px; background: rgba(255,255,255,0.7); border-radius: 8px; border-left: 3px solid #0047AB; font-size: 12px;">
                            <strong>${step.step_order}. ${step.step_name}</strong> - ${step.start_time} ถึง ${step.end_time} (${step.duration} นาที)
                            ${step.station_name ? `<br><span style="color: var(--text-light);">🏪 ${step.station_name}</span>` : ''}
                        </div>
                    `;
                });
                document.getElementById('simulationTimeline').innerHTML = timelineHtml;

                // Setup canvas
                simulationCanvas = document.getElementById('simulationCanvas');
                simulationCanvas.width = simulationCanvas.offsetWidth;
                simulationCanvas.height = simulationCanvas.offsetHeight;
                simulationCtx = simulationCanvas.getContext('2d');

                // Initialize simulation
                simulationStartTime = simulationData.start_timestamp;
                simulationCurrentTime = simulationStartTime;
                simulationRunning = false;

                // Set initial position
                const firstStep = simulationData.path[0];
                const firstPos = getStationPosition(firstStep.position);
                patientPosition = { x: firstPos.x, y: firstPos.y };
                targetPosition = { x: firstPos.x, y: firstPos.y };

                // Show modal
                document.getElementById('patientDetailModal').style.display = 'none';
                document.getElementById('visualSimulationModal').style.display = 'block';

                // Draw initial state
                drawSimulation();

            } catch (error) {
                console.error('Error starting simulation:', error);
                alert('❌ เกิดข้อผิดพลาด: ' + error.message);
            }
        }

        function getStationPosition(positionData) {
            if (!positionData) return { x: 50, y: 50 };

            if (positionData.type === 'special') {
                const special = simulationMap.special_stations.find(s => s.id === positionData.id);
                return special ? { x: special.x, y: special.y } : { x: 50, y: 50 };
            } else if (positionData.type === 'station') {
                const station = simulationMap.stations.find(s => s.station_id == positionData.id);
                return station ? { x: station.x, y: station.y } : { x: 50, y: 50 };
            }

            return { x: 50, y: 50 };
        }

        function toggleSimulation() {
            simulationRunning = !simulationRunning;
            const btn = document.getElementById('simPlayBtn');

            if (simulationRunning) {
                btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                btn.classList.remove('btn-success');
                btn.classList.add('btn-warning');
                runSimulation();
            } else {
                btn.innerHTML = '<i class="fas fa-play"></i> Play';
                btn.classList.remove('btn-warning');
                btn.classList.add('btn-success');
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            }
        }

        function resetSimulation() {
            simulationRunning = false;
            simulationCurrentTime = simulationStartTime;
            const btn = document.getElementById('simPlayBtn');
            btn.innerHTML = '<i class="fas fa-play"></i> Play';
            btn.classList.remove('btn-warning');
            btn.classList.add('btn-success');

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            // Reset to first position
            const firstStep = simulationData.path[0];
            const firstPos = getStationPosition(firstStep.position);
            patientPosition = { x: firstPos.x, y: firstPos.y };
            targetPosition = { x: firstPos.x, y: firstPos.y };

            drawSimulation();
        }

        function runSimulation() {
            if (!simulationRunning) return;

            // Update time (speed multiplier)
            simulationCurrentTime += simulationSpeed;

            // Check if simulation ended
            if (simulationCurrentTime >= simulationData.end_timestamp) {
                simulationCurrentTime = simulationData.end_timestamp;
                simulationRunning = false;
                document.getElementById('simPlayBtn').innerHTML = '<i class="fas fa-play"></i> Play';
                document.getElementById('simPlayBtn').classList.remove('btn-warning');
                document.getElementById('simPlayBtn').classList.add('btn-success');
            }

            // Find current step
            let currentStep = null;
            for (let i = 0; i < simulationData.path.length; i++) {
                const step = simulationData.path[i];
                if (simulationCurrentTime >= step.start_timestamp && simulationCurrentTime <= step.end_timestamp) {
                    currentStep = step;
                    break;
                }
            }

            // Update target position
            if (currentStep) {
                targetPosition = getStationPosition(currentStep.position);
                document.getElementById('simCurrentStep').textContent = `${currentStep.step_order}. ${currentStep.step_name}`;
            }

            // Smooth movement towards target
            const dx = targetPosition.x - patientPosition.x;
            const dy = targetPosition.y - patientPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0.5) {
                const speed = 0.1;
                patientPosition.x += dx * speed;
                patientPosition.y += dy * speed;
            } else {
                patientPosition.x = targetPosition.x;
                patientPosition.y = targetPosition.y;
            }

            // Update time display
            const currentDate = new Date(simulationCurrentTime * 1000);
            document.getElementById('simCurrentTime').textContent = currentDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

            // Draw
            drawSimulation();

            // Continue animation
            if (simulationRunning) {
                animationFrameId = requestAnimationFrame(runSimulation);
            }
        }

        function drawSimulation() {
            if (!simulationCtx || !simulationCanvas) return;

            const ctx = simulationCtx;
            const width = simulationCanvas.width;
            const height = simulationCanvas.height;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Draw stations
            if (simulationMap) {
                // Draw special stations
                simulationMap.special_stations.forEach(station => {
                    const x = (station.x / 100) * width;
                    const y = (station.y / 100) * height;

                    // Station circle
                    ctx.fillStyle = station.color || '#0047AB';
                    ctx.beginPath();
                    ctx.arc(x, y, 20, 0, Math.PI * 2);
                    ctx.fill();

                    // Station border
                    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    // Station name
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 11px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(station.name, x, y + 35);
                });

                // Draw regular stations
                simulationMap.stations.forEach(station => {
                    const x = (station.x / 100) * width;
                    const y = (station.y / 100) * height;

                    // Station rectangle
                    ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx.fillRect(x - 25, y - 20, 50, 40);

                    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x - 25, y - 20, 50, 40);

                    // Station name
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(station.station_code || station.station_name.substring(0, 10), x, y + 5);
                });
            }

            // Draw patient (moving circle)
            const px = (patientPosition.x / 100) * width;
            const py = (patientPosition.y / 100) * height;

            // Patient glow
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#A93226';

            // Patient circle
            ctx.fillStyle = '#A93226';
            ctx.beginPath();
            ctx.arc(px, py, 15, 0, Math.PI * 2);
            ctx.fill();

            // Patient border
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Patient icon
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👤', px, py);
        }

        function closeVisualSimulation() {
            simulationRunning = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            document.getElementById('visualSimulationModal').style.display = 'none';
        }

	   
async function loadAllFloorsEnhanced() {
    console.log("🔄 Loading all floors enhanced view...");
    
    try {
        const response = await fetch(`${API_BASE_URL}/get_stations.php`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log("📊 API Response:", result);

        if (!result.success) {
            console.warn("⚠️ API returned success: false");
            const container = document.getElementById('allfloors-list');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-light);">
                        <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                        <div>ไม่สามารถโหลดข้อมูล</div>
                        <small>${result.message || 'Unknown error'}</small>
                    </div>
                `;
            }
            return;
        }

        // ✅ CORRECT: result.data is the array (API returns stations directly in result.data)
        let allStations = [];
        
        if (result.data && Array.isArray(result.data)) {
            allStations = result.data;
            console.log("✅ Loaded", allStations.length, "stations from result.data");
        } else if (result.data && Array.isArray(result.data.stations)) {
            allStations = result.data.stations;
            console.log("✅ Loaded", allStations.length, "stations from result.data.stations");
        } else {
            console.error("❌ Could not find stations array in result.data");
            console.log("Result structure:", result.data);
        }

        const statsContainer = document.getElementById('allfloors-stats');
        const listContainer = document.getElementById('allfloors-list');

        // If no data, show empty state
        if (!allStations || allStations.length === 0) {
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <div style="background: rgba(108, 117, 125, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #6c757d; text-align: center; grid-column: 1 / -1;">
                        <div style="font-size: 28px; font-weight: bold; color: #6c757d;">0</div>
                        <div style="font-size: 12px; color: var(--text-light);">ยังไม่มีสถานี</div>
                    </div>
                `;
            }
            if (listContainer) {
                listContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-light);">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                        <div>ยังไม่มีสถานีในระบบ</div>
                        <small>กดปุ่ม "+ Add Station" ในแต่ละชั้นเพื่อเพิ่มสถานี</small>
                    </div>
                `;
            }
            return;
        }

        console.log("✅ Processing", allStations.length, "stations");

        // Calculate statistics
        const totalStations = allStations.length;
        const totalRooms = allStations.reduce((sum, s) => sum + (parseInt(s.room_count) || 0), 0);
        const totalStaff = allStations.reduce((sum, s) => sum + (parseInt(s.staff_count) || 0), 0);
        const totalDoctors = allStations.reduce((sum, s) => sum + (parseInt(s.doctor_count) || 0), 0);

        // Display stats
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div style="background: rgba(30, 132, 73, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #1E8449; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #1E8449;">${totalStations}</div>
                    <div style="font-size: 12px; color: var(--text-light);">สถานีทั้งหมด</div>
                </div>
                <div style="background: rgba(0, 71, 171, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #0047AB; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #0047AB;">${totalRooms}</div>
                    <div style="font-size: 12px; color: var(--text-light);">ห้องทั้งหมด</div>
                </div>
                <div style="background: rgba(214, 137, 16, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #D35400; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #D35400;">${totalStaff}</div>
                    <div style="font-size: 12px; color: var(--text-light);">พนักงานทั้งหมด</div>
                </div>
                <div style="background: rgba(0, 112, 192, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #0070C0; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #0070C0;">${totalDoctors}</div>
                    <div style="font-size: 12px; color: var(--text-light);">แพทย์ทั้งหมด</div>
                </div>
            `;
        }

        // Build floor sections
        let floorsHTML = '';
        for (let floor = 1; floor <= 5; floor++) {
            const floorStations = allStations.filter(s => parseInt(s.floor) === floor);
            
            const floorStats = {
                roomCount: floorStations.reduce((sum, s) => sum + (parseInt(s.room_count) || 0), 0),
                staffCount: floorStations.reduce((sum, s) => sum + (parseInt(s.staff_count) || 0), 0),
                doctorCount: floorStations.reduce((sum, s) => sum + (parseInt(s.doctor_count) || 0), 0)
            };

            const floorSection = await createFloorSection(floor, floorStations, floorStats);
            floorsHTML += floorSection;
        }

        if (listContainer) {
            listContainer.innerHTML = floorsHTML;
            console.log("✅ All floors view loaded successfully");
        }

    } catch (error) {
        console.error('❌ Error loading all floors:', error);
        const listContainer = document.getElementById('allfloors-list');
        if (listContainer) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #A93226;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <div>เกิดข้อผิดพลาด</div>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }
}


// FIX 3: createFloorSection()
// ============================================
async function createFloorSection(floor, stations, stats) {
    const expandId = `floor-${floor}-expand`;
    const contentId = `floor-${floor}-content`;
    const isExpanded = sessionStorage.getItem(expandId) === 'true';

    let stationsHTML = '';
    
    if (stations.length === 0) {
        stationsHTML = `
            <div style="text-align: center; padding: 20px; color: #adb5bd;">
                ยังไม่มีเสตชั่นบนชั้นนี้
            </div>
        `;
    } else {
        for (const station of stations) {
            try {
                const statsResponse = await fetch(
                    `${API_BASE_URL}/get_station_stats.php?station_id=${station.station_id}`
                );
                const statsResult = await statsResponse.json();
                
                let stationStats = {
                    total_patients: 0,
                    completed_patients: 0,
                    pending_patients: 0,
                    room_count: station.room_count || 0,
                    staff_count: station.staff_count || 0,
                    doctor_count: station.doctor_count || 0
                };

                if (statsResult.success) {
                    stationStats = statsResult.data;
                }

                stationsHTML += `
                    <div class="floor-station-item" onclick="openStationDetail(${station.station_id})">
                        <div class="floor-station-icon">
                            <i class="fas fa-hospital"></i>
                        </div>
                        <div class="floor-station-info">
                            <div class="floor-station-name">${station.station_name}</div>
                            <div class="floor-station-meta">
                                ${station.station_code} • ${station.department_name || 'N/A'}
                            </div>
                            <div class="floor-station-stats">
                                👥 ${stationStats.total_patients} คน | 
                                ✅ ${stationStats.completed_patients} | 
                                ⏳ ${stationStats.pending_patients} | 
                                🏨 ${station.room_count}
                            </div>
                        </div>
                        <div class="floor-station-action">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error(`Error loading station ${station.station_id}:`, error);
                stationsHTML += `
                    <div class="floor-station-item" style="opacity: 0.5;">
                        <div class="floor-station-icon"><i class="fas fa-exclamation"></i></div>
                        <div class="floor-station-info">
                            <div class="floor-station-name">${station.station_name}</div>
                            <div class="floor-station-meta">Error loading data</div>
                        </div>
                    </div>
                `;
            }
        }
    }

    return `
        <div class="floor-section">
            <div class="floor-section-header" onclick="toggleFloorExpand(${floor})">
                <div class="floor-section-title">
                    <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'}" style="margin-right: 8px; color: #0056B3;"></i>
                    <span>🏢 Floor ${floor}</span>
                </div>
                <div class="floor-section-stats">
                    <span style="background: rgba(100,200,100,0.2); padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                        ${stations.length} สถานี
                    </span>
                    <span style="background: rgba(100,150,255,0.2); padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                        🏨 ${stats.roomCount}
                    </span>
                    <span style="background: rgba(255,150,100,0.2); padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                        👥 ${stats.staffCount}
                    </span>
                </div>
            </div>
            <div id="${contentId}" class="floor-section-content" style="display: ${isExpanded ? 'block' : 'none'};">
                ${stationsHTML}
            </div>
        </div>
    `;
}


// ฟังก์ชันเลือกหัตถการทั้งหมด
function selectAllProcedures() {
    const checkboxes = document.querySelectorAll('.room-procedure');
    const allProceduresCheckbox = document.getElementById('allProcedures');
    
    if (checkboxes.length === 0) {
        showNotification('ไม่มีหัตถการให้เลือก', 'warning');
        return;
    }
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    
    if (currentRoomId && wizardData.rooms[currentRoomId]) {
        const room = wizardData.rooms[currentRoomId];
        room.procedures = allProcedures.map(proc => proc.procedure_id);
        room.all_procedures = false;
        
        if (allProceduresCheckbox) {
            allProceduresCheckbox.checked = false;
        }
        
        const proceduresContainer = document.getElementById('roomProceduresContainer');
        if (proceduresContainer) {
            proceduresContainer.style.display = 'block';
        }
    }
    
    showNotification(`เลือกหัตถการทั้งหมด ${checkboxes.length} รายการแล้ว`, 'success');
} // ✅ ปิด function ให้สมบูรณ์


// ฟังก์ชันล้างการเลือกทั้งหมด
function clearAllProcedures() {
    const checkboxes = document.querySelectorAll('.room-procedure');
    const allProceduresCheckbox = document.getElementById('allProcedures');
    
    if (checkboxes.length === 0) {
        showNotification('ไม่มีหัตถการให้ล้าง', 'warning');
        return;
    }
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    if (currentRoomId && wizardData.rooms[currentRoomId]) {
        const room = wizardData.rooms[currentRoomId];
        room.procedures = [];
        room.all_procedures = false;
        
        if (allProceduresCheckbox) {
            allProceduresCheckbox.checked = false;
        }
        
        const proceduresContainer = document.getElementById('roomProceduresContainer');
        if (proceduresContainer) {
            proceduresContainer.style.display = 'block';
        }
    }
    
    showNotification('ล้างการเลือกทั้งหมดแล้ว', 'warning');
} // ✅ ปิด function ให้สมบูรณ์


// ฟังก์ชันแสดงการแจ้งเตือน
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
        alert(message);
    }
} // ✅ ปิด function ให้สมบูรณ์
// ฟังก์ชันแสดงการแจ้งเตือน
function showNotification(message, type = 'info') {
    // ใช้ SweetAlert2 สำหรับแสดงการแจ้งเตือน
    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });
        
        Toast.fire({
            icon: type,
            title: message
        });
    } else {
        // Fallback ถ้าไม่มี SweetAlert2
        alert(message);
    }
}
// ฟังก์ชัน Toggle Floor Expand
function toggleFloorExpand(floor) {
    const expandId = `floor-${floor}-expand`;
    const contentId = `floor-${floor}-content`;
    const content = document.getElementById(contentId);
    const header = event.target.closest('.floor-section-header');
    
    if (!header || !content) return;
    
    const icon = header.querySelector('i');
    const isExpanded = content.style.display === 'block';
    
    if (isExpanded) {
        content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right');
        }
        sessionStorage.setItem(expandId, 'false');
    } else {
        content.style.display = 'block';
        if (icon) {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down');
        }
        sessionStorage.setItem(expandId, 'true');
    }
} // ✅ ปิด function ให้สมบูรณ์


// เพิ่ม CSS styling
const allFloorsStyle = document.createElement('style');
allFloorsStyle.textContent = `
    .floor-section {
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(200, 200, 200, 0.3);
        border-radius: 12px;
        margin-bottom: 15px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .floor-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 16px;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%);
        cursor: pointer;
        user-select: none;
        border-bottom: 1px solid rgba(200, 200, 200, 0.2);
        transition: all 0.3s ease;
    }

    .floor-section-header:hover {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(102, 126, 234, 0.08) 100%);
    }

    .floor-section-title {
        font-weight: 700;
        font-size: 15px;
        color: #212529;
        display: flex;
        align-items: center;
    }

    .floor-section-stats {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
    }

    .floor-section-content {
        display: grid;
        gap: 8px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.3);
        transition: all 0.3s ease;
    }

    .floor-station-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(200, 200, 200, 0.2);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .floor-station-item:hover {
        background: rgba(255, 255, 255, 1);
        border-color: rgba(102, 126, 234, 0.5);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        transform: translateX(4px);
    }

    .floor-station-icon {
        font-size: 24px;
        color: #0056B3;
        flex-shrink: 0;
    }

    .floor-station-info {
        flex: 1;
        min-width: 0;
    }

    .floor-station-name {
        font-weight: 600;
        font-size: 13px;
        color: #212529;
        margin-bottom: 3px;
    }

    .floor-station-meta {
        font-size: 11px;
        color: #495057;
        margin-bottom: 4px;
    }

    .floor-station-stats {
        font-size: 11px;
        color: #adb5bd;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .floor-station-action {
        font-size: 14px;
        color: #adb5bd;
        flex-shrink: 0;
        transition: all 0.3s ease;
    }

    .floor-station-item:hover .floor-station-action {
        color: #0056B3;
        transform: translateX(4px);
    }
`;
document.head.appendChild(allFloorsStyle);

// เรียกใช้เมื่อ load หน้า all floors
// loadAllFloorsEnhanced();
    </script>
    <!-- Create Room Modal -->
    <div id="createRoomModal" class="modal" style="z-index: 1002;">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2 class="modal-title">สร้างห้องใหม่สำหรับ <span id="createRoomStationName"></span></h2>
                <button class="close-modal" onclick="closeCreateRoomModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="newRoomName" class="form-label">ชื่อห้อง (เช่น: ห้องตรวจ 1, ห้องผ่าตัด)</label>
                    <input type="text" id="newRoomName" class="form-control" placeholder="กรุณากรอกชื่อห้อง" required>
                </div>
                <div class="form-group">
                    <label for="newRoomNumber" class="form-label">หมายเลขห้อง (ไม่บังคับ)</label>
                    <input type="text" id="newRoomNumber" class="form-control" placeholder="เช่น: Room 3 (ถ้าเว้นว่าง ระบบจะสร้างให้)">
                </div>
                <button class="btn" style="width: 100%; background: #1E8449; color: white; margin-top: 15px;" onclick="createNewRoom()">
                    <i class="fas fa-save"></i> บันทึกและสร้างห้อง
                </button>
            </div>
        </div>
    </div>

   
    <!-- MUST LOAD IN ORDER: dependency chain 01→02→03...→11 -->
    
    <!-- Dashboard Complete Functions -->
    <script>
        // Store all dashboard stations for filtering/sorting
        let allDashboardStations = [];

        async function displayDashboardStats(stations) {
            const statsContainer = document.getElementById('allfloors-stats');
            
            const stats = {
                total: stations.length,
                rooms: stations.reduce((sum, s) => sum + (parseInt(s.room_count) || 0), 0),
                staff: stations.reduce((sum, s) => sum + (parseInt(s.total_staff) || 0), 0),
                doctors: stations.reduce((sum, s) => sum + (parseInt(s.total_doctors) || 0), 0)
            };

            statsContainer.innerHTML = `
                <div class="dashboard-stat-card green">
                    <div class="dashboard-stat-number">${stats.total}</div>
                    <div class="dashboard-stat-label">Stations</div>
                </div>
                <div class="dashboard-stat-card blue">
                    <div class="dashboard-stat-number">${stats.rooms}</div>
                    <div class="dashboard-stat-label">Rooms</div>
                </div>
                <div class="dashboard-stat-card orange">
                    <div class="dashboard-stat-number">${stats.staff}</div>
                    <div class="dashboard-stat-label">Staff</div>
                </div>
                <div class="dashboard-stat-card purple">
                    <div class="dashboard-stat-number">${stats.doctors}</div>
                    <div class="dashboard-stat-label">Doctors</div>
                </div>
            `;
        }

        async function displayDashboardStations(stations) {
            const container = document.getElementById('allfloors-list');
            let html = '';

            if (stations.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; color: #6c757d; grid-column: 1/-1;">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                        <div>No stations found</div>
                    </div>
                `;
                return;
            }

            for (const station of stations) {
                try {
                    const statsResponse = await fetch(
                        `${API_BASE_URL}/get_station_stats.php?station_id=${station.station_id}`
                    );
                    const statsResult = await statsResponse.json();
                    
                    let stats = {
                        total_patients: 0,
                        in_progress_patients: 0,
                        pending_patients: 0
                    };

                    if (statsResult.success && statsResult.data) {
                        stats = statsResult.data;
                    }

                    const occupancy = Math.round((stats.total_patients / (station.total_staff || 1) * 3) * 100);
                    const statusColor = occupancy > 80 ? '#dc3545' : occupancy > 60 ? '#fd7e14' : '#28a745';
                    const statusBadge = occupancy > 80 ? 'dashboard-status-critical' : occupancy > 60 ? 'dashboard-status-warning' : 'dashboard-status-normal';
                    const statusLabel = occupancy > 80 ? '🔴 CRITICAL' : occupancy > 60 ? '🟡 WARNING' : '🟢 NORMAL';

                    html += `
                        <div class="dashboard-station-card" onclick="openStationDetail(${station.station_id})">
                            <div class="dashboard-card-header">
                                <div>
                                    <div class="dashboard-card-title">${station.station_name}</div>
                                    <div class="dashboard-card-code">${station.station_code} • ${station.department_name || 'N/A'}</div>
                                </div>
                                <div class="dashboard-card-status">
                                    <div class="dashboard-status-badge ${statusBadge}">${statusLabel}</div>
                                    <div style="font-size: 11px; opacity: 0.9;">Floor ${station.floor}</div>
                                </div>
                            </div>

                            <div class="dashboard-card-body">
                                <!-- Patient Stats -->
                                <div class="dashboard-card-section">
                                    <div class="dashboard-section-title">👥 Patient Info</div>
                                    <div class="dashboard-info-row">
                                        <div class="dashboard-info-item">
                                            <div class="dashboard-info-label">Total Patients</div>
                                            <div class="dashboard-info-value">${stats.total_patients}</div>
                                        </div>
                                        <div class="dashboard-info-item">
                                            <div class="dashboard-info-label">Occupancy</div>
                                            <div class="dashboard-info-value ${occupancy > 80 ? 'danger' : occupancy > 60 ? 'warning' : ''}">${Math.min(occupancy, 100)}%</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Resources -->
                                <div class="dashboard-card-section">
                                    <div class="dashboard-section-title">⚙️ Resources</div>
                                    <div class="dashboard-badges">
                                        <div class="dashboard-badge">
                                            <i class="fas fa-users"></i> ${station.total_staff || 0} Staff
                                        </div>
                                        <div class="dashboard-badge">
                                            <i class="fas fa-user-md"></i> ${station.total_doctors || 0} Doctors
                                        </div>
                                        <div class="dashboard-badge">
                                            <i class="fas fa-door-open"></i> ${station.room_count || 0} Rooms
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                } catch (error) {
                    console.error(`Error loading station ${station.station_id}:`, error);
                }
            }

            container.innerHTML = html;
        }

        function filterAllFloorsStations() {
            const floor = document.getElementById('floorFilter')?.value || '';
            const search = document.getElementById('searchInput')?.value.toLowerCase() || '';

            let filtered = allDashboardStations.filter(s => {
                const matchFloor = !floor || s.floor === parseInt(floor);
                const matchSearch = !search || 
                    s.station_name.toLowerCase().includes(search) ||
                    s.station_code.toLowerCase().includes(search);
                return matchFloor && matchSearch;
            });

            displayDashboardStats(filtered);
            displayDashboardStations(filtered);
        }

        function sortAllFloorsStations() {
            const sortBy = document.getElementById('sortBy')?.value || 'name';
            const floor = document.getElementById('floorFilter')?.value || '';
            
            let sorted = [...allDashboardStations];

            if (floor) {
                sorted = sorted.filter(s => s.floor === parseInt(floor));
            }

            switch (sortBy) {
                case 'patients':
                    sorted.sort((a, b) => a.station_name.localeCompare(b.station_name));
                    break;
                case 'occupancy':
                    sorted.sort((a, b) => a.station_name.localeCompare(b.station_name));
                    break;
                default:
                    sorted.sort((a, b) => a.station_name.localeCompare(b.station_name));
            }

            displayDashboardStats(sorted);
            displayDashboardStations(sorted);
        }

        // Update the existing loadAllFloorsEnhanced function to use new dashboard
        async function loadAllFloorsEnhancedNew() {
            console.log("🔄 Loading all floors dashboard...");
            
            try {
                // Try new API with staff count first, fallback to old one
                let response = await fetch(`${API_BASE_URL}/get_stations_with_staff.php`);
                
                // If new API doesn't exist, use old one
                if (!response.ok) {
                    console.log("ℹ️ New API not found, using get_stations.php");
                    response = await fetch(`${API_BASE_URL}/get_stations.php`);
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const result = await response.json();

                if (!result.success) {
                    console.warn("⚠️ API returned success: false");
                    const container = document.getElementById('allfloors-list');
                    if (container) {
                        container.innerHTML = `
                            <div style="text-align: center; padding: 40px; color: var(--text-light);">
                                <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                                <div>ไม่สามารถโหลดข้อมูล</div>
                            </div>
                        `;
                    }
                    return;
                }

                let allStations = [];
                if (result.data && Array.isArray(result.data)) {
                    allStations = result.data;
                    console.log("✅ Loaded from result.data:", allStations.length, "stations");
                } else if (result.data && Array.isArray(result.data.stations)) {
                    allStations = result.data.stations;
                    console.log("✅ Loaded from result.data.stations:", allStations.length, "stations");
                }

                // 🔍 DEBUG: Check staff_count values
                console.log("📊 Staff Count Debug:");
                allStations.forEach((station, idx) => {
                    if (idx < 3) { // Show first 3 stations
                        console.log(`  ${station.station_name}: staff_count=${station.staff_count}`);
                    }
                });

                if (!allStations || allStations.length === 0) {
                    const container = document.getElementById('allfloors-list');
                    if (container) {
                        container.innerHTML = `
                            <div style="text-align: center; padding: 40px; color: var(--text-light);">
                                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                                <div>ยังไม่มีสถานีในระบบ</div>
                            </div>
                        `;
                    }
                    return;
                }

                // Store for filtering/sorting
                allDashboardStations = allStations;

                // Display using new dashboard functions
                await displayDashboardStats(allStations);
                await displayDashboardStations(allStations);

                console.log("✅ Dashboard loaded successfully with", allStations.length, "stations");

            } catch (error) {
                console.error('❌ Error loading dashboard:', error);
                const container = document.getElementById('allfloors-list');
                if (container) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: #A93226;">
                            <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
                            <div>เกิดข้อผิดพลาด</div>
                            <small>${error.message}</small>
                        </div>
                    `;
                }
            }
        }

        // Override the existing loadAllFloorsEnhanced to use new version
        const originalLoadAllFloorsEnhanced = window.loadAllFloorsEnhanced;
        window.loadAllFloorsEnhanced = loadAllFloorsEnhancedNew;
    </script>

    <script src="js/modules/API_HELPER.js"></script> 
    <script src="js/modules/01-api-config.js"></script>
    <script src="js/modules/02-utilities.js"></script>
    <script src="js/modules/03-station-management.js"></script>
    <script src="js/modules/04-room-management.js"></script>
    <script src="js/modules/05-room-display.js"></script>
    <script src="js/modules/06-procedure-management.js"></script>
    <script src="js/modules/07-equipment-staff-management.js"></script>
    <script src="js/modules/08-staff-schedule-management.js"></script>
    <script src="js/modules/09-doctor-management.js"></script>
    <script src="js/modules/10-patient-management.js"></script>
    <script src="js/modules/11-auto-assign-doctor.js"></script>
    <script src="js/modules/12-auto-assignment-system.js"></script>
    <script src="js/modules/13-auto_update_staff_status.js"></script>
    <script src="js/modules/14-Station-Drag&Drop.js"></script>
    <script src="js/modules/15-data-visualization.js"></script>
    <script src="js/modules/patient-wrapper.js"></script>
    <script src="js/modules/daily-reset.js"></script>



    <script src="js/modules/sse-manager.js"></script> 

    <!-- Load jQuery, Popper.js, and Bootstrap JS for Dropdown functionality -->
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.4/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    
    
      
    <!-- ✅ AUTO REFRESH DASHBOARD -->
    <script>

        
        /**
         * 🔄 Auto Refresh Dashboard ทุก 10 วินาที
         * Refresh เมื่อมีการเปลี่ยนแปลง Patient, Station, หรือข้อมูลอื่นใด
         */
        
        let autoRefreshInterval = null;
        const AUTO_REFRESH_INTERVAL = 20000; // 10 วินาที
        
        function autoRefreshDashboard() {
            console.log("🔄 Auto Refresh Started - " + new Date().toLocaleTimeString());
            
            // Clear existing interval ถ้ามี
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
            }
            
            // Refresh ทุก 10 วินาที
            autoRefreshInterval = setInterval(() => {
                const currentTime = new Date().toLocaleTimeString();
                console.log(`🔄 Dashboard Refreshing... ${currentTime}`);
                
                // Refresh All Floors tab
                if (typeof loadAllFloorsEnhancedNew === 'function') {
                    console.log("  ✅ Refreshing All Floors...");
                    loadAllFloorsEnhancedNew();
                }
                
                // Refresh Station by Filter
                if (typeof loadStationsByFilter === 'function') {
                    console.log("  ✅ Refreshing Stations by Filter...");
                    loadStationsByFilter();
                }
                
                // Refresh Rooms
                if (typeof loadRooms === 'function') {
                    console.log("  ✅ Refreshing Rooms...");
                    loadRooms();
                }
                
                // Refresh Staff
                if (typeof loadStaffSchedule === 'function') {
                    console.log("  ✅ Refreshing Staff Schedule...");
                    loadStaffSchedule();
                }
                
            }, AUTO_REFRESH_INTERVAL);
        }
        
        // ✅ Stop Auto Refresh
        function stopAutoRefresh() {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                console.log("⏹️ Auto Refresh Stopped");
            }
        }
        
        // ✅ Restart Auto Refresh
        function restartAutoRefresh() {
            stopAutoRefresh();
            autoRefreshDashboard();
            console.log("🔄 Auto Refresh Restarted");
        }
        
        // เรียก Auto Refresh เมื่อหน้า load เสร็จ
        window.addEventListener('load', () => {
            setTimeout(() => {
                autoRefreshDashboard();
                console.log("✅ Dashboard Auto Refresh Enabled (Every 10 seconds)");
                
                // ✅ AUTO UPDATE STAFF STATUS - ทุก 5 นาที
                startAutoUpdateStaffStatusAPI();
            }, 60000);
        });
        
        // ========================================
        // ✅ AUTO UPDATE STAFF STATUS (FIXED VERSION 2.0)
        // ========================================
        let statusUpdateAPIInterval = null;
        
        function startAutoUpdateStaffStatusAPI() {
            const updateStatusAPI = async () => {
                try {
                    const stationId = window.currentStationId || 0;
                    const now = new Date();
                    const currentDate = now.toISOString().split('T')[0];
                    const currentTime = now.toTimeString().split(' ')[0];
                    
                    console.log(`🔄 [${currentTime}] Updating staff status...`);
                    
                    // ✅ FIX: Use POST method with full data
                    const response = await fetch(`${API_BASE_URL}/update_staff_status_by_time.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            station_id: stationId,
                            current_date: currentDate,
                            current_time: currentTime
                        })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        
                        if (result.success) {
                            const updatedCount = result.data.updated_count || 0;
                            
                            if (updatedCount > 0) {
                                console.log(`✅ Staff status updated: ${updatedCount} changes at ${currentTime}`);
                                
                                setTimeout(() => {
                                    if (typeof loadAllFloorsEnhancedNew === 'function') {
                                        loadAllFloorsEnhancedNew();
                                    }
                                }, 300);
                            } else {
                                console.log(`ℹ️ No status changes at ${currentTime}`);
                            }
                        } else {
                            console.warn('⚠️ Status update failed:', result.message);
                        }
                    } else {
                        console.warn(`⚠️ API error: ${response.status}`);
                    }
                    
                } catch (error) {
                    console.warn('⚠️ Status API update error:', error.message);
                }
            };
            
            updateStatusAPI();
            
            // ✅ FIXED: Changed from 5 minutes to 30 seconds
            if (statusUpdateAPIInterval) clearInterval(statusUpdateAPIInterval);
            statusUpdateAPIInterval = setInterval(updateStatusAPI, 60 * 1000);
            
            console.log('✅ Auto Status Update API enabled (Every 60 seconds)');
        }
        
        function stopAutoUpdateStaffStatusAPI() {
            if (statusUpdateAPIInterval) {
                clearInterval(statusUpdateAPIInterval);
                statusUpdateAPIInterval = null;
                console.log('⏹️ Auto Status Update API stopped');
            }
        }
        
        function restartAutoUpdateStaffStatusAPI() {
            stopAutoUpdateStaffStatusAPI();
            setTimeout(() => {
                startAutoUpdateStaffStatusAPI();
            }, 1000);
        }
        
        // ⏸️ Pause auto refresh เมื่อผู้ใช้เลือกสิ่งต่างๆ (หลีกเลี่ยงการ refresh ที่รบกวน)
        document.addEventListener('click', () => {
            // ห้ามให้ refresh ขัดจังหวะการคลิก
            // สามารถเพิ่ม logic เพื่อ pause/resume ได้
        });
    </script>

    <!-- ✅ REALTIME STAFF STATUS UPDATER (Client-side) -->
    <script>
        /**
         * 🟢 Realtime Staff Status Calculator (FIXED)
         * คำนวณ status จากเวลาปัจจุบัน ไม่ใช้ database status
         */
        
        // ✅ Convert time string (HH:MM) to comparable number
        function timeToNumber(timeStr) {
            if (!timeStr || typeof timeStr !== 'string') return 0;
            const parts = timeStr.split(':');
            const hours = parseInt(parts[0]) || 0;
            const mins = parseInt(parts[1]) || 0;
            return hours * 100 + mins;
        }
        
        // ✅ Calculate realtime staff status (FIXED)
        // ✅ Map database status ไปยัง UI display
        function getStatusDisplay(dbStatus) {
            let status = "available";
            let statusColor = "#28a745";
            let statusIcon = "fa-check-circle";
            let statusText = "ว่าง";
            let statusBgColor = "rgba(40, 167, 69, 0.1)";
            
            if (dbStatus === 'overtime') {
                status = "overtime";
                statusColor = "#FF6B6B";
                statusIcon = "fa-clock";
                statusText = "ทำ OT";
                statusBgColor = "rgba(255, 107, 107, 0.1)";
            } else if (dbStatus === 'offline' || dbStatus === 'off_duty') {
                status = "offline";
                statusColor = "#6c757d";
                statusIcon = "fa-power-off";
                statusText = "เลิกงาน";
                statusBgColor = "rgba(108, 117, 125, 0.1)";
            } else if (dbStatus === 'waiting_to_start') {
                status = "waiting_to_start";
                statusColor = "#FFC107";
                statusIcon = "fa-hourglass-start";
                statusText = "รอเข้างาน";
                statusBgColor = "rgba(255, 193, 7, 0.1)";
            } else if (dbStatus === 'on_break') {
                status = "on_break";
                statusColor = "#D68910";
                statusIcon = "fa-coffee";
                statusText = "พักเบรค";
                statusBgColor = "rgba(214, 137, 16, 0.1)";
            } else if (dbStatus === 'working') {
                status = "working";
                statusColor = "#0056B3";
                statusIcon = "fa-briefcase";
                statusText = "ทำงาน";
                statusBgColor = "rgba(0, 86, 179, 0.1)";
            }
            
            return { status, statusColor, statusIcon, statusText, statusBgColor };
        }
        
        // ✅ ไม่ต้องใช้ realtime calculation เพราะใช้ API อัพเดต database แล้ว
        // Display status อ่านจาก database โดยตรง (ผ่าน loadAllFloorsEnhancedNew)
        


       
        
    
    </script>
</body>
</html>