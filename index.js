import 'dotenv/config';
import express from "express";
import cors from "cors";
import ApiResponse from "./utils/ApiResponse.js";
import authRoutes from "./routes/auth.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import connectDB from "./configs/database.js";
import { connectRedis } from "./configs/redis.js";


var app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"]
}));
app.use(express.json());


await connectDB();
await connectRedis();


app.use("/api/auth/" , authRoutes);
app.use("/api/resumes/" , resumeRoutes);

app.get("/" , (req , res) => {
    return ApiResponse.success(res , "server")
})

app.get("/health" , (req , res) => {
    return ApiResponse.success(res , "API is working" , {
        status : "UP",
        timestamp : new Date().toISOString(),
        uptime : process.uptime()
    })
})

app.listen(3000 , () => {
    console.log("server");
})