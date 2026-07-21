const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");
const mongoose = require("mongoose");
const logger = require("./config/logger");

const app = express();

// ================= SECURITY =================
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

app.use(compression());

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// ================= RATE LIMIT =================
// 🌐 General limiter (LIGHT - optional)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

// ================= HEALTH =================
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1,
    uptime: process.uptime(),
  });
});

// ================= ROUTES =================
const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");
const mockInterviewRouter = require("./routes/mockInterview.routes");
const atsCheckRouter = require("./routes/atsCheck.routes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

// Apply only general limiter globally
app.use(generalLimiter);

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes (NO AI limiter here)
app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/mock-interview", mockInterviewRouter);
app.use("/api/ats-check", atsCheckRouter);

// ================= 404 CATCH-ALL =================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ================= ERROR HANDLER =================
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error("Unhandled error: %s", err.message);

  // Multer file-filter errors
  if (err.message === "Only PDF and DOCX files are allowed.") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Internal server error" : err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// ================= EXPORT =================
module.exports = app;
