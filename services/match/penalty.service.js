export function calculatePenalties(jd, resume, scores) {
    let totalPenalty = 0;
    const reasons = [];

    // 1. Primary Domain Mismatch Check
    if (scores.domain && scores.domain.primaryMismatch) {
        const penalty = 0.35;
        totalPenalty += penalty;
        reasons.push(`Severe domain mismatch: Domain similarity is only ${Math.round(scores.domain.score * 100)}% (-35%)`);
    }

    // 2. Segmented Skills Check (Mandatory vs. Preferred)
    if (scores.skills) {
        const missingMandatory = scores.skills.missingMandatory || [];
        const missingPreferred = scores.skills.missingPreferred || [];

        if (missingMandatory.length > 0) {
            const mandatoryPenalty = Math.min(0.40, missingMandatory.length * 0.15);
            totalPenalty += mandatoryPenalty;
            reasons.push(`Missing ${missingMandatory.length} mandatory skill(s): ${missingMandatory.slice(0, 3).join(", ")}${missingMandatory.length > 3 ? '...' : ''} (-${Math.round(mandatoryPenalty * 100)}%)`);
        }

        if (missingPreferred.length > 0) {
            const preferredPenalty = Math.min(0.08, missingPreferred.length * 0.02);
            totalPenalty += preferredPenalty;
            reasons.push(`Missing ${missingPreferred.length} preferred skill(s): ${missingPreferred.slice(0, 3).join(", ")}${missingPreferred.length > 3 ? '...' : ''} (-${Math.round(preferredPenalty * 100)}%)`);
        }
    }

    // 3. Minimum experience check
    const jdMinYears = jd.minimumExperience?.years || 0;
    const candYears = scores.experience?.relevantYears || 0; // Using domain-relevant years instead of generic years
    if (jdMinYears > 0 && candYears < jdMinYears) {
        const yearsShort = jdMinYears - candYears;
        const penalty = Math.min(0.3, 0.05 * Math.ceil(yearsShort));
        totalPenalty += penalty;
        reasons.push(`Domain-relevant experience of ${candYears} years is below required minimum of ${jdMinYears} years (-${Math.round(penalty * 100)}%)`);
    }

    // 4. Required degree check
    if (scores.education && scores.education.degreeScore < 1.0) {
        const penalty = 0.15;
        totalPenalty += penalty;
        reasons.push(`Highest degree (${scores.education.highestDegree || "None"}) does not meet required degree level (${scores.education.requiredDegree}) (-15%)`);
    }

    // 5. Required certifications check
    if (scores.certification && scores.certification.missingCerts && scores.certification.missingCerts.length > 0) {
        if (scores.certification.matchedCerts.length === 0) {
            const penalty = 0.1;
            totalPenalty += penalty;
            reasons.push(`Missing all required certifications: ${scores.certification.missingCerts.join(", ")} (-10%)`);
        }
    }

    return {
        penalty: totalPenalty,
        reasons
    };
}
