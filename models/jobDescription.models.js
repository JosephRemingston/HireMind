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

        skills: {
            type: [Schema.Types.Mixed],
            default: [],
        },

        embedding: {
            type: [Number],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("JobDescription", jobDescriptionSchema);