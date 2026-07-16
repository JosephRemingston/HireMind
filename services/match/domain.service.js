import { generateEmbeddingFromText } from "../embedding.service.js";
import { cosineSimilarity } from "../../utils/cosineSimilarity.js";

// Generic words that appear across all job types and don't indicate domain specificity.
// These are stripped from both JD and Resume profiles before comparison.
const GENERIC_WORDS = new Set([
    // Job levels & titles
    "senior", "junior", "mid", "lead", "principal", "staff", "intern",
    "manager", "director", "head", "chief", "vp", "associate", "assistant",
    // Role structures
    "engineer", "developer", "architect", "analyst", "specialist", "consultant",
    "coordinator", "administrator", "technician", "instructor", "teacher",
    "designer", "officer", "executive",
    // Generic job terms
    "experience", "years", "team", "work", "working", "role", "position",
    "company", "organization", "department", "responsible", "responsibilities",
    "required", "requirements", "qualifications", "preferred", "skills",
    "ability", "strong", "excellent", "good", "proficient", "knowledge",
    "understanding", "familiar", "hands-on", "proven", "demonstrated",
    // Common verbs
    "build", "create", "develop", "design", "implement", "manage", "maintain",
    "support", "collaborate", "communicate", "ensure", "drive", "deliver",
    // Filler
    "the", "and", "for", "with", "from", "that", "this", "are", "will",
    "have", "has", "been", "being", "our", "you", "your", "we", "us",
    "can", "may", "must", "should", "would", "could", "also", "including",
    "such", "etc", "e.g", "i.e", "or", "an", "a", "in", "on", "at",
    "to", "of", "is", "it", "by", "as", "be", "do", "if", "so", "no",
    "not", "but", "all", "any", "each", "every", "other", "both", "more",
    "most", "very", "just", "about", "into", "over", "after", "before",
    "between", "through", "during", "across", "within", "along", "around",
    "minimum", "min", "max", "least", "plus", "new", "current", "based",
    "related", "relevant", "equivalent", "similar", "well", "highly",
    "looking", "seeking", "join", "opportunity", "benefits", "salary",
    "compensation", "insurance", "flexible", "competitive", "top"
]);

/**
 * Extracts unique domain-specific concept words from a text by filtering out
 * generic job/structural terms. Works for ANY job type without hardcoding.
 */
export function extractDomainConcepts(text) {
    if (!text || typeof text !== "string") return [];

    const words = text
        .toLowerCase()
        .replace(/[^a-z0-9#+.\-\/\s]/g, " ")
        .split(/\s+/)
        .map(w => w.replace(/^[.\-]+|[.\-]+$/g, "")) // trim leading/trailing dots/dashes
        .filter(w => w.length > 1);

    const concepts = [];
    const seen = new Set();

    for (const word of words) {
        if (GENERIC_WORDS.has(word)) continue;
        if (/^\d+$/.test(word)) continue; // skip pure numbers
        if (seen.has(word)) continue;
        seen.add(word);
        concepts.push(word);
    }

    return concepts;
}

/**
 * Builds a domain profile text string from JD or Resume structured data.
 * Combines title, keywords, skill names, and raw text concepts.
 */
export function getDomainProfileText({ title, keywords, skills, rawText }) {
    const parts = [];

    if (title) parts.push(title);
    if (Array.isArray(keywords)) parts.push(keywords.join(" "));
    if (Array.isArray(skills)) {
        const skillNames = skills.map(s => (typeof s === "string" ? s : s?.name || "")).filter(Boolean);
        parts.push(skillNames.join(" "));
    }
    if (rawText) parts.push(rawText);

    const combined = parts.join(" ");
    const concepts = extractDomainConcepts(combined);

    return concepts.join(" ");
}

/**
 * Calculates domain similarity between a JD and a Resume dynamically.
 * No hardcoded domain categories — works for any industry or role.
 *
 * Returns:
 *   score: 0..1 cosine similarity between domain concept embeddings
 *   primaryMismatch: true if score < 0.22 (severe domain gap)
 *   jdProfile: extracted JD domain concepts (for debugging/explanations)
 *   resumeProfile: extracted Resume domain concepts
 */
export async function calculateDomainScore(jd, resume) {
    const jdProfileText = getDomainProfileText({
        title: jd.title,
        keywords: jd.keywords,
        skills: jd.requiredSkills || jd.skills,
        rawText: jd.rawText
    });

    const resumeProfileText = getDomainProfileText({
        title: resume.parsedData?.experience?.[0]?.title,
        keywords: [],
        skills: resume.parsedData?.skills,
        rawText: (resume.parsedData?.experience || []).map(e => `${e.title || ""} ${e.description || ""}`).join(" ")
    });

    if (!jdProfileText || !resumeProfileText) {
        return {
            score: 0,
            primaryMismatch: true,
            jdProfile: jdProfileText || "",
            resumeProfile: resumeProfileText || ""
        };
    }

    const [jdEmbed, resumeEmbed] = await Promise.all([
        generateEmbeddingFromText(jdProfileText),
        generateEmbeddingFromText(resumeProfileText)
    ]);

    const similarity = cosineSimilarity(jdEmbed, resumeEmbed);
    const score = Math.max(0, Math.min(1, similarity));

    return {
        score,
        primaryMismatch: score < 0.22,
        jdProfile: jdProfileText,
        resumeProfile: resumeProfileText
    };
}
