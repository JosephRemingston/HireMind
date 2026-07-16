import { extractDomainConcepts } from "./domain.service.js";

export function calculateExperienceScore(jd, resume) {
    const experience = resume?.parsedData?.experience || [];
    if (experience.length === 0) {
        return {
            score: 0,
            totalYears: 0,
            relevantYears: 0,
            seniority: null,
            explanation: "No experience listed on resume"
        };
    }

    // 1. Dynamically extract domain concepts from JD title, keywords, skills, and rawText
    const jdText = [
        jd.title || "",
        (jd.keywords || []).join(" "),
        (jd.requiredSkills || jd.skills || []).map(s => typeof s === "string" ? s : s?.name || "").join(" "),
        jd.rawText || ""
    ].join(" ");

    const domainConcepts = extractDomainConcepts(jdText);

    let totalYears = 0;
    let domainRelevantYears = 0;

    const parseYearsFromDates = (datesStr) => {
        if (!datesStr || typeof datesStr !== "string") return 0;
        const parts = datesStr.split(/[-–—|]| to | until /i).map(p => p.trim());
        if (parts.length === 0) return 0;

        const parseDatePart = (part, isEnd = false) => {
            const normalized = part.toLowerCase();
            if (normalized.includes("present") || normalized.includes("current") || normalized.includes("now") || normalized === "active") {
                return new Date();
            }

            const yearMatch = part.match(/\b(19\d{2}|20\d{2})\b/);
            if (!yearMatch) return null;
            const year = parseInt(yearMatch[1], 10);

            const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
            let month = isEnd ? 11 : 0;
            for (let i = 0; i < months.length; i++) {
                if (normalized.includes(months[i])) {
                    month = i;
                    break;
                }
            }
            return new Date(year, month, 1);
        };

        const startDate = parseDatePart(parts[0], false);
        const endDate = parts[1] ? parseDatePart(parts[1], true) : new Date();

        if (!startDate || !endDate) {
            const yearsMatch = datesStr.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i);
            if (yearsMatch) return parseFloat(yearsMatch[1]);
            return 0;
        }

        const diffYears = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25);
        return diffYears > 0 ? diffYears : 0;
    };

    // Seniority detection
    const seniorityPatterns = [
        { value: "intern", regex: /\bintern(ship)?\b/i },
        { value: "entry", regex: /\bentry\s+level\b/i },
        { value: "junior", regex: /\bjunior\b|\bjr\.?\b/i },
        { value: "mid", regex: /\bmid[-\s]?level\b|\bintermediate\b/i },
        { value: "senior", regex: /\bsenior\b|\bsr\.?\b/i },
        { value: "staff", regex: /\bstaff\b/i },
        { value: "lead", regex: /\blead\b|\bprincipal\b|\barchitect\b/i },
        { value: "manager", regex: /\bmanager\b|\bhead of\b/i },
        { value: "director", regex: /\bdirector\b|\bv?p\b/i },
    ];

    const seniorityLevels = {
        "intern": 1, "entry": 2, "junior": 2, "mid": 3,
        "senior": 4, "staff": 5, "lead": 5, "manager": 6, "director": 7
    };

    let highestSeniorityVal = 0;
    let highestSeniority = "entry";

    for (const exp of experience) {
        const years = parseYearsFromDates(exp.dates);
        totalYears += years;

        // Check if this experience item matches any JD domain concepts
        const textToSearch = `${exp.title || ""} ${exp.description || ""}`.toLowerCase();
        let isDomainRelevant = false;

        for (const concept of domainConcepts) {
            if (textToSearch.includes(concept)) {
                isDomainRelevant = true;
                break;
            }
        }

        if (isDomainRelevant) {
            domainRelevantYears += years;
        }

        // Check seniority in titles
        if (exp.title) {
            for (const pattern of seniorityPatterns) {
                if (pattern.regex.test(exp.title)) {
                    const val = seniorityLevels[pattern.value];
                    if (val > highestSeniorityVal) {
                        highestSeniorityVal = val;
                        highestSeniority = pattern.value;
                    }
                }
            }
        }
    }

    // Default seniority mapping if none matched
    if (highestSeniorityVal === 0) {
        if (totalYears > 8) {
            highestSeniority = "lead";
            highestSeniorityVal = seniorityLevels["lead"];
        } else if (totalYears > 5) {
            highestSeniority = "senior";
            highestSeniorityVal = seniorityLevels["senior"];
        } else if (totalYears > 2) {
            highestSeniority = "mid";
            highestSeniorityVal = seniorityLevels["mid"];
        } else {
            highestSeniority = "junior";
            highestSeniorityVal = seniorityLevels["junior"];
        }
    }

    // Score minimum experience (based on domain-relevant years)
    const jdMinYears = jd.minimumExperience?.years || 0;
    let yearsScore = 1.0;
    if (jdMinYears > 0) {
        yearsScore = domainRelevantYears >= jdMinYears ? 1.0 : domainRelevantYears / jdMinYears;
    }

    // Score relevance
    let relevanceScore = totalYears > 0 ? domainRelevantYears / totalYears : 0;
    relevanceScore = Math.min(1.0, relevanceScore);

    // Score seniority
    let seniorityScore = 1.0;
    const jdSeniority = jd.seniority;
    if (jdSeniority && seniorityLevels[jdSeniority]) {
        const jdLevel = seniorityLevels[jdSeniority];
        const candLevel = highestSeniorityVal;
        if (candLevel >= jdLevel) {
            seniorityScore = 1.0;
        } else {
            seniorityScore = Math.max(0, 1.0 - 0.25 * (jdLevel - candLevel));
        }
    }

    // If candidate has zero domain-relevant experience, minimal score
    if (domainRelevantYears === 0) {
        return {
            score: 0.05,
            totalYears: Math.round(totalYears * 10) / 10,
            relevantYears: 0,
            seniority: highestSeniority,
            yearsScore: 0,
            relevanceScore: 0,
            seniorityScore: 0
        };
    }

    const finalScore = (yearsScore * 0.4) + (relevanceScore * 0.4) + (seniorityScore * 0.2);

    return {
        score: finalScore,
        totalYears: Math.round(totalYears * 10) / 10,
        relevantYears: Math.round(domainRelevantYears * 10) / 10,
        seniority: highestSeniority,
        yearsScore,
        relevanceScore,
        seniorityScore
    };
}
