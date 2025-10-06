// API client for EduTheo backend communication

class APIClient {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
        this.timeout = API_CONFIG.timeout;
        this.token = utils.getLocalStorage(STORAGE_KEYS.token);
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        utils.setLocalStorage(STORAGE_KEYS.token, token);
    }

    // Remove authentication token
    removeToken() {
        this.token = null;
        utils.removeLocalStorage(STORAGE_KEYS.token);
    }

    // Get headers for requests
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: 'GET',
            headers: this.getHeaders(options.includeAuth !== false),
            ...options
        };

        // Handle FormData separately
        if (config.body && !(config.body instanceof FormData)) {
            config.body = JSON.stringify(config.body);
        } else if (config.body instanceof FormData) {
            // Remove Content-Type for FormData to let browser set it
            delete config.headers['Content-Type'];
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            config.signal = controller.signal;

            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 401 && options.includeAuth !== false) {
                    // Unauthorized, token is invalid or expired.
                    authManager.logout();
                }
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
                }
                throw new Error(errorData.detail || 'Request failed');
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Create API client instance
const api = new APIClient();

// Authentication endpoints
const authAPI = {
    // Login user
    async login(credentials) {
        try {
            const response = await api.post('/auth/login', credentials);
            if (response.access_token) {
                api.setToken(response.access_token);
            }
            return response;
        } catch (error) {
            throw new Error(error.message || 'Login failed');
        }
    },

    // Register user
    async register(userData) {
        try {
            return await api.post('/auth/register', userData);
        } catch (error) {
            throw new Error(error.message || 'Registration failed');
        }
    },

    // Get current user info
    async getCurrentUser() {
        try {
            return await api.get('/auth/me');
        } catch (error) {
            throw new Error(error.message || 'Failed to get user info');
        }
    },

    // Logout user
    async logout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.warn('Logout request failed:', error.message);
        } finally {
            api.removeToken();
            utils.removeLocalStorage(STORAGE_KEYS.user);
        }
    }
};

// Questions endpoints
const questionsAPI = {
    // Filter questions
    async filterQuestions(filters) {
        try {
            return await api.post('/questions/filter', filters);
        } catch (error) {
            throw new Error(error.message || 'Failed to filter questions');
        }
    },

    // Get random question
    async getQuestion(filters, excludeAttempted = false) {
        try {
            const params = excludeAttempted ? { exclude_attempted: true } : {};
            return await api.post(`/questions/get_question?${new URLSearchParams(params)}`, filters);
        } catch (error) {
            throw new Error(error.message || 'Failed to get question');
        }
    },

    async getTopics() {
        try {
            return await api.get('/questions/topics');
        } catch (error) {
            throw new Error(error.message || 'Failed to get topics');
        }
    },

    // Check answer
    async checkAnswer(submission) {
        try {
            return await api.post('/questions/check_answer', submission);
        } catch (error) {
            throw new Error(error.message || 'Failed to check answer');
        }
    },

    // Mark question for review
    async markQuestion(markData) {
        try {
            return await api.post('/questions/mark', markData);
        } catch (error) {
            throw new Error(error.message || 'Failed to mark question');
        }
    },

    // Get user's marks
    async getMarks(markType = null) {
        try {
            const params = markType ? { mark_type: markType } : {};
            return await api.get('/questions/marks', params);
        } catch (error) {
            throw new Error(error.message || 'Failed to get marks');
        }
    },

    // Remove mark
    async removeMark(markId) {
        try {
            return await api.delete(`/questions/marks/${markId}`);
        } catch (error) {
            throw new Error(error.message || 'Failed to remove mark');
        }
    },

    // Get chapters
    async getChapters() {
        try {
            return await api.get('/questions/chapters');
        } catch (error) {
            throw new Error(error.message || 'Failed to get chapters');
        }
    },

    // Get tags
    async getTags() {
        try {
            return await api.get('/questions/tags');
        } catch (error) {
            throw new Error(error.message || 'Failed to get tags');
        }
    },

    async getQuestionsCount() {
        try {
            return await api.get('/questions/count');
        } catch (error) {
            throw new Error(error.message || 'Failed to get question count');
        }
    }
};

// Analytics endpoints
const analyticsAPI = {
    // Get user analytics
    async getUserAnalytics() {
        try {
            return await api.get('/analytics/');
        } catch (error) {
            throw new Error(error.message || 'Failed to get analytics');
        }
    },

    // Get user statistics
    async getUserStats() {
        try {
            return await api.get('/analytics/stats');
        } catch (error) {
            throw new Error(error.message || 'Failed to get user statistics');
        }
    },

    // Get chapter progress
    async getProgress() {
        try {
            return await api.get('/analytics/progress');
        } catch (error) {
            throw new Error(error.message || 'Failed to get progress');
        }
    },

    // Get recent activity
    async getRecentActivity() {
        try {
            return await api.get('/analytics/recent');
        } catch (error) {
            throw new Error(error.message || 'Failed to get recent activity');
        }
    },
    
    // Get leaderboard
    async getLeaderboard() {
        try {
            return await api.get('/analytics/leaderboard');
        } catch (error) {
            throw new Error(error.message || 'Failed to get leaderboard');
        }
    }
};

// Export APIs for global use
window.api = api;
window.authAPI = authAPI;
window.questionsAPI = questionsAPI;
window.analyticsAPI = analyticsAPI;