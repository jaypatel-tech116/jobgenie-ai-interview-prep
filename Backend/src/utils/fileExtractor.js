const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extract text from an uploaded file based on mimetype.
 * Supports PDF and DOCX — returns null for anything else.
 */
async function extractResumeText(file) {
  if (file.mimetype === "application/pdf") {
    const origStderr = process.stderr.write;
    const origWarn = console.warn;
    try {
      process.stderr.write = (chunk, ...args) => {
        if (typeof chunk === "string" && chunk.includes("Warning: TT:")) return true;
        if (Buffer.isBuffer(chunk) && chunk.toString().includes("Warning: TT:")) return true;
        return origStderr.call(process.stderr, chunk, ...args);
      };
      console.warn = (...args) => {
        if (args[0] && typeof args[0] === "string" && args[0].includes("Warning: TT:")) return;
        return origWarn.apply(console, args);
      };

      const data = await new pdfParse.PDFParse(
        Uint8Array.from(file.buffer),
      ).getText();

      return data.text
        .replace(/-- \d+ of \d+ --/g, "")
        .replace(/[^\x00-\x7F]/g, "")
        .trim();
    } finally {
      process.stderr.write = origStderr;
      console.warn = origWarn;
    }
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
