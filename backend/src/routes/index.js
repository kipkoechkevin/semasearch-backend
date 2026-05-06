import { Router } from "express";
import { embed } from "../services/embedder.js";
import { upsertProducts, getCollectionSize } from "../services/store.js";
import { config } from "../config.js";
import { validateIndexRequest } from "../middleware/validation.js";
import { ServiceUnavailableError, ValidationError } from "../utils/errors.js";

const router = Router();

router.post("/index", validateIndexRequest, async (req, res, next) => {
  try {
    const { site_id, products } = req.body;

    // Enforce batch size limit
    if (products.length > config.MAX_PRODUCTS_PER_BATCH) {
      throw new ValidationError(
        `Batch size ${products.length} exceeds maximum of ${config.MAX_PRODUCTS_PER_BATCH}. Split into smaller batches.`,
      );
    }

    // Enforce free tier product limit
    const currentSize = await getCollectionSize(site_id);
    if (currentSize >= config.MAX_FREE_PRODUCTS) {
      throw new ValidationError(
        `Collection already has ${currentSize} products. Free tier limit is ${config.MAX_FREE_PRODUCTS}.`,
      );
    }

    // Build text for embedding: title + description
    const texts = products.map((p) =>
      `${p.title ?? ""} ${p.description ?? ""}`.trim(),
    );

    // Embed in batches of 50 (handled inside embedder)
    let embeddings;
    try {
      embeddings = await embed(texts);
    } catch (err) {
      throw new ServiceUnavailableError(
        "Failed to generate embeddings: " + err.message,
      );
    }

    // Attach embeddings to products
    const records = products.map((p, i) => ({
      id: String(p.id),
      title: p.title ?? "",
      url: p.url ?? "",
      price: p.price ?? "",
      image_url: p.image_url ?? "",
      embedding: embeddings[i],
    }));

    await upsertProducts(site_id, records);

    const newSize = await getCollectionSize(site_id);

    req.log.info(
      { site_id, indexed: products.length, collection_size: newSize },
      "Products indexed",
    );

    return res.json({
      success: true,
      indexed: products.length,
      collection_size: newSize,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
