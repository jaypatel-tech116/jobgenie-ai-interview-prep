import { useState, useCallback } from "react";
import {
  startMockInterview,
  submitMockAnswer,
  getMockInterviewSession,
  getAllMockInterviewSessions,
} from "../services/mockInterview.api";

/**
 * Custom hook to encapsulate mock interview state and api requests.
 */
export const useMockInterview = () => {
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [evaluation, setEvaluation] = useState(null);
  const [nextQuestionData, setNextQuestionData] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  const startSession = async ({ jobDescription, selfDescription, resumeFile, difficulty }) => {
    setLoading(true);
    setEvaluation(null);
    setNextQuestionData(null);
    setIsComplete(false);
    try {
      const data = await startMockInterview({
        jobDescription,
        selfDescription,
        resumeFile,
        difficulty,
      });
      setSessionId(data.sessionId);
      setCurrentQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      return data;
    } catch (err) {
      console.error("Start Session Hook Error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (userAnswer) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await submitMockAnswer(sessionId, { userAnswer });
      setEvaluation({
        score: data.score,
        feedback: data.feedback,
      });
      
      setIsComplete(data.isComplete);
      if (!data.isComplete) {
        setNextQuestionData({
          question: data.nextQuestion,
          questionNumber: questionNumber + 1,
        });
      }
      return data;
    } catch (err) {
      console.error("Submit Answer Hook Error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const goToNextQuestion = () => {
    if (nextQuestionData) {
      setCurrentQuestion(nextQuestionData.question);
      setQuestionNumber(nextQuestionData.questionNumber);
      setEvaluation(null);
      setNextQuestionData(null);
    }
  };

  const fetchSession = useCallback(async (id) => {
    setLoading(true);
    setEvaluation(null);
    setNextQuestionData(null);
    try {
      const data = await getMockInterviewSession(id);
      const session = data.session;
      setSessionId(session._id);
      setIsComplete(session.status === "completed");
      setTotalQuestions(session.questions.length);
      
      const currentIndex = session.currentQuestionIndex;
      setQuestionNumber(currentIndex + 1);
      if (currentIndex < session.questions.length) {
        setCurrentQuestion(session.questions[currentIndex].question);
      } else {
        setCurrentQuestion("");
      }
      
      setCurrentSession(session);
      return session;
    } catch (err) {
      console.error("Fetch Session Hook Error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllSessions = useCallback(async (page, limit) => {
    setLoading(true);
    try {
      const data = await getAllMockInterviewSessions(page, limit);
      setSessions(data.sessions);
      return data;
    } catch (err) {
      console.error("Fetch All Sessions Hook Error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    sessionId,
    currentQuestion,
    questionNumber,
    totalQuestions,
    evaluation,
    isComplete,
    sessions,
    currentSession,
    startSession,
    submitAnswer,
    goToNextQuestion,
    fetchSession,
    fetchAllSessions,
    setSessionId,
    setIsComplete,
  };
};
export default useMockInterview;
