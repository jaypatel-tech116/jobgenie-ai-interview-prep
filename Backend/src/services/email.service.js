const nodemailer = require("nodemailer");
const logger = require("../config/logger");
const { buildOtpEmailHtml } = require("../utils/emailTemplate");
const axios = require("axios");
const path = require("path");

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



    const html = buildOtpEmailHtml({ title, otp, message });

    // RESEND HTTP API FALLBACK (Render Free tier blocks outbound SMTP ports 25, 465, and 587)
    if (process.env.RESEND_API_KEY) {
      logger.info(`RESEND_API_KEY found, sending email to ${to} via Resend HTTP API...`);
      const response = await axios.post(
        "https://api.resend.com/emails",
        {
          from: process.env.EMAIL_FROM || "onboarding@resend.dev",
          to: [to],
          subject,
          html,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      logger.info(`Email sent via Resend API successfully to ${to}: ${response.data.id}`);
      return { success: true, messageId: response.data.id };
    }

    // BREVO HTTP API FALLBACK (Alternative Free tier HTTP API)
    if (process.env.BREVO_API_KEY) {
      logger.info(`BREVO_API_KEY found, sending email to ${to} via Brevo HTTP API...`);
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
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      logger.info(`Email sent via Brevo API successfully to ${to}: ${response.data.messageId}`);
      return { success: true, messageId: response.data.messageId };
    }

    // MAILJET HTTP API FALLBACK (Alternative Free tier HTTP API)
    if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
      logger.info(`MAILJET_API_KEY found, sending email to ${to} via Mailjet HTTP API...`);
      const response = await axios.post(
        "https://api.mailjet.com/v3.1/send",
        {
          Messages: [
            {
              From: {
                Email: process.env.EMAIL_FROM || "noreply@jobgenie.com",
                Name: "JobGenie",
              },
              To: [
                {
                  Email: to,
                },
              ],
              Subject: subject,
              HTMLPart: html,
            },
          ],
        },
        {
          auth: {
            username: process.env.MAILJET_API_KEY,
            password: process.env.MAILJET_SECRET_KEY,
          },
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      logger.info(`Email sent via Mailjet API successfully to ${to}: ${response.data.Messages[0].To[0].MessageID}`);
      return { success: true, messageId: response.data.Messages[0].To[0].MessageID };
    }

    // Default SMTP fallback
    const logoPath = path.join(__dirname, "../assets/MainLogo.png");

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
