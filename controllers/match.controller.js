import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { runMatchPipeline, getMatchResultsList, getMatchResultById } from "../services/match/match.service.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const toPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const runMatch = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { jobDescriptionId, jdPayload, batchId, weights, limit } = req.body;

    if (jobDescriptionId && !mongoose.Types.ObjectId.isValid(jobDescriptionId)) {
        throw ApiError.badRequest("Invalid job description id");
    }

    if (batchId && !mongoose.Types.ObjectId.isValid(batchId)) {
        throw ApiError.badRequest("Invalid batch id");
    }

    const matchLimit = limit ? toPositiveInt(limit, null) : null;

    const result = await runMatchPipeline({
        userId,
        jobDescriptionId,
        jdPayload,
        batchId,
        weights,
        limit: matchLimit
    });

    return ApiResponse.success(res, "Matching completed successfully", {
        matchResult: result
    });
});

const listMatches = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const page = toPositiveInt(req.query.page, DEFAULT_PAGE);
    const limit = Math.min(toPositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);

    const { matches, pagination } = await getMatchResultsList(userId, { page, limit });

    return ApiResponse.success(res, "Match results retrieved successfully", {
        matches,
        pagination
    });
});

const getMatchResult = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { matchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
        throw ApiError.badRequest("Invalid match id");
    }

    const match = await getMatchResultById(userId, matchId);

    return ApiResponse.success(res, "Match result retrieved successfully", {
        match
    });
});

export {
    runMatch,
    listMatches,
    getMatchResult
};
