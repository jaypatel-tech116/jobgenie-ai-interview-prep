const express = require("express");
const rateLimit = require("express-rate-limit");
const atsCheckController = require("../controllers/atsCheck.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/file.middleware");
const { atsCheckValidatorSchema, validate } = require("../validators/atsCheck.validator");

const atsCheckRouter = express.Router();

// 🌐 ATS Limiter (similar weight to general aiLimiter: 5 calls/min)
const atsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many ATS requests. Please wait a minute.",
  },
});

// Protect all routes
atsCheckRouter.use(authMiddleware.authUser);

/**
 * @route POST /api/ats-check/
 * @description Analyzes uploaded resume file for ATS readability and matching
 * @access Private
 */
atsCheckRouter.post(
  "/",
  atsLimiter,
  upload.single("resume"),
  validate(atsCheckValidatorSchema),
  atsCheckController.checkAtsScoreController
);

/**
 * @route GET /api/ats-check/
 * @description Lists past ATS score checks
 * @access Private
 */
atsCheckRouter.get(
  "/",
  atsCheckController.getAllAtsChecksController
);

module.exports = atsCheckRouter;
