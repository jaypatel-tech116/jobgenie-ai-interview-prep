const { z } = require("zod");

const startMockSchema = z.object({
  jobDescription: z
    .string({ required_error: "Job description is required" })
    .min(10, "Job description must be at least 10 characters")
    .max(5000, "Job description must be at most 5000 characters"),
  selfDescription: z
    .string()
    .max(2000, "Self description must be at most 2000 characters")
    .optional(),
  difficulty: z
    .enum(["junior", "mid", "senior"])
    .optional(),
});

const submitAnswerSchema = z.object({
  userAnswer: z
    .string({ required_error: "Answer is required" })
    .min(1, "Answer cannot be empty")
    .max(3000, "Answer is too long"),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message,
      });
    }
    next();
  };
}

module.exports = {
  startMockSchema,
  submitAnswerSchema,
  validate,
};
