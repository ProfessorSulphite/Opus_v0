// Utility functions for the EduTheo application

// API configuration
const API_CONFIG = {
    baseURL: 'http://localhost:8000/api/v1',
    timeout: 10000
};

// Local storage keys
const STORAGE_KEYS = {
    token: 'edutheo_token',
    user: 'edutheo_user',
    settings: 'edutheo_settings',
    practiceFilters: 'edutheo_practice_filters'
};

// Utility functions
const utils = {
    // DOM manipulation
    $: (selector) => document.querySelector(selector),
    $$: (selector) => document.querySelectorAll(selector),
    
    // Element creation
    createElement: (tag, className = '', content = '') => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    },
    
    // Show/hide elements
    show: (element) => {
        if (typeof element === 'string') element = utils.$(element);
        if (element) element.classList.remove('hidden');
    },
    
    hide: (element) => {
        if (typeof element === 'string') element = utils.$(element);
        if (element) element.classList.add('hidden');
    },
    
    toggle: (element) => {
        if (typeof element === 'string') element = utils.$(element);
        if (element) element.classList.toggle('hidden');
    },
    
    // Class manipulation
    addClass: (element, className) => {
        if (typeof element === 'string') element = utils.$(element);
        if (element) element.classList.add(className);
    },
    
    removeClass: (element, className) => {
        if (typeof element === 'string') element = utils.$(element);
        if (element) element.classList.remove(className);
    },
    
    toggleClass: (element, className) => {
        if (typeof element === 'string') element = utils.$(element);
        if (element) element.classList.toggle(className);
    },
    
    // Event handling
    on: (element, event, handler) => {
        if (typeof element === 'string') element = utils.$(element);
        if (element) element.addEventListener(event, handler);
    },
    
    off: (element, event, handler) => {
        if (typeof element === 'string') element = utils.$(element);
        if (element) element.removeEventListener(event, handler);
    },
    
    // Form handling
    getFormData: (form) => {
        if (typeof form === 'string') form = utils.$(form);
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData) {
            data[key] = value;
        }
        return data;
    },
    
    setFormData: (form, data) => {
        if (typeof form === 'string') form = utils.$(form);
        for (const [key, value] of Object.entries(data)) {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = Boolean(value);
                } else {
                    input.value = value;
                }
            }
        }
    },
    
    clearForm: (form) => {
        if (typeof form === 'string') form = utils.$(form);
        if (form) form.reset();
    },
    
    // Validation
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    validatePassword: (password) => {
        return password && password.length >= 6;
    },
    
    // Local storage
    setLocalStorage: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },
    
    getLocalStorage: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },
    
    removeLocalStorage: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },
    
    clearLocalStorage: () => {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    },
    
    // URL and query parameters
    getQueryParam: (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },
    
    setQueryParam: (param, value) => {
        const url = new URL(window.location);
        url.searchParams.set(param, value);
        window.history.pushState({}, '', url);
    },
    
    // Time and date formatting
    formatTime: (seconds) => {
        if (!seconds || seconds < 0) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },
    
    formatDate: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    formatDateTime: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Number formatting
    formatPercentage: (value, decimals = 1) => {
        if (value === null || value === undefined) return '0%';
        return `${Number(value).toFixed(decimals)}%`;
    },
    
    formatNumber: (value, decimals = 0) => {
        if (value === null || value === undefined) return '0';
        return Number(value).toFixed(decimals);
    },
    
    // Debounce and throttle
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Deep clone
    deepClone: (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => utils.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = utils.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    },
    
    // Random string generation
    generateId: (length = 8) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },
    
    // Array utilities
    shuffleArray: (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    // Loading state management
    setLoading: (element, loading = true) => {
        if (typeof element === 'string') element = utils.$(element);
        if (!element) return;
        
        if (loading) {
            element.disabled = true;
            element.classList.add('loading');
            const originalText = element.textContent;
            element.dataset.originalText = originalText;
            element.innerHTML = '<i class="loading-spinner"></i> Loading...';
        } else {
            element.disabled = false;
            element.classList.remove('loading');
            element.innerHTML = element.dataset.originalText || element.textContent;
        }
    },
    
    // Error handling
    handleError: (error, context = '') => {
        console.error(`Error in ${context}:`, error);
        
        let message = 'An unexpected error occurred';
        if (error.response && error.response.data && error.response.data.detail) {
            message = error.response.data.detail;
        } else if (error.message) {
            message = error.message;
        }
        
        utils.showToast(message, 'error');
        return message;
    },
    
    // Success message
    showSuccess: (message) => {
        utils.showToast(message, 'success');
    },
    
    // Toast notifications
    showToast: (message, type = 'info', duration = 5000) => {
        const toastContainer = utils.$('#toast-container') || utils.createToastContainer();
        
        const toast = utils.createElement('div', `toast ${type}`);
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-title">${utils.getToastTitle(type)}</div>
                <div class="toast-description">${message}</div>
            </div>
            <button class="toast-close">
                <i data-lucide="x"></i>
            </button>
        `;
        
        // Initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }
        
        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => utils.removeToast(toast));
        
        toastContainer.appendChild(toast);
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => utils.removeToast(toast), duration);
        }
        
        return toast;
    },
    
    createToastContainer: () => {
        const container = utils.createElement('div', 'toast-container');
        container.id = 'toast-container';
        document.body.appendChild(container);
        return container;
    },
    
    removeToast: (toast) => {
        if (toast && toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    },
    
    getToastTitle: (type) => {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };
        return titles[type] || 'Notification';
    },

    // Loading and progress utilities
    showLoading: (message = 'Loading...') => {
        let loader = utils.$('#global-loader');
        if (!loader) {
            loader = utils.createElement('div', 'global-loader');
            loader.id = 'global-loader';
            loader.innerHTML = `
                <div class="loader-backdrop">
                    <div class="loader-content">
                        <div class="spinner"></div>
                        <p class="loader-message">${message}</p>
                    </div>
                </div>
            `;
            document.body.appendChild(loader);
        } else {
            loader.querySelector('.loader-message').textContent = message;
            loader.style.display = 'flex';
        }
    },

    hideLoading: () => {
        const loader = utils.$('#global-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    },

    // Animation utilities
    animateCounter: (element, endValue, suffix = '') => {
        if (typeof element === 'string') element = utils.$(element);
        if (!element) return;

        const startValue = 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(startValue + (endValue - startValue) * progress);
            element.textContent = currentValue + suffix;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    // Time utilities
    getTimeAgo: (date) => {
        if (!date) return '';
        
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return utils.formatDate(date);
    },

    // Device detection
    isMobile: () => {
        return window.innerWidth <= 768;
    },

    isTablet: () => {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    },

    isDesktop: () => {
        return window.innerWidth > 1024;
    }
};

// Export utils for global use
window.utils = utils;
window.API_CONFIG = API_CONFIG;
window.STORAGE_KEYS = STORAGE_KEYS;