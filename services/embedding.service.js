import { pipeline } from "@xenova/transformers";

let embeddingPipeline = null;

async function getEmbeddingPipeline() {
    if (!embeddingPipeline) {
        embeddingPipeline = await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2"
        );
    }

    return embeddingPipeline;
}

async function generateEmbeddingFromText(text, fallbackText = "Empty text") {
    const model = await getEmbeddingPipeline();
    const output = await model(text || fallbackText, {
        pooling: "mean",
        normalize: true,
    });

    return Array.from(output.data);
}

export { generateEmbeddingFromText };