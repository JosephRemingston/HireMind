import { Worker } from "bullmq";
import { GetObjectCommand } from "@aws-sdk/client-s3";

import { getRedis } from "../configs/redis.js";
import s3 from "../configs/s3.js";
import Resume from "../models/resume.models.js";
import Batch from "../models/batch.models.js";
import { parseResume } from "../services/parse.service.js";

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

const worker = new Worker(
    "resume-parsing",

    async (job) => {
        const { resumeId } = job.data;
        console.log("Processing Resume:", resumeId);

        const resume = await Resume.findById(resumeId);
        if (!resume) throw new Error(`Resume ${resumeId} not found`);

        const s3Response = await s3.send(
            new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: resume.s3RawKey,
            })
        );

        const chunks = [];
        for await (const chunk of s3Response.Body) {
            chunks.push(chunk);
        }
        const pdfBuffer = Buffer.concat(chunks);

        const { parsedData, embedding } = await parseResume(pdfBuffer);

        resume.parsedData = parsedData;
        resume.embedding = embedding;
        resume.status = "parsed";
        await resume.save();

        await Batch.findByIdAndUpdate(resume.batchId, {
            $inc: { parsedResumes: 1 },
        });

        await markBatchReadyIfComplete(resume.batchId);

        console.log(`Resume ${resumeId} parsed successfully`);
        return { resumeId, status: "parsed" };
    },

    {
        connection: getRedis(),
        concurrency: 3,
    }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", async (job, err) => {
    console.error(`Job ${job?.id} failed`, err);

    if (job?.data?.resumeId) {
        try {
            const resume = await Resume.findById(job.data.resumeId).select("batchId");

            await Resume.findByIdAndUpdate(job.data.resumeId, {
                status: "failed",
            });

            if (resume?.batchId) {
                await Batch.findByIdAndUpdate(resume.batchId, {
                    $inc: { failedResumes: 1 },
                });
                await markBatchReadyIfComplete(resume.batchId);
            }
        } catch (updateErr) {
            console.error("Failed to update resume status:", updateErr);
        }
    }
});

export default worker;
