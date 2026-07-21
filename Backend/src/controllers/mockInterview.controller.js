const mockInterviewSessionModel = require("../models/mockInterviewSession.model");
const { generateQuestionSet, scoreMockAnswer } = require("../services/ai.service");
const { extractResumeText } = require("../utils/fileExtractor");
const logger = require("../config/logger");

/**
 * @name startMockInterviewController
 * @description Starts a mock interview session, generates questions and returns the first question
 * @access Private
 */
async function startMockInterviewController(req, res) {
  try {
    let resumeContent = "";
    if (req.file) {
      resumeContent = await extractResumeText(req.file);
      if (resumeContent === null) {
        return res.status(400).json({
          success: false,
          message: "Unsupported file type. Only PDF and DOCX are accepted.",
        });
      }
    }

    const { selfDescription, jobDescription, difficulty } = req.body;
    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: "Job description is required",
      });
    }

    const diff = ["junior", "mid", "senior"].includes(difficulty) ? difficulty : "mid";

    // Generate question set using AI
    let questions;
    try {
      questions = await generateQuestionSet({
        resume: resumeContent,
        jobDescription,
        selfDescription,
        difficulty: diff,
      });
    } catch (err) {
      logger.error("Failed to generate questions: %s", err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to generate mock interview questions",
      });
    }

    if (!questions || questions.length === 0) {
      return res.status(500).json({
        success: false,
        message: "AI did not return any questions",
      });
    }

    // Create session in database
    const session = await mockInterviewSessionModel.create({
      user: req.user.id,
      jobDescription,
      difficulty: diff,
      questions,
      answers: [],
      currentQuestionIndex: 0,
      status: "in_progress",
    });

    return res.status(201).json({
      success: true,
      message: "Mock interview started successfully.",
      sessionId: session._id,
      question: questions[0].question,
      questionNumber: 1,
      totalQuestions: questions.length,
    });
  } catch (error) {
    logger.error("Start mock interview error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error starting mock interview",
    });
  }
}

/**
 * @name submitMockAnswerController
 * @description Submits a userAnswer, evaluates it, and returns score/feedback + the next question
 * @access Private
 */
async function submitMockAnswerController(req, res) {
  try {
    const { sessionId } = req.params;
    const { userAnswer } = req.body;

    if (!userAnswer || userAnswer.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "User answer is required.",
      });
    }

    const session = await mockInterviewSessionModel.findOne({
      _id: sessionId,
      user: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Mock interview session not found",
      });
    }

    if (session.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Interview session is already completed.",
      });
    }

    const currentIndex = session.currentQuestionIndex;
    if (currentIndex >= session.questions.length) {
      return res.status(400).json({
        success: false,
        message: "No more questions in this session.",
      });
    }

    const currentQuestionObj = session.questions[currentIndex];

    // Score the answer via AI
    let evaluation;
    try {
      evaluation = await scoreMockAnswer({
        question: currentQuestionObj.question,
        modelAnswer: currentQuestionObj.modelAnswer,
        userAnswer,
      });
    } catch (err) {
      logger.error("Failed to score answer: %s", err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to evaluate answer",
      });
    }

    // Append to answers array
    session.answers.push({
      questionIndex: currentIndex,
      userAnswer,
      score: evaluation.score,
      feedback: evaluation.feedback,
      answeredAt: new Date(),
    });

    // Advance current index
    const nextIndex = currentIndex + 1;
    session.currentQuestionIndex = nextIndex;

    const isComplete = nextIndex >= session.questions.length;
    if (isComplete) {
      session.status = "completed";
      session.completedAt = new Date();
    }

    await session.save();

    const nextQuestion = isComplete ? null : session.questions[nextIndex].question;

    return res.status(200).json({
      success: true,
      message: "Answer submitted and evaluated.",
      score: evaluation.score,
      feedback: evaluation.feedback,
      nextQuestion,
      isComplete,
    });
  } catch (error) {
    logger.error("Submit mock answer error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error submitting answer",
    });
  }
}

/**
 * @name getMockInterviewSessionController
 * @description Gets a single mock interview session by id (ownership checked, leaks no existence via 404)
 * @access Private
 */
async function getMockInterviewSessionController(req, res) {
  try {
    const { sessionId } = req.params;
    const session = await mockInterviewSessionModel.findOne({
      _id: sessionId,
      user: req.user.id,
    }).lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Mock interview session not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Mock interview session fetched successfully.",
      session,
    });
  } catch (error) {
    logger.error("Get mock interview session error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching mock interview session",
    });
  }
}

/**
 * @name getAllMockInterviewSessionsController
 * @description Fetches all mock interview sessions of the logged-in user in a paginated list
 * @access Private
 */
async function getAllMockInterviewSessionsController(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      mockInterviewSessionModel
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-answers.userAnswer -answers.feedback -answers.question -__v")
        .lean(),
      mockInterviewSessionModel.countDocuments({ user: req.user.id }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Mock interview sessions fetched successfully.",
      sessions,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    logger.error("Get all mock interview sessions error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching mock interview sessions",
    });
  }
}

module.exports = {
  startMockInterviewController,
  submitMockAnswerController,
  getMockInterviewSessionController,
  getAllMockInterviewSessionsController,
};
