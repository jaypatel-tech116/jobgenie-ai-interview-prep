const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "✦ JobGenie API",
      version: "1.0.0",
      description: "AI-Powered Interview Prep & Resume Builder API documentation",
    },
    servers: [
      {
        url: "/api",
        description: "Base API prefix",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
    },
    paths: {
      "/auth/register": {
        post: {
          summary: "Register a new user",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["username", "email", "password"],
                  properties: {
                    username: { type: "string", minLength: 2, maxLength: 50 },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User registered successfully" },
            400: { description: "Invalid input or user already exists" },
          },
        },
      },
      "/auth/login": {
        post: {
          summary: "Login with email and password",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "User logged in successfully" },
            400: { description: "Invalid credentials" },
          },
        },
      },
      "/auth/google": {
        post: {
          summary: "Login or register using Google token",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token"],
                  properties: {
                    token: { type: "string", description: "Firebase ID Token" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Google auth successful" },
            401: { description: "Invalid Google token" },
          },
        },
      },
      "/auth/logout": {
        get: {
          summary: "Logout user and clear cookie",
          tags: ["Auth"],
          responses: {
            200: { description: "User logged out successfully" },
          },
        },
      },
      "/auth/get-me": {
        get: {
          summary: "Get current user profile",
          tags: ["Auth"],
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: "User profile fetched successfully" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/interview": {
        post: {
          summary: "Generate new AI interview report",
          tags: ["Interview"],
          security: [{ cookieAuth: [] }],
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    jobDescription: { type: "string" },
                    selfDescription: { type: "string" },
                    resume: { type: "string", format: "binary", description: "Resume file (PDF/DOCX)" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Report generated successfully" },
            400: { description: "Missing inputs" },
          },
        },
        get: {
          summary: "Get all interview reports for logged in user",
          tags: ["Interview"],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          ],
          responses: {
            200: { description: "Reports fetched successfully" },
          },
        },
      },
      "/interview/report/{interviewId}": {
        get: {
          summary: "Get interview report by ID",
          tags: ["Interview"],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: "interviewId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Report fetched successfully" },
            400: { description: "Report not found" },
          },
        },
      },
      "/interview/resume/pdf/{interviewReportId}": {
        post: {
          summary: "Generate and download resume PDF",
          tags: ["Interview"],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: "interviewReportId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "PDF generated and returned as binary" },
            404: { description: "Report not found" },
          },
        },
      },
      "/health": {
        get: {
          summary: "Health check endpoint",
          tags: ["Utility"],
          responses: {
            200: { description: "Health status" },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
