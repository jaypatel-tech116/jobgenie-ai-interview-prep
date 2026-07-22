import React, { useState, useRef, useEffect } from "react";
import "../../interview/styles/analyze.scss"; // Reuse base panel upload styles
import "../../interview/styles/mockInterview.scss"; // Specialized mock styles
import { useMockInterview } from "../hooks/useMockInterview";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { useNavigate, useSearchParams } from "react-router";
import { useToast } from "../../../components/Toast/ToastContext";
import { SkeletonBlock } from "../../../components/Skeleton/Skeleton";

const MockInterview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramSessionId = searchParams.get("sessionId");
  const toast = useToast();

  // State for form configuration
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [difficulty, setDifficulty] = useState("mid");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [generating, setGenerating] = useState(false);
  const resumeInputRef = useRef();

  // State for active session answers history
  const [sessionAnswersHistory, setSessionAnswersHistory] = useState([]);
  const [typedAnswer, setTypedAnswer] = useState("");

  // AI & Speech Hooks
  const {
    loading,
    currentQuestion,
    questionNumber,
    totalQuestions,
    evaluation,
    startSession,
    submitAnswer,
    goToNextQuestion,
    fetchSession,
    fetchAllSessions,
    sessions,
    setSessionId,
    setIsComplete,
  } = useMockInterview();

  const {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
  } = useSpeechToText();

  // Mode state: 'setup' -> 'in_progress' -> 'feedback_wait' -> 'completed'
  const [mode, setMode] = useState(paramSessionId ? "in_progress" : "setup");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(Boolean(paramSessionId));

  // Fetch recent mock sessions when in setup mode
  useEffect(() => {
    if (mode === "setup") {
      fetchAllSessions(1, 3);
    }
  }, [mode, fetchAllSessions]);

  const originalAnswerRef = useRef("");

  // Sync speech transcript into typedAnswer state when changed
  useEffect(() => {
    if (isListening) {
      setTypedAnswer(
        originalAnswerRef.current +
          (originalAnswerRef.current ? " " : "") +
          transcript,
      );
    }
  }, [transcript, isListening]);

  // Load session from query param if present
  useEffect(() => {
    if (paramSessionId) {
      setIsSessionLoading(true);
      setMode("in_progress");
      const loadSession = async () => {
        try {
          const session = await fetchSession(paramSessionId);
          // Set sessionAnswersHistory by mapping answers to include question text
          const history = session.answers.map((ans) => ({
            question:
              session.questions[ans.questionIndex]?.question || "Question",
            userAnswer: ans.userAnswer,
            score: ans.score,
            feedback: ans.feedback,
          }));
          setSessionAnswersHistory(history);

          if (session.status === "completed") {
            setMode("completed");
          } else {
            setMode("in_progress");
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to load session details.");
          navigate("/mock-interview", { replace: true });
          setTimeout(() => {
            setMode("setup");
          }, 0);
        } finally {
          setIsSessionLoading(false);
        }
      };
      loadSession();
    } else {
      setIsSessionLoading(false);
      // Clear states if no sessionId param
      setTimeout(() => {
        setSessionId(null);
        setIsComplete(false);
        setSessionAnswersHistory([]);
        setMode("setup");
      }, 0);
    }
  }, [paramSessionId, fetchSession, setSessionId, setIsComplete, toast, navigate]);

  const handleStartSession = async () => {
    const resumeFile = resumeInputRef.current?.files?.[0];

    if (!jobDescription) {
      toast.warning("Job description is required.");
      return;
    }

    if (!resumeFile && !selfDescription) {
      toast.warning("Please upload a resume or provide a self description.");
      return;
    }

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
        toast.warning("File exceeds 5MB limit. Please use a smaller file.");
        return;
      }
    }

    setGenerating(true);
    try {
      toast.info(
        "Genie is preparing your simulation questions... Please wait.",
      );
      const data = await startSession({
        jobDescription,
        selfDescription,
        resumeFile,
        difficulty,
      });
      setSessionAnswersHistory([]);
      setTypedAnswer("");
      navigate(`/mock-interview?sessionId=${data.sessionId}`, {
        replace: true,
      });
      toast.success("Simulation questions generated! Let's start.");
    } catch (err) {
      toast.error(err?.message || "Failed to initialize interview session.");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleMic = () => {
    if (!isSupported) return;
    if (isListening) {
      stopListening();
      toast.info("Stopped listening.");
    } else {
      originalAnswerRef.current = typedAnswer;
      startListening();
      toast.info("Microphone is active. Speak clearly.");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!typedAnswer.trim()) {
      toast.warning("Please type or speak an answer before submitting.");
      return;
    }

    if (isListening) {
      stopListening();
    }

    setIsSubmitting(true);
    try {
      // Save current question so we can store it in history along with feedback
      const currentQText = currentQuestion;

      const evalData = await submitAnswer(typedAnswer);

      // Append to local state for summary view later
      setSessionAnswersHistory((prev) => [
        ...prev,
        {
          question: currentQText,
          userAnswer: typedAnswer,
          score: evalData.score,
          feedback: evalData.feedback,
        },
      ]);

      setTypedAnswer("");

      if (evalData.isComplete) {
        setMode("completed");
        toast.success("Mock interview completed! Analyzing final scores.");
      } else {
        setMode("feedback_wait");
      }
    } catch (err) {
      toast.error(
        err?.message || "Failed to evaluate answer. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    goToNextQuestion();
    setMode("in_progress");
  };

  const handleFinishEarly = async () => {
    // If they want to exit, direct to dashboard
    setSessionId(null);
    setIsComplete(false);
    setMode("setup");
    navigate("/dashboard");
  };

  // Render Loading Screen when generating questions or loading a session via query param
  if (generating || (paramSessionId && (isSessionLoading || loading || (mode === "in_progress" && !currentQuestion)))) {
    return (
      <div className="mock-interview-page">
        <header className="page-header" style={{ marginBottom: "30px", textAlign: "center" }}>
          <h1>
            Preparing Your <span className="highlight">Mock Simulation</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
            {generating
              ? "Genie AI is analyzing requirements & generating custom questions..."
              : "Retrieving interview session details & history..."}
          </p>
        </header>

        <div className="mock-loading-container">
          <div className="mock-loading-orb-wrapper">
            <div className="mock-loading-orb">
              <span className="mock-loading-sparkle">✦</span>
            </div>
          </div>

          <div className="mock-loading-skeletons">
            <div className="mock-loading-header-skel">
              <SkeletonBlock width="40%" height="16px" />
              <SkeletonBlock width="80px" height="22px" borderRadius="var(--radius-sm)" />
            </div>

            <SkeletonBlock width="100%" height="8px" borderRadius="var(--radius-pill)" />

            <div className="mock-loading-qbox-skel">
              <SkeletonBlock width="30%" height="14px" />
              <div style={{ marginTop: "12px" }}>
                <SkeletonBlock width="90%" height="20px" />
              </div>
              <div style={{ marginTop: "8px" }}>
                <SkeletonBlock width="65%" height="20px" />
              </div>
            </div>

            <div className="mock-loading-input-skel">
              <SkeletonBlock width="100%" height="110px" borderRadius="var(--radius-md)" />
              <div className="mock-loading-actions-skel">
                <SkeletonBlock width="46px" height="46px" borderRadius="50%" />
                <SkeletonBlock width="140px" height="44px" borderRadius="var(--radius-md)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Setup view
  if (mode === "setup") {
    return (
      <div className="home-page mock-interview-page">
        <header className="page-header">
          <h1>
            Interactive <span className="highlight">Mock Interview</span>
          </h1>
          <p className="pageSub">
            Practice one question at a time. Speak or type your answers, and get
            live scoring and constructive feedback from our AI.
          </p>
        </header>

        <div className="interview-card">
          <div className="interview-card__body">
            {/* Job Description Panel */}
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
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="panel__textarea"
                placeholder="Paste the job description here to target the questions..."
                maxLength={5000}
              />
              <div className="char-counter">
                {jobDescription.length} / 5000 chars
              </div>
            </div>

            <div className="panel-divider" />

            {/* Profile Details Panel */}
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
                <h2>Your Context</h2>
              </div>

              <div className="upload-section">
                <label className="section-label">Upload Resume</label>
                <label className="dropzone" htmlFor="mock-resume">
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
                      <p className="dropzone__title">
                        Click to upload or drag &amp; drop
                      </p>
                      <p className="dropzone__subtitle">
                        PDF or DOCX (Max 5MB)
                      </p>
                    </>
                  )}
                  <input
                    ref={resumeInputRef}
                    hidden
                    type="file"
                    id="mock-resume"
                    accept=".pdf,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        toast.warning("File exceeds 5MB limit.");
                        e.target.value = "";
                        setUploadedFileName("");
                        return;
                      }
                      setUploadedFileName(file.name);
                    }}
                  />
                </label>
              </div>

              <div className="or-divider">
                <span>OR</span>
              </div>

              <div className="self-description">
                <label className="section-label" htmlFor="selfDescription">
                  Quick Description
                </label>
                <textarea
                  id="selfDescription"
                  value={selfDescription}
                  onChange={(e) => setSelfDescription(e.target.value)}
                  className="panel__textarea panel__textarea--short"
                  placeholder="Describe your background and core stack..."
                />
              </div>

              <div className="difficulty-section" style={{ marginTop: "20px" }}>
                <label className="section-label" htmlFor="difficulty">
                  Difficulty
                </label>
                <select
                  id="difficulty"
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
                    cursor: "pointer",
                  }}
                >
                  <option
                    value="junior"
                    style={{ background: "#140927", color: "#fff" }}
                  >
                    Junior Level
                  </option>
                  <option
                    value="mid"
                    style={{ background: "#140927", color: "#fff" }}
                  >
                    Mid Level
                  </option>
                  <option
                    value="senior"
                    style={{ background: "#140927", color: "#fff" }}
                  >
                    Senior Level
                  </option>
                </select>
              </div>

              <div className="info-box" style={{ marginTop: "20px" }}>
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
                  A <strong>Resume</strong> or <strong>Self Description</strong>{" "}
                  is required — providing both gives the most personalized
                  results.
                </p>
              </div>
            </div>
          </div>

          <div className="interview-card__footer">
            <span className="footer-info">
              Genie will build a custom interactive flow
            </span>
            <button
              onClick={handleStartSession}
              className="generate-btn"
              type="button"
            >
              ✦ Start Simulation Mode
            </button>
          </div>
        </div>

        {(loading || (sessions && sessions.length > 0)) && (
          <section className="recent-reports" style={{ marginTop: "40px" }}>
            <h2>My Recent Mock Interviews</h2>
            {loading && (!sessions || sessions.length === 0) ? (
              <ul className="reports-list">
                {[1, 2, 3].map((i) => (
                  <li
                    key={i}
                    className="report-item"
                    style={{ cursor: "default" }}
                  >
                    <div style={{ marginBottom: "8px" }}>
                      <SkeletonBlock width="60%" height="20px" />
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <SkeletonBlock width="45%" height="14px" />
                    </div>
                    <SkeletonBlock width="130px" height="14px" />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="reports-list">
                {[...sessions].slice(0, 3).map((sess) => {
                  const totalScore = sess.answers.reduce(
                    (acc, item) => acc + item.score,
                    0,
                  );
                  const avgScore =
                    sess.answers.length > 0
                      ? (totalScore / sess.answers.length).toFixed(1)
                      : 0;
                  return (
                    <li
                      key={sess._id}
                      className="report-item"
                      onClick={() => {
                        setIsSessionLoading(true);
                        setMode("in_progress");
                        navigate(`/mock-interview?sessionId=${sess._id}`);
                      }}
                    >
                      <h3>{sess.title || "Untitled Position"}</h3>
                      <p className="report-meta">
                        Started on{" "}
                        {new Date(sess.createdAt).toLocaleDateString()}
                      </p>
                      <p className="match-score">
                        {sess.status === "completed"
                          ? `Average Score: ${avgScore} / 10`
                          : `In Progress (Q ${sess.currentQuestionIndex + 1})`}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>
    );
  }

  // Render Live Session In-Progress view
  if (mode === "in_progress" || mode === "feedback_wait") {
    const progressPercent = totalQuestions > 0 ? Math.max(0, ((questionNumber - 1) / totalQuestions) * 100) : 0;

    return (
      <div className="mock-interview-page">
        <header className="page-header" style={{ marginBottom: "30px" }}>
          <h1>
            Simulation <span className="highlight">In Progress</span>
          </h1>
        </header>

        <div className="live-session-container">
          <div className="progress-header">
            <span className="progress-text">
              Question {questionNumber} of {totalQuestions}
            </span>
            <span className="difficulty-badge">{difficulty}</span>
          </div>

          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="question-box">
            <h3>Interviewer Question</h3>
            {currentQuestion ? (
              <p>{currentQuestion}</p>
            ) : (
              <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                Loading question...
              </p>
            )}
          </div>

          {mode === "in_progress" ? (
            <div className="response-box">
              <textarea
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="Type your response here, or click the microphone to speak your answer..."
              />

              <div className="controls-row">
                <div className="mic-info-container">
                  <button
                    onClick={handleToggleMic}
                    disabled={!isSupported}
                    className={`mic-btn ${isListening ? "mic-btn--listening" : ""} ${
                      !isSupported ? "mic-tooltip" : ""
                    }`}
                    data-tooltip={
                      !isSupported
                        ? "Voice recognition unsupported on this browser"
                        : ""
                    }
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </button>
                  <span
                    className={`mic-info ${isListening ? "listening" : ""}`}
                  >
                    {isListening
                      ? "Listening active... Speak now."
                      : isSupported
                        ? "Click microphone to answer by voice"
                        : "Voice unsupported. Type your answer."}
                  </span>
                </div>

                <button
                  onClick={handleSubmitAnswer}
                  className="btn-primary"
                  disabled={isSubmitting || !typedAnswer.trim()}
                  type="button"
                  style={{
                    padding: "10px 22px",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  {isSubmitting ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        className="spinner"
                        style={{
                          width: "16px",
                          height: "16px",
                          borderTopColor: "#fff",
                        }}
                      />
                      Evaluating...
                    </div>
                  ) : (
                    "Submit Answer ➔"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Feedback Wait mode (Immediate scoring result show) */}
              {evaluation && (
                <div className="feedback-card">
                  <div className="feedback-header">
                    <h4>Instant Score Card</h4>
                    <span className="feedback-score">
                      {evaluation.score} / 10
                    </span>
                  </div>
                  <p>{evaluation.feedback}</p>
                </div>
              )}

              <div className="feedback-actions">
                <button
                  onClick={handleFinishEarly}
                  className="btn-secondary"
                  type="button"
                  style={{
                    padding: "10px 22px",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  Quit Early
                </button>
                <button
                  onClick={handleNextQuestion}
                  className="btn-primary"
                  type="button"
                  style={{
                    padding: "10px 22px",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  Next Question ➔
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Completed Summary view
  if (mode === "completed") {
    const totalScore = sessionAnswersHistory.reduce(
      (acc, item) => acc + item.score,
      0,
    );
    const avgScore =
      sessionAnswersHistory.length > 0
        ? (totalScore / sessionAnswersHistory.length).toFixed(1)
        : 0;

    return (
      <div className="mock-interview-page">
        <div className="summary-container">
          <div className="summary-header">
            <span className="completion-icon">🏆</span>
            <h2>Session Completed!</h2>
            <p>
              You have finished all interactive simulation questions for this
              position.
            </p>
          </div>

          <div className="average-score-card">
            <div className="score-circle">{avgScore}</div>
            <span>Average Score</span>
          </div>

          <div className="breakdown-section">
            <h3>Per-Question Breakdown</h3>
            <div className="breakdown-list">
              {sessionAnswersHistory.map((item, idx) => {
                const scoreClass =
                  item.score >= 8 ? "high" : item.score >= 5 ? "mid" : "low";

                return (
                  <div key={idx} className="breakdown-item">
                    <div className="item-header">
                      <span className="q-num">Question {idx + 1}</span>
                      <span className={`score-badge ${scoreClass}`}>
                        {item.score} / 10 Score
                      </span>
                    </div>
                    <p className="item-question">{item.question}</p>
                    <p className="item-answer">
                      <strong>Your Answer:</strong> {item.userAnswer}
                    </p>
                    <p className="item-feedback">
                      <span>Feedback:</span> {item.feedback}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="actions">
            <button
              onClick={() => {
                setMode("setup");
                setSessionId(null);
                setIsComplete(false);
              }}
              className="btn-secondary"
              type="button"
            >
              Start New Practice
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-primary"
              type="button"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MockInterview;
