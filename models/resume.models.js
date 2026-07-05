import mongoose from "mongoose";

const { Schema } = mongoose;

const resumeSchema = new Schema({

    userId:{
        type:String,
        required:true,
        index:true
    },

    batchId:{
        type:Schema.Types.ObjectId,
        ref:"Batch",
        required:true,
        index:true
    },

    originalFileName:String,

    s3RawKey:String,

    status:{
        type:String,
        enum:["pending","parsed","failed"],
        default:"pending"
    },

    parsedData:Schema.Types.Mixed,

    embedding:[Number]

},{
    timestamps:true
});

export default mongoose.model("Resume",resumeSchema);