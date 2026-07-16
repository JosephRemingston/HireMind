import { generateEmbeddingFromText } from "../embedding.service.js";
import { cosineSimilarity } from "../../utils/cosineSimilarity.js";

const jdEmbeddingsCache = new Map();

export async function calculateResponsibilityScore(jd, resume) {
    const responsibilities = jd.responsibilities || [];
    const experience = resume?.parsedData?.experience || [];

    if (responsibilities.length === 0) {
        return {
            score: 1.0,
            explanation: "No specific responsibilities listed in job description"
        };
    }

    if (experience.length === 0) {
        return {
            score: 0,
            explanation: "No experience listed to match responsibilities"
        };
    }

    const cacheKey = jd._id ? jd._id.toString() : responsibilities.join("|");
    let jdEmbeds = jdEmbeddingsCache.get(cacheKey);
    if (!jdEmbeds) {
        jdEmbeds = await Promise.all(
            responsibilities.map(r => generateEmbeddingFromText(r))
        );
        jdEmbeddingsCache.set(cacheKey, jdEmbeds);
    }

    const expTexts = experience.map(exp => {
        return [exp.title, exp.company, exp.description].filter(Boolean).join(": ");
    }).filter(Boolean);

    if (expTexts.length === 0) {
        return {
            score: 0,
            explanation: "No text in experience descriptions to match"
        };
    }

    const candidateEmbeds = await Promise.all(
        expTexts.map(text => generateEmbeddingFromText(text))
    );

    let totalMaxSim = 0;
    for (let i = 0; i < jdEmbeds.length; i++) {
        const jdEmbed = jdEmbeds[i];
        let maxSim = 0;
        
        for (let j = 0; j < candidateEmbeds.length; j++) {
            const candEmbed = candidateEmbeds[j];
            const sim = cosineSimilarity(jdEmbed, candEmbed);
            if (sim > maxSim) {
                maxSim = sim;
            }
        }
        totalMaxSim += maxSim;
    }

    const averageSimilarity = totalMaxSim / jdEmbeds.length;
    const normalizedScore = Math.max(0, Math.min(1.0, (averageSimilarity - 0.2) / 0.6));

    return {
        score: normalizedScore,
        rawAverageSimilarity: averageSimilarity,
        explanation: `Responsibility alignment score: ${Math.round(normalizedScore * 100)}%`
    };
}

export function clearResponsibilityCache() {
    jdEmbeddingsCache.clear();
}
