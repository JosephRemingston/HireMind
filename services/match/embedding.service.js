import { cosineSimilarity } from "../../utils/cosineSimilarity.js";

export function calculateEmbeddingScore(jobEmbedding, resumeEmbedding) {
    if (!jobEmbedding || !resumeEmbedding) {
        return { score: 0 };
    }

    const similarity = cosineSimilarity(
        jobEmbedding,
        resumeEmbedding
    );

    // Clamp score in range [0, 1]
    const clampedSimilarity = Math.max(0, Math.min(1.0, similarity));

    return {
        score: clampedSimilarity
    };
}