// Main application entry point for EduTheo

class App {
    constructor() {
        this.initialized = false;
        this.currentPage = 'login';
        this.pageManagers = {};
        this.init();
    }

    async init() {
        if (this.initialized) return;

        try {
            // Hide initial loading screen
            this.hideInitialLoading();
            
            // Initialize core components
            this.setupGlobalErrorHandling();
            this.setupPageManager();
            this.setupGlobalEventHandlers();
            // this.setupServiceWorker();
            
            // Check authentication and route to appropriate page
            await this.initializeAuth();
            
            // Initialize Lucide icons
            this.initializeLucide();
            
            // Setup mobile optimizations
            this.setupMobileOptimizations();
            
            // Setup keyboard navigation
            this.setupKeyboardNavigation();
            
            this.initialized = true;
            console.log('EduTheo app initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.hideInitialLoading();
            utils.showToast('Failed to initialize application', 'error');
            // Show login page as fallback
            this.pageManager.showPage('login');
        }
    }

    // Hide the initial loading screen
    hideInitialLoading() {
        const loadingScreen = utils.$('#loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    // Debug method to force show login (for troubleshooting)
    forceShowLogin() {
        console.log('Forcing login page...');
        this.hideInitialLoading();
        utils.hideLoading();
        authManager.logout();
        this.pageManager.showPage('login');
    }

    // Setup global error handling
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            utils.handleError(event.error, 'application');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            utils.handleError(event.reason, 'promise');
        });
    }

    // Setup page manager
    setupPageManager() {
        this.pageManager = new PageManager();
        window.pageManager = this.pageManager;
        
        // Store manager references
        this.pageManagers = {
            auth: window.authManager,
            dashboard: window.dashboardManager,
            practice: window.practiceManager,
            analytics: window.analyticsManager
        };
    }

    // Setup global event handlers
    setupGlobalEventHandlers() {
        // Navigation handlers
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('[data-page]');
            if (navLink) {
                e.preventDefault();
                const page = navLink.dataset.page;
                const options = navLink.dataset.options ? JSON.parse(navLink.dataset.options) : {};
                this.pageManager.showPage(page, options);
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.pageManager.showPage(e.state.page, e.state.options || {}, false);
            }
        });

        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && authManager.isAuthenticated()) {
                // Refresh data when user returns to tab
                this.refreshCurrentPageData();
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            utils.showToast('Connection restored', 'success');
            this.refreshCurrentPageData();
        });

        window.addEventListener('offline', () => {
            utils.showToast('No internet connection', 'warning');
        });
    }

    // Initialize authentication
    async initializeAuth() {
        try {
            // Clear loading and show login by default
            this.pageManager.showPage('login');
            
            // Check if we have a token
            const storedToken = utils.getLocalStorage(STORAGE_KEYS.token);
            if (!storedToken) {
                console.log('No stored token found, showing login');
                return;
            }
            
            // Set token in auth manager
            authManager.token = storedToken;
            
            // Add timeout to prevent hanging
            const authCheckPromise = authManager.checkAuth();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Auth check timeout')), 5000)
            );
            
            const isAuthenticated = await Promise.race([authCheckPromise, timeoutPromise]);
            
            if (isAuthenticated) {
                // User is logged in, redirect to dashboard
                console.log('User authenticated, showing dashboard');
                this.pageManager.showPage('dashboard');
            } else {
                // User is not authenticated, stay on login
                console.log('User not authenticated, staying on login');
                this.pageManager.showPage('login');
            }
        } catch (error) {
            console.error('Auth initialization failed:', error);
            // Clear any stale auth data and show login
            authManager.logout();
            this.pageManager.showPage('login');
        }
    }

    // Initialize Lucide icons
    initializeLucide() {
        if (window.lucide) {
            lucide.createIcons({
                nameAttr: 'data-lucide'
            });
        } else {
            console.warn('Lucide icons not loaded');
        }
    }

    // Setup service worker for offline support
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.warn('Service Worker registration failed:', error);
                });
        }
    }

    // Setup mobile optimizations
    setupMobileOptimizations() {
        // Add mobile class if on mobile device
        if (utils.isMobile()) {
            document.body.classList.add('mobile');
        }

        // Handle mobile viewport
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(meta);
        }

        // Handle touch events for better mobile experience
        document.addEventListener('touchstart', () => {}, { passive: true });
    }

    // Setup keyboard navigation
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // ESC key to close modals/overlays
            if (e.key === 'Escape') {
                this.closeModals();
            }
            
            // Tab navigation enhancements
            if (e.key === 'Tab') {
                // Add visual focus indicators
                document.body.classList.add('using-keyboard');
            }
        });

        // Remove keyboard class on mouse use
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('using-keyboard');
        });
    }

    // Close all modals/overlays
    closeModals() {
        const modals = utils.$$('.modal.visible, .overlay.visible, .dropdown.open');
        modals.forEach(modal => {
            modal.classList.remove('visible', 'open');
        });
    }

    // Refresh current page data
    async refreshCurrentPageData() {
        try {
            const currentPage = this.pageManager.currentPage;
            
            switch (currentPage) {
                case 'dashboard':
                    if (window.dashboardManager) {
                        await window.dashboardManager.loadDashboard();
                    }
                    break;
                case 'analytics':
                    if (window.analyticsManager) {
                        await window.analyticsManager.loadAnalytics();
                    }
                    break;
                // Practice page doesn't need auto-refresh during sessions
            }
        } catch (error) {
            console.error('Failed to refresh page data:', error);
        }
    }

    // Global app methods
    showLoading(message = 'Loading...') {
        utils.showLoading(message);
    }

    hideLoading() {
        utils.hideLoading();
    }

    showToast(message, type = 'info') {
        utils.showToast(message, type);
        document.getElementById('loading-screen').style.display = 'none';
    }

    handleError(error, context = 'application') {
        utils.handleError(error, context);
    }
}

