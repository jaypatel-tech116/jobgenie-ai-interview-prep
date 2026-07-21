import React, { useEffect, useState } from "react";
import { useInterview } from "../hooks/useInterview";
import { useMockInterview } from "../../mockInterview/hooks/useMockInterview";
import { useNavigate } from "react-router";
import styles from "../styles/recent.module.scss"; // reuse history styles for consistency
import { SkeletonBlock } from "../../../components/Skeleton/Skeleton";

const Dashboard = () => {
  const { reports, loading: reportsLoading, getReports } = useInterview();
  const { sessions, fetchAllSessions, loading: mockLoading } = useMockInterview();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    getReports();
    fetchAllSessions(1, 10);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 650);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [getReports, fetchAllSessions]);

  const loading = reportsLoading || mockLoading;

  // Chronological order (oldest to newest) for trend chart
  const chronReports = [...(reports || [])].reverse();
  const totalReports = chronReports.length;

  // Process top skill gaps
  const skillGapCounts = {};
  (reports || []).forEach((r) => {
    if (r && r.skillGaps) {
      (r.skillGaps || []).forEach((gap) => {
        if (gap && gap.skill) {
          const name = gap.skill.trim();
          skillGapCounts[name] = (skillGapCounts[name] || 0) + 1;
        }
      });
    }
  });

  const topGaps = Object.entries(skillGapCounts)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate mock interview average score
  const completedMocks = (sessions || []).filter(s => s && s.status === "completed");
  let totalMockScoresSum = 0;
  let totalMockQuestionsCount = 0;
  completedMocks.forEach(s => {
    if (s && s.answers && s.answers.length > 0) {
      s.answers.forEach(ans => {
        if (ans && typeof ans.score === 'number') {
          totalMockScoresSum += ans.score;
          totalMockQuestionsCount += 1;
        }
      });
    }
  });
  const avgMockScoreVal = totalMockQuestionsCount > 0 
    ? (totalMockScoresSum / totalMockQuestionsCount).toFixed(1) + " / 10"
    : "N/A";

  // SVG Chart Calculation - Responsive viewBox dimensions
  const chartWidth = isMobile ? 380 : 600;
  const chartHeight = isMobile ? 220 : 240;
  const paddingX = isMobile ? 50 : 60;
  const paddingY = isMobile ? 30 : 40;

  const points = chronReports.map((r, i) => {
    const x = totalReports > 1
      ? paddingX + (i / (totalReports - 1)) * (chartWidth - paddingX * 2)
      : chartWidth / 2;
    const y = chartHeight - paddingY - ((r.matchScore || 0) / 100) * (chartHeight - paddingY * 2);
    return { x, y, score: r.matchScore || 0, title: r.title || "Untitled", id: r._id };
  });

  const pathD = points.length > 0
    ? `M ${points.map(p => `${p.x} ${p.y}`).join(" L ")}`
    : "";

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <span className="section-label">Performance</span>
        <h1 className={styles.title}>Prep Dashboard</h1>
        <p className={styles.sub}>
          Track your match score trajectory and focus on fixing your top skill deficiencies.
        </p>
      </header>

      {!loading && (!reports || reports.length === 0) ? (
        <div className={styles.empty}>
          <h2>No data available</h2>
          <p>Complete a resume analysis to unlock dashboard analytics.</p>
          <button
            className="btn-primary"
            onClick={() => navigate("/interview")}
            type="button"
          >
            ✦ Analyze Resume
          </button>
        </div>
      ) : (
        <div className={styles.dashboardGrid}>
          
          {/* Left Column (Trend Chart + Mock Interviews) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>
            {/* 📈 Score Trend Card */}
            <div className={styles.chartCard}>
              <h3>Match Score Progress</h3>
              
              {loading ? (
                <div style={{ padding: "10px 0" }}>
                  <SkeletonBlock width="100%" height={`${chartHeight}px`} borderRadius="var(--radius-lg)" />
                </div>
              ) : (
                <>
                  {/* SVG Chart */}
                  <div className={styles.chartWrapper}>
                    <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: "visible" }}>
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--gold-mid)" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="var(--gold-mid)" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      {[0, 25, 50, 75, 100].map((level) => {
                        const y = chartHeight - paddingY - (level / 100) * (chartHeight - paddingY * 2);
                        return (
                          <g key={level}>
                            <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="var(--border)" strokeDasharray="4 4" />
                            <text x={paddingX - 12} y={y + 4} fill="var(--text-muted)" fontSize={isMobile ? "10" : "11"} textAnchor="end">{level}%</text>
                          </g>
                        );
                      })}

                      {/* Horizontal reference line for single report */}
                      {points.length === 1 && (
                        <line
                          x1={paddingX}
                          y1={points[0].y}
                          x2={chartWidth - paddingX}
                          y2={points[0].y}
                          stroke="var(--gold-mid)"
                          strokeWidth="1.5"
                          strokeDasharray="5 5"
                          opacity="0.5"
                        />
                      )}

                      {/* Fill Area */}
                      {points.length > 1 && (
                        <path
                          d={`${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`}
                          fill="url(#chartGlow)"
                        />
                      )}

                      {/* Trend Line */}
                      {points.length > 1 && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke="var(--gold-mid)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Interactive Points */}
                      {points.map((p, idx) => (
                        <g key={idx} style={{ cursor: "pointer" }} onClick={() => navigate(`/interview/${p.id}`)}>
                          {points.length === 1 && (
                            <rect
                              x={p.x - 20}
                              y={p.y}
                              width="40"
                              height={chartHeight - paddingY - p.y}
                              fill="url(#chartGlow)"
                              stroke="var(--gold-mid)"
                              strokeWidth="2"
                              rx="4"
                            />
                          )}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={points.length === 1 ? "8" : "6"}
                            fill="var(--bg-card)"
                            stroke="var(--gold-light)"
                            strokeWidth="2.5"
                          />
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="16"
                            fill="var(--gold-mid)"
                            fillOpacity="0"
                            onMouseEnter={(e) => e.target.setAttribute("fill-opacity", "0.15")}
                            onMouseLeave={(e) => e.target.setAttribute("fill-opacity", "0")}
                          />
                          {/* Tooltip pill badge */}
                          <g>
                            <rect
                              x={p.x - 22}
                              y={p.y - 28}
                              width="44"
                              height="18"
                              rx="4"
                              fill="var(--gold-light)"
                            />
                            <text
                              x={p.x}
                              y={p.y - 15}
                              fill="#0f0c1a"
                              fontSize="11"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {p.score}%
                            </text>
                          </g>
                        </g>
                      ))}
                    </svg>
                  </div>
                  
                  <div className={styles.chartFooter}>
                    <span>Oldest Analysis</span>
                    <span>Newest Analysis</span>
                  </div>
                </>
              )}
            </div>

            {/* 🎙️ Recent Mock Interviews Card */}
            <div className={styles.chartCard}>
              <div className={styles.mocksHeader}>
                <h3 style={{ margin: 0 }}>Recent Mock Simulations</h3>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/mock-interview")}
                  style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                  type="button"
                >
                  ✦ Simulate Interview
                </button>
              </div>

              {loading ? (
                <div className={styles.mocksList}>
                  {[1, 2].map((i) => (
                    <div key={i} className={styles.mockItem}>
                      <div className={styles.mockItemLeft}>
                        <div style={{ marginBottom: "8px" }}><SkeletonBlock width="55%" height="18px" /></div>
                        <div className={styles.mockItemMeta}>
                          <SkeletonBlock width="130px" height="14px" />
                          <SkeletonBlock width="90px" height="14px" />
                          <SkeletonBlock width="110px" height="14px" />
                        </div>
                      </div>
                      <div className={styles.mockItemRight}>
                        <SkeletonBlock width="80px" height="20px" borderRadius="4px" />
                        <SkeletonBlock width="100px" height="32px" borderRadius="var(--radius-md)" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (!sessions || sessions.length === 0) ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No mock interviews recorded yet.</p>
              ) : (
                <div className={styles.mocksList}>
                  {sessions.slice(0, 3).map((sess, idx) => {
                    if (!sess) return null;
                    const totalScore = (sess.answers || []).reduce((acc, item) => acc + (item ? item.score : 0), 0);
                    const avgScore = (sess.answers || []).length > 0 ? (totalScore / (sess.answers || []).length).toFixed(1) : 0;
                    const isCompleted = sess.status === "completed";
                    return (
                      <div key={idx} className={styles.mockItem}>
                        <div className={styles.mockItemLeft}>
                          <h4 style={{ margin: "0 0 6px 0", color: "var(--text-primary)", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {sess.title || "Untitled Position Prep"}
                          </h4>
                          <div className={styles.mockItemMeta}>
                            <span>Questions Answered: {(sess.answers || []).length} / {(sess.questions || []).length}</span>
                            <span>Level: {sess.difficulty}</span>
                            <span>Started: {new Date(sess.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className={styles.mockItemRight}>
                          <span className={`${styles.statusBadge} ${isCompleted ? styles.statusCompleted : styles.statusProgress}`}>
                            {sess.status === "completed" ? "Completed" : "In Progress"}
                          </span>
                          {isCompleted && (
                            <div className={styles.mockScoreGroup}>
                              <div className={styles.scoreVal}>{avgScore} / 10</div>
                              <div className={styles.scoreLbl}>Avg Score</div>
                            </div>
                          )}
                          <button
                            className="btn-secondary"
                            onClick={() => navigate(`/mock-interview?sessionId=${sess._id}`)}
                            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                            type="button"
                          >
                            {isCompleted ? "View Details" : "Resume"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Gaps & Stats) */}
          <div className={styles.sideCol}>
            
            {/* Top Gaps */}
            <div className={styles.gapsCard}>
              <h3>Top Skill Deficiencies</h3>
              {loading ? (
                <div className={styles.gapsList}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={styles.gapItem}>
                      <SkeletonBlock width="55%" height="16px" />
                      <SkeletonBlock width="120px" height="16px" borderRadius="var(--radius-sm)" />
                    </div>
                  ))}
                </div>
              ) : topGaps.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No skill gaps recorded.</p>
              ) : (
                <div className={styles.gapsList}>
                  {topGaps.map((gap, i) => (
                    <div key={i} className={styles.gapItem}>
                      <span className={styles.gapName}>{gap.skill}</span>
                      <span className={styles.gapBadge}>
                        Found in {gap.count} {gap.count === 1 ? "report" : "reports"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className={styles.statsCard}>
              <h3>Quick Stats</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statBox}>
                  <div className={styles.statVal}>
                    {loading ? <SkeletonBlock width="40px" height="28px" /> : (reports || []).length}
                  </div>
                  <div className={styles.statLabel}>Resume Reports</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statVal}>
                    {loading ? <SkeletonBlock width="60px" height="28px" /> : (
                      (reports || []).length > 0 ? Math.round((reports || []).reduce((acc, r) => acc + r.matchScore, 0) / (reports || []).length) : 0
                    )}
                    {loading ? "" : "%"}
                  </div>
                  <div className={styles.statLabel}>Avg Match Score</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statVal}>
                    {loading ? <SkeletonBlock width="40px" height="28px" /> : (sessions || []).length}
                  </div>
                  <div className={styles.statLabel}>Mock Interviews</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statVal}>
                    {loading ? <SkeletonBlock width="70px" height="28px" /> : avgMockScoreVal}
                  </div>
                  <div className={styles.statLabel}>Avg Mock Score</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </section>
  );
};

export default Dashboard;
