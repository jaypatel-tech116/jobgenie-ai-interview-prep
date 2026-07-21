const atsCheckModel = require("../models/atsCheck.model");
const { checkAtsScore } = require("../services/ai.service");
const { extractResumeText } = require("../utils/fileExtractor");
const logger = require("../config/logger");

/**
 * @name checkAtsScoreController
 * @description Analyzes uploaded resume text, calls AI to evaluate ATS parameters, and saves the check history.
 * @access Private
 */
async function checkAtsScoreController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required.",
      });
    }

    const resumeContent = await extractResumeText(req.file);
    if (resumeContent === null) {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type. Only PDF and DOCX are accepted.",
      });
    }

    const { jobDescription } = req.body;

    let evaluation;
    try {
      evaluation = await checkAtsScore({
        resumeText: resumeContent,
        jobDescription,
      });
    } catch (err) {
      logger.error("ATS AI Evaluation error: %s", err.message);
      return res.status(500).json({
        success: false,
        message: "AI service failed to evaluate the resume.",
      });
    }

    // Save history
    const checkRecord = await atsCheckModel.create({
      user: req.user.id,
      atsScore: evaluation.atsScore,
      issues: evaluation.issues,
      strengths: evaluation.strengths,
      jobDescription: jobDescription || "",
    });

    return res.status(201).json({
      success: true,
      message: "Resume analyzed successfully.",
      atsCheck: {
        id: checkRecord._id,
        atsScore: checkRecord.atsScore,
        issues: checkRecord.issues,
        strengths: checkRecord.strengths,
        jobDescription: checkRecord.jobDescription,
        createdAt: checkRecord.createdAt,
      },
    });
  } catch (error) {
    logger.error("Check ATS score error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error checking ATS score.",
    });
  }
}

/**
 * @name getAllAtsChecksController
 * @description Fetches all past ATS check logs for the user in a paginated format.
 * @access Private
 */
async function getAllAtsChecksController(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [checks, total] = await Promise.all([
      atsCheckModel
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      atsCheckModel.countDocuments({ user: req.user.id }),
    ]);

    return res.status(200).json({
      success: true,
      message: "ATS checks fetched successfully.",
      checks,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    logger.error("Get past ATS checks error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching past ATS checks.",
    });
  }
}

module.exports = {
  checkAtsScoreController,
  getAllAtsChecksController,
};
