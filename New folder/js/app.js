/**
 * LearnMate AI - Main Application Controller
 * Coordinates views, navigation, dashboard analytics, charts, themes, and global events.
 */

// Global HTML escaper
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const App = {
    currentView: "dashboard",

    init() {
        // Apply saved theme
        const theme = StorageManager.getTheme();
        document.documentElement.setAttribute("data-theme", theme);
        this.updateThemeButton(theme);

        // Initialize sub-modules
        StudyPlanner.init();
        AIChat.init();

        // Setup URL hash routing or default view
        const hash = window.location.hash.replace("#", "");
        if (["dashboard", "weakness", "study-plan", "quiz", "syllabus", "rewards", "chat"].includes(hash)) {
            this.navigateTo(hash);
        } else {
            this.navigateTo("dashboard");
        }

        // Close mobile drawer on outside click
        window.addEventListener("resize", () => {
            if (window.innerWidth > 992) {
                document.getElementById("sidebar")?.classList.remove("sidebar-open");
                document.getElementById("sidebar-overlay")?.classList.remove("active");
            }
        });

        this.updateDashboardMetrics();
    },

    navigateTo(viewName) {
        this.currentView = viewName;
        window.location.hash = viewName;

        // Update nav links
        document.querySelectorAll(".nav-link").forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("data-view") === viewName) {
                link.classList.add("active");
            }
        });

        // Hide all views
        document.querySelectorAll(".view-section").forEach(sec => {
            sec.classList.remove("active-view");
        });

        // Show target view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add("active-view");
        }

        // Close mobile drawer
        document.getElementById("sidebar")?.classList.remove("sidebar-open");
        document.getElementById("sidebar-overlay")?.classList.remove("active");

        // Render target module
        switch (viewName) {
            case "dashboard":
                this.renderDashboard();
                break;
            case "weakness":
                WeaknessDetector.render();
                break;
            case "study-plan":
                StudyPlanner.render();
                break;
            case "quiz":
                QuizEngine.render();
                break;
            case "syllabus":
                SyllabusTracker.render();
                break;
            case "rewards":
                RewardsStore.render();
                break;
            case "chat":
                AIChat.render();
                break;
        }

        window.scrollTo(0, 0);
    },

    toggleMobileMenu() {
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebar-overlay");
        if (sidebar && overlay) {
            sidebar.classList.toggle("sidebar-open");
            overlay.classList.toggle("active");
        }
    },

    toggleTheme() {
        const current = StorageManager.getTheme();
        const nextTheme = current === "dark" ? "light" : "dark";
        StorageManager.saveTheme(nextTheme);
        document.documentElement.setAttribute("data-theme", nextTheme);
        this.updateThemeButton(nextTheme);
        this.showToast(`Switched to ${nextTheme} mode`, "info");
    },

    updateThemeButton(theme) {
        const btn = document.getElementById("theme-toggle-btn");
        if (btn) {
            btn.innerHTML = theme === "dark" ? "☀️ Light" : "🌙 Dark";
        }
    },

    updateDashboardMetrics() {
        const profile = StorageManager.getProfile();
        const syllabus = StorageManager.getSyllabus();
        const weakTopics = WeaknessDetector.getWeakTopicsOnly();

        // Update header & sidebar pills
        const headerPoints = document.getElementById("header-points-val");
        if (headerPoints) headerPoints.textContent = `${profile.points || 0} XP`;

        const headerStreak = document.getElementById("header-streak-val");
        if (headerStreak) headerStreak.textContent = `${profile.streak || 0} Days`;

        const headerName = document.getElementById("student-name-display");
        if (headerName) headerName.textContent = profile.name || "Student";

        const topGreetingName = document.getElementById("header-user-name");
        if (topGreetingName) topGreetingName.textContent = (profile.name || "Alex").split(" ")[0];

        const badgeWeak = document.getElementById("sidebar-weak-badge");
        if (badgeWeak) {
            badgeWeak.textContent = weakTopics.length;
            badgeWeak.style.display = weakTopics.length > 0 ? "inline-block" : "none";
        }
    },

    renderDashboard() {
        const container = document.getElementById("dashboard-view");
        if (!container) return;

        const profile = StorageManager.getProfile();
        const syllabus = StorageManager.getSyllabus();
        const weakTopics = WeaknessDetector.getWeakTopicsOnly();
        const history = StorageManager.getQuizHistory();

        const totalSyllabus = syllabus.length;
        const completedSyllabus = syllabus.filter(s => s.status === "completed").length;
        const syllabusPercent = totalSyllabus > 0 ? Math.round((completedSyllabus / totalSyllabus) * 100) : 0;

        container.innerHTML = `
            <!-- Welcome Hero -->
            <div class="dashboard-hero card mb-6">
                <div class="flex-between flex-wrap gap-4">
                    <div class="hero-text-wrap">
                        <div class="flex-center gap-2 mb-2">
                            <span class="badge badge-primary-soft">✨ Welcome back!</span>
                            <span class="badge badge-success-soft">🔥 ${profile.streak}-Day Streak · Keep it up!</span>
                        </div>
                        <h2 class="hero-title">Rise & grind, <span class="highlight-text">${escapeHtml(profile.name)}</span> 💫</h2>
                        <p class="hero-desc">
                            You're <strong>${syllabusPercent}%</strong> done with your curriculum — that's actually lowkey impressive.
                            ${weakTopics.length > 0 
                                ? `But no cap, you've got <strong>${weakTopics.length} topics</strong> that need a glow-up. Let's fix that rn.` 
                                : `Your knowledge is on main character energy. Stay consistent! 💚`}
                        </p>
                    </div>
                    <div class="hero-actions flex-wrap gap-2">
                        <button class="btn btn-primary" onclick="App.startWeaknessDrill()">
                            ⚡ Fix Weak Spots NOW
                        </button>
                        <button class="btn btn-outline" onclick="App.navigateTo('study-plan')">
                            📅 See Today's Plan
                        </button>
                    </div>
                </div>
            </div>

            <!-- 4 Stat Cards -->
            <div class="grid-4 gap-4 mb-6">
                <div class="stat-card border-primary" onclick="App.navigateTo('syllabus')">
                    <div class="stat-icon bg-primary-light">📚</div>
                    <div class="stat-meta">
                        <span class="stat-label">Curriculum Done</span>
                        <div class="stat-value text-primary">${syllabusPercent}%</div>
                        <span class="stat-hint">${completedSyllabus} of ${totalSyllabus} topics mastered</span>
                    </div>
                </div>

                <div class="stat-card border-danger" onclick="App.navigateTo('weakness')">
                    <div class="stat-icon bg-danger-light">🎯</div>
                    <div class="stat-meta">
                        <span class="stat-label">Skill Gaps</span>
                        <div class="stat-value text-danger">${weakTopics.length} Topics</div>
                        <span class="stat-hint">${weakTopics.length === 0 ? 'None detected — bussin!' : 'Needs targeted drills'}</span>
                    </div>
                </div>

                <div class="stat-card border-warning" onclick="App.navigateTo('rewards')">
                    <div class="stat-icon bg-warning-light">🪙</div>
                    <div class="stat-meta">
                        <span class="stat-label">Aura Points</span>
                        <div class="stat-value text-warning">${profile.points} XP</div>
                        <span class="stat-hint">Spend on rewards & perks</span>
                    </div>
                </div>

                <div class="stat-card border-success" onclick="App.navigateTo('quiz')">
                    <div class="stat-icon bg-success-light">🏆</div>
                    <div class="stat-meta">
                        <span class="stat-label">Quizzes Slayed</span>
                        <div class="stat-value text-success">${profile.totalQuizzesTaken || history.length}</div>
                        <span class="stat-hint">${profile.correctAnswers || 22} correct answers total</span>
                    </div>
                </div>
            </div>

            <!-- Activity Chart + Priority -->
            <div class="grid-2-1 gap-6 mb-6">
                <div class="card">
                    <div class="card-header flex-between">
                        <div>
                            <h3 class="card-title">Weekly Study Activity 📈</h3>
                            <p class="card-subtitle">Hours studied vs. quiz accuracy trend — this week</p>
                        </div>
                        <span class="badge badge-info">This Week</span>
                    </div>
                    <div style="padding:0.5rem 0">
                        ${this.generateActivityChartSVG()}
                    </div>
                    <div class="chart-legend flex-center gap-4 mt-2">
                        <div class="legend-item flex-center gap-1">
                            <span class="legend-dot bg-primary" style="width:10px;height:10px;border-radius:50%;"></span>
                            <span class="small text-muted">Study Hours</span>
                        </div>
                        <div class="legend-item flex-center gap-1">
                            <span class="legend-dot bg-success" style="width:10px;height:10px;border-radius:50%;background:var(--success);"></span>
                            <span class="small text-muted">Quiz Accuracy %</span>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header flex-between">
                        <div>
                            <h3 class="card-title">Priority Queue 🚨</h3>
                            <p class="card-subtitle">Your biggest skill gaps rn</p>
                        </div>
                        <button class="btn btn-xs btn-outline" onclick="App.navigateTo('weakness')">All →</button>
                    </div>

                    ${weakTopics.length > 0 ? `
                        <div class="quick-weakness-list mt-2">
                            ${weakTopics.slice(0, 3).map(w => `
                                <div class="quick-weak-item">
                                    <div class="flex-between mb-1">
                                        <strong class="weak-name">${escapeHtml(w.topic)}</strong>
                                        <span class="badge badge-${w.severity === 'critical' ? 'danger' : 'warning'}">${w.accuracy}%</span>
                                    </div>
                                    <div class="progress-bar-bg progress-bar-xs mb-2">
                                        <div class="progress-bar-fill fill-${w.severity === 'critical' ? 'danger' : 'warning'}" style="width:${w.accuracy}%"></div>
                                    </div>
                                    <div class="flex-between">
                                        <span class="text-muted small">${w.subject}</span>
                                        <button class="btn btn-xs btn-primary" onclick="App.practiceTopic('${escapeHtml(w.topic)}')">Drill it ⚡</button>
                                    </div>
                                </div>
                            `).join("")}
                        </div>
                    ` : `
                        <div class="empty-state p-4">
                            <span>🎉</span>
                            <p class="small mt-2">No weak spots! You're literally built different.</p>
                        </div>
                    `}
                </div>
            </div>

            <!-- Quick Action Tiles -->
            <div class="card mb-6">
                <div class="card-header">
                    <h3 class="card-title">Quick Launch 🚀</h3>
                    <p class="card-subtitle">One tap to any tool — no searching needed</p>
                </div>
                <div class="grid-4 gap-3 mt-3">
                    <button class="quick-action-tile" onclick="App.navigateTo('quiz')">
                        <span class="tile-icon">⚡</span>
                        <span class="tile-title">Quiz Yourself</span>
                        <span class="tile-sub">Earn Aura Points</span>
                    </button>
                    <button class="quick-action-tile" onclick="App.navigateTo('study-plan')">
                        <span class="tile-icon">📅</span>
                        <span class="tile-title">Study Timetable</span>
                        <span class="tile-sub">AI-generated plan</span>
                    </button>
                    <button class="quick-action-tile" onclick="App.navigateTo('chat')">
                        <span class="tile-icon">🤖</span>
                        <span class="tile-title">AI Tutor</span>
                        <span class="tile-sub">Zero judgment zone</span>
                    </button>
                    <button class="quick-action-tile" onclick="App.navigateTo('rewards')">
                        <span class="tile-icon">🎁</span>
                        <span class="tile-title">Rewards Store</span>
                        <span class="tile-sub">Spend your XP</span>
                    </button>
                </div>
            </div>
        `;
    },

    generateActivityChartSVG() {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const hoursData = [1.5, 2.0, 1.0, 2.5, 3.0, 4.0, 2.5]; // max ~5
        const accuracyData = [65, 80, 50, 85, 75, 90, 85]; // 0 - 100%

        const chartWidth = 520;
        const chartHeight = 160;
        const padding = 25;

        const colWidth = (chartWidth - padding * 2) / days.length;

        const barsSvg = days.map((day, i) => {
            const hVal = hoursData[i];
            const accVal = accuracyData[i];

            const barHeight = Math.round((hVal / 5) * (chartHeight - 40));
            const barX = padding + i * colWidth + (colWidth / 4);
            const barY = chartHeight - padding - barHeight;

            const dotY = chartHeight - padding - Math.round((accVal / 100) * (chartHeight - 40));
            const dotX = padding + i * colWidth + (colWidth / 2);

            return `
                <g class="chart-group">
                    <!-- Bar for study hours -->
                    <rect x="${barX}" y="${barY}" width="${colWidth * 0.45}" height="${barHeight}" rx="4" class="chart-bar fill-primary" />
                    <!-- Dot for accuracy -->
                    <circle cx="${dotX}" cy="${dotY}" r="4" class="chart-dot fill-success" />
                    <text x="${dotX}" y="${chartHeight - 6}" text-anchor="middle" class="chart-axis-label">${day}</text>
                </g>
            `;
        }).join("");

        // Connecting line for accuracy dots
        const linePoints = days.map((day, i) => {
            const accVal = accuracyData[i];
            const dotY = chartHeight - padding - Math.round((accVal / 100) * (chartHeight - 40));
            const dotX = padding + i * colWidth + (colWidth / 2);
            return `${dotX},${dotY}`;
        }).join(" ");

        return `
            <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="activity-svg" preserveAspectRatio="none">
                <!-- Grid horizontal lines -->
                <line x1="${padding}" y1="${padding}" x2="${chartWidth - padding}" y2="${padding}" stroke="var(--border-color)" stroke-dasharray="3,3" />
                <line x1="${padding}" y1="${chartHeight / 2}" x2="${chartWidth - padding}" y2="${chartHeight / 2}" stroke="var(--border-color)" stroke-dasharray="3,3" />
                <line x1="${padding}" y1="${chartHeight - padding}" x2="${chartWidth - padding}" y2="${chartHeight - padding}" stroke="var(--border-color)" />

                <!-- Bars & labels -->
                ${barsSvg}

                <!-- Accuracy Trend Polyline -->
                <polyline fill="none" stroke="#10b981" stroke-width="2.5" points="${linePoints}" />
            </svg>
        `;
    },

    startWeaknessDrill() {
        this.navigateTo("quiz");
        QuizEngine.startQuiz("all", null, true);
        this.showToast("Targeted weakness drill started! Focus on these tricky questions.", "info");
    },

    practiceTopic(topic) {
        this.navigateTo("quiz");
        QuizEngine.startQuiz("all", topic);
        this.showToast(`Starting practice drill for "${topic}"`, "info");
    },

    askTutorAboutTopic(topic) {
        this.navigateTo("chat");
        AIChat.sendMessage(`Explain the core concept and common pitfalls of "${topic}"`);
    },

    addTopicToStudyPlan(topic) {
        this.navigateTo("study-plan");
        StudyPlanner.generatePlan();
        this.showToast(`Prioritized "${topic}" in your daily study schedule.`, "success");
    },

    editProfileName() {
        const profile = StorageManager.getProfile();
        const newName = prompt("Enter your name:", profile.name);
        if (newName && newName.trim()) {
            profile.name = newName.trim();
            StorageManager.saveProfile(profile);
            this.updateDashboardMetrics();
            if (this.currentView === "dashboard") this.renderDashboard();
            this.showToast("Profile name updated!", "success");
        }
    },

    resetAllDataConfirm() {
        if (confirm("Reset all student data (syllabus, quiz scores, rewards, timetable) back to initial default demo state?")) {
            StorageManager.resetAllData();
            StudyPlanner.init();
            AIChat.init();
            this.updateDashboardMetrics();
            this.navigateTo(this.currentView);
            this.showToast("All data successfully reset to default sample set.", "info");
        }
    },

    showToast(message, type = "info") {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast toast-${type} toast-enter`;

        let icon = "ℹ️";
        if (type === "success") icon = "✅";
        if (type === "warning") icon = "⚠️";
        if (type === "danger") icon = "❌";

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-text">${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        // Play sound FX if available
        if (window.FXEngine) {
            if (type === "success") FXEngine.playSuccessSound();
            else if (type === "danger") FXEngine.playErrorSound();
            else if (type === "warning") FXEngine.playCoinSound();
        }

        setTimeout(() => {
            toast.classList.remove("toast-enter");
            toast.classList.add("toast-exit");
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }
};

// Initialize App when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
