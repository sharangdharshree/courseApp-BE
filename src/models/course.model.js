import mongoose, { mongo } from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    publicId: {
      type: String,
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
  { timestamps: true }
);

contentSchema.methods.generateThumbnailUrl = function (publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  const width = 300;
  const height = 300;
  const crop = "fill";
  const quality = "auto";

  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},h_${height},c_${crop},q_${quality}/${publicId}.jpg`;
};
const Content = new mongoose.model("Content", contentSchema);

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
      type: [
        {
          type: mongoose.Types.ObjectId,
          ref: "Content",
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);
const Section = new mongoose.model("Section", sectionSchema);

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
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },
    sections: {
      type: [
        {
          type: mongoose.Types.ObjectId,
          ref: "Section",
        },
      ],
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

export { Course, Section, Content };
