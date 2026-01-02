# Building Management Dashboard

A comprehensive, interactive building management system for tracking member dues, payments, and financial overview.

## Features

### 1. Member Management
- Add new members with name, apartment number, contact info, and email
- View all members in an organized table
- Delete members when needed
- Duplicate apartment number validation

### 2. Automatic Monthly Dues
- **₹300 monthly maintenance fee per member**
- Automatically adds dues at the start of each month
- Tracks dues history for each member
- Handles missed months automatically
- No manual intervention required

### 3. Payment Tracking
- Easy payment recording through modal interface
- Select specific month for payment
- Partial payment support
- Complete payment history with dates
- Automatic dues reduction on payment

### 4. Dashboard Summary
- **Total Collected (Month)**: Current month's collections
- **Total Collected (Overall)**: All-time collections
- **Pending Dues (Month)**: Current month unpaid amount
- **Total Pending (Overall)**: Cumulative unpaid dues

### 5. Visual Charts
- **Bar Chart**: Last 6 months collection trends
- **Pie Chart**: Current month paid vs unpaid members distribution

### 6. Filters and Search
- Search by member name or apartment number
- Filter by payment status:
  - All Members
  - Paid Members
  - Unpaid Members
  - Overdue (2+ months)
- View modes:
  - Current Month: Shows only current month dues
  - Cumulative View: Shows all accumulated unpaid dues

### 7. Overdue Notifications
- Visual highlighting of members with 2+ months unpaid
- Warning badges for overdue accounts
- Pulsing animation for attention
- Automatic sorting by pending amount

## How to Use

### Getting Started
1. Open `index.html` in any modern web browser
2. The dashboard will initialize automatically
3. Data is stored locally in your browser (localStorage)

### Adding a Member
1. Fill in the "Add New Member" form:
   - Full Name (required)
   - Apartment Number (required, unique)
   - Contact Number (required)
   - Email Address (optional)
2. Click "Add Member"
3. Member is automatically assigned current month's dues (₹300)

### Recording a Payment
1. Find the member in the table
2. Click the "Pay" button
3. Modal opens showing:
   - Member details
   - Total pending amount
   - Unpaid months list
4. Enter payment amount (can be partial)
5. Select the month for which payment is made
6. Click "Confirm Payment"
7. Payment is recorded and dues are updated

### Viewing Reports
- **Dashboard Summary Cards**: Quick overview at the top
- **Monthly Collection Trends**: Bar chart showing last 6 months
- **Payment Status**: Pie chart showing current month's paid/unpaid ratio
- **Payment History Table**: Recent 10 transactions

### Filtering and Searching
- Use the search box to find specific members
- Use status filter dropdown to view specific groups
- Toggle between "Current Month" and "Cumulative View"

## Technical Details

### Technologies Used
- **HTML5**: Structure and layout
- **CSS3**: Styling with animations and responsive design
- **JavaScript (ES6+)**: Application logic
- **Chart.js**: Data visualization
- **LocalStorage**: Data persistence

### Data Storage
All data is stored in browser's localStorage:
- `buildingMembers`: Member information and dues history
- `paymentHistory`: All payment transactions
- `lastMonthlyUpdate`: Last dues update timestamp

### Automatic Dues System
- Runs on page load
- Checks if current month > last update month
- Adds ₹300 for each missed month
- Updates all members automatically
- Also runs every hour in background

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Any modern browser with ES6 support

## Key Features Explained

### 1. Monthly Dues Auto-Addition
The system automatically detects when a new month begins and adds ₹300 to each member's dues. This happens:
- When you first open the dashboard
- When a new month starts
- Automatically every hour (background check)

### 2. Dues History Tracking
Each member has a `duesHistory` array that tracks:
- Month/Year of the due
- Amount (₹300)
- Payment status (paid/unpaid)
- Partial payments made

### 3. Payment Flexibility
- Pay full amount at once
- Pay partially and complete later
- Select which specific month to pay for
- All payments are recorded with date/time

### 4. Overdue Detection
Members with 2 or more unpaid months are:
- Highlighted in yellow
- Marked with warning badge
- Sorted to top of the list
- Easily filterable

### 5. Two View Modes
- **Current Month**: Shows only this month's ₹300 dues status
- **Cumulative**: Shows total of all unpaid dues across all months

## Example Workflow

### Scenario 1: New Building Setup
1. Add all building members
2. Each gets ₹300 dues for current month
3. Record payments as received
4. Dashboard updates in real-time

### Scenario 2: Monthly Collection
1. New month starts → System auto-adds ₹300 to all members
2. Filter "Unpaid Members" to see who owes
3. Record payments as they come in
4. View collection trends in bar chart

### Scenario 3: Overdue Management
1. Filter by "Overdue (2+ Months)"
2. See highlighted members at top
3. Contact them for payment
4. Record payments when received

## Customization

### Change Monthly Fee
Edit line 3 in `app.js`:
```javascript
const MONTHLY_FEE = 300; // Change to your desired amount
```

### Modify Chart Time Range
Edit the `updateCharts()` function to show more/fewer months:
```javascript
for (let i = 5; i >= 0; i--) { // Change 5 to desired number of months - 1
```

## Data Management

### Export Data (Manual)
1. Open Browser Console (F12)
2. Type: `localStorage.getItem('buildingMembers')`
3. Copy and save the JSON output

### Import Data (Manual)
1. Open Browser Console (F12)
2. Type: `localStorage.setItem('buildingMembers', 'YOUR_JSON_DATA')`
3. Refresh the page

### Clear All Data
```javascript
localStorage.clear();
```
Then refresh the page.

## Troubleshooting

### Dues not auto-adding?
- Check browser console for errors
- Verify localStorage is enabled
- Try refreshing the page

### Charts not displaying?
- Ensure internet connection (Chart.js CDN)
- Check browser console for errors
- Verify browser supports Canvas API

### Payments not saving?
- Check localStorage quota (usually 5-10MB)
- Verify no browser extensions blocking storage
- Try incognito/private mode

## Future Enhancements
- Export to PDF/Excel
- Email notifications
- SMS reminders
- Bulk payment recording
- Custom report generation
- Multi-building support
- User authentication

## Support
For issues or questions, check:
1. Browser console for error messages
2. Ensure localStorage is enabled
3. Try a different browser
4. Clear cache and reload

---

**Version**: 1.0.0  
**Last Updated**: December 31, 2025  
**License**: Free to use and modify
