import config from './config.js';
import { apiService } from './services/api.js';
import { validateForm, commonRules } from './utils/validation.js';

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
    const user = localStorage.getItem(config.STORAGE_KEYS.USER);
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
async function handleLogin(event) {
    event.preventDefault();

    const formData = {
        username: usernameInput.value,
        password: passwordInput.value
    };

    const { isValid, errors } = validateForm(formData, commonRules.login);
    if (!isValid) {
        Object.entries(errors).forEach(([field, error]) => {
            showNotification(`${field}: ${error}`, 5000);
        });
        return;
    }

    try {
        // Store user credentials
        localStorage.setItem(config.STORAGE_KEYS.USER, JSON.stringify(formData));
        
        // Redirect to main page
        window.location.href = 'index.html';
    } catch (error) {
        showNotification(`Login failed: ${error.message}`, 5000);
    }
}

// Event Listeners
loginForm.addEventListener('submit', handleLogin);

// Check login status when page loads
document.addEventListener('DOMContentLoaded', checkLogin); 