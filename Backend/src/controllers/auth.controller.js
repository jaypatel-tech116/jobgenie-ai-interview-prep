const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");
const { getAuthCookieOptions } = require("../utils/cookieOptions");
const logger = require("../config/logger");
const otpModel = require("../models/otp.model");
const { sendOtpEmail } = require("../services/email.service");

const {auth} = require("../config/firebaseAdmin");

/**
 * @name registerUserController
 * @description Register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username, email and password.",
      });
    }
    const isUserAlreadyExists = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (isUserAlreadyExists) {
      if (isUserAlreadyExists.username === username) {
        return res.status(400).json({
          success: false,
          message: "Username already taken.",
        });
      }

      if (isUserAlreadyExists.email === email) {
        return res.status(400).json({
          success: false,
          message: "Account already exists with this email address.",
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      provider: "local",
    });

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.cookie("token", token, getAuthCookieOptions());

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        provider: user.provider,
      },
    });
  } catch (error) {
    logger.error("Register error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

/**
 * @name loginUserCountroller
 * @description Login a user, expects email and password in the request body
 * @access Public
 */

async function loginUserController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.provider === "google") {
      return res.status(400).json({
        success: false,
        message: "Please login using Google.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.cookie("token", token, getAuthCookieOptions());

    return res.status(200).json({
      success: true,
      message: "User loggedIn successfully.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        provider: user.provider,
      },
    });
  } catch (error) {
    logger.error("Login error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

/**
 * @name logoutUserCountroller
 * @description Clear token from user cookie and add the token in blacklist
 * @access Public
 */

async function logoutUserController(req, res) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      await tokenBlacklistModel.create({ token });
    }

    res.clearCookie("token", getAuthCookieOptions());

    return res.status(200).json({
      success: true,
      message: "User logged out successfully.",
    });
  } catch (error) {
    logger.error("Logout error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

/**
 * @name googleAuthController
 * @description Register or login using google
 * @access Public
 */
async function googleAuthController(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token required",
      });
    }

    // ✅ Verify Firebase token
    let decoded;
    if (process.env.NODE_ENV === "development") {
      decoded = jwt.decode(token);
      if (decoded) {
        decoded.uid = decoded.sub || decoded.user_id;
      }
    } else {
      decoded = await auth.verifyIdToken(token);
    }

    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    const { email, name, picture, uid } = decoded;

    // ✅ Check user
    let user = await userModel.findOne({
      $or: [{ email }, { googleId: uid }],
    });

    // 🧠 Merge existing account
    if (user && !user.googleId) {
      user.googleId = uid;
      user.provider = "google";
      user.avatar = picture || user.avatar;
      await user.save();
    }

    // 🆕 Create new user
    if (!user) {
      user = await userModel.create({
        username: name,
        email,
        avatar: picture,
        provider: "google",
        googleId: uid,
        isEmailVerified: true,
      });
    }

    // ✅ Create YOUR JWT
    const appToken = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.cookie("token", appToken, getAuthCookieOptions());

    return res.status(200).json({
      success: true,
      token: appToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        provider: user.provider,
      },
    });
  } catch (error) {
    logger.error("Google auth error: %s", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid Google token",
    });
  }
}

/**
 * @name getMeController
 * @description Get current logged in user details
 * @access Private
 */
async function getMeController(req, res) {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User Details fetched successfully.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        provider: user.provider,
      },
    });
  } catch (error) {
    logger.error("GetMe error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

/**
 * @name requestEmailVerificationController
 * @description Send email verification link. Scaffolded for future SMTP credentials.
 * @access Private
 */
async function requestEmailVerificationController(req, res) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Guard against Google-auth accounts
    if (user.provider === "google") {
      return res.status(400).json({
        success: false,
        message: "Google accounts are already verified.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified.",
      });
    }

    const otp = await otpModel.createOtp(user._id, "email_verification");
    await sendOtpEmail({
      to: user.email,
      otp,
      purpose: "email_verification",
    });

    return res.status(200).json({
      success: true,
      message: "Verification OTP code sent to your email.",
    });
  } catch (error) {
    logger.error("Request email verification error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error sending verification email.",
    });
  }
}

/**
 * @name confirmEmailVerificationController
 * @description Verify email using OTP code.
 * @access Private
 */
async function confirmEmailVerificationController(req, res) {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP code is required.",
      });
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isVerified = await otpModel.verifyOtp(user._id, "email_verification", otp);
    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification OTP.",
      });
    }

    user.isEmailVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    logger.error("Confirm email verification error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error verifying email.",
    });
  }
}

/**
 * @name forgotPasswordController
 * @description Send forgot password OTP.
 * @access Public
 */
async function forgotPasswordController(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    // Guard against Google-auth accounts
    if (user.provider === "google" || !user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google Sign-In — there's no password to reset. Continue with Google instead.",
      });
    }

    const otp = await otpModel.createOtp(user._id, "password_reset");
    await sendOtpEmail({
      to: user.email,
      otp,
      purpose: "password_reset",
    });

    return res.status(200).json({
      success: true,
      message: "Password reset OTP sent to your email.",
    });
  } catch (error) {
    logger.error("Forgot password error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error sending password reset email.",
    });
  }
}

/**
 * @name resetPasswordController
 * @description Reset password using OTP code.
 * @access Public
 */
async function resetPasswordController(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP and new password are required.",
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isVerified = await otpModel.verifyOtp(user._id, "password_reset", otp);
    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset OTP.",
      });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    // Blacklist current session if any
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
      await tokenBlacklistModel.create({ token });
    }
    res.clearCookie("token", getAuthCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    logger.error("Reset password error: %s", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error resetting password.",
    });
  }
}

module.exports = {
  registerUserController,
  loginUserController,
  logoutUserController,
  googleAuthController,
  getMeController,
  requestEmailVerificationController,
  confirmEmailVerificationController,
  forgotPasswordController,
  resetPasswordController,
};
