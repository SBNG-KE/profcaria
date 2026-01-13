/**
 * Embedding Service - HuggingFace Inference API
 * Uses sentence-transformers/all-MiniLM-L6-v2 via cloud API
 * 
 * RUNS ON HUGGINGFACE SERVERS - fast, reliable, free tier available
 * No model download needed, works perfectly on Vercel
 * 
 * Setup: Add HF_TOKEN to your .env.local
 * Get free token: https://huggingface.co/settings/accesstokens
 */

import { HfInference } from '@huggingface/inference';

// Initialize HuggingFace client
const HF_TOKEN = process.env.HF_TOKEN;
let hf: HfInference | null = null;

// Model config - same model as before, now running in cloud
const MODEL_NAME = 'sentence-transformers/all-MiniLM-L6-v2';
const EMBEDDING_DIM = 384; // This model outputs 384-dim vectors
const MAX_TEXT_LENGTH = 512; // Model's context limit

/**
 * Initialize HuggingFace client (lazy)
 */
function getClient(): HfInference | null {
    if (!HF_TOKEN) {
        console.warn('[Embeddings] HF_TOKEN not configured - embeddings disabled');
        return null;
    }
    if (!hf) {
        hf = new HfInference(HF_TOKEN);
        console.log('[Embeddings] HuggingFace client initialized');
    }
    return hf;
}

/**
 * Generate embedding vector for a text string
 * Returns 384-dimensional vector or null on failure
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
    if (!text || text.trim().length === 0) {
        return null;
    }

    const client = getClient();
    if (!client) {
        return null; // No API key configured
    }

    try {
        // Truncate to model's max length
        const truncatedText = text.slice(0, MAX_TEXT_LENGTH);

        const result = await client.featureExtraction({
            model: MODEL_NAME,
            inputs: truncatedText,
        });

        // HuggingFace returns nested array for sentence-transformers
        // We need to handle both formats
        if (Array.isArray(result)) {
            // If it's a 2D array (batched response), take first
            if (Array.isArray(result[0])) {
                return result[0] as number[];
            }
            // If it's already 1D array
            return result as number[];
        }

        console.warn('[Embeddings] Unexpected response format');
        return null;

    } catch (error: any) {
        // Handle rate limiting gracefully
        if (error?.status === 429) {
            console.warn('[Embeddings] Rate limited - try again later');
        } else {
            console.error('[Embeddings] Error generating embedding:', error?.message || error);
        }
        return null;
    }
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than individual calls
 */
export async function generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    if (!texts || texts.length === 0) {
        return [];
    }

    const client = getClient();
    if (!client) {
        return texts.map(() => null);
    }

    const results: (number[] | null)[] = [];

    // Process in small batches to respect rate limits
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        // Add small delay between batches to avoid rate limiting
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        for (const text of batch) {
            if (!text || text.trim().length === 0) {
                results.push(null);
                continue;
            }

            try {
                const embedding = await generateEmbedding(text);
                results.push(embedding);
            } catch (error) {
                console.error('[Embeddings] Batch item error:', error);
                results.push(null);
            }
        }
    }

    return results;
}

/**
 * Check if the embedding service is configured and ready
 */
export function isEmbeddingServiceReady(): boolean {
    return Boolean(HF_TOKEN);
}

/**
 * Get the embedding dimension (for database schema)
 */
export function getEmbeddingDimension(): number {
    return EMBEDDING_DIM;
}

/**
 * Validate that the API key works (call on startup if desired)
 */
export async function validateApiKey(): Promise<boolean> {
    if (!HF_TOKEN) {
        console.log('[Embeddings] No HF_TOKEN - feature disabled');
        return false;
    }

    try {
        const testEmbedding = await generateEmbedding('test connection');
        const isValid = testEmbedding !== null && testEmbedding.length === EMBEDDING_DIM;
        console.log('[Embeddings] API validation:', isValid ? 'SUCCESS' : 'FAILED');
        return isValid;
    } catch (error) {
        console.error('[Embeddings] API validation failed:', error);
        return false;
    }
}

/**
 * Preload/warmup (for compatibility with old interface)
 * No-op since HuggingFace API doesn't need preloading
 */
export async function preloadModel(): Promise<boolean> {
    return isEmbeddingServiceReady();
}
