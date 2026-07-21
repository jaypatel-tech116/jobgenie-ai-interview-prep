const mongoose = require("mongoose");

const mockQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    modelAnswer: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const mockAnswerSchema = new mongoose.Schema(
  {
    questionIndex: {
      type: Number,
      required: true,
    },
    userAnswer: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 10,
      required: true,
    },
    feedback: {
      type: String,
      required: true,
    },
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const mockInterviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["junior", "mid", "senior"],
      default: "mid",
      required: true,
    },
    questions: [mockQuestionSchema],
    answers: [mockAnswerSchema],
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

mockInterviewSessionSchema.index({ user: 1, createdAt: -1 });

const mockInterviewSessionModel = mongoose.model(
  "MockInterviewSession",
  mockInterviewSessionSchema
);

module.exports = mockInterviewSessionModel;
