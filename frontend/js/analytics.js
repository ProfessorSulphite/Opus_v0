// Analytics page management for EduTheo

class AnalyticsManager {
    constructor() {
        this.analyticsData = null;
        this.currentView = 'overview';
        this.charts = {};
        this.dateRange = {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            end: new Date()
        };
        this.init();
    }

    init() {
        this.setupViewTabs();
        this.setupDateRangePicker();
        this.setupExportHandlers();
        this.setupRefreshHandler();
    }

    // Setup view tabs
    setupViewTabs() {
        const tabBtns = utils.$$('.analytics-tab');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });
    }

    // Setup date range picker
    setupDateRangePicker() {
        const dateRangeBtn = utils.$('#date-range-btn');
        const applyDateRangeBtn = utils.$('#apply-date-range');
        const startDateInput = utils.$('#start-date');
        const endDateInput = utils.$('#end-date');

        if (dateRangeBtn) {
            dateRangeBtn.addEventListener('click', () => {
                this.toggleDateRangePicker();
            });
        }

        if (applyDateRangeBtn) {
            applyDateRangeBtn.addEventListener('click', () => {
                this.applyDateRange();
            });
        }

        // Set default date values
        if (startDateInput && endDateInput) {
            startDateInput.value = this.formatDateForInput(this.dateRange.start);
            endDateInput.value = this.formatDateForInput(this.dateRange.end);
        }
    }

    // Setup export handlers
    setupExportHandlers() {
        const exportBtn = utils.$('#export-analytics');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportAnalytics();
            });
        }
    }

    // Setup refresh handler
    setupRefreshHandler() {
        const refreshBtn = utils.$('#refresh-analytics');
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshAnalytics();
            });
        }
    }

    // Switch analytics view
    switchView(view) {
        this.currentView = view;
        
        // Update tab buttons
        const tabBtns = utils.$$('.analytics-tab');
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });

        // Update content
        this.renderView(view);
    }

    // Load analytics data
    async loadAnalytics() {
        try {
            utils.showLoading('Loading analytics...');
            
            const analyticsData = await analyticsAPI.getUserAnalytics();

            this.analyticsData = analyticsData;

            this.renderCurrentView();
            utils.hideLoading();
            
        } catch (error) {
            utils.hideLoading();
            utils.handleError(error, 'loading analytics');
        }
    }

    // Render current view
    renderCurrentView() {
        this.renderView(this.currentView);
    }

    // Render specific view
    renderView(view) {
        const contentContainer = utils.$('#analytics-content');
        if (!contentContainer) return;

        switch (view) {
            case 'overview':
                this.renderOverview(contentContainer);
                break;
            case 'progress':
                this.renderProgress(contentContainer);
                break;
            case 'performance':
                this.renderPerformance(contentContainer);
                break;
            case 'accuracy':
                this.renderAccuracy(contentContainer);
                break;
            case 'time':
                this.renderTimeAnalysis(contentContainer);
                break;
            default:
                this.renderOverview(contentContainer);
        }
    }

    // Render overview
    renderOverview(container) {
        if (!this.analyticsData) {
            this.loadAnalytics();
            return;
        }

        const stats = this.analyticsData.user_stats;
        
        container.innerHTML = `
            <div class="analytics-overview">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i data-lucide="target"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${Math.round(stats.accuracy || 0)}%</div>
                            <div class="stat-label">Overall Accuracy</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i data-lucide="clock"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${Math.round((stats.total_time_spent || 0) / 3600)}h</div>
                            <div class="stat-label">Total Time</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i data-lucide="zap"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.current_streak || 0}</div>
                            <div class="stat-label">Current Streak</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i data-lucide="book-open"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.chapters_completed || 0}</div>
                            <div class="stat-label">Chapters Completed</div>
                        </div>
                    </div>
                </div>
                
                <div class="charts-section">
                    <div class="chart-container">
                        <h3>Progress Over Time</h3>
                        <div id="progress-chart" class="chart"></div>
                    </div>
                    
                    <div class="chart-container">
                        <h3>Performance by Chapter</h3>
                        <div id="chapter-performance-chart" class="chart"></div>
                    </div>
                </div>
                
                <div class="insights-section">
                    <h3>Insights & Recommendations</h3>
                    <div id="insights-container"></div>
                </div>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }

        // Render charts
        this.renderProgressChart();
        this.renderChapterPerformanceChart();
        this.renderInsights();
    }

    // Render progress view
    renderProgress(container) {
        if (!this.analyticsData) {
            this.loadAnalytics();
            return;
        }

        container.innerHTML = `
            <div class="analytics-progress">
                <div class="progress-summary">
                    <h3>Learning Progress</h3>
                    <div class="progress-metrics">
                        <div class="metric">
                            <span class="metric-value">${this.analyticsData.user_stats.total_questions || 0}</span>
                            <span class="metric-label">Questions Answered</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${this.analyticsData.user_stats.correct_answers || 0}</span>
                            <span class="metric-label">Correct Answers</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${this.analyticsData.user_stats.longest_streak || 0}</span>
                            <span class="metric-label">Longest Streak</span>
                        </div>
                    </div>
                </div>
                
                <div class="progress-charts">
                    <div class="chart-container">
                        <h4>Daily Practice Activity</h4>
                        <div id="daily-activity-chart" class="chart"></div>
                    </div>
                    
                    <div class="chart-container">
                        <h4>Streak History</h4>
                        <div id="streak-chart" class="chart"></div>
                    </div>
                </div>
                
                <div class="chapter-progress">
                    <h4>Chapter Progress</h4>
                    <div id="chapter-progress-list"></div>
                </div>
            </div>
        `;

        this.renderDailyActivityChart();
        this.renderStreakChart();
        this.renderChapterProgress();
    }

    // Render performance view
    renderPerformance(container) {
        if (!this.analyticsData) {
            this.loadAnalytics();
            return;
        }

        container.innerHTML = `
            <div class="analytics-performance">
                <div class="performance-overview">
                    <h3>Performance Analysis</h3>
                    <div class="performance-grid">
                        <div class="performance-card">
                            <h4>Response Time</h4>
                            <div class="performance-metric">
                                <span class="metric-value">${this.getAverageResponseTime()}s</span>
                                <span class="metric-change ${this.getResponseTimeChange() > 0 ? 'positive' : 'negative'}">
                                    ${this.getResponseTimeChange() > 0 ? '+' : ''}${this.getResponseTimeChange()}%
                                </span>
                            </div>
                        </div>
                        
                        <div class="performance-card">
                            <h4>Accuracy Trend</h4>
                            <div class="performance-metric">
                                <span class="metric-value">${Math.round(this.analyticsData.user_stats.accuracy || 0)}%</span>
                                <span class="metric-change ${this.getAccuracyChange() > 0 ? 'positive' : 'negative'}">
                                    ${this.getAccuracyChange() > 0 ? '+' : ''}${this.getAccuracyChange()}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="performance-charts">
                    <div class="chart-container">
                        <h4>Accuracy by Difficulty</h4>
                        <div id="difficulty-performance-chart" class="chart"></div>
                    </div>
                    
                    <div class="chart-container">
                        <h4>Performance Trends</h4>
                        <div id="performance-trends-chart" class="chart"></div>
                    </div>
                </div>
                
                <div class="weak-areas">
                    <h4>Areas for Improvement</h4>
                    <div id="weak-areas-list"></div>
                </div>
            </div>
        `;

        this.renderDifficultyPerformanceChart();
        this.renderPerformanceTrendsChart();
        this.renderWeakAreas();
    }

    // Render accuracy view
    renderAccuracy(container) {
        container.innerHTML = `
            <div class="analytics-accuracy">
                <div class="accuracy-summary">
                    <h3>Accuracy Analysis</h3>
                    <div class="accuracy-breakdown">
                        <div class="accuracy-circle">
                            <div class="circle-progress" data-percentage="${Math.round(this.analyticsData?.stats?.accuracy || 0)}">
                                <span class="percentage">${Math.round(this.analyticsData?.stats?.accuracy || 0)}%</span>
                            </div>
                        </div>
                        <div class="accuracy-details">
                            <div class="detail-item">
                                <span class="label">Correct:</span>
                                <span class="value">${this.analyticsData?.stats?.correct_answers || 0}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Incorrect:</span>
                                <span class="value">${this.analyticsData?.stats?.incorrect_answers || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="accuracy-charts">
                    <div class="chart-container">
                        <h4>Accuracy by Chapter</h4>
                        <div id="chapter-accuracy-chart" class="chart"></div>
                    </div>
                    
                    <div class="chart-container">
                        <h4>Accuracy Over Time</h4>
                        <div id="accuracy-timeline-chart" class="chart"></div>
                    </div>
                </div>
            </div>
        `;

        this.renderAccuracyCircle();
        this.renderChapterAccuracyChart();
        this.renderAccuracyTimelineChart();
    }

    // Render time analysis view
    renderTimeAnalysis(container) {
        container.innerHTML = `
            <div class="analytics-time">
                <div class="time-summary">
                    <h3>Time Analysis</h3>
                    <div class="time-metrics">
                        <div class="time-card">
                            <h4>Total Time</h4>
                            <span class="time-value">${this.formatTime(this.analyticsData?.stats?.total_time_spent || 0)}</span>
                        </div>
                        <div class="time-card">
                            <h4>Average Session</h4>
                            <span class="time-value">${this.getAverageSessionTime()}</span>
                        </div>
                        <div class="time-card">
                            <h4>Best Streak</h4>
                            <span class="time-value">${this.analyticsData?.stats?.longest_streak || 0} days</span>
                        </div>
                    </div>
                </div>
                
                <div class="time-charts">
                    <div class="chart-container">
                        <h4>Daily Practice Time</h4>
                        <div id="daily-time-chart" class="chart"></div>
                    </div>
                    
                    <div class="chart-container">
                        <h4>Time by Chapter</h4>
                        <div id="chapter-time-chart" class="chart"></div>
                    </div>
                </div>
                
                <div class="time-insights">
                    <h4>Time Insights</h4>
                    <div id="time-insights-list"></div>
                </div>
            </div>
        `;

        this.renderDailyTimeChart();
        this.renderChapterTimeChart();
        this.renderTimeInsights();
    }

    // Render simple progress chart (text-based for now)
    renderProgressChart() {
        const chartEl = utils.$('#progress-chart');
        if (!chartEl || !this.analyticsData) return;

        // Simple text-based chart for now
        chartEl.innerHTML = `
            <div class="simple-chart">
                <div class="chart-info">
                    <p>Questions answered over the last 7 days</p>
                    <div class="chart-bars">
                        ${this.generateSimpleBarChart(this.getLast7DaysData())}
                    </div>
                </div>
            </div>
        `;
    }

    // Generate simple bar chart
    generateSimpleBarChart(data) {
        const maxValue = Math.max(...data.map(d => d.value));
        
        return data.map(item => {
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            return `
                <div class="chart-bar">
                    <div class="bar-fill" style="height: ${percentage}%"></div>
                    <span class="bar-label">${item.label}</span>
                    <span class="bar-value">${item.value}</span>
                </div>
            `;
        }).join('');
    }

    // Get last 7 days data (mock for now)
    getLast7DaysData() {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map(day => ({
            label: day,
            value: Math.floor(Math.random() * 20) // Mock data
        }));
    }

    // Render chapter performance chart
    renderChapterPerformanceChart() {
        const chartEl = utils.$('#chapter-performance-chart');
        if (!chartEl) return;

        chartEl.innerHTML = `
            <div class="chapter-performance-list">
                <div class="performance-item">
                    <span class="chapter-name">Chapter 1: Motion</span>
                    <div class="performance-bar">
                        <div class="bar-fill" style="width: 85%"></div>
                        <span class="performance-value">85%</span>
                    </div>
                </div>
                <div class="performance-item">
                    <span class="chapter-name">Chapter 2: Force</span>
                    <div class="performance-bar">
                        <div class="bar-fill" style="width: 78%"></div>
                        <span class="performance-value">78%</span>
                    </div>
                </div>
                <div class="performance-item">
                    <span class="chapter-name">Chapter 3: Energy</span>
                    <div class="performance-bar">
                        <div class="bar-fill" style="width: 92%"></div>
                        <span class="performance-value">92%</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Render insights
    renderInsights() {
        const insightsEl = utils.$('#insights-container');
        if (!insightsEl || !this.analyticsData) return;

        const insights = this.generateInsights();
        
        insightsEl.innerHTML = insights.map(insight => `
            <div class="insight-card ${insight.type}">
                <div class="insight-icon">
                    <i data-lucide="${insight.icon}"></i>
                </div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.description}</p>
                    ${insight.action ? `<button class="insight-action btn btn-sm">${insight.action}</button>` : ''}
                </div>
            </div>
        `).join('');

        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }
    }

    // Generate insights based on data
    generateInsights() {
        const insights = [];
        const stats = this.analyticsData?.stats;
        
        if (!stats) return insights;

        // Accuracy insights
        if (stats.accuracy < 70) {
            insights.push({
                type: 'warning',
                icon: 'alert-triangle',
                title: 'Accuracy Needs Improvement',
                description: 'Your accuracy is below 70%. Consider reviewing fundamental concepts.',
                action: 'Review Basics'
            });
        } else if (stats.accuracy > 90) {
            insights.push({
                type: 'success',
                icon: 'trophy',
                title: 'Excellent Accuracy!',
                description: 'You\'re performing exceptionally well. Try challenging yourself with harder questions.',
                action: 'Try Advanced'
            });
        }

        // Streak insights
        if (stats.current_streak === 0) {
            insights.push({
                type: 'info',
                icon: 'calendar',
                title: 'Start Your Streak',
                description: 'Practice daily to build a learning streak and improve retention.',
                action: 'Start Today'
            });
        } else if (stats.current_streak >= 7) {
            insights.push({
                type: 'success',
                icon: 'flame',
                title: 'Great Streak!',
                description: `You've maintained a ${stats.current_streak}-day streak. Keep it up!`,
                action: 'Continue'
            });
        }

        // Time insights
        const avgDailyTime = (stats.total_time_spent || 0) / (30 * 24 * 60 * 60); // last 30 days
        if (avgDailyTime < 0.25) { // less than 15 minutes per day
            insights.push({
                type: 'info',
                icon: 'clock',
                title: 'Increase Practice Time',
                description: 'Try to practice for at least 15-20 minutes daily for better results.',
                action: 'Set Schedule'
            });
        }

        return insights;
    }

    // Utility methods for mock data
    getAverageResponseTime() {
        return Math.round(15 + Math.random() * 10); // 15-25 seconds
    }

    getResponseTimeChange() {
        return Math.round((Math.random() - 0.5) * 20); // -10% to +10%
    }

    getAccuracyChange() {
        return Math.round((Math.random() - 0.3) * 10); // -3% to +7%
    }

    getAverageSessionTime() {
        const totalTime = this.analyticsData?.stats?.total_time_spent || 0;
        const avgMinutes = Math.round(totalTime / 60 / 10); // Assume 10 sessions
        return `${avgMinutes}m`;
    }

    // Placeholder chart render methods
    renderDailyActivityChart() {
        const chartEl = utils.$('#daily-activity-chart');
        if (chartEl) {
            chartEl.innerHTML = '<p class="chart-placeholder">Daily activity chart will be implemented here</p>';
        }
    }

    renderStreakChart() {
        const chartEl = utils.$('#streak-chart');
        if (chartEl) {
            chartEl.innerHTML = '<p class="chart-placeholder">Streak chart will be implemented here</p>';
        }
    }

    renderChapterProgress() {
        const listEl = utils.$('#chapter-progress-list');
        if (listEl) {
            listEl.innerHTML = '<p class="chart-placeholder">Chapter progress list will be implemented here</p>';
        }
    }

    renderDifficultyPerformanceChart() {
        const chartEl = utils.$('#difficulty-performance-chart');
        if (chartEl) {
            chartEl.innerHTML = '<p class="chart-placeholder">Difficulty performance chart will be implemented here</p>';
        }
    }

    renderPerformanceTrendsChart() {
        const chartEl = utils.$('#performance-trends-chart');
        if (chartEl) {
            chartEl.innerHTML = '<p class="chart-placeholder">Performance trends chart will be implemented here</p>';
        }
    }

    renderWeakAreas() {
        const listEl = utils.$('#weak-areas-list');
        if (listEl) {
            listEl.innerHTML = '<p class="chart-placeholder">Weak areas analysis will be implemented here</p>';
        }
    }

    renderAccuracyCircle() {
        const circleEl = utils.$('.circle-progress');
        if (circleEl) {
            // Simple percentage circle animation can be added here
        }
    }

    renderChapterAccuracyChart() {
        const chartEl = utils.$('#chapter-accuracy-chart');
        if (chartEl) {
            chartEl.innerHTML = '<p class="chart-placeholder">Chapter accuracy chart will be implemented here</p>';
        }
    }

    renderAccuracyTimelineChart() {
        const chartEl = utils.$('#accuracy-timeline-chart');
        if (chartEl) {
            chartEl.innerHTML = '<p class="chart-placeholder">Accuracy timeline chart will be implemented here</p>';
        }
    }

    renderDailyTimeChart() {
        const chartEl = utils.$('#daily-time-chart');
        if (chartEl) {
            chartEl.innerHTML = '<p class="chart-placeholder">Daily time chart will be implemented here</p>';
        }
    }

    renderChapterTimeChart() {
        const chartEl = utils.$('#chapter-time-chart');
        if (chartEl) {
            chartEl.innerHTML = '<p class="chart-placeholder">Chapter time chart will be implemented here</p>';
        }
    }

    renderTimeInsights() {
        const listEl = utils.$('#time-insights-list');
        if (listEl) {
            listEl.innerHTML = '<p class="chart-placeholder">Time insights will be implemented here</p>';
        }
    }

    // Date range methods
    toggleDateRangePicker() {
        const picker = utils.$('#date-range-picker');
        if (picker) {
            picker.classList.toggle('visible');
        }
    }

    applyDateRange() {
        const startDateInput = utils.$('#start-date');
        const endDateInput = utils.$('#end-date');
        
        if (startDateInput && endDateInput) {
            this.dateRange.start = new Date(startDateInput.value);
            this.dateRange.end = new Date(endDateInput.value);
            
            this.loadAnalytics();
            this.toggleDateRangePicker();
            
            utils.showSuccess('Date range updated!');
        }
    }

    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    // Export analytics
    exportAnalytics() {
        if (!this.analyticsData) {
            utils.showToast('No data to export', 'warning');
            return;
        }

        const data = {
            exported_at: new Date().toISOString(),
            user: authManager.currentUser?.username,
            date_range: this.dateRange,
            stats: this.analyticsData.user_stats
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edutheo-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        utils.showSuccess('Analytics exported successfully!');
    }

    // Refresh analytics
    async refreshAnalytics() {
        const refreshBtn = utils.$('#refresh-analytics');
        
        try {
            if (refreshBtn) utils.setLoading(refreshBtn, true);
            await this.loadAnalytics();
            utils.showSuccess('Analytics refreshed!');
        } catch (error) {
            utils.handleError(error, 'refreshing analytics');
        } finally {
            if (refreshBtn) utils.setLoading(refreshBtn, false);
        }
    }

    // Initialize analytics page
    async initializeAnalytics(options = {}) {
        // Set initial view if provided
        if (options.view) {
            this.currentView = options.view;
            this.switchView(options.view);
        }
        
        // Load analytics data
        await this.loadAnalytics();
    }

    // Cleanup
    cleanup() {
        // Clean up any chart instances or timers
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Create analytics manager instance
const analyticsManager = new AnalyticsManager();

// Export for global use
window.analyticsManager = analyticsManager;