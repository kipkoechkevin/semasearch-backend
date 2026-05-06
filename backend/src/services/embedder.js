import { config } from '../config.js';

const JINA_ENDPOINT = 'https://api.jina.ai/v1/embeddings';
const BATCH_SIZE = 50;

/**
 * Embed an array of strings using Jina v3.
 * Returns float[][] — one float[] per input string.
 */
export async function embed(texts) {
    if (!texts.length) return [];

    const allEmbeddings = [];

    // Process in batches of 50
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);

        const response = await fetch(JINA_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${config.JINA_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'jina-embeddings-v3',
                input: batch,
            }),
        });

        if (!response.ok) {
            throw new Error(`Jina API error: ${response.status}`);
        }

        const json = await response.json();

        // Jina returns { data: [{ index, embedding: float[] }, ...] }
        // Sort by index to guarantee order matches input
        const sorted = json.data.sort((a, b) => a.index - b.index);
        allEmbeddings.push(...sorted.map(item => item.embedding));
    }

    return allEmbeddings;
}