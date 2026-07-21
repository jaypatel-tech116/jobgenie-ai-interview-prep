const mongoose = require("mongoose");
const logger = require("./logger");

async function connectToDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    logger.info("✅ Connected to MongoDB");
  } catch (error) {
    logger.error(`❌ Database connection failed: ${error.message}`);

    // Stop app if DB fails
    process.exit(1);
  }
}

module.exports = connectToDB;
