import { NavLink } from "react-router";
import { Target, MessageCircle, Mic, Brain, FileText, TrendingUp, Share2 } from "lucide-react";
import styles from "../styles/home.module.scss";

const STATS = [
  { num: "50K+", label: "Resumes Analyzed" },
  { num: "94%", label: "Match Accuracy" },
  { num: "4.9★", label: "User Rating" },
];

const STEPS = [
  {
    n: "01",
    icon: "📄",
    title: "Upload Resume",
    desc: "PDF accepted. AI reads every detail.",
  },
  {
    n: "02",
    icon: "🧠",
    title: "AI Analysis",
    desc: "Deep scan against job requirements in seconds.",
  },
  {
    n: "03",
    icon: "📊",
    title: "Get Your Report",
    desc: "Score, skill gaps, tailored interview questions, a cover letter, and live mock practice — all from one upload.",
  },
];

const FEATURES = [
  {
    icon: Target,
    title: "ATS Score Checker",
    desc: "Get a compliance score plus a line-by-line breakdown of exactly what's blocking automated screening — before a recruiter ever sees your resume.",
  },
  {
    icon: MessageCircle,
    title: "AI Interview Coach",
    desc: "Technical and behavioral questions generated from the real job description and your actual background — not a generic question bank.",
  },
  {
    icon: Mic,
    title: "Interactive Mock Interview",
    desc: "Answer one question at a time by typing or speaking, and get real-time AI scoring and feedback — the closest thing to the real interview, without the stakes.",
  },
  {
    icon: Brain,
    title: "Skill Gap Analysis",
    desc: "See exactly which skills separate you from the role, ranked by what actually matters for that specific job — not a generic checklist.",
  },
  {
    icon: FileText,
    title: "Cover Letter Generator",
    desc: "A tailored cover letter built from your resume and the job description, generated in the same pass as your interview prep.",
  },
  {
    icon: TrendingUp,
    title: "Prep Dashboard",
    desc: "Track your match score and skill gaps across every job you prep for, so you can see real improvement session over session.",
  },
  {
    icon: Share2,
    title: "Share With a Mentor",
    desc: "Generate a read-only link to any report so a mentor or career counselor can review your prep without needing an account.",
  },
];

const Home = () => (
  <div className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />
      <span className={`${styles.sparkle} ${styles.s1}`}>✦</span>
      <span className={`${styles.sparkle} ${styles.s2}`}>✦</span>
      <span className={`${styles.sparkle} ${styles.s3}`}>✦</span>
      <span className={`${styles.sparkle} ${styles.s4}`}>✦</span>

      <div className={styles.heroContent}>
        <div className={styles.heroBadge}>✦ AI-Powered Resume Analyzer</div>
        <h1 className={styles.heroTitle}>
          Land Your Dream Job
          <br />
          with <em className={styles.magic}>Magic</em>
        </h1>
        <p className={styles.heroSub}>
          Upload your resume, paste a job description, and let our AI genie
          reveal your match score, skill gaps, and exactly what to improve.
        </p>
        <div className={styles.heroBtns}>
          <NavLink to="/interview" className="btn-primary">
            ✦ Analyze My Resume
          </NavLink>
          <a href="#how" className="btn-ghost">
            See How It Works
          </a>
        </div>
      </div>
    </section>

    <section className={styles.statsWrap}>
      <div className={styles.statsGrid}>
        {STATS.map(({ num, label }) => (
          <div key={label} className={styles.statCard}>
            <span className={styles.statNum}>{num}</span>
            <span className={styles.statLabel}>{label}</span>
          </div>
        ))}
      </div>
    </section>

    <section className={styles.how} id="how">
      <div className={styles.sectionHead}>
        <span className="section-label">Simple Process</span>
        <h2 className="section-title">How It Works</h2>
        <p className="section-sub">
          Three simple steps to unlock your career potential
        </p>
      </div>
      <div className={styles.steps}>
        {STEPS.map(({ n, icon, title, desc }, i) => (
          <div key={n} className={styles.step}>
            <div className={styles.stepNum}>{n}</div>
            {i < STEPS.length - 1 && <div className={styles.connector} />}
            <div className={styles.stepIcon}>{icon}</div>
            <h3 className={styles.stepTitle}>{title}</h3>
            <p className={styles.stepDesc}>{desc}</p>
          </div>
        ))}
      </div>
    </section>

    <section className={styles.featuresWrap}>
      <div className={styles.sectionHead}>
        <span className="section-label">Capabilities</span>
        <h2 className="section-title">Everything You Need</h2>
        <p className="section-sub" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          Powerful AI tools to give you a competitive edge
        </p>
      </div>
      <div className={styles.featGrid}>
        {FEATURES.map(({ icon, title, desc }) => {
          const IconComponent = icon;
          return (
            <div key={title} className={styles.featCard}>
              <div className={styles.featIcon}>
                <IconComponent size={22} color="var(--gold-light)" strokeWidth={2} />
              </div>
              <h3 className={styles.featTitle}>{title}</h3>
              <p className={styles.featDesc}>{desc}</p>
            </div>
          );
        })}
      </div>
    </section>

    <section className={styles.ctaWrap}>
      <div className={styles.ctaCard}>
        <div className={styles.ctaDots} />
        <div className={styles.ctaOrb} />
        <h2 className={styles.ctaTitle}>Ready to land your dream job?</h2>
        <p className={styles.ctaSub}>
          Join thousands of job seekers who found their perfect role with
          JobGenie's AI-powered career insights.
        </p>
        <NavLink to="/interview" className="btn-primary">
          ✦ Start Analyzing Free
        </NavLink>
      </div>
    </section>
  </div>
);

export default Home;
