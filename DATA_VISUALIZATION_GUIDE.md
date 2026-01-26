# 📊 Data Visualization Module Documentation

## 🎯 Overview
โมดูลนี้ประกอบด้วยฟังก์ชันต่างๆ สำหรับสร้างแผนภูมิ กราฟ และตัวบ่งชี้ข้อมูลต่างๆ ด้วยรูปแบบสวยงาม และเอนิเมชันที่ราบรื่น

**File**: `js/modules/15-data-visualization.js`

---

## 📦 Functions Available

### 1. 📊 Bar Chart
สร้างแผนภูมิแท่ง
```javascript
createBarChart(containerId, data, title)

// Parameters:
// - containerId (string): ID ของ HTML element เพื่อแสดง chart
// - data (array): ข้อมูล [{ label, value, max, color }]
// - title (string): ชื่อแผนภูมิ

// Example:
createBarChart('myChart', [
  { label: 'จันทร์', value: 45, max: 100, color: 'success' },
  { label: 'อังคาร', value: 72, max: 100, color: 'success' },
  { label: 'พุธ', value: 38, max: 100, color: 'warning' }
], '📊 การครอบครัวคนแบบรายวัน');
```

**Color Options**: `success`, `warning`, `danger`, `info`

---

### 2. ⏳ Progress Indicator
แสดงตัวบ่งชี้ความคืบหน้า
```javascript
createProgressIndicator(containerId, items)

// Parameters:
// - containerId (string): ID ของ container
// - items (array): [{ label, value, max, color }]

// Example:
createProgressIndicator('progress', [
  { label: 'ห้องว่าง', value: 85, max: 100, color: 'var(--success)' },
  { label: 'ความพึงพอใจ', value: 92, max: 100, color: 'var(--primary)' }
]);
```

---

### 3. 🍩 Donut Chart
สร้างแผนภูมิรูปโดนัท
```javascript
createDonutChart(containerId, data, title)

// Parameters:
// - containerId (string): ID ของ container
// - data (array): [{ label, value, color }]
// - title (string): ชื่อแผนภูมิ

// Example:
createDonutChart('donut', [
  { label: 'รอคิว', value: 45, color: '#3B82F6' },
  { label: 'กำลังทำ', value: 28, color: '#F59E0B' },
  { label: 'เสร็จสิ้น', value: 89, color: '#10B981' }
], '📊 สถานะผู้ป่วย');
```

---

### 4. 📈 Metric Cards
แสดงตัวเลขสำคัญพร้อมการเปลี่ยนแปลง
```javascript
createMetricCards(containerId, metrics)

// Parameters:
// - containerId (string): ID ของ container
// - metrics (array): [{ label, value, change, color }]
//   - change: ค่าความเปลี่ยนแปลง (บวก/ลบ)

// Example:
createMetricCards('metrics', [
  { label: 'ผู้ป่วยทั้งหมด', value: 256, change: 12, color: 'var(--primary)' },
  { label: 'อยู่ระหว่างรักษา', value: 48, change: -5, color: 'var(--warning)' },
  { label: 'เสร็จสิ้น', value: 189, change: 24, color: 'var(--success)' }
]);
```

---

### 5. 🔥 Heatmap
สร้างแผนที่ความร้อน
```javascript
createHeatmap(containerId, cells, title)

// Parameters:
// - containerId (string): ID ของ container
// - cells (array): [{ value, max, label }]
// - title (string): ชื่อ heatmap

// Example:
createHeatmap('heatmap', [
  { label: 'จันทร์', value: 45 },
  { label: 'อังคาร', value: 72 },
  { label: 'พุธ', value: 38 },
  { label: 'พฤหัสบดี', value: 91 }
], '📊 การใช้งานรายวัน');
```

---

