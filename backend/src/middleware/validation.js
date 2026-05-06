import { body, param, validationResult } from "express-validator";

/**
 * Middleware to handle validation errors from express-validator
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation error",
      detail: errors
        .array()
        .map((err) => `${err.path}: ${err.msg}`)
        .join(", "),
    });
  }
  next();
}

/**
 * Sanitize and validate site_id to prevent path traversal
 */
export function validateSiteId(fieldName = "site_id") {
  return [
    body(fieldName)
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("must be 1-255 characters")
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage(
        "must contain only letters, numbers, hyphens, and underscores",
      ),

    param(fieldName)
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("must be 1-255 characters")
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage(
        "must contain only letters, numbers, hyphens, and underscores",
      ),
  ];
}

/**
 * Validation rules for product indexing
 */
export const validateIndexRequest = [
  body("site_id")
    .trim()
    .notEmpty()
    .withMessage("is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("must be 1-255 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "must contain only letters, numbers, hyphens, and underscores",
    ),

  body("products")
    .isArray({ min: 1, max: 100 })
    .withMessage("must be an array with 1-100 items"),

  body("products.*.id")
    .trim()
    .notEmpty()
    .withMessage("is required")
    .isLength({ max: 255 })
    .withMessage("must be max 255 characters"),

  body("products.*.title")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("must be max 500 characters"),

  body("products.*.description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("must be max 5000 characters"),

  body("products.*.url")
    .optional()
    .trim()
    .isLength({ max: 2048 })
    .withMessage("must be max 2048 characters"),

  body("products.*.price")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("must be max 50 characters"),

  body("products.*.image_url")
    .optional()
    .trim()
    .isLength({ max: 2048 })
    .withMessage("must be max 2048 characters"),

  handleValidationErrors,
];

/**
 * Validation rules for search requests
 */
export const validateSearchRequest = [
  body("site_id")
    .trim()
    .notEmpty()
    .withMessage("is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("must be 1-255 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "must contain only letters, numbers, hyphens, and underscores",
    ),

  body("query")
    .trim()
    .notEmpty()
    .withMessage("is required")
    .isLength({ min: 1, max: 500 })
    .withMessage("must be 1-500 characters"),

  body("top_k")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("must be an integer between 1 and 50"),

  handleValidationErrors,
];

/**
 * Validation rules for delete requests
 */
export const validateDeleteRequest = [
  param("site_id")
    .trim()
    .notEmpty()
    .withMessage("is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("must be 1-255 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "must contain only letters, numbers, hyphens, and underscores",
    ),

  param("product_id")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("cannot be empty if provided")
    .isLength({ min: 1, max: 255 })
    .withMessage("must be 1-255 characters"),

  handleValidationErrors,
];
