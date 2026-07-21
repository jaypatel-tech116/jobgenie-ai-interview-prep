const mongoose = require("mongoose");
const crypto = require("crypto");

const otpSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ["email_verification", "password_reset"],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0, // TTL index: documents expire when Date.now() >= expiresAt
  },
});

// SHA-256 helper
function hashOtp(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Creates and stores a 6-digit OTP for the user and purpose.
 * Invalidates any existing OTPs for the same user and purpose.
 * Returns the raw 6-digit code for mailing.
 */
otpSchema.statics.createOtp = async function (userId, purpose) {
  // 1. Delete existing OTPs for this user and purpose
  await this.deleteMany({ user: userId, purpose });

  // 2. Generate a random 6-digit code
  const rawCode = Math.floor(100000 + Math.random() * 900000).toString();

  // 3. Hash code and set expiry to 15 minutes from now
  const otpHash = hashOtp(rawCode);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins TTL

  // 4. Save to database
  await this.create({
    user: userId,
    otpHash,
    purpose,
    expiresAt,
  });

  return rawCode;
};

/**
 * Verifies the OTP, checking match and manually checking expiry.
 * If correct, deletes all matching purpose OTPs for this user (one-time use) and returns true.
 * If incorrect or expired, returns false.
 */
otpSchema.statics.verifyOtp = async function (userId, purpose, submittedCode) {
  const hash = hashOtp(submittedCode);

  // Find active OTP
  const otpRecord = await this.findOne({ user: userId, purpose, otpHash: hash });

  if (!otpRecord) {
    return false;
  }

  // Double-check expiry in JS to prevent race conditions before TTL runner deletes it
  if (otpRecord.expiresAt < new Date()) {
    await this.deleteOne({ _id: otpRecord._id });
    return false;
  }

  // Delete OTP upon successful verification
  await this.deleteOne({ _id: otpRecord._id });
  return true;
};

const otpModel = mongoose.model("Otp", otpSchema);

module.exports = otpModel;
