import mongoose from "mongoose";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

import Batch from "../models/batch.models.js";
import Resume from "../models/resume.models.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const toPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildPagination = (page, limit, total) => ({
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit))
});

const buildBatchProgress = (batch) => {
    const completedResumes = batch.parsedResumes + batch.failedResumes;
    const progress = batch.totalResumes > 0
        ? Math.round((completedResumes / batch.totalResumes) * 100)
        : 0;

    return {
        totalResumes: batch.totalResumes,
        parsedResumes: batch.parsedResumes,
        failedResumes: batch.failedResumes,
        completedResumes,
        progress,
        status: batch.status
    };
};

const listBatches = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const page = toPositiveInt(req.query.page, DEFAULT_PAGE);
    const limit = Math.min(toPositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const { status } = req.query;

    const query = { userId };
    if (status) {
        query.status = status;
    }

    const total = await Batch.countDocuments(query);
    const batches = await Batch.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return ApiResponse.success(res, "Batches retrieved successfully", {
        batches: batches.map((batch) => ({
            ...batch,
            progress: buildBatchProgress(batch)
        })),
        pagination: buildPagination(page, limit, total)
    });
});

const getBatch = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { batchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
        throw ApiError.badRequest("Invalid batch id");
    }

    const batch = await Batch.findOne({ _id: batchId, userId }).lean();
    if (!batch) {
        throw ApiError.badRequest("Batch not found");
    }

    return ApiResponse.success(res, "Batch retrieved successfully", {
        batch: {
            ...batch,
            progress: buildBatchProgress(batch)
        }
    });
});

const getBatchProgress = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { batchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
        throw ApiError.badRequest("Invalid batch id");
    }

    const batch = await Batch.findOne({ _id: batchId, userId }).lean();
    if (!batch) {
        throw ApiError.badRequest("Batch not found");
    }

    return ApiResponse.success(res, "Batch progress retrieved successfully", {
        batchId,
        progress: buildBatchProgress(batch)
    });
});

const listBatchResumes = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { batchId } = req.params;
    const { status } = req.query;

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
        throw ApiError.badRequest("Invalid batch id");
    }

    const batch = await Batch.findOne({ _id: batchId, userId }).lean();
    if (!batch) {
        throw ApiError.badRequest("Batch not found");
    }

    const query = { userId, batchId };
    if (status) {
        query.status = status;
    }

    const resumes = await Resume.find(query)
        .sort({ createdAt: -1 })
        .lean();

    return ApiResponse.success(res, "Batch resumes retrieved successfully", {
        batchId,
        resumes
    });
});

const listResumes = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const page = toPositiveInt(req.query.page, DEFAULT_PAGE);
    const limit = Math.min(toPositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const { status, batchId } = req.query;

    const query = { userId };
    if (status) {
        query.status = status;
    }
    if (batchId) {
        if (!mongoose.Types.ObjectId.isValid(batchId)) {
            throw ApiError.badRequest("Invalid batch id");
        }
        query.batchId = batchId;
    }

    const total = await Resume.countDocuments(query);
    const resumes = await Resume.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return ApiResponse.success(res, "Resumes retrieved successfully", {
        resumes,
        pagination: buildPagination(page, limit, total)
    });
});

const getResume = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { resumeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
        throw ApiError.badRequest("Invalid resume id");
    }

    const resume = await Resume.findOne({ _id: resumeId, userId }).lean();
    if (!resume) {
        throw ApiError.badRequest("Resume not found");
    }

    return ApiResponse.success(res, "Resume retrieved successfully", {
        resume
    });
});

export {
    getBatch,
    getBatchProgress,
    getResume,
    listBatchResumes,
    listBatches,
    listResumes
};