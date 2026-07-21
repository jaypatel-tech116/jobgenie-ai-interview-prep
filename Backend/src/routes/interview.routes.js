const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controllers/interview.controller");
const upload = require("../middlewares/file.middleware");
const rateLimit = require("express-rate-limit");

const interviewRouter = express.Router();

// AI LIMITER (ONLY FOR GENERATE)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // max 5 AI calls per minute
  message: {
    success: false,
    message: "Too many AI requests. Please wait a moment.",
  },
});

/**
 * @route POST api/interview
 * @description Generate new interview report on the basis of user self description, resume pdf and job description
 * @access Private
 */
interviewRouter.post(
  "/",
  authMiddleware.authUser,
  aiLimiter,
  upload.single("resume"),
  interviewController.generateInterviewReportController,
);

/**
 * @route GET api/interview/report/:interviewId
 * @description Get interview report by interviewId.
 * @access Private
 */
interviewRouter.get(
  "/report/:interviewId",
  authMiddleware.authUser,
  interviewController.getInterviewReportByIdController,
);

/**
 * @route GET api/interview
 * @description Get all interview reports of logged in user.
 * @access Private
 */
interviewRouter.get(
  "/",
  authMiddleware.authUser,
  interviewController.getAllInterviewReportController,
);

/**
 * @route POST /resume/pdf/:interviewReportId
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post(
  "/resume/pdf/:interviewReportId",
  authMiddleware.authUser,
  interviewController.generateResumePdfController,
);

/**
 * @route POST /report/pdf/:interviewReportId
 * @description generate interview Q&A report PDF based on generated questions, plan, gaps.
 * @access private
 */
interviewRouter.post(
  "/report/pdf/:interviewReportId",
  authMiddleware.authUser,
  interviewController.generateInterviewReportPdfController,
);

/**
 * @route DELETE api/interview/:interviewId
 * @description Delete an interview report.
 * @access Private
 */
interviewRouter.delete(
  "/:interviewId",
  authMiddleware.authUser,
  interviewController.deleteInterviewReportController,
);

/**
 * @route PATCH api/interview/:interviewId
 * @description Update interview report details (e.g. title).
 * @access Private
 */
interviewRouter.patch(
  "/:interviewId",
  authMiddleware.authUser,
  interviewController.updateInterviewReportController,
);



/**
 * @route POST /cover-letter/pdf/:interviewReportId
 * @description generate cover letter PDF based on resume + JD in the report.
 * @access private
 */
interviewRouter.post(
  "/cover-letter/pdf/:interviewReportId",
  authMiddleware.authUser,
  interviewController.generateCoverLetterPdfController,
);

/**
 * @route GET api/interview/shared/:shareToken
 * @description Fetch a shared interview report publicly.
 * @access Public
 */
interviewRouter.get(
  "/shared/:shareToken",
  interviewController.getSharedInterviewReportController,
);

module.exports = interviewRouter;
