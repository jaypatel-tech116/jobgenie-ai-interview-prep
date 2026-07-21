require("dotenv").config();
const app = require("./src/app");
const connectToDB = require("./src/config/database");
const logger = require("./src/config/logger");

async function startServer() {
  try {
    await connectToDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server: %s", error.message);
    process.exit(1);
  }
}

startServer();