### 6. 📅 Timeline
แสดงลำดับเหตุการณ์
```javascript
createTimeline(containerId, events)

// Parameters:
// - containerId (string): ID ของ container
// - events (array): [{ title, time, description }]

// Example:
createTimeline('timeline', [
  { title: 'เข้าระบบ', time: '08:30 AM', description: 'ผู้ป่วยลงทะเบียน' },
  { title: 'รอคิว', time: '08:45 AM', description: 'อยู่ในคิวรอตรวจ' },
  { title: 'เริ่มตรวจ', time: '09:15 AM', description: 'แพทย์เริ่มตรวจ' },
  { title: 'เสร็จสิ้น', time: '10:00 AM', description: 'เสร็จสิ้นการรักษา' }
]);
```

---

### 7. 📋 Stats Table
สร้างตารางสถิติ
```javascript
createStatsTable(containerId, columns, rows, title)

// Parameters:
// - containerId (string): ID ของ container
// - columns (array): [{ title, key }]
// - rows (array): ข้อมูลแถว
// - title (string): ชื่อตาราง

// Example:
createStatsTable('table', 
  [
    { title: 'สถานี', key: 'station' },
    { title: 'จำนวนผู้ป่วย', key: 'patients' }
  ],
  [
    { station: 'ICU', patients: 12 },
    { station: 'ER', patients: 8 }
  ],
  '📊 สรุปสถิติตามสถานี'
);
```

---

### 8. ⚡ Quick Stats
แสดงสถิติอย่างรวดเร็ว
```javascript
createQuickStats(containerId, stats)

// Parameters:
// - containerId (string): ID ของ container
// - stats (array): [{ icon, value, label, color }]

// Example:
createQuickStats('stats', [
  { icon: 'fa-hospital-user', value: '256', label: 'ผู้ป่วย', color: 'var(--primary)' },
  { icon: 'fa-user-nurse', value: '42', label: 'พยาบาล', color: 'var(--success)' },
  { icon: 'fa-bed', value: '28', label: 'ห้องว่าง', color: 'var(--info)' }
]);
```

---

### 9. 🟢 Status Indicator
สร้างตัวบ่งชี้สถานะ
```javascript
createStatusIndicator(status, label)

// Parameters:
// - status (string): 'online', 'offline', 'busy', 'unavailable'
// - label (string): ป้ายกำกับ (optional)

// Example:
createStatusIndicator('online', 'เชื่อมต่อ')
// Output: <span class="status-dot online"></span>เชื่อมต่อ
```

---

### 10. 📌 Empty State
สร้างหน้าแสดงเมื่อไม่มีข้อมูล
```javascript
createEmptyState(icon, title, description)

// Parameters:
// - icon (string): Font Awesome icon (e.g., 'fa-inbox')
// - title (string): ชื่อ
// - description (string): คำอธิบาย

// Example:
const html = createEmptyState('fa-inbox', 'ไม่มีข้อมูล', 'ยังไม่มีการเพิ่มข้อมูลเข้ามา');
document.getElementById('container').innerHTML = html;
```

---

## 🎨 CSS Classes

### Chart Container
```css
.chart-container { /* หลัก container สำหรับแผนภูมิ */ }
.chart-title { /* ชื่อแผนภูมิ */ }
```

### Bar Chart
```css
.bar-chart { /* ส่วน chart */ }
.bar-row { /* แถวของ bar */ }
.bar-label { /* ป้ายชื่อ */ }
.bar-container { /* โครงสร้าง bar */ }
.bar-fill { /* ส่วนที่เต็มของ bar */ }
.bar-fill.success { /* สีเขียว */ }
.bar-fill.warning { /* สีเหลือง */ }
.bar-fill.danger { /* สีแดง */ }
.bar-fill.info { /* สีฟ้า */ }
.bar-value { /* ค่าตัวเลข */ }
```

### Progress Indicator
```css
.progress-indicator { /* หลัก progress */ }
.progress-label { /* ป้ายชื่อ */ }
.progress-percent { /* เปอร์เซ็นต์ */ }
.progress-mini { /* โครงสร้าง progress bar */ }
.progress-mini-fill { /* ส่วนเต็ม */ }
```

