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
    thumbnail: {
      type: String,
    },
    uploadTime: {
      type: Date,
      required: true,
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
    contents: {
      type: [contentSchema],
      default: [],
    },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
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
    sections: {
      type: [sectionSchema],
      default: [],
    },
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
        default: 0,
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Course = new mongoose.model("Course", courseSchema);

export default Course;
