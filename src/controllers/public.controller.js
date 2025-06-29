import { Course } from "../models/course.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const homePage = asyncHandler(async (req, res) => {
  res.send("Hello there, from Home Page!!");
});

const getAllCourses = asyncHandler(async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).select(
      "-createdBy -description -sections"
    );

    return res
      .status(200)
      .json(new ApiResponse(200, courses, "All courses fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const getCourse = asyncHandler(async (req, res) => {
  try {
    const courseId = req.params.courseId;
    if (!courseId) {
      throw new ApiError(401, "Send valid courseId");
    }
    const course = await Course.findById(courseId).select("-sections");
    if (!course) {
      throw new ApiError(404, "Course not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, course, "Course fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

export { homePage, getAllCourses, getCourse };
