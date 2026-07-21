const { extractResumeText } = require("../utils/fileExtractor");
const {
  generateInterviewReport,
  generateResumePdf,
  generateReportPdf,
  generateCoverLetterPdf,
} = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");
const logger = require("../config/logger");

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 * @access Private
 */
async function generateInterviewReportController(req, res) {
  try {
    // allow resume OR selfDescription
    if (!req.file && !req.body.selfDescription) {
      return res.status(400).json({
        success: false,
        message: "Either resume or self description is required",
      });
    }

    let resumeContent = "";
    // parse only if file exists
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
    const diff = ["junior", "mid", "senior"].includes(difficulty) ? difficulty : "mid";

    let interviewReportByAI;
    try {
      interviewReportByAI = await generateInterviewReport({
        resume: resumeContent,
        selfDescription,
        jobDescription,
        difficulty: diff,
      });
    } catch (err) {
      logger.error("AI Error: %s", err.message);
      return res.status(500).json({
        success: false,
        message: "AI service failed. Please try again.",
      });
    }

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeContent,
      selfDescription,
      jobDescription,
      difficulty: diff,
      ...interviewReportByAI,
    });

    return res.status(201).json({
      success: true,
      message: "Interview report generated successfully.",

      interviewReport: {
        id: interviewReport._id,
        user: interviewReport.user,

        title: interviewReport.title,
        matchScore: interviewReport.matchScore,
        difficulty: interviewReport.difficulty,
        shareToken: interviewReport.shareToken,

        jobDescription: interviewReport.jobDescription,
        selfDescription: interviewReport.selfDescription,

        technicalQuestions: interviewReport.technicalQuestions,
        behavioralQuestions: interviewReport.behavioralQuestions,
        skillGaps: interviewReport.skillGaps,
        preparationPlan: interviewReport.preparationPlan,

        createdAt: interviewReport.createdAt,
      },
    });
  } catch (error) {
    logger.error("Generate report error: %s", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to generate interview report",
    });
  }
}

/**
 * @description Controller to get interview report by interviewId.
 * @access Private
 */
async function getInterviewReportByIdController(req, res) {
  try {
    const { interviewId } = req.params;

    const interviewReport = await interviewReportModel
      .findOne({
        _id: interviewId,
        user: req.user.id,
      })
      .lean();

    if (!interviewReport) {
      return res.status(400).json({
        success: false,
        message: "Interview report not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interview report fetched successfully.",
      interviewReport,
    });
  } catch (error) {
    logger.error("Fetch Error: %s", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch interview report",
    });
  }
}

/**
 * @description Controller to get all interview reports of logged in user.
 * @access Private
 */
async function getAllInterviewReportController(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [interviewReports, total] = await Promise.all([
      interviewReportModel
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -preparationPlan",
        )
        .lean(),
      interviewReportModel.countDocuments({ user: req.user.id }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Interview reports fetched successfully.",
      interviewReports,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    logger.error("Fetch All Error: %s", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch interview reports",
    });
  }
}

/**
 * @description Controller to generate resume PDF based on user sel description, resume content and job description.
 * @access Private
 */
async function generateResumePdfController(req, res) {
  try {
    const { interviewReportId } = req.params;

    if (!interviewReportId) {
      return res.status(400).json({
        success: false,
        message: "Interview report ID is required",
      });
    }

    // ✅ secure: check user ownership
    const interviewReport = await interviewReportModel.findOne({
      _id: interviewReportId,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({
        success: false,
        message: "Interview report not found",
      });
    }

    const { resume, jobDescription, selfDescription } = interviewReport;

    const pdfBuffer = await generateResumePdf({
      resume,
      jobDescription,
      selfDescription,
    });

    // ADD THIS CHECK
    if (!pdfBuffer || pdfBuffer.length < 100) {
      throw new Error("Invalid PDF generated");
    }

    // headers
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    return res.end(pdfBuffer);
  } catch (err) {
    logger.error("Resume PDF Error: %s", err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to generate resume PDF",
    });
  }
}

/**
 * @description Controller to delete an interview report by ID.
 * @access Private
 */
async function deleteInterviewReportController(req, res) {
  try {
    const { interviewId } = req.params;

    const report = await interviewReportModel.findOneAndDelete({
      _id: interviewId,
      user: req.user.id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Interview report not found or unauthorized.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interview report deleted successfully.",
    });
  } catch (error) {
    logger.error("Delete Report Error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete interview report",
    });
  }
}

/**
 * @description Controller to update interview report (e.g. title) by ID.
 * @access Private
 */
async function updateInterviewReportController(req, res) {
  try {
    const { interviewId } = req.params;
    const { title } = req.body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Title is required and must be a non-empty string.",
      });
    }

    const report = await interviewReportModel.findOneAndUpdate(
      { _id: interviewId, user: req.user.id },
      { $set: { title: title.trim() } },
      { returnDocument: 'after' }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Interview report not found or unauthorized.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interview report title updated successfully.",
      interviewReport: report,
    });
  } catch (error) {
    logger.error("Update Report Error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update interview report",
    });
  }
}

/**
 * @description Controller to generate interview report PDF (Q&A section, plan, gaps).
 * @access Private
 */
async function generateInterviewReportPdfController(req, res) {
  try {
    const { interviewReportId } = req.params;

    if (!interviewReportId) {
      return res.status(400).json({
        success: false,
        message: "Interview report ID is required",
      });
    }

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewReportId,
      user: req.user.id,
    }).lean();

    if (!interviewReport) {
      return res.status(404).json({
        success: false,
        message: "Interview report not found",
      });
    }

    const pdfBuffer = await generateReportPdf(interviewReport);

    if (!pdfBuffer || pdfBuffer.length < 100) {
      throw new Error("Invalid Q&A PDF generated");
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=report_${interviewReportId}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    return res.end(pdfBuffer);
  } catch (err) {
    logger.error("Interview Q&A PDF Error: %s", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate interview report PDF",
    });
  }
}

/**
 * @description Controller to generate Cover Letter PDF based on resume + JD in the report.
 * @access Private
 */
async function generateCoverLetterPdfController(req, res) {
  try {
    const { interviewReportId } = req.params;

    if (!interviewReportId) {
      return res.status(400).json({
        success: false,
        message: "Interview report ID is required",
      });
    }

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewReportId,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({
        success: false,
        message: "Interview report not found",
      });
    }

    const { resume, jobDescription, selfDescription } = interviewReport;

    const pdfBuffer = await generateCoverLetterPdf({
      resume,
      jobDescription,
      selfDescription,
    });

    if (!pdfBuffer || pdfBuffer.length < 100) {
      throw new Error("Invalid cover letter PDF generated");
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=cover_letter_${interviewReportId}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    return res.end(pdfBuffer);
  } catch (err) {
    logger.error("Cover Letter PDF Error: %s", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate cover letter PDF",
    });
  }
}

/**
 * @description Controller to fetch an interview report by public share token without authentication.
 * @access Public
 */
async function getSharedInterviewReportController(req, res) {
  try {
    const { shareToken } = req.params;

    const interviewReport = await interviewReportModel
      .findOne({ shareToken })
      .lean();

    if (!interviewReport) {
      return res.status(404).json({
        success: false,
        message: "Shared interview report not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Shared interview report fetched successfully.",
      interviewReport,
    });
  } catch (error) {
    logger.error("Fetch Shared Report Error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shared interview report",
    });
  }
}

module.exports = {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportController,
  generateResumePdfController,
  deleteInterviewReportController,
  updateInterviewReportController,
  generateInterviewReportPdfController,
  generateCoverLetterPdfController,
  getSharedInterviewReportController,
};
