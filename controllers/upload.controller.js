import mongoose from "mongoose";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

import Batch from "../models/batch.models.js";
import Resume from "../models/resume.models.js";
import s3 from "../configs/s3.js";

const uploadResumes = asyncHandler(async (req, res) => {

    const userId = req.user.id;
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

    for (const file of req.files) {

        const resumeId = new mongoose.Types.ObjectId();

        const extension = file.originalname.split(".").pop();

        const s3Key =
            `${userId}/${batch._id}/raw/${resumeId}.${extension}`;

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                Body: file.buffer,
                ContentType: file.mimetype
            })
        );

        const resume = await Resume.create({
            _id: resumeId,
            userId,
            batchId: batch._id,
            originalFileName: file.originalname,
            s3RawKey: s3Key,
            status: "pending"
        });

        uploadedResumes.push(resume);

        await resumeQueue.add(
            "parseResume",
            {
                resumeId: resume._id.toString()
            },
            {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 5000
                },
                removeOnComplete: true,
                removeOnFail: false
            }
        );
    }

    return ApiResponse.success(res, {
        message: "Resumes uploaded successfully",
        data: {
            batch,
            resumes: uploadedResumes
        }
    });

});

export { uploadResumes };