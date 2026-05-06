import { Router } from "express";
import { getCollectionSize, collectionExists } from "../services/store.js";
import { config } from "../config.js";
import {
  validateSiteId,
  handleValidationErrors,
} from "../middleware/validation.js";
import { NotFoundError } from "../utils/errors.js";

const router = Router();

/**
 * Get statistics for a collection
 */
router.get(
  "/collections/:site_id/stats",
  validateSiteId("site_id"),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { site_id } = req.params;

      const exists = await collectionExists(site_id);
      if (!exists) {
        throw new NotFoundError(`Collection '${site_id}' not found`);
      }

      const size = await getCollectionSize(site_id);

      return res.json({
        site_id,
        product_count: size,
        limit: config.MAX_FREE_PRODUCTS,
        remaining: Math.max(0, config.MAX_FREE_PRODUCTS - size),
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
