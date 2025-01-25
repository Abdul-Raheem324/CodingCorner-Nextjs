import mongoose from "mongoose";
import File from "./fileModel";

interface IFolder extends Document { 
    foldername: string; 
    owner: mongoose.Schema.Types.ObjectId; 
    files: mongoose.Schema.Types.ObjectId[]; 
    createdAt: Date; updatedAt: Date; 
}

const folderSchema = new mongoose.Schema({
    foldername : {
        type : String,
        required : true,
        unique:true
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    files : [{
        type : mongoose.Schema.ObjectId,
        ref : File.modelName
    }]
},
{
    timestamps:true
})

const Folder = mongoose.models.Folder || mongoose.model<IFolder>('Folder', folderSchema);
export default Folder