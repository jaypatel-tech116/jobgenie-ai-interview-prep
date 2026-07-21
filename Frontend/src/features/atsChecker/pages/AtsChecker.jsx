import React, { useState, useRef, useEffect, useCallback } from "react";
import "../../interview/styles/analyze.scss"; // Reuse panel layouts
import "../../interview/styles/atsChecker.scss"; // ATS Checker styles
import { checkAtsScore, getAllAtsChecks } from "../services/atsCheck.api";
import { useToast } from "../../../components/Toast/ToastContext";
import { SkeletonBlock } from "../../../components/Skeleton/Skeleton";

const AtsChecker = () => {
  const toast = useToast();
  const resumeInputRef = useRef();

  // Inputs
  const [jobDescription, setJobDescription] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [resumeFileState, setResumeFileState] = useState(null);

  // States
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getAllAtsChecks(1, 5);
      setHistory(data.checks || []);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadHistory();
    });
  }, [loadHistory]);

  const handleCheckAts = async () => {
    if (!resumeFileState) {
      toast.warning("Please upload a resume file first.");
      return;
    }

    setLoading(true);
    try {
      toast.info("Checking resume ATS readability... Please wait.");
      const response = await checkAtsScore({
        resumeFile: resumeFileState,
        jobDescription,
      });
      setResults(response.atsCheck);
      toast.success("Resume analyzed successfully!");
      loadHistory(); // reload history
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err?.message || "ATS check failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setJobDescription("");
    setUploadedFileName("");
    setResumeFileState(null);
    if (resumeInputRef.current) {
      resumeInputRef.current.value = "";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHistoryItemClick = (record) => {
    setResults({
      atsScore: record.atsScore,
      issues: record.issues,
      strengths: record.strengths,
      jobDescription: record.jobDescription,
      createdAt: record.createdAt,
    });
    // Scroll to absolute top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-spinner"></div>
        <h1>Analyzing ATS readability parameters...</h1>
      </main>
    );
  }

  return (
    <div className="ats-checker-page">
      <header className="page-header">
        <h1>
          ATS Resume <span className="highlight">Score Checker</span>
        </h1>
        <p>
          Ensure your resume passes automatic parsers. Get graded on header standardizations, formatting risks, layout safety, and keyword match parameters.
        </p>
      </header>

      {/* RENDER RESULT CARD IF RESULTS ARE LOADED */}
      {results ? (
        <div>
          <div className="ats-results-container">
            {/* Left Col - Details */}
            <div className="ats-details-card">
              <div className="section-title">
                <span>ATS Analysis Findings</span>
                {results.createdAt && (
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Analyzed on {new Date(results.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Issues Section */}
              <div style={{ marginBottom: "30px" }}>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "15px", color: "var(--text-primary)" }}>
                  Issues Identified ({results.issues?.length || 0})
                </h3>
                {results.issues?.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                    🎉 No formatting or keyword issues found! Your resume is highly ATS-compliant.
                  </p>
                ) : (
                  <div className="ats-issues-list">
                    {results.issues.map((item, idx) => (
                      <div key={idx} className={`ats-issue-item severity-${item.severity}`}>
                        <div className="item-header">
                          <span className="issue-title">{item.issue}</span>
                          <span className="severity-badge">{item.severity}</span>
                        </div>
                        <p className="issue-desc">{item.issue}</p>
                        <div className="issue-fix">
                          <span>How to Fix:</span> {item.fix}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Strengths Section */}
              <div>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "15px", color: "var(--text-primary)" }}>
                  Resume Strengths ({results.strengths?.length || 0})
                </h3>
                {results.strengths?.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No strengths identified.</p>
                ) : (
                  <div className="ats-strengths-list">
                    {results.strengths.map((str, idx) => (
                      <div key={idx} className="ats-strength-item">
                        <span className="check-icon">✓</span>
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col - Score Gauge */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="ats-score-card">
                <div className="gauge-circle">{results.atsScore}%</div>
                <h3>ATS Compliance Score</h3>
                <p>
                  {results.atsScore >= 80
                    ? "Excellent! Your resume format is safe for parsing."
                    : results.atsScore >= 60
                    ? "Average. We recommend fixing medium and high issues."
                    : "Low compliance. Fix formatting errors immediately."}
                </p>
              </div>

              <button onClick={handleReset} className="btn-primary" type="button" style={{ width: "100%" }}>
                ✦ Check Another Resume
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* RENDER SETUP FORM */
        <div className="interview-card">
          <div className="interview-card__body">
            {/* Resume Upload Box */}
            <div className="panel panel--left">
              <div className="panel__header">
                <span className="panel__icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
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
                </span>
                <h2>Upload Resume</h2>
                <span className="badge badge--required">Required</span>
              </div>

              <div className="upload-section" style={{ width: "100%", marginTop: "15px" }}>
                <label className="dropzone" htmlFor="ats-resume">
                  {uploadedFileName ? (
                    <>
                      <span className="dropzone__icon dropzone__icon--success">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <polyline points="9 15 11 17 15 13" />
                        </svg>
                      </span>
                      <p className="dropzone__title dropzone__title--success">{uploadedFileName}</p>
                      <p className="dropzone__subtitle">Click to change file</p>
                    </>
                  ) : (
                    <>
                      <span className="dropzone__icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="16 16 12 12 8 16" />
                          <line x1="12" y1="12" x2="12" y2="21" />
                          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                        </svg>
                      </span>
                      <p className="dropzone__title">Click to upload or drag &amp; drop</p>
                      <p className="dropzone__subtitle">PDF or DOCX (Max 5MB)</p>
                    </>
                  )}
                  <input
                    ref={resumeInputRef}
                    hidden
                    type="file"
                    id="ats-resume"
                    accept=".pdf,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        toast.warning("File exceeds 5MB limit.");
                        e.target.value = "";
                        setUploadedFileName("");
                        setResumeFileState(null);
                        return;
                      }
                      setUploadedFileName(file.name);
                      setResumeFileState(file);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="panel-divider" />

            {/* Optional Job Description Box */}
            <div className="panel panel--right">
              <div className="panel__header">
                <span className="panel__icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </span>
                <h2>Target Job (Optional)</h2>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="panel__textarea"
                placeholder="Paste the target job description here to check keyword matches..."
                style={{ marginTop: "15px", minHeight: "180px" }}
                maxLength={5000}
              />
              <div className="char-counter">{jobDescription.length} / 5000 chars</div>
            </div>
          </div>

          <div className="interview-card__footer">
            <span className="footer-info">Checks spacing, structures, headings &amp; format issues</span>
            <button onClick={handleCheckAts} className="generate-btn" type="button">
              ✦ Check ATS Score
            </button>
          </div>
        </div>
      )}

      {/* Chronological History Section */}
      {!results && (historyLoading || history.length > 0) && (
        <section className="ats-history-section">
          <h2>Past ATS Evaluations</h2>
          {historyLoading ? (
            <div className="history-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="history-item" style={{ cursor: "default" }}>
                  <div className="info" style={{ flex: 1 }}>
                    <div style={{ marginBottom: "6px" }}><SkeletonBlock width="40%" height="18px" /></div>
                    <SkeletonBlock width="120px" height="14px" />
                  </div>
                  <SkeletonBlock width="50px" height="30px" borderRadius="var(--radius-md)" />
                </div>
              ))}
            </div>
          ) : (
            <div className="history-list">
              {history.map((record) => (
                <div key={record._id} onClick={() => handleHistoryItemClick(record)} className="history-item">
                  <div className="info">
                    <h4>ATS Resume Compliance Check</h4>
                    <p>
                      {new Date(record.createdAt).toLocaleDateString()} at{" "}
                      {new Date(record.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="score">{record.atsScore}%</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default AtsChecker;
