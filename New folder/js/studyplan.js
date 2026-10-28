/**
 * LearnMate AI - AI Study Plan & Timetable Generator
 * Builds personalized daily timetables dynamically prioritizing detected weak topics,
 * unfinished syllabus items, daily available study hours, and target exam deadlines.
 */

const StudyPlanner = {
    currentPlan: null,

    /**
     * Initializes the study planner with cached or fresh plan.
     */
    init() {
        this.currentPlan = StorageManager.getStudyPlan();
        if (!this.currentPlan) {
            this.generatePlan();
        }
    },

    /**
     * Gathers all candidate topics prioritized by weakness severity and pending syllabus status.
     */
    gatherCandidateTopics() {
        const weakTopics = WeaknessDetector.getWeakTopicsOnly();
        const syllabus = StorageManager.getSyllabus();
        const pendingSyllabus = syllabus.filter(s => s.status !== "completed");

        const candidates = [];
        const seen = new Set();

        // 1. Prioritize critical and moderate weak topics
        weakTopics.forEach(w => {
            if (!seen.has(w.topic)) {
                seen.add(w.topic);
                candidates.push({
                    topic: w.topic,
                    subject: w.subject,
                    priority: w.severity === "critical" ? "High (Critical Weakness)" : "Medium (Review Needed)",
                    source: "Weakness Detector",
                    badgeColor: w.severity === "critical" ? "danger" : "warning"
                });
            }
        });

        // 2. Add pending/in-progress syllabus items
        pendingSyllabus.forEach(p => {
            if (!seen.has(p.topic)) {
                seen.add(p.topic);
                candidates.push({
                    topic: p.topic,
                    subject: p.subject,
                    priority: p.status === "in-progress" ? "Medium (In Progress)" : "Normal (Syllabus)",
                    source: "Syllabus Tracker",
                    badgeColor: p.status === "in-progress" ? "info" : "secondary"
                });
            }
        });

        return candidates;
    },

    /**
     * Generates a personalized timetable based on parameters.
     */
    async generatePlan(params = {}) {
        const hours = parseFloat(params.hours || document.getElementById("plan-hours-input")?.value || 3.5);
        const intensity = params.intensity || document.getElementById("plan-intensity-select")?.value || "balanced";
        const targetDays = parseInt(params.targetDays || document.getElementById("plan-deadline-select")?.value || 14);

        const candidates = this.gatherCandidateTopics();
        
        // Show loading state if button exists
        const genBtn = document.getElementById("generate-plan-btn");
        if (genBtn) {
            genBtn.disabled = true;
            genBtn.innerHTML = `<span class="spinner"></span> AI Crafting Schedule...`;
        }

        try {
            // Check if backend API is reachable for live AI plan
            let aiPlan = null;
            if (window.LearnMateBackend && window.LearnMateBackend.isAvailable) {
                try {
                    aiPlan = await window.LearnMateBackend.requestStudyPlan({
                        hours,
                        intensity,
                        targetDays,
                        candidates: candidates.slice(0, 6)
                    });
                } catch (e) {
                    console.log("Backend plan generation fallback to local generator:", e);
                }
            }

            if (!aiPlan) {
                // Local deterministic smart timetable generator
                aiPlan = this.buildLocalSchedule(hours, intensity, targetDays, candidates);
            }

            this.currentPlan = aiPlan;
            StorageManager.saveStudyPlan(this.currentPlan);
            this.render();

            if (window.App && window.App.showToast) {
                App.showToast("Personalized study timetable generated!", "success");
            }
        } finally {
            if (genBtn) {
                genBtn.disabled = false;
                genBtn.innerHTML = `✨ Regenerate AI Schedule`;
            }
        }
    },

    /**
     * Algorithmic local timetable builder
     */
    buildLocalSchedule(hours, intensity, targetDays, candidates) {
        // Calculate number of slots: e.g. 45m blocks + 10m breaks
        const slotMinutes = intensity === "exam" ? 50 : (intensity === "pomodoro" ? 25 : 45);
        const breakMinutes = intensity === "pomodoro" ? 5 : 10;
        const totalMinutes = hours * 60;
        const cycleTime = slotMinutes + breakMinutes;
        const totalSlots = Math.max(1, Math.floor(totalMinutes / cycleTime));

        // Start time e.g. 09:00 AM or 04:00 PM based on current time
        let startHour = 16; // 4:00 PM after school default
        let startMin = 0;

        const scheduleBlocks = [];
        const focusPool = candidates.length > 0 ? candidates : [
            { topic: "Calculus: Limits & Continuity", subject: "Mathematics", priority: "Medium", badgeColor: "info" },
            { topic: "Photosynthesis: Light & Dark Reactions", subject: "Biology", priority: "High (Critical Weakness)", badgeColor: "danger" },
            { topic: "Electromagnetism & Faraday's Law", subject: "Physics", priority: "High", badgeColor: "warning" }
        ];

        let focusIdx = 0;
        for (let i = 0; i < totalSlots; i++) {
            const currentFocus = focusPool[focusIdx % focusPool.length];
            focusIdx++;

            const endTotalMin = startHour * 60 + startMin + slotMinutes;
            const endHour = Math.floor(endTotalMin / 60);
            const endMin = endTotalMin % 60;

            const timeStr = `${this.formatTime(startHour, startMin)} - ${this.formatTime(endHour, endMin)}`;

            // Task types tailored to priority
            let taskType = "Theory Review & Concept Clarification";
            let objective = `Deconstruct core concepts of ${currentFocus.topic}. Write summary flashcards.`;
            let aiTip = "Use Feynman technique: Explain the idea in plain words as if teaching someone.";

            if (currentFocus.priority.includes("Critical")) {
                taskType = "Targeted Weakness Recovery & Drills";
                objective = `Rework past missed questions in ${currentFocus.topic}. Identify why previous choices were incorrect.`;
                aiTip = "Don't just re-read notes; practice active recall without consulting formulas.";
            } else if (i % 2 === 1) {
                taskType = "Active Problem Solving & Timed Practice";
                objective = `Solve 3-5 exam-style problems on ${currentFocus.topic} under standard conditions.`;
                aiTip = "Track solving time per problem and highlight stumbling points.";
            }

            scheduleBlocks.push({
                id: `block-${Date.now()}-${i}`,
                time: timeStr,
                durationMinutes: slotMinutes,
                topic: currentFocus.topic,
                subject: currentFocus.subject,
                priority: currentFocus.priority,
                badgeColor: currentFocus.badgeColor,
                taskType,
                objective,
                aiTip,
                completed: false
            });

            // Update start time adding study slot + break
            const nextStartTotal = endTotalMin + breakMinutes;
            startHour = Math.floor(nextStartTotal / 60);
            startMin = nextStartTotal % 60;
        }

        return {
            generatedAt: new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
            hoursAllocated: hours,
            intensity,
            targetDays,
            totalBlocks: scheduleBlocks.length,
            blocks: scheduleBlocks
        };
    },

    formatTime(hour24, minute) {
        const h = hour24 % 24;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const displayM = minute < 10 ? `0${minute}` : minute;
        return `${displayH}:${displayM} ${ampm}`;
    },

    /**
     * Toggle block completion status and award points
     */
    toggleBlock(blockId) {
        if (!this.currentPlan || !this.currentPlan.blocks) return;

        const block = this.currentPlan.blocks.find(b => b.id === blockId);
        if (!block) return;

        block.completed = !block.completed;
        StorageManager.saveStudyPlan(this.currentPlan);

        if (block.completed) {
            StorageManager.addPoints(25);
            const profile = StorageManager.getProfile();
            profile.weeklyStudyDoneHours = Number(((profile.weeklyStudyDoneHours || 0) + (block.durationMinutes / 60)).toFixed(1));
            StorageManager.saveProfile(profile);

            App.showToast(`Great job! +25 Points earned for completing session on ${block.topic}!`, "success");
        }

        this.render();
        App.updateDashboardMetrics();
    },

    /**
     * Exports current plan to clipboard or markdown download
     */
    exportPlan() {
        if (!this.currentPlan || !this.currentPlan.blocks) {
            App.showToast("No active plan to export.", "warning");
            return;
        }

        let text = `# LearnMate AI Study Plan (${this.currentPlan.generatedAt})\n`;
        text += `Hours: ${this.currentPlan.hoursAllocated} hrs | Mode: ${this.currentPlan.intensity}\n\n`;

        this.currentPlan.blocks.forEach((b, i) => {
            text += `### Block ${i + 1}: ${b.time} [${b.subject}]\n`;
            text += `- Topic: ${b.topic}\n`;
            text += `- Objective: ${b.objective}\n`;
            text += `- AI Strategy: ${b.aiTip}\n`;
            text += `- Status: ${b.completed ? "[X] Completed" : "[ ] Pending"}\n\n`;
        });

        // Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                App.showToast("Study plan copied to clipboard!", "success");
            }).catch(() => {
                this.downloadPlanFile(text);
            });
        } else {
            this.downloadPlanFile(text);
        }
    },

    downloadPlanFile(text) {
        const blob = new Blob([text], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `LearnMate-StudyPlan-${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        App.showToast("Study plan downloaded as Markdown!", "success");
    },

    /**
     * Renders the Study Plan view
     */
    render() {
        const container = document.getElementById("study-plan-view");
        if (!container) return;

        const plan = this.currentPlan;
        const candidates = this.gatherCandidateTopics();
        const completedCount = plan ? plan.blocks.filter(b => b.completed).length : 0;
        const totalCount = plan ? plan.blocks.length : 0;
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        let content = `
            <div class="view-header">
                <div>
                    <h2 class="view-title">Adaptive AI Study Plan & Timetable</h2>
                    <p class="view-subtitle">Intelligently schedules weak topics and syllabus deadlines into structured daily sessions.</p>
                </div>
                <div class="header-actions flex-wrap gap-2">
                    <button class="btn btn-outline" onclick="StudyPlanner.exportPlan()">
                        📋 Export / Copy
                    </button>
                    <button id="generate-plan-btn" class="btn btn-primary" onclick="StudyPlanner.generatePlan()">
                        ✨ Regenerate AI Schedule
                    </button>
                </div>
            </div>

            <!-- Controls Panel -->
            <div class="card mb-6">
                <div class="card-header">
                    <h3 class="card-title">Study Plan Customizer</h3>
                    <p class="card-subtitle">Set your availability and preferences to adapt your schedule.</p>
                </div>

                <div class="grid-3 gap-4">
                    <div class="form-group">
                        <label class="form-label" for="plan-hours-input">Daily Available Hours</label>
                        <select id="plan-hours-input" class="form-control" onchange="StudyPlanner.generatePlan()">
                            <option value="1.5" ${plan?.hoursAllocated == 1.5 ? "selected" : ""}>1.5 Hours (Quick Session)</option>
                            <option value="2.5" ${plan?.hoursAllocated == 2.5 ? "selected" : ""}>2.5 Hours (Standard)</option>
                            <option value="3.5" ${plan?.hoursAllocated == 3.5 || !plan ? "selected" : ""}>3.5 Hours (Recommended)</option>
                            <option value="5.0" ${plan?.hoursAllocated == 5.0 ? "selected" : ""}>5.0 Hours (Deep Dive)</option>
                            <option value="6.5" ${plan?.hoursAllocated == 6.5 ? "selected" : ""}>6.5 Hours (Intensive Sprint)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="plan-intensity-select">Focus Interval Mode</label>
                        <select id="plan-intensity-select" class="form-control" onchange="StudyPlanner.generatePlan()">
                            <option value="balanced" ${plan?.intensity === "balanced" || !plan ? "selected" : ""}>Balanced (45m study + 10m break)</option>
                            <option value="pomodoro" ${plan?.intensity === "pomodoro" ? "selected" : ""}>Pomodoro (25m study + 5m break)</option>
                            <option value="exam" ${plan?.intensity === "exam" ? "selected" : ""}>Exam Sprint (50m study + 10m review)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="plan-deadline-select">Target Exam / Deadline</label>
                        <select id="plan-deadline-select" class="form-control" onchange="StudyPlanner.generatePlan()">
                            <option value="7" ${plan?.targetDays == 7 ? "selected" : ""}>Next 7 Days (Crunch Time)</option>
                            <option value="14" ${plan?.targetDays == 14 || !plan ? "selected" : ""}>14 Days (Upcoming Midterms)</option>
                            <option value="30" ${plan?.targetDays == 30 ? "selected" : ""}>30 Days (Final Exams)</option>
                        </select>
                    </div>
                </div>

                <!-- Priority Feed Pill Preview -->
                <div class="topic-priority-feed mt-4">
                    <span class="label-tiny">Auto-Integrated Weaknesses & Unfinished Topics:</span>
                    <div class="chips-container mt-2">
                        ${candidates.slice(0, 5).map(c => `
                            <span class="chip chip-${c.badgeColor}">
                                <span class="chip-dot"></span>
                                ${c.topic} <span class="chip-meta">(${c.priority})</span>
                            </span>
                        `).join("")}
                        ${candidates.length > 5 ? `<span class="chip chip-muted">+${candidates.length - 5} more queued</span>` : ""}
                    </div>
                </div>
            </div>

            <!-- Daily Progress Summary -->
            <div class="card mb-6">
                <div class="flex-between flex-wrap gap-2 mb-2">
                    <div>
                        <span class="text-muted">Today's Schedule Progress:</span>
                        <strong>${completedCount} of ${totalCount} Sessions Completed</strong>
                    </div>
                    <span class="badge badge-primary">${progressPercent}% Completed</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill fill-primary" style="width: ${progressPercent}%"></div>
                </div>
            </div>

            <!-- Timetable Blocks -->
            <div class="timetable-container">
                ${plan && plan.blocks.length > 0 ? plan.blocks.map((block, idx) => `
                    <div class="timetable-block ${block.completed ? "block-completed" : ""}" id="${block.id}">
                        <div class="block-time-col">
                            <span class="block-time">${block.time}</span>
                            <span class="block-duration">${block.durationMinutes} mins</span>
                            <label class="block-check-label">
                                <input type="checkbox" class="custom-checkbox" 
                                    ${block.completed ? "checked" : ""} 
                                    onchange="StudyPlanner.toggleBlock('${block.id}')"
                                />
                                <span>${block.completed ? "Done ✅" : "Complete"}</span>
                            </label>
                        </div>

                        <div class="block-content-col">
                            <div class="block-header">
                                <div class="flex-center gap-2">
                                    <span class="subject-tag">${block.subject}</span>
                                    <span class="badge badge-${block.badgeColor}">${block.priority}</span>
                                </div>
                                <span class="block-task-badge">${block.taskType}</span>
                            </div>

                            <h4 class="block-topic">${block.topic}</h4>
                            <p class="block-objective">🎯 <strong>Objective:</strong> ${block.objective}</p>

                            <div class="block-ai-tip">
                                <span class="tip-icon">💡</span>
                                <span class="tip-text"><strong>AI Study Strategy:</strong> ${block.aiTip}</span>
                            </div>

                            <div class="block-actions mt-3">
                                <button class="btn btn-xs btn-outline" onclick="App.askTutorAboutTopic('${escapeHtml(block.topic)}')">
                                    🤖 Tutor Assist
                                </button>
                                <button class="btn btn-xs btn-primary" onclick="App.practiceTopic('${escapeHtml(block.topic)}')">
                                    🎯 Practice Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                `).join("") : `
                    <div class="card empty-state">
                        <div class="empty-icon">📅</div>
                        <h3>No Timetable Generated</h3>
                        <p>Click Generate Schedule above to create your personalized study plan.</p>
                    </div>
                `}
            </div>
        `;

        container.innerHTML = content;
    }
};

