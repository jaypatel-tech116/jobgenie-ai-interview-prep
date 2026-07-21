const mongoose = require("mongoose");

const atsIssueSchema = new mongoose.Schema(
  {
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    issue: {
      type: String,
      required: true,
    },
    fix: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const atsCheckSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    issues: [atsIssueSchema],
    strengths: [
      {
        type: String,
        required: true,
      },
    ],
    jobDescription: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // only createdAt needed for history
  }
);

atsCheckSchema.index({ user: 1, createdAt: -1 });

const atsCheckModel = mongoose.model("AtsCheck", atsCheckSchema);

module.exports = atsCheckModel;
