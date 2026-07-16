import { calculateEmbeddingScore } from "./embedding.service.js";
import { calculateSkillScore } from "./skill.service.js";
import { calculateExperienceScore } from "./experience.service.js";
import { calculateEducationScore } from "./education.service.js";
import { calculateCertificationScore } from "./certification.service.js";
import { calculateResponsibilityScore } from "./responsibility.service.js";
import { calculateLocationScore } from "./location.service.js";
import { calculateDomainScore } from "./domain.service.js";
import { calculatePenalties } from "./penalty.service.js";
import { generateExplanation } from "./explanation.service.js";

const DEFAULT_WEIGHTS = {
    embedding: 0.25,
    skills: 0.30,
    experience: 0.20,
    responsibility: 0.10,
    education: 0.05,
    certification: 0.05,
    location: 0.05
};

export async function scoreCandidate(jd, resume, customWeights = {}) {
    const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

    const embeddingRes = calculateEmbeddingScore(jd.embedding, resume.embedding);
    const domainRes = await calculateDomainScore(jd, resume);
    const skillRes = await calculateSkillScore(jd.requiredSkills, resume.parsedData?.skills, jd.rawText);
    const experienceRes = calculateExperienceScore(jd, resume);
    const educationRes = calculateEducationScore(jd, resume);
    const certificationRes = calculateCertificationScore(jd, resume);
    const responsibilityRes = await calculateResponsibilityScore(jd, resume);
    const locationRes = calculateLocationScore(jd, resume);

    const scores = {
        embedding: embeddingRes,
        domain: domainRes,
        skills: skillRes,
        experience: experienceRes,
        education: educationRes,
        certification: certificationRes,
        responsibility: responsibilityRes,
        location: locationRes
    };

    let weightedScore = 
        (scores.embedding.score * weights.embedding) +
        (scores.skills.score * weights.skills) +
        (scores.experience.score * weights.experience) +
        (scores.education.score * weights.education) +
        (scores.certification.score * weights.certification) +
        (scores.responsibility.score * weights.responsibility) +
        (scores.location.score * weights.location);

    const penaltyRes = calculatePenalties(jd, resume, scores);

    // Apply penalties as a multiplicative discount factor (retaining at least 10% of the weighted score)
    const discount = Math.max(0.10, 1.0 - penaltyRes.penalty);
    let finalScore = weightedScore * discount;
    finalScore = Math.max(0, Math.min(1.0, finalScore));

    const explanation = generateExplanation(scores, penaltyRes, finalScore);

    return {
        resumeId: resume._id,
        candidateName: resume.parsedData?.contact?.name || resume.originalFileName || "Unnamed Candidate",
        finalScore,
        scores: {
            embedding: scores.embedding.score,
            skills: scores.skills.score,
            experience: scores.experience.score,
            education: scores.education.score,
            certification: scores.certification.score,
            responsibility: scores.responsibility.score,
            location: scores.location.score
        },
        domain: {
            score: domainRes.score,
            primaryMismatch: domainRes.primaryMismatch,
            jdProfile: domainRes.jdProfile,
            resumeProfile: domainRes.resumeProfile
        },
        explanation,
        weights
    };
}
