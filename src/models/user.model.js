import mongoose from "mongoose";

const userSchema = mongoose.Schema(
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
      enum: ["user", "admin"],
      default: "user",
    },
    purchases: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Purchase,
      },
    ],
    refreshToken: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
