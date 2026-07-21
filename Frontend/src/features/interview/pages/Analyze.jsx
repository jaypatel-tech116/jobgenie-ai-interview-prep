import React, { useState, useRef, useEffect } from "react";
import "../styles/analyze.scss";
import { useInterview } from "../hooks/useInterview.js";
import { useNavigate } from "react-router";
import { useToast } from "../../../components/Toast/ToastContext";
import { SkeletonBlock } from "../../../components/Skeleton/Skeleton";

const Analyze = () => {
  const { loading, generateReport, reports, getReports } = useInterview();
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [difficulty, setDifficulty] = useState("mid");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [generating, setGenerating] = useState(false);
  const resumeInputRef = useRef();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    getReports();
  }, [getReports]);

  const handleGenerateReport = async () => {
    const resumeFile = resumeInputRef.current.files[0];

    if (!jobDescription) {
      toast.warning("Job description is required.");
      return;
    }

    // required validation
    if (!resumeFile && !selfDescription) {
      toast.warning("Please upload a resume or provide a self description.");
      return;
    }

    // file validation
    if (resumeFile) {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(resumeFile.type)) {
        toast.warning("Only PDF or DOCX files are allowed.");
        return;
      }

      if (resumeFile.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB.");
        toast.warning("File exceeds 5MB limit. Please use a smaller file.");
        return;
      }
    }

    setGenerating(true);
    try {
      const data = await generateReport({
        jobDescription,
        selfDescription,
        resumeFile,
        difficulty,
      });

      if (!data) {
        toast.error("Failed to generate report");
        return;
      }

      if (data?.id) {
        toast.success("Analysis complete! Loading your report...");
        navigate(`/interview/${data.id}`);
      } else {
        toast.error("Failed to generate report. Please try again.");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Analysis failed. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <main className="loading-screen">
        <div className="loading-spinner"></div>
        <h1>Loading your interview plan...</h1>
      </main>
    );
  }

  return (
    <div className="home-page">
      <header className="page-header">
        <h1>
          Analyze Your <span className="highlight">Resume</span>
        </h1>
        <p className="pageSub">
          Let our AI analyze the job requirements and your unique profile to
          build a winning strategy.
        </p>
      </header>

      <div className="interview-card">
        <div className="interview-card__body">
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
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </span>
              <h2>Target Job Description</h2>
              <span className="badge badge--required">Required</span>
            </div>
            <textarea
              onChange={(e) => {
                setJobDescription(e.target.value);
              }}
              className="panel__textarea"
              placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
              maxLength={5000}
            />
            <div className="char-counter">{jobDescription.length} / 5000 chars</div>
          </div>

          <div className="panel-divider" />

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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <h2>Your Profile</h2>
            </div>

            <div className="upload-section">
              <label className="section-label">
                Upload Resume
                <span className="badge badge--best">Best Results</span>
              </label>
              <label className="dropzone" htmlFor="resume">
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
                    <p className="dropzone__title dropzone__title--success">
                      {uploadedFileName}
                    </p>
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
                  id="resume"
                  name="resume"
                  accept=".pdf,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast.warning("File exceeds 5MB limit. Please use a smaller file.");
                      e.target.value = "";
                      setUploadedFileName("");
                      return;
                    }
                    setUploadedFileName(file.name);
                    toast.info("Resume uploaded — ready to analyze!");
                  }}
                />
              </label>
            </div>

            <div className="or-divider">
              <span>OR</span>
            </div>

            <div className="self-description">
              <label className="section-label" htmlFor="selfDescription">
                Quick Self-Description
              </label>
              <textarea
                onChange={(e) => {
                  setSelfDescription(e.target.value);
                }}
                id="selfDescription"
                name="selfDescription"
                className="panel__textarea panel__textarea--short"
                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
              />
            </div>

            <div className="difficulty-section" style={{ marginTop: "20px", marginBottom: "20px" }}>
              <label className="section-label" htmlFor="difficulty">
                Interview Target Difficulty
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  padding: "10px 14px",
                  fontSize: "0.95rem",
                  width: "100%",
                  outline: "none",
                  marginTop: "8px",
                  cursor: "pointer"
                }}
              >
                <option value="junior" style={{ background: "#140927", color: "#fff" }}>Junior Level (Associate, Entry)</option>
                <option value="mid" style={{ background: "#140927", color: "#fff" }}>Mid Level (Intermediate, Senior)</option>
                <option value="senior" style={{ background: "#140927", color: "#fff" }}>Senior Level (Staff, Principal, Lead)</option>
              </select>
            </div>

            <div className="info-box">
              <span className="info-box__icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                    stroke="#1a1f27"
                    strokeWidth="2"
                  />
                  <line
                    x1="12"
                    y1="16"
                    x2="12.01"
                    y2="16"
                    stroke="#1a1f27"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <p>
                A <strong>Resume</strong> or <strong>Self Description</strong> is
                required — providing both gives the most personalized results.
              </p>
            </div>
          </div>
        </div>

        <div className="interview-card__footer">
          <span className="footer-info">AI-Powered Strategy Generation • Approx 30s</span>
          <button
            onClick={handleGenerateReport}
            className="generate-btn"
            disabled={loading}
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
            {loading ? "Genie is analyzing..." : "Generate My Interview Strategy"}
          </button>
        </div>
      </div>

      {(loading || (reports && reports.length > 0)) && (
        <section className="recent-reports">
          <h2>My Recent Interview Plans</h2>
          {loading && (!reports || reports.length === 0) ? (
            <ul className="reports-list">
              {[1, 2, 3].map((i) => (
                <li key={i} className="report-item" style={{ cursor: "default" }}>
                  <div style={{ marginBottom: "8px" }}><SkeletonBlock width="60%" height="20px" /></div>
                  <div style={{ marginBottom: "12px" }}><SkeletonBlock width="40%" height="14px" /></div>
                  <SkeletonBlock width="80px" height="14px" />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="reports-list">
              {[...reports]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 3)
                .map((report) => (
                  <li
                    key={report._id}
                    className="report-item"
                    onClick={() => navigate(`/interview/${report._id}`)}
                  >
                    <h3>{report.title || "Untitled Position"}</h3>
                    <p className="report-meta">
                      Generated on {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                    <p className="match-score">Match Score: {report.matchScore}%</p>
                  </li>
                ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};

export default Analyze;