# 📊 Dashboard Date Filtering - Quick Reference

## 🚀 Quick Start

### 1. Today's Data (Default)
```
Go to: 🔄 Live Dashboard tab
Click: 📅 Today button (default)
See: Today's patient metrics
```

### 2. View Yesterday
```
Click: 📅 Yesterday button
See: Yesterday's full data
```

### 3. Weekly View
```
Click: 📅 This Week button
See: Data from Monday to Today
```

### 4. Monthly View
```
Click: 📅 This Month button
See: Data from 1st of month to Today
```

### 5. Custom Date Range
```
Click: 📅 Custom Range button
Select: From date [YYYY-MM-DD]
Select: To date [YYYY-MM-DD]
Click: Apply Filter
See: Data for selected range
```

---

## 📱 UI Location

**In Live Dashboard Tab:**
```
[🏥 Hospital Dashboard Header]
    ↓
[Date Filter Controls - 5 Buttons]
    ↓
[Control Buttons: Start/Stop/Refresh]
    ↓
[5 Live Charts Updated with Filtered Data]
```

---

## 📈 What Each View Shows

| View | Period | Use Case |
|------|--------|----------|
| 📅 Today | Current date | Real-time monitoring |
| 📅 Yesterday | Previous day | Compare with today |
| 📅 This Week | Mon-Today | Weekly trends |
| 📅 This Month | 1st-Today | Monthly KPIs |
| 📅 Custom | User defined | Specific analysis |

---

## 💾 Data Displayed

All 5 charts update when you change filters:
1. **Patient Metrics** - 6 stat cards
   - Total, Waiting, Processing, Completed, Avg Wait, Max Wait

2. **Station Occupancy** - Bar chart
   - Patient count per station

3. **Status Distribution** - Donut chart
   - Waiting vs Processing vs Completed

4. **Service Times** - Progress bars
   - Average and maximum wait times

5. **Waiting Patients** - Table
   - Top 15 longest-waiting patients

---

## 🔗 API Changes

### Before:
```
/api/get_station_today_patients.php?station_id=60
→ Returns: Today's data only
```

### After:
```
/api/get_station_today_patients.php?station_id=60&date_from=2026-01-20&date_to=2026-01-27
→ Returns: 20-27 January data
```

### Parameters:
- `station_id` (required) - which station
- `date_from` (optional) - start date YYYY-MM-DD
- `date_to` (optional) - end date YYYY-MM-DD

---

## ⚙️ Technical Files Modified

### Frontend
- **main.php** (Lines 2679-2750)
  - Added date filter UI controls
  - Added CSS styling for buttons
  - Added validation feedback

- **main.php** (Lines 7305-7427)
  - Added date range calculation functions
  - Added view switching functions
  - Updated chart initialization with date filters

### Backend
- **api/get_station_today_patients.php**
  - Added `date_from` and `date_to` parameters
  - Updated SQL: `BETWEEN` instead of `=`
  - Added date validation

---

## 🧪 Testing Checklist

- [ ] Click "Today" button - shows today's data
- [ ] Click "Yesterday" button - shows yesterday's data
- [ ] Click "This Week" button - shows week data
- [ ] Click "This Month" button - shows month data
- [ ] Click "Custom" - date inputs appear
- [ ] Select custom dates and click "Apply" - data updates
- [ ] All 5 charts update when filter changes
- [ ] Charts auto-refresh every 5 seconds with current filter
- [ ] Click "Manual Refresh" - data refetches immediately
- [ ] Button styling shows active state
- [ ] Current view label updates correctly

---

## 📊 Example Queries

### Get today's data for Station 60:
```
GET /api/get_station_today_patients.php?station_id=60&date_from=2026-01-27&date_to=2026-01-27
```

### Get this month's data:
```
GET /api/get_station_today_patients.php?station_id=60&date_from=2026-01-01&date_to=2026-01-27
```

### Get custom range:
```
GET /api/get_station_today_patients.php?station_id=60&date_from=2026-01-20&date_to=2026-01-27
```

---

## 🎯 Button Layout

```
┌─────────┬──────────┬──────────┬──────────┬──────────┐
│ 📅 Today│ 📅 Yest  │ 📅 Week  │ 📅 Month │ 📅 Cust  │
└─────────┴──────────┴──────────┴──────────┴──────────┘
    ↑ Active (Blue)   Inactive (Light Blue)
```

---

## 🔄 Refresh Timing

**Auto Refresh:** Every 5 seconds
**When changing filters:** Instant (300ms delay for UI)
**Manual Refresh:** Click button, 1-2 seconds to fetch

---

## 💡 Tips

✅ Use "This Week" for trend analysis
✅ Use "This Month" for performance reports
✅ Use "Custom Range" to compare specific periods
✅ Click "Manual Refresh" if data seems stale
✅ Charts work with real patient data from database

---

## ❌ Common Issues

**Issue:** Data not updating
**Fix:** Click "Manual Refresh" or switch to another date filter

**Issue:** "Please select both dates" error
**Fix:** Ensure both From and To dates are filled

**Issue:** "Start date must be before end date" error
**Fix:** Select From date earlier than To date

**Issue:** No data shown for custom range
**Fix:** Check if data exists for that period in database

---

## 📞 Questions?

See full documentation: `DASHBOARD_DATE_FILTER_GUIDE.md`

---

**Version:** 1.0 | **Date:** Jan 27, 2026 | **Status:** ✅ Ready
