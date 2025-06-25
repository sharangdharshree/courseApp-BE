import mongoose from "mongoose";
import User from "./user.model.js";
import Course from "./course.model.js";

const purchaseSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Types.ObjectId,
      ref: User,
      required: true,
    },
    course: {
      type: mongoose.Types.ObjectId,
      ref: Course,
      required: true,
    },
    amountBreakdown: {
      currency: {
        type: String,
        required: true,
        enum: ["INR", "USD"],
        default: "INR",
      },
      mrp: {
        type: Number,
        required: true,
      },
      netDiscount: {
        type: Number,
        required: true,
      },
      couponUsed: {
        type: String,
      },
      totalAmountPaid: {
        type: Number,
        required: true,
      },
    },
    paymentStatus: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING"],
      required: true,
      default: "SUCCESS",
    },
    paymentMethod: {
      type: String,
      enum: ["CARD", "UPI", "EMI", "NETBANKING", "CRYPTO", "OTHER"],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    purchasedAt: {
      type: Date.now(),
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;
