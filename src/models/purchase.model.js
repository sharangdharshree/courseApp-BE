import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const purchaseSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
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
    purchaseStatus: {
      type: String,
      enum: ["PENDING", "PAID", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"],
      default: "PENDING",
    },
    purchasedAt: {
      type: Date,
      required: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

purchaseSchema.method.generateInvoice = () => {
  if (this.purchaseStatus !== "COMPLETED") {
    throw new ApiError(
      401,
      `Invoice generation failed, Purchase Status: ${this.purchaseStatus}`
    );
  }
  return "INV" + new Date.getFullYear() + this._id;
};

const Purchase = new mongoose.model("Purchase", purchaseSchema);

export default Purchase;
