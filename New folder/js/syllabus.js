/**
 * LearnMate AI - Syllabus Completion Tracker
 * Tracks academic curriculum topics, progress percentages, status updates,
 * and directly pipes unfinished topics into the AI study plan timetable.
 */

const SyllabusTracker = {
    selectedSubject: "all",
    searchQuery: "",

    /**
     * Renders the complete Syllabus Tracker view
     */
    render() {
        const container = document.getElementById("syllabus-view");
        if (!container) return;

        const syllabus = StorageManager.getSyllabus();
        const subjects = ["all", ...new Set(syllabus.map(s => s.subject))];

        // Filter topics by subject and search
        let filtered = syllabus;
        if (this.selectedSubject !== "all") {
            filtered = filtered.filter(s => s.subject.toLowerCase() === this.selectedSubject.toLowerCase());
        }
        if (this.searchQuery.trim()) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(s => s.topic.toLowerCase().includes(q) || s.notes?.toLowerCase().includes(q));
        }

        // Stats calculation
        const totalTopics = syllabus.length;
        const completedTopics = syllabus.filter(s => s.status === "completed").length;
        const inProgressTopics = syllabus.filter(s => s.status === "in-progress").length;
        const pendingTopics = syllabus.filter(s => s.status === "pending").length;
        const overallPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

        // Subject Breakdown calculation
        const subjectStats = {};
        syllabus.forEach(s => {
            if (!subjectStats[s.subject]) {
                subjectStats[s.subject] = { total: 0, completed: 0 };
            }
            subjectStats[s.subject].total += 1;
            if (s.status === "completed") {
                subjectStats[s.subject].completed += 1;
            }
        });

        let content = `
            <div class="view-header">
                <div>
                    <h2 class="view-title">Syllabus Completion Tracker</h2>
                    <p class="view-subtitle">Monitor your academic journey, update topic statuses, and sync pending tasks into your schedule.</p>
                </div>
                <div class="header-actions flex-wrap gap-2">
                    <button class="btn btn-secondary" onclick="SyllabusTracker.syncToStudyPlan()">
                        📅 Sync Unfinished to Study Plan
                    </button>
                    <button class="btn btn-primary" onclick="SyllabusTracker.openAddTopicModal()">
                        + Add New Topic
                    </button>
                </div>
            </div>

            <!-- Top Progress Hero Card -->
            <div class="card mb-6">
                <div class="flex-between flex-wrap gap-4 mb-4">
                    <div>
                        <span class="text-muted">Total Curriculum Progress</span>
                        <h3 class="progress-hero-title">${overallPercent}% Finished (${completedTopics}/${totalTopics} Topics)</h3>
                    </div>
                    <div class="syllabus-status-counts flex-center gap-3">
                        <span class="badge badge-success">${completedTopics} Completed</span>
                        <span class="badge badge-warning">${inProgressTopics} In Progress</span>
                        <span class="badge badge-secondary">${pendingTopics} Pending</span>
                    </div>
                </div>

                <div class="progress-bar-bg mb-4">
                    <div class="progress-bar-fill fill-success" style="width: ${overallPercent}%"></div>
                </div>

                <!-- Per-Subject Mini Bars -->
                <div class="subject-mini-bars grid-4 gap-4 mt-4">
                    ${Object.entries(subjectStats).map(([subj, stat]) => {
                        const pct = Math.round((stat.completed / stat.total) * 100);
                        return `
                            <div class="subject-mini-item">
                                <div class="flex-between mb-1">
                                    <span class="subject-mini-name">${subj}</span>
                                    <span class="subject-mini-pct">${pct}%</span>
                                </div>
                                <div class="progress-bar-bg progress-bar-xs">
                                    <div class="progress-bar-fill fill-primary" style="width: ${pct}%"></div>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>

            <!-- Filter and Search Row -->
            <div class="syllabus-controls-bar flex-between flex-wrap gap-3 mb-4">
                <div class="subject-filter-tabs">
                    ${subjects.map(s => `
                        <button class="filter-tab ${this.selectedSubject.toLowerCase() === s.toLowerCase() ? 'active' : ''}" 
                            onclick="SyllabusTracker.filterSubject('${s}')">
                            ${s === 'all' ? 'All Subjects' : s}
                        </button>
                    `).join("")}
                </div>

                <div class="search-input-wrap">
                    <span class="search-icon">🔍</span>
                    <input type="text" class="form-control form-control-sm" 
                        placeholder="Search topics or notes..." 
                        value="${escapeHtml(this.searchQuery)}"
                        oninput="SyllabusTracker.handleSearch(this.value)"
                    />
                </div>
            </div>

            <!-- Topics List Table / Cards -->
            <div class="card">
                ${filtered.length > 0 ? `
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th style="width: 40px;">Status</th>
                                    <th>Topic & Notes</th>
                                    <th>Subject</th>
                                    <th>Est. Hours</th>
                                    <th>Difficulty</th>
                                    <th style="width: 140px; text-align: right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.map(item => `
                                    <tr class="topic-row ${item.status === 'completed' ? 'row-completed' : ''}">
                                        <td>
                                            <button class="status-toggle-btn status-${item.status}" 
                                                title="Click to toggle status: Pending -> In Progress -> Completed"
                                                onclick="SyllabusTracker.cycleStatus('${item.id}')">
                                                ${item.status === 'completed' ? '✅' : (item.status === 'in-progress' ? '🔄' : '⭕')}
                                            </button>
                                        </td>
                                        <td>
                                            <div class="topic-name-wrap">
                                                <strong class="topic-name-text">${escapeHtml(item.topic)}</strong>
                                                ${item.notes ? `<p class="topic-notes-text">${escapeHtml(item.notes)}</p>` : ''}
                                            </div>
                                        </td>
                                        <td>
                                            <span class="subject-tag">${item.subject}</span>
                                        </td>
                                        <td>${item.estimatedHours} hrs</td>
                                        <td>
                                            <span class="badge badge-${item.difficulty === 'Hard' ? 'danger' : (item.difficulty === 'Medium' ? 'warning' : 'success')}">
                                                ${item.difficulty}
                                            </span>
                                        </td>
                                        <td style="text-align: right;">
                                            <div class="table-actions flex-end gap-1">
                                                <button class="btn btn-xs btn-outline" title="Practice in Quiz" onclick="App.practiceTopic('${escapeHtml(item.topic)}')">
                                                    🎯
                                                </button>
                                                <button class="btn btn-xs btn-outline" title="Ask AI Tutor" onclick="App.askTutorAboutTopic('${escapeHtml(item.topic)}')">
                                                    🤖
                                                </button>
                                                <button class="btn btn-xs btn-outline" title="Edit Topic" onclick="SyllabusTracker.openEditTopicModal('${item.id}')">
                                                    ✏️
                                                </button>
                                                <button class="btn btn-xs btn-danger-outline" title="Delete Topic" onclick="SyllabusTracker.confirmDelete('${item.id}')">
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                ` : `
                    <div class="empty-state p-6">
                        <div class="empty-icon">📚</div>
                        <h3>No Topics Found</h3>
                        <p>No topics match your current filters. Add a new topic or clear search.</p>
                        <button class="btn btn-primary mt-3" onclick="SyllabusTracker.openAddTopicModal()">+ Add New Topic</button>
                    </div>
                `}
            </div>
        `;

        container.innerHTML = content;
    },

    filterSubject(subject) {
        this.selectedSubject = subject;
        this.render();
    },

    handleSearch(val) {
        this.searchQuery = val;
        this.render();
    },

    /**
     * Cycle status: pending -> in-progress -> completed -> pending
     */
    cycleStatus(id) {
        const syllabus = StorageManager.getSyllabus();
        const item = syllabus.find(s => s.id === id);
        if (!item) return;

        let nextStatus = "in-progress";
        if (item.status === "in-progress") nextStatus = "completed";
        else if (item.status === "completed") nextStatus = "pending";

        StorageManager.updateSyllabusTopic(id, { status: nextStatus });

        if (nextStatus === "completed") {
            StorageManager.addPoints(30);
            if (window.FXEngine) FXEngine.playSuccessSound();
            App.showToast(`Topic completed! +30 Aura XP — you're built different 💪`, "success");
        } else {
            App.showToast(`Topic status marked as ${nextStatus.replace('-', ' ')}.`, "info");
        }

        this.render();
        App.updateDashboardMetrics();
    },

    /**
     * Pipe pending topics into study plan and switch tab
     */
    syncToStudyPlan() {
        const syllabus = StorageManager.getSyllabus();
        const unfinished = syllabus.filter(s => s.status !== "completed");

        if (unfinished.length === 0) {
            App.showToast("Congratulations! All syllabus topics are completed!", "success");
            return;
        }

        // Trigger regeneration in Study Planner
        StudyPlanner.generatePlan();
        App.navigateTo("study-plan");
        App.showToast(`${unfinished.length} unfinished syllabus topics synced into your study schedule!`, "success");
    },

    openAddTopicModal() {
        const syllabus = StorageManager.getSyllabus();
        const existingSubjects = [...new Set(syllabus.map(s => s.subject))];

        const modalHtml = `
            <div class="modal-overlay" id="topic-modal" onclick="SyllabusTracker.closeModalOnOverlay(event)">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3 class="modal-title">+ Add Syllabus Topic</h3>
                        <button class="modal-close" onclick="SyllabusTracker.closeModal()">&times;</button>
                    </div>
                    <form id="add-topic-form" onsubmit="SyllabusTracker.handleAddTopicSubmit(event)">
                        <div class="modal-body">
                            <div class="form-group mb-3">
                                <label class="form-label" for="new-topic-subject">Subject *</label>
                                <input type="text" id="new-topic-subject" class="form-control" list="subject-suggestions" required placeholder="e.g. Mathematics, Physics..." />
                                <datalist id="subject-suggestions">
                                    ${existingSubjects.map(s => `<option value="${s}">`).join("")}
                                </datalist>
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="new-topic-name">Topic Name *</label>
                                <input type="text" id="new-topic-name" class="form-control" required placeholder="e.g. Organic Chemistry Reactions" />
                            </div>

                            <div class="grid-2 gap-3 mb-3">
                                <div class="form-group">
                                    <label class="form-label" for="new-topic-hours">Estimated Hours</label>
                                    <input type="number" id="new-topic-hours" class="form-control" min="0.5" max="50" step="0.5" value="3" required />
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="new-topic-difficulty">Difficulty</label>
                                    <select id="new-topic-difficulty" class="form-control">
                                        <option value="Easy">Easy</option>
                                        <option value="Medium" selected>Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="new-topic-status">Current Status</label>
                                <select id="new-topic-status" class="form-control">
                                    <option value="pending" selected>Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="new-topic-notes">Notes / Focus Concepts</label>
                                <textarea id="new-topic-notes" class="form-control" rows="2" placeholder="Key formulas or areas to remember..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="SyllabusTracker.closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Topic</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById("modal-container").innerHTML = modalHtml;
    },

    handleAddTopicSubmit(e) {
        e.preventDefault();
        const subject = document.getElementById("new-topic-subject").value.trim();
        const topic = document.getElementById("new-topic-name").value.trim();
        const hours = parseFloat(document.getElementById("new-topic-hours").value) || 3;
        const difficulty = document.getElementById("new-topic-difficulty").value;
        const status = document.getElementById("new-topic-status").value;
        const notes = document.getElementById("new-topic-notes").value.trim();

        if (!subject || !topic) {
            App.showToast("Please provide both Subject and Topic name.", "danger");
            return;
        }

        const newTopic = {
            id: `syl-${Date.now()}`,
            subject,
            topic,
            estimatedHours: hours,
            difficulty,
            status,
            notes
        };

        StorageManager.addSyllabusTopic(newTopic);
        this.closeModal();
        this.render();
        App.updateDashboardMetrics();
        App.showToast(`Added "${topic}" to syllabus!`, "success");
    },

    openEditTopicModal(id) {
        const syllabus = StorageManager.getSyllabus();
        const item = syllabus.find(s => s.id === id);
        if (!item) return;

        const modalHtml = `
            <div class="modal-overlay" id="topic-modal" onclick="SyllabusTracker.closeModalOnOverlay(event)">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3 class="modal-title">Edit Syllabus Topic</h3>
                        <button class="modal-close" onclick="SyllabusTracker.closeModal()">&times;</button>
                    </div>
                    <form onsubmit="SyllabusTracker.handleEditTopicSubmit(event, '${id}')">
                        <div class="modal-body">
                            <div class="form-group mb-3">
                                <label class="form-label" for="edit-topic-subject">Subject</label>
                                <input type="text" id="edit-topic-subject" class="form-control" value="${escapeHtml(item.subject)}" required />
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="edit-topic-name">Topic Name</label>
                                <input type="text" id="edit-topic-name" class="form-control" value="${escapeHtml(item.topic)}" required />
                            </div>

                            <div class="grid-2 gap-3 mb-3">
                                <div class="form-group">
                                    <label class="form-label" for="edit-topic-hours">Estimated Hours</label>
                                    <input type="number" id="edit-topic-hours" class="form-control" min="0.5" max="50" step="0.5" value="${item.estimatedHours}" required />
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="edit-topic-difficulty">Difficulty</label>
                                    <select id="edit-topic-difficulty" class="form-control">
                                        <option value="Easy" ${item.difficulty === 'Easy' ? 'selected' : ''}>Easy</option>
                                        <option value="Medium" ${item.difficulty === 'Medium' ? 'selected' : ''}>Medium</option>
                                        <option value="Hard" ${item.difficulty === 'Hard' ? 'selected' : ''}>Hard</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="edit-topic-status">Status</label>
                                <select id="edit-topic-status" class="form-control">
                                    <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="in-progress" ${item.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>Completed</option>
                                </select>
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="edit-topic-notes">Notes / Focus Concepts</label>
                                <textarea id="edit-topic-notes" class="form-control" rows="2">${escapeHtml(item.notes || '')}</textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="SyllabusTracker.closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Update Topic</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById("modal-container").innerHTML = modalHtml;
    },

    handleEditTopicSubmit(e, id) {
        e.preventDefault();
        const subject = document.getElementById("edit-topic-subject").value.trim();
        const topic = document.getElementById("edit-topic-name").value.trim();
        const hours = parseFloat(document.getElementById("edit-topic-hours").value) || 3;
        const difficulty = document.getElementById("edit-topic-difficulty").value;
        const status = document.getElementById("edit-topic-status").value;
        const notes = document.getElementById("edit-topic-notes").value.trim();

        StorageManager.updateSyllabusTopic(id, {
            subject,
            topic,
            estimatedHours: hours,
            difficulty,
            status,
            notes
        });

        this.closeModal();
        this.render();
        App.updateDashboardMetrics();
        App.showToast(`Updated "${topic}"`, "success");
    },

    confirmDelete(id) {
        const syllabus = StorageManager.getSyllabus();
        const item = syllabus.find(s => s.id === id);
        if (!item) return;

        if (confirm(`Are you sure you want to delete topic "${item.topic}"?`)) {
            StorageManager.deleteSyllabusTopic(id);
            this.render();
            App.updateDashboardMetrics();
            App.showToast(`Topic deleted.`, "info");
        }
    },

    closeModal() {
        const modal = document.getElementById("topic-modal");
        if (modal) modal.remove();
    },

    closeModalOnOverlay(e) {
        if (e.target.id === "topic-modal") {
            this.closeModal();
        }
    }
};

