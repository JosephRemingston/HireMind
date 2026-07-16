import { generateEmbeddingFromText } from "../embedding.service.js";
import { cosineSimilarity } from "../../utils/cosineSimilarity.js";

// Semantic similarity threshold for fuzzy skill matching.
// 0.82 catches e.g. "Postgres" <-> "PostgreSQL", "k8s" <-> "Kubernetes",
// "express.js" <-> "express", "AWS" <-> "Amazon Web Services"
const FUZZY_THRESHOLD = 0.82;

/**
 * Two-pass skill matching:
 *  Pass 1 — exact lowercased string comparison (zero cost)
 *  Pass 2 — semantic embedding similarity for any skills that didn't match in pass 1
 *
 * The scoring formula is the same as before: matched / total required.
 */
export async function calculateSkillScore(jdSkills, resumeSkills, rawJdText) {
    if (!Array.isArray(jdSkills))     jdSkills     = [];
    if (!Array.isArray(resumeSkills)) resumeSkills = [];

    const getSkillName = (s) => {
        if (!s) return "";
        if (typeof s === "string") return s.trim().toLowerCase();
        return (s.name || "").trim().toLowerCase();
    };

    const getDisplayName = (s) => {
        if (!s) return "";
        if (typeof s === "string") return s.trim();
        return (s.name || "").trim();
    };

    const jdSkillNames     = jdSkills.map(getSkillName).filter(Boolean);
    const resumeSkillNames = resumeSkills.map(getSkillName).filter(Boolean);
    const uniqueRequired   = [...new Set(jdSkillNames)];
    const resumeSet        = new Set(resumeSkillNames);

    // ─── Pass 1: exact match ────────────────────────────────────────────────────
    const exactMatched  = new Set();
    const needsFuzzy    = [];

    for (const skill of uniqueRequired) {
        if (resumeSet.has(skill)) {
            exactMatched.add(skill);
        } else {
            needsFuzzy.push(skill);
        }
    }

    // ─── Pass 2: semantic fuzzy match for unmatched required skills ─────────────
    const fuzzyMatched = new Set();

    if (needsFuzzy.length > 0 && resumeSkillNames.length > 0) {
        // Embed all resume skills that weren't exact-matched once; cache locally
        const resumeEmbeddings = await Promise.all(
            resumeSkillNames.map(s => generateEmbeddingFromText(s, s))
        );

        for (const jdSkill of needsFuzzy) {
            const jdEmbedding = await generateEmbeddingFromText(jdSkill, jdSkill);
            for (let i = 0; i < resumeEmbeddings.length; i++) {
                const sim = cosineSimilarity(jdEmbedding, resumeEmbeddings[i]);
                if (sim >= FUZZY_THRESHOLD) {
                    fuzzyMatched.add(jdSkill);
                    break; // one match is enough
                }
            }
        }
    }

    // ─── Classify matched / missing ─────────────────────────────────────────────
    const matched = [];
    const missing = [];

    for (const skill of uniqueRequired) {
        const display = getDisplayName(jdSkills.find(s => getSkillName(s) === skill));
        if (exactMatched.has(skill) || fuzzyMatched.has(skill)) {
            matched.push(display);
        } else {
            missing.push(display);
        }
    }

    const extra = [];
    const jdSet = new Set(jdSkillNames);
    const uniqueResume = [...new Set(resumeSkillNames)];
    for (const skill of uniqueResume) {
        if (!jdSet.has(skill)) {
            extra.push(getDisplayName(resumeSkills.find(s => getSkillName(s) === skill)));
        }
    }

    const score = uniqueRequired.length > 0 ? matched.length / uniqueRequired.length : 1.0;

    // ─── Classify mandatory vs preferred using JD text context ─────────────────
    const mandatorySkills   = [];
    const preferredSkills   = [];
    const missingMandatory  = [];
    const missingPreferred  = [];

    if (rawJdText && typeof rawJdText === "string") {
        const textLines = rawJdText.toLowerCase().split("\n");

        for (const skill of uniqueRequired) {
            const origSkill = jdSkills.find(s => getSkillName(s) === skill);
            const name = getDisplayName(origSkill);

            const containingLine = textLines.find(line => line.includes(skill)) || "";
            const isPreferred = containingLine.includes("preferred") ||
                                containingLine.includes("plus")       ||
                                containingLine.includes("optional")   ||
                                containingLine.includes("nice to have") ||
                                containingLine.includes("desired")    ||
                                containingLine.includes("preferences");

            if (isPreferred) {
                preferredSkills.push(name);
                if (!exactMatched.has(skill) && !fuzzyMatched.has(skill)) missingPreferred.push(name);
            } else {
                mandatorySkills.push(name);
                if (!exactMatched.has(skill) && !fuzzyMatched.has(skill)) missingMandatory.push(name);
            }
        }
    } else {
        for (const skill of uniqueRequired) {
            const origSkill = jdSkills.find(s => getSkillName(s) === skill);
            const name = getDisplayName(origSkill);
            mandatorySkills.push(name);
            if (!exactMatched.has(skill) && !fuzzyMatched.has(skill)) missingMandatory.push(name);
        }
    }

    return {
        score,
        percentageMatch: score * 100,
        matchedSkills:   matched,
        missingSkills:   missing,
        extraSkills:     extra,
        mandatorySkills,
        preferredSkills,
        missingMandatory,
        missingPreferred,
        fuzzyMatchCount: fuzzyMatched.size,
    };
}
