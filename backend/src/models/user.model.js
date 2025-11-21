import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email:{
            type:String,
            required: true,
            unique:true,
        },
        fullName: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            unique: true,
            sparse: true, // allows multiple null values
        },
        password: {
            type:String,
            required:true,
            minlength:6,
        },
        profilePic: {
            type: String,
            default: "",
        },
    },
    {timestamps: true}
);

const User = mongoose.model("User", userSchema);

export default User;