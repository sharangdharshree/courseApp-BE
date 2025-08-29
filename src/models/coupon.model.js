import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ["PERCENT", "FIXED"],
      default: "PERCENT",
    },
    discountValue: {
      type: Number,
      required: true,
      validate: {
        validator: function (val) {
          if (this.discountType === "PERCENT") return val > 0 && val <= 100;
          if (this.discountType === "FIXED") return val > 0;
        },
        message: "Invalid discount value",
      },
    },
    minOrderValue: {
      type: Number,
    },
    maxDiscount: {
      type: Number,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
    },
    perUserLimit: {
      type: Number,
    },
    applicableOn: {
      type: String,
      enum: ["ALL", "CATEGORY", "COURSE"],
      default: "ALL",
    },
    applicableCategories: [
      {
        type: String,
      },
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "DISABLED"],
      default: "DISABLED",
    },
  },
  { timestamps: true }
);

couponSchema.pre("validate", function (next) {
  if (
    this.applicableOn === "CATEGORY" &&
    (!this.applicableCategories || this.applicableCategories.length === 0)
  ) {
    return next(
      new ApiError(
        412,
        "At least one category must be provided when applicableOn = CATEGORY"
      )
    );
  }
  if (
    this.applicableOn === "COURSE" &&
    (!this.applicableProducts || this.applicableProducts.length === 0)
  ) {
    return next(
      new ApiError(
        412,
        "At least one course must be provided when applicableOn = COURSE"
      )
    );
  }
  next();
});

couponSchema.index({ code: 1, status: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });

const Coupon = new mongoose.model("Coupon", couponSchema);

export default Coupon;
