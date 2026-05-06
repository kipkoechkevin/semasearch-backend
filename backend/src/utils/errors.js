/**
 * Custom error classes for better error handling
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporarily unavailable") {
    super(message, 503);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429);
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let message = "Internal server error";
  let detail = null;

  // Log the error
  req.log.error(
    {
      err,
      req: {
        method: req.method,
        url: req.url,
        headers: req.headers,
      },
    },
    "Request error",
  );

  // Only expose operational errors to client
  if (err.isOperational) {
    message = err.message;
  } else {
    // For programming errors, log but don't expose details
    if (process.env.NODE_ENV !== "production") {
      detail = err.message;
    }
  }

  // Special handling for specific error types
  if (err.message?.includes("Jina API error")) {
    statusCode = 503;
    message = "Embedding service temporarily unavailable";
    detail = process.env.NODE_ENV !== "production" ? err.message : null;
  }

  res.status(statusCode).json({
    error: message,
    ...(detail && { detail }),
  });
}
