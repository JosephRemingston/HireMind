import mongoose from "mongoose";

const { Schema } = mongoose;

const jobDescriptionSchema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },

        title: {
            type: String,
            default: null,
            trim: true,
        },

        rawText: {
            type: String,
            required: true,
            trim: true,
        },

        keywords: {
            type: [String],
            default: [],
        },

        requiredSkills: {
            type: [Schema.Types.Mixed],
            default: [],
        },

        minimumExperience: {
            type: Schema.Types.Mixed,
            default: null,
        },

        seniority: {
            type: String,
            default: null,
            trim: true,
        },

        location: {
            type: String,
            default: null,
            trim: true,
        },

        responsibilities: {
            type: [String],
            default: [],
        },

        skills: {
            type: [Schema.Types.Mixed],
            default: [],
        },

        embedding: {
            type: [Number],
            default: [],
        },

        weights: {
            type: Schema.Types.Mixed,
            default: null, // null = use system defaults at match time
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("JobDescription", jobDescriptionSchema);