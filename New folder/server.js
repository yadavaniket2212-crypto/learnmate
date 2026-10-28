/**
 * LearnMate AI - Lightweight Zero-Dependency Backend Server
 * Uses standard Node.js libraries (http, https, fs, path, url).
 * Securely proxies AI calls without exposing API keys to the browser.
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Simple .env parser (zero dependency)
function loadEnv() {
    const envPath = path.join(__dirname, ".env");
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        content.split("\n").forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#")) {
                const eqIdx = trimmed.indexOf("=");
                if (eqIdx !== -1) {
                    const key = trimmed.slice(0, eqIdx).trim();
                    const val = trimmed.slice(eqIdx + 1).trim();
                    process.env[key] = val.replace(/^["']|["']$/g, "");
                }
            }
        });
    }
}
loadEnv();

const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon"
};

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end(JSON.stringify(data));
}

// Call Google Gemini API securely
function callGemini(prompt, systemInstruction = "") {
    return new Promise((resolve, reject) => {
        if (!GEMINI_KEY) {
            return reject(new Error("No Gemini API key configured"));
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
        const payload = JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: systemInstruction ? `${systemInstruction}\n\nUser Question: ${prompt}` : prompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800
            }
        });

        const reqUrl = new URL(endpoint);
        const options = {
            hostname: reqUrl.hostname,
            path: reqUrl.pathname + reqUrl.search,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(body);
                    if (parsed.candidates && parsed.candidates[0]?.content?.parts[0]?.text) {
                        resolve(parsed.candidates[0].content.parts[0].text);
                    } else if (parsed.error) {
                        reject(new Error(parsed.error.message || "Gemini API error"));
                    } else {
                        reject(new Error("Unexpected response from Gemini"));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on("error", reject);
        req.write(payload);
        req.end();
    });
}

const server = http.createServer((req, res) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        });
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // API: Health check & Mode detector
    if (pathname === "/api/health" && req.method === "GET") {
        sendJSON(res, 200, {
            status: "ok",
            hasApiKey: Boolean(GEMINI_KEY || OPENAI_KEY),
            provider: GEMINI_KEY ? "gemini" : (OPENAI_KEY ? "openai" : "demo_mode"),
            message: Boolean(GEMINI_KEY || OPENAI_KEY) 
                ? "Live AI Backend Active" 
                : "Running in Demo Mode (API Key not provided in .env)"
        });
        return;
    }

    // API: AI Chat Tutor
    if (pathname === "/api/chat" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", async () => {
            try {
                const data = JSON.parse(body || "{}");
                const userMessage = data.message || "";
                const style = data.style || "simple";

                if (!userMessage) {
                    sendJSON(res, 400, { error: "Message is required" });
                    return;
                }

                if (GEMINI_KEY) {
                    const systemPrompt = `You are LearnMate AI, a patient, inspiring, student-friendly academic tutor. Explain clearly, use formatting and bullet points where helpful. Style preference: ${style}.`;
                    try {
                        const reply = await callGemini(userMessage, systemPrompt);
                        sendJSON(res, 200, { reply, mode: "live" });
                        return;
                    } catch (apiErr) {
                        console.error("Gemini call error:", apiErr.message);
                    }
                }

                // If no API key or API call failed, tell client to fallback to built-in smart engine
                sendJSON(res, 200, {
                    reply: null,
                    mode: "demo",
                    note: "No API key configured in .env. Falling back to local smart tutor simulation."
                });
            } catch (err) {
                sendJSON(res, 500, { error: "Failed to process chat message" });
            }
        });
        return;
    }

    // Static File Serving
    let safePath = path.normalize(decodeURI(pathname)).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === "/" || safePath === "\\") safePath = "index.html";

    const filePath = path.join(__dirname, safePath);
    const ext = path.extname(filePath).toLowerCase();

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found");
            return;
        }

        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        res.writeHead(200, { "Content-Type": contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🎓 LearnMate AI is running locally at:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`AI Backend Mode: ${GEMINI_KEY ? "🟢 Live Gemini API" : "⚡ Demo Mode (No API key in .env)"}`);
    console.log(`======================================================\n`);
});

