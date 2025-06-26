import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  purchaseCourse,
  getAllPurchasedCourse,
} from "../controllers/user.controller.js";

import { validate } from "../middlewares/validate.middleware.js";
import {
  loginSchema,
  registerSchema,
  passwordChangeSchema,
  userUpdateSchema,
} from "../schemas/user.schema.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(validate(registerSchema), registerUser);

router.route("/login").post(validate(loginSchema), loginUser);

router.route("/logout").post(verifyJwt, logoutUser);

router.route("/current-user").get(verifyJwt, getCurrentUser);

router.route("/refresh-token").post(verifyJwt, refreshAccessToken);

router
  .route("/change-password")
  .put(verifyJwt, validate(passwordChangeSchema), changeCurrentPassword);

router
  .route("/update-account")
  .put(verifyJwt, validate(userUpdateSchema), updateAccountDetails);

router.route("purchase-course").post(verifyJwt, purchaseCourse);

router.route("/purchased-courses").get(verifyJwt, getAllPurchasedCourse);

export default router;
