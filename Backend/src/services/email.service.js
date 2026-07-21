const nodemailer = require("nodemailer");
const logger = require("../config/logger");
const { buildOtpEmailHtml } = require("../utils/emailTemplate");

// Create standard transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: parseInt(process.env.SMTP_PORT, 10) || 2525,
  auth: {
    user: process.env.SMTP_USER || "placeholder_smtp_user",
    pass: process.env.SMTP_PASS || "placeholder_smtp_password",
  },
});

/**
 * Sends OTP Email to the recipient.
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

    const path = require("path");
    const logoPath = path.join(__dirname, "../../../Frontend/src/images/MainLogo.png");

    const html = buildOtpEmailHtml({ title, otp, message });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"JobGenie Team" <noreply@jobgenie.com>',
      to,
      subject,
      html,
      attachments: [
        {
          filename: "MainLogo.png",
          path: logoPath,
          cid: "mainlogo",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  sendOtpEmail,
};
