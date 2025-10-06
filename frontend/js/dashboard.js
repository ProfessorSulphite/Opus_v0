// Dashboard management for EduTheo

class DashboardManager {
    constructor() {
        this.stats = null;
        this.leaderboard = null;
        this.recentActivity = null;
        this.refreshTimer = null;
        this.init();
    }

    init() {
        // Setup dashboard components
        this.setupRefreshHandlers();
        this.setupStatCards();
        this.setupProgressChart();
        
        // Auto-refresh every 5 minutes
        this.startAutoRefresh();
    }

    updateQuickActions(total_questions) {
        const statsEl = document.querySelector('.nav-card[data-page="practice"] .nav-card-stats');
        if (statsEl && total_questions !== undefined) {
            statsEl.textContent = `${total_questions} questions available`;
        }
    }
    async updateProgressChart() {
        try {
            const progressData = await analyticsAPI.getProgress();
            const container = utils.$('#chapter-progress');
            if (!container || !progressData || !progressData.chapter_progress) return;

            if (progressData.chapter_progress.length === 0) {
                container.innerHTML = '<p class="no-data">No progress yet. Start practicing!</p>';
                return;
            }

            const progressHTML = progressData.chapter_progress.map(chapter => {
                const accuracy = chapter.accuracy_percentage || 0;
                return `
                    <div class="progress-card">
                        <div class="progress-card-header">
                            <span class="progress-card-title">${chapter.chapter_name}</span>
                            <span class="progress-card-stats">${chapter.correct_answers}/${chapter.attempted_questions}</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${accuracy}%"></div>
                        </div>
                        <div class="progress-percentage">${Math.round(accuracy)}% Accuracy</div>
                    </div>
                `;
            }).join('');

            container.innerHTML = progressHTML;

        } catch (error) {
            console.error('Failed to update progress chart:', error);
            const container = utils.$('#chapter-progress');
            if(container) container.innerHTML = '<p class="no-data error">Could not load progress.</p>';
        }
    }

    // Load dashboard data
    async loadDashboard() {
        try {
            utils.showLoading();
            
            // Load data in parallel
            const [stats, leaderboard, activity, count] = await Promise.all([
                this.loadUserStats(),
                this.loadLeaderboard(),
                this.loadRecentActivity(),
                questionsAPI.getQuestionsCount()
            ]);

            // Update UI
            this.updateStatsCards();
            this.updateProgressChart();
            this.updateLeaderboard();
            this.updateRecentActivity();
            this.updateQuickActions(count.total_count);
            
            utils.hideLoading();
            
        } catch (error) {
            utils.hideLoading();
            utils.handleError(error, 'loading dashboard');
        }
    }

    // Load user statistics
    async loadUserStats() {
        try {
            this.stats = await analyticsAPI.getUserStats();
            return this.stats;
        } catch (error) {
            console.error('Failed to load user stats:', error);
            // Use default stats
            this.stats = {
                total_questions: 0,
                correct_answers: 0,
                incorrect_answers: 0,
                accuracy: 0,
                current_streak: 0,
                longest_streak: 0,
                total_time_spent: 0,
                chapters_completed: 0,
                last_practice_date: null
            };
            return this.stats;
        }
    }

    // Load leaderboard data
    async loadLeaderboard() {
        try {
            this.leaderboard = await analyticsAPI.getLeaderboard();
            return this.leaderboard;
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            this.leaderboard = [];
            return this.leaderboard;
        }
    }

    // Load recent activity
    async loadRecentActivity() {
        try {
            this.recentActivity = await analyticsAPI.getRecentActivity();
            return this.recentActivity;
        } catch (error) {
            console.error('Failed to load recent activity:', error);
            this.recentActivity = [];
            return this.recentActivity;
        }
    }

    // Update statistics cards
    updateStatsCards() {
        if (!this.stats) return;

        // Total questions
        const totalQuestionsEl = utils.$('#questions-solved');
        if (totalQuestionsEl) {
            utils.animateCounter(totalQuestionsEl, this.stats.total_questions_attempted);
        }

        // Accuracy
        const accuracyEl = utils.$('#accuracy-rate');
        if (accuracyEl) {
            const accuracy = Math.round(this.stats.accuracy_percentage || 0);
            utils.animateCounter(accuracyEl, accuracy, '%');
        }

        // Current streak - Note: This is not in the current API response, will default to 0
        const streakEl = utils.$('#study-streak');
        if (streakEl) {
            utils.animateCounter(streakEl, this.stats.current_streak || 0, ' days');
        }

        // Time spent
        const timeSpentEl = utils.$('#time-spent');
        if (timeSpentEl) {
            const hours = Math.round((this.stats.total_time_spent || 0) / 3600);
            utils.animateCounter(timeSpentEl, hours, 'h');
        }

        // Practice streak indicator
        this.updateStreakIndicator();
    }

