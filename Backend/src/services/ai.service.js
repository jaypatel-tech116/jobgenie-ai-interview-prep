const { GoogleGenAI } = require("@google/genai");
const axios = require("axios");
const crypto = require("crypto");
const NodeCache = require("node-cache");
const puppeteer = require("puppeteer");
const logger = require("../config/logger");

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
const cache = new NodeCache({ stdTTL: 3600 });

// ─── RATE LIMIT ────────────────────────────────────────────────────────────────
let lastCall = 0;
const MIN_DELAY = 1500;

async function rateLimit() {
  const now = Date.now();
  const wait = MIN_DELAY - (now - lastCall);
  if (wait > 0) await new Promise((res) => setTimeout(res, wait));
  lastCall = Date.now();
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function getCacheKey(data) {
  return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
}

function safeParse(text) {
  if (!text) return null;
  const clean = text
    .replace(/```json|```/g, "")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
  try {
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function isValid(data) {
  return (
    data &&
    typeof data.title === "string" &&
    data.title.trim().length > 0 &&
    typeof data.matchScore === "number" &&
    data.matchScore >= 0 &&
    typeof data.atsScore === "number" &&
    Array.isArray(data.atsIssues) &&
    Array.isArray(data.atsStrengths) &&
    Array.isArray(data.technicalQuestions) &&
    data.technicalQuestions.length >= 5 &&
    Array.isArray(data.behavioralQuestions) &&
    data.behavioralQuestions.length >= 5 &&
    Array.isArray(data.skillGaps) &&
    data.skillGaps.length >= 5 &&
    Array.isArray(data.preparationPlan) &&
    data.preparationPlan.length >= 7
  );
}

function normalizeReportData(data) {
  if (!data || typeof data !== "object") return data;

  // Technical Questions (ensure at least 5)
  if (!Array.isArray(data.technicalQuestions)) data.technicalQuestions = [];
  const defaultTechQs = [
    {
      question: "How do you optimize application performance and resource usage under high concurrent load?",
      intention: "Evaluates understanding of runtime performance, memory management, and system scalability.",
      answer: "Identify bottlenecks using profiling tools, implement efficient caching strategies, optimize database queries, and manage asynchronous task queues."
    },
    {
      question: "What strategies do you employ for API security, authentication, and token authorization?",
      intention: "Assesses knowledge of secure architecture, JWT/OAuth standards, and defensive coding practices.",
      answer: "Utilize short-lived JWT tokens with secure HTTP-only cookies, implement role-based access control (RBAC), enforce rate limiting, and validate incoming payloads."
    },
    {
      question: "How do you handle database migrations, indexing strategies, and schema evolution in production?",
      intention: "Tests proficiency with data modeling, database indexing, and zero-downtime deployment strategies.",
      answer: "Apply backward-compatible schema migrations, construct compound indexes for high-frequency queries, and perform non-blocking database updates."
    },
    {
      question: "How do you structure error handling and logging across multi-tiered services?",
      intention: "Checks ability to construct observable, maintainable, and easily debuggable backend applications.",
      answer: "Implement centralized error middleware, standardized response schemas, request trace IDs, and structured logging with contextual metadata."
    },
    {
      question: "How do you approach automated testing (unit, integration, e2e) to maintain high code quality?",
      intention: "Measures engineering discipline, test-driven development practices, and CI/CD automation experience.",
      answer: "Write isolated unit tests for business logic, mock external dependencies, and execute automated integration tests in CI pipelines prior to release."
    }
  ];
  while (data.technicalQuestions.length < 5) {
    const fallback = defaultTechQs[data.technicalQuestions.length % defaultTechQs.length];
    data.technicalQuestions.push(fallback);
  }

  // Behavioral Questions (ensure at least 5)
  if (!Array.isArray(data.behavioralQuestions)) data.behavioralQuestions = [];
  const defaultBehQs = [
    {
      question: "Describe a situation where you had a disagreement with a team member over architectural design.",
      intention: "Evaluates conflict resolution, technical communication, and pragmatic engineering trade-offs.",
      answer: "Situation: Disagreed on architecture. Task: Align team on standard. Action: Presented benchmark data and trade-off analysis. Result: Reached consensus with zero project delay."
    },
    {
      question: "Tell me about a time when a critical production bug occurred post-release. How did you handle it?",
      intention: "Assesses crisis management, root cause analysis, and post-mortem accountability.",
      answer: "Situation: Outage after release. Task: Restore service fast. Action: Implemented rapid rollback, isolated root cause, deployed hotfix. Result: Restored service in 15 mins with post-mortem."
    },
    {
      question: "How do you prioritize technical debt versus tight product feature deadlines?",
      intention: "Tests prioritization, pragmatic decision making, and stakeholder alignment under deadline pressure.",
      answer: "Situation: Competing priorities. Task: Ship features while maintaining stability. Action: Categorized tasks by risk and refactored critical paths incrementally. Result: Met release goal."
    },
    {
      question: "Describe a project where you had to quickly learn an unfamiliar technology stack.",
      intention: "Measures adaptability, rapid learning capacity, and self-directed problem solving.",
      answer: "Situation: New technology requirement. Task: Build feature on short notice. Action: Studied documentation, built POCs, and shared learnings with team. Result: Delivered on schedule."
    },
    {
      question: "Give an example of how you mentored a colleague or improved team engineering standards.",
      intention: "Evaluates leadership potential, knowledge sharing, and commitment to team growth.",
      answer: "Situation: Team needed quality standards. Task: Elevate code quality. Action: Introduced automated linting, code review templates, and pair programming. Result: Reduced defect rate."
    }
  ];
  while (data.behavioralQuestions.length < 5) {
    const fallback = defaultBehQs[data.behavioralQuestions.length % defaultBehQs.length];
    data.behavioralQuestions.push(fallback);
  }

  // Skill Gaps (ensure at least 5)
  if (!Array.isArray(data.skillGaps)) data.skillGaps = [];
  const defaultGaps = [
    { skill: "System Architecture & Scalability", severity: "medium", reason: "Demonstrating high-scale architectural design trade-offs for target role requirements." },
    { skill: "Automated End-to-End Testing", severity: "low", reason: "Expanding automated test coverage across edge cases and production workflows." },
    { skill: "CI/CD Pipeline Automation", severity: "low", reason: "Automating zero-downtime deployment pipelines and environment configuration." },
    { skill: "Advanced Query Performance Tuning", severity: "medium", reason: "Optimizing database indexing and caching strategies under heavy traffic." },
    { skill: "Cloud Infrastructure Security", severity: "medium", reason: "Hardening security policies, IAM permissions, and secrets management." }
  ];
  while (data.skillGaps.length < 5) {
    const fallback = defaultGaps[data.skillGaps.length % defaultGaps.length];
    data.skillGaps.push(fallback);
  }

  // Preparation Plan (ensure at least 7 days)
  if (!Array.isArray(data.preparationPlan)) data.preparationPlan = [];
  const defaultDays = [
    { day: 1, focus: "Core Technical Concepts & Data Structures", tasks: ["Review fundamental language concepts & data structures", "Practice core problem solving"] },
    { day: 2, focus: "Framework & Architectural Patterns", tasks: ["Study key framework design patterns", "Review production system architecture best practices"] },
    { day: 3, focus: "Database Design & Performance Tuning", tasks: ["Practice complex query writing", "Review schema indexing and caching strategies"] },
    { day: 4, focus: "System Design & API Architecture", tasks: ["Practice designing scalable microservices", "Review API security & rate limiting mechanisms"] },
    { day: 5, focus: "Behavioral Questions & STAR Stories", tasks: ["Draft 5 STAR stories from past project experience", "Practice explaining technical trade-offs clearly"] },
    { day: 6, focus: "Mock Interview & Self-Evaluation", tasks: ["Conduct timed mock interview practice session", "Refine answers based on self-evaluation"] },
    { day: 7, focus: "Final Review & Mental Readiness", tasks: ["Review target company details and job description", "Rest and prepare for interview day"] }
  ];
  while (data.preparationPlan.length < 7) {
    const dayNum = data.preparationPlan.length + 1;
    const template = defaultDays[(dayNum - 1) % defaultDays.length];
    data.preparationPlan.push({
      day: dayNum,
      focus: template.focus,
      tasks: template.tasks
    });
  }

  return data;
}

function extractHTML(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(clean);
    if (parsed?.html) return parsed.html;
  } catch {
    /* not JSON — treat as raw HTML */
  }
  return clean;
}

// ─── CSS SHELL ─────────────────────────────────────────────────────────────────
// Design: "Refined Editorial" — Playfair Display name, Source Serif body copy,
// deep navy accent (#1B3A5C), warm off-white paper (#FAFAF8).
// Crisp left rule on experience entries, generous but tight whitespace.
// ATS-safe: semantic tags only, zero tables for layout.
function ensureHTML(html) {
  if (!html) return "";
  html = html.replace(/\\"/g, '"').replace(/\\n/g, "\n").trim();
  if (html.includes("<html")) return html;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    /* ═══════════════════════════════════════════════════════════
       REFINED EDITORIAL RESUME  —  A4 · Google Fonts
       Palette: #1B3A5C navy · #C8A96E gold · #FAFAF8 paper · #2D2D2D ink
       ═══════════════════════════════════════════════════════════ */

    :root {
      --navy:   #1B3A5C;
      --gold:   #C8A96E;
      --ink:    #2D2D2D;
      --muted:  #5C6470;
      --rule:   #D6D0C8;
      --paper:  #FAFAF8;
      --accent-light: #EEF2F7;
    }

    @page {
      size: A4;
      margin: 14mm 16mm 14mm 16mm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 9.5pt;
      font-weight: 300;
      line-height: 1.55;
      color: var(--ink);
      background: var(--paper);
      width: 178mm;
      margin: 0 auto;
    }

    /* ── HEADER ─────────────────────────────────────────── */
    .resume-header {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding-bottom: 10px;
      margin-bottom: 12px;
      border-bottom: 2px solid var(--navy);
      position: relative;
    }

    /* Thin gold line above the main rule for a luxury double-border effect */
    .resume-header::before {
      content: '';
      display: block;
      width: 100%;
      height: 1px;
      background: var(--gold);
      margin-bottom: 9px;
    }

    .resume-name {
      font-family: 'Playfair Display', 'Times New Roman', serif;
      font-size: 26pt;
      font-weight: 700;
      color: var(--navy);
      letter-spacing: -0.3px;
      line-height: 1.1;
      margin-bottom: 2px;
    }

    .resume-tagline {
      font-family: 'DM Sans', sans-serif;
      font-size: 9.3pt;
      font-weight: 500;
      color: var(--gold);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 7px;
    }

    .resume-contact-line {
      font-family: 'DM Sans', sans-serif;
      font-size: 8.3pt;
      font-weight: 400;
      color: var(--muted);
      letter-spacing: 0.1px;
      line-height: 1.6;
    }

    .resume-contact-line a {
      color: var(--navy);
      text-decoration: none;
      border-bottom: 0.6px solid var(--rule);
    }

    .contact-sep {
      margin: 0 6px;
      color: var(--gold);
      font-size: 8pt;
    }

    /* ── SECTION HEADINGS ──────────────────────────────── */
    h2 {
      font-family: 'DM Sans', sans-serif;
      font-size: 7.6pt;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--navy);
      margin-top: 14px;
      margin-bottom: 7px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--rule);
      position: relative;
    }

    /* Short gold underline accent on section headings */
    h2::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -1px;
      width: 28px;
      height: 2px;
      background: var(--gold);
    }

    /* ── PROFESSIONAL SUMMARY ──────────────────────────── */
    .summary-text {
      font-size: 9.5pt;
      font-weight: 300;
      line-height: 1.65;
      color: var(--ink);
      font-style: italic;
      border-left: 2px solid var(--gold);
      padding-left: 10px;
      margin-top: 1px;
    }

    /* ── SKILLS GRID ───────────────────────────────────── */
    .skills-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3.5px 24px;
      margin-top: 2px;
    }

    .skill-row {
      font-family: 'DM Sans', sans-serif;
      font-size: 8.6pt;
      line-height: 1.55;
      color: var(--ink);
    }

    .skill-label {
      font-weight: 600;
      color: var(--navy);
    }

    /* ── EXPERIENCE / PROJECT ENTRIES ──────────────────── */
    /* Left rule gives a clean editorial structure */
    .entry {
      margin-bottom: 10px;
      padding-left: 10px;
      border-left: 1.5px solid var(--rule);
      position: relative;
    }

    /* Navy dot on the left rule */
    .entry::before {
      content: '';
      position: absolute;
      left: -4px;
      top: 4px;
      width: 7px;
      height: 7px;
      background: var(--navy);
      border-radius: 50%;
    }

    .entry:last-child { margin-bottom: 2px; }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 6px;
      margin-bottom: 0px;
    }

    .entry-company {
      font-family: 'DM Sans', sans-serif;
      font-size: 9.8pt;
      font-weight: 600;
      color: var(--navy);
      flex: 1;
    }

    .entry-date {
      font-family: 'DM Sans', sans-serif;
      font-size: 7.8pt;
      font-weight: 500;
      color: var(--muted);
      white-space: nowrap;
      flex-shrink: 0;
      background: var(--accent-light);
      padding: 1px 5px;
      border-radius: 2px;
    }

    .entry-role {
      font-size: 8.8pt;
      font-style: italic;
      font-weight: 400;
      color: var(--gold);
      margin-bottom: 4px;
    }

    .entry-title {
      font-family: 'DM Sans', sans-serif;
      font-size: 9.8pt;
      font-weight: 600;
      color: var(--navy);
      margin-bottom: 2px;
    }

    .entry-tech {
      font-family: 'DM Sans', sans-serif;
      font-size: 7.8pt;
      color: var(--muted);
      font-style: italic;
      margin-bottom: 3px;
    }

    /* ── BULLET LISTS ───────────────────────────────────── */
    ul {
      margin: 3px 0 2px 0;
      padding-left: 13px;
      list-style-type: none;
    }

    li {
      font-size: 9pt;
      font-weight: 300;
      margin-bottom: 3px;
      line-height: 1.5;
      color: var(--ink);
      position: relative;
    }

    /* Custom bullet: small gold square */
    li::before {
      content: '▪';
      position: absolute;
      left: -11px;
      top: 0;
      color: var(--gold);
      font-size: 7pt;
      line-height: 1.7;
    }

    /* ── EDUCATION ──────────────────────────────────────── */
    .edu-entry {
      margin-bottom: 7px;
      padding-left: 10px;
      border-left: 1.5px solid var(--rule);
      position: relative;
    }

    .edu-entry::before {
      content: '';
      position: absolute;
      left: -4px;
      top: 4px;
      width: 7px;
      height: 7px;
      background: var(--gold);
      border-radius: 50%;
    }

    .edu-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 6px;
    }

    .edu-degree {
      font-family: 'DM Sans', sans-serif;
      font-size: 9.8pt;
      font-weight: 600;
      color: var(--navy);
      flex: 1;
    }

    .edu-year {
      font-family: 'DM Sans', sans-serif;
      font-size: 7.8pt;
      color: var(--muted);
      white-space: nowrap;
      flex-shrink: 0;
      background: var(--accent-light);
      padding: 1px 5px;
      border-radius: 2px;
    }

    .edu-institution {
      font-size: 9pt;
      color: var(--ink);
      margin-top: 1px;
    }

    .edu-detail {
      font-family: 'DM Sans', sans-serif;
      font-size: 8pt;
      color: var(--muted);
      margin-top: 1px;
    }

    /* ── CERTIFICATIONS ─────────────────────────────────── */
    .cert-entry {
      font-family: 'DM Sans', sans-serif;
      font-size: 8.8pt;
      margin-bottom: 4px;
      line-height: 1.5;
      color: var(--ink);
      padding-left: 10px;
      border-left: 1.5px solid var(--rule);
    }

    .cert-name { font-weight: 600; color: var(--navy); }

    /* ── ACHIEVEMENTS ───────────────────────────────────── */
    .achievement-entry {
      margin-bottom: 6px;
      padding-left: 10px;
      border-left: 1.5px solid var(--gold);
    }

    .achievement-title {
      font-family: 'DM Sans', sans-serif;
      font-size: 9.3pt;
      font-weight: 600;
      color: var(--navy);
    }

    .achievement-desc {
      font-size: 8.8pt;
      font-weight: 300;
      color: var(--muted);
      margin-top: 1px;
      line-height: 1.5;
    }

    /* ── MISC ───────────────────────────────────────────── */
    p   { font-size: 9.5pt; line-height: 1.55; margin-bottom: 3px; }
    a   { color: var(--navy); text-decoration: none; }
    hr  { display: none; }
    strong { color: var(--ink); font-weight: 600; }
  </style>
