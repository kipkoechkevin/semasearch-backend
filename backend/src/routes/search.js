import { Router } from "express";
import { embed } from "../services/embedder.js";
import { searchProducts, collectionExists } from "../services/store.js";
import { config } from "../config.js";
import { validateSearchRequest } from "../middleware/validation.js";
import { ServiceUnavailableError } from "../utils/errors.js";

const router = Router();

router.post("/search", validateSearchRequest, async (req, res, next) => {
  try {
    const { site_id, query, top_k } = req.body;

    const exists = await collectionExists(site_id);
    if (!exists) {
      req.log.info(
        { site_id },
        "Collection not found, returning empty results",
      );
      return res.json({ results: [] });
    }

    const topK = parseInt(top_k, 10) || 8;

    let queryVector;
    try {
      [queryVector] = await embed([query]);
    } catch (err) {
      throw new ServiceUnavailableError(
        "Failed to generate query embedding: " + err.message,
      );
    }

    const raw = await searchProducts(site_id, queryVector, topK);

    // scores are now cosine similarity (higher = better)
    // keep only results that are semantically relevant
    const results = raw.filter((r) => r.score >= config.SCORE_THRESHOLD);

    req.log.info(
      {
        site_id,
        query,
        results_count: results.length,
        top_score: results[0]?.score,
      },
      "Search completed",
    );

    return res.json({ results });
  } catch (err) {
    next(err);
  }
});

export default router;
