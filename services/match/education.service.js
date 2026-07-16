export function calculateEducationScore(jd, resume) {
    const education = resume?.parsedData?.education || [];
    const jdText = `${jd.title || ""} ${jd.rawText || ""}`.toLowerCase();

    // 1. Determine JD required degree
    let requiredLevel = 0;
    let requiredName = "None";
    
    if (jdText.match(/\b(ph\.?d\.?|doctorate)\b/)) {
        requiredLevel = 5;
        requiredName = "PhD";
    } else if (jdText.match(/\b(master's|masters|ms|ma|mba|m\.s\.|m\.a\.|mtech|meng)\b/)) {
        requiredLevel = 4;
        requiredName = "Master's";
    } else if (jdText.match(/\b(bachelor's|bachelors|bs|ba|b\.s\.|b\.a\.|btech|beng)\b/)) {
        requiredLevel = 3;
        requiredName = "Bachelor's";
    } else if (jdText.match(/\b(associate|diploma)\b/)) {
        requiredLevel = 2;
        requiredName = "Associate";
    }

    if (education.length === 0) {
        return {
            score: requiredLevel > 0 ? 0 : 1.0,
            highestDegree: null,
            requiredDegree: requiredName,
            fieldMatch: false,
            explanation: requiredLevel > 0 ? "Degree required but no education listed" : "No education listed, but not required"
        };
    }

    const DEGREE_LEVELS = {
        'phd': 5, 'doctor': 5, 'doctorate': 5,
        'master': 4, 'ms': 4, 'ma': 4, 'mba': 4, 'mtech': 4, 'meng': 4,
        'bachelor': 3, 'bs': 3, 'ba': 3, 'btech': 3, 'beng': 3,
        'associate': 2, 'diploma': 2,
        'high school': 1
    };

    const getDegreeLevel = (degStr) => {
        if (!degStr) return 0;
        const normalized = degStr.toLowerCase();
        for (const [key, val] of Object.entries(DEGREE_LEVELS)) {
            if (normalized.includes(key)) return val;
        }
        return 2; // Default if present but not matched
    };

    // Find highest candidate degree
    let highestLevel = 0;
    let highestEdu = null;

    for (const edu of education) {
        const lvl = getDegreeLevel(edu.degree);
        if (lvl > highestLevel) {
            highestLevel = lvl;
            highestEdu = edu;
        }
    }

    // 2. Score degree level
    let degreeScore = 1.0;
    if (requiredLevel > 0) {
        if (highestLevel >= requiredLevel) {
            degreeScore = 1.0;
        } else {
            degreeScore = highestLevel / requiredLevel;
        }
    }

    // 3. Score field match
    let fieldMatch = false;
    let fieldScore = 0.5; // Neutral baseline if no field matching words are found
    
    if (highestEdu && highestEdu.field) {
        const fieldNorm = highestEdu.field.toLowerCase();
        
        // Simple token matching with JD keywords or title/rawText
        const jdKeywords = (jd.keywords || []).map(k => k.toLowerCase());
        const jdTitleWords = (jd.title || "").toLowerCase().split(/\s+/).filter(w => w.length > 3);
        
        const allKeywords = [...new Set([...jdKeywords, ...jdTitleWords, 'computer science', 'software', 'engineering', 'technology', 'math', 'science'])];
        
        for (const kw of allKeywords) {
            if (fieldNorm.includes(kw) || kw.includes(fieldNorm)) {
                fieldMatch = true;
                fieldScore = 1.0;
                break;
            }
        }
    } else {
        fieldScore = 0.3;
    }

    // Combined score: 70% degree level, 30% field relevance
    const finalScore = (degreeScore * 0.7) + (fieldScore * 0.3);

    return {
        score: finalScore,
        highestDegree: highestEdu ? highestEdu.degree : null,
        highestField: highestEdu ? highestEdu.field : null,
        requiredDegree: requiredName,
        fieldMatch,
        degreeScore,
        fieldScore
    };
}
