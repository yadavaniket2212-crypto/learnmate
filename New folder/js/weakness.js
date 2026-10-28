/**
 * LearnMate AI - Weakness Detector
 * Analyzes historical and recent quiz answers to identify knowledge gaps,
 * calculates mastery levels, and generates targeted improvement recommendations.
 */

const WeaknessDetector = {
    /**
     * Analyzes all quiz attempts in history to aggregate topic-level accuracy.
     * @returns {Array<Object>} Sorted list of topics with mastery diagnostics.
     */
    analyze() {
        const history = StorageManager.getQuizHistory();
        const topicMap = {};

        // Aggregate answers across all completed quizzes
        history.forEach(attempt => {
            if (!attempt.answers || !Array.isArray(attempt.answers)) return;

            attempt.answers.forEach(ans => {
                const topicName = ans.topic || "General";
                if (!topicMap[topicName]) {
                    topicMap[topicName] = {
                        topic: topicName,
                        subject: attempt.subject || "General",
                        attempts: 0,
                        correct: 0,
                        incorrect: 0,
                        missedQuestions: [],
                        lastAttemptDate: attempt.timestamp
                    };
                }

                topicMap[topicName].attempts += 1;
                if (ans.correct) {
                    topicMap[topicName].correct += 1;
                } else {
                    topicMap[topicName].incorrect += 1;
                    if (ans.question) {
                        topicMap[topicName].missedQuestions.push(ans.question);
                    }
                }

                // Keep most recent timestamp
                if (new Date(attempt.timestamp) > new Date(topicMap[topicName].lastAttemptDate)) {
                    topicMap[topicName].lastAttemptDate = attempt.timestamp;
                }
            });
        });

        const topics = Object.values(topicMap).map(item => {
            const accuracy = item.attempts > 0 ? Math.round((item.correct / item.attempts) * 100) : 0;
            let status = "Mastered";
            let severity = "low";
            let color = "success";

            if (accuracy < 50 || item.incorrect >= 2) {
                status = "Critical Weakness";
                severity = "critical";
                color = "danger";
            } else if (accuracy < 75) {
                status = "Needs Practice";
                severity = "moderate";
                color = "warning";
            } else {
                status = "Strong Concept";
                severity = "good";
                color = "success";
            }

            const recommendation = this.generateRecommendation(item.topic, accuracy, item.incorrect);

            return {
                ...item,
                accuracy,
                status,
                severity,
                color,
                recommendation
            };
        });

        // Sort worst performers first (lowest accuracy, then highest incorrect count)
        topics.sort((a, b) => {
            if (a.severity === "critical" && b.severity !== "critical") return -1;
            if (b.severity === "critical" && a.severity !== "critical") return 1;
            return a.accuracy - b.accuracy;
        });

        return topics;
    },

    /**
     * Get weak topics list (only Critical and Needs Practice)
     */
    getWeakTopicsOnly() {
        const all = this.analyze();
        return all.filter(t => t.severity === "critical" || t.severity === "moderate");
    },

    /**
     * Generates a pedagogical recommendation string based on topic & performance
     */
    generateRecommendation(topic, accuracy, incorrectCount) {
        if (accuracy < 50) {
            return `High error rate (${incorrectCount} misses). Recommended: Review foundational theory with AI Tutor and complete a 5-question targeted drill before moving forward.`;
        } else if (accuracy < 75) {
            return `Moderate understanding (${accuracy}%). Recommended: Focus on formula derivations and edge-case practice problems in your next study block.`;
        } else {
            return `Solid retention (${accuracy}%). Maintain mastery with periodic spaced-repetition quick quizzes.`;
        }
    },

    /**
     * Renders the Weakness Detector tab UI
     */
    render() {
        const container = document.getElementById("weakness-view") || document.getElementById("weakness-detector-view");
        if (!container) return;

        const topics = this.analyze();
        const weakOnly = topics.filter(t => t.severity === "critical" || t.severity === "moderate");
        const criticalCount = topics.filter(t => t.severity === "critical").length;
        const moderateCount = topics.filter(t => t.severity === "moderate").length;
        const masteredCount = topics.filter(t => t.severity === "good").length;

        let content = `
            <div class="view-header">
                <div>
                    <h2 class="view-title">Knowledge Gap & Weakness Detector</h2>
                    <p class="view-subtitle">Automated diagnosis of quiz mistakes and personalized recovery plans.</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="App.startWeaknessDrill()">
                        <span class="icon">🎯</span> Launch Targeted Weakness Drill
                    </button>
                </div>
            </div>

            <!-- Weakness Stat Cards -->
            <div class="grid-3 mb-6">
                <div class="stat-card border-danger">
                    <div class="stat-icon bg-danger-light">⚠️</div>
                    <div class="stat-meta">
                        <span class="stat-label">Critical Weaknesses</span>
                        <div class="stat-value text-danger">${criticalCount} Topics</div>
                        <span class="stat-hint">Score below 50%</span>
                    </div>
                </div>

                <div class="stat-card border-warning">
                    <div class="stat-icon bg-warning-light">🔄</div>
                    <div class="stat-meta">
                        <span class="stat-label">Needs Practice</span>
                        <div class="stat-value text-warning">${moderateCount} Topics</div>
                        <span class="stat-hint">Score between 50% - 74%</span>
                    </div>
                </div>

                <div class="stat-card border-success">
                    <div class="stat-icon bg-success-light">🏆</div>
                    <div class="stat-meta">
                        <span class="stat-label">Mastered Topics</span>
                        <div class="stat-value text-success">${masteredCount} Topics</div>
                        <span class="stat-hint">Score 75% or higher</span>
                    </div>
                </div>
            </div>
        `;

        if (topics.length === 0) {
            content += `
                <div class="card empty-state">
                    <div class="empty-icon">📊</div>
                    <h3>No Quiz Data Logged Yet</h3>
                    <p>Complete an interactive quiz to let LearnMate AI analyze your strengths and identify weak areas.</p>
                    <button class="btn btn-primary mt-4" onclick="App.navigateTo('quiz')">Take a Quick Quiz</button>
                </div>
            `;
        } else {
            content += `
                <div class="card mb-6">
                    <div class="card-header flex-between">
                        <div>
                            <h3 class="card-title">Detailed Diagnostic Breakdown</h3>
                            <p class="card-subtitle">Real-time accuracy and recovery actions per topic</p>
                        </div>
                        <span class="badge badge-info">${topics.length} Topics Analyzed</span>
                    </div>

                    <div class="topic-list">
                        ${topics.map(t => `
                            <div class="weakness-item severity-${t.severity}">
                                <div class="weakness-main">
                                    <div class="weakness-header">
                                        <div class="flex-center gap-2">
                                            <span class="badge badge-${t.color}">${t.status}</span>
                                            <span class="subject-tag">${t.subject}</span>
                                        </div>
                                        <span class="accuracy-pill text-${t.color}">
                                            Accuracy: <strong>${t.accuracy}%</strong> (${t.correct}/${t.attempts} correct)
                                        </span>
                                    </div>
                                    <h4 class="weakness-title">${t.topic}</h4>
                                    <p class="weakness-recommendation">${t.recommendation}</p>

                                    <!-- Progress Bar -->
                                    <div class="progress-bar-bg mt-2">
                                        <div class="progress-bar-fill fill-${t.color}" style="width: ${t.accuracy}%"></div>
                                    </div>

                                    ${t.missedQuestions.length > 0 ? `
                                        <div class="missed-questions-preview mt-3">
                                            <span class="missed-label">Recent Missed Question:</span>
                                            <p class="missed-text">"${escapeHtml(t.missedQuestions[0])}"</p>
                                        </div>
                                    ` : ""}
                                </div>

                                <div class="weakness-actions">
                                    <button class="btn btn-sm btn-outline" title="Ask AI Tutor to explain this concept" onclick="App.askTutorAboutTopic('${escapeHtml(t.topic)}')">
                                        🤖 Ask Tutor
                                    </button>
                                    <button class="btn btn-sm btn-secondary" title="Add to Study Plan" onclick="App.addTopicToStudyPlan('${escapeHtml(t.topic)}')">
                                        📅 Plan Study
                                    </button>
                                    <button class="btn btn-sm btn-primary" title="Practice questions on this topic" onclick="App.practiceTopic('${escapeHtml(t.topic)}')">
                                        🎯 Practice Now
                                    </button>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        }

        container.innerHTML = content;
    }
};
