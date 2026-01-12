/**
 * Embedding Service - Transformers.js Wrapper
 * Uses all-MiniLM-L6-v2 for semantic text embeddings
 * 
 * This service runs LOCALLY - no data sent to external APIs
 * Model downloads once (~90MB) then cached
 */

// Dynamic import to avoid bundling issues
let pipeline: any = null;
let embedder: any = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

// Model config
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIM = 384; // This model outputs 384-dim vectors

/**
 * Initialize the embedding pipeline (lazy load)
 * Called automatically on first use
 */
async function initPipeline(): Promise<void> {
    if (embedder) return;
    if (initPromise) return initPromise;

    isInitializing = true;
    initPromise = (async () => {
        try {
            // Dynamic import for Next.js compatibility
            const transformers = await import('@xenova/transformers');
            pipeline = transformers.pipeline;

            console.log('[Embeddings] Loading model... (first time may take 10-30 seconds)');
            embedder = await pipeline('feature-extraction', MODEL_NAME, {
                quantized: true, // Use quantized model for faster inference
            });
            console.log('[Embeddings] Model loaded successfully');
        } catch (error) {
            console.error('[Embeddings] Failed to load model:', error);
            embedder = null;
            throw error;
        } finally {
            isInitializing = false;
        }
    })();

    return initPromise;
}

/**
 * Generate embedding vector for a text string
 * Returns null if model fails to load
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
    if (!text || text.trim().length === 0) {
        return null;
    }

    try {
        await initPipeline();

        if (!embedder) {
            console.warn('[Embeddings] Model not available, returning null');
            return null;
        }

        // Truncate very long text to avoid memory issues
        const truncatedText = text.slice(0, 512);

        const output = await embedder(truncatedText, {
            pooling: 'mean',
            normalize: true,
        });

        // Convert Float32Array to regular array
        return Array.from(output.data);
    } catch (error) {
        console.error('[Embeddings] Error generating embedding:', error);
        return null;
    }
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling generateEmbedding multiple times
 */
export async function generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    if (!texts || texts.length === 0) {
        return [];
    }

    try {
        await initPipeline();

        if (!embedder) {
            return texts.map(() => null);
        }

        const results: (number[] | null)[] = [];

        // Process in small batches to avoid memory issues
        const batchSize = 10;
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);

            for (const text of batch) {
                if (!text || text.trim().length === 0) {
                    results.push(null);
                    continue;
                }

                const truncatedText = text.slice(0, 512);
                const output = await embedder(truncatedText, {
                    pooling: 'mean',
                    normalize: true,
                });
                results.push(Array.from(output.data));
            }
        }

        return results;
    } catch (error) {
        console.error('[Embeddings] Batch error:', error);
        return texts.map(() => null);
    }
}

/**
 * Check if the embedding service is ready
 */
export function isEmbeddingServiceReady(): boolean {
    return embedder !== null;
}

/**
 * Get the embedding dimension (for database schema)
 */
export function getEmbeddingDimension(): number {
    return EMBEDDING_DIM;
}

/**
 * Preload the model (call during app startup if desired)
 */
export async function preloadModel(): Promise<boolean> {
    try {
        await initPipeline();
        return embedder !== null;
    } catch {
        return false;
    }
}
