import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useInterview } from "../hooks/useInterview";
import { useMockInterview } from "../../mockInterview/hooks/useMockInterview";
import { useToast } from "../../../components/Toast/ToastContext";
import { Trash2, BarChart, Clock } from "lucide-react";
import styles from "../styles/recent.module.scss";
import { SkeletonBlock } from "../../../components/Skeleton/Skeleton";

const Recent = () => {
  const { reports, loading: reportsLoading, deleteReport, getReports } = useInterview();
  const { sessions: mockSessions, loading: mockLoading, fetchAllSessions } = useMockInterview();
  
  const [activeTab, setActiveTab] = useState("reports"); // "reports" or "mocks"
  const [mockPage, setMockPage] = useState(1);
  const [mockTotalPages, setMockTotalPages] = useState(1);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    getReports();
  }, [getReports]);

  useEffect(() => {
    if (activeTab === "mocks") {
      const loadMocks = async () => {
        try {
          const data = await fetchAllSessions(mockPage, 6);
          setMockTotalPages(data.totalPages || 1);
        } catch (err) {
          console.error(err);
          toast.error("Failed to load mock interviews list.");
        }
      };
      loadMocks();
    }
  }, [activeTab, mockPage, fetchAllSessions, toast]);

  const handleDelete = async (e, reportId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await deleteReport(reportId);
        toast.success("Report deleted successfully.");
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete report. Please try again.");
      }
    }
  };

  const getJobTitle = (jd) => {
    if (!jd) return "Untitled Position";
    const firstLine = jd.split("\n")[0].trim();
    if (firstLine && firstLine.length < 60) return firstLine;
    return jd.substring(0, 50).trim() + "...";
  };

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <span className="section-label">History</span>
        <h1 className={styles.title}>History</h1>
        <p className={styles.sub}>
          Revisit your generated reports and jump back into interview prep in
          one click.
        </p>
      </header>

      {/* Tabs Selector */}
      <div className={styles.tabs}>
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`${styles.tabBtn} ${activeTab === "reports" ? styles.tabBtnActive : ""}`}
        >
          📄 Resume Reports
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("mocks")}
          className={`${styles.tabBtn} ${activeTab === "mocks" ? styles.tabBtnActive : ""}`}
        >
          🎙️ Mock Interviews
        </button>
      </div>

      {activeTab === "reports" ? (
        reportsLoading && reports.length === 0 ? (
          <div className={styles.grid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.card}>
                <div className={styles.cardTop}>
                  <SkeletonBlock width="55%" height="22px" />
                  <SkeletonBlock width="85px" height="20px" borderRadius="var(--radius-pill)" />
                </div>
                <div style={{ margin: "12px 0" }}>
                  <SkeletonBlock width="35%" height="14px" />
                </div>
                <SkeletonBlock width="130px" height="16px" />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className={styles.empty}>
            <h2>No reports yet</h2>
            <p>Run your first resume analysis to start building history.</p>
            <button
              className="btn-primary"
              onClick={() => navigate("/interview")}
              type="button"
            >
              ✦ Analyze Resume
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {reports.map((report) => (
              <article
                key={report._id}
                className={styles.card}
                onClick={() => navigate(`/interview/${report._id}`)}
              >
                <div className={styles.cardTop}>
                  <h3 className={styles.cardTitle}>
                    {report.title || "Untitled Position"}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className={styles.score}>Match: {report.matchScore}%</span>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, report._id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      title="Delete Report"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className={styles.meta}>
                  Generated on {new Date(report.createdAt).toLocaleDateString()}
                </p>
                <span className={styles.open} style={{fontSize: "0.9rem", fontWeight: "600", color: "var(--gold-light)" }}>Open full report →</span>
              </article>
            ))}
          </div>
        )
      ) : (
        /* Mock Interviews tab */
        mockLoading && mockSessions.length === 0 ? (
          <div className={styles.grid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.card}>
                <div className={styles.cardTop}>
                  <SkeletonBlock width="65%" height="22px" />
                  <SkeletonBlock width="80px" height="20px" borderRadius="4px" />
                </div>
                <div className={styles.mockMetaGrid} style={{ margin: "14px 0 10px 0" }}>
                  <div className={styles.mockMetaItem}>
                    <SkeletonBlock width="110px" height="14px" />
                  </div>
                  <div className={styles.mockMetaItem}>
                    <SkeletonBlock width="90px" height="14px" />
                  </div>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <SkeletonBlock width="40%" height="14px" />
                </div>
                <SkeletonBlock width="160px" height="16px" />
              </div>
            ))}
          </div>
        ) : mockSessions.length === 0 ? (
          <div className={styles.empty}>
            <h2>No mock interviews yet</h2>
            <p>Start a new interactive mock interview simulation to test your skills.</p>
            <button
              className="btn-primary"
              onClick={() => navigate("/mock-interview")}
              type="button"
            >
              ✦ Start Mock Practice
            </button>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {mockSessions.map((session) => {
                const totalScore = session.answers.reduce((acc, ans) => acc + ans.score, 0);
                const avgScore = session.answers.length > 0
                  ? (totalScore / session.answers.length).toFixed(1)
                  : "0.0";
                  
                const isCompleted = session.status === "completed";

                return (
                  <article
                    key={session._id}
                    className={styles.card}
                    onClick={() => navigate(`/mock-interview?sessionId=${session._id}`)}
                  >
                    <div className={styles.cardTop}>
                      <h3 className={styles.cardTitle}>
                        {getJobTitle(session.jobDescription)}
                      </h3>
                      <span className={`${styles.statusBadge} ${isCompleted ? styles.statusCompleted : styles.statusProgress}`}>
                        {isCompleted ? "Completed" : "In Progress"}
                      </span>
                    </div>
                    
                    <div className={styles.mockMetaGrid}>
                      <div className={styles.mockMetaItem}>
                        <BarChart size={14} className={styles.mockMetaIcon} />
                        <span>Difficulty: <strong>{session.difficulty}</strong></span>
                      </div>
                      <div className={styles.mockMetaItem}>
                        <Clock size={14} className={styles.mockMetaIcon} />
                        <span>Avg Score: <strong>{avgScore}/10</strong></span>
                      </div>
                    </div>
                    
                    <p className={styles.meta} style={{ marginTop: "12px", marginBottom: "16px" }}>
                      Created on {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                    
                    <span className={styles.open} style={{fontSize: "0.9rem", fontWeight: "600", color: "var(--gold-light)" }}>
                      {isCompleted ? "View performance summary →" : "Resume session →"}
                    </span>
                  </article>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {mockTotalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  onClick={() => setMockPage(prev => Math.max(1, prev - 1))}
                  disabled={mockPage === 1}
                  className={styles.pageBtn}
                >
                  ◀ Prev
                </button>
                <span className={styles.pageInfo}>
                  Page {mockPage} of {mockTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setMockPage(prev => Math.min(mockTotalPages, prev + 1))}
                  disabled={mockPage === mockTotalPages}
                  className={styles.pageBtn}
                >
                  Next ▶
                </button>
              </div>
            )}
          </>
        )
      )}
    </section>
  );
};

export default Recent;
