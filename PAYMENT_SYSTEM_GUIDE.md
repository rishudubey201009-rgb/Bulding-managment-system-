# 🏢 E39/40 PayTrack - Enhanced Payment Collection System

## Overview
This system has been enhanced with strict, auditable payment features that prioritize accuracy, transparency, and admin control.

---

## 🎯 Key Features

### 1️⃣ Payment Receipt Image Upload (Mandatory for Manual Payments)

**Member Functionality:**
- Members can upload payment receipt images (JPG, PNG, HEIC formats only)
- Maximum file size: 5MB
- One receipt per payment period
- Track receipt status: Pending, Approved, or Rejected

**Admin Functionality:**
- Review uploaded receipts with full details
- Approve receipts to process payment
- Reject receipts with mandatory reason selection
- Receipts are locked after approval (tamper-proof)

**Business Rules:**
- Payment does NOT clear dues until admin approves the receipt
- Duplicate receipts for same period are automatically prevented
- System validates file types and sizes before upload
- All receipt actions are logged in audit trail

---

### 2️⃣ Advance Payment Feature

**How It Works:**
- Members can make advance payments for future months
- Advance payments are stored as **credit balance**
- Credit balance automatically adjusts against future monthly dues
- No automatic refunds (admin-controlled only)

**Member Dashboard Shows:**
- Total advance balance amount
- Number of months covered by advance
- Payment history with advance status

**Admin Controls:**
- Record advance payments manually
- View all members with advance balances
- Apply advance credit to dues manually if needed
- Convert advance into regular dues

**Accounting Rules:**
- Overpayments automatically convert to advance credit
- Advance applies to oldest unpaid dues first
- No negative dues allowed
- Full transparency on advance usage

---

### 3️⃣ Admin-Controlled Due Increases

**Two Types of Increases:**

**A. Global Increase (All Members)**
- Applies to entire building
- Requires effective month and year
- Mandatory reason field
- Applied prospectively by default

**B. Individual Increase (Specific Member)**
- Target specific flat/member
- Same requirements as global
- Useful for special circumstances

**Due Change Requirements:**
- Effective month (when increase starts)
- Increase amount (₹)
- Mandatory reason (max 200 characters)
- Admin approval and timestamp

**History & Audit:**
- Complete due change history table
- Shows: Date, Type, Amount, Effective From, Reason, Admin Name
- Cannot be deleted (permanent record)
- All changes logged in audit trail

---

### 4️⃣ Accounting Logic (Non-Negotiable)

**Monthly Due Calculation:**
```
Monthly Due = Base Amount + Due Increases − Advance Credits
```

**Key Rules:**
1. **Overpayments:** Automatically convert to advance credit
2. **Partial Payments:** Allowed and tracked accurately
3. **No Negative Dues:** System prevents negative balances
4. **Advance Application:** Applied to oldest dues first (FIFO)
5. **Due Increases:** Applied from effective month onwards only

**Example Scenarios:**

**Scenario 1: Overpayment**
- Monthly due: ₹300
- Payment received: ₹500
- Result: ₹300 clears due, ₹200 becomes advance credit

**Scenario 2: Advance Credit Usage**
- Member has ₹900 advance credit
- Next 3 months automatically covered (₹300 × 3)
- Shows "3 months covered" on member dashboard

**Scenario 3: Due Increase**
- Base monthly fee: ₹300
- Admin increases by ₹50 from March 2026
- January & February dues: ₹300
- March onwards: ₹350

---

### 5️⃣ Dashboards

**Member Dashboard (Member View Only):**
- ✅ Current due amount
- ✅ Advance balance with months covered
- ✅ Pending receipts count
- ✅ Receipt upload form
- ✅ Receipt history with approval status
- ✅ Rejection reasons (if applicable)

**Admin Dashboard (Admin View Only):**
- ✅ Pending receipt approvals (with images)
- ✅ Advance balances per member
- ✅ Due increase history table
- ✅ Outstanding dues list
- ✅ Complete audit log access
- ✅ Admin settings panel

---

### 6️⃣ Security & Abuse Prevention

**Receipt Upload Security:**
- ✅ File type validation (only images allowed)
- ✅ File size limit (5MB maximum)
- ✅ Duplicate detection (same period)
- ✅ Locked after approval (cannot edit/delete)

**Audit Trail:**
- ✅ Every admin action logged with timestamp
- ✅ Tracks: Receipts, Advances, Due Changes
- ✅ Shows admin name and details
- ✅ Cannot be edited or deleted
- ✅ Filterable by action type

**Permission Controls:**
- ✅ Members can only upload receipts
- ✅ Members cannot approve/reject receipts
- ✅ Members cannot modify dues
- ✅ Members cannot access audit log
- ✅ All modification functions check admin role

---

## 🔐 User Roles & Permissions

### Admin Role
**Can Do:**
- Approve/reject payment receipts
- Record advance payments
- Increase dues (global or individual)
- View complete audit log
- Add/edit/delete members
- Record expenses
- View all financial data
- Change admin credentials

**Cannot Do:**
- Auto-approve receipts
- Make silent due changes (reason mandatory)
- Delete audit log entries

