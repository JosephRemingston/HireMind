import mongoose from "mongoose";
import { createReadStream } from "fs";
import { unlink } from "fs/promises";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

import Batch from "../models/batch.models.js";
import Resume from "../models/resume.models.js";
import s3 from "../configs/s3.js";
import resumeQueue from "../queues/resume.queues.js";

const SUPPORTED_RESUME_MIME_TYPES = new Set([
    "application/pdf",
]);

function isSupportedResumeFile(file) {
    const extension = file.originalname.split(".").pop()?.toLowerCase();
    const mimeType = file.mimetype?.toLowerCase();

    return extension === "pdf" && SUPPORTED_RESUME_MIME_TYPES.has(mimeType);
}

function buildS3Key(userId, batchId, resumeId, originalFileName) {
    const extension = originalFileName.split(".").pop()?.toLowerCase() || "pdf";
    return `${userId}/${batchId}/raw/${resumeId}.${extension}`;
}

async function cleanupUploadedFile(file) {
    if (file?.path) {
        await unlink(file.path).catch(() => {});
    }
}

function getUploadBody(file) {
    if (file.buffer) {
        return file.buffer;
    }

    return createReadStream(file.path);
}

async function markBatchReadyIfComplete(batchId) {
    const batch = await Batch.findById(batchId).select(
        "totalResumes parsedResumes failedResumes status"
    );

    if (!batch) {
        return;
    }

    const completedResumes = batch.parsedResumes + batch.failedResumes;
    if (batch.totalResumes > 0 && completedResumes >= batch.totalResumes) {
        await Batch.findByIdAndUpdate(batchId, { status: "ready" });
    }
}

async function processResumeFile({ file, userId, batchId }) {
    const resumeId = new mongoose.Types.ObjectId();
    let resume = null;

    try {
        resume = await Resume.create({
            _id: resumeId,
            userId,
            batchId,
            originalFileName: file.originalname,
            status: "pending",
        });

        if (!isSupportedResumeFile(file)) {
            const rejectionReason = "Unsupported file type. Only PDF resumes are accepted.";

            await Resume.findByIdAndUpdate(resume._id, {
                status: "failed",
                parsedData: {
                    error: rejectionReason,
                    originalMimeType: file.mimetype || null,
                },
            });

            return {
                status: "failed",
                resume: await Resume.findById(resume._id).lean(),
                reason: rejectionReason,
            };
        }

        const s3Key = buildS3Key(userId, batchId, resume._id, file.originalname);

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                Body: getUploadBody(file),
                ContentType: file.mimetype,
            })
        );

        resume.s3RawKey = s3Key;
        await resume.save();

        await resumeQueue.add(
            "parseResume",
            {
                resumeId: resume._id.toString(),
            },
            {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            }
        );

        return {
            status: "success",
            resume: resume.toObject(),
        };
    } catch (error) {
        if (resume?._id) {
            await Resume.findByIdAndUpdate(resume._id, {
                status: "failed",
                parsedData: {
                    error: error.message,
                },
            }).catch(() => {});
        }

        return {
            status: "failed",
            resume: resume ? await Resume.findById(resume._id).lean() : null,
            reason: error.message,
        };
    } finally {
        await cleanupUploadedFile(file);
    }
}

const uploadResumes = asyncHandler(async (req, res) => {

    const userId = req.user._id.toString();
    const { batchName } = req.body;

    if (!req.files || req.files.length === 0) {
        throw ApiError.badRequest("No files uploaded");
    }

    const batch = await Batch.create({
        userId,
        name: batchName || `Batch-${Date.now()}`,
        totalResumes: req.files.length,
        status: "processing"
    });

    const uploadedResumes = [];
    const failedFiles = [];

    for (const file of req.files) {
        const result = await processResumeFile({
            file,
            userId,
            batchId: batch._id,
        });

        if (result.status === "success") {
            uploadedResumes.push(result.resume);
            continue;
        }

        failedFiles.push({
            fileName: file.originalname,
            reason: result.reason,
        });

        await Batch.findByIdAndUpdate(batch._id, {
            $inc: { failedResumes: 1 },
        });

        await markBatchReadyIfComplete(batch._id);
    }

    return ApiResponse.success(res, "Resumes uploaded successfully", {
        batch,
        resumes: uploadedResumes,
        failures: failedFiles,
    });

});

export { uploadResumes };