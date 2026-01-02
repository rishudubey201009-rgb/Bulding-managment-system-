# Due Decrease Feature - Documentation

## Overview
The system now supports **decreasing monthly dues** in addition to increasing them, with the same strict audit and validation controls.

---

## 🔽 How Due Decrease Works

### Access
**Admin Only** - Available in "Admin Settings" → "Modify Monthly Dues"

### Types of Decrease

#### 1. Global Decrease (All Members)
- Applies to entire building
- Reduces dues for all members by the same amount
- Requires mandatory reason
- Applied from effective month onwards

#### 2. Individual Decrease (Specific Member)
- Targets one specific member/flat
- Useful for special cases (discounts, senior citizens, etc.)
- Requires mandatory reason
- Member-specific application

---

## 📋 How to Decrease Dues

### Step-by-Step Process:

1. **Navigate to Admin Settings**
   - Click "Modify Monthly Dues" button

2. **Select Action**
   - Choose "Decrease Dues" from the action dropdown
   - Modal title changes to "Decrease Monthly Dues"

3. **Choose Type**
   - Select "Global" or "Individual Member"
   - If individual, select the member from dropdown

4. **Enter Decrease Amount**
   - System shows maximum allowable decrease
   - Cannot decrease below ₹0 (prevents negative dues)
   - Amount validation happens automatically

5. **Set Effective Date**
   - Select effective month and year
   - Decrease applies from this date forward
   - Does not affect past months

6. **Provide Reason (Mandatory)**
   - Clear explanation required
   - Max 200 characters
   - Examples:
     - "Annual discount for timely payments"
     - "Senior citizen discount - 65+ years"
     - "Temporary reduction due to ongoing repairs"
     - "Correction of previous overcharge"

7. **Submit**
   - Click "Apply Due Decrease"
   - System validates and applies changes
   - Confirmation message shown

---

## ⚠️ Important Rules

### Safety Validations:

1. **No Negative Dues**
   - System prevents decreases that would result in negative amounts
   - For global decrease: Cannot exceed base monthly fee (₹300)
   - For individual decrease: Cannot exceed current due amount

2. **Maximum Decrease Displayed**
   - When "Decrease Dues" is selected, a hint shows:
   - "Maximum decrease: ₹XXX"
   - This updates based on Global/Individual selection

3. **Prospective Application**
   - Decreases apply from effective date forward
   - Past months are NOT affected
   - Cannot retroactively reduce past dues

4. **Permanent Record**
   - All decreases logged in Due Change History
   - Shows as negative amount (e.g., "-₹50")
   - Cannot be deleted or edited

---

## 📊 Visual Indicators

### In Due Change History Table:

**Increase Entry:**
```
Type: [Global] [Increase]
Change Amount: +₹50
```

**Decrease Entry:**
```
Type: [Global] [Decrease]  
Change Amount: -₹50
```

**Badge Colors:**
- Increase: Green badge
- Decrease: Orange badge
- Global: Blue badge
- Individual: Gray badge

---

## 🧮 Accounting Logic

### Net Due Calculation:
```
Monthly Due = Base Amount + All Increases - All Decreases
```

### Example Scenarios:

**Scenario 1: Global Decrease**
- Base monthly fee: ₹300
- Previous increase: +₹50 (now ₹350)
- New decrease: -₹30
- **Result:** ₹320/month from effective date

**Scenario 2: Individual Discount**
- Member's current due: ₹350
- Individual decrease: -₹50
- **Result:** Member pays ₹300/month
- Others still pay ₹350

**Scenario 3: Multiple Changes**
- Base: ₹300
- Increase 1: +₹50 (Jan 2026)
- Increase 2: +₹25 (Mar 2026)
- Decrease 1: -₹20 (Jun 2026)
- **Result:** ₹355/month from June onwards

**Scenario 4: Cannot Go Negative**
- Current due: ₹300
- Attempt to decrease: -₹400
- **Result:** ❌ Error - "Maximum decrease allowed is ₹300"

---

## 🔐 Audit & Security

### What Gets Logged:
- Action: `DUE_DECREASE_GLOBAL` or `DUE_DECREASE_INDIVIDUAL`
- Timestamp with exact date/time
- Admin name who made the change
- Decrease amount
- Effective month and year
- Complete reason text
- Member IDs affected

### Audit Log Entry Example:
```json
{
  "action": "DUE_DECREASE_GLOBAL",
  "timestamp": "2026-01-15T10:30:00Z",
  "adminName": "Admin User",
  "details": {
    "decreaseAmount": 50,
    "effectiveMonth": 1,
    "effectiveYear": 2026,
    "reason": "Annual discount for early payments"
  }
}
```

---

## 💡 Use Cases

### When to Use Decrease:

1. **Bulk Discounts**
   - Annual payment discounts
   - Early payment incentives
   - Seasonal adjustments

2. **Special Categories**
   - Senior citizen discounts
   - Single occupant reductions
   - Financial hardship cases

3. **Corrections**
   - Fix previous overcharges
   - Adjust for service reductions
   - Temporary facility closures

4. **Promotional**
   - New member discounts
   - Referral benefits
   - Loyalty rewards

### When NOT to Use:

❌ **Don't use for:**
- One-time refunds (use advance credit instead)
- Payment adjustments (use manual payment entry)
- Temporary waivers (use advance credit or skip dues)
- Corrections to individual payments (adjust in payment history)

---

## 🎯 Best Practices

### Admin Guidelines:

1. **Be Specific in Reasons**
   - ✅ "Senior citizen discount - Age 70+"
   - ❌ "Discount"

2. **Document Decisions**
   - Keep meeting minutes for major decreases
   - Communicate changes to members in advance
   - Maintain consistency across similar cases

3. **Review Regularly**
   - Check Due Change History monthly
   - Verify decreases are still applicable
   - Update or revert as needed

4. **Communicate Clearly**
   - Announce decreases before implementation
   - Explain eligibility criteria
   - Provide clear end dates if temporary

---

## 🐛 Troubleshooting

### Common Issues:

**Issue:** Cannot decrease - amount too large
**Solution:** Check current due amount. System shows max allowed decrease. Reduce your decrease amount.

**Issue:** Decrease not showing in member's due
**Solution:** Verify effective date has passed. Decreases apply prospectively, not retroactively.

**Issue:** Want to reverse a decrease
**Solution:** Create an increase for the same amount with reason "Reversal of previous decrease"

**Issue:** Decrease applied to wrong member
**Solution:** Cannot undo directly. Create an increase to reverse, then apply correct decrease. Document in reasons.

---

## 📞 Support

For questions about due decreases:
1. Review this guide
2. Check Due Change History for similar cases
3. Verify in Audit Log
4. Test with individual member first before global changes

---

## 🔄 System Updates

**Feature Added:** January 2026
**Version:** 2.1
**Status:** Active and fully audited

---

**Remember:** All decreases are permanent in history and fully logged. Use responsibly and document thoroughly.
