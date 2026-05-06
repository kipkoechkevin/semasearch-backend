import path from "path";
import fs from "fs/promises";
import { LRUCache } from "lru-cache";
import { config } from "../config.js";

import pkg from "@zvec/zvec";
const { ZVecCollectionSchema, ZVecDataType, ZVecCreateAndOpen, ZVecOpen } = pkg;

// Cache of open collection handles: site_id → collection
const handles = new Map();

// Cache of embeddings with LRU eviction to prevent memory leaks
// site_id → LRUCache<product_id, float[]>
const embeddingCaches = new Map();

/**
 * Get or create an LRU cache for a site's embeddings
 */
function getEmbeddingCache(site_id) {
  if (!embeddingCaches.has(site_id)) {
    embeddingCaches.set(
      site_id,
      new LRUCache({
        max: config.MAX_CACHE_SIZE,
        sizeCalculation: (value) => {
          // Approximate memory: float32 = 4 bytes per dimension
          return value.length * 4;
        },
        maxSize: config.MAX_CACHE_SIZE * 1024 * 4, // ~40MB per site
      }),
    );
  }
  return embeddingCaches.get(site_id);
}

// ── Cosine similarity ────────────────────────────────────────────────────────
// Returns 0.0 (unrelated) → 1.0 (identical). Higher = more relevant.

function cosineSimilarity(a, b) {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Schema ───────────────────────────────────────────────────────────────────

function buildSchema() {
  return new ZVecCollectionSchema({
    name: "semasearch",
    fields: [
      { name: "id", dataType: ZVecDataType.STRING },
      { name: "title", dataType: ZVecDataType.STRING },
      { name: "url", dataType: ZVecDataType.STRING },
      { name: "price", dataType: ZVecDataType.STRING },
      { name: "image_url", dataType: ZVecDataType.STRING },
    ],
    vectors: [
      {
        name: "embedding",
        dataType: ZVecDataType.VECTOR_FP32,
        dimension: 1024,
      },
    ],
  });
}

// ── Collection handle ────────────────────────────────────────────────────────

async function getCollection(site_id) {
  if (handles.has(site_id)) return handles.get(site_id);

  const collectionPath = path.join(config.DATA_DIR, site_id);
  let collection;

  try {
    await fs.access(collectionPath);
    collection = ZVecOpen(collectionPath);
  } catch {
    collection = ZVecCreateAndOpen(collectionPath, buildSchema());
  }

  handles.set(site_id, collection);
  return collection;
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function collectionExists(site_id) {
  const collectionPath = path.join(config.DATA_DIR, site_id);
  try {
    await fs.access(collectionPath);
    return true;
  } catch {
    return false;
  }
}

export async function getCollectionSize(site_id) {
  const collection = await getCollection(site_id);
  return collection.stats.docCount ?? 0;
}

export async function upsertProducts(site_id, records) {
  const collection = await getCollection(site_id);
  const embedCache = getEmbeddingCache(site_id);

  const docs = records.map((r) => {
    // Populate embedding cache so we can re-score searches
    embedCache.set(r.id, r.embedding);

    return {
      id: r.id,
      vectors: { embedding: r.embedding },
      fields: {
        id: r.id,
        title: r.title,
        url: r.url,
        price: r.price,
        image_url: r.image_url,
      },
    };
  });

  collection.upsertSync(docs);
}

export async function searchProducts(site_id, queryVector, topK = 8) {
  const collection = await getCollection(site_id);
  const embedCache = getEmbeddingCache(site_id);

  const raw = collection.querySync({
    vectorQuery: { fieldName: "embedding", vector: queryVector },
    topK,
  });

  if (!raw || !raw.length) return [];

  return raw
    .map((r) => {
      // Re-score using our own cosine similarity if embedding is cached,
      // otherwise fall back to ZVec's score (which may be 0 for small collections)
      const cached = embedCache.get(r.id);
      const score = cached
        ? cosineSimilarity(queryVector, cached)
        : 1 - (r.score ?? 0); // ZVec returns distance, convert to similarity

      return {
        id: r.id,
        title: r.fields?.title ?? "",
        url: r.fields?.url ?? "",
        price: r.fields?.price ?? "",
        image_url: r.fields?.image_url ?? "",
        score, // now 0.0–1.0, higher = more relevant
      };
    })
    .sort((a, b) => b.score - a.score); // highest similarity first
}

export async function deleteCollection(site_id) {
  const collectionPath = path.join(config.DATA_DIR, site_id);

  if (handles.has(site_id)) {
    try {
      handles.get(site_id).closeSync();
    } catch (_) {}
    handles.delete(site_id);
  }

  embeddingCaches.delete(site_id);
  await fs.rm(collectionPath, { recursive: true, force: true });
}

/**
 * Delete a single product from a collection
 */
export async function deleteProduct(site_id, product_id) {
  const collection = await getCollection(site_id);
  const embedCache = getEmbeddingCache(site_id);

  // Delete from ZVec collection
  collection.deleteSync([product_id]);

  // Remove from embedding cache
  embedCache.delete(product_id);

  return true;
}

/**
 * Gracefully close all open collections
 * Call this on shutdown
 */
export function closeAllCollections() {
  for (const [site_id, collection] of handles.entries()) {
    try {
      collection.closeSync();
    } catch (err) {
      console.error(`Failed to close collection ${site_id}:`, err);
    }
  }
  handles.clear();
  embeddingCaches.clear();
}
