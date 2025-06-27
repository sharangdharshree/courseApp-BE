import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      min: [6, "At-least 6 characters are required for password"],
    },
    phone: {
      type: Number,
      min: [10, "Enter correct phone number"],
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "SUPERADMIN"],
      default: "ADMIN",
    },
    permissions: {
      type: [String],
      default: [],
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    refreshToken: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

adminSchema.method.isPasswordCorrect = async (password) => {
  return await bcrypt.compare(password, this.password);
};
adminSchema.method.generateAccessToken = () => {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      fullName: this.fullName,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
adminSchema.method.generateRefreshToken = () => {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

const Admin = new mongoose.model("Admin", adminSchema);

export default Admin;