</head>
<body>${html}</body>
</html>`;
}

// ─── PDF ───────────────────────────────────────────────────────────────────────
let _browser = null;

async function getBrowser() {
  if (_browser && _browser.connected) return _browser;
  const launchOpts = {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-breakpad",
      "--disable-component-update",
      "--disable-domain-reliability",
      "--disable-sync",
      "--disable-translate",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-first-run",
      "--safebrowsing-disable-auto-update",
    ],
  };

  const fs = require("fs");
  const path = require("path");

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  } else if (process.platform === "win32") {
    // Probe Windows default Chrome & Edge locations
    const winPaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
    ];
    for (const p of winPaths) {
      if (fs.existsSync(p)) {
        logger.info(`Auto-detected Windows system browser path: ${p}`);
        launchOpts.executablePath = p;
        break;
      }
    }
  } else if (process.platform === "darwin") {
    // Probe macOS default locations
    const macPaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ];
    for (const p of macPaths) {
      if (fs.existsSync(p)) {
        logger.info(`Auto-detected macOS system browser path: ${p}`);
        launchOpts.executablePath = p;
        break;
      }
    }
  } else if (process.platform === "linux") {
    // Probe Linux default locations
    const linuxPaths = [
      "/usr/bin/google-chrome",
      "/usr/bin/chrome",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
    ];
    for (const p of linuxPaths) {
      if (fs.existsSync(p)) {
        logger.info(`Auto-detected Linux system browser path: ${p}`);
        launchOpts.executablePath = p;
        break;
      }
    }
  }

  _browser = await puppeteer.launch(launchOpts);
  return _browser;
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // PDF layout is purely static HTML + CSS. Disabling JS speeds it up significantly.
    await page.setJavaScriptEnabled(false);
    // Load static content. waitUntil load is sufficient for styles and fonts to paint.
    await page.setContent(htmlContent, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", right: "16mm", bottom: "14mm", left: "16mm" },
    });
    return pdf;
  } finally {
    await page.close();
  }
}

// ─── INTERVIEW REPORT ──────────────────────────────────────────────────────────
async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
  difficulty = "mid",
}) {
  const cacheKey = getCacheKey({
    resume,
    selfDescription,
    jobDescription,
    difficulty,
    type: "interview-report",
  });
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.info("CACHE HIT (interview-report)");
    return cached;
  }

  await rateLimit();

  const candidateContext = [];
  if (resume) {
    candidateContext.push(`RESUME:\n${resume}`);
  }
  if (selfDescription) {
    candidateContext.push(`ADDITIONAL CONTEXT FROM THE CANDIDATE:\n${selfDescription}`);
  }

  const prompt = `You are a professional technical recruiter and career strategist. Analyze the candidate's profile against the target job description and generate a comprehensive interview preparation report.

