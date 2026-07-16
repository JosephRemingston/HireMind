import mongoose from "mongoose";

const { Schema } = mongoose;

const matchResultSchema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },

        jobDescriptionId: {
            type: Schema.Types.ObjectId,
            ref: "JobDescription",
            default: null,
        },

        batchId: {
            type: Schema.Types.ObjectId,
            ref: "Batch",
            default: null,
        },

        weights: {
            type: Schema.Types.Mixed,
            required: true,
        },

        results: [
            {
                resumeId: {
                    type: Schema.Types.ObjectId,
                    ref: "Resume",
                    required: true,
                },
                candidateName: {
                    type: String,
                    default: "Unnamed Candidate",
                },
                finalScore: {
                    type: Number,
                    required: true,
                },
                scores: {
                    embedding: Number,
                    skills: Number,
                    experience: Number,
                    education: Number,
                    certification: Number,
                    responsibility: Number,
                    location: Number,
                },
                domain: {
                    score: Number,
                    primaryMismatch: Boolean,
                    jdProfile: String,
                    resumeProfile: String
                },
                explanation: {
                    finalScore: Number,
                    componentBreakdown: Schema.Types.Mixed,
                    matchedSkills: [String],
                    missingSkills: [String],
                    strengths: [String],
                    weaknesses: [String],
                    penaltyReasons: [String],
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("MatchResult", matchResultSchema);
