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
            filters: {}
        };
        this.ws = null;
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
            const loginTab = target.closest('#login-tab-btn');
            const signupTab = target.closest('#signup-tab-btn');
            const navLink = target.closest('.nav-link');
            const themeToggle = target.closest('#theme-toggle');
            const logoutBtn = target.closest('#logout-btn');
            const startPracticeBtn = target.closest('#start-practice-btn');
            const submitAnswerBtn = target.closest('#submit-answer-btn');

            if (loginTab) this.switchAuthTab('login');
            if (signupTab) this.switchAuthTab('signup');
            if (navLink) {
                e.preventDefault();
                this.navigateTo(navLink.dataset.page);
            }
            if (themeToggle) this.toggleTheme();
            if (logoutBtn) {
                e.preventDefault();
                this.logout();
            }
            if (startPracticeBtn) this.startPractice();
            if (submitAnswerBtn) this.submitAnswer();
        });

        this.root.addEventListener('submit', (e) => {
            const target = e.target;
            if (target.id === 'login-form') {
                e.preventDefault();
                const formData = new FormData(target);
                const data = Object.fromEntries(formData.entries());
                this.login(data.username, data.password);
            }
            if (target.id === 'signup-form') {
                e.preventDefault();
                const formData = new FormData(target);
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
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected. Attempting to reconnect in 5 seconds...');
            this.ws = null;
            setTimeout(() => this.connectWebSocket(), 5000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.ws.close();
        };
    }

    showPage(pageId) {
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
        console.log('Toggling theme');
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
            alert(`Login failed: ${error.message}`);
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
            alert('Signup successful! Please log in.');
            this.switchAuthTab('login');
        } catch (error) {
            alert(`Signup failed: ${error.message}`);
        }
    }

    async fetchMe() {
        const response = await this.authenticatedFetch(`${this.api.baseUrl}/auth/me`);
        if (!response.ok) throw new Error('Failed to fetch user info');
        return await response.json();
    }

    logout() {
        if (this.ws) {
            this.ws.close();
        }
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
                    <p class="text-sm font-semibold text-gray-500 dark:text-gray-400">${question.chapter_name}</p>
                </div>
                <p class="text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                    ${question.question_text}
                </p>
            </div>
            <div class="px-6 sm:px-8 pb-6 sm:pb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${optionsHTML}
            </div>
            <div class="px-6 sm:px-8 py-4 bg-background-light dark:bg-background-dark/50 border-t border-slate-200 dark:border-slate-800">
                <div class="flex justify-end items-center">
                    <button id="submit-answer-btn" class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-slate-900 hover:bg-primary/90 transition-colors">
                        Submit Answer
                    </button>
                </div>
            </div>
        `;
    }

    async submitAnswer() {
        const selectedOption = document.querySelector('input[name="mcq_option"]:checked');
        if (!selectedOption) {
            alert('Please select an answer');
            return;
        }

        const question = this.practice.questions[this.practice.currentQuestionIndex];
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
                label.style.pointerEvents = 'none'; // Disable further clicks
                if(input.value.toLowerCase() === result.correct_answer.toLowerCase()) {
                    label.classList.add('border-green-500', 'bg-green-100', 'dark:bg-green-900');
                }
                if(input.value.toLowerCase() === answer.toLowerCase() && !result.is_correct) {
                    label.classList.add('border-red-500', 'bg-red-100', 'dark:bg-red-900');
                }
            });

            document.getElementById('submit-answer-btn').disabled = true;

            setTimeout(() => {
                this.practice.currentQuestionIndex++;
                if (this.practice.currentQuestionIndex < this.practice.questions.length) {
                    this.renderPracticeQuestion();
                } else {
                    alert('Practice session complete!');
                    this.navigateTo('dashboard');
                }
            }, 2000);

        } catch (error) {
            console.error('Failed to submit answer:', error);
        }
    }
}