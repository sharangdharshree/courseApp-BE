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
      "-createdBy -description -sections",
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
    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
    });
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    const syllabus = course.sections.map((section) => ({
      title: section.title,
      description: section?.description,
      contentCount: section.contents?.length,
    }));

    const courseData = {
      _id: course._id,
      title: course.title,
      overview: course.overview,
      description: course.description,
      thumbnail: course.thumbnail,
      category: course.category,
      basePrice: course.basePrice,
      createdBy: course.createdBy,
      isPublished: course.isPublished,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      sections: syllabus,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, courseData, "Course fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

export { homePage, getAllCourses, getCourse };
