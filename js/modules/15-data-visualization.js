/**
 * 📊 DATA VISUALIZATION MODULE
 * ฟังก์ชันสำหรับสร้าง charts, graphs, และ data displays
 * 
 * Functions:
 * - createBarChart()
 * - createProgressBar()
 * - createDonutChart()
 * - createStatusIndicator()
 * - createMetricCard()
 */

// ========================================
// 📊 BAR CHART BUILDER
// ========================================

/**
 * สร้าง Bar Chart HTML
 * @param {string} containerId - ID ของ container
 * @param {Array} data - [{ label, value, max }]
 * @param {string} title - ชื่อ chart
 */
function createBarChart(containerId, data, title) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `<div class="chart-container">`;
    if (title) {
        html += `<div class="chart-title">${title}</div>`;
    }
    
    html += `<div class="bar-chart">`;
    
    data.forEach(item => {
        const percentage = item.max ? (item.value / item.max) * 100 : 0;
        const colorClass = item.color || 'success';
        
        html += `
            <div class="bar-row">
                <div class="bar-label">${item.label}</div>
                <div class="bar-container">
                    <div class="bar-fill ${colorClass}" style="width: ${percentage}%">
                        ${Math.round(percentage)}%
                    </div>
                </div>
                <div class="bar-value">${item.value}</div>
            </div>
        `;
    });
    
    html += `</div></div>`;
    container.innerHTML = html;
}

// ========================================
// ⏳ PROGRESS INDICATOR
// ========================================

/**
 * สร้าง Progress Indicator
 * @param {string} containerId - ID ของ container
 * @param {Array} items - [{ label, value, max, color }]
 */
