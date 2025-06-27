import { Router } from "express";

const router = Router();

export default router;

// here course has already been created by the admin
// now we will deal with with adding any content or section in the course, this operation will be done by valid authorized admin
// will fetch complete course with its content and sections, this operation will be done by valid authorized user for consumption
// route should look like /user/course/courseId or /admin/course/courseId/operations, check how to achieve this
