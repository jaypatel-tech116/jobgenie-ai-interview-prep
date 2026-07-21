const logger = require("../config/logger");
const { buildOtpEmailHtml } = require("../utils/emailTemplate");
const axios = require("axios");

/**
 * Sends OTP Email to the recipient using the Brevo HTTP API.
 */
async function sendOtpEmail({ to, otp, purpose }) {
  try {
    let subject = "Your JobGenie OTP Code";
    let title = "Verification Code";
    let message = "Please use the following One-Time Password (OTP) to verify your action on JobGenie.";

    if (purpose === "email_verification") {
      subject = "Verify Your Email — JobGenie";
      title = "Confirm Your Email Address";
      message = "Thanks for signing up for JobGenie! To complete your registration and unlock all mock-interview and resume analysis features, please verify your email address using this code:";
    } else if (purpose === "password_reset") {
      subject = "Reset Your Password — JobGenie";
      title = "Password Reset Request";
      message = "We received a request to reset the password for your JobGenie account. Please enter this code to complete the password reset process:";
    }

    const html = buildOtpEmailHtml({ title, otp, message });

    logger.info(`Sending email to ${to} via Brevo HTTP API...`);

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "JobGenie",
          email: process.env.EMAIL_FROM || "noreply@jobgenie.com",
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY || "placeholder_brevo_api_key",
          "Content-Type": "application/json",
        },
      }
    );

    logger.info(`Email sent via Brevo API successfully to ${to}: ${response.data.messageId}`);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  sendOtpEmail,
};
