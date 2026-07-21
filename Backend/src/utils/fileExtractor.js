const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extract text from an uploaded file based on mimetype.
 * Supports PDF and DOCX — returns null for anything else.
 */
async function extractResumeText(file) {
  if (file.mimetype === "application/pdf") {
    const data = await new pdfParse.PDFParse(
      Uint8Array.from(file.buffer),
    ).getText();

    return data.text
      .replace(/-- \d+ of \d+ --/g, "")
      .replace(/[^\x00-\x7F]/g, "")
      .trim();
  }

  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value.trim();
  }

  return null; // unsupported — caller returns 400
}

module.exports = {
  extractResumeText,
};
