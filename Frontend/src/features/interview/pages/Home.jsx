import { NavLink } from "react-router";
import {
  Sparkles,
  Cpu,
  Target,
  MessageSquareCode,
  Mic,
  BrainCircuit,
  FileCheck,
  TrendingUp,
  Share2,
  Download,
  Zap,
  ShieldCheck,
  ArrowRight,
  Bot,
  CheckCircle2,
  RefreshCw,
  Clock,
  Award,
} from "lucide-react";
import styles from "../styles/home.module.scss";

const STATS = [
  { num: "50K+", label: "Resumes Analyzed", sub: "Deep semantic PDF parsing" },
  { num: "98.4%", label: "ATS Match Accuracy", sub: "Driven by Google Gemini AI" },
  { num: "~10-25s", label: "Deep Report Generation", sub: "Comprehensive 7-part analysis" },
  { num: "99.9%", label: "Uptime Reliability", sub: "Multi-Model Fallback Chain" },
];

const AI_MODEL_HIGHLIGHTS = [
  {
    icon: Bot,
    title: "Primary AI Engine: Gemini 2.5 Flash",
    desc: "Powered by Google's flagship Gemini 2.5 Flash model for deep context extraction across complex PDF resumes and multi-page job descriptions.",
  },
  {
    icon: RefreshCw,
    title: "Multi-Model Fallback Chain",
    desc: "Built-in automated failover chain (Gemini 2.5 Flash → Gemini Flash Lite → Groq Llama 3.3 70B) ensuring zero downtime and 100% report delivery.",
  },
  {
    icon: Clock,
    title: "Thorough Deep Scan (~10–25s)",
    desc: "Performs rigorous multi-pass analysis to evaluate ATS scores, formatting flaws, STAR interview scenarios, skill severity, and a 7-day plan.",
  },
  {
    icon: Mic,
    title: "Real-Time Voice Scoring (~2–4s)",
    desc: "Instant voice & text answer evaluation during live mock interviews, providing immediate constructive feedback and missing key points.",
  },
];

const STEPS = [
  {
    n: "01",
    badge: "INPUT STAGE",
    icon: "📄",
    title: "Upload Resume & Job Link",
    desc: "Upload your existing PDF or DOCX resume and paste the target job description to establish the baseline context.",
  },
  {
    n: "02",
    badge: "AI DEEP SCAN",
    icon: "⚡",
    title: "Gemini AI Multi-Pass Analysis",
    desc: "Google Gemini AI spends ~10–25s conducting deep semantic matching, ATS screening, and STAR question synthesis.",
  },
  {
    n: "03",
    badge: "ACTION & PREP",
    icon: "🎯",
    title: "Practice & Export ATS PDF",
    desc: "Review your match score, practice voice mock interviews with instant grading, follow your 7-day plan, and download ATS PDFs.",
  },
];

const FEATURES = [
  {
    icon: FileCheck,
    tag: "ATS Optimization",
    title: "ATS Match & Compliance Scanner",
    desc: "Calculates an exact 0-100% compatibility score with line-by-line breakdowns of missing keywords, formatting errors, and resume strengths.",
  },
  {
    icon: MessageSquareCode,
    tag: "Tailored Prep",
    title: "STAR-Method Interview Coach",
    desc: "Generates custom technical & behavioral questions mapped directly to your background and the target role — complete with ideal STAR answers.",
  },
  {
    icon: Mic,
    tag: "Live Feedback",
    title: "Speech-to-Text Mock Practice",
    desc: "Answer mock questions verbally using speech-to-text or by typing. Gemini AI grades your answer in ~2-4s with actionable feedback.",
  },
  {
    icon: BrainCircuit,
    tag: "Gap Analysis",
    title: "Skill Severity Breakdown",
    desc: "Pinpoint missing technical stack items and soft skills graded by severity (High, Medium, Low) so you focus on what recruiters actually care about.",
  },
  {
    icon: TrendingUp,
    tag: "Structured Strategy",
    title: "7-Day Action Roadmap",
    desc: "Follow a structured, day-by-day action plan featuring study goals, practical scenario tasks, and curated learning links.",
  },
  {
    icon: Download,
    tag: "PDF Generation",
    title: "ATS Resume & Cover Letter Builder",
    desc: "Generate clean, editorial-grade, ATS-compliant PDF resumes and role-tailored cover letters built from your analysis data.",
  },
  {
    icon: Share2,
    tag: "Collaboration",
    title: "Shareable Mentor Reports",
    desc: "Generate a secure read-only link for any report so career counselors or mentors can review your prep without creating an account.",
  },
  {
    icon: ShieldCheck,
    tag: "Data Security",
    title: "Private Dashboard & History",
    desc: "Your uploaded resumes and generated report history are securely stored in your private dashboard for continuous session tracking.",
  },
];

