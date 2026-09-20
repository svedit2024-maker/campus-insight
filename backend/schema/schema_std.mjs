import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: function () {
                return this.role === "student";
            }
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            default: null
        },

        googleId: {
            type: String,
            sparse: true,
            unique: true
        },

        role: {
            type: String,
            enum: ["student", "management"],
            default: "student"
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;