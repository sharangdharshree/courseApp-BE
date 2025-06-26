import mongoose, { mongo } from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["video", "pdf", "file", "link", "other"],
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
      default: Date,
    },
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
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

const courseSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    thumbnail: {
      type: String,
      required: true,
    },
    sections: [sectionSchema],
    category: {
      type: String,
    },
    basePrice: {
      currency: {
        type: String,
        enum: ["INR", "USD", "EUR", "GBP", "AUD", "JPY"],
        required: true,
        default: "INR",
      },
      amount: {
        type: Number,
        required: true,
      },
    },
  },
  { timestamps: true }
);

const Course = new mongoose.model("Course", courseSchema);

export default Course;
