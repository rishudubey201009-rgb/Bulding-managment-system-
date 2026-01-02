// Building Management Dashboard - Main Application
// Constants
const MONTHLY_FEE = 300;
const STORAGE_KEYS = {
    MEMBERS: 'buildingMembers',
    PAYMENTS: 'paymentHistory',
    EXPENSES: 'buildingExpenses',
    LAST_UPDATE: 'lastMonthlyUpdate',
    FEEDBACK: 'communityFeedback',
    ADMIN_CREDENTIALS: 'adminCredentials',
    RECEIPTS: 'paymentReceipts',
    ADVANCE_PAYMENTS: 'advancePayments',
    DUE_CHANGES: 'dueChangeHistory',
    AUDIT_LOG: 'auditLog'
};

// Receipt status constants
const RECEIPT_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

// Rejection reasons
const REJECTION_REASONS = [
    'Unclear image',
    'Amount mismatch',
    'Wrong payment details',
    'Duplicate receipt',
    'Invalid payment proof',
    'Other (specify in notes)'
];

// State Management
let members = [];
let paymentHistory = [];
let expenses = [];
let feedback = [];
let receipts = [];
let advancePayments = [];
let dueChangeHistory = [];
let auditLog = [];
let barChart = null;
let pieChart = null;
let currentUser = null;
let adminCredentials = null;

// Get admin credentials from localStorage or use defaults
function getAdminCredentials() {
    const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_CREDENTIALS);
    if (stored) {
        return JSON.parse(stored);
    }
    // Default credentials
    return {
        username: 'admin',
        password: 'admin123'
    };
}

// Save admin credentials
function saveAdminCredentials(credentials) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_CREDENTIALS, JSON.stringify(credentials));
}

// Check authentication
function checkAuth() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(loggedInUser);
}

// Logout function
function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}

// Apply role-based access control
function applyRoleBasedAccess(role) {
    console.log('Applying role-based access for:', role);
    
    if (role === 'member') {
        // Hide sections members shouldn't see
        const hiddenSections = [
            '.member-management',
            '.payment-history',
            '#adminSettings',
            '#dueIncreaseHistory',
            '#advanceBalanceSummary',
            '.dashboard-summary .stat-card:nth-child(1)', // Monthly collected
            '.dashboard-summary .stat-card:nth-child(2)', // Total collected
            '.dashboard-summary .stat-card:nth-child(4)', // Net balance
        ];
        
        hiddenSections.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) element.style.display = 'none';
        });
        
        // Show member dashboard
        const memberDashboard = document.querySelector('#memberPaymentDashboard');
        if (memberDashboard) memberDashboard.style.display = 'block';
        
        // Hide specific forms and action buttons - but NOT feedback form or receipt upload
        const readOnlyElements = [
            '.form-container', // Member and expense forms
            '.expense-form',
            '.action-btn',
            'button[onclick*="openPaymentModal"]',
            'button[onclick*="editMember"]',
            'button[onclick*="deleteMember"]',
            'button[onclick*="deleteExpense"]',
            'th:last-child', // Hide Actions column header
            'td:last-child', // Hide Actions column cells
        ];
        
        readOnlyElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.display = 'none';
                el.disabled = true;
            });
        });
        
        // Hide the "Add Expense" form section completely
        const expenseManagementSection = document.querySelector('.expense-management');
        if (expenseManagementSection) {
            const formContainer = expenseManagementSection.querySelector('.form-container');
            if (formContainer) {
                formContainer.style.display = 'none';
            }
        }
        
        // Make specific inputs disabled (but NOT feedback form or receipt upload inputs)
        document.querySelectorAll('input, select, textarea, button').forEach(input => {
            // Allow feedback form, filter controls, and receipt upload
            if (input.id !== 'searchInput' && 
                input.id !== 'statusFilter' && 
                input.id !== 'viewMode' && 
                input.id !== 'expenseMonthFilter' && 
                input.id !== 'expenseCategoryFilter' &&
                input.id !== 'feedbackType' &&
                input.id !== 'feedbackTitle' &&
                input.id !== 'feedbackDescription' &&
                input.id !== 'feedbackTypeFilter' &&
                input.id !== 'feedbackSortFilter' &&
                input.id !== 'receiptMonth' &&
                input.id !== 'receiptYear' &&
                input.id !== 'receiptAmount' &&
                input.id !== 'receiptImage' &&
                !input.classList.contains('logout-btn') &&
                !input.classList.contains('submit-feedback-btn') &&
                !input.classList.contains('submit-receipt-btn') &&
                !input.classList.contains('vote-btn') &&
                !input.classList.contains('delete-feedback-btn') &&
                input.form?.id !== 'uploadReceiptForm') {
                input.disabled = true;
            }
        });
        
        // Members can only see expenses and their payment dues
        document.getElementById('userName').textContent = 'Member (View Only)';
    } else {
        // Admin has full access
        document.getElementById('userName').textContent = 'Admin';
        
        // Hide member-specific sections
        const memberDashboard = document.querySelector('#memberPaymentDashboard');
        if (memberDashboard) memberDashboard.style.display = 'none';
        
        // Show admin sections
        setTimeout(() => {
            const adminSections = [
                '#adminSettings',
                '#receiptApprovals',
                '#dueIncreaseHistory',
                '#advanceBalanceSummary'
            ];
            
            adminSections.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.style.cssText = 'display: block !important; padding: 30px;';
                }
            });
        }, 100);
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    currentUser = checkAuth();
    if (!currentUser) return;
    
    adminCredentials = getAdminCredentials();
    
    loadData();
    checkAndAddMonthlyDues();
    setupEventListeners();
    renderMembers();
    renderExpenses();
    updateDashboard();
    initializeCharts();
    populateMonthDropdown();
    setDefaultExpenseDate();
    renderFeedback();
    renderPendingReceipts();
    renderDueChangeHistory();
    renderAdvanceBalances();
    renderMemberDashboard();
    populateReceiptYearDropdown();
    populateReceiptMonthDropdown();
    applyRoleBasedAccess(currentUser.role);
});

// Load data from localStorage
function loadData() {
    const storedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    const storedPayments = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    const storedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const storedFeedback = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    const storedReceipts = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
    const storedAdvancePayments = localStorage.getItem(STORAGE_KEYS.ADVANCE_PAYMENTS);
    const storedDueChanges = localStorage.getItem(STORAGE_KEYS.DUE_CHANGES);
    const storedAuditLog = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
    
    members = storedMembers ? JSON.parse(storedMembers) : [];
    paymentHistory = storedPayments ? JSON.parse(storedPayments) : [];
    expenses = storedExpenses ? JSON.parse(storedExpenses) : [];
    feedback = storedFeedback ? JSON.parse(storedFeedback) : [];
    receipts = storedReceipts ? JSON.parse(storedReceipts) : [];
    advancePayments = storedAdvancePayments ? JSON.parse(storedAdvancePayments) : [];
    dueChangeHistory = storedDueChanges ? JSON.parse(storedDueChanges) : [];
    auditLog = storedAuditLog ? JSON.parse(storedAuditLog) : [];
}

// Save data to localStorage
function saveData() {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(paymentHistory));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedback));
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
    localStorage.setItem(STORAGE_KEYS.ADVANCE_PAYMENTS, JSON.stringify(advancePayments));
    localStorage.setItem(STORAGE_KEYS.DUE_CHANGES, JSON.stringify(dueChangeHistory));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(auditLog));
}

// Check and add monthly dues automatically
function checkAndAddMonthlyDues() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
    
    if (!lastUpdate) {
        // First time setup - initialize dues for current month
        members.forEach(member => {
            if (!member.duesHistory) {
                member.duesHistory = [];
            }
            addDuesForMonth(member, currentYear, currentMonth);
        });
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, `${currentYear}-${currentMonth}`);
        saveData();
        return;
    }
    
    const [lastYear, lastMonth] = lastUpdate.split('-').map(Number);
    
    // Check if we need to add dues for new months
    if (currentYear > lastYear || (currentYear === lastYear && currentMonth > lastMonth)) {
        // Add dues for all missed months
        members.forEach(member => {
            if (!member.duesHistory) {
                member.duesHistory = [];
            }
            
            let year = lastYear;
            let month = lastMonth + 1;
            
            while (year < currentYear || (year === currentYear && month <= currentMonth)) {
                if (month > 11) {
                    month = 0;
                    year++;
                }
                
                addDuesForMonth(member, year, month);
                month++;
            }
        });
        
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, `${currentYear}-${currentMonth}`);
        saveData();
    }
}

