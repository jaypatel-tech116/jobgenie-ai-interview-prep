/**
 * Email template for OTP verification.
 * Built with email-client-safe table layouts, inline styles, flat colors, and system fonts.
 */
function buildOtpEmailHtml({ title, otp, message }) {
  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; font-family: Arial, Helvetica, sans-serif; padding: 40px 0; margin: 0;">
      <tr>
        <td align="center">
          <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #140927; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15); padding: 40px;">
            <!-- Header/Logo Text -->
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; line-height: 1.2;">
                  <span style="color: #d4a017;">JobGenie</span>
                  <span style="color: #ffffff; font-weight: 400; font-size: 18px;"> - AI Interview Prep</span>
                </div>
              </td>
            </tr>
            <!-- Title -->
            <tr>
              <td align="center" style="padding-bottom: 20px;">
                <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0; line-height: 1.3;">${title}</h1>
              </td>
            </tr>
            <!-- Message -->
            <tr>
              <td align="left" style="color: #a89fc0; font-size: 15px; line-height: 1.6; padding-bottom: 30px; text-align: center;">
                ${message}
              </td>
            </tr>
            <!-- OTP Box -->
            <tr>
              <td align="center" style="padding-bottom: 30px;">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="background-color: #0f0c1a; border: 1px dashed #d4a017; border-radius: 6px; padding: 15px 40px;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: bold; color: #d4a017; letter-spacing: 6px; display: block; line-height: 1; user-select: all;">${otp}</span>
                    </td>
                  </tr>
                </table>
                <div style="margin-top: 12px; color: #a89fc0; font-size: 13px;">
                  Double-click the code above to copy
                </div>
              </td>
            </tr>
            <!-- Footnote -->
            <tr>
              <td align="center" style="color: #635e7a; font-size: 12px; line-height: 1.5; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px;">
                This code is valid for 15 minutes. If you did not make this request, you can safely ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

module.exports = {
  buildOtpEmailHtml,
};
