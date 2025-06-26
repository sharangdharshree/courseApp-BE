import Course from "../models/course.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const homePage = asyncHandler(async (req, res) => {
  res.send("Hello there, from Home Page!!");
});

const getAllCourses = asyncHandler(async (req, res) => {
  try {
    const courses = await Course.find().select(
      "-createdBy -description -sections -category"
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
    const courseId = req.body?.courseId;
    if (!courseId) {
      throw new ApiError(401, "Send valid courseId");
    }
    const course = await Course.findOne({ courseId }).select("-sections");
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