// Page Manager class
class PageManager {
    constructor() {
        this.currentPage = null;
        this.pages = ['login', 'dashboard', 'practice', 'analytics'];
        this.history = [];
    }

    // Show specific page
    showPage(page, options = {}, addToHistory = true) {
        if (!this.pages.includes(page)) {
            console.error(`Unknown page: ${page}`);
            return;
        }

        // Check authentication for protected pages
        if (page !== 'login' && !authManager.isAuthenticated()) {
            this.showPage('login');
            return;
        }

        // Hide current page
        if (this.currentPage) {
            this.hidePage(this.currentPage);
        }

        // Show new page
        this.currentPage = page;
        this.renderPage(page, options);
        
        // Add to browser history
        if (addToHistory) {
            const state = { page, options };
            const url = page === 'login' ? '/' : `/${page}`;
            history.pushState(state, '', url);
        }

        // Update navigation
        this.updateNavigation(page);
        
        // Initialize page if needed
        this.initializePage(page, options);
    }

    // Hide page
    hidePage(page) {
        const pageElement = utils.$(`#${page}-page`);
        if (pageElement) {
            pageElement.classList.remove('active');
        }

        // Cleanup page-specific resources
        this.cleanupPage(page);
    }

    // Render page
    renderPage(page, options = {}) {
        // Hide all pages
        this.pages.forEach(p => {
            const pageEl = utils.$(`#${p}-page`);
            if (pageEl) pageEl.classList.remove('active');
        });

        // Show target page
        const pageElement = utils.$(`#${page}-page`);
        if (pageElement) {
            pageElement.classList.add('active');
        }

        // Update document title
        this.updateTitle(page);
    }

    // Update navigation
    updateNavigation(page) {
        // Update nav buttons
        const navButtons = utils.$$('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === page) {
                btn.classList.add('active');
            }
        });

        // Show/hide navigation based on page
        const navigation = utils.$('#main-navigation');
        if (navigation) {
            if (page === 'login') {
                navigation.style.display = 'none';
            } else {
                navigation.style.display = '';
            }
        }
    }

    // Update document title
    updateTitle(page) {
        const titles = {
            login: 'EduTheo - Login',
            dashboard: 'EduTheo - Dashboard',
            practice: 'EduTheo - Practice',
            analytics: 'EduTheo - Analytics'
        };
        
        document.title = titles[page] || 'EduTheo';
    }

    // Initialize page-specific functionality
    async initializePage(page, options = {}) {
        try {
            // Show loading indicator
            utils.showLoading();
            
            switch (page) {
                case 'login':
                    // Login page is handled by AuthManager
                    utils.hideLoading();
                    break;
                    
                case 'dashboard':
                    if (window.dashboardManager) {
                        // Add timeout to prevent hanging
                        const loadPromise = window.dashboardManager.loadDashboard();
                        const timeoutPromise = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Dashboard load timeout')), 10000)
                        );
                        
                        await Promise.race([loadPromise, timeoutPromise]);
                    }
                    utils.hideLoading();
                    break;
                    
                case 'practice':
                    if (window.practiceManager) {
                        await window.practiceManager.initializePractice(options);
                    }
                    utils.hideLoading();
                    break;
                    
                case 'analytics':
                    if (window.analyticsManager) {
                        await window.analyticsManager.initializeAnalytics(options);
                    }
                    utils.hideLoading();
                    break;
            }
        } catch (error) {
            console.error(`Failed to initialize ${page} page:`, error);
            utils.hideLoading();
            utils.handleError(error, `${page} page initialization`);
            
            // If dashboard fails to load, show login
            if (page === 'dashboard') {
                authManager.logout();
                this.showPage('login');
            }
        }
    }

    // Cleanup page-specific resources
    cleanupPage(page) {
        switch (page) {
            case 'dashboard':
                if (window.dashboardManager) {
                    window.dashboardManager.cleanup();
                }
                break;
                
            case 'practice':
                if (window.practiceManager) {
                    window.practiceManager.cleanup();
                }
                break;
                
            case 'analytics':
                if (window.analyticsManager) {
                    window.analyticsManager.cleanup();
                }
                break;
        }
    }

    // Go back to previous page
    goBack() {
        if (this.history.length > 0) {
            const previousPage = this.history.pop();
            this.showPage(previousPage, {}, false);
        } else {
            // Default back behavior
            if (this.currentPage !== 'dashboard') {
                this.showPage('dashboard');
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // Add debug helper to window for troubleshooting
    window.forceLogin = () => window.app.forceShowLogin();
    
    console.log('Debug: window.forceLogin() available to force show login page');
});

// Export for global use
window.App = App;
window.PageManager = PageManager;