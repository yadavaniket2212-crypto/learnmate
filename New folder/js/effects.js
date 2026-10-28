/**
 * LearnMate AI - Gen-Z Audio & Particle FX Engine
 * Pure Web Audio API synthesizers and Canvas confetti particle engine (100% zero external dependencies).
 */

const FXEngine = {
    audioCtx: null,
    soundEnabled: true,
    ambientRunning: false,
    ambientNodes: null,

    init() {
        // Initialize canvas for confetti
        this.createCanvas();

        // Sound toggle preference
        const savedSound = localStorage.getItem("learnmate_sound_fx");
        this.soundEnabled = savedSound !== "false";
    },

    getAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
        if (this.audioCtx && this.audioCtx.state === "suspended") {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    },

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem("learnmate_sound_fx", this.soundEnabled);
        if (!this.soundEnabled && this.ambientRunning) {
            this.stopAmbientNoise();
        }
        App.showToast(this.soundEnabled ? "🔊 Sound Effects: ON" : "🔇 Sound Effects: OFF", "info");
        this.updateSoundButtonUI();
    },

    updateSoundButtonUI() {
        const btn = document.getElementById("sound-toggle-btn");
        if (btn) {
            btn.innerHTML = this.soundEnabled ? "🔊 FX On" : "🔇 FX Off";
            btn.classList.toggle("btn-active-glow", this.soundEnabled);
        }
    },

    // Synthesized Sound FX via Web Audio API
    playSuccessSound() {
        if (!this.soundEnabled) return;
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            // Melodic arpeggio: C5 -> E5 -> G5 -> C6
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
            osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16);
            osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.24);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.5);
        } catch (e) {
            // Audio context failed or blocked by browser policy
        }
    },

    playCoinSound() {
        if (!this.soundEnabled) return;
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(987.77, now); // B5
            osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.4);
        } catch (e) {}
    },

    playErrorSound() {
        if (!this.soundEnabled) return;
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(220, now); // A3
            osc.frequency.linearRampToValueAtTime(160, now + 0.2);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.25);
        } catch (e) {}
    },

    // Ambient Lo-Fi Focus generator (Pink/Brown noise synthesized)
    toggleAmbientNoise(type = "rain") {
        if (this.ambientRunning) {
            this.stopAmbientNoise();
        } else {
            this.startAmbientNoise(type);
        }
    },

    startAmbientNoise(type = "rain") {
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            // Generate 3 seconds of buffer noise
            const bufferSize = ctx.sampleRate * 3;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                // Brown/pink filter for soft rain/lo-fi rumble
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.value = type === "rain" ? 800 : 400;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.05, ctx.currentTime);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            noise.start();

            this.ambientNodes = { noise, gain };
            this.ambientRunning = true;
            this.updateAmbientUI(true);
            App.showToast("🎧 Focus Ambient Noise: ACTIVE (Stay Locked In)", "success");
        } catch (e) {
            console.warn("Ambient noise could not start:", e);
        }
    },

    stopAmbientNoise() {
        if (this.ambientNodes) {
            try {
                this.ambientNodes.noise.stop();
                this.ambientNodes.noise.disconnect();
            } catch (e) {}
            this.ambientNodes = null;
        }
        this.ambientRunning = false;
        this.updateAmbientUI(false);
        App.showToast("🎧 Focus Ambient Noise: Paused", "info");
    },

    updateAmbientUI(active) {
        const btn = document.getElementById("ambient-focus-btn");
        if (btn) {
            btn.classList.toggle("ambient-active", active);
            btn.innerHTML = active 
                ? `<span class="soundwave-anim"><span></span><span></span><span></span></span> Focus Lo-Fi` 
                : `🎧 Focus Audio`;
        }
    },

    // Confetti Engine
    createCanvas() {
        let canvas = document.getElementById("fx-canvas");
        if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.id = "fx-canvas";
            canvas.style.position = "fixed";
            canvas.style.top = "0";
            canvas.style.left = "0";
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.pointerEvents = "none";
            canvas.style.zIndex = "9999";
            document.body.appendChild(canvas);
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.resizeCanvas();
        window.addEventListener("resize", () => this.resizeCanvas());
    },

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    /**
     * Trigger a burst of colorful confetti particles
     */
    confettiBurst(originX = 0.5, originY = 0.5, particleCount = 70) {
        if (!this.ctx) this.createCanvas();
        this.resizeCanvas();

        const colors = ["#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#ffffff"];
        const particles = [];
        const startX = window.innerWidth * originX;
        const startY = window.innerHeight * originY;

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 9;
            particles.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                size: 6 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 12,
                opacity: 1,
                decay: 0.015 + Math.random() * 0.02
            });
        }

        const render = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            let alive = false;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                if (p.opacity > 0) {
                    alive = true;
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.22; // gravity
                    p.rotation += p.rotationSpeed;
                    p.opacity -= p.decay;

                    this.ctx.save();
                    this.ctx.translate(p.x, p.y);
                    this.ctx.rotate((p.rotation * Math.PI) / 180);
                    this.ctx.globalAlpha = Math.max(0, p.opacity);
                    this.ctx.fillStyle = p.color;
                    this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                    this.ctx.restore();
                }
            }

            if (alive) {
                requestAnimationFrame(render);
            } else {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        };

        requestAnimationFrame(render);
    }
};

// Initialize FX on page load
document.addEventListener("DOMContentLoaded", () => {
    FXEngine.init();
});

