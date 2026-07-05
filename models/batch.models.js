import mongoose from "mongoose";

const { Schema } = mongoose;

const batchSchema = new Schema(
{
    userId:{
        type:String,
        required:true,
        index:true
    },

    name:{
        type:String,
        required:true
    },

    totalResumes:{
        type:Number,
        default:0
    },

    parsedResumes:{
        type:Number,
        default:0
    },

    failedResumes:{
        type:Number,
        default:0
    },

    status:{
        type:String,
        enum:["processing","ready"],
        default:"processing"
    }

},
{
    timestamps:true
});

export default mongoose.model("Batch",batchSchema);