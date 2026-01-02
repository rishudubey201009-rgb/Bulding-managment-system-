// Login credentials (in production, this should be handled server-side)
// Get admin credentials from localStorage or use defaults
function getAdminCredentials() {
    const stored = localStorage.getItem('adminCredentials');
    if (stored) {
        return JSON.parse(stored);
    }
    // Default credentials
    return {
        username: 'admin',
        password: 'admin123'
    };
}

// Get members from localStorage for member login
function getMembers() {
    const storedMembers = localStorage.getItem('buildingMembers');
    return storedMembers ? JSON.parse(storedMembers) : [];
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        window.location.href = 'index.html';
    }
});

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const errorMessage = document.getElementById('errorMessage');
    
    let isValid = false;
    let memberData = null;
    
    if (role === 'admin') {
        // Admin login - check against stored credentials
        const adminCreds = getAdminCredentials();
        if (adminCreds.username === username && 
            adminCreds.password === password) {
            isValid = true;
        }
    } else {
        // Member login - check against registered members
        const members = getMembers();
        const member = members.find(m => 
            m.name.toLowerCase() === username.toLowerCase() && 
            m.apartment === password
        );
        
        if (member) {
            isValid = true;
            memberData = member;
        }
    }
    
    if (isValid) {
        // Store user session
        const userSession = {
            username: memberData ? memberData.name : username,
            role: role,
            loginTime: new Date().toISOString(),
            apartment: memberData ? memberData.apartment : null,
            memberId: memberData ? memberData.id : null
        };
        
        localStorage.setItem('loggedInUser', JSON.stringify(userSession));
        
        // Redirect to main page
        window.location.href = 'index.html';
    } else {
        // Show error message
        if (role === 'member') {
            errorMessage.textContent = 'Invalid name or apartment number! Please check your registered details.';
        } else {
            errorMessage.textContent = 'Invalid admin credentials!';
        }
        errorMessage.classList.add('show');
        
        // Hide error after 3 seconds
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 3000);
    }
});