const COMPARISON = [
  {
    feature: "AI Model & Fallback Architecture",
    generic: "Static question banks / No AI",
    genie: "Google Gemini 2.5 Flash + Fallback Chain (Gemini Lite & Llama 3.3)",
  },
  {
    feature: "Personalization Depth",
    generic: "Generic templates & hardcoded prompts",
    genie: "100% Context-Aware: Resume PDF + Job Description Synthesis",
  },
  {
    feature: "Mock Interview Mode",
    generic: "Static text list without evaluation",
    genie: "Live Speech-to-Text Practice with ~2-4s Real-Time AI Scoring",
  },
  {
    feature: "Answer Feedback",
    generic: "No scoring or superficial feedback",
    genie: "STAR Method scoring, missing key points, & ideal response tips",
  },
  {
    feature: "Processing Time & Depth",
    generic: "Instant generic output (< 1s)",
    genie: "Rigorous ~10–25s Deep Scan for 7-Part Comprehensive Analysis",
  },
  {
    feature: "ATS Resume & Cover Letter",
    generic: "Paywalled template download",
    genie: "Editorial-Grade ATS PDF & Tailored Cover Letter Included",
  },
];

const Home = () => (
  <div className={styles.page}>
    {/* ── HERO SECTION ── */}
    <section className={styles.hero}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />
      <span className={`${styles.sparkle} ${styles.s1}`}>✦</span>
      <span className={`${styles.sparkle} ${styles.s2}`}>✦</span>
      <span className={`${styles.sparkle} ${styles.s3}`}>✦</span>
      <span className={`${styles.sparkle} ${styles.s4}`}>✦</span>

      <div className={styles.heroContent}>
        <div className={styles.heroBadge}>
          <Sparkles size={14} color="var(--gold-light)" />
          <span>POWERED BY GOOGLE GEMINI AI • MULTI-MODEL FALLBACK CHAIN</span>
        </div>

        <h1 className={styles.heroTitle}>
          Land Your Dream Job
          <br />
          with
          <br />
          <em className={styles.magic}>JobGenie</em>
        </h1>

        <p className={styles.heroSub}>
          Upload your resume, paste a job description, and let <strong>Google Gemini AI</strong> execute a thorough deep scan (~10–25s) to deliver ATS match scores, STAR mock questions, skill gap analysis, a 7-day preparation roadmap, and ATS resumes.
        </p>

        <div className={styles.heroBtns}>
          <NavLink to="/interview" className="btn-primary">
            ✦ Analyze My Resume Free
          </NavLink>
          <a href="#how" className="btn-ghost">
            See How It Works <ArrowRight size={16} />
          </a>
        </div>

        {/* AI Tech Specification Strip */}
        <div className={styles.aiSpecStrip}>
          <div className={styles.specItem}>
            <Zap size={15} color="var(--gold-light)" />
            <span><strong>Primary:</strong> Gemini 2.5 Flash</span>
          </div>
          <div className={styles.specDivider} />
          <div className={styles.specItem}>
            <RefreshCw size={15} color="var(--purple)" />
            <span><strong>Fallback AI:</strong> Gemini Lite &amp; Llama 3.3</span>
          </div>
          <div className={styles.specDivider} />
          <div className={styles.specItem}>
            <Clock size={15} color="var(--gold-light)" />
            <span><strong>Deep Scan:</strong> ~10–25s Thorough Analysis</span>
          </div>
        </div>
      </div>
    </section>

    {/* ── STATS SECTION ── */}
    <section className={styles.statsWrap}>
      <div className={styles.statsGrid}>
        {STATS.map(({ num, label, sub }) => (
          <div key={label} className={styles.statCard}>
            <span className={styles.statNum}>{num}</span>
            <span className={styles.statLabel}>{label}</span>
            <span className={styles.statSub}>{sub}</span>
          </div>
        ))}
      </div>
    </section>

    {/* ── AI ARCHITECTURE SECTION ── */}
    <section className={styles.aiAdvantageWrap}>
      <div className={styles.sectionHead}>
        <span className="section-label">AI Architecture &amp; Reliability</span>
        <h2 className="section-title">Driven by Google Gemini &amp; Multi-Model Fallback</h2>
        <p className="section-sub">
          JobGenie pairs Google Gemini 2.5 Flash with an intelligent multi-provider fallback chain to ensure 100% report delivery and authentic, deep resume analysis.
        </p>
      </div>

      <div className={styles.aiGrid}>
        {AI_MODEL_HIGHLIGHTS.map((item) => {
          const IconComp = item.icon;
          return (
            <div key={item.title} className={styles.aiCard}>
              <div className={styles.aiCardIcon}>
                <IconComp size={24} color="var(--gold-light)" />
              </div>
              <h3 className={styles.aiCardTitle}>{item.title}</h3>
              <p className={styles.aiCardDesc}>{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>

    {/* ── HOW IT WORKS SECTION ── */}
    <section className={styles.how} id="how">
      <div className={styles.sectionHead}>
        <span className="section-label">Simple Process</span>
        <h2 className="section-title">How JobGenie Works</h2>
        <p className="section-sub">
          Three simple steps to transform your resume into a job-winning interview strategy
        </p>
      </div>

      <div className={styles.steps}>
        {STEPS.map(({ n, badge, icon, title, desc }) => (
          <div key={n} className={styles.step}>
            <div className={styles.stepHeader}>
              <span className={styles.stepNum}>{n}</span>
              <span className={styles.stepBadge}>{badge}</span>
            </div>
            <div className={styles.stepIcon}>{icon}</div>
            <h3 className={styles.stepTitle}>{title}</h3>
            <p className={styles.stepDesc}>{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── FEATURES GRID ── */}
    <section className={styles.featuresWrap} id="features">
      <div className={styles.sectionHead}>
        <span className="section-label">Complete Feature Suite</span>
        <h2 className="section-title">Everything You Need to Get Hired</h2>
        <p className="section-sub">
          Comprehensive AI tools engineered to give job seekers an unbeatable competitive edge
        </p>
      </div>

      <div className={styles.featGrid}>
        {FEATURES.map((feat) => {
          const IconComponent = feat.icon;
          return (
            <div key={feat.title} className={styles.featCard}>
              <div className={styles.featTag}>
                <span>{feat.tag}</span>
              </div>
              <div className={styles.featIcon}>
                <IconComponent size={22} color="var(--gold-light)" strokeWidth={2} />
              </div>
              <h3 className={styles.featTitle}>{feat.title}</h3>
              <p className={styles.featDesc}>{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </section>

    {/* ── COMPARISON MATRIX ── */}
    <section className={styles.comparisonWrap}>
      <div className={styles.sectionHead}>
        <span className="section-label">Why Choose Us</span>
        <h2 className="section-title">JobGenie vs Generic Tools</h2>
        <p className="section-sub">
          Compare traditional static question tools with JobGenie's Google Gemini AI multi-model analysis engine
        </p>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.compTable}>
          <thead>
            <tr>
              <th style={{ width: "28%" }}>Feature</th>
              <th style={{ width: "32%" }}>Generic Tools</th>
              <th className={styles.genieHeader} style={{ width: "40%" }}>
                <Sparkles size={16} color="var(--gold-light)" /> JobGenie (Gemini AI + Fallback)
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map(({ feature, generic, genie }) => (
              <tr key={feature}>
                <td className={styles.featName}>{feature}</td>
                <td className={styles.genericCell}>{generic}</td>
                <td className={styles.genieCell}>
                  <CheckCircle2 size={18} color="var(--gold-light)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{genie}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    {/* ── CTA SECTION ── */}
    <section className={styles.ctaWrap}>
      <div className={styles.ctaCard}>
        <div className={styles.ctaDots} />
        <div className={styles.ctaOrb} />
        <div className={styles.ctaBadge}>
          <Award size={16} color="var(--gold-light)" />
          <span>100% Free AI Career Platform</span>
        </div>
        <h2 className={styles.ctaTitle}>Ready to land your dream job?</h2>
        <p className={styles.ctaSub}>
          Upload your resume and target job description now. Experience Google Gemini AI-powered mock prep, ATS scores, and 7-day preparation roadmaps.
        </p>
        <NavLink to="/interview" className="btn-primary">
          ✦ Start Free Analysis Now
        </NavLink>
      </div>
    </section>
  </div>
);

export default Home;
