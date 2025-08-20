import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import multer from "multer";
import fs from "fs";
import { logger } from "@genkit-ai/core/logging";
import { chatFlow } from "./index";
import { FileSessionStore } from "./sessionStore";
import crypto from "crypto";

// Extend Express Request with file property
declare module "express" {
  interface Request {
    file?: Express.Multer.File;
    files?:
      | { [fieldname: string]: Express.Multer.File[] }
      | Express.Multer.File[];
  }
}

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
// Remove X-Powered-By header for security
app.disable("x-powered-by");
const port = process.env.PORT ? parseInt(process.env.PORT) : 3100;
const host = process.env.HOST || "localhost";

// Initialize session store for chat message history
const sessionStore = new FileSessionStore("./data/sessions");

// Configure multer for file uploads
const uploadDir = path.join(__dirname, "../data/uploads");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, uploadDir);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    // Use crypto for secure random values instead of Math.random
    const uniqueSuffix =
      Date.now() + "-" + crypto.randomBytes(6).toString("hex");
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// Set reasonable limits for security
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  storage,
});

// Middleware
// Configure CORS with specific options for security
app.use(
  cors({
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST"],
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
  })
);
// Set content-length limit for JSON payloads
app.use(express.json({ limit: "1mb" }));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Chat endpoint
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message, session_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Generate or use the provided session ID
    const sessionId = session_id || `session_${Date.now()}`;

    const response = await chatFlow({ message, session_id: sessionId });
    res.json({ response, sessionId });
  } catch (error) {
    logger.error("Error in chat endpoint:", error);
    res.status(500).json({
      details: error instanceof Error ? error.message : String(error),
      error: "An error occurred processing your request",
    });
  }
});

// File upload endpoint
app.post(
  "/api/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const sessionId = req.body.sessionId || `session_${Date.now()}`;

      // Get or create the session
      let session = await sessionStore.get(sessionId);
      if (!session) {
        session = await sessionStore.create(sessionId);
      }

      // Create file metadata
      const fileData = {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
      };

      // Add a system message about the file upload
      session.messages.push({
        content: `Uploaded file: ${req.file.originalname}`,
        role: "user",
      });

      // Save the updated session
      await sessionStore.save(sessionId, session);

      res.json({
        file: fileData,
        sessionId,
        success: true,
      });
    } catch (error) {
      logger.error("Error in upload endpoint:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        success: false,
      });
    }
  }
);

// Serve static files from the data directory
app.use("/data", express.static(path.join(__dirname, "../data")));

// Start the server
app.listen(port, host, () => {
  logger.info(`BRC Analytics GenKit server running at http://${host}:${port}`);
  logger.info(`Health check: http://${host}:${port}/health`);
  logger.info(`Chat API: http://${host}:${port}/api/chat (POST)`);
  logger.info(`Upload API: http://${host}:${port}/api/upload (POST)`);
});

// Export the app for testing
export default app;
