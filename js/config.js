// Configuration file for Redmine Task Viewer
const config = {
    // API Configuration
    REDMINE_URL: window.REDMINE_URL || 'http://localhost:3001/redmine-api/redmine',
    API_KEY: window.REDMINE_API_KEY || '',

    // Storage Keys
    STORAGE_KEYS: {
        STATUSES: 'redmine_statuses',
        THEME: 'redmine_theme',
        USER: 'redmine_user'
    },

    // Default Settings
    DEFAULT_THEME: 'light',
    DEFAULT_STATUSES: ['10', '3', '6'], // Assigned, Develop, and reprogramming

    // API Endpoints
    ENDPOINTS: {
        ISSUES: '/issues.json',
        ISSUE_STATUSES: '/issue_statuses.json',
        ISSUE_DETAIL: (id) => `/issues/${id}.json`
    }
};

// Export configuration
export default config; 