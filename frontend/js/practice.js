// Practice page management for EduTheo

class PracticeManager {
    constructor() {
        this.currentQuestion = null;
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.filters = {
            chapter: '',
            difficulty: '',
            topic: ''
        };
        this.practiceMode = 'normal'; // normal, quick, timed
        this.practiceTimer = null;
        this.startTime = null;
        this.sessionStats = {
            correct: 0,
            incorrect: 0,
            total: 0,
            timeSpent: 0
        };
        this.init();
    }

    init() {
        this.setupFilters();
        this.setupPracticeControls();
        this.setupAnswerHandling();
        this.setupKeyboardShortcuts();
    }

    // Setup filter controls
    setupFilters() {
        const filterForm = utils.$('#filter-form');
        const applyFiltersBtn = utils.$('#apply-filters');
        const clearFiltersBtn = utils.$('#clear-filters');
        const toggleFiltersBtn = utils.$('#toggle-filters');

        if (filterForm) {
            filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.applyFilters();
            });
        }

        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        if (toggleFiltersBtn) {
            toggleFiltersBtn.addEventListener('click', () => this.toggleFilters());
        }

        // Load available chapters and topics
        this.loadFilterOptions();
    }

    // Load filter options from API
    async loadFilterOptions() {
        try {
            const [chapters, tags] = await Promise.all([
                questionsAPI.getChapters(),
                questionsAPI.getTags()
            ]);
            
            this.populateChapterSelect(chapters);
            this.populateTopicSelect(tags);
        } catch (error) {
            console.error('Failed to load filter options:', error);
        }
    }

    // Populate chapter select
    populateChapterSelect(data) {
        const chapterSelect = utils.$('#chapter-filter');
        if (!chapterSelect || !data || !data.chapters) return;

        const options = data.chapters.map(chapter => 
            `<option value="${chapter.chapter_number}">${chapter.chapter_name} (${chapter.total_questions} questions)</option>`
        ).join('');

        chapterSelect.innerHTML = `<option value="">All Chapters</option>${options}`;
    }

    // Populate topic select
    populateTopicSelect(data) {
        const topicSelect = utils.$('#topic-filter');
        if (!topicSelect || !data || !data.tags) return;

        const options = data.tags.map(tag => 
            `<option value="${tag}">${tag}</option>`
        ).join('');

        topicSelect.innerHTML = `<option value="">All Topics</option>${options}`;
    }

    // Apply filters and load questions
    async applyFilters() {
        const formData = utils.getFormData(utils.$('#filter-form'));
        
        this.filters = {
            chapter: formData.chapter || '',
            difficulty: formData.difficulty || '',
            topic: formData.topic || ''
        };

        // Save filters to localStorage
        utils.setLocalStorage(STORAGE_KEYS.practiceFilters, this.filters);

        // Load questions with filters
        await this.loadQuestions();
        
        // Hide filters on mobile after applying
        if (utils.isMobile()) {
            this.hideFilters();
        }

        utils.showSuccess('Filters applied successfully!');
    }

    // Clear all filters
    clearFilters() {
        this.filters = { chapter: '', difficulty: '', topic: '' };
        
        // Clear form
        const filterForm = utils.$('#filter-form');
        if (filterForm) filterForm.reset();
        
        // Clear localStorage
        utils.removeLocalStorage(STORAGE_KEYS.practiceFilters);
        
        // Load all questions
        this.loadQuestions();
        
        utils.showSuccess('Filters cleared!');
    }

    // Toggle filters visibility
    toggleFilters() {
        const filtersSection = utils.$('#filters-section');
        const toggleBtn = utils.$('#toggle-filters');
        
        if (filtersSection && toggleBtn) {
            const isVisible = filtersSection.classList.contains('visible');
            
            if (isVisible) {
                this.hideFilters();
            } else {
                this.showFilters();
            }
        }
    }

    // Show filters
    showFilters() {
        const filtersSection = utils.$('#filters-section');
        const toggleBtn = utils.$('#toggle-filters');
        
        if (filtersSection) filtersSection.classList.add('visible');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) icon.setAttribute('data-lucide', 'chevron-up');
        }
        
        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }
    }

    // Hide filters
    hideFilters() {
        const filtersSection = utils.$('#filters-section');
        const toggleBtn = utils.$('#toggle-filters');
        
        if (filtersSection) filtersSection.classList.remove('visible');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) icon.setAttribute('data-lucide', 'chevron-down');
        }
        
        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }
    }

    // Load questions from API - FIXED METHOD
    async loadQuestions() {
        try {
            utils.showLoading('Loading questions...');
            
            const params = {
                chapter_numbers: this.filters.chapter ? [this.filters.chapter] : [],
                difficulty_levels: this.filters.difficulty ? [this.filters.difficulty] : [],
                tags: this.filters.topic ? [this.filters.topic] : [],
                limit: 50 // Load up to 50 questions
            };

            const response = await questionsAPI.filterQuestions(params);
            this.questions = response.questions || [];
            
            if (this.questions.length === 0) {
                this.showNoQuestions();
                return;
            }

            // Shuffle questions for variety
            this.questions = utils.shuffleArray(this.questions);
            
            // Reset session
            this.currentQuestionIndex = 0;
            this.sessionStats = { correct: 0, incorrect: 0, total: 0, timeSpent: 0 };
            
            // Show first question
            this.showQuestion(0);
            
            utils.hideLoading();
            
        } catch (error) {
            utils.hideLoading();
            utils.handleError(error, 'loading questions');
        }
    }

    // Show no questions message
    showNoQuestions() {
        const questionContainer = utils.$('#question-container');
        if (questionContainer) {
            questionContainer.innerHTML = `
                <div class="no-questions">
                    <i data-lucide="search-x"></i>
                    <h3>No Questions Found</h3>
                    <p>Try adjusting your filters or clear them to see all questions.</p>
                    <button class="btn btn-primary" onclick="practiceManager.clearFilters()">
                        Clear Filters
                    </button>
                </div>
            `;
            
            if (window.lucide) {
                lucide.createIcons({ nameAttr: 'data-lucide' });
            }
        }
        utils.hideLoading();
    }

    // Show question at index
    showQuestion(index) {
        if (!this.questions || index >= this.questions.length) {
            this.showPracticeComplete();
            return;
        }

        this.currentQuestionIndex = index;
        this.currentQuestion = this.questions[index];
        this.startTime = Date.now();

        this.renderQuestion();
        this.updateProgress();
        this.resetAnswerState();
    }

    // Render current question
    renderQuestion() {
        const questionContainer = utils.$('#question-container');
        if (!questionContainer || !this.currentQuestion) return;

        const question = this.currentQuestion;
        const options = Object.entries(question.options);

        const optionsHTML = options.map(([key, value]) => {
            const letter = key.toUpperCase();
            return `
                <div class="option" data-option="${letter}">
                    <input type="radio" id="option-${letter}" name="answer" value="${letter}">
                    <label for="option-${letter}">
                        <span class="option-letter">${letter}</span>
                        <span class="option-text">${value}</span>
                    </label>
                </div>
            `;
        }).join('');

        questionContainer.innerHTML = `
            <div class="question-header">
                <div class="question-meta">
                    <span class="chapter">${question.chapter_name}</span>
                    <span class="difficulty difficulty-${question.difficulty_level?.toLowerCase() || 'medium'}">
                        ${question.difficulty_level || 'Medium'}
                    </span>
                </div>
                <div class="question-number">
                    Question ${this.currentQuestionIndex + 1} of ${this.questions.length}
                </div>
            </div>
            
            <div class="question-content">
                <h2 class="question-text">${question.question_text}</h2>
                
                <div class="options-container">
                    ${optionsHTML}
                </div>
                
                <div class="question-actions">
                    <button id="submit-answer" class="btn btn-primary" disabled>
                        Submit Answer
                    </button>
                    <button id="skip-question" class="btn btn-secondary">
                        Skip
                    </button>
                </div>
                
                <div id="answer-feedback" class="answer-feedback" style="display: none;"></div>
            </div>
        `;

        // Add option click handlers
        this.setupOptionHandlers();
    }

    // Setup option click handlers
    setupOptionHandlers() {
        const options = utils.$$('.option');
        const submitBtn = utils.$('#submit-answer');
        const skipBtn = utils.$('#skip-question');

        options.forEach(option => {
            option.addEventListener('click', () => {
                const radio = option.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    this.handleOptionSelect();
                }
            });
        });

        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitAnswer());
        }

        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skipQuestion());
        }

        // Handle radio button changes
        const radioButtons = utils.$$('input[name="answer"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => this.handleOptionSelect());
        });
    }

    // Handle option selection
    handleOptionSelect() {
        const submitBtn = utils.$('#submit-answer');
        const selectedOption = utils.$('input[name="answer"]:checked');
        
        if (submitBtn) {
            submitBtn.disabled = !selectedOption;
        }

        // Add visual feedback
        const options = utils.$$('.option');
        options.forEach(option => {
            option.classList.remove('selected');
        });

        if (selectedOption) {
            const selectedOptionDiv = selectedOption.closest('.option');
            if (selectedOptionDiv) {
                selectedOptionDiv.classList.add('selected');
            }
        }
    }

    // Submit answer
    async submitAnswer() {
        const selectedOption = utils.$('input[name="answer"]:checked');
        if (!selectedOption || !this.currentQuestion) return;

        const userAnswer = selectedOption.value;
        const timeSpent = Date.now() - this.startTime;

        try {
            const response = await questionsAPI.checkAnswer({
                question_id: this.currentQuestion.id,
                user_answer: userAnswer,
                time_spent: Math.round(timeSpent / 1000)
            });

            const { is_correct, correct_answer, explanation } = response;

            this.sessionStats.total++;
            if (is_correct) {
                this.sessionStats.correct++;
            } else {
                this.sessionStats.incorrect++;
            }
            this.sessionStats.timeSpent += timeSpent;

            this.showAnswerFeedback(is_correct, correct_answer, userAnswer, explanation);

        } catch (error) {
            utils.handleError(error, 'submitting answer');
        }

        this.disableAnswerInteraction();

        setTimeout(() => {
            this.nextQuestion();
        }, 3000);
    }

    // Show answer feedback
    showAnswerFeedback(isCorrect, correctAnswer, userAnswer, explanation) {
        const feedbackEl = utils.$('#answer-feedback');
        if (!feedbackEl) return;

        const options = utils.$$('.option');
        
        // Highlight correct and incorrect answers
        options.forEach(option => {
            const letter = option.dataset.option;
            
            if (letter === correctAnswer) {
                option.classList.add('correct');
            } else if (letter === userAnswer && !isCorrect) {
                option.classList.add('incorrect');
            } else {
                option.classList.add('disabled');
            }
        });

        // Show feedback message
        const feedbackHTML = `
            <div class="feedback-content ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}">
                <div class="feedback-icon">
                    <i data-lucide="${isCorrect ? 'check-circle' : 'x-circle'}"></i>
                </div>
                <div class="feedback-message">
                    <h4>${isCorrect ? 'Correct!' : 'Incorrect'}</h4>
                    <p>${isCorrect ? 'Well done!' : `The correct answer is ${correctAnswer}.`}</p>
                    ${explanation ? `<p class="explanation">${explanation}</p>` : ''}
                </div>
            </div>
        `;

        feedbackEl.innerHTML = feedbackHTML;
        feedbackEl.style.display = 'block';

        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }
    }

    // Disable answer interaction
    disableAnswerInteraction() {
        const submitBtn = utils.$('#submit-answer');
        const skipBtn = utils.$('#skip-question');
        const options = utils.$$('.option');
        const radioButtons = utils.$$('input[name="answer"]');

        if (submitBtn) submitBtn.disabled = true;
        if (skipBtn) skipBtn.disabled = true;
        
        options.forEach(option => {
            option.style.pointerEvents = 'none';
        });
        
        radioButtons.forEach(radio => {
            radio.disabled = true;
        });
    }

    // Skip question
    skipQuestion() {
        this.sessionStats.total++;
        this.nextQuestion();
    }

    // Go to next question
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.showQuestion(this.currentQuestionIndex + 1);
        } else {
            this.showPracticeComplete();
        }
    }

    // Show practice complete
    showPracticeComplete() {
        const questionContainer = utils.$('#question-container');
        if (!questionContainer) return;

        const accuracy = this.sessionStats.total > 0 
            ? Math.round((this.sessionStats.correct / this.sessionStats.total) * 100)
            : 0;
        
        const avgTime = this.sessionStats.total > 0
            ? Math.round(this.sessionStats.timeSpent / this.sessionStats.total / 1000)
            : 0;

        questionContainer.innerHTML = `
            <div class="practice-complete">
                <div class="completion-icon">
                    <i data-lucide="check-circle"></i>
                </div>
                <h2>Practice Complete!</h2>
                <div class="session-stats">
                    <div class="stat">
                        <span class="stat-value">${this.sessionStats.correct}/${this.sessionStats.total}</span>
                        <span class="stat-label">Correct</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${accuracy}%</span>
                        <span class="stat-label">Accuracy</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${avgTime}s</span>
                        <span class="stat-label">Avg Time</span>
                    </div>
                </div>
                <div class="completion-actions">
                    <button class="btn btn-primary" onclick="practiceManager.startNewSession()">
                        Practice Again
                    </button>
                    <button class="btn btn-secondary" onclick="pageManager.showPage('dashboard')">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }

        // Update progress
        this.updateProgress();
    }

    // Start new practice session
    startNewSession() {
        this.loadQuestions();
    }

    // Update progress indicator
    updateProgress() {
        const progressBar = utils.$('#progress-bar');
        const progressText = utils.$('#progress-text');
        
        if (progressBar && this.questions.length > 0) {
            const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText && this.questions.length > 0) {
            progressText.textContent = `${this.currentQuestionIndex + 1} of ${this.questions.length}`;
        }
    }

    // Reset answer state
    resetAnswerState() {
        const feedbackEl = utils.$('#answer-feedback');
        if (feedbackEl) {
            feedbackEl.style.display = 'none';
        }

        const options = utils.$$('.option');
        options.forEach(option => {
            option.classList.remove('correct', 'incorrect', 'disabled', 'selected');
            option.style.pointerEvents = '';
        });

        const radioButtons = utils.$$('input[name="answer"]');
        radioButtons.forEach(radio => {
            radio.disabled = false;
            radio.checked = false;
        });
    }

    // Setup practice controls
    setupPracticeControls() {
        const startPracticeBtn = utils.$('#start-practice');
        
        if (startPracticeBtn) {
            startPracticeBtn.addEventListener('click', () => {
                this.loadQuestions();
            });
        }
    }

    // Setup answer handling
    setupAnswerHandling() {
        // This is handled in renderQuestion and setupOptionHandlers
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.currentQuestion) return;

            // A, B, C, D keys for options
            if (e.key >= 'A' && e.key <= 'D') {
                const option = utils.$(`input[value="${e.key}"]`);
                if (option) {
                    option.checked = true;
                    this.handleOptionSelect();
                }
            }
            
            // Enter to submit
            if (e.key === 'Enter') {
                const submitBtn = utils.$('#submit-answer');
                if (submitBtn && !submitBtn.disabled) {
                    this.submitAnswer();
                }
            }
            
            // S key to skip
            if (e.key.toLowerCase() === 's') {
                const skipBtn = utils.$('#skip-question');
                if (skipBtn && !skipBtn.disabled) {
                    this.skipQuestion();
                }
            }
        });
    }

    // Initialize practice page
    async initializePractice(options = {}) {
        // Set practice mode
        this.practiceMode = options.mode || 'normal';
        
        // Load saved filters
        const savedFilters = utils.getLocalStorage(STORAGE_KEYS.practiceFilters);
        if (savedFilters) {
            this.filters = savedFilters;
            // Populate filter form
            const filterForm = utils.$('#filter-form');
            if (filterForm) {
                utils.setFormData(filterForm, savedFilters);
            }
        }
        
        // If specific question provided (quick mode)
        if (options.question) {
            this.questions = [options.question];
            this.showQuestion(0);
        } else {
            // Load questions based on filters
            await this.loadQuestions();
        }
    }

    // Cleanup
    cleanup() {
        if (this.practiceTimer) {
            clearInterval(this.practiceTimer);
            this.practiceTimer = null;
        }
    }
}

// Create practice manager instance
const practiceManager = new PracticeManager();

// Export for global use
window.practiceManager = practiceManager;