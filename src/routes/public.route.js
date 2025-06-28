import { Router } from "express";
import {
  homePage,
  getAllCourses,
  getCourse,
} from "../controllers/public.controller.js";

const router = Router();

router.route("/").get(homePage);
router.route("/all-courses").get(getAllCourses);
router.route("/all-courses/:id").get(getCourse);

export default router;
