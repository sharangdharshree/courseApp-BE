import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  purchaseSchema,
  razorpayVerifySchema,
} from "../schemas/purchase.schema.js";
import {
  purchaseCourse,
  initiateRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/purchase.controller.js";
import { applyCoupon } from "../controllers/coupon.controller.js";
import { applyCouponSchema } from "../schemas/coupon.schema.js";

const router = Router();

// Apply coupon (preview discount)
router
  .route("/:courseId/apply-coupon")
  .post(verifyJwt, validate(applyCouponSchema), applyCoupon);

// Razorpay payment flow
router
  .route("/:courseId/initiate-order")
  .post(verifyJwt, initiateRazorpayOrder);
router
  .route("/:courseId/verify-payment")
  .post(verifyJwt, validate(razorpayVerifySchema), verifyRazorpayPayment);

// legacy / placeholder route
router
  .route("/:courseId/purchase-course")
  .post(verifyJwt, validate(purchaseSchema), purchaseCourse);

export default router;