Return ONLY a valid JSON object in this exact schema, with no other text or markdown:
{
  "title": "string (the target job title or role being applied for)",
  "matchScore": number (0-100, representing how well the candidate matches the job description),
  "atsScore": number (0-100, ATS compatibility score of the candidate's profile),
  "atsIssues": [
    {
      "severity": "high" | "medium" | "low",
      "issue": "string description of the ATS issue or formatting gap",
      "fix": "string description of how to resolve the issue"
    }
  ],
  "atsStrengths": [
    "string describing a strength in the candidate's profile"
  ],
  "technicalQuestions": [
    {
      "question": "string (challenging technical question tailored to the role, difficulty, and candidate context)",
      "intention": "string (what this question aims to assess; MUST be at least 2 lines/sentences long)",
      "answer": "string (the model answer that would score full marks; MUST be at least 3 lines/sentences long)"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "string (behavioral question tailored to the role and candidate context)",
      "intention": "string (what this question aims to assess; MUST be at least 2 lines/sentences long)",
      "answer": "string (the STAR model answer guidance; MUST be at least 3 lines/sentences long)"
    }
  ],
  "skillGaps": [
    {
      "skill": "string (name of the missing skill or technology)",
      "severity": "high" | "medium" | "low",
      "reason": "string (explanation of why this gap matters for the job)"
    }
  ],
  "preparationPlan": [
    {
      "day": number (1 to 7),
      "focus": "string (daily study focus area)",
      "tasks": [
        "string (actionable study task)"
      ]
    }
  ]
}

Ensure:
- Exactly 5 technical questions (challenging and highly tailored).
- Exactly 5 behavioral questions (challenging and highly tailored).
- For every single technical and behavioral question, the generated "intention" field MUST be at least 3 lines or sentences long.
- For every single technical and behavioral question, the generated model "answer" field MUST be at least 4 lines or sentences long.
- At least 5 skill gaps identified.
- Exactly 7 days in the preparation plan.
- The difficulty level target is: "${difficulty}".
- Customize the questions and plan specifically to the candidate's resume/details and self-description, mapping them directly to the job description requirements.

━━━ CANDIDATE PROFILE & JOB DESCRIPTION ━━━
${candidateContext.join("\n\n")}

JOB DESCRIPTION:
${jobDescription}`;

  const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));

  const providers = [
    async () => {
      logger.info("Report Generation → Gemini 2.0-flash");
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.5,
          },
        }),
        timeout(35000),
      ]);
      return res.text;
    },
    async () => {
      logger.info("Report Generation → Gemini 1.5-flash");
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.5,
          },
        }),
        timeout(35000),
      ]);
      return res.text;
    },
    async () => {
      if (!process.env.GROQ_API_KEY) throw new Error("No Groq API key configured");
      logger.info("Report Generation → Groq llama-3.3-70b");
      const res = await Promise.race([
        axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            response_format: { type: "json_object" },
          },
          { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
        ),
        timeout(35000),
      ]);
      if (res.data.error) throw new Error(res.data.error.message);
      return res.data.choices[0].message.content;
    }
  ];

  for (const provider of providers) {
    try {
      const raw = await provider();
      let parsed = safeParse(raw);
      if (parsed) {
        parsed = normalizeReportData(parsed);
      }
      if (isValid(parsed)) {
        cache.set(cacheKey, parsed);
        return parsed;
      }
      throw new Error("Invalid Report response structure or missing fields");
    } catch (err) {
      logger.error("❌ Report Generation Provider failed: %s", err.message);
    }
  }

  throw new Error("All report generation providers failed");
}

// ─── RESUME PDF ────────────────────────────────────────────────────────────────
async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const cacheKey = getCacheKey({
    resume,
    selfDescription,
    jobDescription,
    type: "resume",
  });
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.info("CACHE HIT (resume)");
    return cached;
  }

  // ─── RESUME PROMPT ────────────────────────────────────────────────────────────
  // Key goals:
  //   1. Human-sounding output — varied sentence lengths, natural voice, no AI clichés
  //   2. 100% faithful to candidate data — never invent facts or metrics
  //   3. ATS-safe HTML with the pre-loaded stylesheet classes
  //   4. Full A4 page — every skill-relevant piece of content must be included
  //   5. Credit protection — temperature tuning + paraphrasing instructions
  const prompt = `You are a professional resume writer who has spent 15 years crafting resumes for engineers, designers, and product managers at top-tier companies. You write in a natural, confident, human voice. Your work has never once been flagged as AI-generated.

Return ONLY a valid JSON object in this exact format:
{"html": "<inner body HTML here>"}

Do NOT wrap in <html>, <head>, or <body> tags.

━━━ CRITICAL: FULL-PAGE REQUIREMENT ━━━

The resume MUST fill a complete A4 page (297mm tall). This is non-negotiable.
To achieve this you MUST:

1. INCLUDE ALL SKILL-RELEVANT CONTENT — Every technology, tool, framework, language, methodology, domain knowledge, or competency mentioned anywhere in the resume, self description, or job description that the candidate actually has must appear in the resume. Do not omit or condense any skill-relevant information.

2. EXPAND EVERY SECTION FULLY:
   - Professional Summary: Write 4–5 rich sentences covering the candidate's background, key strengths, notable experience, and career direction.
   - Technical Skills: List every single skill the candidate mentions, grouped into logical categories. Aim for 6–8 skill categories. Do not truncate lists.
   - Work Experience: Write 4–6 bullet points per role. Each bullet must be specific, factual, and outcome-driven. Include every project, responsibility, and technology used at each company.
   - Projects: Write 3–5 bullet points per project. Describe what was built, why, the tech stack in detail, and measurable outcomes.
   - Education: Include all courses, relevant modules, CGPA, honours, or academic projects if mentioned.
   - Certifications: List every certification with its issuer and a one-line description of what it covers.
   - Achievements: List every award, hackathon, competition, recognition, or notable milestone mentioned.

3. NEVER TRUNCATE OR OMIT: If the candidate mentions 12 technologies, list all 12. If they have 3 projects, write all 3 in full. If they list 5 certifications, include all 5. Omitting content to save space is a critical failure.

4. USE SPACE EFFICIENTLY BUT COMPLETELY: Write enough content that the body naturally fills the full A4 page. If the content is naturally short, expand the bullet points with more context, describe the candidate's approach and impact in greater detail, and elaborate on technologies and methodologies used.

━━━ HOW YOU WRITE ━━━

You write like a thoughtful human, not a language model. This means:

SENTENCE VARIETY: Mix short punchy sentences with longer ones. "Rebuilt the auth layer from scratch. Cut login failures by 40%." sounds human. "Successfully leveraged best-in-class authentication methodologies to achieve significant failure reductions" does not.

AVOID AI GIVEAWAYS — never use these words or phrases:
  • "spearheaded", "leveraged", "synergized", "orchestrated", "utilized"
  • "in order to", "as well as", "various", "numerous", "a wide range of"
  • "demonstrating", "showcasing", "highlighting", "ensuring"
  • Starting every bullet with the same type of verb (mix it up!)
  • Passive voice piled on passive voice

INSTEAD use: built, wrote, fixed, shipped, cut, led, helped, ran, designed, moved, improved, debugged, deployed, scaled, taught, joined, grew, set up

BULLET STYLE: Each bullet = one clear fact. Lead with what changed, not what you did. "Reduced API latency from 800ms to 120ms by switching to Redis caching" beats "Worked on improving API performance."

PROFESSIONAL SUMMARY: Write it in implied first person (omitting first-person pronouns like "I", "me", "my", "we", "our"). E.g. use "Full Stack Developer with a strong background..." instead of "I am a Full Stack Developer...". Write 4–5 sentences in past-and-present tense. Sound like a confident human outlining achievements and direction.

NUMBERS: Keep every real number the candidate gave. If no number exists, describe the outcome clearly without inventing one.

TAILORING: Reorder skills and subtly emphasise experience that matches the job description — but only use what's actually in the candidate's data.

━━━ HTML STRUCTURE — USE EXACTLY THESE CLASSES ━━━

HEADER:
  <div class="resume-header">
    <div class="resume-name">Full Name</div>
    <div class="resume-tagline">Target Role Title</div>
    <div class="resume-contact-line">
      City, Country <span class="contact-sep">|</span>
      +XX XXXXXXXXXX <span class="contact-sep">|</span>
      email@example.com <span class="contact-sep">|</span>
      <a href="https://linkedin.com/in/handle">linkedin.com/in/handle</a> <span class="contact-sep">|</span>
      <a href="https://github.com/handle">github.com/handle</a>
    </div>
  </div>

SECTION HEADINGS:  <h2>Section Name</h2>

PROFESSIONAL SUMMARY:
  <p class="summary-text">4–5 sentences. Implied first person (no 'I' or 'my'). Confident. Specific. Human.</p>

TECHNICAL SKILLS:
  <div class="skills-grid">
    <div class="skill-row"><span class="skill-label">Languages:</span> Python, TypeScript, Go</div>
    ...
  </div>
  Group into 6–8 categories. Include EVERY skill the candidate has mentioned. Do not leave any out.

WORK EXPERIENCE:
  <div class="entry">
    <div class="entry-header">
      <span class="entry-company">Company Name</span>
      <span class="entry-date">Jan 2022 – Mar 2024</span>
    </div>
    <div class="entry-role">Software Engineer</div>
    <ul>
      <li>Specific, factual, outcome-driven bullet. Write 4–6 bullets per role.</li>
    </ul>
  </div>

PROJECTS:
  <div class="entry">
    <div class="entry-title">Project Name</div>
    <div class="entry-tech">Tech: React, Node.js, PostgreSQL</div>
    <ul><li>What was built, why it matters, and what it achieved. Write 3–5 bullets per project.</li></ul>
  </div>

EDUCATION:
  <div class="edu-entry">
    <div class="edu-header">
      <span class="edu-degree">B.Tech in Computer Science</span>
      <span class="edu-year">2024</span>
    </div>
    <div class="edu-institution">University Name, City</div>
    <div class="edu-detail">CGPA: 8.7 / 10 — Relevant coursework: Data Structures, OS, DBMS, Computer Networks</div>
  </div>

CERTIFICATIONS (include ALL that are present):
  <div class="cert-entry"><span class="cert-name">AWS Solutions Architect</span> — Amazon. Covers cloud architecture, IAM, and cost optimisation.</div>

ACHIEVEMENTS (include ALL that are present):
  <div class="achievement-entry">
    <div class="achievement-title">1st Place — HackIndia 2023</div>
    <div class="achievement-desc">Built a real-time flood prediction tool. Beat 200+ teams.</div>
  </div>

ETC... Which is needed in resume and important

━━━ SECTION ORDER ━━━
Only include sections where the candidate actually has data.
Include ALL sections that have data — do not skip any:
1. Header  2. Professional Summary  3. Technical Skills  4. Work Experience
5. Projects  6. Education  7. Certifications  8. Achievements

━━━ CANDIDATE DATA ━━━

RESUME:
${resume || "(not provided)"}

SELF DESCRIPTION:
${selfDescription || "(not provided)"}

JOB DESCRIPTION:
${jobDescription || "(not provided)"}`;

  const timeout = (ms) =>
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms),
    );

  const providers = [
    // Gemini 2.0-flash — best HTML quality, temperature 0.75 for natural writing
    async () => {
      logger.info("Resume → Gemini 2.0-flash");
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.75, // Higher = more varied, human-sounding prose
          },
        }),
        timeout(35000),
      ]);
      return res.text;
    },
    async () => {
      logger.info("Resume → Gemini 1.5-flash");
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.75,
          },
        }),
        timeout(35000),
      ]);
      return res.text;
    },

    // Groq — fast fallback, temperature 0.7
    async () => {
      logger.info("Resume → Groq llama-3.3-70b");
      const res = await Promise.race([
        axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: "json_object" },
          },
          { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } },
        ),
        timeout(30000),
      ]);
      if (res.data.error) throw new Error(res.data.error.message);
      return res.data.choices[0].message.content;
    },

    // OpenRouter — GPT-3.5 safety net, temperature 0.7
    async () => {
      logger.info("Resume → OpenRouter gpt-3.5-turbo");
      const res = await Promise.race([
        axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "openai/gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 3500,
            response_format: { type: "json_object" },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
            },
          },
        ),
        timeout(30000),
      ]);
      if (res.data.error) throw new Error(res.data.error.message);
      return res.data.choices[0].message.content;
    },
  ];

  for (const provider of providers) {
    try {
      const raw = await provider();
      let html = extractHTML(raw);
      if (!html) throw new Error("Empty HTML response");
      html = ensureHTML(html);
      const pdf = await generatePdfFromHtml(html);
      cache.set(cacheKey, pdf);
      return pdf;
    } catch (err) {
      logger.error("❌ Provider failed: %s", err.message);
    }
  }

  throw new Error("All resume providers failed");
}

function ensureReportHTML({ title, matchScore, technicalQuestions, behavioralQuestions, skillGaps, preparationPlan }) {
  const techHtml = (technicalQuestions || []).map((q, idx) => `
    <div class="q-entry">
      <div class="q-num">Technical Question ${idx + 1}</div>
      <div class="q-text">${q.question}</div>
      <div class="q-intention"><strong>Intention:</strong> ${q.intention}</div>
      <div class="q-answer"><strong>Model Answer:</strong> ${q.answer}</div>
    </div>
  `).join("");

  const behHtml = (behavioralQuestions || []).map((q, idx) => `
    <div class="q-entry">
      <div class="q-num">Behavioral Question ${idx + 1}</div>
      <div class="q-text">${q.question}</div>
      <div class="q-intention"><strong>Intention:</strong> ${q.intention}</div>
      <div class="q-answer"><strong>STAR Model Answer:</strong> ${q.answer}</div>
    </div>
  `).join("");

  const gapHtml = (skillGaps || []).map(g => `
    <div class="gap-row">
      <span class="gap-skill">${g.skill}</span>
      <span class="gap-severity severity-${(g.severity || 'medium').toLowerCase()}">${g.severity}</span>
      <p class="gap-reason">${g.reason || g.severity || ''}</p>
    </div>
  `).join("");

  const planHtml = (preparationPlan || []).map(d => `
    <div class="plan-day">
      <div class="day-num">Day ${d.day}: ${d.focus}</div>
      <ul>
        ${(d.tasks || []).map(t => `<li>${t}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --navy:   #1B3A5C;
      --gold:   #C8A96E;
      --ink:    #2D2D2D;
      --muted:  #5C6470;
      --rule:   #D6D0C8;
      --bg:     #FAFAF8;
    }
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: 'DM Sans', sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: var(--ink);
      background: var(--bg);
      margin: 0;
      padding: 0;
    }
    header {
      border-bottom: 2px solid var(--navy);
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .title {
      font-family: 'Playfair Display', serif;
      font-size: 24pt;
      color: var(--navy);
      margin: 0 0 5px 0;
    }
    .score-badge {
      display: inline-block;
      background: var(--navy);
      color: #fff;
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 11pt;
      margin-top: 5px;
    }
    .score-val { color: var(--gold); }
    h2 {
      font-family: 'Playfair Display', serif;
      font-size: 16pt;
      color: var(--navy);
      border-bottom: 1px solid var(--gold);
      padding-bottom: 5px;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .q-entry {
      background: #fff;
      border-left: 3px solid var(--navy);
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .q-num {
      font-weight: bold;
      color: var(--gold);
      text-transform: uppercase;
      font-size: 8.5pt;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }
    .q-text {
      font-weight: 600;
      font-size: 11pt;
      margin-bottom: 10px;
      color: var(--navy);
    }
    .q-intention, .q-answer {
      margin-bottom: 8px;
      font-size: 9.5pt;
      white-space: pre-wrap;
    }
    .gap-row {
      background: #fff;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .gap-skill {
      font-weight: bold;
      color: var(--navy);
      font-size: 11pt;
    }
    .gap-severity {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-left: 10px;
    }
    .severity-high { background: #FDE8E8; color: #9C1A1A; }
    .severity-medium { background: #FEF08A; color: #713F12; }
    .severity-low { background: #ECFDF5; color: #065F46; }
    .gap-reason {
      margin: 8px 0 0 0;
      font-size: 9.5pt;
      color: var(--muted);
    }
    .plan-day {
      background: #fff;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;
      border-left: 3px solid var(--gold);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .day-num {
      font-weight: bold;
      color: var(--navy);
      font-size: 11pt;
      margin-bottom: 10px;
    }
    ul {
      margin: 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 5px;
      font-size: 9.5pt;
    }
  </style>
</head>
<body>
  <header>
    <h1 class="title">${title}</h1>
    <div class="score-badge">Role Match Score: <span class="score-val">${matchScore}%</span></div>
  </header>

  <h2>Skill Gap Analysis</h2>
  <div class="gaps-container">
    ${gapHtml}
  </div>

  <h2>Technical Questions & Answers</h2>
  ${techHtml}

  <h2>Behavioral Questions & STAR Answers</h2>
  ${behHtml}

  <h2>Preparation Roadmap</h2>
  ${planHtml}
</body>
</html>`;
}

async function generateReportPdf(reportData) {
  const cacheKey = getCacheKey({
    reportId: reportData._id,
    type: "report-pdf",
  });
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.info("CACHE HIT (report-pdf)");
    return cached;
  }

  const html = ensureReportHTML(reportData);
  const pdf = await generatePdfFromHtml(html);
  cache.set(cacheKey, pdf);
  return pdf;
}

async function generateCoverLetterPdf({ resume, jobDescription, selfDescription }) {
  const cacheKey = getCacheKey({ resume, jobDescription, selfDescription, type: "cover-letter" });
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.info("CACHE HIT (cover-letter)");
    return cached;
  }

  const prompt = `You are an expert executive coach and career strategist. Write a tailored, highly professional cover letter for the candidate based on their resume/profile and the target job description. The cover letter must feel authentic, compelling, and written by a human. Do not use generic AI buzzwords like "synergy", "spearheaded", "passionately", or "thrilled". Write in a direct, confident, and professional tone.

Return ONLY a valid JSON object in this exact format:
{"html": "<inner body HTML here>"}

Do NOT wrap in <html>, <head>, or <body> tags. Use a clean, modern layout with a top header block (name, contact, date, recipient), standard opening, 3 body paragraphs (hook, professional background matching JD, closing/call-to-action), and professional sign-off.

To ensure visual consistency with the candidate's resume, please format the top of the cover letter with this HTML structure:
<div class="resume-header">
  <div class="resume-name">Candidate Name</div>
  <div class="resume-tagline">Cover Letter for [Target Role Title]</div>
  <div class="resume-contact-line">
    City, Country | +XX XXXXXXXXXX | email@example.com | <a href="linkedin_url">linkedin.com/in/handle</a>
  </div>
</div>
<div class="cover-letter-meta">
  <div class="date-line">Date</div>
  <div class="recipient-info">Recipient Name/Title<br>Company Name<br>Company Address</div>
</div>

━━━ CANDIDATE DATA ━━━
RESUME:
${resume || "(not provided)"}
SELF DESCRIPTION:
${selfDescription || "(not provided)"}
JOB DESCRIPTION:
${jobDescription || "(not provided)"}`;

  const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));

  const providers = [
    async () => {
      logger.info("Cover Letter → Gemini 2.0-flash");
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        }),
        timeout(35000),
      ]);
      return res.text;
    },
    async () => {
      logger.info("Cover Letter → Gemini 1.5-flash");
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        }),
        timeout(35000),
      ]);
      return res.text;
    },
    async () => {
      logger.info("Cover Letter → Groq llama-3.3-70b");
      const res = await Promise.race([
        axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: "json_object" },
          },
          { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } },
        ),
        timeout(30000),
      ]);
      if (res.data.error) throw new Error(res.data.error.message);
      return res.data.choices[0].message.content;
    }
  ];

  for (const provider of providers) {
    try {
      const raw = await provider();
      let html = extractHTML(raw);
      if (!html) throw new Error("Empty HTML response");

      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --navy:   #1B3A5C;
      --gold:   #C8A96E;
      --ink:    #2D2D2D;
      --muted:  #5C6470;
      --rule:   #D6D0C8;
      --paper:  #FAFAF8;
    }
    @page {
      size: A4;
      margin: 20mm 20mm 20mm 20mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 10pt;
      font-weight: 300;
      line-height: 1.6;
      color: var(--ink);
      background: var(--paper);
      width: 170mm;
      margin: 0 auto;
    }
    /* ── HEADER (MATCHING RESUME) ─────────────────────────── */
    .resume-header {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding-bottom: 10px;
      margin-bottom: 20px;
      border-bottom: 2px solid var(--navy);
      position: relative;
    }
    .resume-header::before {
      content: '';
      display: block;
      width: 100%;
      height: 1px;
      background: var(--gold);
      margin-bottom: 9px;
    }
    .resume-name {
      font-family: 'Playfair Display', 'Times New Roman', serif;
      font-size: 26pt;
      font-weight: 700;
      color: var(--navy);
      letter-spacing: -0.3px;
      line-height: 1.1;
      margin-bottom: 2px;
    }
    .resume-tagline {
      font-family: 'DM Sans', sans-serif;
      font-size: 9.3pt;
      font-weight: 500;
      color: var(--gold);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 7px;
    }
    .resume-contact-line {
      font-family: 'DM Sans', sans-serif;
      font-size: 8.3pt;
      font-weight: 400;
      color: var(--muted);
      letter-spacing: 0.1px;
      line-height: 1.6;
    }
    a {
      color: var(--navy);
      text-decoration: none;
    }
    /* ── COVER LETTER LAYOUT ───────────────────────────────── */
    .cover-letter-meta {
      font-family: 'DM Sans', sans-serif;
      font-size: 9.5pt;
      color: var(--muted);
      margin-bottom: 25px;
      line-height: 1.5;
    }
    .date-line {
      font-weight: 500;
      margin-bottom: 12px;
    }
    .recipient-info {
      margin-bottom: 10px;
    }
    p {
      margin-bottom: 16px;
      text-align: justify;
    }
    .signature {
      margin-top: 30px;
    }
  </style>
</head>
<body>${html}</body>
</html>`;
      const pdf = await generatePdfFromHtml(fullHtml);
      cache.set(cacheKey, pdf);
      return pdf;
    } catch (err) {
      logger.error("❌ Cover letter provider failed: %s", err.message);
    }
  }
  throw new Error("All cover letter providers failed");
}

/**
 * Returns combined mapped questions from report generation with robust multi-tier fallback.
 * Guarantees unique, highly tailored questions based on Target Job Description and Candidate Context.
 */
async function generateQuestionSet({ resume, jobDescription, selfDescription, difficulty }) {
  await rateLimit();

  const uniqueSeed = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

  const candidateContext = [];
  if (resume && resume.trim()) {
    candidateContext.push(`RESUME CONTENT:\n${resume.trim()}`);
  }
  if (selfDescription && selfDescription.trim()) {
    candidateContext.push(`CANDIDATE SELF-DESCRIPTION & SKILLS:\n${selfDescription.trim()}`);
  }

  const prompt = `You are an elite technical interviewer and recruiter.
Generate a set of 5 UNIQUE, realistic, and highly specific interview questions (3 technical, 2 behavioral) customized specifically for the target job description and the candidate's context.

━ TARGET JOB DESCRIPTION ━
${jobDescription}

━ CANDIDATE CONTEXT ━
${candidateContext.length > 0 ? candidateContext.join("\n\n") : "No resume/profile provided."}

━ DIFFICULTY LEVEL ━
${difficulty || "mid"}

━ INSTRUCTIONS FOR UNIQUENESS ━
- Unique Session Seed: ${uniqueSeed}
- Do NOT generate generic or repetitive questions.
- Reference specific skills, tools, frameworks, responsibilities, or scenarios mentioned in the candidate's resume/description and job description.
- For technical questions: focus on architecture, code quality, trade-offs, and practical problem-solving for the required stack.
- For behavioral questions: focus on team collaboration, conflict resolution, project delivery, and past achievements.

Return ONLY a valid JSON array of 5 objects in this exact schema with no markdown formatting:
[
  {
    "question": "string (the interview question)",
    "modelAnswer": "string (comprehensive guidance for a top-scoring response)"
  }
]`;

  const providers = [
    async () => {
      logger.info("Generating Unique Mock Questions → Gemini 2.0-flash");
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.8,
          },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 25000)),
      ]);
      return res.text;
    },
    async () => {
      logger.info("Generating Unique Mock Questions → Gemini 1.5-flash");
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.8,
          },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 25000)),
      ]);
      return res.text;
    },
    async () => {
      if (!process.env.GROQ_API_KEY) throw new Error("No Groq API key");
      logger.info("Generating Unique Mock Questions → Groq llama-3.3-70b");
      const res = await Promise.race([
        axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.8,
            response_format: { type: "json_object" },
          },
          { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 25000)),
      ]);
      return res.data.choices[0].message.content;
    }
  ];

  for (const provider of providers) {
    try {
      const raw = await provider();
      const parsed = safeParse(raw);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        return parsed.map((item) => ({
          question: item.question || "Can you describe a challenging project you worked on?",
          modelAnswer: item.modelAnswer || "Explain the problem, solution, technologies used, and key outcome.",
        }));
      }
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length >= 3) {
        return parsed.questions.map((item) => ({
          question: item.question || "Can you describe a challenging project you worked on?",
          modelAnswer: item.modelAnswer || "Explain the problem, solution, technologies used, and key outcome.",
        }));
      }
    } catch (e) {
      logger.error("Unique Questions Provider failed: %s", e.message);
    }
  }

  // Dynamic fallback incorporating JD and Context keywords
  logger.info("Using dynamic fallback questions for mock interview");
  const extractedSkills = Array.from(new Set(
    (jobDescription + " " + (selfDescription || "") + " " + (resume || ""))
      .match(/\b(React|Node|JavaScript|TypeScript|Python|Java|C\+\+|Go|Rust|Docker|Kubernetes|AWS|Azure|SQL|MongoDB|PostgreSQL|GraphQL|REST|System Design|Microservices|CI\/CD|Tailwind|Redux|Next\.js|Git)\b/gi) || ["Software Engineering", "System Architecture"]
  )).join(", ");

  const roleTitle = jobDescription.split("\n")[0].substring(0, 50).trim() || "target position";

  return [
    {
      question: `Walk me through your background and technical experience in ${extractedSkills}. How have you applied these skills to deliver results relevant to this ${roleTitle} position?`,
      modelAnswer: `Detail specific projects utilizing ${extractedSkills}, focusing on system design, technical decisions, and tangible outcomes.`
    },
    {
      question: `When building applications requiring ${extractedSkills}, how do you ensure high performance, security, and scalability under heavy load?`,
      modelAnswer: "Focus on clean modular code, query optimization, caching strategies, asynchronous processing, and defensive error handling."
    },
    {
      question: `Describe a complex technical problem you encountered while working with ${extractedSkills}. What was your diagnostic strategy and how did you resolve it?`,
      modelAnswer: "Use the STAR approach (Situation, Task, Action, Result) outlining root cause analysis, debugging tools used, and testing."
    },
    {
      question: `How do you handle architectural trade-offs when business deadlines require fast delivery vs long-term technical debt?`,
      modelAnswer: "Discuss pragmatic engineering, refactoring strategies, stakeholder alignment, and incremental improvements."
    },
    {
      question: `Tell me about a situation where you had to collaborate with cross-functional team members to deliver a feature under tight constraints.`,
      modelAnswer: "Emphasize clear communication, agile iteration, code reviews, and proactive problem solving."
    }
  ];
}

/**
 * Score a single mock interview question answer.
 * Highly responsive, lightweight, minimal prompt.
 */
async function scoreMockAnswer({ question, modelAnswer, userAnswer }) {
  await rateLimit();

  const systemPrompt = `You are a senior technical interviewer. Evaluate the candidate's answer to the given question.
Compare it with the modelAnswer for guidance.
Return ONLY valid JSON in this exact schema, no other text or markdown:
{
  "score": number(0-10),
  "feedback": "1-2 sentences of feedback"
}`;

  const userContent = `Question: ${question}
Model Answer: ${modelAnswer}
Candidate Answer: ${userAnswer}`;

  const prompt = systemPrompt + "\n\n" + userContent;

  const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));

  const providers = [
    async () => {
      logger.info("Score Answer → Gemini 2.0-flash");
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        }),
        timeout(15000), // aggressive timeout for fast UX
      ]);
      return res.text;
    },
    async () => {
      logger.info("Score Answer → Gemini 1.5-flash");
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        }),
        timeout(15000),
      ]);
      return res.text;
    },
    async () => {
      logger.info("Score Answer → Groq");
      const res = await Promise.race([
        axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" },
          },
          { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
        ),
        timeout(20000),
      ]);
      if (res.data.error) throw new Error(res.data.error.message);
      return res.data.choices[0].message.content;
    }
  ];

  for (const provider of providers) {
    try {
      const raw = await provider();
      const parsed = safeParse(raw);
      if (parsed && typeof parsed.score === "number" && typeof parsed.feedback === "string") {
        return parsed;
      }
      throw new Error("Invalid score response structure");
    } catch (err) {
      logger.error("❌ Score Answer Provider failed: %s", err.message);
    }
  }

  throw new Error("All answer scoring providers failed");
}

/**
 * Standalone quick-check ATS score logic.
 */
async function checkAtsScore({ resumeText, jobDescription = "" }) {
  const cacheKey = getCacheKey({ resumeText, jobDescription, type: "ats-score" });
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.info("CACHE HIT (ats-score)");
    return cached;
  }

  await rateLimit();

  const prompt = `You are an expert resume reviewer and ATS (Applicant Tracking System) specialist.
Analyze the candidate's resume text against the target job description.

Return ONLY a valid JSON object in this exact schema, with no other text or markdown:
{
  "atsScore": number (0-100),
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "issue": "string description of the issue",
      "fix": "string recommendation to fix it"
    }
  ],
  "strengths": [
    "string describing a strength of the resume"
  ]
}

