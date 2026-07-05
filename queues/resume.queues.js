import { Queue } from "bullmq";
import { getRedis } from "../configs/redis.js";

const resumeQueue = new Queue("resume-parsing", {
    connection: getRedis()
});

export default resumeQueue;