function createProgressIndicator(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';
    
    items.forEach(item => {
        const percentage = item.max ? (item.value / item.max) * 100 : 0;
        
        html += `
            <div class="progress-indicator">
                <div class="progress-label">${item.label}</div>
                <div class="progress-percent">${Math.round(percentage)}%</div>
                <div class="progress-mini">
                    <div class="progress-mini-fill" style="width: ${percentage}%; background: linear-gradient(90deg, ${item.color || 'var(--primary)'}, ${item.color || 'var(--primary-light)'})"></div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ========================================
// 🍩 DONUT CHART
// ========================================

/**
 * สร้าง SVG Donut Chart
 * @param {string} containerId - ID ของ container
 * @param {Array} data - [{ label, value, color }]
 * @param {string} title - ชื่อ chart
 */
function createDonutChart(containerId, data, title) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    
    // สร้าง SVG
    let svg = `<svg viewBox="0 0 200 200" style="width: 200px; height: 200px;">`;
    
    data.forEach(item => {
        const sliceAngle = (item.value / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;
        
        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;
        
        const x1 = 100 + 70 * Math.cos(startRad);
        const y1 = 100 + 70 * Math.sin(startRad);
        const x2 = 100 + 70 * Math.cos(endRad);
        const y2 = 100 + 70 * Math.sin(endRad);
        
        const largeArc = sliceAngle > 180 ? 1 : 0;
        
        const path = `M100,100 L${x1},${y1} A70,70 0 ${largeArc},1 ${x2},${y2} Z`;
        
        svg += `
            <path d="${path}" fill="${item.color || 'var(--primary)'}" stroke="white" stroke-width="2" 
                  style="cursor:pointer;transition:all 0.3s;" 
                  onmouseover="this.style.opacity='0.8'" 
                  onmouseout="this.style.opacity='1'" />
        `;
        
        currentAngle = endAngle;
    });
    
    svg += `</svg>`;
    
    // สร้าง Legend
    let legend = `<div class="donut-legend">`;
    data.forEach(item => {
        const percentage = ((item.value / total) * 100).toFixed(1);
        legend += `
            <div class="legend-item">
                <div class="legend-color" style="background: ${item.color || 'var(--primary)'}"></div>
                <div>
                    <div style="font-weight: 700;">${item.label}</div>
                    <div style="font-size: 0.8rem; color: var(--text-light);">${item.value} (${percentage}%)</div>
                </div>
            </div>
        `;
    });
    legend += `</div>`;
    
    let html = `<div class="chart-container">`;
    if (title) html += `<div class="chart-title">${title}</div>`;
    html += `
        <div class="donut-chart">
            <div class="donut-svg-container">${svg}</div>
            ${legend}
        </div>
    </div>`;
    
    container.innerHTML = html;
}

// ========================================
// 📈 METRIC CARD
// ========================================

/**
 * สร้าง Metric Card
 * @param {string} containerId - ID ของ container
 * @param {Array} metrics - [{ title, value, change, color }]
 */
function createMetricCards(containerId, metrics) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">';
    
    metrics.forEach(metric => {
        const isPositive = metric.change >= 0;
        const changeColor = isPositive ? 'positive' : 'negative';
        const changeSymbol = isPositive ? '↑' : '↓';
        
        html += `
            <div class="metric-card" style="border-left: 4px solid ${metric.color || 'var(--primary)'}">
                <div class="metric-card-label">${metric.label}</div>
                <div class="metric-card-value">${metric.value}</div>
                ${metric.change !== undefined ? `
                    <div class="metric-card-change ${changeColor}">
                        ${changeSymbol} ${Math.abs(metric.change)}%
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ========================================
// 🟢 STATUS INDICATOR
// ========================================

/**
 * สร้าง Status Indicator
 * @param {string} status - 'online', 'offline', 'busy', 'unavailable'
 * @returns {string} HTML
 */
function createStatusIndicator(status, label = '') {
    const statusMap = {
        'online': { dot: 'status-dot online', text: 'เชื่อมต่อ' },
        'offline': { dot: 'status-dot offline', text: 'ออฟไลน์' },
        'busy': { dot: 'status-dot busy', text: 'ไม่ว่าง' },
        'unavailable': { dot: 'status-dot unavailable', text: 'ไม่สามารถใช้ได้' }
    };
    
    const config = statusMap[status] || statusMap['offline'];
    
    return `
        <span class="${config.dot}"></span>
        ${label || config.text}
    `;
}

// ========================================
// 📊 TABLE STATISTICS
// ========================================

/**
 * สร้าง Stats Table
 * @param {string} containerId - ID ของ container
 * @param {Array} columns - [{ title, key }]
 * @param {Array} rows - ข้อมูลแถว
 * @param {string} title - ชื่อ table
 */
function createStatsTable(containerId, columns, rows, title) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `<div class="chart-container">`;
    if (title) html += `<div class="chart-title">${title}</div>`;
    
    html += `<table class="stats-table">
        <thead>
            <tr>
                ${columns.map(col => `<th>${col.title}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${rows.map(row => `
                <tr>
                    ${columns.map(col => `<td>${row[col.key] || '-'}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table></div>`;
    
    container.innerHTML = html;
}

// ========================================
// 🔥 HEATMAP
// ========================================

/**
 * สร้าง Heatmap
 * @param {string} containerId - ID ของ container
 * @param {Array} cells - [{ value, max, label }]
 * @param {string} title - ชื่อ heatmap
 */
function createHeatmap(containerId, cells, title) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const max = Math.max(...cells.map(c => c.value));
    
    let html = `<div class="chart-container">`;
    if (title) html += `<div class="chart-title">${title}</div>`;
    
    html += `<div class="heatmap-grid">`;
    
    cells.forEach(cell => {
        const level = Math.ceil((cell.value / max) * 4);
        html += `
            <div class="heatmap-cell level-${level}" title="${cell.label || ''}: ${cell.value}">
                ${cell.value}
            </div>
        `;
    });
    
    html += `</div></div>`;
    container.innerHTML = html;
}

// ========================================
// 📅 TIMELINE
// ========================================

/**
 * สร้าง Timeline
 * @param {string} containerId - ID ของ container
 * @param {Array} events - [{ title, time, description }]
 */
function createTimeline(containerId, events) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `<div class="timeline">`;
    
    events.forEach(event => {
        html += `
            <div class="timeline-item">
                <div class="timeline-content">
                    <div class="timeline-title">${event.title}</div>
                    <div class="timeline-time">${event.time}</div>
                    ${event.description ? `<div style="margin-top: 4px; font-size: 0.85rem;">${event.description}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

// ========================================
// 🎯 EMPTY STATE
// ========================================

/**
 * สร้าง Empty State
 * @param {string} icon - Font Awesome icon
 * @param {string} title - ชื่อ
 * @param {string} description - คำอธิบาย
 * @returns {string} HTML
 */
function createEmptyState(icon, title, description) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="empty-state-title">${title}</div>
            <div class="empty-state-desc">${description}</div>
        </div>
    `;
}

// ========================================
// 📊 QUICK STATS DISPLAY
// ========================================

/**
 * สร้าง Quick Stats (ชั้นเดียว)
 * @param {string} containerId - ID ของ container
 * @param {Array} stats - [{ icon, value, label, color }]
 */
function createQuickStats(containerId, stats) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">';
    
    stats.forEach(stat => {
        html += `
            <div class="stat-card" style="border-left-color: ${stat.color || 'var(--primary)'}">
                <div style="font-size: 1.5rem; margin-bottom: 8px;">
                    <i class="fas ${stat.icon}"></i>
                </div>
                <div class="stat-card .stat-value" style="color: ${stat.color || 'var(--primary)'};">
                    ${stat.value}
                </div>
                <div class="stat-card .stat-label">${stat.label}</div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ========================================
// 🎨 UTILITY: ได้ COLOR ตามจำนวน
// ========================================

/**
 * สร้าง Array ของสี
 */
function getVisualizationColors(count = 5) {
    const colors = [
        'var(--primary)',
        'var(--success)',
        'var(--warning)',
        'var(--danger)',
        'var(--info)',
        '#8B5CF6',
        '#EC4899',
        '#F97316'
    ];
    
    return colors.slice(0, count);
}

// Export for use
console.log('✅ Data Visualization Module loaded');
