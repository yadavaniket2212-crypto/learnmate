/**
 * LearnMate AI - Interactive Quiz Engine
 * Powers subject-specific and targeted weakness quizzes, score evaluation,
 * instant answer explanations, and automated integration with weakness detector & rewards.
 */

const QuizEngine = {
    state: {
        active: false,
        subject: "all",
        filterTopic: null,
        isWeaknessDrill: false,
        questions: [],
        currentIndex: 0,
        userAnswers: [], // Array of { questionId, selectedIndex, isCorrect, topic }
        timeRemainingSeconds: 60,
        timerInterval: null,
        quizStartTime: null,
        finished: false
    },

    /**
     * Start a new quiz session
     * @param {string} subject - Subject name or 'all'
     * @param {string|null} topic - Specific topic to filter, if any
     * @param {boolean} isWeaknessDrill - Flag if launched from weakness detector
     */
    startQuiz(subject = "all", topic = null, isWeaknessDrill = false) {
        let pool = [...QUESTION_BANK];

        if (topic) {
            pool = pool.filter(q => q.topic.toLowerCase() === topic.toLowerCase());
            // If few questions for this specific topic, fill with same subject
            if (pool.length < 3) {
                const sample = QUESTION_BANK.find(q => q.topic.toLowerCase() === topic.toLowerCase());
                if (sample) {
                    const fallback = QUESTION_BANK.filter(q => q.subject === sample.subject && q.topic !== topic);
                    pool = pool.concat(fallback);
                }
            }
        } else if (isWeaknessDrill) {
            // Find weak topics from WeaknessDetector
            const weakTopics = WeaknessDetector.getWeakTopicsOnly().map(w => w.topic.toLowerCase());
            if (weakTopics.length > 0) {
                pool = pool.filter(q => weakTopics.includes(q.topic.toLowerCase()));
            }
            if (pool.length < 4) {
                pool = [...QUESTION_BANK];
            }
        } else if (subject !== "all") {
            pool = pool.filter(q => q.subject.toLowerCase() === subject.toLowerCase());
        }

        // Shuffle questions
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5); // 5 questions per quiz

        this.state = {
            active: true,
            subject,
            filterTopic: topic,
            isWeaknessDrill,
            questions: selected,
            currentIndex: 0,
            userAnswers: new Array(selected.length).fill(null),
            timeRemainingSeconds: 90,
            timerInterval: null,
            quizStartTime: Date.now(),
            finished: false
        };

        this.startTimer();
        this.render();
    },

    startTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
        }

        this.state.timerInterval = setInterval(() => {
            if (this.state.timeRemainingSeconds > 0) {
                this.state.timeRemainingSeconds -= 1;
                const timerEl = document.getElementById("quiz-timer-display");
                if (timerEl) {
                    const mins = Math.floor(this.state.timeRemainingSeconds / 60);
                    const secs = this.state.timeRemainingSeconds % 60;
                    timerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                    if (this.state.timeRemainingSeconds <= 15) {
                        timerEl.classList.add("text-danger", "pulse-timer");
                    }
                }
            } else {
                clearInterval(this.state.timerInterval);
                this.submitQuiz(true); // Auto-submit when time runs out
            }
        }, 1000);
    },

    stopTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
    },

    selectAnswer(optionIndex) {
        const idx = this.state.currentIndex;
        const currentQ = this.state.questions[idx];
        const isCorrect = optionIndex === currentQ.correctIndex;

        this.state.userAnswers[idx] = {
            questionId: currentQ.id,
            selectedIndex: optionIndex,
            isCorrect,
            topic: currentQ.topic,
            questionText: currentQ.question
        };

        this.renderQuestionView();
    },

    nextQuestion() {
        if (this.state.currentIndex < this.state.questions.length - 1) {
            this.state.currentIndex += 1;
            this.renderQuestionView();
        } else {
            this.submitQuiz();
        }
    },

    prevQuestion() {
        if (this.state.currentIndex > 0) {
            this.state.currentIndex -= 1;
            this.renderQuestionView();
        }
    },

    submitQuiz(autoSubmitted = false) {
        this.stopTimer();
        this.state.finished = true;

        // Calculate score
        let correctCount = 0;
        const answersLog = [];

        this.state.questions.forEach((q, idx) => {
            const userAns = this.state.userAnswers[idx];
            const isCorrect = userAns ? userAns.isCorrect : false;
            if (isCorrect) correctCount += 1;

            answersLog.push({
                topic: q.topic,
                correct: isCorrect,
                question: q.question
            });
        });

        const totalQ = this.state.questions.length;
        const percentage = Math.round((correctCount / totalQ) * 100);

        // Award points: +50 base + 15 per correct + streak bonus
        const pointsEarned = 50 + (correctCount * 15) + (percentage >= 80 ? 25 : 0);
        StorageManager.addPoints(pointsEarned);

        // Weak topics identification in this quiz
        const missedTopics = [];
        answersLog.forEach(a => {
            if (!a.correct && !missedTopics.includes(a.topic)) {
                missedTopics.push(a.topic);
            }
        });

        // Determine quiz title
        let quizTitle = "General Knowledge Sprint";
        if (this.state.filterTopic) {
            quizTitle = `Targeted Drill: ${this.state.filterTopic}`;
        } else if (this.state.isWeaknessDrill) {
            quizTitle = "Targeted Weakness Recovery Quiz";
        } else if (this.state.subject !== "all") {
            quizTitle = `${this.state.subject} Mastery Quiz`;
        }

        // Persist attempt to StorageManager
        const attemptRecord = {
            id: `hist-${Date.now()}`,
            quizTitle,
            subject: this.state.subject !== "all" ? this.state.subject : "Mixed Sciences",
            timestamp: new Date().toISOString(),
            score: correctCount,
            totalQuestions: totalQ,
            percentage,
            weakTopics: missedTopics,
            answers: answersLog,
            pointsEarned
        };

        StorageManager.logQuizAttempt(attemptRecord);

        // FX: confetti burst for good scores, error sound for bad
        if (window.FXEngine) {
            if (percentage >= 60) {
                FXEngine.confettiBurst(0.5, 0.35, percentage >= 80 ? 100 : 50);
                FXEngine.playSuccessSound();
            } else {
                FXEngine.playErrorSound();
            }
        }

        // Update syllabus progress if student did great on a topic!
        if (percentage >= 75 && this.state.filterTopic) {
            const syllabus = StorageManager.getSyllabus();
            const matchedItem = syllabus.find(s => s.topic.toLowerCase() === this.state.filterTopic.toLowerCase());
            if (matchedItem && matchedItem.status !== "completed") {
                StorageManager.updateSyllabusTopic(matchedItem.id, { status: "completed" });
                App.showToast(`Syllabus item "${matchedItem.topic}" marked Completed due to quiz mastery!`, "success");
            }
        }

        this.renderResultsView(attemptRecord, autoSubmitted);
        App.updateDashboardMetrics();
    },

    render() {
        const container = document.getElementById("quiz-view");
        if (!container) return;

        if (!this.state.active) {
            this.renderLobbyView();
        } else if (this.state.finished) {
            // Already rendered by submitQuiz
        } else {
            this.renderQuestionView();
        }
    },

    renderLobbyView() {
        const container = document.getElementById("quiz-view");
        const weakTopics = WeaknessDetector.getWeakTopicsOnly();
        const profile = StorageManager.getProfile();

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h2 class="view-title">Interactive Quizzes & Challenges</h2>
                    <p class="view-subtitle">Test your understanding, earn XP coins, and reinforce weak concepts.</p>
                </div>
                <div class="header-actions">
                    <div class="points-badge-pill">
                        <span class="coin-icon">🪙</span>
                        <strong>${profile.points} XP Available</strong>
                    </div>
                </div>
            </div>

            <!-- Weakness Focus Banner (If weak topics exist) -->
            ${weakTopics.length > 0 ? `
                <div class="card weakness-alert-banner mb-6">
                    <div class="flex-between flex-wrap gap-4">
                        <div class="alert-content">
                            <span class="badge badge-danger">Weak Areas Detected</span>
                            <h3 class="banner-title mt-1">Ready to overcome your weak spots?</h3>
                            <p class="text-muted mt-1">
                                We identified gaps in <strong>${weakTopics.slice(0, 2).map(w => w.topic).join(", ")}</strong>.
                                Practice them now to regain full mastery and earn bonus XP!
                            </p>
                        </div>
                        <button class="btn btn-danger" onclick="QuizEngine.startQuiz('all', null, true)">
                            ⚡ Start Weakness Drill (5 Questions)
                        </button>
                    </div>
                </div>
            ` : ""}

            <!-- Quiz Subject Cards Grid -->
            <div class="grid-3 gap-6 mb-6">
                <!-- All Subjects -->
                <div class="quiz-subject-card card-hover" onclick="QuizEngine.startQuiz('all')">
                    <div class="subject-icon-wrap bg-primary-light">
                        <span class="subject-icon">⚡</span>
                    </div>
                    <h3 class="subject-card-title">Comprehensive Sprint</h3>
                    <p class="subject-card-desc">Rapid fire mixed questions across Math, Physics, Biology, and Computer Science.</p>
                    <div class="quiz-card-footer">
                        <span class="badge badge-primary">5 Questions</span>
                        <span class="reward-hint">+125 XP Max</span>
                    </div>
                </div>

                <!-- Mathematics -->
                <div class="quiz-subject-card card-hover" onclick="QuizEngine.startQuiz('Mathematics')">
                    <div class="subject-icon-wrap bg-blue-light">
                        <span class="subject-icon">📐</span>
                    </div>
                    <h3 class="subject-card-title">Mathematics</h3>
                    <p class="subject-card-desc">Limits, continuity, quadratic parabolas, combinatorics, and trigonometry identities.</p>
                    <div class="quiz-card-footer">
                        <span class="badge badge-info">Calculus & Algebra</span>
                        <span class="reward-hint">+125 XP Max</span>
                    </div>
                </div>

                <!-- Physics -->
                <div class="quiz-subject-card card-hover" onclick="QuizEngine.startQuiz('Physics')">
                    <div class="subject-icon-wrap bg-purple-light">
                        <span class="subject-icon">⚛️</span>
                    </div>
                    <h3 class="subject-card-title">Physics</h3>
                    <p class="subject-card-desc">Faraday's induction, Lenz's law, wave optics, interference, and Newton's laws.</p>
                    <div class="quiz-card-footer">
                        <span class="badge badge-purple">Forces & Optics</span>
                        <span class="reward-hint">+125 XP Max</span>
                    </div>
                </div>

                <!-- Biology -->
                <div class="quiz-subject-card card-hover" onclick="QuizEngine.startQuiz('Biology')">
                    <div class="subject-icon-wrap bg-success-light">
                        <span class="subject-icon">🧬</span>
                    </div>
                    <h3 class="subject-card-title">Biology</h3>
                    <p class="subject-card-desc">Photosynthesis thylakoid reactions, Calvin cycle enzymes, organelle roles, genetics.</p>
                    <div class="quiz-card-footer">
                        <span class="badge badge-success">Cell & Genetics</span>
                        <span class="reward-hint">+125 XP Max</span>
                    </div>
                </div>

                <!-- Computer Science -->
                <div class="quiz-subject-card card-hover" onclick="QuizEngine.startQuiz('Computer Science')">
                    <div class="subject-icon-wrap bg-warning-light">
                        <span class="subject-icon">💻</span>
                    </div>
                    <h3 class="subject-card-title">Computer Science</h3>
                    <p class="subject-card-desc">Binary search trees, big-O time complexity, arrays vs lists, recursion & DP caching.</p>
                    <div class="quiz-card-footer">
                        <span class="badge badge-warning">Algorithms & Trees</span>
                        <span class="reward-hint">+125 XP Max</span>
                    </div>
                </div>

                <!-- Custom Topic Challenge -->
                <div class="quiz-subject-card card-hover border-dashed" onclick="QuizEngine.openCustomTopicModal()">
                    <div class="subject-icon-wrap bg-muted-light">
                        <span class="subject-icon">🎯</span>
                    </div>
                    <h3 class="subject-card-title">Specific Topic Drill</h3>
                    <p class="subject-card-desc">Choose an exact topic from your syllabus to test single-concept mastery.</p>
                    <div class="quiz-card-footer">
                        <span class="badge badge-secondary">Custom Target</span>
                        <span class="reward-hint">Choose Topic &rarr;</span>
                    </div>
                </div>
            </div>

            <!-- Recent Quiz Attempts Table -->
            <div class="card">
                <div class="card-header flex-between">
                    <div>
                        <h3 class="card-title">Recent Quiz Performance History</h3>
                        <p class="card-subtitle">Every completed quiz immediately recalculates your weakness profile.</p>
                    </div>
                </div>
                ${this.renderRecentHistoryTable()}
            </div>
        `;
    },

    renderRecentHistoryTable() {
        const history = StorageManager.getQuizHistory();
        if (history.length === 0) {
            return `<p class="text-muted p-4">No quiz records yet. Take a quiz to begin tracking your mastery!</p>`;
        }

        return `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Quiz Title</th>
                            <th>Subject</th>
                            <th>Score</th>
                            <th>Accuracy</th>
                            <th>Weaknesses Logged</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.slice(0, 5).map(h => `
                            <tr>
                                <td><strong>${h.quizTitle}</strong></td>
                                <td><span class="subject-tag">${h.subject}</span></td>
                                <td><strong>${h.score} / ${h.totalQuestions}</strong></td>
                                <td>
                                    <span class="badge badge-${h.percentage >= 75 ? 'success' : (h.percentage >= 50 ? 'warning' : 'danger')}">
                                        ${h.percentage}%
                                    </span>
                                </td>
                                <td>
                                    ${h.weakTopics && h.weakTopics.length > 0 
                                        ? h.weakTopics.map(w => `<span class="badge badge-danger-soft">${w}</span>`).join(" ") 
                                        : `<span class="badge badge-success-soft">None! All clear</span>`}
                                </td>
                                <td class="text-muted">${new Date(h.timestamp).toLocaleDateString()}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderQuestionView() {
        const container = document.getElementById("quiz-view");
        const idx = this.state.currentIndex;
        const total = this.state.questions.length;
        const currentQ = this.state.questions[idx];
        const userAns = this.state.userAnswers[idx];
        const hasAnswered = userAns !== null;

        const mins = Math.floor(this.state.timeRemainingSeconds / 60);
        const secs = this.state.timeRemainingSeconds % 60;
        const timerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        container.innerHTML = `
            <div class="quiz-active-container">
                <!-- Top Navigation & Progress Bar -->
                <div class="card mb-4">
                    <div class="quiz-top-bar flex-between">
                        <button class="btn btn-sm btn-outline" onclick="QuizEngine.exitQuizConfirm()">
                            ✕ Exit Quiz
                        </button>
                        <div class="quiz-tracker-meta">
                            <span class="tracker-count">Question <strong>${idx + 1}</strong> of ${total}</span>
                            <span class="subject-tag">${currentQ.subject}</span>
                        </div>
                        <div class="quiz-timer" id="quiz-timer-display">
                            ⏱️ ${timerText}
                        </div>
                    </div>

                    <div class="progress-bar-bg mt-3">
                        <div class="progress-bar-fill fill-primary" style="width: ${((idx + 1) / total) * 100}%"></div>
                    </div>
                </div>

                <!-- Question Card -->
                <div class="card quiz-question-card">
                    <div class="question-header mb-3">
                        <span class="badge badge-info">${currentQ.topic}</span>
                        <span class="badge badge-secondary">${currentQ.difficulty}</span>
                    </div>

                    <h3 class="quiz-question-title">${currentQ.question}</h3>

                    <!-- Options Grid -->
                    <div class="quiz-options-list mt-4">
                        ${currentQ.options.map((opt, optIdx) => {
                            let optionClass = "quiz-option-btn";
                            let icon = `<span class="option-letter">${String.fromCharCode(65 + optIdx)}</span>`;

                            if (hasAnswered) {
                                if (optIdx === currentQ.correctIndex) {
                                    optionClass += " option-correct";
                                    icon = `<span class="option-letter">✓</span>`;
                                } else if (userAns.selectedIndex === optIdx) {
                                    optionClass += " option-incorrect";
                                    icon = `<span class="option-letter">✗</span>`;
                                } else {
                                    optionClass += " option-disabled";
                                }
                            }

                            return `
                                <button class="${optionClass}" 
                                    ${hasAnswered ? "disabled" : ""} 
                                    onclick="QuizEngine.selectAnswer(${optIdx})">
                                    ${icon}
                                    <span class="option-text">${opt}</span>
                                </button>
                            `;
                        }).join("")}
                    </div>

                    <!-- Instant Explanation Drawer (revealed after answering) -->
                    ${hasAnswered ? `
                        <div class="explanation-box ${userAns.isCorrect ? 'explanation-correct' : 'explanation-incorrect'} mt-4">
                            <div class="explanation-header">
                                <strong>${userAns.isCorrect ? "🎉 Correct!" : "❌ Incorrect"}</strong>
                            </div>
                            <p class="explanation-body mt-1">${currentQ.explanation}</p>
                        </div>
                    ` : ""}

                    <!-- Bottom Nav Controls -->
                    <div class="quiz-bottom-nav flex-between mt-6">
                        <button class="btn btn-outline" 
                            ${idx === 0 ? "disabled" : ""} 
                            onclick="QuizEngine.prevQuestion()">
                            &larr; Previous
                        </button>

                        <button class="btn btn-primary" 
                            ${!hasAnswered ? "disabled" : ""} 
                            onclick="QuizEngine.nextQuestion()">
                            ${idx === total - 1 ? "Submit Quiz & View Results &rarr;" : "Next Question &rarr;"}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderResultsView(attempt, autoSubmitted) {
        const container = document.getElementById("quiz-view");
        const profile = StorageManager.getProfile();

        let medal = "🥉";
        let title = "Good Effort!";
        let badgeColor = "warning";

        if (attempt.percentage >= 80) {
            medal = "🥇";
            title = "Outstanding Mastery!";
            badgeColor = "success";
        } else if (attempt.percentage >= 60) {
            medal = "🥈";
            title = "Solid Performance!";
            badgeColor = "info";
        }

        container.innerHTML = `
            <div class="quiz-results-card card text-center mb-6">
                <div class="results-badge-wrap">
                    <span class="results-medal">${medal}</span>
                </div>
                <h2 class="results-title mt-2">${title}</h2>
                <p class="results-subtitle text-muted">${attempt.quizTitle}</p>

                ${autoSubmitted ? `<div class="badge badge-warning mt-2">⏰ Time expired - quiz automatically submitted</div>` : ""}

                <div class="results-score-display my-4">
                    <div class="score-circle">
                        <span class="score-number">${attempt.score}/${attempt.totalQuestions}</span>
                        <span class="score-label">${attempt.percentage}% Accuracy</span>
                    </div>
                </div>

                <div class="rewards-earned-banner mb-4">
                    <span class="coin-icon">🪙</span>
                    <span>Earned <strong>+${attempt.pointsEarned} XP Coins</strong>! Your new total is <strong>${profile.points} XP</strong>.</span>
                </div>

                <!-- Weak Topics Found / Clear -->
                <div class="weakness-summary-card mb-4 text-left">
                    <h4 class="mb-2">Weakness Impact Report:</h4>
                    ${attempt.weakTopics.length > 0 ? `
                        <p class="text-danger mb-2">The following topics were identified as needing reinforcement:</p>
                        <div class="chips-container">
                            ${attempt.weakTopics.map(w => `<span class="chip chip-danger">${w}</span>`).join("")}
                        </div>
                        <p class="text-muted small mt-2">
                            💡 These have been automatically added to your <strong>Weakness Detector</strong> and prioritized in your <strong>AI Study Plan</strong>.
                        </p>
                    ` : `
                        <p class="text-success">🎉 No weaknesses detected in this round! All questions in these topics were mastered.</p>
                    `}
                </div>

                <!-- Navigation buttons -->
                <div class="results-actions flex-center flex-wrap gap-3">
                    <button class="btn btn-outline" onclick="QuizEngine.exitQuizToLobby()">
                        ← Back to Quizzes
                    </button>
                    <button class="btn btn-secondary" onclick="App.navigateTo('weakness')">
                        📊 View Weakness Detector
                    </button>
                    <button class="btn btn-secondary" onclick="App.navigateTo('study-plan')">
                        📅 Check Updated Study Plan
                    </button>
                    <button class="btn btn-primary" onclick="App.navigateTo('rewards')">
                        🎁 Redeem Rewards
                    </button>
                </div>
            </div>
        `;
    },

    openCustomTopicModal() {
        const syllabus = StorageManager.getSyllabus();
        const topicList = syllabus.map(s => s.topic);

        let topicOptions = topicList.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");

        const modalHtml = `
            <div class="modal-overlay" id="custom-topic-modal" onclick="QuizEngine.closeModalOnOverlay(event)">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3 class="modal-title">Select Custom Topic Drill</h3>
                        <button class="modal-close" onclick="QuizEngine.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <label class="form-label">Pick any topic from your current syllabus:</label>
                        <select id="custom-topic-select" class="form-control">
                            ${topicOptions}
                        </select>
                        <p class="text-muted small mt-2">
                            A focused 5-question test will be generated immediately for this topic.
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="QuizEngine.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="QuizEngine.launchCustomTopicSelected()">Launch Drill</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("modal-container").innerHTML = modalHtml;
    },

    launchCustomTopicSelected() {
        const select = document.getElementById("custom-topic-select");
        if (select && select.value) {
            const topic = select.value;
            this.closeModal();
            this.startQuiz("all", topic);
        }
    },

    closeModal() {
        const modal = document.getElementById("custom-topic-modal");
        if (modal) modal.remove();
    },

    closeModalOnOverlay(e) {
        if (e.target.id === "custom-topic-modal") {
            this.closeModal();
        }
    },

    exitQuizConfirm() {
        if (confirm("Are you sure you want to exit the quiz? Unsaved progress will be lost.")) {
            this.stopTimer();
            this.exitQuizToLobby();
        }
    },

    exitQuizToLobby() {
        this.stopTimer();
        this.state.active = false;
        this.state.finished = false;
        this.renderLobbyView();
    }
};

