// Constants for localStorage
const STORAGE_KEYS = {
    USER: 'redmine_user',
    THEME: 'redmine_theme'
};

// Redmine API URL
const REDMINE_URL = 'http://localhost:3001/redmine-api/redmine';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const notification = document.getElementById('notification');

// Check if user is already logged in
function checkLogin() {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    if (user) {
        window.location.href = 'index.html';
    }
}

// Show notification
function showNotification(message, duration = 3000) {
    notification.textContent = message;
    notification.classList.remove('notification-hidden');
    setTimeout(() => {
        notification.classList.add('notification-hidden');
    }, duration);
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
        // Try to fetch issues as a test of authentication
        const response = await fetch(`${REDMINE_URL}/issues.json?limit=1`, {
            headers: {
                'Authorization': 'Basic ' + btoa(username + ':' + password),
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Store user credentials
            const userData = {
                username,
                password,
                timestamp: new Date().getTime()
            };
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
            
            // Redirect to main page
            window.location.href = 'index.html';
        } else {
            const errorText = await response.text();
            console.error('Login failed:', errorText);
            showNotification('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 5000);
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + error.message, 5000);
    }
});

// Check login status when page loads
checkLogin(); 