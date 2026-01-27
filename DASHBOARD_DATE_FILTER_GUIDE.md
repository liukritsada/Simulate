# 📅 Dashboard Date Filtering Guide

## Overview
Added **Date Filtering** capabilities to the Live Dashboard, allowing users to view patient data by different time periods:
- **Today** - Current date
- **Yesterday** - Previous day
- **This Week** - From start of week to today
- **This Month** - From first day of month to today
- **Custom Range** - User-defined date range

---

## 🎯 Features

### 1. Quick View Buttons
```
📅 Today     | 📅 Yesterday | 📅 This Week | 📅 This Month | 📅 Custom Range
```
- Click any button to instantly switch views
- Buttons highlight the active view
- Dashboard charts refresh with filtered data

### 2. Custom Date Range
- Select start and end dates
- Click "Apply Filter" to update dashboard
- Validation ensures start date ≤ end date

### 3. Current View Indicator
Shows active filter: `Current View: Today (2026-01-27)`

---

## 🔧 Frontend Implementation

### JavaScript Functions (in `main.php`)

#### 1. **getDateRange(view)**
Calculates date boundaries for predefined views:
```javascript
getDateRange('today')        // Returns today's date
getDateRange('yesterday')    // Returns yesterday's date
getDateRange('thisweek')     // Returns week start to today
getDateRange('thismonth')    // Returns month start to today
```

#### 2. **setDashboardView(view)**
Activates a view and refreshes dashboard:
```javascript
setDashboardView('today')           // Activate "Today" view
setDashboardView('thismonth')       // Activate "This Month" view
setDashboardView('custom')          // Show custom date inputs
```

**What it does:**
- Updates button styles to show active state
- Shows/hides custom date inputs
- Updates date filter variables
- Refreshes all charts with new date range

#### 3. **applyCustomDateRange()**
Applies user-selected date range:
```javascript
// User selects dates and clicks "Apply Filter"
// Function validates, updates filter, refreshes dashboard
```

#### 4. **getDashboardAPIUrl(baseUrl, dateFilter)**
Generates API URLs with date parameters:
```javascript
// Input:  'api/get_station_today_patients.php?station_id=60'
// Output: 'api/get_station_today_patients.php?station_id=60&date_from=2026-01-27&date_to=2026-01-27'
```

---

## 📡 Backend Implementation

### Updated API: `get_station_today_patients.php`

#### New Query Parameters
```
GET /api/get_station_today_patients.php?station_id=60&date_from=2026-01-27&date_to=2026-01-27
```

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `station_id` | int | Required | Station ID to filter |
| `date_from` | string | Today | Start date (YYYY-MM-DD) |
| `date_to` | string | date_from | End date (YYYY-MM-DD) |
| `department_ids` | string | Optional | Comma-separated dept IDs |

#### SQL Modifications
```sql
-- Before:
WHERE station_id = :station_id AND appointment_date = :today

-- After:
WHERE station_id = :station_id AND appointment_date BETWEEN :date_from AND :date_to
```

**Features:**
- Date range queries using `BETWEEN` for efficiency
- Backward compatible (defaults to single day if not specified)
- Named parameters for SQL injection prevention

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────┐
│  User clicks "This Month" button                     │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  setDashboardView('thismonth') called               │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  getDateRange('thismonth') returns:                  │
│  {startDate: '2026-01-01', endDate: '2026-01-27'}  │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  getDashboardAPIUrl() builds:                        │
│  /api/get_station_today_patients.php?               │
│    station_id=60&date_from=2026-01-01&              │
│    date_to=2026-01-27                               │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  Dashboard refreshes all 5 charts with new data      │
│  - Patient Metrics (updated counts)                  │
│  - Station Occupancy (updated bars)                  │
│  - Status Distribution (updated pie)                 │
│  - Service Times (updated progress)                  │
│  - Waiting Patients (updated table)                  │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 UI Components

### Date Filter Controls Layout
```
┌────────────────────────────────────────────────────────────┐
│ 📅 Today | 📅 Yesterday | 📅 Week | 📅 Month | 📅 Custom  │
│                                                              │
│ [HIDDEN BY DEFAULT - Shows only when "Custom" selected]     │
│ From: [YYYY-MM-DD]  To: [YYYY-MM-DD]  [Apply Filter]       │
│                                                              │
│ Current View: 📅 Today (2026-01-27)                        │
└────────────────────────────────────────────────────────────┘
```

### Button States
- **Active**: `gradient(135deg, #0056B3 0%, #003d82 100%)` + white text
- **Inactive**: `rgba(0,86,179,0.2)` + dark text

