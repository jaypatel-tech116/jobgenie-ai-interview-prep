import React, { useState, useEffect } from "react";
import "../styles/interview.scss";
import { useInterview } from "../hooks/useInterview.js";
import { useParams } from "react-router";
import { useToast } from "../../../components/Toast/ToastContext";
import { SkeletonBlock } from "../../../components/Skeleton/Skeleton";

const NAV_ITEMS = [
  {
    id: "technical",
    label: "Technical Questions",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: "behavioral",
    label: "Behavioral Questions",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "roadmap",
    label: "Road Map",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </svg>
    ),
  },
  {
    id: "ats",
    label: "ATS Score",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
      </svg>
    ),
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="q-card">
      <div className="q-card__header" onClick={() => setOpen((o) => !o)}>
        <span className="q-card__index">Q{index + 1}</span>
        <p className="q-card__question">{item.question}</p>
        <span
          className={`q-card__chevron ${open ? "q-card__chevron--open" : ""}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {open && (
        <div className="q-card__body">
          <div className="q-card__section">
            <span className="q-card__tag q-card__tag--intention">
              Intention
            </span>
            <p>{item.intention}</p>
          </div>
          <div className="q-card__section">
            <span className="q-card__tag q-card__tag--answer">
              Model Answer
            </span>
            <p>{item.answer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const RoadMapDay = ({ day }) => (
  <div className="roadmap-day">
    <div className="roadmap-day__header">
      <span className="roadmap-day__badge">Day {day.day}</span>
      <h3 className="roadmap-day__focus">{day.focus}</h3>
    </div>
    <ul className="roadmap-day__tasks">
      {(day.tasks || []).map((task, i) => (
        <li key={i}>
          <span className="roadmap-day__bullet" />
          {task}
        </li>
      ))}
    </ul>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
  const [activeNav, setActiveNav] = useState("technical");
  const {
    report,
    reports,
    getReportById,
    getReports,
    loading,
    getResumePdf,
    getReportPdf,
    updateReportTitle,
    getCoverLetterPdf,
  } = useInterview();
  const { interviewId } = useParams();
  const [downloading, setDownloading] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [downloadingCoverLetter, setDownloadingCoverLetter] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isInitialMount, setIsInitialMount] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (interviewId) {
      setIsInitialMount(true);
      getReportById(interviewId).finally(() => {
        setIsInitialMount(false);
      });
    }
  }, [interviewId, getReportById]);

  // Load history list for compare view
  useEffect(() => {
    getReports();
  }, [getReports]);

  const handleSaveTitle = async () => {
    if (!editTitle.trim()) {
      toast.warning("Title cannot be empty.");
      return;
    }
    try {
      await updateReportTitle(interviewId, editTitle);
      toast.success("Title updated successfully!");
      setIsEditing(false);
    } catch {
      toast.error("Failed to update title.");
    }
  };

  const sidebarActionsMarkup = (
    <div className="sidebar-actions">
      {/* Download Resume Button */}
      <button
        onClick={async () => {
          if (!interviewId) {
            toast.error("Invalid interview ID");
            return;
          }

          try {
            setDownloading(true);
            await getResumePdf(interviewId);
            toast.success("Resume downloaded successfully!");
          } catch (err) {
            console.error(err);
            toast.error("Download failed. Please try again.");
          } finally {
            setDownloading(false);
          }
        }}
        className="action-btn action-btn--primary"
        disabled={downloading || !interviewId}
      >
        <svg
          height="0.9rem"
          style={{ marginRight: "0.5rem" }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M10.6144 17.7956L11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916 0.821765 9.19319 0.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C0.868537 9.26368 0.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956Z" />
        </svg>
        {downloading ? "Downloading..." : "Download Resume"}
      </button>

      {/* Download Q&A Report Button */}
      <button
        onClick={async () => {
          if (!interviewId) {
            toast.error("Invalid interview ID");
            return;
          }

          try {
            setDownloadingReport(true);
            await getReportPdf(interviewId);
            toast.success("Interview report PDF downloaded successfully!");
          } catch (err) {
            console.error(err);
            toast.error("Download failed. Please try again.");
          } finally {
            setDownloadingReport(false);
          }
        }}
        className="action-btn action-btn--secondary"
        disabled={downloadingReport || !interviewId}
      >
        <svg
          height="0.9rem"
          style={{ marginRight: "0.5rem" }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {downloadingReport ? "Downloading..." : "Download Q&A Report"}
      </button>

      {/* Generate Cover Letter Button */}
      <button
        onClick={async () => {
          if (!interviewId) {
            toast.error("Invalid interview ID");
            return;
          }

          try {
            setDownloadingCoverLetter(true);
            await getCoverLetterPdf(interviewId);
            toast.success("Cover letter PDF generated & downloaded!");
          } catch (err) {
            console.error(err);
            toast.error("Generation failed. Please try again.");
          } finally {
            setDownloadingCoverLetter(false);
          }
        }}
        className="action-btn action-btn--secondary"
        disabled={downloadingCoverLetter || !interviewId}
      >
        <svg
          height="0.9rem"
          style={{ marginRight: "0.5rem" }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        {downloadingCoverLetter ? "Generating..." : "Generate Cover Letter"}
      </button>

      {/* Share Prep Link Button */}
      <button
        onClick={() => {
          if (report.shareToken) {
            const shareUrl = `${window.location.origin}/shared/${report.shareToken}`;
            navigator.clipboard.writeText(shareUrl);
            toast.success("Shareable mentor link copied to clipboard!");
          } else {
            toast.error("Share token not found for this report.");
          }
        }}
        className="action-btn action-btn--outline"
      >
        <svg
          height="0.9rem"
          style={{ marginRight: "0.5rem" }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share Prep Link
      </button>
    </div>
  );

  if (loading || isInitialMount) {
    return (
      <div className="interview-page">
        {/* Title Header Skeleton */}
        <div className="report-header">
          <SkeletonBlock width="350px" height="32px" />
        </div>

        <div className="interview-layout">
          {/* Left Nav Skeleton */}
          <nav className="interview-nav">
            <div className="nav-content">
              <div style={{ marginBottom: "16px" }}><SkeletonBlock width="80px" height="16px" /></div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ marginBottom: "12px" }}>
                  <SkeletonBlock width="100%" height="40px" borderRadius="var(--radius-md)" />
                </div>
              ))}
            </div>
            <div className="nav-actions">
              <div className="sidebar-actions" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[1, 2, 3].map((i) => (
                  <SkeletonBlock key={i} width="100%" height="42px" borderRadius="var(--radius-md)" />
                ))}
              </div>
            </div>
          </nav>

          <div className="interview-divider" />

          {/* Center Content Skeleton */}
          <main className="interview-content">
            <section>
              <div className="content-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <SkeletonBlock width="220px" height="28px" />
                <SkeletonBlock width="80px" height="20px" borderRadius="10px" />
              </div>
              <div className="q-list">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="q-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <SkeletonBlock width="100%" height="20px" />
                    <SkeletonBlock width="70%" height="16px" />
                  </div>
                ))}
              </div>
            </section>
          </main>

          <div className="interview-divider" />

          {/* Right Sidebar Skeleton */}
          <aside className="interview-sidebar">
            <div className="match-score" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
              <SkeletonBlock width="80px" height="14px" />
              {/* Circular skeleton */}
              <SkeletonBlock width="120px" height="120px" borderRadius="50%" />
              <SkeletonBlock width="180px" height="14px" />
            </div>

            <div className="sidebar-divider" />

            <div className="skill-gaps">
              <div style={{ marginBottom: "12px" }}><SkeletonBlock width="80px" height="14px" /></div>
              <div className="skill-gaps__list">
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonBlock key={i} width="85px" height="24px" borderRadius="var(--radius-sm)" />
                ))}
              </div>
            </div>

            <div className="sidebar-divider sidebar-actions-divider" />

            <div className="sidebar-actions" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map((i) => (
                <SkeletonBlock key={i} width="100%" height="42px" borderRadius="var(--radius-md)" />
              ))}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // Error state
  if (!report || report._id !== interviewId) {
    return (
      <main className="loading-screen">
        <div className="loading-spinner"></div>
        <h1>Failed to load report.</h1>
      </main>
    );
  }

  const scoreColor =
    report.matchScore >= 80
      ? "score--high"
      : report.matchScore >= 60
        ? "score--mid"
        : "score--low";

  // Compare to last report diff over stored data
  const currentIdx = reports.findIndex((r) => r._id === report._id);
  const lastReport = currentIdx !== -1 && reports[currentIdx + 1] ? reports[currentIdx + 1] : null;

  return (
    <div className="interview-page">
      {/* ── Title Header & Inline Edit ── */}
      <div className="report-header">
        {isEditing ? (
          <div className="rename-container">
            <input
              type="text"
              className="rename-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Enter title..."
            />
            <button className="rename-btn-save" onClick={handleSaveTitle}>
              Save
            </button>
            <button className="rename-btn-cancel" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <h1>{report.title || "Untitled Position"}</h1>
            <button
              className="rename-btn"
              onClick={() => {
                setEditTitle(report.title || "Untitled Position");
                setIsEditing(true);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Rename
            </button>
          </div>
        )}
      </div>

      <div className="interview-layout">
        {/* ── Left Nav ── */}
        <nav className="interview-nav">
          <div className="nav-content">
            <p className="interview-nav__label">Sections</p>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`interview-nav__item ${activeNav === item.id ? "interview-nav__item--active" : ""}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className="interview-nav__icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
          <div className="nav-actions">
            {sidebarActionsMarkup}
          </div>
        </nav>

        <div className="interview-divider" />

        {/* ── Center Content ── */}
        <main className="interview-content">
          {activeNav === "technical" && (
            <section>
              <div className="content-header">
                <h2>Technical Questions</h2>
                <span className="content-header__count">
                  {report.technicalQuestions?.length || 0} questions
                </span>
              </div>
              <div className="q-list">
                {(report.technicalQuestions || []).map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === "behavioral" && (
            <section>
              <div className="content-header">
                <h2>Behavioral Questions</h2>
                <span className="content-header__count">
                  {report.behavioralQuestions?.length || 0} questions
                </span>
              </div>
              <div className="q-list">
                {(report.behavioralQuestions || []).map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === "roadmap" && (
            <section>
              <div className="content-header">
                <h2>Preparation Road Map</h2>
                <span className="content-header__count">
                  {report.preparationPlan?.length || 0}-day plan
                </span>
              </div>
              <div className="roadmap-list">
                {(report.preparationPlan || []).map((day, i) => (
                  <RoadMapDay key={`${day.day}-${i}`} day={day} />
                ))}
              </div>
            </section>
          )}

          {activeNav === "ats" && (
            <section>
              <div className="content-header">
                <h2>ATS Resume Reader Compliance</h2>
                <span className="content-header__count" style={{ background: "rgba(212, 160, 23, 0.15)", color: "var(--gold-light)", fontWeight: "bold" }}>
                  Score: {report.atsScore || 0}%
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                {/* Score Gauge representation */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "20px", borderRadius: "var(--radius-md)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "90px", height: "90px", borderRadius: "50%", border: "3px solid var(--gold-mid)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: "bold", color: "var(--gold-light)", marginBottom: "10px", boxShadow: "var(--glow-gold)" }}>
                    {report.atsScore || 0}%
                  </div>
                  <h4 style={{ margin: "5px 0", color: "var(--text-primary)" }}>Overall ATS Grade</h4>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto" }}>
                    ATS reader grade based on template styling, standard column grids, quantified metrics, and structural tags.
                  </p>
                </div>

                {/* Issues List */}
                <div>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "15px", color: "var(--text-primary)" }}>Identified Layout &amp; Keyword Issues ({report.atsIssues?.length || 0})</h3>
                  {(!report.atsIssues || report.atsIssues.length === 0) ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>✓ Excellent compliance! No formatting issues detected.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                      {report.atsIssues.map((item, idx) => (
                        <div key={idx} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "16px", borderLeft: `4px solid ${item.severity === 'high' ? '#ef4444' : item.severity === 'medium' ? '#eab308' : '#22c55e'}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontWeight: "600", color: "var(--text-primary)", fontSize: "0.95rem" }}>{item.issue}</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: "bold", padding: "2px 8px", borderRadius: "var(--radius-sm)", textTransform: "uppercase", background: item.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : item.severity === 'medium' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: item.severity === 'high' ? '#ef4444' : item.severity === 'medium' ? '#eab308' : '#22c55e' }}>{item.severity}</span>
                          </div>
                          <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", background: "rgba(0, 0, 0, 0.15)", padding: "8px 12px", borderRadius: "var(--radius-sm)" }}>
                            <strong style={{ color: "var(--gold-light)" }}>Action Fix:</strong> {item.fix}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Strengths List */}
                <div>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "15px", color: "var(--text-primary)" }}>Resume Strengths ({report.atsStrengths?.length || 0})</h3>
                  {(!report.atsStrengths || report.atsStrengths.length === 0) ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No specific strengths highlighted.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {report.atsStrengths.map((str, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.92rem", color: "var(--text-secondary)" }}>
                          <span style={{ color: "#22c55e", fontWeight: "bold" }}>✓</span>
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>

        <div className="interview-divider" />

        {/* ── Right Sidebar ── */}
        <aside className="interview-sidebar">
          {/* Match Score */}
          <div className="match-score">
            <p className="match-score__label">Match Score</p>
            <div className={`match-score__ring ${scoreColor}`}>
              <span className="match-score__value">{report.matchScore}</span>
              <span className="match-score__pct">%</span>
            </div>
            <p className="match-score__sub">
              {report.matchScore >= 80
                ? "Strong match for this role"
                : report.matchScore >= 60
                  ? "Moderate match for this role"
                  : "Low match, improvement needed"}
            </p>
          </div>

          <div className="sidebar-divider" />

          {/* Skill Gaps */}
          <div className="skill-gaps">
            <p className="skill-gaps__label">Skill Gaps</p>
            <div className="skill-gaps__list">
              {(report.skillGaps || []).map((gap, i) => (
                <span
                  key={i}
                  className={`skill-tag skill-tag--${gap.severity}`}
                >
                  {gap.skill}
                </span>
              ))}
            </div>
          </div>

          {/* Compare Section */}
          {lastReport && (
            <>
              <div className="sidebar-divider" />
              <div className="compare-section" style={{ padding: "15px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "var(--gold-light)", fontFamily: "var(--font-display)", fontSize: "0.95rem" }}>✦ Prep Progress</h4>
                <p style={{ fontSize: "0.85rem", margin: "0 0 8px 0", color: "var(--text-secondary)" }}>
                  Compared to last session: <br/>
                  <span style={{ color: "var(--text-primary)" }}>{lastReport.title || "Previous report"}</span>
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.85rem" }}>Match Score Change:</span>
                  <span style={{
                    fontWeight: "bold",
                    color: report.matchScore >= lastReport.matchScore ? "#22c55e" : "#ef4444",
                    fontSize: "0.9rem"
                  }}>
                    {report.matchScore >= lastReport.matchScore ? "+" : ""}{report.matchScore - lastReport.matchScore}%
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Last Match: {lastReport.matchScore}% &bull; Current: {report.matchScore}%
                </div>
              </div>
            </>
          )}

          <div className="sidebar-divider sidebar-actions-divider" />

          {sidebarActionsMarkup}
        </aside>
      </div>
    </div>
  );
};

export default Interview;
