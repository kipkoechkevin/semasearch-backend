import { config } from "../config.js";
import { AppError } from "../utils/errors.js";

/**
 * Middleware to validate API key from request headers
 * Expects: Authorization: Bearer <API_KEY>
 */
export function authenticateRequest(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Authentication required",
      detail: "Missing Authorization header",
    });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Authentication required",
      detail: "Invalid Authorization header format. Expected: Bearer <token>",
    });
  }

  if (token !== config.API_KEY) {
    return res.status(401).json({
      error: "Authentication failed",
      detail: "Invalid API key",
    });
  }

  next();
}
