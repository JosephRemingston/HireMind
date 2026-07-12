import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

import JobDescription from "../models/jobDescription.models.js";
import { parseJobDescription } from "../services/jd.service.js";

const createJobDescription = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { title, rawText, keywords, skills } = req.body;

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
        throw ApiError.badRequest("Job description text is required");
    }

    const parsedJobDescription = await parseJobDescription({
        title,
        rawText,
        keywords,
        skills,
    });

    const jobDescription = await JobDescription.create({
        userId,
        ...parsedJobDescription,
    });

    return ApiResponse.success(res, "Job description saved successfully", {
        jobDescription,
    });
});

export { createJobDescription };