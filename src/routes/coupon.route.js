import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createCouponSchema,
  updateCouponSchema,
} from "../schemas/coupon.schema.js";
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAllCoupons,
  toggleCouponStatus,
} from "../controllers/coupon.controller.js";

const router = Router();

// All routes require admin auth
router
  .route("/create")
  .post(verifyJwt, validate(createCouponSchema), createCoupon);

router
  .route("/:couponId/update")
  .put(verifyJwt, validate(updateCouponSchema), updateCoupon);

router
  .route("/:couponId/delete")
  .delete(verifyJwt, deleteCoupon);

router
  .route("/all")
  .get(verifyJwt, getAllCoupons);

router
  .route("/:couponId/toggle-status")
  .put(verifyJwt, toggleCouponStatus);

export default router;
