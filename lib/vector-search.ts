/**
 * Vector Search and Similarity Functions
 * Used for semantic matching between embeddings
 */

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length || a.length === 0) {
        return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
}

/**
 * Convert cosine similarity (-1 to 1) to a 0-100 score
 * Useful for combining with other scoring systems
 */
export function similarityToScore(similarity: number): number {
    // Map from [-1, 1] to [0, 100]
    // Most text similarities are between 0 and 1, rarely negative
    const score = ((similarity + 1) / 2) * 100;
    return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Find top K most similar items from a list of embeddings
 */
export function findTopKSimilar(
    queryEmbedding: number[],
    candidateEmbeddings: { id: string; embedding: number[] }[],
    k: number = 10
): { id: string; similarity: number; score: number }[] {
    if (!queryEmbedding || candidateEmbeddings.length === 0) {
        return [];
    }

    const scored = candidateEmbeddings
        .map(candidate => {
            const similarity = cosineSimilarity(queryEmbedding, candidate.embedding);
            return {
                id: candidate.id,
                similarity,
                score: similarityToScore(similarity),
            };
        })
        .filter(item => item.similarity > 0) // Only positive similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k);

    return scored;
}

/**
 * Calculate average embedding from multiple vectors
 * Useful for creating a composite user preference embedding
 */
export function averageEmbeddings(embeddings: number[][]): number[] | null {
    const validEmbeddings = embeddings.filter(e => e && e.length > 0);

    if (validEmbeddings.length === 0) {
        return null;
    }

    const dim = validEmbeddings[0].length;
    const result = new Array(dim).fill(0);

    for (const embedding of validEmbeddings) {
        for (let i = 0; i < dim; i++) {
            result[i] += embedding[i];
        }
    }

    // Normalize
    for (let i = 0; i < dim; i++) {
        result[i] /= validEmbeddings.length;
    }

    // L2 normalize the result
    let norm = 0;
    for (let i = 0; i < dim; i++) {
        norm += result[i] * result[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
        for (let i = 0; i < dim; i++) {
            result[i] /= norm;
        }
    }

    return result;
}

/**
 * Combine rule-based score with embedding score
 * Uses weighted average, with fallback if embeddings aren't available
 */
export function combineScores(
    ruleBasedScore: number,
    embeddingScore: number | null,
    embeddingWeight: number = 0.3 // 30% embedding, 70% rules
): number {
    if (embeddingScore === null) {
        // Fallback: use rule-based score only
        return ruleBasedScore;
    }

    const combined = (ruleBasedScore * (1 - embeddingWeight)) + (embeddingScore * embeddingWeight);
    return Math.round(combined);
}

/**
 * Parse stored embedding from database (handles JSON string or array)
 */
export function parseEmbedding(stored: string | number[] | null): number[] | null {
    if (!stored) return null;

    if (Array.isArray(stored)) {
        return stored;
    }

    try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
            return parsed;
        }
    } catch {
        // Not valid JSON
    }

    return null;
}

/**
 * Serialize embedding for database storage
 */
export function serializeEmbedding(embedding: number[] | null): string | null {
    if (!embedding) return null;
    return JSON.stringify(embedding);
}