### Member Role
**Can Do:**
- Upload payment receipts
- View their payment dashboard
- See advance balance and months covered
- View receipt approval status
- Submit feedback/suggestions
- Vote on feedback

**Cannot Do:**
- Approve receipts
- Modify dues
- Record payments manually
- Access admin features
- View other members' data
- Delete approved receipts

---

## 📊 Data Schema

### Receipt Object
```javascript
{
    id: timestamp,
    memberId: number,
    month: number (0-11),
    year: number,
    amount: number,
    imageData: base64 string,
    fileName: string,
    fileSize: number,
    uploadTimestamp: ISO string,
    status: 'pending' | 'approved' | 'rejected',
    approvalTimestamp: ISO string,
    approvedBy: string,
    rejectionReason: string,
    rejectionNotes: string,
    locked: boolean
}
```

### Advance Payment Object
```javascript
{
    id: timestamp,
    memberId: number,
    memberName: string,
    apartment: string,
    amount: number,
    source: string,
    timestamp: ISO string,
    type: 'credit'
}
```

### Due Change Object
```javascript
{
    id: timestamp,
    type: 'global' | 'individual',
    memberIds: array,
    oldAmount: number,
    newAmount: number,
    increaseAmount: number,
    effectiveMonth: number (0-11),
    effectiveYear: number,
    reason: string,
    timestamp: ISO string,
    adminId: string,
    adminName: string
}
```

### Audit Log Object
```javascript
{
    id: timestamp,
    timestamp: ISO string,
    adminId: string,
    adminName: string,
    action: string,
    details: object
}
```

---

## 🚀 How to Use

### For Members:

**1. Login**
- Select "Member" role
- Enter your registered name and apartment number

**2. Upload Payment Receipt**
- Navigate to "My Payment Dashboard"
- Fill in payment month, year, and amount
- Select receipt image file
- Click "Upload Receipt"
- Wait for admin approval

**3. Check Receipt Status**
- View "My Receipt History" section
- See pending, approved, or rejected status
- Read rejection reasons if applicable

**4. View Advance Balance**
- Check dashboard for current advance balance
- See how many months are covered

### For Admins:

**1. Approve/Reject Receipts**
- Check "Pending Receipt Approvals" section
- Click on receipt image to view full size
- Verify payment details
- Click "Approve" or "Reject"
- For rejection, select reason from dropdown

**2. Record Advance Payment**
- Click "Admin Settings" → "Record Advance Payment"
- Select member from dropdown
- Enter advance amount
- Submit to add to member's credit balance

**3. Increase Dues**
- Click "Admin Settings" → "Increase Monthly Dues"
- Choose Global or Individual
- Enter increase amount
- Select effective month and year
- **MUST provide reason** (mandatory)
- Submit to apply increase

**4. View Audit Log**
- Click "Admin Settings" → "View Audit Log"
- Filter by action type (Receipt, Advance, Due)
- Review all admin actions with timestamps

**5. Manage Advance Balances**
- View "Advance Balance Summary" section
- See all members with advance credits
- Click "Apply to Dues" to manually apply advance

---

## ⚠️ Important Notes

### DO:
- ✅ Always provide clear reasons for due increases
- ✅ Review receipt images carefully before approval
- ✅ Check audit log regularly
- ✅ Communicate due increases to members in advance
- ✅ Verify payment amounts match receipt images

### DON'T:
- ❌ Approve unclear or suspicious receipts
- ❌ Make retroactive due changes without careful review
- ❌ Delete receipts after approval (system prevents this)
- ❌ Share admin credentials
- ❌ Approve receipts without verifying amount

---

## 🐛 Troubleshooting

**Receipt Upload Fails:**
- Check file format (must be JPG, PNG, or HEIC)
- Ensure file size is under 5MB
- Verify no duplicate receipt for same period

**Advance Not Showing:**
- Refresh the page
- Check member dashboard (not visible to admin)
- Verify advance payment was recorded

**Due Increase Not Applied:**
- Check effective month/year
- Ensure current date is after effective date
- Review due change history table

**Cannot Access Feature:**
- Verify you're logged in as admin
- Check role permissions
- Try logging out and back in

---

## 📞 Support

For issues or questions about the payment system:
1. Check this guide first
2. Review audit log for recent actions
3. Verify user role and permissions
4. Test with small amounts first

---

## 🔄 System Updates

**Version:** 2.0 Enhanced Payment System
**Last Updated:** January 2026
**Changes:** Added receipt uploads, advance payments, due increases, audit logging

---

## 📝 Best Practices

1. **Receipt Management:**
   - Review receipts within 24-48 hours
   - Always provide clear rejection reasons
   - Keep digital copies outside system as backup

2. **Advance Payments:**
   - Communicate with members about advance usage
   - Apply advances oldest-to-newest automatically
   - Monitor advance balance summary monthly

3. **Due Increases:**
   - Announce increases to members beforehand
   - Provide detailed reasons
   - Consider gradual increases over sudden jumps
   - Document decisions in meeting minutes

4. **Audit Trail:**
   - Review monthly for anomalies
   - Use for dispute resolution
   - Keep screenshots for important changes
   - Filter by action type for specific reviews

---

**Built with transparency, security, and accountability in mind.**