---

## 📋 Usage Examples

### Example 1: View Today's Data
```javascript
// Automatic on page load
setDashboardView('today');
// → Shows: Today's patients, wait times, station efficiency
```

### Example 2: Compare Monthly Performance
```javascript
// Click "📅 This Month" button
setDashboardView('thismonth');
// → Shows: Entire month's data
// → Dashboard shows aggregated metrics for all 27 days
```

### Example 3: Custom Date Range
```javascript
// 1. Click "📅 Custom Range" button
setDashboardView('custom');

// 2. User selects dates:
document.getElementById('dashboardDateFrom').value = '2026-01-20';
document.getElementById('dashboardDateTo').value = '2026-01-27';

// 3. Click "Apply Filter" button
applyCustomDateRange();
// → Shows: Data from Jan 20-27
```

---

## 🔄 Data Refresh Behavior

### Automatic Refresh
- Charts update every 5 seconds (existing feature)
- Each refresh uses current date filter

### Manual Refresh
- Click "Manual Refresh" button
- Refetches data with current filter applied

### When Changing Filters
1. Stop all existing charts
2. Wait 300ms (UI transition)
3. Restart charts with new date range
4. Reset polling interval to 5 seconds

---

## 📈 Available Metrics by Period

### Daily View (Today)
- Real-time patient count
- Current wait times
- Active vs completed procedures
- Station utilization

### Weekly View
- Daily average metrics
- Busiest days identification
- Weekly trend patterns
- Cumulative wait times

### Monthly View
- Monthly performance metrics
- Peak vs low periods
- Monthly efficiency trends
- Long-term patterns

### Custom Range
- Flexible period analysis
- Before/after comparisons
- Specific event tracking
- Performance benchmarking

---

## 🛠️ Technical Details

### State Variables
```javascript
let dashboardCurrentView = 'today';          // Current active view
let dashboardDateFilter = {                  // Current date range
    startDate: '2026-01-27',
    endDate: '2026-01-27',
    label: '📅 Today (2026-01-27)'
};
```

### Chart Update Flow
```javascript
// When filter changes:
realtimeDashboard.stopAllCharts();           // Stop existing polls
setTimeout(() => {                            // Wait for cleanup
    realtimeDashboard.startAllCharts();      // Restart with new URLs
}, 300);
```

### API Response Enhancement
```php
// Old response:
// Patients from single day (appointment_date = $today)

// New response:
// Patients from date range (appointment_date BETWEEN $date_from AND $date_to)
// Same data structure, just different time period
```

---

## ✅ Benefits

### For Hospital Staff
✅ View historical patient data
✅ Analyze trends by time period
✅ Compare performance metrics
✅ Generate time-based reports

### For Administrators
✅ Track long-term efficiency
✅ Identify busy periods
✅ Forecast resource needs
✅ Monitor performance KPIs

### For System
✅ Backward compatible
✅ No database schema changes
✅ Efficient date-range queries
✅ Reuses existing chart logic

---

## 🚀 Default Behavior

**On Page Load:**
- Date filter automatically set to "Today"
- All 5 dashboard charts initialize
- Today's patient data loads and refreshes

**User's First Action:**
- Can immediately switch to another time period
- Or use custom date range for specific analysis

---

## 🐛 Error Handling

### Invalid Date Range
```
"Please select both dates" - If from or to date missing
"Start date must be before end date" - If validation fails
```

### No Data Found
- Charts show empty state
- Message: "No patient data found for selected period"
- User can try different date range

### API Errors
- Console logs error details
- UI shows loading indicator
- Automatic retry on next 5-second refresh

---

## 📝 Future Enhancements

1. **Preset Ranges**
   - Last 7 days
   - Last 30 days
   - Last 90 days
   - Year-to-date

2. **Export Features**
   - Export data as CSV
   - Generate PDF reports
   - Email scheduled reports

3. **Comparisons**
   - Compare two date ranges side-by-side
   - Year-over-year analysis
   - Month-over-month trends

4. **Predictions**
   - Trend forecasting
   - Anomaly detection
   - Pattern analysis

---

## 📞 Support

For issues or questions:
1. Check browser console for errors: `F12 → Console`
2. Verify API responses: `F12 → Network → get_station_today_patients.php`
3. Check date format: Must be `YYYY-MM-DD`
4. Ensure station_id is valid

---

**Last Updated:** January 27, 2026
**Version:** 1.0
**Status:** ✅ Production Ready
