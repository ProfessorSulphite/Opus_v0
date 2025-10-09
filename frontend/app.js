document.addEventListener('DOMContentLoaded', () => {
    const app = new EduTheoApp();
    window.app = app; // Make it globally accessible
    app.init();
});

class EduTheoApp {
    constructor() {
        this.root = document.getElementById('app');
        this.mainContent = document.getElementById('main-content');
        this.pages = ['login-page', 'main-app'];
        this.currentPage = null;
        this.api = {
            baseUrl: 'http://localhost:8000/api/v1',
            token: null,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        this.user = null;
        this.charts = {};
        this.practice = {
            questions: [],
            currentQuestionIndex: 0,
            currentHintIndex: 0,
            filters: {}
        };
        this.ws = null;
        this.aiChatWs = null;
        this.currentAIMessageElement = null; // Track current streaming message
    }

    init() {
        this.setupEventListeners();
        this.initTheme();
        this.checkToken();
    }

    async authenticatedFetch(url, options = {}) {
        const defaultOptions = {
            headers: this.api.headers
        };
        
        const mergedOptions = {
            ...options,
            headers: { ...defaultOptions.headers, ...options.headers, },
        };

        const response = await fetch(url, mergedOptions);

        if (response.status === 401) {
            console.error('Authentication error. Logging out.');
            this.logout();
            throw new Error('Unauthorized');
        }

        return response;
    }

    setupEventListeners() {
        this.root.addEventListener('click', (e) => {
            const target = e.target;
            if (target.closest('#login-tab-btn')) this.switchAuthTab('login');
            if (target.closest('#signup-tab-btn')) this.switchAuthTab('signup');
            if (target.closest('.nav-link')) {
                e.preventDefault();
                this.navigateTo(target.closest('.nav-link').dataset.page);
            }
            if (target.closest('#theme-toggle')) this.toggleTheme();
            if (target.closest('#logout-btn')) {
                e.preventDefault();
                this.logout();
            }
            if (target.closest('#start-practice-btn')) this.startPractice();
            if (target.closest('#submit-answer-btn')) this.submitAnswer();
            if (target.closest('#reset-analytics-btn')) {
                if (confirm('Are you sure you want to reset all your analytics data? This action cannot be undone.')) {
                    this.resetAnalytics();
                }
            }
            if (target.closest('#show-hint-btn')) this.showHint();
            if (target.closest('#prev-question-btn')) this.navigatePractice(-1);
            if (target.closest('#next-question-btn')) this.navigatePractice(1);
            
            const reviewWrongTab = target.closest('#review-wrong-tab');
            const reviewAttemptedTab = target.closest('#review-attempted-tab');
            if (reviewWrongTab) this.loadReviewContent('wrong');
            if (reviewAttemptedTab) this.loadReviewContent('attempted');

            const practiceWrongBtn = target.closest('#practice-wrong-btn');
            if (practiceWrongBtn) this.startWrongQuestionsPractice();

            if (target.closest('#google-login-btn')) {
                e.preventDefault();
                this.showToast('Google login is not configured yet.', 'info');
            }
            if (target.closest('#facebook-login-btn')) {
                e.preventDefault();
                this.showToast('Facebook login is not configured yet.', 'info');
            }
            if (target.closest('#ai-chat-send-btn')) this.sendAIChatMessage();
        });

        this.root.addEventListener('submit', (e) => {
            if (e.target.id === 'login-form') {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                this.login(data.username, data.password);
            }
            if (e.target.id === 'signup-form') {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                this.signup(data);
            }
        });
    }

    switchAuthTab(tab) {
        const loginTabBtn = document.getElementById('login-tab-btn');
        const signupTabBtn = document.getElementById('signup-tab-btn');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');

        if (tab === 'login') {
            loginTabBtn.classList.add('active');
            signupTabBtn.classList.remove('active');
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else {
            signupTabBtn.classList.add('active');
            loginTabBtn.classList.remove('active');
            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        }
    }

    async checkToken() {
        const token = localStorage.getItem('edutheo_token');
        if (token) {
            this.api.token = token;
            this.api.headers['Authorization'] = `Bearer ${token}`;
            try {
                this.user = await this.fetchMe();
                this.showPage('main-app');
                this.connectWebSocket();
                this.navigateTo('dashboard');
            } catch (error) {
                this.logout();
            }
        } else {
            this.showPage('login-page');
        }
    }

    connectWebSocket() {
        if (!this.user || this.ws) return;
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.ws = new WebSocket(`${proto}//localhost:8000/api/v1/analytics/ws/${this.user.id}`);

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'stats_update' && message.user_id === this.user.id) {
                    if (document.getElementById('progress-chart')) {
                        this.updateDashboardWithData(message.data);
                    }
                }
                if (message.type === 'analytics_reset' && message.user_id === this.user.id) {
                    this.updateDashboard();
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('Analytics WebSocket disconnected. Attempting to reconnect in 5 seconds...');
            this.ws = null;
            setTimeout(() => this.connectWebSocket(), 5000);
        };

        this.ws.onerror = (error) => {
            console.error('Analytics WebSocket error:', error);
            this.ws.close();
        };
    }

    showPage(pageId) {
        if (this.aiChatWs) {
            this.aiChatWs.close();
            this.aiChatWs = null;
        }
        this.pages.forEach(page => {
            document.getElementById(page)?.classList.remove('active');
        });
        document.getElementById(pageId)?.classList.add('active');
        this.currentPage = pageId;
    }

    navigateTo(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        this.renderPageContent(page);
    }

    renderPageContent(page) {
        const template = document.getElementById(`${page}-content-template`);
        if (this.mainContent && template) {
            this.mainContent.innerHTML = template.innerHTML;
            if (page === 'dashboard') this.updateDashboard();
            if (page === 'practice') this.initPracticePage();
            if (page === 'analytics') this.updateAnalyticsPage();
            if (page === 'review') this.updateReviewPage();
            if (page === 'ai-tutor') this.initAIChat();
            if (page === 'settings') this.updateSettingsPage();
        } else if (this.mainContent) {
            this.mainContent.innerHTML = `<div class="text-center p-8"><h2 class="text-2xl">Coming Soon</h2><p>${page} page is under construction.</p></div>`;
        }
    }

    initTheme() {
        const themeToggle = document.getElementById('theme-toggle')?.querySelector('span');
        const isDark = localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', isDark);
        if(themeToggle) themeToggle.textContent = isDark ? 'light_mode' : 'dark_mode';
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        const themeToggle = document.getElementById('theme-toggle')?.querySelector('span');
        if(themeToggle) themeToggle.textContent = isDark ? 'light_mode' : 'dark_mode';
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.api.baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ username, password })
            });
            if (!response.ok) throw new Error((await response.json()).detail || 'Login failed');
            const data = await response.json();
            this.api.token = data.access_token;
            localStorage.setItem('edutheo_token', data.access_token);
            this.api.headers['Authorization'] = `Bearer ${this.api.token}`;
            this.user = await this.fetchMe();
            this.showPage('main-app');
            this.connectWebSocket();
            this.navigateTo('dashboard');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    async signup(data) {
        try {
            const response = await fetch(`${this.api.baseUrl}/auth/register`, {
                method: 'POST',
                headers: this.api.headers,
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error((await response.json()).detail || 'Signup failed');
            this.showToast('Signup successful! Please verify your email (placeholder code: 123456).', 'success');
            this.switchAuthTab('login');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    async fetchMe() {
        const response = await this.authenticatedFetch(`${this.api.baseUrl}/auth/me`);
        if (!response.ok) throw new Error('Failed to fetch user info');
        return await response.json();
    }

    logout() {
        if (this.ws) this.ws.close();
        if (this.aiChatWs) this.aiChatWs.close();
        this.api.token = null;
        this.user = null;
        localStorage.removeItem('edutheo_token');
        delete this.api.headers['Authorization'];
        this.showPage('login-page');
    }

    async fetchDashboardData() {
        const response = await this.authenticatedFetch(`${this.api.baseUrl}/analytics/`);
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        return await response.json();
    }

    async updateDashboard() {
        if (this.user) {
            const welcomeMessage = document.querySelector('#main-content h1');
            if(welcomeMessage) welcomeMessage.textContent = `Welcome back, ${this.user.full_name || this.user.username}!`;
        }
        try {
            const data = await this.fetchDashboardData();
            this.updateDashboardWithData(data);
        } catch (error) {
            console.error('Failed to update dashboard:', error);
        }
    }

    updateDashboardWithData(data) {
        const stats = data.user_stats;
        const totalQuestionsElem = document.getElementById('total-questions');
        const avgScoreElem = document.getElementById('avg-score');
        const timeSpentElem = document.getElementById('time-spent');

        if (totalQuestionsElem) totalQuestionsElem.textContent = stats.total_questions_attempted;
        if (avgScoreElem) avgScoreElem.textContent = `${Math.round(stats.accuracy_percentage)}%`;
        if (timeSpentElem) timeSpentElem.textContent = `${(stats.total_time_spent / 3600).toFixed(1)} hours`;
        
        this.renderProgressChart(data.chapter_progress);
    }

    renderProgressChart(progressData) {
        const ctx = document.getElementById('progress-chart')?.getContext('2d');
        if (!ctx) return;
        if (this.charts.progress) this.charts.progress.destroy();
        this.charts.progress = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: progressData.map(p => p.chapter_name),
                datasets: [{
                    label: 'Accuracy by Chapter',
                    data: progressData.map(p => p.accuracy_percentage),
                    backgroundColor: 'rgba(82, 212, 17, 0.5)',
                    borderColor: 'rgba(82, 212, 17, 1)',
                    borderWidth: 1
                }]
            },
            options: { scales: { y: { beginAtZero: true, max: 100 } } }
        });
    }

    async updateAnalyticsPage() {
        try {
            const response = await this.authenticatedFetch(`${this.api.baseUrl}/analytics/detailed`);
            if (!response.ok) throw new Error('Failed to fetch detailed analytics');
            const data = await response.json();

            this.renderTrendsChart(data.trends);
            this.renderTopicsChart(data.insights.strengths, data.insights.improvement_areas);
            this.populateImprovementAreas(data.insights.improvement_areas);

        } catch (error) {
            console.error('Failed to update analytics page:', error);
            const analyticsContent = document.querySelector('.layout-content-container');
            if (analyticsContent) {
                analyticsContent.innerHTML = `<div class="text-center p-8"><h2 class="text-xl">Could not load analytics.</h2><p>${error.message}</p></div>`;
            }
        }
    }

    renderTrendsChart(trendsData) {
        const ctx = document.getElementById('trends-chart')?.getContext('2d');
        if (!ctx) return;
        if (this.charts.trends) this.charts.trends.destroy();

        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendsData.map(d => new Date(d.date).toLocaleDateString()),
                datasets: [{
                    label: 'Accuracy Over Time',
                    data: trendsData.map(d => d.accuracy),
                    borderColor: '#52d411',
                    backgroundColor: 'rgba(82, 212, 17, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    renderTopicsChart(strengths, weaknesses) {
        const ctx = document.getElementById('topics-chart')?.getContext('2d');
        if (!ctx) return;
        if (this.charts.topics) this.charts.topics.destroy();

        const allTopics = [...strengths, ...weaknesses];

        this.charts.topics = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: allTopics.map(t => t.name),
                datasets: [{
                    label: 'Topic Accuracy',
                    data: allTopics.map(t => t.accuracy),
                    backgroundColor: allTopics.map(t => t.accuracy >= 85 ? 'rgba(82, 212, 17, 0.6)' : 'rgba(255, 99, 132, 0.6)'),
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    populateImprovementAreas(areas) {
        const tableBody = document.getElementById('improvement-areas-table');
        if (!tableBody) return;

        if (areas.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="2" class="text-center p-4 text-gray-500">No specific areas for improvement found yet. Keep practicing!</td></tr>';
            return;
        }

        tableBody.innerHTML = areas.map(area => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${area.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                        <div class="w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div class="h-2 rounded-full bg-red-500" style="width: ${area.accuracy}%;"></div>
                        </div>
                        <p class="text-sm font-medium">${area.accuracy}%</p>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async initPracticePage() {
        const chapterFilter = document.getElementById('chapter-filter');
        const difficultyFilter = document.getElementById('difficulty-filter');
        
        try {
            const chaptersRes = await this.authenticatedFetch(`${this.api.baseUrl}/questions/chapters`);
            const chaptersData = await chaptersRes.json();
            
            if (chapterFilter) {
                chapterFilter.innerHTML = '<option value="">All Chapters</option>'; // Clear existing
                chaptersData.chapters.forEach(chapter => {
                    const option = document.createElement('option');
                    option.value = chapter.chapter_number;
                    option.textContent = `${chapter.chapter_name} (${chapter.total_questions} questions)`;
                    chapterFilter.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Failed to load practice filters:', error);
        }
    }

    async startPractice() {
        const chapterFilter = document.getElementById('chapter-filter');
        const difficultyFilter = document.getElementById('difficulty-filter');
        this.practice.filters = {
            chapter_numbers: chapterFilter.value ? [parseInt(chapterFilter.value)] : [],
            difficulty_levels: difficultyFilter.value ? [difficultyFilter.value] : [],
            limit: 10, // Let's practice 10 questions at a time
            offset: 0
        };

        try {
            const response = await this.authenticatedFetch(`${this.api.baseUrl}/questions/filter`, {
                method: 'POST',
                body: JSON.stringify(this.practice.filters)
            });
            const data = await response.json();
            this.practice.questions = data.questions;
            this.practice.questions.forEach(q => q.answered = false); // Initialize answered state
            this.practice.currentQuestionIndex = 0;
            this.renderPracticeQuestion();
        } catch (error) {
            console.error('Failed to start practice:', error);
        }
    }

    renderPracticeQuestion() {
        const question = this.practice.questions[this.practice.currentQuestionIndex];
        const practiceContent = document.getElementById('practice-content');
        if(!practiceContent || !question) {
            practiceContent.innerHTML = `<div class="text-center p-8"><h2 class="text-2xl">No questions found for these filters.</h2><p>Try selecting a different chapter or difficulty.</p></div>`;
            return;
        }

        this.practice.currentHintIndex = 0;

        const optionsHTML = Object.entries(question.options).map(([key, value]) => {
            return `<label class="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 has-[:checked]:bg-primary/10 has-[:checked]:border-primary dark:has-[:checked]:bg-primary/20 dark:has-[:checked]:border-primary cursor-pointer transition-all">
                        <input class="form-radio h-5 w-5 text-primary bg-background-light dark:bg-background-dark border-slate-300 dark:border-slate-600 focus:ring-primary focus:ring-offset-background-light dark:focus:ring-offset-background-dark" name="mcq_option" type="radio" value="${key}" />
                        <span class="text-slate-700 dark:text-slate-300">${value}</span>
                    </label>`
        }).join('');

        practiceContent.innerHTML = `
            <div class="p-6 sm:p-8">
                <div class="flex justify-between items-start mb-4">
                    <p class="text-sm font-semibold text-primary">Question ${this.practice.currentQuestionIndex + 1} of ${this.practice.questions.length}</p>
                    <div class="text-right">
                        <button id="show-hint-btn" class="text-sm text-primary font-semibold hidden">Show Hint</button>
                        <p class="text-sm font-semibold text-gray-500 dark:text-gray-400">${question.chapter_name}</p>
                    </div>
                </div>
                <p class="text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                    ${question.question_text}
                </p>
                <div id="hint-container" class="mt-4"></div>
            </div>
            <div class="px-6 sm:px-8 pb-6 sm:pb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${optionsHTML}
            </div>
            <div id="explanation-container" class="hidden mx-6 sm:mx-8 mb-6 p-4 bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-400 text-blue-700 dark:text-blue-300"></div>
            <div class="px-6 sm:px-8 py-4 bg-background-light dark:bg-background-dark/50 border-t border-slate-200 dark:border-slate-800">
                <div class="flex justify-between items-center">
                    <button id="prev-question-btn" class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Previous</button>
                    <div class="flex items-center">
                        <p id="practice-message" class="text-sm text-red-500 mr-4"></p>
                        <button id="submit-answer-btn" class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-slate-900 hover:bg-primary/90 transition-colors">Check Answer</button>
                    </div>
                    <button id="next-question-btn" class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Next</button>
                </div>
            </div>
        `;

        const showHintBtn = document.getElementById('show-hint-btn');
        if (question.hints && question.hints.length > 0) {
            showHintBtn.classList.remove('hidden');
        }

        this.updateNavButtons();
    }
    
    updateNavButtons() {
        console.log('--- updateNavButtons ---');
        const question = this.practice.questions[this.practice.currentQuestionIndex];
        if (!question) {
            console.log('No question found at index', this.practice.currentQuestionIndex);
            return;
        }
        const isAnswered = question.answered;
        console.log(`Index: ${this.practice.currentQuestionIndex}, TotalQ: ${this.practice.questions.length}, Answered: ${isAnswered}`);
        
        document.getElementById('prev-question-btn').disabled = this.practice.currentQuestionIndex === 0;
        
        const nextBtn = document.getElementById('next-question-btn');
        nextBtn.disabled = !isAnswered;
        console.log(`Next button disabled: ${nextBtn.disabled}`);
    }

    navigatePractice(direction) {
        const newIndex = this.practice.currentQuestionIndex + direction;

        if (newIndex >= this.practice.questions.length) {
            const practiceContent = document.getElementById('practice-content');
            practiceContent.innerHTML = `
                <div class="p-8 text-center">
                    <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Practice Complete!</h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">You have attempted all questions in this set.</p>
                    <div class="flex justify-center gap-4">
                        <button data-page="analytics" class="nav-link px-4 py-2 rounded-lg font-bold bg-primary text-slate-900 hover:bg-primary/90 transition-colors">View Analytics</button>
                        <button data-page="review" class="nav-link px-4 py-2 rounded-lg font-bold bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors">Review Answers</button>
                    </div>
                </div>
            `;
            return;
        }

        if (newIndex >= 0) {
            this.practice.currentQuestionIndex = newIndex;
            this.renderPracticeQuestion();
        }
    }

    showHint() {
        const question = this.practice.questions[this.practice.currentQuestionIndex];
        const hintContainer = document.getElementById('hint-container');
        const showHintBtn = document.getElementById('show-hint-btn');

        if (question.hints && this.practice.currentHintIndex < question.hints.length) {
            const hintElement = document.createElement('p');
            hintElement.innerHTML = `<strong>Hint ${this.practice.currentHintIndex + 1}:</strong> ${question.hints[this.practice.currentHintIndex]}`;
            hintElement.className = 'p-2 bg-yellow-100/50 dark:bg-yellow-900/30 rounded-lg mt-2';
            hintContainer.appendChild(hintElement);
            this.practice.currentHintIndex++;
        }

        if (!question.hints || this.practice.currentHintIndex >= question.hints.length) {
            showHintBtn.disabled = true;
            showHintBtn.textContent = 'No more hints';
        }
    }

    async submitAnswer() {
        const practiceMessage = document.getElementById('practice-message');
        practiceMessage.textContent = '';
        const selectedOption = document.querySelector('input[name="mcq_option"]:checked');
        if (!selectedOption) {
            practiceMessage.textContent = 'Please select an answer.';
            return;
        }

        const question = this.practice.questions[this.practice.currentQuestionIndex];
        question.answered = true; // Mark as answered
        const answer = selectedOption.value;

        try {
            const response = await this.authenticatedFetch(`${this.api.baseUrl}/questions/check_answer`, {
                method: 'POST',
                body: JSON.stringify({ question_id: question.id, user_answer: answer, time_spent: 10 })
            });
            const result = await response.json();
            
            const optionLabels = document.querySelectorAll('label.flex');
            optionLabels.forEach(label => {
                const input = label.querySelector('input');
                label.style.pointerEvents = 'none';
                if(input.value.toLowerCase() === result.correct_answer.toLowerCase()) {
                    label.classList.add('border-green-500', 'bg-green-100', 'dark:bg-green-900/50', 'text-green-800', 'dark:text-green-300');
                }
                if(input.value.toLowerCase() === answer.toLowerCase() && !result.is_correct) {
                    label.classList.add('border-red-500', 'bg-red-100', 'dark:bg-red-900/50', 'text-red-800', 'dark:text-red-300');
                }
            });

            const explanationContainer = document.getElementById('explanation-container');
            if (result.explanation) {
                explanationContainer.innerHTML = `<strong>Explanation:</strong> ${result.explanation}`;
                explanationContainer.classList.remove('hidden');
            }

            document.getElementById('submit-answer-btn').disabled = true;
            this.updateNavButtons();

        } catch (error) {
            console.error('Failed to submit answer:', error);
        }
    }

    async resetAnalytics() {
        try {
            const response = await this.authenticatedFetch(`${this.api.baseUrl}/analytics/reset`, {
                method: 'POST'
            });
            if (!response.ok) throw new Error((await response.json()).detail || 'Failed to reset analytics');
            this.showToast('Your analytics data has been successfully reset.', 'success');
            this.updateDashboard();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    async updateReviewPage() {
        // Load wrong answers by default
        this.loadReviewContent('wrong');
    }

    async loadReviewContent(type) {
        const wrongTab = document.getElementById('review-wrong-tab');
        const attemptedTab = document.getElementById('review-attempted-tab');
        const reviewContent = document.getElementById('review-content');
        const practiceWrongBtn = document.getElementById('practice-wrong-btn');
        
        reviewContent.innerHTML = '<p class="text-center py-8">Loading...</p>';

        wrongTab.classList.remove('border-primary', 'text-primary');
        attemptedTab.classList.remove('border-primary', 'text-primary');
        if (type === 'wrong') {
            wrongTab.classList.add('border-primary', 'text-primary');
            practiceWrongBtn.classList.remove('hidden');
        } else {
            attemptedTab.classList.add('border-primary', 'text-primary');
            practiceWrongBtn.classList.add('hidden');
        }

        try {
            const response = await this.authenticatedFetch(`${this.api.baseUrl}/questions/review/${type}`);
            const questions = await response.json();
            this.renderReviewQuestions(questions);
        } catch (error) {
            reviewContent.innerHTML = '<p class="text-center text-red-500 py-8">Could not load review questions.</p>';
            console.error('Failed to load review content:', error);
        }
    }

    renderReviewQuestions(questions) {
        const reviewContent = document.getElementById('review-content');
        if (questions.length === 0) {
            reviewContent.innerHTML = '<p class="text-center text-gray-500 py-8">No questions to review in this category.</p>';
            return;
        }

        const questionsHTML = questions.map(q => {
            const optionsHTML = Object.entries(q.options).map(([key, value]) => {
                let classes = 'p-2 border rounded-lg';
                if (key.toLowerCase() === q.correct_answer.toLowerCase()) {
                    classes += ' bg-green-100 border-green-300 dark:bg-green-900/50 dark:border-green-700';
                }
                return `<div class="${classes}">${key.toUpperCase()}: ${value}</div>`;
            }).join('');

            return `
            <div class="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-card-light dark:bg-card-dark">
                <p class="font-bold mb-2">${q.question_text}</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    ${optionsHTML}
                </div>
                ${q.explanations && q.explanations[q.correct_answer] ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-2"><strong>Explanation:</strong> ${q.explanations[q.correct_answer]}</p>` : ''}
            </div>
        `}).join('');

        reviewContent.innerHTML = questionsHTML;
    }

    async startWrongQuestionsPractice() {
        try {
            const response = await this.authenticatedFetch(`${this.api.baseUrl}/questions/review/wrong`);
            const questions = await response.json();
            if (questions.length === 0) {
                this.showToast("You have no incorrect questions to practice!", 'info');
                return;
            }
            // Convert QuestionResponse to QuestionPractice
            this.practice.questions = questions.map(q => ({
                id: q.id,
                question_id: q.question_id,
                question_text: q.question_text,
                options: q.options,
                hints: q.hints,
                chapter_name: q.chapter_name,
                chapter_number: q.chapter_number,
                difficulty_level: q.difficulty_level,
                tags: q.tags,
                answered: false // Reset answered state for practice
            }));
            this.practice.currentQuestionIndex = 0;
            this.navigateTo('practice');
            
            setTimeout(() => this.renderPracticeQuestion(), 100);
        } catch (error) {
            console.error('Failed to start practice session with wrong questions:', error);
            this.showToast('Could not start practice session.', 'error');
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        let bgColor = 'bg-gray-800';
        if (type === 'success') bgColor = 'bg-green-600';
        if (type === 'error') bgColor = 'bg-red-600';

        toast.className = `px-4 py-3 rounded-lg text-white ${bgColor} shadow-lg animate-fade-in-up`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('animate-fade-out-down');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    }

    updateSettingsPage() {
        console.log('updateSettingsPage called'); // Debug log
        const subInfo = document.getElementById('subscription-info');
        if (!subInfo || !this.user) {
            console.log('No subInfo or user:', { subInfo: !!subInfo, user: !!this.user }); // Debug log
            return;
        }

        const tier = this.user.subscription_tier;
        const queries = this.user.ai_queries_today || 0;
        const dailyLimit = (tier === 'pro') ? null : 50; // Changed back to 50 as requested
        const limit = (tier === 'pro') ? 'Unlimited' : dailyLimit;
        
        console.log('Settings page data:', { tier, queries, dailyLimit, limit }); // Debug log
        
        // Calculate progress percentage safely
        let progressPercentage = 100;
        if (tier === 'base' && dailyLimit > 0) {
            progressPercentage = Math.min((queries / dailyLimit) * 100, 100);
        }

        subInfo.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-medium text-foreground-light dark:text-foreground-dark">Current Plan</p>
                    <p class="text-2xl font-bold text-primary">${tier.charAt(0).toUpperCase() + tier.slice(1)}</p>
                </div>
                ${tier === 'base' ? '<button id="upgrade-btn" class="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-slate-900">Upgrade to Pro (PKR 200/mo)</button>' : ''}
            </div>
            <div class="mt-4">
                <p class="font-medium text-foreground-light dark:text-foreground-dark">Daily AI Queries</p>
                <p class="text-sm text-subtle-light dark:text-subtle-dark">You have used ${queries} of your ${limit} daily queries.</p>
                <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                    <div class="bg-primary h-2.5 rounded-full" style="width: ${progressPercentage}%"></div>
                </div>
            </div>
        `;
    }

    initAIChat() {
        if (!this.user) return;
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.aiChatWs = new WebSocket(`${proto}//localhost:8000/api/v1/ai/chat/${this.user.id}`);
        const chatHistory = document.getElementById('ai-chat-history');
        const chatInput = document.getElementById('ai-chat-input');
        const sendBtn = document.getElementById('ai-chat-send-btn');
        const typingIndicator = document.getElementById('typing-indicator');
        
        // Initialize markdown converter
        this.markdownConverter = new showdown.Converter({
            tables: true,
            strikethrough: true,
            tasklists: true,
            smoothLivePreview: true,
            headerLevelStart: 2
        });
        
        // Reset current message element
        this.currentAIMessageElement = null;
        this.isAITyping = false;
        this.aiMessageBuffer = ''; // Buffer to accumulate AI message text

        // Auto-resize textarea
        this.setupTextareaAutoResize(chatInput);

        this.aiChatWs.onopen = () => {
            this.appendAIChatMessage('AI Tutor', '## Welcome! 👋\n\nHello! How can I help you with your **physics questions** today? 🧪⚡\n\nFeel free to ask me about any physics concepts!', 'ai', true);
        };

        this.aiChatWs.onopen = () => {
            this.appendAIChatMessage('AI Tutor', 'Hello! How can I help you with your physics questions today? 🧪⚡', 'ai', true);
        };

        this.aiChatWs.onmessage = (event) => {
            let message = event.data;
            
            // Check if it's an error message
            try {
                const parsed = JSON.parse(message);
                if (parsed.type === 'error') {
                    this.showToast(parsed.detail, 'error');
                    this.appendAIChatMessage('AI Tutor', `## ❌ Error\n\n${parsed.detail}`, 'ai', true);
                    this.currentAIMessageElement = null;
                    this.setAITyping(false);
                    return;
                }
            } catch (e) {
                // Not JSON, it's a streaming text chunk
            }
            
            // Handle streaming text
            if (!this.currentAIMessageElement) {
                // Create a new message bubble for AI response
                this.setAITyping(true);
                this.aiMessageBuffer = ''; // Reset buffer
                this.currentAIMessageElement = this.createAIChatMessageElement('AI Tutor', '', 'ai', false);
                const chatHistory = document.getElementById('ai-chat-history');
                chatHistory.appendChild(this.currentAIMessageElement);
                this.scrollToBottom();
            }
            
            // Append the chunk to the buffer
            this.aiMessageBuffer += message;
            
            // Update the message element with rendered markdown
            const messageTextElement = this.currentAIMessageElement.querySelector('.message-text');
            if (messageTextElement) {
                // Check if this is the end of stream (empty message or specific end marker)
                if (message.trim() === '' || message === '[END]') {
                    // Remove typing cursor and mark as complete
                    messageTextElement.classList.remove('typing-cursor');
                    this.setAITyping(false);
                    this.currentAIMessageElement = null;
                    return;
                }
                
                // Render markdown for the accumulated text
                const htmlContent = this.markdownConverter.makeHtml(this.aiMessageBuffer);
                messageTextElement.innerHTML = htmlContent;
                this.scrollToBottom();
                
                // Add typing effect
                messageTextElement.classList.add('typing-animation');
                setTimeout(() => {
                    messageTextElement.classList.remove('typing-animation');
                }, 100);
            }
        };

        this.aiChatWs.onclose = () => {
            this.appendAIChatMessage('System', '🔌 Connection closed. Please refresh to reconnect.', 'system', true);
            this.currentAIMessageElement = null;
            this.setAITyping(false);
        };

        this.aiChatWs.onerror = (error) => {
            console.error('AI Chat WebSocket error:', error);
            this.appendAIChatMessage('System', '⚠️ Connection error occurred. Please try again.', 'system', true);
            this.currentAIMessageElement = null;
            this.setAITyping(false);
        };

        // Enhanced input handling
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendAIChatMessage();
            }
        });

        chatInput.addEventListener('input', () => {
            const hasText = chatInput.value.trim().length > 0;
            sendBtn.disabled = !hasText || this.isAITyping;
            sendBtn.classList.toggle('opacity-50', !hasText || this.isAITyping);
        });

        sendBtn.addEventListener('click', () => {
            this.sendAIChatMessage();
        });
    }

    setupTextareaAutoResize(textarea) {
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            const newHeight = Math.min(textarea.scrollHeight, 120);
            textarea.style.height = newHeight + 'px';
        });
    }

    setAITyping(isTyping) {
        this.isAITyping = isTyping;
        const typingIndicator = document.getElementById('typing-indicator');
        const sendBtn = document.getElementById('ai-chat-send-btn');
        const statusElement = document.getElementById('ai-status');
        
        if (typingIndicator) {
            typingIndicator.style.opacity = isTyping ? '1' : '0';
        }
        
        if (sendBtn) {
            sendBtn.disabled = isTyping;
            sendBtn.classList.toggle('opacity-50', isTyping);
        }
        
        if (statusElement) {
            statusElement.textContent = isTyping ? 'Thinking...' : 'Ready to help with your physics questions';
        }
    }

    scrollToBottom() {
        const chatHistory = document.getElementById('ai-chat-history');
        if (chatHistory) {
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    }

    sendAIChatMessage() {
        const chatInput = document.getElementById('ai-chat-input');
        const message = chatInput.value.trim();
        
        if (message && this.aiChatWs && this.aiChatWs.readyState === WebSocket.OPEN && !this.isAITyping) {
            // Add user message with animation
            this.appendAIChatMessage('You', message, 'user', true);
            
            // Send to WebSocket
            this.aiChatWs.send(message);
            
            // Clear input and reset height
            chatInput.value = '';
            chatInput.style.height = 'auto';
            
            // Reset current AI message element for new response
            this.currentAIMessageElement = null;
            
            // Update button state
            const sendBtn = document.getElementById('ai-chat-send-btn');
            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.classList.add('opacity-50');
            }
        }
    }

    createAIChatMessageElement(sender, message, type = 'ai', isComplete = false) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message-container opacity-0 transform translate-y-4';
        
        let avatarContent, bubbleClasses, textClasses, containerClasses;
        
        if (type === 'user') {
            avatarContent = `<div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">You</div>`;
            bubbleClasses = 'bg-blue-500 text-white rounded-2xl rounded-br-md';
            textClasses = 'text-white';
            containerClasses = 'flex flex-row-reverse gap-3 items-end';
        } else if (type === 'system') {
            avatarContent = `<div class="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5z"/>
                </svg>
            </div>`;
            bubbleClasses = 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl';
            textClasses = 'text-gray-600 dark:text-gray-400 text-sm';
            containerClasses = 'flex gap-3 items-end justify-center';
        } else {
            avatarContent = `<div class="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-green-400 flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
            </div>`;
            bubbleClasses = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md shadow-sm';
            textClasses = 'text-gray-800 dark:text-gray-200 prose prose-sm max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-primary prose-code:bg-gray-100 dark:prose-code:bg-gray-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded';
            containerClasses = 'flex gap-3 items-end';
        }

        const cursorClass = (!isComplete && type === 'ai') ? 'typing-cursor' : '';
        
        // For AI messages, render markdown if it's complete, otherwise show raw text with cursor
        let displayMessage = message;
        if (type === 'ai' && isComplete && message) {
            displayMessage = this.markdownConverter.makeHtml(message);
        }
        
        messageEl.innerHTML = `
            <div class="${containerClasses}">
                ${avatarContent}
                <div class="max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl">
                    <div class="px-4 py-3 ${bubbleClasses}">
                        <div class="message-text ${textClasses} ${cursorClass} leading-relaxed">${displayMessage}</div>
                    </div>
                    <div class="text-xs text-gray-500 mt-1 px-2">
                        ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </div>
            </div>
        `;
        
        // Add entrance animation
        setTimeout(() => {
            messageEl.classList.remove('opacity-0', 'transform', 'translate-y-4');
            messageEl.classList.add('transition-all', 'duration-300', 'ease-out');
        }, 50);
        
        return messageEl;
    }

    appendAIChatMessage(sender, message, type = 'ai', isComplete = true) {
        const chatHistory = document.getElementById('ai-chat-history');
        const messageEl = this.createAIChatMessageElement(sender, message, type, isComplete);
        chatHistory.appendChild(messageEl);
        this.scrollToBottom();
        
        if (type === 'ai' && isComplete) {
            this.setAITyping(false);
            this.currentAIMessageElement = null;
        }
    }
}