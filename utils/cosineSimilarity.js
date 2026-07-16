export function cosineSimilarity(vectorA, vectorB) {

    if (!vectorA || !vectorB)
        return 0;

    if (vectorA.length !== vectorB.length)
        return 0;

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < vectorA.length; i++) {

        dot += vectorA[i] * vectorB[i];

        magA += vectorA[i] * vectorA[i];

        magB += vectorB[i] * vectorB[i];
    }

    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);

    if (magA === 0 || magB === 0)
        return 0;

    return dot / (magA * magB);
}