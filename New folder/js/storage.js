/**
 * LearnMate AI - LocalStorage State Management
 * Encapsulates all read/write persistence for student data, syllabus, quizzes, and plans.
 */

const STORAGE_KEYS = {
    PROFILE: "learnmate_profile_v1",
    SYLLABUS: "learnmate_syllabus_v1",
    QUIZ_HISTORY: "learnmate_quiz_history_v1",
    STUDY_PLAN: "learnmate_study_plan_v1",
    CHAT_HISTORY: "learnmate_chat_history_v1",
    THEME: "learnmate_theme_v1"
};

const StorageManager = {
    // Student Profile & Stats
    getProfile() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
            if (!raw) {
                this.saveProfile(DEFAULT_PROFILE);
                return { ...DEFAULT_PROFILE };
            }
            return JSON.parse(raw);
        } catch (err) {
            console.error("Error reading profile from localStorage:", err);
            return { ...DEFAULT_PROFILE };
        }
    },

    saveProfile(profile) {
        try {
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
        } catch (err) {
            console.error("Error saving profile to localStorage:", err);
        }
    },

    addPoints(pointsToAdd) {
        const profile = this.getProfile();
        profile.points = (profile.points || 0) + pointsToAdd;
        this.saveProfile(profile);
        return profile.points;
    },

    deductPoints(pointsToDeduct) {
        const profile = this.getProfile();
        if ((profile.points || 0) < pointsToDeduct) {
            return false;
        }
        profile.points -= pointsToDeduct;
        this.saveProfile(profile);
        return true;
    },

    // Syllabus Management
    getSyllabus() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.SYLLABUS);
            if (!raw) {
                this.saveSyllabus(DEFAULT_SYLLABUS);
                return [...DEFAULT_SYLLABUS];
            }
            return JSON.parse(raw);
        } catch (err) {
            console.error("Error reading syllabus:", err);
            return [...DEFAULT_SYLLABUS];
        }
    },

    saveSyllabus(syllabus) {
        try {
            localStorage.setItem(STORAGE_KEYS.SYLLABUS, JSON.stringify(syllabus));
        } catch (err) {
            console.error("Error saving syllabus:", err);
        }
    },

    addSyllabusTopic(topicItem) {
        const syllabus = this.getSyllabus();
        syllabus.push(topicItem);
        this.saveSyllabus(syllabus);
        return syllabus;
    },

    updateSyllabusTopic(id, updates) {
        const syllabus = this.getSyllabus();
        const index = syllabus.findIndex(item => item.id === id);
        if (index !== -1) {
            syllabus[index] = { ...syllabus[index], ...updates };
            this.saveSyllabus(syllabus);
            return syllabus[index];
        }
        return null;
    },

    deleteSyllabusTopic(id) {
        let syllabus = this.getSyllabus();
        syllabus = syllabus.filter(item => item.id !== id);
        this.saveSyllabus(syllabus);
        return syllabus;
    },

    // Quiz History
    getQuizHistory() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY);
            if (!raw) {
                this.saveQuizHistory(INITIAL_QUIZ_HISTORY);
                return [...INITIAL_QUIZ_HISTORY];
            }
            return JSON.parse(raw);
        } catch (err) {
            console.error("Error reading quiz history:", err);
            return [...INITIAL_QUIZ_HISTORY];
        }
    },

    saveQuizHistory(history) {
        try {
            localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(history));
        } catch (err) {
            console.error("Error saving quiz history:", err);
        }
    },

    logQuizAttempt(attemptRecord) {
        const history = this.getQuizHistory();
        history.unshift(attemptRecord);
        this.saveQuizHistory(history);

        // Also update profile quiz metrics
        const profile = this.getProfile();
        profile.totalQuizzesTaken = (profile.totalQuizzesTaken || 0) + 1;
        profile.totalQuestionsAnswered = (profile.totalQuestionsAnswered || 0) + attemptRecord.totalQuestions;
        profile.correctAnswers = (profile.correctAnswers || 0) + attemptRecord.score;
        this.saveProfile(profile);

        return history;
    },

    // Study Plan
    getStudyPlan() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.STUDY_PLAN);
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            console.error("Error reading study plan:", err);
            return null;
        }
    },

    saveStudyPlan(plan) {
        try {
            localStorage.setItem(STORAGE_KEYS.STUDY_PLAN, JSON.stringify(plan));
        } catch (err) {
            console.error("Error saving study plan:", err);
        }
    },

    // Chat History
    getChatHistory() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
            return raw ? JSON.parse(raw) : [];
        } catch (err) {
            console.error("Error reading chat history:", err);
            return [];
        }
    },

    saveChatHistory(messages) {
        try {
            localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
        } catch (err) {
            console.error("Error saving chat history:", err);
        }
    },

    clearChatHistory() {
        localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    },

    // Theme (Light / Dark)
    getTheme() {
        return localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
    },

    saveTheme(theme) {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    },

    // Reset All Data (for testing or fresh start)
    resetAllData() {
        localStorage.removeItem(STORAGE_KEYS.PROFILE);
        localStorage.removeItem(STORAGE_KEYS.SYLLABUS);
        localStorage.removeItem(STORAGE_KEYS.QUIZ_HISTORY);
        localStorage.removeItem(STORAGE_KEYS.STUDY_PLAN);
        localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
        return {
            profile: this.getProfile(),
            syllabus: this.getSyllabus(),
            history: this.getQuizHistory()
        };
    }
};

