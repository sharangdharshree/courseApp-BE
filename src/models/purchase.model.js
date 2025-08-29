import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const purchaseSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
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
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
      },
      couponStatus: {
        type: String,
        enum: ["APPLIED", "REDEEMED", "CANCELLED", "EXPIRED"],
      },
      couponAppliedAt: {
        type: Date,
      },
      netDiscount: {
        type: Number,
        required: true,
      },

      totalAmountPaid: {
        type: Number,
        required: true,
      },
    },
    orderId: {
      type: String,
      required: true,
    },
    orderState: {
      //external gateway state.
      type: String,
      enum: ["created", "attempted", "paid"],
      default: "created",
    },
    paymentId: {
      type: String,
    },
    paymentState: {
      //transaction lifecycle.
      type: String,
      enum: ["created", "authorized", "captured", "refunded", "failed"],
    },
    paymentMethod: {
      type: String,
      enum: ["CARD", "UPI", "EMI", "NETBANKING", "CRYPTO", "OTHER"],
      required: true,
    },

    purchaseStatus: {
      //internal business status.
      type: String,
      enum: [
        "STARTED",
        "PENDING",
        "COMPLETED",
        "FAILED",
        "REFUND" /** WHEN REFUND WILL BE INITIATED BY USER */,
        "REFUNDED" /** WHEN FINALLY THE REFUND WILL BE COMPLETED */,
      ],
      default: "STARTED",
    },
    purchasedAt: {
      type: Date,
    },
    razorpaySignature: {
      type: String,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

purchaseSchema.methods.generateInvoice = function () {
  if (this.purchaseStatus !== "COMPLETED") {
    throw new ApiError(
      401,
      `Invoice generation failed, Purchase Status: ${this.purchaseStatus}`
    );
  }
  return "INV-" + new Date.getFullYear() + "-" + this._id;
};

// --- Amount Validation ---
purchaseSchema.pre("save", function (next) {
  const calculatedTotal =
    this.amountBreakdown.mrp - this.amountBreakdown.netDiscount;
  if (this.amountBreakdown.totalAmountPaid !== calculatedTotal) {
    return next(new ApiError(400, "Invalid amount breakdown mismatch"));
  }
  next();
});

// --- State Enforcement ---
// --- Allowed Transitions ---
const allowedTransitions = {
  STARTED: ["PENDING"],
  PENDING: ["COMPLETED", "FAILED"],
  COMPLETED: ["REFUND"],
  REFUND: ["REFUNDED"],
  FAILED: [],
  REFUNDED: [],
};

// -----------------
// State Check (for save())
// -----------------
purchaseSchema.pre("save", function (next) {
  if (!this.isModified("purchaseStatus")) return next();

  const oldStatus = this.$__.originalDoc?.purchaseStatus || this.purchaseStatus;
  const newStatus = this.purchaseStatus;

  if (oldStatus !== newStatus) {
    const allowed = allowedTransitions[oldStatus] || [];
    if (!allowed.includes(newStatus)) {
      return next(
        new ApiError(
          400,
          `Invalid status transition on save: ${oldStatus} → ${newStatus}`
        )
      );
    }
  }
});

// -----------------
// State Check (for findOneAndUpdate())
// -----------------
purchaseSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (!update.purchaseStatus && !update["$set"]?.purchaseStatus) {
    return next();
  }

  const newStatus = update.purchaseStatus || update["$set"].purchaseStatus;
  const docToUpdate = await this.model.findOne(this.getQuery()).lean();
  if (!docToUpdate) return next();

  const oldStatus = docToUpdate.purchaseStatus;
  const allowed = allowedTransitions[oldStatus] || [];
  if (!allowed.includes(newStatus)) {
    return next(
      new ApiError(
        400,
        `Invalid status transition: ${oldStatus} → ${newStatus}`
      )
    );
  }

  next();
});

const Purchase = new mongoose.model("Purchase", purchaseSchema);

export default Purchase;
