import config from '../config.js';

class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

class ApiService {
    constructor() {
        this.baseUrl = config.REDMINE_URL;
    }

    async request(endpoint, options = {}) {
        try {
            const headers = this.getHeaders();
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers,
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new ApiError(
                    errorData.message || 'API request failed',
                    response.status,
                    errorData
                );
            }

            // For PUT requests, return success
            if (options.method === 'PUT') {
                return true;
            }

            return await response.json();
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                'Network error occurred',
                0,
                { originalError: error.message }
            );
        }
    }

    getHeaders() {
        const user = this.getUserFromStorage();
        if (!user) {
            throw new ApiError('User not authenticated', 401);
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(user.username + ':' + user.password)
        };
    }

    getUserFromStorage() {
        const userStr = localStorage.getItem(config.STORAGE_KEYS.USER);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    // API Methods
    async getIssues(queryParams = '') {
        return this.request(`${config.ENDPOINTS.ISSUES}${queryParams}`);
    }

    async getIssueStatuses() {
        return this.request(config.ENDPOINTS.ISSUE_STATUSES);
    }

    async getIssueDetail(id) {
        return this.request(config.ENDPOINTS.ISSUE_DETAIL(id));
    }

    async updateIssue(id, data) {
        return this.request(config.ENDPOINTS.ISSUE_DETAIL(id), {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async createIssue(data) {
        return this.request(config.ENDPOINTS.ISSUES, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

export const apiService = new ApiService(); 