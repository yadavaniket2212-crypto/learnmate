/**
 * LearnMate AI - AI Student Tutor Chat Engine
 * Student-friendly conversational tutor explaining complex STEM & humanities concepts simply.
 * Safely communicates with secure backend API (/api/chat) or operates in high-fidelity Demo Mode.
 */

const AIChat = {
    messages: [],
    isTyping: false,
    backendStatus: "checking", // 'live' | 'demo'

    init() {
        this.messages = StorageManager.getChatHistory();
        if (this.messages.length === 0) {
            this.messages = [
                {
                    id: "msg-welcome",
                    sender: "ai",
                    text: "Hi Alex! 👋 I'm your LearnMate AI Tutor. What concept would you like to explore or clarify today? You can ask me to explain any topic from your syllabus, break down tough homework problems, or test you with quick quiz questions!",
                    time: "Just now",
                    mode: "tutor"
                }
            ];
            StorageManager.saveChatHistory(this.messages);
        }

        // Check backend availability
        this.detectBackend();
    },

    async detectBackend() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            const res = await fetch("/api/health", { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                this.backendStatus = data.hasApiKey ? "live" : "demo";
            } else {
                this.backendStatus = "demo";
            }
        } catch (e) {
            this.backendStatus = "demo";
        }
        this.updateStatusBadge();
    },

    updateStatusBadge() {
        const badge = document.getElementById("ai-status-indicator");
        if (!badge) return;

        if (this.backendStatus === "live") {
            badge.className = "ai-mode-badge badge-live";
            badge.innerHTML = `<span class="badge-dot dot-live"></span> Live AI Connected (Gemini/OpenAI)`;
        } else {
            badge.className = "ai-mode-badge badge-demo";
            badge.innerHTML = `<span class="badge-dot dot-demo"></span> Demo Tutor Mode (Self-Contained AI)`;
        }
    },

    /**
     * Send user message
     */
    async sendMessage(customText = null) {
        if (this.isTyping) return;

        const input = document.getElementById("chat-user-input");
        const text = customText || (input ? input.value.trim() : "");
        if (!text) return;

        if (input) input.value = "";

        const styleSelect = document.getElementById("chat-style-select");
        const style = styleSelect ? styleSelect.value : "simple";

        // Append user message
        const userMsg = {
            id: `msg-${Date.now()}`,
            sender: "user",
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            style
        };

        this.messages.push(userMsg);
        StorageManager.saveChatHistory(this.messages);
        this.renderMessages();

        // Trigger AI response
        this.isTyping = true;
        this.renderTypingIndicator();

        try {
            let aiText = null;

            // Try backend API if reachable
            if (this.backendStatus === "live") {
                try {
                    const res = await fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            message: text,
                            style,
                            history: this.messages.slice(-6)
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        aiText = data.reply;
                    }
                } catch (e) {
                    console.log("Live backend call failed, falling back to smart local tutor:", e);
                }
            }

            // Fallback: Smart Pedagogical Tutor Simulator
            if (!aiText) {
                await new Promise(r => setTimeout(r, 650)); // Realistic thinking latency
                aiText = this.generateSmartTutorResponse(text, style);
            }

            const aiMsg = {
                id: `msg-${Date.now()}`,
                sender: "ai",
                text: aiText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                style
            };

            this.messages.push(aiMsg);
            StorageManager.saveChatHistory(this.messages);
        } catch (err) {
            console.error("Chat error:", err);
            this.messages.push({
                id: `msg-${Date.now()}`,
                sender: "ai",
                text: "I ran into a hiccup answering that question, but here is a quick tip: Try breaking down the problem into smaller parts or check your syllabus notes!",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        } finally {
            this.isTyping = false;
            this.renderMessages();
        }
    },

    /**
     * Smart, high-quality educational knowledge engine
     */
    generateSmartTutorResponse(query, style) {
        const q = query.toLowerCase();

        // 1. Photosynthesis & Calvin cycle
        if (q.includes("photo") || q.includes("calvin") || q.includes("chloroplast") || q.includes("leaf") || q.includes("plant")) {
            if (style === "eli10") {
                return `🌿 **Photosynthesis Explained Like You're 10!**\n\nThink of a plant leaf as a tiny solar-powered cookie bakery:\n\n1. **The Solar Panels:** Chlorophyll pigments inside chloroplasts catch sunlight beams like solar panels.\n2. **The Ingredients:** The plant drinks water ($H_2O$) from soil through its roots, and breathes in carbon dioxide ($CO_2$) from the air through microscopic mouth holes called stomata.\n3. **The Kitchen:** In the *Thylakoid* kitchen, sunlight splits water molecules, producing oxygen (which we breathe!) and charging up little molecular batteries (ATP & NADPH).\n4. **The Sugar Bakery (Calvin Cycle):** In the *Stroma*, enzyme **RuBisCO** mixes $CO_2$ and energy to bake sweet glucose sugar ($C_6H_{12}O_6$) for plant growth!\n\n💡 **Memory Trick:** "Sun + Water + Air = Plant Sugar & Fresh Air!"`;
            } else if (style === "steps") {
                return `🔬 **Step-by-Step Breakdown: Photosynthesis**\n\nPhotosynthesis occurs in two distinct, coordinated stages within chloroplasts:\n\n**Stage 1: Light-Dependent Reactions (Thylakoid Membranes)**\n- Photons excite electrons in Photosystem II (PSII).\n- Water photolysis: $2H_2O \\rightarrow 4H^+ + 4e^- + O_2$ (replenishing electrons).\n- Electron transport chain creates a proton gradient across the thylakoid lumen.\n- ATP Synthase synthesizes **ATP**, while NADP+ reductase generates **NADPH**.\n\n**Stage 2: Light-Independent Reactions / Calvin Cycle (Stroma)**\n- **Step 1 (Fixation):** $CO_2$ combines with RuBP catalyzed by **RuBisCO** to make 3-PGA.\n- **Step 2 (Reduction):** ATP and NADPH convert 3-PGA into G3P (triose phosphate).\n- **Step 3 (Regeneration):** 5 out of 6 G3P molecules regenerate RuBP so the cycle continues!\n\nWould you like a 1-question check to test your retention?`;
            } else {
                return `🌱 **Photosynthesis Overview**\n\nPhotosynthesis converts radiant solar energy into chemical bond energy:\n$$\\text{6CO}_2 + \\text{6H}_2\\text{O} + \\text{Light} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + \\text{6O}_2$$\n\n- **Light Reactions:** Happen in thylakoids; produce ATP, NADPH, and release $O_2$.\n- **Calvin Cycle:** Happens in stroma; fixes carbon into glucose using the enzyme RuBisCO.\n\nSince this was identified in your **Weakness Detector**, try quizzing yourself on the difference between the Stroma and Thylakoid membrane!`;
            }
        }

        // 2. Physics: Newton's Laws, Faraday, Induction
        if (q.includes("newton") || q.includes("force") || q.includes("motion") || q.includes("faraday") || q.includes("electromagnet") || q.includes("lenz")) {
            if (q.includes("faraday") || q.includes("induction") || q.includes("flux") || q.includes("lenz")) {
                return `⚡ **Electromagnetic Induction Demystified**\n\n- **Faraday's Law of Induction:** Whenever the magnetic flux ($\\Phi_B$) cutting through a conductor loop changes over time, an Electromotive Force (EMF) is induced:\n  $$\\mathcal{E} = -N \\frac{d\\Phi_B}{dt}$$\n- **Lenz's Law (The Negative Sign):** Nature resists sudden changes! The induced current will always flow in a direction that creates a magnetic field **opposing** the change that caused it.\n\n🚗 **Real-World Example:** This is exactly how regenerative brakes in electric vehicles work—turning kinetic motion into battery charge by resisting wheel motion with magnetic fields!`;
            }
            return `🚀 **Newton's Laws of Motion Made Simple**\n\n1. **1st Law (Inertia):** An object keeps doing whatever it was doing (staying still or gliding in a straight line) unless an external net force pushes it.\n2. **2nd Law ($F = ma$):** Acceleration is proportional to force and inversely proportional to mass. Pushing an empty shopping cart is easy; pushing one loaded with 50 bricks takes way more force!\n3. **3rd Law (Action-Reaction):** For every action, there is an equal and opposite reaction. When you push water backward while swimming, the water pushes your body forward!`;
        }

        // 3. Mathematics: Quadratic, Calculus, Limits
        if (q.includes("calculus") || q.includes("limit") || q.includes("derivative") || q.includes("quadratic") || q.includes("parabola") || q.includes("trig")) {
            if (q.includes("quadratic") || q.includes("parabola")) {
                return `📐 **Mastering Quadratic Equations: $ax^2 + bx + c = 0$**\n\n- **The Quadratic Formula:**\n  $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n- **The Discriminant ($D = b^2 - 4ac$) Secret Key:**\n  - If $D > 0$: 2 distinct real roots (parabola crosses x-axis twice).\n  - If $D = 0$: Exactly 1 real root (vertex touches x-axis).\n  - If $D < 0$: No real roots (parabola hovers above or below x-axis; complex roots).\n\n💡 **Pro Tip:** The vertex is always at $x = -b / (2a)$!`;
            }
            return `📈 **Calculus: Limits & Continuity Intuition**\n\nA limit describes where a function is *heading*, not necessarily where it lands!\n\nImagine walking toward your friend across a room:\n- Even if someone places a cardboard box on the exact tile where your friend stands, both of your walking paths are clearly aiming at the exact same location.\n- For a function to be **continuous** at $x = c$:\n  1. $f(c)$ must exist (no missing hole).\n  2. $\\lim_{x \\to c} f(x)$ must exist from both left and right.\n  3. Both must match: $\\lim_{x \\to c} f(x) = f(c)$.`;
        }

        // 4. Computer Science: Trees, Big O, Recursion
        if (q.includes("tree") || q.includes("bst") || q.includes("big-o") || q.includes("recursion") || q.includes("binary") || q.includes("array") || q.includes("list")) {
            return `💻 **Computer Science Deep Dive: Trees & Complexity**\n\n- **Binary Search Tree (BST) Property:** For every node $X$, all values in its left subtree are $< X$, and all values in its right subtree are $> X$.\n- **Traversals:**\n  - **In-order (Left, Root, Right):** Prints values in strictly ascending sorted order!\n  - **Pre-order (Root, Left, Right):** Great for cloning a tree.\n  - **Post-order (Left, Right, Root):** Great for deleting or evaluating syntax trees.\n- **Time Complexity:** Balanced BST = $\\mathcal{O}(\\log N)$ search; Degenerate (unbalanced line) = $\\mathcal{O}(N)$ worst-case.`;
        }

        // 5. Study tips & procrastination
        if (q.includes("procrastinat") || q.includes("study habit") || q.includes("focus") || q.includes("exam tip")) {
            return `🎯 **Anti-Procrastination & Peak Study Strategies**\n\n1. **The 5-Minute Rule:** Commit to working on just 1 practice question or reading 1 page for 5 minutes. Starting eliminates 80% of mental friction.\n2. **Active Recall > Re-reading:** Don't just highlight notes. Close your notebook and write down everything you remember on a blank sheet.\n3. **Feynman Technique:** Teach the concept out loud in plain words. Wherever you stumble is where your knowledge gap is hiding!\n4. **Pomodoro Sprints:** 45 minutes deep work, followed by 10 minutes screen-free break. Check your **AI Study Plan** tab for pre-built time blocks!`;
        }

        // Default friendly pedagogical response
        return `🤖 **Great question regarding "${escapeHtml(query)}"!**\n\nHere is a structured explanation:\n\n1. **Core Concept:** At its foundation, this revolves around connecting fundamental principles to practical examples you see every day.\n2. **Key Takeaway:** Always identify the inputs, the governing rules, and the expected outcomes.\n3. **Application:** To test if you've really mastered this, try asking yourself: *"If I doubled one variable, what happens to the result?"*\n\nWould you like me to give you a simple real-world analogy, break it down step-by-step, or generate a 1-question quiz?`;
    },

    renderMessages() {
        const container = document.getElementById("chat-messages-container");
        if (!container) return;

        container.innerHTML = this.messages.map(m => {
            const isAi = m.sender === "ai";
            const formatted = this.formatMarkdown(m.text);

            return `
                <div class="chat-message ${isAi ? 'message-ai' : 'message-user'}">
                    <div class="message-avatar">${isAi ? '🤖' : '🎓'}</div>
                    <div class="message-bubble">
                        <div class="message-header">
                            <span class="message-sender-name">${isAi ? 'LearnMate AI Tutor' : 'You'}</span>
                            <span class="message-time">${m.time}</span>
                        </div>
                        <div class="message-body">${formatted}</div>
                        ${isAi && m.id !== 'msg-welcome' ? `
                            <div class="message-footer mt-2">
                                <button class="btn btn-xs btn-outline" onclick="AIChat.copyMessageText('${m.id}')">📋 Copy</button>
                                <button class="btn btn-xs btn-outline" onclick="App.navigateTo('quiz')">🎯 Test Knowledge</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join("");

        // Auto-scroll to bottom
        container.scrollTop = container.scrollHeight;
    },

    renderTypingIndicator() {
        const container = document.getElementById("chat-messages-container");
        if (!container) return;

        const typingDiv = document.createElement("div");
        typingDiv.className = "chat-message message-ai message-typing";
        typingDiv.id = "chat-typing-node";
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-bubble typing-bubble">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;
    },

    formatMarkdown(text) {
        if (!text) return "";
        let html = text
            // Code blocks
            .replace(/```([\s\S]*?)```/g, '<pre class="chat-code-block"><code>$1</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>')
            // Bold
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // Newlines to breaks
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
        return html;
    },

    copyMessageText(msgId) {
        const msg = this.messages.find(m => m.id === msgId);
        if (!msg) return;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(msg.text).then(() => {
                App.showToast("Explanation copied to clipboard!", "success");
            });
        }
    },

    clearChat() {
        if (confirm("Clear your chat history with LearnMate AI Tutor?")) {
            StorageManager.clearChatHistory();
            this.messages = [];
            this.init();
            this.renderMessages();
            App.showToast("Chat history reset.", "info");
        }
    },

    sendQuickPrompt(promptText) {
        this.sendMessage(promptText);
    },

    render() {
        const container = document.getElementById("chat-view");
        if (!container) return;

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h2 class="view-title">AI Student Tutor</h2>
                    <p class="view-subtitle">Instant, supportive 1-on-1 tutoring. Explains complex topics, answers follow-ups, and builds intuition.</p>
                </div>
                <div class="header-actions flex-wrap gap-2">
                    <span id="ai-status-indicator" class="ai-mode-badge badge-demo">
                        <span class="badge-dot dot-demo"></span> Demo Tutor Mode (Self-Contained)
                    </span>
                    <button class="btn btn-outline btn-sm" onclick="AIChat.clearChat()">
                        🗑️ Clear Chat
                    </button>
                </div>
            </div>

            <!-- Chat Interface Card -->
            <div class="card chat-card-container">
                <!-- Chat Style & Mode Bar -->
                <div class="chat-controls-top flex-between flex-wrap gap-2 p-3 border-bottom">
                    <div class="flex-center gap-2">
                        <span class="label-tiny">Explanation Style:</span>
                        <select id="chat-style-select" class="form-control form-control-sm">
                            <option value="simple" selected>Intuitive & Conceptual</option>
                            <option value="eli10">Explain Like I'm 10 (Analogy Heavy)</option>
                            <option value="steps">Step-by-Step Breakdown</option>
                            <option value="exam">Exam Tips & High-Yield Strategy</option>
                        </select>
                    </div>

                    <div class="tutor-motto text-muted small">
                        💡 Ask anything from your syllabus or paste homework questions!
                    </div>
                </div>

                <!-- Messages Container -->
                <div class="chat-messages-scroll" id="chat-messages-container">
                    <!-- Injected by renderMessages() -->
                </div>

                <!-- Quick Prompt Chips -->
                <div class="chat-chips-tray p-2">
                    <span class="label-tiny mr-2">Try asking:</span>
                    <button class="chat-chip-btn" onclick="AIChat.sendQuickPrompt('Explain photosynthesis light vs dark reactions simply')">
                        🌿 Photosynthesis Calvin Cycle
                    </button>
                    <button class="chat-chip-btn" onclick="AIChat.sendQuickPrompt('How does Faraday induction & Lenz law work?')">
                        ⚡ Faraday & Lenz's Law
                    </button>
                    <button class="chat-chip-btn" onclick="AIChat.sendQuickPrompt('Explain quadratic formula and what discriminant means')">
                        📐 Quadratic Discriminant
                    </button>
                    <button class="chat-chip-btn" onclick="AIChat.sendQuickPrompt('Difference between arrays and linked lists in Big-O')">
                        💻 Arrays vs Linked Lists
                    </button>
                </div>

                <!-- Chat Input Row -->
                <div class="chat-input-row p-3 border-top">
                    <form class="chat-form flex-center gap-2" onsubmit="event.preventDefault(); AIChat.sendMessage();">
                        <input type="text" id="chat-user-input" class="form-control" 
                            placeholder="Type a concept, question, or problem to clarify..." 
                            autocomplete="off" 
                        />
                        <button type="submit" class="btn btn-primary" id="chat-send-btn">
                            Send ➔
                        </button>
                    </form>
                </div>
            </div>
        `;

        this.renderMessages();
        this.updateStatusBadge();
    }
};

