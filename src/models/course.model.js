import mongoose, { mongo } from "mongoose";
import { User } from "./user.model.js";

const contentSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["video", "pdf", "file", "other"],
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    url: {
      type: String,
      trim: true,
      required: true,
    },
    duration: {
      type: Number,
    },
    size: {
      type: Number,
    },
    uploadTime: {
      type: Date,
      default: Date.now(),
    },
  },
  { _id: false }
);

const sectionSchema = mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    contents: [contentSchema],
  },
  { _id: false }
);

const courseSchema = mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: User,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    overview: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    sections: [sectionSchema],
    category: {
      type: String,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;