    // Update streak indicator
    updateStreakIndicator() {
        const streakIndicator = utils.$('#streak-indicator');
        if (!streakIndicator || !this.stats) return;

        const streak = this.stats.current_streak || 0;
        const streakIcon = streakIndicator.querySelector('i');
        const streakText = streakIndicator.querySelector('.streak-text');

        if (streak >= 7) {
            streakIndicator.className = 'streak-indicator streak-fire';
            streakIcon.setAttribute('data-lucide', 'flame');
            streakText.textContent = `${streak} day fire streak!`;
        } else if (streak >= 3) {
            streakIndicator.className = 'streak-indicator streak-good';
            streakIcon.setAttribute('data-lucide', 'zap');
            streakText.textContent = `${streak} day streak!`;
        } else if (streak > 0) {
            streakIndicator.className = 'streak-indicator streak-start';
            streakIcon.setAttribute('data-lucide', 'star');
            streakText.textContent = `${streak} day streak`;
        } else {
            streakIndicator.className = 'streak-indicator streak-none';
            streakIcon.setAttribute('data-lucide', 'calendar');
            streakText.textContent = 'Start your streak today!';
        }

        // Reinitialize Lucide icons
        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }
    }

    // Update progress chart
    updateProgressChart() {
        if (!this.stats) return;

        const progressChart = utils.$('#progress-chart');
        if (!progressChart) return;

        const correctAnswers = this.stats.correct_answers || 0;
        const incorrectAnswers = this.stats.incorrect_answers || 0;
        const total = correctAnswers + incorrectAnswers;

        if (total === 0) {
            progressChart.innerHTML = `
                <div class="no-data">
                    <i data-lucide="bar-chart-3"></i>
                    <p>Start practicing to see your progress!</p>
                </div>
            `;
            if (window.lucide) {
                lucide.createIcons({ nameAttr: 'data-lucide' });
            }
            return;
        }

        const correctPercentage = (correctAnswers / total) * 100;
        const incorrectPercentage = (incorrectAnswers / total) * 100;

        progressChart.innerHTML = `
            <div class="chart-header">
                <h3>Your Progress</h3>
                <span class="chart-total">${total} questions</span>
            </div>
            <div class="progress-bars">
                <div class="progress-item">
                    <div class="progress-info">
                        <span class="progress-label">Correct</span>
                        <span class="progress-value">${correctAnswers} (${Math.round(correctPercentage)}%)</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill progress-correct" style="width: ${correctPercentage}%"></div>
                    </div>
                </div>
                <div class="progress-item">
                    <div class="progress-info">
                        <span class="progress-label">Incorrect</span>
                        <span class="progress-value">${incorrectAnswers} (${Math.round(incorrectPercentage)}%)</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill progress-incorrect" style="width: ${incorrectPercentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // Update leaderboard
    updateLeaderboard() {
        const leaderboardEl = utils.$('#leaderboard');
        if (!leaderboardEl) return;

        if (!this.leaderboard || this.leaderboard.length === 0) {
            leaderboardEl.innerHTML = `
                <div class="no-data">
                    <i data-lucide="users"></i>
                    <p>No leaderboard data available</p>
                </div>
            `;
            if (window.lucide) {
                lucide.createIcons({ nameAttr: 'data-lucide' });
            }
            return;
        }

        const leaderboardHTML = this.leaderboard.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.username === authManager.currentUser?.username;
            const medal = rank <= 3 ? this.getMedalIcon(rank) : rank;
            
            return `
                <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                    <div class="rank">${medal}</div>
                    <div class="user-info">
                        <span class="username">${user.full_name || user.username}</span>
                        <span class="score">${user.score || 0} points</span>
                    </div>
                    <div class="accuracy">${Math.round(user.accuracy || 0)}%</div>
                </div>
            `;
        }).join('');

        leaderboardEl.innerHTML = `
            <div class="leaderboard-header">
                <h3>Leaderboard</h3>
                <span class="leaderboard-subtitle">Top performers this week</span>
            </div>
            <div class="leaderboard-list">
                ${leaderboardHTML}
            </div>
        `;
    }

    // Get medal icon for top 3 positions
    getMedalIcon(rank) {
        const medals = {
            1: '🥇',
            2: '🥈',
            3: '🥉'
        };
        return medals[rank] || rank;
    }

    // Update recent activity
    updateRecentActivity() {
        const activityEl = utils.$('#recent-activity');
        if (!activityEl) return;

        if (!this.recentActivity || this.recentActivity.length === 0) {
            activityEl.innerHTML = `
                <div class="no-data">
                    <i data-lucide="activity"></i>
                    <p>No recent activity</p>
                </div>
            `;
            if (window.lucide) {
                lucide.createIcons({ nameAttr: 'data-lucide' });
            }
            return;
        }

        const activityHTML = this.recentActivity.slice(0, 5).map(activity => {
            const timeAgo = utils.getTimeAgo(activity.created_at);
            const icon = this.getActivityIcon(activity.activity_type);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i data-lucide="${icon}"></i>
                    </div>
                    <div class="activity-content">
                        <p class="activity-text">${this.getActivityText(activity)}</p>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                </div>
            `;
        }).join('');

        activityEl.innerHTML = `
            <div class="activity-header">
                <h3>Recent Activity</h3>
            </div>
            <div class="activity-list">
                ${activityHTML}
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }
    }

    // Get activity icon
    getActivityIcon(activityType) {
        const icons = {
            'question_answered': 'check-circle',
            'practice_session': 'play-circle',
            'streak_achieved': 'zap',
            'chapter_completed': 'book-open',
            'achievement_unlocked': 'award'
        };
        return icons[activityType] || 'activity';
    }

    // Get activity text
    getActivityText(activity) {
        const texts = {
            'question_answered': `Answered question in ${activity.chapter || 'unknown chapter'}`,
            'practice_session': `Completed practice session`,
            'streak_achieved': `Achieved ${activity.streak_count || 0} day streak`,
            'chapter_completed': `Completed ${activity.chapter || 'chapter'}`,
            'achievement_unlocked': `Unlocked achievement: ${activity.achievement || 'Unknown'}`
        };
        return texts[activity.activity_type] || 'Unknown activity';
    }

    // Update quick actions
    updateQuickActions() {
        const quickPracticeBtn = utils.$('#quick-practice-btn');
        const continueBtn = utils.$('#continue-practice-btn');

        if (quickPracticeBtn) {
            quickPracticeBtn.addEventListener('click', () => {
                this.startQuickPractice();
            });
        }

        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.continuePractice();
            });
        }
    }

    // Start quick practice session
    async startQuickPractice() {
        try {
            // Get a random question
            const questions = await questionsAPI.getQuestions({ limit: 1 });
            
            if (questions && questions.length > 0) {
                // Navigate to practice page with quick practice mode
                window.pageManager.showPage('practice', { 
                    mode: 'quick',
                    question: questions[0]
                });
            } else {
                utils.showToast('No questions available for practice', 'info');
            }
        } catch (error) {
            utils.handleError(error, 'starting quick practice');
        }
    }

    // Continue practice from where user left off
    async continuePractice() {
        try {
            // Get user's last practice session or start new one
            window.pageManager.showPage('practice', { mode: 'continue' });
        } catch (error) {
            utils.handleError(error, 'continuing practice');
        }
    }

    // Setup refresh handlers
    setupRefreshHandlers() {
        const refreshBtn = utils.$('#refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }
    }

    // Refresh dashboard data
    async refreshDashboard() {
        const refreshBtn = utils.$('#refresh-dashboard');
        
        try {
            if (refreshBtn) utils.setLoading(refreshBtn, true);
            await this.loadDashboard();
            utils.showSuccess('Dashboard refreshed!');
        } catch (error) {
            utils.handleError(error, 'refreshing dashboard');
        } finally {
            if (refreshBtn) utils.setLoading(refreshBtn, false);
        }
    }

    // Setup stat cards interactions
    setupStatCards() {
        const statCards = utils.$$('.stat-card');
        statCards.forEach(card => {
            card.addEventListener('click', () => {
                const cardType = card.dataset.type;
                this.handleStatCardClick(cardType);
            });
        });
    }

    // Handle stat card clicks
    handleStatCardClick(cardType) {
        switch (cardType) {
            case 'accuracy':
                window.pageManager.showPage('analytics', { view: 'accuracy' });
                break;
            case 'streak':
                window.pageManager.showPage('analytics', { view: 'progress' });
                break;
            case 'time':
                window.pageManager.showPage('analytics', { view: 'time' });
                break;
            default:
                window.pageManager.showPage('analytics');
        }
    }

    // Start auto-refresh timer
    startAutoRefresh() {
        // Refresh every 5 minutes
        this.refreshTimer = setInterval(() => {
            this.loadDashboard();
        }, 5 * 60 * 1000);
    }

    // Stop auto-refresh timer
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    // Cleanup
    cleanup() {
        this.stopAutoRefresh();
    }
}

// Create dashboard manager instance
const dashboardManager = new DashboardManager();

// Export for global use
window.dashboardManager = dashboardManager;