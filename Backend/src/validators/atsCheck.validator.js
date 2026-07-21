const { z } = require("zod");

const atsCheckValidatorSchema = z.object({
  jobDescription: z
    .string()
    .max(5000, "Job description must be at most 5000 characters")
    .optional(),
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
  atsCheckValidatorSchema,
  validate,
};
