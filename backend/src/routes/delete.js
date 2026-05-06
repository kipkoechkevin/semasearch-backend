import { Router } from "express";
import {
  deleteCollection,
  deleteProduct,
  collectionExists,
} from "../services/store.js";
import { validateDeleteRequest } from "../middleware/validation.js";
import { NotFoundError } from "../utils/errors.js";

const router = Router();

// Delete entire collection
router.delete(
  "/collections/:site_id",
  validateDeleteRequest,
  async (req, res, next) => {
    try {
      const { site_id } = req.params;

      await deleteCollection(site_id);

      req.log.info({ site_id }, "Collection deleted");

      return res.json({ success: true, deleted: true });
    } catch (err) {
      next(err);
    }
  },
);

// Delete single product from collection
router.delete(
  "/index/:site_id/:product_id",
  validateDeleteRequest,
  async (req, res, next) => {
    try {
      const { site_id, product_id } = req.params;

      // Check if collection exists
      const exists = await collectionExists(site_id);
      if (!exists) {
        throw new NotFoundError(`Collection '${site_id}' not found`);
      }

      await deleteProduct(site_id, product_id);

      req.log.info({ site_id, product_id }, "Product deleted");

      return res.json({
        success: true,
        deleted: true,
        product_id,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
