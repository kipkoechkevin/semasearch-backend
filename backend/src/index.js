import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { logger, httpLogger } from "./utils/logger.js";
import { errorHandler } from "./utils/errors.js";
import { authenticateRequest } from "./middleware/auth.js";
import { closeAllCollections } from "./services/store.js";
import healthRouter from "./routes/health.js";
import indexRouter from "./routes/index.js";
import searchRouter from "./routes/search.js";
import deleteRouter from "./routes/delete.js";
import collectionsRouter from "./routes/collections.js";

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - supports multiple origins
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }

    // If CORS_ORIGIN is *, allow all
    if (config.CORS_ORIGIN === "*") {
      return callback(null, true);
    }

    // Support comma-separated list of origins
    const allowedOrigins = config.CORS_ORIGIN.split(",").map((o) => o.trim());

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: "Too many requests",
    detail: "Please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Request logging
app.use(httpLogger);

// Body parser with size limits
app.use(
  express.json({
    limit: config.MAX_REQUEST_SIZE,
    strict: true,
  }),
);

// Health check (no auth required)
app.use("/", healthRouter);

// All other routes require authentication
app.use(authenticateRequest);

// Protected routes
app.use("/", indexRouter);
app.use("/", searchRouter);
app.use("/", deleteRouter);
app.use("/", collectionsRouter);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  logger.info(
    {
      port: config.PORT,
      dataDir: config.DATA_DIR,
      env: config.NODE_ENV,
    },
    "SemaSearch backend started",
  );
});

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info({ signal }, "Shutdown signal received");

  server.close(() => {
    logger.info("HTTP server closed");

    // Close all ZVec collections
    closeAllCollections();
    logger.info("All collections closed");

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.fatal({ reason, promise }, "Unhandled rejection");
  shutdown("unhandledRejection");
});
