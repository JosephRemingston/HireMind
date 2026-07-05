import { Worker } from "bullmq";

import { getRedis } from "../configs/redis.js";

const worker = new Worker(
    "resume-parsing",

    async (job) => {

        console.log("Processing Resume:", job.data.resumeId);

        // Parsing logic goes here later

    },

    {
        connection: getRedis()
    }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed`, err);
});

export default worker;