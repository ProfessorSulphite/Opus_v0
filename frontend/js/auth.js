// Authentication management for EduTheo

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = utils.getLocalStorage(STORAGE_KEYS.token);
        this.init();
    }

    init() {
        // Initialize auth state
        if (this.token) {
            this.loadUserFromStorage();
        }
        
        // Setup auth forms
        this.setupAuthForms();
        this.setupPasswordToggles();
        this.setupTabSwitching();
    }

    // Setup authentication forms
    setupAuthForms() {
        const loginForm = utils.$('#login-form');
        const signupForm = utils.$('#signup-form');
        const demoBtn = utils.$('#demo-login');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        if (demoBtn) {
            demoBtn.addEventListener('click', () => this.handleDemoLogin());
        }
    }

    // Setup password toggle functionality
    setupPasswordToggles() {
        const passwordToggles = utils.$$('.password-toggle');
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = toggle.dataset.target;
                const input = utils.$(`#${targetId}`);
                const icon = toggle.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.setAttribute('data-lucide', 'eye-off');
                } else {
                    input.type = 'password';
                    icon.setAttribute('data-lucide', 'eye');
                }
                
                // Reinitialize Lucide icons
                if (window.lucide) {
                    lucide.createIcons({ nameAttr: 'data-lucide' });
                }
            });
        });
    }

    // Setup tab switching between login and signup
    setupTabSwitching() {
        const tabBtns = utils.$$('.tab-btn');
        const authForms = utils.$$('.auth-form');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                // Update tab buttons
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update forms
                authForms.forEach(form => {
                    form.classList.remove('active');
                    if (form.id === `${tab}-form`) {
                        form.classList.add('active');
                    }
                });
            });
        });
    }

    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const formData = utils.getFormData(form);

        // Validate form
        if (!formData.username || !formData.password) {
            utils.showToast('Please fill in all fields', 'error');
            return;
        }

        try {
            utils.setLoading(submitBtn, true);
            
            const response = await authAPI.login({
                username: formData.username,
                password: formData.password
            });

            if (response.access_token) {
                // Set token in auth manager
                this.token = response.access_token;
                utils.setLocalStorage(STORAGE_KEYS.token, response.access_token);
                
                // Load user info
                await this.loadCurrentUser();
                this.redirectToDashboard();
                utils.showSuccess('Login successful!');
            }
        } catch (error) {
            utils.handleError(error, 'login');
        } finally {
            utils.setLoading(submitBtn, false);
        }
    }

    // Handle signup form submission
    async handleSignup(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const formData = utils.getFormData(form);

        // Validate form
        if (!this.validateSignupForm(formData)) {
            return;
        }

        try {
            utils.setLoading(submitBtn, true);
            
            await authAPI.register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name || null
            });

            utils.showSuccess('Registration successful! Please login.');
            
            // Switch to login tab
            const loginTab = utils.$('.tab-btn[data-tab="login"]');
            if (loginTab) loginTab.click();
            
            // Pre-fill login form
            const loginForm = utils.$('#login-form');
            if (loginForm) {
                utils.setFormData(loginForm, {
                    username: formData.username
                });
            }
            
        } catch (error) {
            utils.handleError(error, 'signup');
        } finally {
            utils.setLoading(submitBtn, false);
        }
    }

    // Handle demo login
    async handleDemoLogin() {
        const demoBtn = utils.$('#demo-login');
        
        try {
            utils.setLoading(demoBtn, true);
            
            const response = await authAPI.login({
                username: 'testuser',
                password: 'testpass123'
            });

            if (response.access_token) {
                // Set token in auth manager
                this.token = response.access_token;
                utils.setLocalStorage(STORAGE_KEYS.token, response.access_token);
                
                // Load user info
                await this.loadCurrentUser();
                this.redirectToDashboard();
                utils.showSuccess('Demo login successful!');
            }
        } catch (error) {
            utils.handleError(error, 'demo login');
        } finally {
            utils.setLoading(demoBtn, false);
        }
    }

    // Validate signup form
    validateSignupForm(formData) {
        if (!formData.username) {
            utils.showToast('Username is required', 'error');
            return false;
        }

        if (!formData.email || !utils.validateEmail(formData.email)) {
            utils.showToast('Please enter a valid email address', 'error');
            return false;
        }

        if (!utils.validatePassword(formData.password)) {
            utils.showToast('Password must be at least 6 characters long', 'error');
            return false;
        }

        if (formData.password !== formData.confirm_password) {
            utils.showToast('Passwords do not match', 'error');
            return false;
        }

        return true;
    }

    // Load current user from API
    async loadCurrentUser() {
        try {
            // Ensure API client has the current token
            if (this.token) {
                api.setToken(this.token);
            }
            
            const user = await authAPI.getCurrentUser();
            this.setCurrentUser(user);
            return user;
        } catch (error) {
            console.error('Failed to load current user:', error);
            this.logout();
            throw error;
        }
    }

    // Load user from storage
    loadUserFromStorage() {
        const user = utils.getLocalStorage(STORAGE_KEYS.user);
        if (user) {
            this.currentUser = user;
        }
    }

    // Set current user
    setCurrentUser(user) {
        this.currentUser = user;
        utils.setLocalStorage(STORAGE_KEYS.user, user);
        this.updateUserUI();
    }

    // Update user interface with user info
    updateUserUI() {
        if (!this.currentUser) return;

        // Update user name displays
        const userNameElements = utils.$$('#user-name, #dashboard-user-name');
        userNameElements.forEach(element => {
            if (element) element.textContent = this.currentUser.full_name || this.currentUser.username;
        });

        // Update user initials
        const userInitialsElement = utils.$('#user-initials');
        if (userInitialsElement) {
            const initials = this.getUserInitials();
            userInitialsElement.textContent = initials;
        }
    }

    // Get user initials for avatar
    getUserInitials() {
        if (!this.currentUser) return 'U';
        
        const fullName = this.currentUser.full_name || this.currentUser.username;
        const names = fullName.split(' ');
        
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        
        return fullName.substring(0, 2).toUpperCase();
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!(this.token && this.currentUser);
    }

    // Logout user
    async logout() {
        try {
            await authAPI.logout();
        } catch (error) {
            console.warn('Logout API call failed:', error);
        }
        
        this.currentUser = null;
        this.token = null;
        
        // Clear user data
        utils.removeLocalStorage(STORAGE_KEYS.user);
        utils.removeLocalStorage(STORAGE_KEYS.token);
        
        // Redirect to login
        this.redirectToLogin();
        
        utils.showSuccess('Logged out successfully');
    }

    // Redirect to dashboard
    redirectToDashboard() {
        if (window.pageManager) {
            window.pageManager.showPage('dashboard');
        }
    }

    // Redirect to login
    redirectToLogin() {
        if (window.pageManager) {
            window.pageManager.showPage('login');
        }
    }

    // Setup logout handlers
    setupLogoutHandlers() {
        const logoutBtns = utils.$$('#logout-btn, .logout-btn');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
    }

    // Check authentication on page load
    async checkAuth() {
        if (!this.token) {
            return false;
        }
        
        if (this.token && !this.currentUser) {
            try {
                // Add timeout to prevent hanging
                const loadUserPromise = this.loadCurrentUser();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Load user timeout')), 3000)
                );
                
                await Promise.race([loadUserPromise, timeoutPromise]);
                return true;
            } catch (error) {
                console.error('Auth check failed:', error);
                this.logout();
                return false;
            }
        }
        return this.isAuthenticated();
    }
}

// Create auth manager instance
const authManager = new AuthManager();

// Export for global use
window.authManager = authManager;