━━━ RESUME TEXT ━━━
${resumeText}

━━━ JOB DESCRIPTION ━━━
${jobDescription || "(not provided)"}`;

  const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));

  const providers = [
    async () => {
      logger.info("ATS Check → Gemini 2.0-flash");
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
        timeout(20000),
      ]);
      return res.text;
    },
    async () => {
      logger.info("ATS Check → Gemini 1.5-flash");
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
        timeout(20000),
      ]);
      return res.text;
    },
    async () => {
      logger.info("ATS Check → Groq llama-3.3-70b");
      const res = await Promise.race([
        axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            response_format: { type: "json_object" },
          },
          { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
        ),
        timeout(20000),
      ]);
      if (res.data.error) throw new Error(res.data.error.message);
      return res.data.choices[0].message.content;
    }
  ];

  for (const provider of providers) {
    try {
      const raw = await provider();
      const parsed = safeParse(raw);
      if (parsed && typeof parsed.atsScore === "number" && Array.isArray(parsed.issues) && Array.isArray(parsed.strengths)) {
        cache.set(cacheKey, parsed);
        return parsed;
      }
      throw new Error("Invalid ATS Check response structure");
    } catch (err) {
      logger.error("❌ ATS Check Provider failed: %s", err.message);
    }
  }

  throw new Error("All ATS checking providers failed");
}

module.exports = {
  generateInterviewReport,
  generateResumePdf,
  generateReportPdf,
  generateCoverLetterPdf,
  generateQuestionSet,
  scoreMockAnswer,
  checkAtsScore,
};
