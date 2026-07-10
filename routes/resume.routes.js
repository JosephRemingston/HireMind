import express from "express";
import { uploadResumes } from "../controllers/upload.controller.js";
import {
	getBatch,
	getBatchProgress,
	getResume,
	listBatchResumes,
	listBatches,
	listResumes
} from "../controllers/resume.controller.js";
import { authenticate } from "../middlewares/auth.middlware.js";
import { upload } from "../middlewares/upload.middleware.js";

var router = express.Router();

router.post("/upload", authenticate, upload.array("resumes", 100), uploadResumes);
router.get("/batches", authenticate, listBatches);
router.get("/batches/:batchId/progress", authenticate, getBatchProgress);
router.get("/batches/:batchId/resumes", authenticate, listBatchResumes);
router.get("/batches/:batchId", authenticate, getBatch);
router.get("/resumes", authenticate, listResumes);
router.get("/resumes/:resumeId", authenticate, getResume);

export default router;