// Add dues for a specific month
function addDuesForMonth(member, year, month) {
    const monthKey = `${year}-${month}`;
    const existingDue = member.duesHistory.find(due => due.month === monthKey);
    
    if (!existingDue) {
        member.duesHistory.push({
            month: monthKey,
            amount: MONTHLY_FEE,
            paid: false,
            paidAmount: 0
        });
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Check if user is member before allowing form submissions
    const isMember = currentUser && currentUser.role === 'member';
    
    // Add Member Form
    document.getElementById('addMemberForm').addEventListener('submit', (e) => {
        if (isMember) {
            e.preventDefault();
            alert('Members do not have permission to add data.');
            return;
        }
        handleAddMember(e);
    });
    
    // Add Expense Form
    document.getElementById('addExpenseForm').addEventListener('submit', (e) => {
        if (isMember) {
            e.preventDefault();
            alert('Members do not have permission to add data.');
            return;
        }
        handleAddExpense(e);
    });
    
    // Expense Image Preview
    document.getElementById('expenseImage').addEventListener('change', function() {
        previewExpenseImage(this);
    });
    
    // Search and Filters
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('viewMode').addEventListener('change', renderMembers);
    
    // Expense Filters
    document.getElementById('expenseMonthFilter').addEventListener('change', renderExpenses);
    document.getElementById('expenseCategoryFilter').addEventListener('change', renderExpenses);
    
    // Feedback Form and Filters
    document.getElementById('feedbackForm').addEventListener('submit', handleFeedbackSubmit);
    document.getElementById('feedbackTypeFilter').addEventListener('change', renderFeedback);
    document.getElementById('feedbackSortFilter').addEventListener('change', renderFeedback);
    
    // New Payment System Forms
    const dueIncreaseForm = document.getElementById('dueIncreaseForm');
    if (dueIncreaseForm) {
        dueIncreaseForm.addEventListener('submit', handleDueIncreaseSubmit);
    }
    
    const advancePaymentForm = document.getElementById('advancePaymentForm');
    if (advancePaymentForm) {
        advancePaymentForm.addEventListener('submit', handleAdvancePaymentSubmit);
    }
    
    const uploadReceiptForm = document.getElementById('uploadReceiptForm');
    if (uploadReceiptForm) {
        uploadReceiptForm.addEventListener('submit', handleReceiptUpload);
    }
    
    // Reset Data Form
    const resetDataForm = document.getElementById('resetDataForm');
    if (resetDataForm) {
        resetDataForm.addEventListener('submit', handleResetData);
    }
    
    // Modal
    document.querySelector('.close').addEventListener('click', closePaymentModal);
    document.getElementById('paymentForm').addEventListener('submit', (e) => {
        if (isMember) {
            e.preventDefault();
            alert('Members do not have permission to make payments.');
            return;
        }
        handlePayment(e);
    });
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('paymentModal');
        if (e.target === modal) {
            closePaymentModal();
        }
    });
}

// Handle Add Member
function handleAddMember(e) {
    e.preventDefault();
    
    // Check permission
    if (currentUser.role !== 'admin') {
        alert('Only admins can add members.');
        return;
    }
    
    const name = document.getElementById('memberName').value.trim();
    const apartment = document.getElementById('apartmentNumber').value.trim();
    const contact = document.getElementById('contactInfo').value.trim();
    const email = document.getElementById('emailInfo').value.trim();
    
    // Check for duplicate apartment
    if (members.some(m => m.apartment === apartment)) {
        alert('A member with this apartment number already exists!');
        return;
    }
    
    const newMember = {
        id: Date.now(),
        name,
        apartment,
        contact,
        email,
        duesHistory: [],
        createdAt: new Date().toISOString()
    };
    
    // Add current month's dues
    const now = new Date();
    addDuesForMonth(newMember, now.getFullYear(), now.getMonth());
    
    members.push(newMember);
    saveData();
    
    // Reset form
    e.target.reset();
    
    renderMembers();
    updateDashboard();
    updateCharts();
    
    alert('Member added successfully!');
}

// Delete Member
function deleteMember(id) {
    // Check permission
    if (currentUser.role !== 'admin') {
        alert('Only admins can delete members.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this member?')) {
        return;
    }
    
    members = members.filter(m => m.id !== id);
    saveData();
    
    renderMembers();
    updateDashboard();
    updateCharts();
}

