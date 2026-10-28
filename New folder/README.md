# 🎓 LearnMate AI - Adaptive Student Learning Platform

LearnMate AI is a modern, responsive, all-in-one student learning dashboard designed to help learners identify weak topics, generate personalized daily study plans, test their knowledge with gamified quizzes, earn rewards, and receive instant explanations from an AI tutor.

---

## 🌟 Key Features

1. **🎯 Weakness Detector**
   - Automatically analyzes quiz answers and score trends across subjects and topics.
   - Categorizes mastery levels into *Critical Weakness* (< 50%), *Needs Practice* (50% - 74%), and *Strong Concept* (≥ 75%).
   - Displays missed questions and actionable study advice.
   - 1-click actions: Launch targeted drills, queue into study plan, or consult the AI tutor.

2. **📅 Adaptive AI Study Plan & Timetable**
   - Generates personalized daily study schedules based on your available hours (1.5 - 6.5 hrs), focus modes (Pomodoro, Balanced, Exam sprint), and target deadlines.
   - Intelligently prioritizes identified weak topics and unfinished syllabus items.
   - Interactive completion tracking with +25 XP rewards per completed study session.
   - 1-click Markdown export / clipboard copy.

3. **⚡ Interactive Quizzes & Gamification Store**
   - Academic quizzes across **Mathematics, Physics, Biology, and Computer Science**.
   - Custom single-topic drills and targeted weakness drills.
   - Real-time countdown timer, immediate answer explanations, and score breakdowns.
   - **Rewards & Coupon Wallet**: Earn XP coins (+15-50 XP per quiz) and redeem them for demo vouchers (e.g. Free Campus Pizza, Gaming Passes, Bookstore Discounts) with unique promo codes.

4. **🤖 AI Student Tutor**
   - Student-friendly interactive chat assistant tailored for clear conceptual explanations.
   - Style presets: *Intuitive & Conceptual*, *Explain Like I'm 10*, *Step-by-Step Breakdown*, and *Exam Strategy*.
   - Quick prompt chips for fast questioning.
   - Dual-mode operation:
     - **Live AI Mode**: Securely connects through the backend using `.env` API keys (Google Gemini or OpenAI).
     - **Demo Mode**: Built-in, zero-dependency educational knowledge engine with full offline support.

5. **📚 Syllabus Completion Tracker**
   - Add, edit, and organize subjects and topics with difficulty ratings and estimated hours.
   - 1-click status cycling: *Pending* ⭕ &rarr; *In Progress* 🔄 &rarr; *Completed* ✅.
   - Visual progress bars for overall curriculum and per-subject breakdown.
   - Direct *"Sync Unfinished to Study Plan"* button to schedule pending work.

6. **🎨 Modern & Responsive Design**
   - Clean dark and light mode toggle.
   - Responsive sidebar with mobile drawer navigation.
   - LocalStorage persistence: all student progress, points, quizzes, and syllabus updates persist across page reloads.
   - Preloaded sample data for immediate testing.

---

## 🚀 How to Run Locally

You can run LearnMate AI in any of the following simple ways:

### Option 1: Direct Browser Launch (Simplest - Zero Install)
1. Navigate to the project directory: `c:\Users\lenovo\OneDrive\Desktop\New folder`
2. Double-click `index.html` or open it in Google Chrome / Microsoft Edge.
3. Everything (quizzes, weakness detection, timetable, rewards, and AI tutor in Demo Mode) works immediately out-of-the-box!

### Option 2: Native Windows PowerShell Server
If you prefer running a local HTTP server on Windows without installing any third-party runtimes:
1. Open PowerShell in this folder.
2. Run:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\server.ps1
   ```
3. Open `http://localhost:3000` in your browser.

### Option 3: Node.js Backend (For Live AI Integration)
If you have Node.js installed and wish to connect a live Gemini API key:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   PORT=3000
   ```
3. Start the server (zero external dependencies required):
   ```bash
   node server.js
   ```
4. Open `http://localhost:3000` in your browser. The AI Tutor badge will display **🟢 Live AI Connected**.

---

## 📁 Project Structure

```
├── index.html           # Main HTML5 application shell & view routing
├── README.md            # Project documentation and local setup guide
├── .env.example         # Example configuration for secure backend API keys
├── server.js            # Zero-dependency Node.js HTTP server & Gemini proxy
├── server.ps1           # Zero-dependency Windows PowerShell HTTP server
├── package.json         # Optional package manifest for npm start
├── css/
│   └── styles.css       # Complete design system, responsive styles & themes
└── js/
    ├── data.js          # Preloaded sample syllabus, questions, and rewards
    ├── storage.js       # LocalStorage persistence manager
    ├── weakness.js      # Knowledge gap & weakness detector engine
    ├── studyplan.js     # Adaptive daily study timetable generator
    ├── quiz.js          # Interactive quiz engine & instant feedback
    ├── syllabus.js      # Curriculum progress tracker with CRUD
    ├── rewards.js       # XP point redemption & coupon wallet
    ├── chat.js          # AI Student Tutor engine (Live & Demo mode)
    └── app.js           # Main controller, navigation & dashboard analytics
```

---

## 🛡️ Security & Privacy
- **No API keys in client code**: Any external AI keys are kept strictly inside the backend `.env` file and never sent or exposed to the client browser.
- **Client-Side Persistence**: Student progress is stored safely in your browser's `localStorage`. You can reset the demo state at any time via the *"Reset Demo Data"* button in the sidebar.

