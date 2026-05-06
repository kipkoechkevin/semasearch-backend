#!/usr/bin/env node

/**
 * API Key Generator for SemaSearch
 *
 * Generates a cryptographically secure random API key
 * Usage: node generate-api-key.js [length]
 */

import crypto from "crypto";

const DEFAULT_LENGTH = 32; // 32 bytes = 64 hex characters

// Get length from command line argument or use default
const length = parseInt(process.argv[2]) || DEFAULT_LENGTH;

if (length < 16) {
  console.error("❌ Error: Minimum key length is 16 bytes");
  process.exit(1);
}

if (length > 128) {
  console.error("❌ Error: Maximum key length is 128 bytes");
  process.exit(1);
}

// Generate random bytes and convert to hex
const apiKey = crypto.randomBytes(length).toString("hex");

console.log("");
console.log("🔑 SemaSearch API Key Generated");
console.log("================================");
console.log("");
console.log("API Key:", apiKey);
console.log("");
console.log("Length:", length, "bytes (", apiKey.length, "characters )");
console.log("");
console.log("📋 Add this to your .env file:");
console.log("");
console.log(`API_KEY=${apiKey}`);
console.log("");
console.log("⚠️  Keep this key secure and never commit it to version control!");
console.log("");
