import "dotenv/config";

const JINA_API_KEY = process.env.JINA_API_KEY;
const API_KEY = process.env.API_KEY;

if (!JINA_API_KEY) {
  throw new Error(
    "JINA_API_KEY is not set. Copy .env.example to .env and add your key.",
  );
}

if (!API_KEY) {
  throw new Error(
    "API_KEY is not set. Generate a secure API key and add it to .env",
  );
}

export const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || "development",

  // API Keys
  JINA_API_KEY,
  API_KEY,

  // Server
  PORT: parseInt(process.env.PORT, 10) || 3000,
  DATA_DIR: process.env.DATA_DIR ?? "./data",

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS:
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

  // Request limits
  REQUEST_TIMEOUT_MS: parseInt(process.env.REQUEST_TIMEOUT_MS, 10) || 30000,
  MAX_REQUEST_SIZE: process.env.MAX_REQUEST_SIZE || "10mb",

  // Business logic
  MAX_FREE_PRODUCTS: parseInt(process.env.MAX_FREE_PRODUCTS, 10) || 500,
  MAX_PRODUCTS_PER_BATCH:
    parseInt(process.env.MAX_PRODUCTS_PER_BATCH, 10) || 100,

  // Embedding cache
  MAX_CACHE_SIZE: parseInt(process.env.MAX_CACHE_SIZE, 10) || 10000,

  // Cosine SIMILARITY threshold — keep results >= this value (0.0–1.0)
  // 0.50 = at least 50% semantically similar. Raise to tighten, lower to broaden.
  SCORE_THRESHOLD: parseFloat(process.env.SCORE_THRESHOLD) || 0.5,

  // CORS - supports:
  // - '*' for all origins (dev only)
  // - Single origin: 'https://site.com'
  // - Multiple origins (comma-separated): 'https://site1.com,https://site2.com'
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
};
