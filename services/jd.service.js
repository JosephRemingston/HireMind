import { extractSkills } from "./parse.service.js";
import { generateEmbeddingFromText } from "./embedding.service.js";

function normalizeText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function splitLines(text) {
    return normalizeText(text)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
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

function parseSeniority(title, rawText) {
    const searchableText = `${title} ${rawText}`.toLowerCase();

    const patterns = [
        { value: "intern", regex: /\bintern(ship)?\b/ },
        { value: "entry", regex: /\bentry\s+level\b/ },
        { value: "junior", regex: /\bjunior\b|\bjr\.?\b/ },
        { value: "mid", regex: /\bmid[-\s]?level\b|\bintermediate\b/ },
        { value: "senior", regex: /\bsenior\b|\bsr\.?\b/ },
        { value: "staff", regex: /\bstaff\b/ },
        { value: "lead", regex: /\blead\b|\bprincipal\b|\barchitect\b/ },
        { value: "manager", regex: /\bmanager\b|\bhead of\b/ },
        { value: "director", regex: /\bdirector\b|\bv?p\b/ },
    ];

    for (const pattern of patterns) {
        if (pattern.regex.test(searchableText)) {
            return pattern.value;
        }
    }

    return null;
}

function parseMinimumExperience(title, rawText) {
    const searchableText = `${title}\n${rawText}`;
    const experiencePatterns = [
        /(?:minimum|min\.?|at least|requires?)\s+(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i,
        /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i,
    ];

    for (const pattern of experiencePatterns) {
        const match = searchableText.match(pattern);
        if (match) {
            return {
                years: Number.parseFloat(match[1]),
                raw: match[0],
            };
        }
    }

    return null;
}

function parseLocation(rawText) {
    const lines = splitLines(rawText);

    for (const line of lines) {
        const locationMatch = line.match(/^(?:location|based in|remote|hybrid)\s*:?\s*(.+)$/i);
        if (locationMatch) {
            return normalizeText(locationMatch[1]) || line;
        }

        if (/\bremote\b/i.test(line)) {
            return line;
        }
    }

    return null;
}

function parseSection(rawText, headingPatterns) {
    const lines = splitLines(rawText);
    const sections = [];
    let collecting = false;

    for (const line of lines) {
        const isHeading = headingPatterns.some((pattern) => pattern.test(line));

        if (isHeading) {
            collecting = true;
            continue;
        }

        if (collecting) {
            if (/^(?:requirements?|qualifications?|skills?|experience|about|who you are|what you bring|benefits|apply now)$/i.test(line)) {
                break;
            }

            sections.push(line.replace(/^[•*-]\s*/, "").trim());
        }
    }

    return sections.filter(Boolean);
}

function extractRequiredSkills(title, rawText) {
    const structuredSkills = extractSkills([title, rawText].filter(Boolean).join("\n"));
    return structuredSkills;
}

const VALID_WEIGHT_KEYS = new Set([
    "embedding", "skills", "experience", "responsibility",
    "education", "certification", "location",
]);

/**
 * Validates and normalises an optional caller-provided weights object.
 * Unknown keys are stripped. Numeric values are clamped to [0, 1].
 * Returns null if the input is not a non-null object (i.e. use system defaults).
 */
function validateWeights(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return null;

    const out = {};
    for (const [key, val] of Object.entries(input)) {
        if (!VALID_WEIGHT_KEYS.has(key)) continue;
        const num = Number(val);
        if (!Number.isFinite(num)) continue;
        out[key] = Math.max(0, Math.min(1, num));
    }

    return Object.keys(out).length > 0 ? out : null;
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
    const weights = validateWeights(input?.weights);

    const requiredSkills = extractRequiredSkills(title, rawText);
    const minimumExperience = parseMinimumExperience(title, rawText);
    const seniority = parseSeniority(title, rawText);
    const location = parseLocation(rawText);
    const responsibilities = parseSection(rawText, [
        /^(?:responsibilities|what(?:\'|’)s?\s+you(?:\'|’)ll\s+do|what you will do|what you\s+will\s+do|day to day|day-to-day)$/i,
    ]);

    const extractedSkills = requiredSkills;
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
        requiredSkills,
        minimumExperience,
        seniority,
        location,
        responsibilities,
        skills: mergedSkills,
        embedding,
        weights,           // null if not provided (caller uses system defaults)
    };
}

export { parseJobDescription };