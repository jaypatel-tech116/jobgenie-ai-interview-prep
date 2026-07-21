const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  confirmEmailVerificationSchema,
  resetPasswordSchema,
  validate,
} = require("../validators/auth.validator");

const authRouter = express.Router();

// 🔒 Stricter rate limiter for auth endpoints (separate from general 100/min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8,
  message: {
    success: false,
    message: "Too many attempts, please try again later.",
  },
});

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.registerUserController,
);

/**
 * @route POST /api/auth/login
 * @description Login user with email and passsword
 * @access Public
 */
authRouter.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  authController.loginUserController,
);

/**
 * @route GET /api/auth/logout
 * @description Clear token from user cookie and add the token in blacklist
 * @access Public
 */
authRouter.get("/logout", authController.logoutUserController);

/**
 * @route POST /api/auth/google
 * @description Login and register using google
 * @access Public
 */
authRouter.post("/google", authController.googleAuthController);

/**
 * @route GET /api/auth/get-me
 * @description Get current logged in user details
 * @access Private
 */
authRouter.get(
  "/get-me",
  authMiddleware.authUser,
  authController.getMeController,
);

/**
 * @route POST /api/auth/verify-email/request
 * @description Request verification email OTP
 * @access Private
 */
authRouter.post(
  "/verify-email/request",
  authLimiter,
  authMiddleware.authUser,
  authController.requestEmailVerificationController,
);

/**
 * @route POST /api/auth/verify-email/confirm
 * @description Verify user email by OTP code
 * @access Private
 */
authRouter.post(
  "/verify-email/confirm",
  authLimiter,
  authMiddleware.authUser,
  validate(confirmEmailVerificationSchema),
  authController.confirmEmailVerificationController,
);

/**
 * @route POST /api/auth/forgot-password
 * @description Forgot password request, sends OTP
 * @access Public
 */
authRouter.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPasswordController,
);

/**
 * @route POST /api/auth/reset-password
 * @description Reset password using email, OTP, and newPassword
 * @access Public
 */
authRouter.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPasswordController,
);

module.exports = authRouter;
