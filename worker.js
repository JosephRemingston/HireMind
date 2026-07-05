import dotenv from "dotenv";

dotenv.config();

import connectDB from "./configs/database.js";
import { connectRedis } from "./configs/redis.js";

await connectDB();

await connectRedis();

await import("./workers/resume.workers.js");

console.log("Resume Worker Running...");