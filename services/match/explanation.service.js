export function generateExplanation(scores, penaltyRes, finalScore) {
    const strengths = [];
    const weaknesses = [];

    // 1. Domain Alignment Analysis
    if (scores.domain) {
        const domainPct = Math.round(scores.domain.score * 100);
        if (!scores.domain.primaryMismatch) {
            strengths.push(`Strong domain alignment (${domainPct}% similarity between JD and resume technical profiles).`);
        } else {
            weaknesses.push(`Weak domain alignment (only ${domainPct}% similarity). The candidate's technical background does not closely match the role's core domain.`);
        }
    }

    // 2. Skill-based Analysis
    if (scores.skills) {
        const missingMandatory = scores.skills.missingMandatory || [];
        const missingPreferred = scores.skills.missingPreferred || [];
        const matched = scores.skills.matchedSkills || [];

        if (missingMandatory.length === 0 && matched.length > 0) {
            strengths.push("Meets all mandatory skill requirements for this position.");
        } else if (missingMandatory.length > 0) {
            weaknesses.push(`Missing critical mandatory skill(s): ${missingMandatory.slice(0, 4).join(", ")}.`);
        }

        if (missingPreferred.length > 0) {
            weaknesses.push(`Missing preferred skill(s): ${missingPreferred.slice(0, 4).join(", ")}.`);
        }

        if (matched.length > 0) {
            strengths.push(`Possesses key skills matching the role: ${matched.slice(0, 4).join(", ")}.`);
        }
    }

    // 3. Experience and Seniority Analysis
    if (scores.experience) {
        const exp = scores.experience;
        const total = exp.totalYears || 0;
        const relevant = exp.relevantYears || 0;

        if (relevant > 0) {
            strengths.push(`Possesses ${relevant} years of domain-relevant experience (out of ${total} total years).`);
        }

        if (relevant === 0) {
            weaknesses.push(`No domain-relevant professional experience found (total career duration is ${total} years in other domains).`);
        }
    }

    // 4. Education Alignment
    if (scores.education) {
        const edu = scores.education;
        if (edu.degreeScore >= 1.0) {
            strengths.push(`Meets or exceeds the required educational level (${edu.highestDegree || "N/A"}).`);
        } else if (edu.requiredDegree !== "None") {
            weaknesses.push(`Degree level (${edu.highestDegree || "None"}) does not meet preferred requirements.`);
        }
    }

    // Baseline fallback if lists are empty
    if (strengths.length === 0) {
        strengths.push("Meets baseline criteria for assessment.");
    }
    if (weaknesses.length === 0 && finalScore < 0.70) {
        weaknesses.push("Minor qualifications or experience gaps relative to ideal candidate profile.");
    }

    return {
        strengths,
        weaknesses,
        penalties: penaltyRes.reasons,
        breakdown: {
            embedding: Math.round(scores.embedding.score * 100),
            skills: Math.round(scores.skills.score * 100),
            experience: Math.round(scores.experience.score * 100),
            education: Math.round(scores.education?.score * 100 || 0),
            certification: Math.round(scores.certification?.score * 100 || 0),
            responsibility: Math.round(scores.responsibility?.score * 100 || 0),
            location: Math.round(scores.location?.score * 100 || 0),
            domain: Math.round(scores.domain?.score * 100 || 0)
        }
    };
}
