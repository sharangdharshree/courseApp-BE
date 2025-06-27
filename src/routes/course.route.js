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
} from "../controllers/course.controller";
import { validate } from "../middlewares/validate.middleware.js";
import { sectionSchema, contentSchema } from "../schemas/course.schema.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// routes for user
// get course contents
router.route("/:id/learn").get(verifyJwt, getCourse);

// routes for admin
// add section, update section, delete section, add content, update content, delete content
router
  .route("/:id/add-section")
  .post(verifyJwt, validate(sectionSchema), addSection);
router
  .route("/:id/update-section")
  .put(verifyJwt, validate(sectionSchema), updateSection);
router.route("/:id/delete-section").delete(verifyJwt, deleteSection);

router
  .route("/:id/add-content")
  .post(verifyJwt, validate(contentSchema), addContent);
router
  .route("/:id/update-content")
  .put(verifyJwt, validate(contentSchema), updateContent);
router.route("/:id/delete-content").delete(verifyJwt, deleteContent);

export default router;
