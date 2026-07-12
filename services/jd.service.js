import { extractSkills } from "./parse.service.js";
import { generateEmbeddingFromText } from "./embedding.service.js";

function normalizeText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeKeywords(keywords) {
    if (!Array.isArray(keywords)) {
        return [];
    }

    const normalized = keywords
        .map((keyword) => normalizeText(keyword))
        .filter(Boolean);

    return [...new Set(normalized)];
}

function buildEmbeddingText({ title, rawText, keywords, skills }) {
    const parts = [];

    if (title) {
        parts.push(`Title: ${title}`);
    }

    if (rawText) {
        parts.push(`Job Description: ${rawText}`);
    }

    if (keywords.length) {
        parts.push(`Keywords: ${keywords.join(", ")}`);
    }

    if (skills.length) {
        parts.push(`Skills: ${skills.map((skill) => skill.name).join(", ")}`);
    }

    return parts.join(". ") || "Empty job description";
}

async function parseJobDescription(input) {
    const title = normalizeText(input?.title);
    const rawText = normalizeText(input?.rawText);
    const keywords = normalizeKeywords(input?.keywords ?? input?.keyWords);

    const extractedSkills = extractSkills([title, rawText].filter(Boolean).join("\n"));
    const mergedSkills = [...extractedSkills];

    const seenSkills = new Set(mergedSkills.map((skill) => skill.name.toLowerCase()));
    for (const skill of input?.skills ?? []) {
        const skillName = normalizeText(skill?.name ?? skill);
        if (!skillName || seenSkills.has(skillName.toLowerCase())) {
            continue;
        }

        const skillCategory = normalizeText(skill?.category) || "Uncategorized";
        mergedSkills.push({ name: skillName, category: skillCategory });
        seenSkills.add(skillName.toLowerCase());
    }

    const embeddingText = buildEmbeddingText({
        title,
        rawText,
        keywords,
        skills: mergedSkills,
    });

    const embedding = await generateEmbeddingFromText(embeddingText, "Empty job description");

    return {
        title: title || null,
        rawText,
        keywords,
        skills: mergedSkills,
        embedding,
    };
}

export { parseJobDescription };