import JobDescription from "../../models/jobDescription.models.js";
import Resume from "../../models/resume.models.js";
import MatchResult from "../../models/matchResult.models.js";
import { parseJobDescription } from "../jd.service.js";
import { scoreCandidate } from "./scoring.service.js";
import ApiError from "../../utils/ApiError.js";

export async function runMatchPipeline({ userId, jobDescriptionId, jdPayload, batchId, weights, limit }) {
    let jd = null;

    if (jobDescriptionId) {
        jd = await JobDescription.findOne({ _id: jobDescriptionId, userId }).lean();
        if (!jd) {
            throw ApiError.badRequest("Job description not found");
        }
    } else if (jdPayload) {
        jd = await parseJobDescription(jdPayload);
    } else {
        throw ApiError.badRequest("Job description ID or payload is required");
    }
    // Merge weight priority: caller weights → jd.weights → system defaults
    // (jd.weights stored at creation time wins over ad-hoc caller weights)
    const effectiveWeights = Object.assign({}, weights || {}, jd.weights || {});
    const query = { userId, status: "parsed" };
    if (batchId) {
        query.batchId = batchId;
    }

    const resumes = await Resume.find(query).lean();
    if (resumes.length === 0) {
        return await MatchResult.create({
            userId,
            jobDescriptionId: jd._id || null,
            batchId: batchId || null,
            weights: effectiveWeights,
            results: []
        });
    }

    const scoredResults = await Promise.all(
        resumes.map(resume => scoreCandidate(jd, resume, effectiveWeights))
    );

    // Multi-level sort: finalScore → embedding (semantic fit) → experience
    scoredResults.sort((a, b) => {
        if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
        if (b.scores.embedding !== a.scores.embedding) return b.scores.embedding - a.scores.embedding;
        return b.scores.experience - a.scores.experience;
    });

    const finalResults = limit ? scoredResults.slice(0, limit) : scoredResults;

    const matchResult = await MatchResult.create({
        userId,
        jobDescriptionId: jd._id || null,
        batchId: batchId || null,
        weights: effectiveWeights,
        results: finalResults
    });

    return matchResult;
}

export async function getMatchResultsList(userId, { page = 1, limit = 10 } = {}) {
    const total = await MatchResult.countDocuments({ userId });
    const matches = await MatchResult.find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return {
        matches,
        pagination: {
            page,
            limit,
            total,
            pages: Math.max(1, Math.ceil(total / limit))
        }
    };
}

export async function getMatchResultById(userId, matchId) {
    const match = await MatchResult.findOne({ _id: matchId, userId }).lean();
    if (!match) {
        throw ApiError.badRequest("Match result not found");
    }
    return match;
}
