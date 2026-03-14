import User from "../models/user.model.js";
import Purchase from "../models/purchase.model.js";
import Coupon from "../models/coupon.model.js";
import { Course } from "../models/course.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validateAndCalculateDiscount } from "./coupon.controller.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const ensureRazorpayConfig = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(
      500,
      "Razorpay keys are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const initiateRazorpayOrder = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      throw new ApiError(401, "Login required");
    }

    const courseId = req.params.courseId;
    const { couponCode } = req.body;

    const course = await Course.findById(courseId);
    if (!course || !course.isPublished) {
      throw new ApiError(404, "Course not available for purchase");
    }

    // prevent duplicate purchase
    const alreadyPurchased = await Purchase.findOne({
      owner: user._id,
      course: course._id,
      purchaseStatus: "COMPLETED",
    });
    if (alreadyPurchased) {
      throw new ApiError(400, "Course already purchased");
    }

    let finalAmount = course.basePrice.amount;
    let discount = 0;
    let couponData = null;

    // apply coupon if provided
    if (couponCode) {
      const result = await validateAndCalculateDiscount(
        couponCode,
        courseId,
        user._id,
      );
      finalAmount = result.finalPrice;
      discount = result.discount;
      couponData = {
        couponId: result.coupon._id,
        couponCode: result.coupon.code,
        discount: result.discount,
      };
    }

    const razorpay = ensureRazorpayConfig();
    const amountInPaise = Math.round(finalAmount * 100);

    let order;
    try {
      order = await razorpay.orders.create({
        amount: amountInPaise > 0 ? amountInPaise : 100, // Razorpay does not allow zero amount, set minimum 1 INR
        currency: course.basePrice.currency || "INR",
        receipt: `${course._id}_${Date.now()}`,
        notes: {
          courseTitle: course.title,
          userEmail: user.email,
          couponCode: couponCode || "",
        },
      });
    } catch (razorpayError) {
      const message =
        razorpayError?.error?.description ||
        razorpayError?.message ||
        "Payment service error";
      throw new ApiError(
        razorpayError?.statusCode === 400 ? 400 : 502,
        message,
      );
    }

    return res.status(200).json(
      new ApiResponse(200, {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        mrp: course.basePrice.amount,
        discount,
        coupon: couponData,
        course: {
          id: course._id,
          title: course.title,
          overview: course.overview,
        },
        user: {
          name: user.fullName,
          email: user.email,
          phone: user.phone,
        },
      }),
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amountPaid,
      couponCode,
    } = req.body;
    const user = req.user;
    const courseId = req.params.courseId;

    if (!user) {
      throw new ApiError(401, "Login required");
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, "Incomplete Razorpay payment payload");
    }

    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "Payment verification failed");
    }

    // ensure idempotency
    const existingPurchase = await Purchase.findOne({
      owner: user._id,
      course: course._id,
      orderId: razorpay_order_id,
    });
    if (existingPurchase) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { purchaseId: existingPurchase._id },
            "Already verified",
          ),
        );
    }

    // resolve coupon details
    let couponId = undefined;
    let netDiscount = 0;
    const mrp = course.basePrice.amount;

    if (couponCode) {
      const result = await validateAndCalculateDiscount(
        couponCode,
        courseId,
        user._id,
      );
      couponId = result.coupon._id;
      netDiscount = result.discount;

      // increment coupon usage
      await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
    }

    const totalAmountPaid = mrp - netDiscount;

    const purchase = await Purchase.create({
      owner: user._id,
      course: course._id,
      amountBreakdown: {
        currency: course.basePrice.currency,
        mrp,
        couponId,
        couponStatus: couponId ? "REDEEMED" : undefined,
        couponAppliedAt: couponId ? new Date() : undefined,
        netDiscount,
        totalAmountPaid,
      },
      orderId: razorpay_order_id,
      orderState: "paid",
      paymentId: razorpay_payment_id,
      paymentState: "captured",
      paymentMethod: "OTHER",
      purchaseStatus: "COMPLETED",
      purchasedAt: new Date(),
      razorpaySignature: razorpay_signature,
    });

    if (purchase.purchaseStatus === "COMPLETED") {
      purchase.invoiceNumber = purchase.generateInvoice();
      await purchase.save();
    }

    user.purchases.push(purchase);
    await user.save();

    const updatedUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );

    return res
      .status(201)
      .json(
        new ApiResponse(201, { purchaseId: purchase._id, user: updatedUser }),
      );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

// legacy placeholder if needed later
const purchaseCourse = asyncHandler(async (req, res) => {
  try {
    const { amountBreakdown, paymentStatus, paymentMethod, transactionId } =
      req.body;
    const courseId = req.params.courseId;
    if (paymentStatus !== "SUCCESS") {
      throw new ApiError(401, "Payment not successful");
    }

    const user = await User.findById(req.user._id);
    const course = await Course.findById(courseId);
    if (!user || !course) {
      throw new ApiError(
        404,
        "Service not found, User or Course not available",
      );
    }
    const purchase = await Purchase.create({
      owner: user,
      course: course,
      amountBreakdown: {
        currency: course.basePrice.currency,
        mrp: course.basePrice.amount,
        netDiscount: amountBreakdown.netDiscount,
        totalAmountPaid: amountBreakdown.totalAmountPaid,
      },
      paymentMethod: paymentMethod,
      purchaseStatus: "COMPLETED",
      purchasedAt: new Date(),
    });
    if (purchase.purchaseStatus === "COMPLETED") {
      purchase.invoiceNumber = purchase.generateInvoice();
      await purchase.save();
    }

    user.purchases.push(purchase);
    await user.save();

    const updatedUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );

    return res
      .status(201)
      .json(new ApiResponse(201, updatedUser, "Course Purchased Successfully"));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error?.message || "Something went wrong during purchase",
    );
  }
});

export { purchaseCourse, initiateRazorpayOrder, verifyRazorpayPayment };