### Metric Cards
```css
.metric-card { /* หลัก card */ }
.metric-card-value { /* ตัวเลขสำคัญ */ }
.metric-card-label { /* ป้ายชื่อ */ }
.metric-card-change { /* ส่วนการเปลี่ยนแปลง */ }
.metric-card-change.positive { /* บวก */ }
.metric-card-change.negative { /* ลบ */ }
```

### Status Indicators
```css
.status-dot { /* จุดสถานะ */ }
.status-dot.online { /* สถานะออนไลน์ */ }
.status-dot.offline { /* สถานะออฟไลน์ */ }
.status-dot.busy { /* สถานะไม่ว่าง */ }
.status-dot.unavailable { /* สถานะไม่สามารถใช้ได้ */ }
```

### Timeline
```css
.timeline { /* โครงสร้างหลัก */ }
.timeline-item { /* รายการเหตุการณ์ */ }
.timeline-content { /* เนื้อหา */ }
.timeline-title { /* ชื่อ */ }
.timeline-time { /* เวลา */ }
```

### Empty State
```css
.empty-state { /* หลัก empty state */ }
.empty-state-icon { /* ไอคอน */ }
.empty-state-title { /* ชื่อ */ }
.empty-state-desc { /* คำอธิบาย */ }
```

---

## 🎯 Color Utilities

### CSS Variables
```css
--primary: #0066CC           /* สีปฐมภูมิ (ฟ้า) */
--primary-light: #3399FF     /* ฟ้าอ่อน */
--primary-dark: #004A99      /* ฟ้าเข้ม */
--primary-lighter: #E6F0FF   /* ฟ้าอ่อนมาก */
--success: #10B981           /* สีเขียว */
--warning: #F59E0B           /* สีเหลือง */
--danger: #EF4444            /* สีแดง */
--info: #3B82F6              /* สีฟ้า */
```

### Getting Colors Programmatically
```javascript
const colors = getVisualizationColors(5); // ได้ array 5 สี
```

---

## 📱 Responsive Design

ทุก component ออกแบบให้ responsive:
- **Desktop**: เต็มขนาด
- **Tablet**: ขนาดปรับลด
- **Mobile**: Single column

---

## 🔧 Advanced Usage

### Custom Styling
```javascript
// ใช้ CSS classes สำหรับ custom styling
const customHTML = `
  <div class="chart-container" style="background: linear-gradient(...);">
    <div class="chart-title" style="color: ...;">Custom Title</div>
    <div id="custom-chart"></div>
  </div>
`;
```

### Combining Multiple Charts
```javascript
// สร้าง grid layout
const html = `
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
    <div id="chart1"></div>
    <div id="chart2"></div>
  </div>
`;
document.body.innerHTML = html;

createBarChart('chart1', data1, 'Chart 1');
createBarChart('chart2', data2, 'Chart 2');
```

### Dynamic Data Updates
```javascript
function updateChart(newData) {
  // ลบ element เก่า
  const container = document.getElementById('myChart');
  container.innerHTML = '';
  
  // สร้าง chart ใหม่
  createBarChart('myChart', newData, 'Updated Chart');
}
```

---

## 📊 Demo & Showcase

ดูตัวอย่างทั้งหมดได้ที่:
```
http://localhost/hospital/visualization-showcase.html
```

---

## 🐛 Troubleshooting

### Chart ไม่แสดง
- ตรวจสอบ ID ของ container ว่าถูกต้อง
- ตรวจสอบว่า element มีอยู่ใน DOM
- ดู browser console เพื่อหา error

### สี ไม่ถูกต้อง
- ใช้ CSS variable names ที่ถูก: `var(--primary)`, `var(--success)` เป็นต้น
- หรือใช้สี hex โดยตรง: `#0066CC`

### Responsive ไม่ทำงาน
- ตรวจสอบว่า viewport meta tag มีอยู่ใน HTML
- ใช้ media queries ที่ถูก

---

## 📝 License

Part of Hospital Management System v1.0

---

**Created**: January 26, 2026  
**Last Updated**: January 26, 2026
