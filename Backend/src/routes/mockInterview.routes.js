const express = require("express");
const rateLimit = require("express-rate-limit");
const mockInterviewController = require("../controllers/mockInterview.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/file.middleware");
const { startMockSchema, submitAnswerSchema, validate } = require("../validators/mockInterview.validator");

const mockInterviewRouter = express.Router();

// General mock-interview rate limiter (slower, for start sessions)
const mockStartLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many sessions started. Please wait a minute.",
  },
});

// Permissive rate limiter specifically for scoring answers live
const mockSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 per minute = fast live evaluation loops
  message: {
    success: false,
    message: "You are answering questions too quickly. Please slow down.",
  },
});

// Protect all routes
mockInterviewRouter.use(authMiddleware.authUser);

/**
 * @route POST /api/mock-interview/
 * @description Starts a mock interview session
 * @access Private
 */
mockInterviewRouter.post(
  "/",
  mockStartLimiter,
  upload.single("resume"),
  validate(startMockSchema),
  mockInterviewController.startMockInterviewController
);

/**
 * @route POST /api/mock-interview/:sessionId/submit
 * @description Submits a candidate response and evaluates it
 * @access Private
 */
mockInterviewRouter.post(
  "/:sessionId/submit",
  mockSubmitLimiter,
  validate(submitAnswerSchema),
  mockInterviewController.submitMockAnswerController
);

/**
 * @route GET /api/mock-interview/:sessionId
 * @description Gets a single mock interview session details
 * @access Private
 */
mockInterviewRouter.get(
  "/:sessionId",
  mockInterviewController.getMockInterviewSessionController
);

/**
 * @route GET /api/mock-interview/
 * @description Gets all mock interview sessions of the logged-in user
 * @access Private
 */
mockInterviewRouter.get(
  "/",
  mockInterviewController.getAllMockInterviewSessionsController
);

module.exports = mockInterviewRouter;
