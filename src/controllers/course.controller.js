// will deal with access of course with its full contents, only authorized user can be able to access
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import Course from "../models/course.model.js";

const getCourse = asyncHandler(async (req, res) => {});

const addSection = asyncHandler(async (req, res) => {});
const updateSection = asyncHandler(async (req, res) => {});
const deleteSection = asyncHandler(async (req, res) => {});
const addContent = asyncHandler(async (req, res) => {});
const updateContent = asyncHandler(async (req, res) => {});
const deleteContent = asyncHandler(async (req, res) => {});

export {
  getCourse,
  addSection,
  updateSection,
  deleteSection,
  addContent,
  updateContent,
  deleteContent,
};
