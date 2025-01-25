import mongoose from "mongoose";

interface Iuser extends Document {
  username: string;
  email: string;
  password: string;
}

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        unique: true,
    },
},
    { timestamps: true });

const User = mongoose.models.User as mongoose.Model<Iuser> || mongoose.model("User", userSchema);
export default User;
