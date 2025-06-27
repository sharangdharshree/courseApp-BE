import { Router } from "express";
import {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  getCurrentAdmin,
  changeCurrentPassword,
  updateAccountDetails,
  createCourse,
  updateCourse,
  changeThumbnail,
  deleteCourse,
  getAllCreatedCourse,
  setCoursePrice,
  publishCourse,
} from "../controllers/admin.controller.js";

import { validate } from "../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  adminUpdateSchema,
  passwordChangeSchema,
} from "../schemas/admin.schema.js";
import {
  courseSchema,
  sectionSchema,
  priceSchema,
  contentSchema,
} from "../schemas/course.schema.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(validate(registerSchema), registerAdmin);

router.route("/login").post(validate(loginSchema), loginAdmin);

router.route("/logout").post(verifyJwt, logoutAdmin);

router.route("/current-admin").get(verifyJwt, getCurrentAdmin);

router.route("/refresh-token").post(verifyJwt, refreshAccessToken);

router
  .route("/change-password")
  .put(verifyJwt, validate(passwordChangeSchema), changeCurrentPassword);

router
  .route("/update-account")
  .put(verifyJwt, validate(adminUpdateSchema), updateAccountDetails);

router
  .route("/create-course")
  .post(
    verifyJwt,
    validate(courseSchema),
    upload.single("thumbnail"),
    createCourse
  );

router
  .route("/update-course")
  .put(verifyJwt, validate(courseSchema), updateCourse);

router
  .route("/change-thumbnail")
  .put(verifyJwt, upload.single("thumbnail"), changeThumbnail);

router.route("/delete-course").delete(verifyJwt, deleteCourse);

router
  .route("/set-price")
  .put(verifyJwt, validate(priceSchema), setCoursePrice);

router.route("/publish").put(verifyJwt, publishCourse);

router.route("created-courses").get(verifyJwt, getAllCreatedCourse);

export default router;