// Open Payment Modal
function openPaymentModal(memberId) {
    // Check permission
    if (currentUser.role !== 'admin') {
        alert('Only admins can record payments.');
        return;
    }
    
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const unpaidDues = member.duesHistory.filter(due => !due.paid);
    const totalPending = unpaidDues.reduce((sum, due) => sum + (due.amount - due.paidAmount), 0);
    
    document.getElementById('paymentMemberId').value = memberId;
    document.getElementById('paymentAmount').value = totalPending;
    document.getElementById('paymentAmount').max = totalPending;
    
    const joinDate = new Date(member.createdAt);
    const oldestUnpaidDue = unpaidDues.length > 0 ? unpaidDues[unpaidDues.length - 1] : null;
    let dueFromDate = '';
    
    if (oldestUnpaidDue) {
        const [year, month] = oldestUnpaidDue.month.split('-');
        const fromDate = new Date(year, month, 1);
        dueFromDate = fromDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    
    document.getElementById('memberPaymentInfo').innerHTML = `
        <p><strong>Name:</strong> ${member.name}</p>
        <p><strong>Apartment:</strong> ${member.apartment}</p>
        <p><strong>Member Since:</strong> ${joinDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p><strong>Total Pending:</strong> ₹${totalPending}</p>
        <p><strong>Unpaid Months:</strong> ${unpaidDues.length}</p>
        ${dueFromDate ? `<p><strong>Dues From:</strong> ${dueFromDate}</p>` : ''}
    `;
    
    // Populate month dropdown with unpaid months
    const monthSelect = document.getElementById('paymentMonth');
    monthSelect.innerHTML = unpaidDues.map(due => {
        const [year, month] = due.month.split('-');
        const fromDate = new Date(year, month, 1);
        const toDate = new Date(year, parseInt(month) + 1, 0);
        const dateRange = `${fromDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${toDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        const monthName = fromDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        return `<option value="${due.month}">${monthName} (${dateRange}) - ₹${due.amount - due.paidAmount}</option>`;
    }).join('');
    
    document.getElementById('paymentModal').style.display = 'block';
}

// Close Payment Modal
function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

// Handle Payment
function handlePayment(e) {
    e.preventDefault();
    
    const memberId = parseInt(document.getElementById('paymentMemberId').value);
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const month = document.getElementById('paymentMonth').value;
    
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const dueEntry = member.duesHistory.find(due => due.month === month);
    if (!dueEntry) return;
    
    const remainingAmount = dueEntry.amount - dueEntry.paidAmount;
    
    if (amount > remainingAmount) {
        alert('Payment amount cannot exceed pending amount!');
        return;
    }
    
    // Update dues
    dueEntry.paidAmount += amount;
    if (dueEntry.paidAmount >= dueEntry.amount) {
        dueEntry.paid = true;
    }
    
    // Record payment in history
    const payment = {
        id: Date.now(),
        memberId,
        memberName: member.name,
        apartment: member.apartment,
        amount,
        month,
        date: new Date().toISOString()
    };
    
    paymentHistory.unshift(payment);
    
    saveData();
    closePaymentModal();
    renderMembers();
    renderPaymentHistory();
    updateDashboard();
    updateCharts();
    
    alert(`Payment of ₹${amount} recorded successfully!`);
}

// Render Members Table
function renderMembers() {
    const tbody = document.getElementById('membersTableBody');
    const viewMode = document.getElementById('viewMode').value;
    
    if (members.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <h3>No Members Yet</h3>
                    <p>Add your first member using the form above</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by pending dues (highest first)
    const sortedMembers = [...members].sort((a, b) => {
        const pendingA = calculatePendingDues(a, viewMode);
        const pendingB = calculatePendingDues(b, viewMode);
        return pendingB - pendingA;
    });
    
    tbody.innerHTML = sortedMembers.map(member => {
        const pendingDues = calculatePendingDues(member, viewMode);
        const unpaidMonths = member.duesHistory.filter(due => !due.paid).length;
        const isOverdue = unpaidMonths >= 2;
        
        let statusBadge = '';
        if (pendingDues === 0) {
            statusBadge = '<span class="paid-badge">Paid</span>';
        } else if (isOverdue) {
            statusBadge = `<span class="overdue-badge">⚠️ Overdue (${unpaidMonths} months)</span>`;
        } else {
            statusBadge = '<span class="unpaid-badge">Unpaid</span>';
        }
        
        const joinDate = new Date(member.createdAt);
        const memberSince = joinDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        
        return `
            <tr class="${isOverdue ? 'overdue' : ''}">
                <td>${member.name}</td>
                <td>${member.apartment}</td>
                <td>${member.contact}</td>
                <td>${member.email || 'N/A'}</td>
                <td><small>${memberSince}</small></td>
                <td><strong>₹${pendingDues}</strong></td>
                <td>${statusBadge}</td>
                <td>
                    ${pendingDues > 0 ? `<button class="action-btn pay-btn" onclick="openPaymentModal(${member.id})">Pay</button>` : ''}
                    <button class="action-btn delete-btn" onclick="deleteMember(${member.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Calculate Pending Dues
function calculatePendingDues(member, viewMode = 'current') {
    if (!member.duesHistory) return 0;
    
    if (viewMode === 'current') {
        // Current month only
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
        const currentDue = member.duesHistory.find(due => due.month === currentMonth);
        return currentDue ? (currentDue.amount - currentDue.paidAmount) : 0;
    } else {
        // Cumulative - all unpaid dues
        return member.duesHistory
            .filter(due => !due.paid)
            .reduce((sum, due) => sum + (due.amount - due.paidAmount), 0);
    }
}

// Render Payment History
function renderPaymentHistory() {
    const tbody = document.getElementById('paymentHistoryBody');
    
    if (paymentHistory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <p>No payment history yet</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Show last 10 payments
    const recentPayments = paymentHistory.slice(0, 10);
    
    tbody.innerHTML = recentPayments.map(payment => {
        const date = new Date(payment.date);
        const [year, month] = payment.month.split('-');
        const fromDate = new Date(year, month, 1);
        const toDate = new Date(year, parseInt(month) + 1, 0);
        const dateRange = `${fromDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${toDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        
        return `
            <tr>
                <td>${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td>${payment.memberName}</td>
                <td>${payment.apartment}</td>
                <td><strong>₹${payment.amount}</strong></td>
                <td><small>${dateRange}</small></td>
            </tr>
        `;
    }).join('');
}

// Handle Add Expense
function handleAddExpense(e) {
    e.preventDefault();
    
    // Check permission
    if (currentUser.role !== 'admin') {
        alert('Only admins can add expenses.');
        return;
    }
    
    const name = document.getElementById('expenseName').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const date = document.getElementById('expenseDate').value;
    const notes = document.getElementById('expenseNotes').value.trim();
    const imageInput = document.getElementById('expenseImage');
    
    // Handle image if uploaded
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const newExpense = {
                id: Date.now(),
                name,
                amount,
                category,
                date,
                notes,
                image: event.target.result, // Store base64 image
                createdAt: new Date().toISOString()
            };
            
            expenses.unshift(newExpense);
            saveData();
            
            // Reset form
            e.target.reset();
            removeExpenseImage();
            setDefaultExpenseDate();
            
            renderExpenses();
            updateDashboard();
            
            alert(`Expense of ₹${amount} added successfully!`);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        // No image uploaded
        const newExpense = {
            id: Date.now(),
            name,
            amount,
            category,
            date,
            notes,
            createdAt: new Date().toISOString()
        };
        
        expenses.unshift(newExpense);
        saveData();
        
        // Reset form
        e.target.reset();
        setDefaultExpenseDate();
        
        renderExpenses();
        updateDashboard();
        
        alert(`Expense of ₹${amount} added successfully!`);
    }
}

// Delete Expense
function deleteExpense(id) {
    // Check permission
    if (currentUser.role !== 'admin') {
        alert('Only admins can delete expenses.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    expenses = expenses.filter(e => e.id !== id);
    saveData();
    
    renderExpenses();
    updateDashboard();
}

// Render Expenses Table
function renderExpenses() {
    const tbody = document.getElementById('expensesTableBody');
    const monthFilter = document.getElementById('expenseMonthFilter').value;
    const categoryFilter = document.getElementById('expenseCategoryFilter').value;
    
    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <h3>No Expenses Recorded</h3>
                    <p>Add your first expense using the form above</p>
                </td>
            </tr>
        `;
        updateCategorySummary([]);
        return;
    }
    
    // Filter expenses
    const now = new Date();
    let filteredExpenses = expenses;
    
    if (monthFilter === 'current') {
        filteredExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === now.getMonth() && 
                   expenseDate.getFullYear() === now.getFullYear();
        });
    }
    
    if (categoryFilter !== 'all') {
        filteredExpenses = filteredExpenses.filter(expense => expense.category === categoryFilter);
    }
    
    if (filteredExpenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <p>No expenses found for selected filters</p>
                </td>
            </tr>
        `;
        updateCategorySummary([]);
        return;
    }
    
    tbody.innerHTML = filteredExpenses.map(expense => {
        const expenseDate = new Date(expense.date);
        const formattedDate = expenseDate.toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        
        // Check if expense has an image
        const imageButton = expense.image 
            ? `<button class="action-btn" onclick="viewExpenseImage('${expense.image}')" style="background: #3498db; margin-right: 5px;">📷 View</button>`
            : '';
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td><strong>${expense.name}</strong></td>
                <td><span class="category-badge">${expense.category}</span></td>
                <td><strong>₹${expense.amount}</strong></td>
                <td><small>${expense.notes || '-'}</small></td>
                <td>
                    ${imageButton}
                    <button class="action-btn delete-btn" onclick="deleteExpense(${expense.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
    
    updateCategorySummary(filteredExpenses);
}

// Update Category Summary
function updateCategorySummary(filteredExpenses) {
    const categorySummary = document.getElementById('categorySummary');
    
    if (filteredExpenses.length === 0) {
        categorySummary.innerHTML = '<p class="empty-state">No expense data available</p>';
        return;
    }
    
    // Group by category
    const categoryTotals = {};
    filteredExpenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.amount;
    });
    
    // Sort by amount descending
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);
    
    categorySummary.innerHTML = sortedCategories.map(([category, amount]) => `
        <div class="category-card">
            <h4>${category}</h4>
            <p class="amount">₹${amount}</p>
        </div>
    `).join('');
}

// Image preview for expense form
function previewExpenseImage(input) {
    const preview = document.getElementById('expenseImagePreview');
    const previewImg = document.getElementById('expensePreviewImg');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Remove expense image
function removeExpenseImage() {
    const imageInput = document.getElementById('expenseImage');
    const preview = document.getElementById('expenseImagePreview');
    const previewImg = document.getElementById('expensePreviewImg');
    
    imageInput.value = '';
    previewImg.src = '';
    preview.style.display = 'none';
}

// View expense image in modal
function viewExpenseImage(imageData) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageData;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;
    
    modal.appendChild(img);
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}

// Set default expense date to today
function setDefaultExpenseDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
}

// Update Dashboard Summary
function updateDashboard() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
    
    // Current month collections
    const monthlyPayments = paymentHistory.filter(p => {
        const paymentDate = new Date(p.date);
        return paymentDate.getMonth() === now.getMonth() && 
               paymentDate.getFullYear() === now.getFullYear();
    });
    const monthlyCollected = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Total collections
    const totalCollected = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
    
    // Current month expenses
    const monthlyExpensesList = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === now.getMonth() && 
               expenseDate.getFullYear() === now.getFullYear();
    });
    const monthlyExpenses = monthlyExpensesList.reduce((sum, e) => sum + e.amount, 0);
    
    // Net balance (collections - expenses)
    const netBalance = monthlyCollected - monthlyExpenses;
    
    // Current month pending
    const monthlyPending = members.reduce((sum, member) => {
        const currentDue = member.duesHistory.find(due => due.month === currentMonth);
        return sum + (currentDue ? (currentDue.amount - currentDue.paidAmount) : 0);
    }, 0);
    
    // Total pending (all unpaid dues)
    const totalPending = members.reduce((sum, member) => {
        return sum + member.duesHistory
            .filter(due => !due.paid)
            .reduce((dueSum, due) => dueSum + (due.amount - due.paidAmount), 0);
    }, 0);
    
    // Update UI
    document.getElementById('monthlyCollected').textContent = `₹${monthlyCollected}`;
    document.getElementById('totalCollected').textContent = `₹${totalCollected}`;
    document.getElementById('monthlyExpenses').textContent = `₹${monthlyExpenses}`;
    document.getElementById('netBalance').textContent = `₹${netBalance}`;
    document.getElementById('netBalance').className = netBalance >= 0 ? 'stat-value balance' : 'stat-value expense';
    document.getElementById('monthlyPending').textContent = `₹${monthlyPending}`;
    document.getElementById('totalPending').textContent = `₹${totalPending}`;
    
    renderPaymentHistory();
}

// Initialize Charts
function initializeCharts() {
    const barCtx = document.getElementById('barChart').getContext('2d');
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    
    // Bar Chart - Monthly Collections
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Collections (₹)',
                data: [],
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Amount: ₹' + context.parsed.y;
                        }
                    }
                }
            }
        }
    });
    
    // Pie Chart - Paid vs Unpaid
    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['Paid Members', 'Unpaid Members'],
            datasets: [{
                data: [1, 1],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.8)',
                    'rgba(220, 53, 69, 0.8)'
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    updateCharts();
}

// Update Charts
function updateCharts() {
    // Update Bar Chart - Last 6 months collections
    const monthlyData = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyData[key] = { label, amount: 0 };
    }
    
    // Calculate collections for each month
    paymentHistory.forEach(payment => {
        const date = new Date(payment.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (monthlyData[key]) {
            monthlyData[key].amount += payment.amount;
        }
    });
    
    const labels = Object.values(monthlyData).map(d => d.label);
    const data = Object.values(monthlyData).map(d => d.amount);
    
    barChart.data.labels = labels;
    barChart.data.datasets[0].data = data;
    barChart.update();
    
    // Update Pie Chart - Current month paid vs unpaid
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
    let paidCount = 0;
    let unpaidCount = 0;
    
    members.forEach(member => {
        const currentDue = member.duesHistory.find(due => due.month === currentMonth);
        if (currentDue) {
            if (currentDue.paid || currentDue.paidAmount >= currentDue.amount) {
                paidCount++;
            } else {
                unpaidCount++;
            }
        }
    });
    
    pieChart.data.datasets[0].data = [paidCount, unpaidCount];
    pieChart.update();
}

// Apply Filters
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const viewMode = document.getElementById('viewMode').value;
    
    const tbody = document.getElementById('membersTableBody');
    const rows = tbody.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const cells = row.getElementsByTagName('td');
        if (cells.length === 0) return;
        
        const name = cells[0].textContent.toLowerCase();
        const apartment = cells[1].textContent.toLowerCase();
        const pendingText = cells[4].textContent;
        const pending = parseInt(pendingText.replace('₹', ''));
        
        // Search filter
        const matchesSearch = name.includes(searchTerm) || apartment.includes(searchTerm);
        
        // Status filter
        let matchesStatus = true;
        if (statusFilter === 'paid') {
            matchesStatus = pending === 0;
        } else if (statusFilter === 'unpaid') {
            matchesStatus = pending > 0;
        } else if (statusFilter === 'overdue') {
            matchesStatus = row.classList.contains('overdue');
        }
        
        // Show/hide row
        row.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
    });
}

// Populate Month Dropdown
function populateMonthDropdown() {
    const select = document.getElementById('paymentMonth');
    const now = new Date();
    
    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${date.getFullYear()}-${date.getMonth()}`;
        const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
    }
}

// Auto-refresh monthly dues check (run every hour)
setInterval(() => {
    checkAndAddMonthlyDues();
    renderMembers();
    renderExpenses();
    updateDashboard();
}, 3600000); // 1 hour

// ============================================
// FEEDBACK & SUGGESTIONS SYSTEM
// ============================================

// Handle Feedback Form Submission
function handleFeedbackSubmit(e) {
    e.preventDefault();
    
    const type = document.getElementById('feedbackType').value;
    const title = document.getElementById('feedbackTitle').value.trim();
    const description = document.getElementById('feedbackDescription').value.trim();
    
    const feedbackItem = {
        id: Date.now(),
        type,
        title,
        description,
        author: currentUser.username,
        role: currentUser.role,
        date: new Date().toISOString(),
        votes: 0,
        votedBy: []
    };
    
    feedback.push(feedbackItem);
    saveData();
    renderFeedback();
    
    // Reset form
    document.getElementById('feedbackForm').reset();
    alert('Feedback submitted successfully!');
}

// Render Feedback List
function renderFeedback() {
    const feedbackList = document.getElementById('feedbackList');
    if (!feedbackList) {
        console.error('Feedback list element not found!');
        return;
    }
    
    const typeFilter = document.getElementById('feedbackTypeFilter').value;
    const sortFilter = document.getElementById('feedbackSortFilter').value;
    
    console.log('Rendering feedback. Total items:', feedback.length);
    
    // Filter feedback
    let filteredFeedback = feedback.filter(item => {
        if (typeFilter === 'all') return true;
        return item.type === typeFilter;
    });
    
    // Sort feedback
    if (sortFilter === 'votes') {
        filteredFeedback.sort((a, b) => b.votes - a.votes);
    } else {
        filteredFeedback.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    console.log('Filtered feedback:', filteredFeedback.length);
    
    if (filteredFeedback.length === 0) {
        feedbackList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No feedback available. Be the first to share!</p>';
        return;
    }
    
    feedbackList.innerHTML = filteredFeedback.map(item => {
        const date = new Date(item.date);
        const hasVoted = item.votedBy.includes(currentUser.username);
        const canDelete = currentUser.role === 'admin' || item.author === currentUser.username;
        
        return `
            <div class="feedback-item ${item.type}">
                <div class="feedback-header">
                    <div class="feedback-title">${item.title}</div>
                    <span class="feedback-type-badge ${item.type}">${item.type}</span>
                </div>
                <div class="feedback-description">${item.description}</div>
                <div class="feedback-meta">
                    <div>
                        <div class="feedback-author">👤 ${item.author} (${item.role})</div>
                        <div class="feedback-date">${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div class="feedback-actions">
                        <button class="vote-btn ${hasVoted ? 'voted' : ''}" onclick="toggleVote(${item.id})">
                            👍 <span class="vote-count">${item.votes}</span>
                        </button>
                        ${canDelete ? `<button class="delete-feedback-btn" onclick="deleteFeedback(${item.id})">🗑️ Delete</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Feedback rendered successfully');
}

// Toggle Vote
function toggleVote(feedbackId) {
    const item = feedback.find(f => f.id === feedbackId);
    if (!item) return;
    
    const userIndex = item.votedBy.indexOf(currentUser.username);
    
    if (userIndex > -1) {
        // Remove vote
        item.votedBy.splice(userIndex, 1);
        item.votes--;
    } else {
        // Add vote
        item.votedBy.push(currentUser.username);
        item.votes++;
    }
    
    saveData();
    renderFeedback();
}

// Delete Feedback
function deleteFeedback(feedbackId) {
    const feedbackItem = feedback.find(f => f.id === feedbackId);
    
    // Check permission - only admin can delete any feedback, members can only delete their own
    if (currentUser.role !== 'admin' && feedbackItem.author !== currentUser.username) {
        alert('You can only delete your own feedback!');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    
    feedback = feedback.filter(f => f.id !== feedbackId);
    saveData();
    renderFeedback();
}

// ============================================
// AUDIT LOGGING SYSTEM
// ============================================

function logAuditEvent(action, details) {
    const auditEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        adminId: currentUser?.id || 'system',
        adminName: currentUser?.name || currentUser?.username || 'system',
        action,
        details
    };
    
    auditLog.push(auditEntry);
    saveData();
}

// ============================================
// RECEIPT MANAGEMENT SYSTEM
// ============================================

// Upload payment receipt
function uploadPaymentReceipt(file, memberId, month, year, amount) {
    return new Promise((resolve, reject) => {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];
        if (!allowedTypes.includes(file.type.toLowerCase())) {
            reject('Only JPG, PNG, and HEIC image formats are allowed');
            return;
        }
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            reject('File size must be less than 5MB');
            return;
        }
        
        // Check for duplicate receipt for same month/year
        const duplicate = receipts.find(r => 
            r.memberId === memberId && 
            r.month === month && 
            r.year === year &&
            r.status !== RECEIPT_STATUS.REJECTED
        );
        
        if (duplicate) {
            reject('A receipt for this period already exists');
            return;
        }
        
        // Convert image to base64
        const reader = new FileReader();
        reader.onload = function(e) {
            const receipt = {
                id: Date.now(),
                memberId,
                month,
                year,
                amount,
                imageData: e.target.result,
                fileName: file.name,
                fileSize: file.size,
                uploadTimestamp: new Date().toISOString(),
                status: RECEIPT_STATUS.PENDING,
                approvalTimestamp: null,
                approvedBy: null,
                rejectionReason: null,
                rejectionNotes: null,
                locked: false
            };
            
            receipts.push(receipt);
            saveData();
            
            logAuditEvent('RECEIPT_UPLOADED', {
                receiptId: receipt.id,
                memberId,
                month,
                year,
                amount
            });
            
            resolve(receipt);
        };
        
        reader.onerror = () => reject('Error reading file');
        reader.readAsDataURL(file);
    });
}



// ============================================
// ADVANCE PAYMENT SYSTEM
// ============================================

// Add advance credit
function addAdvanceCredit(memberId, amount, source) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    if (!member.advanceBalance) {
        member.advanceBalance = 0;
    }
    
    member.advanceBalance += amount;
    
    const advanceRecord = {
        id: Date.now(),
        memberId,
        memberName: member.name,
        apartment: member.apartment,
        amount,
        source,
        timestamp: new Date().toISOString(),
        type: 'credit'
    };
    
    advancePayments.push(advanceRecord);
    saveData();
    
    logAuditEvent('ADVANCE_CREDIT_ADDED', {
        memberId,
        amount,
        source
    });
}

// Process advance payment
function processAdvancePayment(memberId, amount) {
    if (currentUser.role !== 'admin') {
        alert('Only admins can process advance payments.');
        return false;
    }
    
    const member = members.find(m => m.id === memberId);
    if (!member) {
        alert('Member not found!');
        return false;
    }
    
    if (amount <= 0) {
        alert('Amount must be greater than zero!');
        return false;
    }
    
    addAdvanceCredit(memberId, amount, 'Direct advance payment');
    
    renderMembers();
    updateDashboard();
    alert(`Advance payment of ₹${amount} added for ${member.name}!`);
    return true;
}

// Apply advance to dues
function applyAdvanceToDues(member) {
    if (!member.advanceBalance || member.advanceBalance <= 0) return;
    
    // Get unpaid dues sorted by date (oldest first)
    const unpaidDues = member.duesHistory
        .filter(due => !due.paid)
        .sort((a, b) => {
            const [yearA, monthA] = a.month.split('-').map(Number);
            const [yearB, monthB] = b.month.split('-').map(Number);
            if (yearA !== yearB) return yearA - yearB;
            return monthA - monthB;
        });
    
    let remainingCredit = member.advanceBalance;
    
    for (const due of unpaidDues) {
        if (remainingCredit <= 0) break;
        
        const dueAmount = due.amount - due.paidAmount;
        const paymentAmount = Math.min(remainingCredit, dueAmount);
        
        due.paidAmount += paymentAmount;
        if (due.paidAmount >= due.amount) {
            due.paid = true;
        }
        
        remainingCredit -= paymentAmount;
        
        // Record payment
        const payment = {
            id: Date.now() + Math.random(),
            memberId: member.id,
            memberName: member.name,
            apartment: member.apartment,
            amount: paymentAmount,
            month: due.month,
            date: new Date().toISOString(),
            source: 'advance_credit'
        };
        
        paymentHistory.unshift(payment);
        
        logAuditEvent('ADVANCE_APPLIED', {
            memberId: member.id,
            amount: paymentAmount,
            month: due.month
        });
    }
    
    member.advanceBalance = remainingCredit;
    saveData();
}

// Get months covered by advance
function getMonthsCoveredByAdvance(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member || !member.advanceBalance || member.advanceBalance <= 0) {
        return 0;
    }
    
    const unpaidDues = member.duesHistory.filter(due => !due.paid);
    const totalUnpaidAmount = unpaidDues.reduce((sum, due) => sum + (due.amount - due.paidAmount), 0);
    
    if (member.advanceBalance >= totalUnpaidAmount) {
        const monthlyFee = MONTHLY_FEE + getActiveDueIncrease(memberId);
        return unpaidDues.length + Math.floor((member.advanceBalance - totalUnpaidAmount) / monthlyFee);
    } else {
        let remaining = member.advanceBalance;
        let monthsCovered = 0;
        
        for (const due of unpaidDues) {
            const dueAmount = due.amount - due.paidAmount;
            if (remaining >= dueAmount) {
                monthsCovered++;
                remaining -= dueAmount;
            } else {
                break;
            }
        }
        
        return monthsCovered;
    }
}

// ============================================
// DUE INCREASE MANAGEMENT
// ============================================

// Increase dues globally
function increaseDuesGlobal(increaseAmount, effectiveMonth, effectiveYear, reason) {
    if (currentUser.role !== 'admin') {
        alert('Only admins can modify dues.');
        return false;
    }
    
    if (!reason || reason.trim() === '') {
        alert('Reason is mandatory for due increase!');
        return false;
    }
    
    if (increaseAmount <= 0) {
        alert('Increase amount must be greater than zero!');
        return false;
    }
    
    const change = {
        id: Date.now(),
        type: 'global',
        memberIds: members.map(m => m.id),
        oldAmount: MONTHLY_FEE,
        newAmount: MONTHLY_FEE + increaseAmount,
        increaseAmount,
        effectiveMonth,
        effectiveYear,
        reason,
        timestamp: new Date().toISOString(),
        adminId: currentUser.id || currentUser.username,
        adminName: currentUser.username || currentUser.name
    };
    
    dueChangeHistory.push(change);
    
    // Apply to all members from effective month onwards
    members.forEach(member => {
        applyDueIncreaseToMember(member, increaseAmount, effectiveMonth, effectiveYear);
    });
    
    saveData();
    
    logAuditEvent('DUE_INCREASE_GLOBAL', {
        increaseAmount,
        effectiveMonth,
        effectiveYear,
        reason
    });
    
    renderMembers();
    updateDashboard();
    renderDueChangeHistory();
    
    alert(`Global due increase of ₹${increaseAmount} applied successfully!`);
    return true;
}

// Increase dues for specific member
function increaseDuesMember(memberId, increaseAmount, effectiveMonth, effectiveYear, reason) {
    if (currentUser.role !== 'admin') {
        alert('Only admins can modify dues.');
        return false;
    }
    
    const member = members.find(m => m.id === memberId);
    if (!member) {
        alert('Member not found!');
        return false;
    }
    
    if (!reason || reason.trim() === '') {
        alert('Reason is mandatory for due increase!');
        return false;
    }
    
    if (increaseAmount <= 0) {
        alert('Increase amount must be greater than zero!');
        return false;
    }
    
    const change = {
        id: Date.now(),
        type: 'individual',
        memberIds: [memberId],
        oldAmount: MONTHLY_FEE,
        newAmount: MONTHLY_FEE + increaseAmount,
        increaseAmount,
        effectiveMonth,
        effectiveYear,
        reason,
        timestamp: new Date().toISOString(),
        adminId: currentUser.id || currentUser.username,
        adminName: currentUser.username || currentUser.name
    };
    
    dueChangeHistory.push(change);
    
    applyDueIncreaseToMember(member, increaseAmount, effectiveMonth, effectiveYear);
    
    saveData();
    
    logAuditEvent('DUE_INCREASE_INDIVIDUAL', {
        memberId,
        increaseAmount,
        effectiveMonth,
        effectiveYear,
        reason
    });
    
    renderMembers();
    updateDashboard();
    renderDueChangeHistory();
    
    alert(`Due increase of ₹${increaseAmount} applied to ${member.name}!`);
    return true;
}

// Decrease dues globally
function decreaseDuesGlobal(decreaseAmount, effectiveMonth, effectiveYear, reason) {
    if (currentUser.role !== 'admin') {
        alert('Only admins can modify dues.');
        return false;
    }
    
    if (!reason || reason.trim() === '') {
        alert('Reason is mandatory for due decrease!');
        return false;
    }
    
    if (decreaseAmount <= 0) {
        alert('Decrease amount must be greater than zero!');
        return false;
    }
    
    // Check if decrease would make dues negative
    if (MONTHLY_FEE - decreaseAmount < 0) {
        alert(`Decrease amount too large! Current base due is ₹${MONTHLY_FEE}. Maximum decrease allowed is ₹${MONTHLY_FEE}.`);
        return false;
    }
    
    const change = {
        id: Date.now(),
        type: 'global',
        changeType: 'decrease',
        memberIds: members.map(m => m.id),
        oldAmount: MONTHLY_FEE,
        newAmount: MONTHLY_FEE - decreaseAmount,
        decreaseAmount,
        effectiveMonth,
        effectiveYear,
        reason,
        timestamp: new Date().toISOString(),
        adminId: currentUser.id || currentUser.username,
        adminName: currentUser.username || currentUser.name
    };
    
    dueChangeHistory.push(change);
    
    // Apply to all members from effective month onwards
    members.forEach(member => {
        applyDueDecreaseToMember(member, decreaseAmount, effectiveMonth, effectiveYear);
    });
    
    saveData();
    
    logAuditEvent('DUE_DECREASE_GLOBAL', {
        decreaseAmount,
        effectiveMonth,
        effectiveYear,
        reason
    });
    
    renderMembers();
    updateDashboard();
    renderDueChangeHistory();
    
    alert(`Global due decrease of ₹${decreaseAmount} applied successfully!`);
    return true;
}

// Decrease dues for specific member
function decreaseDuesMember(memberId, decreaseAmount, effectiveMonth, effectiveYear, reason) {
    if (currentUser.role !== 'admin') {
        alert('Only admins can modify dues.');
        return false;
    }
    
    const member = members.find(m => m.id === memberId);
    if (!member) {
        alert('Member not found!');
        return false;
    }
    
    if (!reason || reason.trim() === '') {
        alert('Reason is mandatory for due decrease!');
        return false;
    }
    
    if (decreaseAmount <= 0) {
        alert('Decrease amount must be greater than zero!');
        return false;
    }
    
    // Check if decrease would make dues negative for this member
    const currentDueAmount = MONTHLY_FEE + getActiveDueIncrease(memberId);
    if (currentDueAmount - decreaseAmount < 0) {
        alert(`Decrease amount too large! Current due for ${member.name} is ₹${currentDueAmount}. Maximum decrease allowed is ₹${currentDueAmount}.`);
        return false;
    }
    
    const change = {
        id: Date.now(),
        type: 'individual',
        changeType: 'decrease',
        memberIds: [memberId],
        oldAmount: currentDueAmount,
        newAmount: currentDueAmount - decreaseAmount,
        decreaseAmount,
        effectiveMonth,
        effectiveYear,
        reason,
        timestamp: new Date().toISOString(),
        adminId: currentUser.id || currentUser.username,
        adminName: currentUser.username || currentUser.name
    };
    
    dueChangeHistory.push(change);
    
    applyDueDecreaseToMember(member, decreaseAmount, effectiveMonth, effectiveYear);
    
    saveData();
    
    logAuditEvent('DUE_DECREASE_INDIVIDUAL', {
        memberId,
        decreaseAmount,
        effectiveMonth,
        effectiveYear,
        reason
    });
    
    renderMembers();
    updateDashboard();
    renderDueChangeHistory();
    
    alert(`Due decrease of ₹${decreaseAmount} applied to ${member.name}!`);
    return true;
}

// Apply due increase to member
function applyDueIncreaseToMember(member, increaseAmount, effectiveMonth, effectiveYear) {
    if (!member.duesHistory) return;
    
    member.duesHistory.forEach(due => {
        const [year, month] = due.month.split('-').map(Number);
        
        // Apply to months from effective date onwards
        if (year > effectiveYear || (year === effectiveYear && month >= effectiveMonth)) {
            if (!due.customAmount) {
                due.amount += increaseAmount;
            }
        }
    });
}

// Apply due decrease to member
function applyDueDecreaseToMember(member, decreaseAmount, effectiveMonth, effectiveYear) {
    if (!member.duesHistory) return;
    
    member.duesHistory.forEach(due => {
        const [year, month] = due.month.split('-').map(Number);
        
        // Apply to months from effective date onwards
        if (year > effectiveYear || (year === effectiveYear && month >= effectiveMonth)) {
            if (!due.customAmount) {
                const newAmount = due.amount - decreaseAmount;
                // Ensure dues don't go below 0
                due.amount = Math.max(0, newAmount);
            }
        }
    });
}

// Get active due change for member (net of increases and decreases)
function getActiveDueIncrease(memberId) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let netChange = 0;
    
    dueChangeHistory.forEach(change => {
        if (change.effectiveYear < currentYear || 
            (change.effectiveYear === currentYear && change.effectiveMonth <= currentMonth)) {
            
            if (change.type === 'global' || change.memberIds.includes(memberId)) {
                if (change.changeType === 'decrease') {
                    netChange -= change.decreaseAmount;
                } else {
                    netChange += change.increaseAmount;
                }
            }
        }
    });
    
    return netChange;
}

// Helper function
function getMonthName(monthNumber) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(monthNumber)];
}

// ============================================
// UI RENDER FUNCTIONS
// ============================================



// Render due change history
function renderDueChangeHistory() {
    const tbody = document.getElementById('dueIncreaseTableBody');
    if (!tbody) return;
    
    if (dueChangeHistory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">No due changes recorded yet.</td>
            </tr>
        `;
        return;
    }
    
    const sortedHistory = [...dueChangeHistory].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    tbody.innerHTML = sortedHistory.map(change => {
        const changeDate = new Date(change.timestamp);
        const effectiveDate = `${getMonthName(change.effectiveMonth)} ${change.effectiveYear}`;
        const isDecrease = change.changeType === 'decrease';
        const amount = isDecrease ? change.decreaseAmount : change.increaseAmount;
        const changeLabel = isDecrease ? 'Decrease' : 'Increase';
        const amountDisplay = isDecrease ? `-₹${amount}` : `+₹${amount}`;
        const badgeClass = isDecrease ? 'badge-warning' : 'badge-success';
        
        return `
            <tr>
                <td>${changeDate.toLocaleDateString('en-IN')}</td>
                <td>
                    <span class="badge ${change.type === 'global' ? 'badge-primary' : 'badge-secondary'}">${change.type}</span>
                    <span class="badge ${badgeClass}">${changeLabel}</span>
                </td>
                <td><strong>${amountDisplay}</strong></td>
                <td>${effectiveDate}</td>
                <td>${change.reason}</td>
                <td>${change.adminName}</td>
            </tr>
        `;
    }).join('');
}

// Render advance balances
function renderAdvanceBalances() {
    const tbody = document.getElementById('advanceBalanceTableBody');
    if (!tbody) return;
    
    const membersWithAdvance = members.filter(m => m.advanceBalance && m.advanceBalance > 0);
    
    if (membersWithAdvance.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">No members have advance balances.</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = membersWithAdvance.map(member => {
        const monthsCovered = getMonthsCoveredByAdvance(member.id);
        
        return `
            <tr>
                <td>${member.name}</td>
                <td>${member.apartment}</td>
                <td><strong>₹${member.advanceBalance}</strong></td>
                <td>${monthsCovered} month${monthsCovered !== 1 ? 's' : ''}</td>
                <td>
                    <button class="action-btn" onclick="applyAdvanceToMember(${member.id})">Apply to Dues</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Apply advance to specific member
function applyAdvanceToMember(memberId) {
    if (currentUser.role !== 'admin') {
        alert('Only admins can apply advance credits.');
        return;
    }
    
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    if (!confirm(`Apply ₹${member.advanceBalance} advance credit to ${member.name}'s dues?`)) {
        return;
    }
    
    applyAdvanceToDues(member);
    
    renderMembers();
    renderPaymentHistory();
    updateDashboard();
    renderAdvanceBalances();
    
    alert('Advance credit applied successfully!');
}

// Render member dashboard
function renderMemberDashboard() {
    if (!currentUser || currentUser.role !== 'member') return;
    
    const member = members.find(m => m.name === currentUser.name && m.apartment === currentUser.apartment);
    if (!member) return;
    
    // Calculate current due
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const currentDue = member.duesHistory.find(due => due.month === currentMonthKey);
    const currentDueAmount = currentDue ? (currentDue.amount - currentDue.paidAmount) : 0;
    
    // Update stats
    document.getElementById('memberCurrentDue').textContent = `₹${currentDueAmount}`;
    
    const advanceBalance = member.advanceBalance || 0;
    document.getElementById('memberAdvanceBalance').textContent = `₹${advanceBalance}`;
    
    if (advanceBalance > 0) {
        const monthsCovered = getMonthsCoveredByAdvance(member.id);
        document.getElementById('monthsCovered').textContent = `Covers ${monthsCovered} month${monthsCovered !== 1 ? 's' : ''}`;
    } else {
        document.getElementById('monthsCovered').textContent = '';
    }
    
    // Count pending receipts
    const pendingCount = receipts.filter(r => r.memberId === member.id && r.status === RECEIPT_STATUS.PENDING).length;
    document.getElementById('memberPendingReceipts').textContent = pendingCount;
    
    // Render receipt history
    renderMemberReceiptHistory(member.id);
}

// Render member receipt history
function renderMemberReceiptHistory(memberId) {
    const container = document.getElementById('memberReceiptHistory');
    if (!container) return;
    
    const memberReceipts = receipts.filter(r => r.memberId === memberId);
    
    if (memberReceipts.length === 0) {
        container.innerHTML = '<p class="empty-state">No receipts uploaded yet.</p>';
        return;
    }
    
    container.innerHTML = memberReceipts.map(receipt => {
        const uploadDate = new Date(receipt.uploadTimestamp);
        let statusBadge = '';
        let statusClass = '';
        
        if (receipt.status === RECEIPT_STATUS.PENDING) {
            statusBadge = '<span class="status-badge pending">⏳ Pending</span>';
            statusClass = 'receipt-pending';
        } else if (receipt.status === RECEIPT_STATUS.APPROVED) {
            statusBadge = '<span class="status-badge approved">✓ Approved</span>';
            statusClass = 'receipt-approved';
        } else if (receipt.status === RECEIPT_STATUS.REJECTED) {
            statusBadge = '<span class="status-badge rejected">✗ Rejected</span>';
            statusClass = 'receipt-rejected';
        }
        
        return `
            <div class="receipt-history-item ${statusClass}">
                <div class="receipt-thumb">
                    <img src="${receipt.imageData}" alt="Receipt" onclick="viewReceiptImage('${receipt.imageData}')">
                </div>
                <div class="receipt-info">
                    <h4>${getMonthName(receipt.month)} ${receipt.year} - ₹${receipt.amount}</h4>
                    <p>Uploaded: ${uploadDate.toLocaleString('en-IN')}</p>
                    ${statusBadge}
                    ${receipt.status === RECEIPT_STATUS.REJECTED ? `
                        <p class="rejection-reason"><strong>Reason:</strong> ${receipt.rejectionReason}</p>
                        ${receipt.rejectionNotes ? `<p class="rejection-notes">${receipt.rejectionNotes}</p>` : ''}
                    ` : ''}
                    ${receipt.status === RECEIPT_STATUS.APPROVED ? `
                        <p class="approval-info">Approved by ${receipt.approvedBy} on ${new Date(receipt.approvalTimestamp).toLocaleDateString('en-IN')}</p>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Populate receipt year dropdown
function populateReceiptYearDropdown() {
    const yearSelect = document.getElementById('receiptYear');
    if (!yearSelect) return;
    
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1, currentYear - 2];
    
    yearSelect.innerHTML = years.map(year => 
        `<option value="${year}">${year}</option>`
    ).join('');
}

// Populate receipt month dropdown
function populateReceiptMonthDropdown() {
    const monthSelect = document.getElementById('receiptMonth');
    if (!monthSelect) return;
    
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    monthSelect.innerHTML = '<option value="">Select Month</option>' + 
        months.map((month, index) => 
            `<option value="${index}">${month}</option>`
        ).join('');
}

// View receipt image in modal
function viewReceiptImage(imageData) {
    const modal = document.createElement('div');
    modal.className = 'modal image-modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content image-modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <img src="${imageData}" alt="Receipt" style="max-width: 100%; max-height: 90vh;">
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ============================================
// MODAL HANDLERS
// ============================================

// Due Change Modal (Increase/Decrease)
function openDueIncreaseModal() {
    if (currentUser.role !== 'admin') {
        alert('Only admins can modify dues.');
        return;
    }
    
    // Populate member dropdown
    const memberSelect = document.getElementById('increaseMemberId');
    memberSelect.innerHTML = members.map(m => 
        `<option value="${m.id}">${m.name} - ${m.apartment}</option>`
    ).join('');
    
    // Set current month and year as default
    const now = new Date();
    document.getElementById('effectiveMonth').value = now.getMonth();
    document.getElementById('effectiveYear').value = now.getFullYear();
    
    // Reset to increase by default
    document.getElementById('changeAction').value = 'increase';
    updateDueChangeLabels();
    
    document.getElementById('dueIncreaseModal').style.display = 'block';
}

function closeDueIncreaseModal() {
    document.getElementById('dueIncreaseModal').style.display = 'none';
    document.getElementById('dueIncreaseForm').reset();
}

function toggleMemberSelect() {
    const increaseType = document.getElementById('increaseType').value;
    const memberSelectGroup = document.getElementById('memberSelectGroup');
    
    if (increaseType === 'individual') {
        memberSelectGroup.style.display = 'block';
        document.getElementById('increaseMemberId').required = true;
        updateMaxDecreaseHint();
    } else {
        memberSelectGroup.style.display = 'none';
        document.getElementById('increaseMemberId').required = false;
        updateMaxDecreaseHint();
    }
}

// Update labels based on increase/decrease selection
function updateDueChangeLabels() {
    const action = document.getElementById('changeAction').value;
    const isDecrease = action === 'decrease';
    
    // Update modal title
    document.getElementById('dueChangeModalTitle').textContent = 
        isDecrease ? 'Decrease Monthly Dues' : 'Increase Monthly Dues';
    
    // Update labels
    document.querySelectorAll('#changeTypeLabel').forEach(el => {
        el.textContent = isDecrease ? 'Decrease' : 'Increase';
    });
    
    document.querySelectorAll('#changeAmountLabel').forEach(el => {
        el.textContent = isDecrease ? 'Decrease' : 'Increase';
    });
    
    // Update button text
    document.getElementById('dueChangeSubmitBtn').textContent = 
        isDecrease ? 'Apply Due Decrease' : 'Apply Due Increase';
    
    // Update placeholder
    document.getElementById('increaseReason').placeholder = 
        `Explain the reason for due ${action}...`;
    
    // Show/hide max decrease hint
    updateMaxDecreaseHint();
}

// Update max decrease hint
function updateMaxDecreaseHint() {
    const action = document.getElementById('changeAction').value;
    const increaseType = document.getElementById('increaseType').value;
    const maxDecreaseHint = document.getElementById('maxDecreaseHint');
    
    if (action === 'decrease') {
        if (increaseType === 'individual') {
            const memberId = parseInt(document.getElementById('increaseMemberId').value);
            const currentDueAmount = MONTHLY_FEE + getActiveDueIncrease(memberId);
            document.getElementById('maxDecreaseAmount').textContent = currentDueAmount;
        } else {
            document.getElementById('maxDecreaseAmount').textContent = MONTHLY_FEE;
        }
        maxDecreaseHint.style.display = 'block';
    } else {
        maxDecreaseHint.style.display = 'none';
    }
}

// Advance Payment Modal
function openAdvancePaymentModal() {
    if (currentUser.role !== 'admin') {
        alert('Only admins can record advance payments.');
        return;
    }
    
    // Populate member dropdown
    const memberSelect = document.getElementById('advanceMemberId');
    memberSelect.innerHTML = members.map(m => 
        `<option value="${m.id}">${m.name} - ${m.apartment}</option>`
    ).join('');
    
    document.getElementById('advancePaymentModal').style.display = 'block';
}

function closeAdvancePaymentModal() {
    document.getElementById('advancePaymentModal').style.display = 'none';
    document.getElementById('advancePaymentForm').reset();
}



// Audit Log Modal
function openAuditLogModal() {
    if (currentUser.role !== 'admin') {
        alert('Only admins can view audit log.');
        return;
    }
    
    renderAuditLog();
    document.getElementById('auditLogModal').style.display = 'block';
}

function closeAuditLogModal() {
    document.getElementById('auditLogModal').style.display = 'none';
}

function renderAuditLog() {
    const tbody = document.getElementById('auditLogTableBody');
    const filter = document.getElementById('auditActionFilter').value;
    
    let filteredLog = auditLog;
    if (filter !== 'all') {
        filteredLog = auditLog.filter(log => log.action.startsWith(filter));
    }
    
    const sortedLog = [...filteredLog].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    tbody.innerHTML = sortedLog.map(log => {
        const timestamp = new Date(log.timestamp);
        
        return `
            <tr>
                <td>${timestamp.toLocaleString('en-IN')}</td>
                <td>${log.adminName}</td>
                <td><code>${log.action}</code></td>
                <td><pre>${JSON.stringify(log.details, null, 2)}</pre></td>
            </tr>
        `;
    }).join('');
    
    // Add filter event listener
    document.getElementById('auditActionFilter').onchange = renderAuditLog;
}

// ============================================
// FORM HANDLERS
// ============================================

// Handle due change form submission (increase or decrease)
function handleDueIncreaseSubmit(e) {
    e.preventDefault();
    
    const action = document.getElementById('changeAction').value;
    const type = document.getElementById('increaseType').value;
    const amount = parseFloat(document.getElementById('increaseAmount').value);
    const month = parseInt(document.getElementById('effectiveMonth').value);
    const year = parseInt(document.getElementById('effectiveYear').value);
    const reason = document.getElementById('increaseReason').value.trim();
    
    let success = false;
    
    if (action === 'increase') {
        if (type === 'global') {
            success = increaseDuesGlobal(amount, month, year, reason);
        } else {
            const memberId = parseInt(document.getElementById('increaseMemberId').value);
            success = increaseDuesMember(memberId, amount, month, year, reason);
        }
    } else {
        // Decrease
        if (type === 'global') {
            success = decreaseDuesGlobal(amount, month, year, reason);
        } else {
            const memberId = parseInt(document.getElementById('increaseMemberId').value);
            success = decreaseDuesMember(memberId, amount, month, year, reason);
        }
    }
    
    if (success) {
        closeDueIncreaseModal();
    }
}

// Handle advance payment form submission
function handleAdvancePaymentSubmit(e) {
    e.preventDefault();
    
    const memberId = parseInt(document.getElementById('advanceMemberId').value);
    const amount = parseFloat(document.getElementById('advanceAmount').value);
    
    if (processAdvancePayment(memberId, amount)) {
        closeAdvancePaymentModal();
        renderAdvanceBalances();
        renderMemberDashboard();
    }
}

// Handle receipt upload
function handleReceiptUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('receiptImage');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select an image file.');
        return;
    }
    
    const month = parseInt(document.getElementById('receiptMonth').value);
    const year = parseInt(document.getElementById('receiptYear').value);
    const amount = parseFloat(document.getElementById('receiptAmount').value);
    
    // Get current member ID
    const member = members.find(m => m.name === currentUser.name && m.apartment === currentUser.apartment);
    if (!member) {
        alert('Member not found!');
        return;
    }
    
    uploadPaymentReceipt(file, member.id, month, year, amount)
        .then(receipt => {
            alert('Receipt uploaded successfully!');
            e.target.reset();
            renderMemberDashboard();
            renderMemberReceiptHistory(member.id);
        })
        .catch(error => {
            alert('Error uploading receipt: ' + error);
        });
}



// ============================================
// RESET DATA FUNCTIONALITY
// ============================================

// Open Reset Data Modal
function openResetDataModal() {
    if (currentUser.role !== 'admin') {
        alert('Only admins can access this feature.');
        return;
    }
    document.getElementById('resetDataModal').style.display = 'block';
}

// Close Reset Data Modal
function closeResetDataModal() {
    document.getElementById('resetDataModal').style.display = 'none';
    document.getElementById('resetDataForm').reset();
}

// Handle Reset Data with Password Verification
function handleResetData(e) {
    e.preventDefault();
    
    // Double check admin role
    if (currentUser.role !== 'admin') {
        alert('Unauthorized access! Only admins can reset data.');
        closeResetDataModal();
        return;
    }
    
    const enteredPassword = document.getElementById('resetPassword').value;
    
    // Validate password against current admin credentials
    const currentCreds = getAdminCredentials();
    if (enteredPassword !== currentCreds.password) {
        alert('❌ Incorrect password! Reset operation cancelled for security.');
        document.getElementById('resetPassword').value = '';
        return;
    }
    
    // Final confirmation
    const finalConfirm = confirm(
        'FINAL WARNING: You have entered the correct password.\n\n' +
        'All data will be PERMANENTLY DELETED.\n\n' +
        'Are you absolutely sure you want to proceed?'
    );
    
    if (!finalConfirm) {
        closeResetDataModal();
        return;
    }
    
    // Log the reset event BEFORE clearing data
    const resetEvent = {
        id: Date.now(),
        action: 'SYSTEM_RESET',
        user: currentUser.username || currentUser.name,
        userId: currentUser.id,
        timestamp: new Date().toISOString(),
        details: {
            membersCount: members.length,
            paymentsCount: paymentHistory.length,
            expensesCount: expenses.length,
            receiptsCount: receipts.length,
            advancePaymentsCount: advancePayments.length
        }
    };
    
    // Save reset event to a separate persistent log
    const resetLog = JSON.parse(localStorage.getItem('systemResetLog') || '[]');
    resetLog.push(resetEvent);
    localStorage.setItem('systemResetLog', JSON.stringify(resetLog));
    
    // Clear all application data
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.LAST_UPDATE);
    localStorage.removeItem(STORAGE_KEYS.FEEDBACK);
    localStorage.removeItem(STORAGE_KEYS.RECEIPTS);
    localStorage.removeItem(STORAGE_KEYS.ADVANCE_PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.DUE_CHANGES);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOG);
    
    // Reset in-memory data
    members = [];
    paymentHistory = [];
    expenses = [];
    feedback = [];
    receipts = [];
    advancePayments = [];
    dueChangeHistory = [];
    auditLog = [];
    
    // Save empty data
    saveData();
    
    // Close modal
    closeResetDataModal();
    
    // Refresh all displays
    renderMembers();
    renderExpenses();
    renderPaymentHistory();
    updateDashboard();
    renderFeedback();
    renderAdvanceBalances();
    renderDueChangeHistory();
    
    alert(
        '✅ All data has been successfully reset!\n\n' +
        'Reset Event ID: ' + resetEvent.id + '\n' +
        'Timestamp: ' + new Date(resetEvent.timestamp).toLocaleString('en-IN') + '\n' +
        'Performed by: ' + resetEvent.user + '\n\n' +
        'This reset event has been logged for security auditing.'
    );
}

// ============================================
// ADMIN CREDENTIALS MANAGEMENT
// ============================================

// Open Admin Credentials Modal
function openAdminCredentialsModal() {
    if (currentUser.role !== 'admin') {
        alert('Only admins can access this feature.');
        return;
    }
    document.getElementById('adminCredentialsModal').style.display = 'block';
}

// Close Admin Credentials Modal
function closeAdminCredentialsModal() {
    document.getElementById('adminCredentialsModal').style.display = 'none';
    document.getElementById('adminCredentialsForm').reset();
}

// Handle Admin Credentials Update
function handleAdminCredentialsUpdate(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newUsername = document.getElementById('newUsername').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Verify current password
    const currentCreds = getAdminCredentials();
    if (currentPassword !== currentCreds.password) {
        alert('Current password is incorrect!');
        return;
    }
    
    // Validate new password
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }
    
    // Update credentials
    const updatedCredentials = {
        username: newUsername,
        password: newPassword
    };
    
    saveAdminCredentials(updatedCredentials);
    adminCredentials = updatedCredentials;
    
    // Update current user session
    currentUser.username = newUsername;
    localStorage.setItem('loggedInUser', JSON.stringify(currentUser));
    
    alert('Admin credentials updated successfully! Please use new credentials for next login.');
    
    closeAdminCredentialsModal();
    
    // Update display
    document.getElementById('userName').textContent = 'Admin';
}

// Setup event listener for admin credentials form
document.addEventListener('DOMContentLoaded', () => {
    const adminForm = document.getElementById('adminCredentialsForm');
    if (adminForm) {
        adminForm.addEventListener('submit', handleAdminCredentialsUpdate);
    }
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('adminCredentialsModal');
        if (e.target === modal) {
            closeAdminCredentialsModal();
        }
    });
});
