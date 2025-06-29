import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getCourse,
  addSection,
  updateSection,
  deleteSection,
  addContent,
  updateContent,
  deleteContent,
} from "../controllers/course.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { sectionSchema, contentSchema } from "../schemas/course.schema.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// routes for user
// get course contents
router.route("/:courseId/learn").get(verifyJwt, getCourse);

// routes for admin
// add section, update section, delete section, add content, update content, delete content

// course dashboard, fetch all course records for admin
router.route("/:courseId/dashboard").get(verifyJwt, getCourse);
router
  .route("/:courseId/add-section")
  .post(verifyJwt, validate(sectionSchema), addSection);
router
  .route("/:courseId/:sectionId/update-section")
  .put(verifyJwt, validate(sectionSchema), updateSection);
router
  .route("/:courseId/:sectionId/delete-section")
  .delete(verifyJwt, deleteSection);

router
  .route("/:courseId/:sectionId/add-content")
  .post(
    verifyJwt,
    upload.single("content"),
    validate(contentSchema),
    addContent
  );
router
  .route("/:courseId/:sectionId/:contentId/update-content")
  .put(
    verifyJwt,
    upload.single("content"),
    validate(contentSchema),
    updateContent
  );
router
  .route("/:courseId/:sectionId/:contentId/delete-content")
  .delete(verifyJwt, deleteContent);

export default router;
