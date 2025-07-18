import bcrypt from "bcrypt";
import Admin from "../models/admin.model.js";
import { Content, Course, Section } from "../models/course.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId);

    const refreshToken = admin.generateRefreshToken();
    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    const accessToken = await admin.generateAccessToken();

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerAdmin = asyncHandler(async (req, res) => {
  try {
    // check if not already logged in
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      throw new ApiError(401, "Already logged in, logout first");
    }

    // validated with middleware in the route itself
    //take data
    const { fullName, email, password, phone } = req.body;

    // check if admin already registered
    const existedAdmin = await Admin.findOne({
      $or: [{ email }, { phone }],
    });
    if (existedAdmin) {
      throw new ApiError(409, "Admin with email or phone exists");
    }

    // create admin object and store in db
    const admin = await Admin.create({
      fullName: fullName,
      email: email,
      password: await bcrypt.hash(password, 10),
      phone: phone,
    });

    // create response
    const createdAdmin = await Admin.findById(admin._id).select(
      "-password -refreshToken"
    );
    if (!createdAdmin) {
      throw new ApiError(
        500,
        "Something went wrong while registering the admin"
      );
    }
    //send response
    return res
      .status(201)
      .json(
        new ApiResponse(200, createdAdmin, "Admin registered successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while registering the admin"
    );
  }
});

const loginAdmin = asyncHandler(async (req, res) => {
  try {
    // check if not already logged in
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      throw new ApiError(401, "Already logged in, logout first");
    }

    //validated input with middleware in route
    //take data
    const { email, password } = req.body;

    // check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      throw new ApiError(401, "admin not exist");
    }

    // check if password correct
    const isPasswordValid = await admin.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Wrong password");
    }

    // generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      admin._id
    );

    // create and send response and cookie
    const loggedInAdmin = await Admin.findById(admin._id).select(
      "-password -refreshToken"
    );
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            admin: loggedInAdmin,
            accessToken,
            refreshToken,
          },
          "admin logged in successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong at login");
  }
});

const logoutAdmin = asyncHandler(async (req, res) => {
  try {
    // find and clear refresh token from admin document
    await Admin.findByIdAndUpdate(
      req.admin._id,
      {
        $set: {
          refreshToken: "",
        },
      },
      {
        new: true,
      }
    );

    // clear cookies and send response
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "admin logged out successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while logging out"
    );
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    //verify refresh token
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new ApiError(401, "Send valid refresh token");
    }
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    // check if send token matches with the DB token
    const admin = await Admin.findOne({ refreshToken: refreshToken });

    // if not matches, then signin expired, require signin to authenticate
    if (!admin) {
      throw new ApiError(401, "Unauthorized access, signin required");
    }

    // if incoming token matches with db token, then generate fresh access token
    const freshAccessToken = await admin.generateAccessToken();
    return res
      .status(200)
      .cookie("accessToken", freshAccessToken, options)
      .json(
        new ApiResponse(
          201,
          { accessToken: freshAccessToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const getCurrentAdmin = asyncHandler(async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new ApiError(502, "Something went wrong while fetching admin data");
    }
    return res
      .status(201)
      .json(new ApiResponse(201, admin, "admin data successfully fetched"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while fetching admin detail"
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      throw new ApiError(502, "Something went wrong while fetching admin data");
    }
    if (!(await bcrypt.compare(oldPassword, admin.password))) {
      throw new ApiError(401, "Incorrect Old Password");
    }
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    const updatedAdmin = await Admin.findById(admin._id).select(
      "-password -refreshToken"
    );
    return res
      .status(201)
      .json(
        new ApiResponse(201, { updatedAdmin }, "Password changed successfully")
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  try {
    const fullName = req.body.fullName;
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      throw new ApiError(502, "Something went wrong while fetching admin data");
    }
    admin.fullName = fullName;
    await admin.save();
    const updatedAdmin = await Admin.findById(admin._id).select(
      "-password -refreshToken"
    );
    return res
      .status(201)
      .json(new ApiResponse(201, updatedAdmin, "Account update successful"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const createCourse = asyncHandler(async (req, res) => {
  try {
    // take validated admin
    const admin = req.admin;

    // take validated details of course
    const { title, overview, description, category } = req.body;

    // take thumbnail local path from multer
    const thumbnailLocalPath = req.file?.path;
    if (!thumbnailLocalPath) {
      throw new ApiError(400, "Thumbnail file is missing");
    }

    // upload thumbnail from local path to cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail.url) {
      throw new ApiError(401, "Thumbnail upload fail");
    }

    // create course
    const course = await Course.create({
      createdBy: admin,
      title: title,
      overview: overview,
      description: description,
      thumbnail: {
        url: thumbnail.url,
        publicId: thumbnail.public_id,
      },
      category: category,
    });

    // add course to admin
    admin.courses.push(course._id);
    await admin.save();

    //send response
    return res
      .status(201)
      .json(new ApiResponse(201, { course }, "Course created successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const updateCourse = asyncHandler(async (req, res) => {
  try {
    // take validated admin
    const admin = req.admin;

    // take validated data
    const { title, overview, description, category } = req.body;

    // check if course valid

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      throw new ApiError(401, "Course not found");
    }

    // if admin has the authorization for this operation on this course
    if (!course.createdBy.equals(admin._id)) {
      throw new ApiError(401, "You don't have permission for this course");
    }

    // make changes
    course.title = title;
    course.overview = overview;
    course.description = description;
    course.category = category;
    const updatedCourse = await course.save();

    // send response
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { updatedCourse },
          "Course details updated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const changeThumbnail = asyncHandler(async (req, res) => {
  try {
    // take validated admin
    const admin = req.admin;

    // check if course valid
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      throw new ApiError(401, "Course not found");
    }

    // if admin has the authorization for this operation on this course
    if (!course.createdBy.equals(admin._id)) {
      throw new ApiError(401, "You don't have permission for this course");
    }

    // check for local path of new thumbnail
    const thumbnailLocalPath = req.file?.path;
    if (!thumbnailLocalPath) {
      throw new ApiError(400, "Thumbnail file not found");
    }

    // upload new thumbnail on cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail.url) {
      throw new ApiError(400, "Thumbnail upload failed");
    }

    // delete old thumbnail
    await deleteFromCloudinary(course.thumbnail.publicId);

    // set new thumbnail for course
    course.thumbnail.url = thumbnail.url;
    course.thumbnail.publicId = thumbnail.public_id;
    const updatedCourse = await course.save();

    // send response
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { updatedCourse },
          "Thumbnail updated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const deleteCourse = asyncHandler(async (req, res) => {
  try {
    // take validated admin
    const admin = req.admin;

    // check if course valid
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      throw new ApiError(401, "Course not found");
    }

    // if admin has the authorization for this operation on this course
    if (!course.createdBy.equals(admin._id)) {
      throw new ApiError(401, "You don't have permission for this course");
    }

    //delete all sections, all content, all cloudinary files then delete course
    for (let i = 0; i < course.sections.length; i++) {
      const section = await Section.findById(course.sections[i]);
      for (let j = 0; j < section.contents.length; j++) {
        const content = await Content.findById(section.contents[i]);
        // one by one deletion from cloudinary
        await deleteFromCloudinary(content.publicId);
        // one by one deletion from Content Schema
        const deletedContent = await content.deleteOne();
        if (!deletedContent) {
          throw new ApiError(400, "Not able to delete contents");
        }
      }
      // one by one deletion from Section Schema
      const deletedSection = await section.deleteOne();
      if (!deletedSection) {
        throw new ApiError(400, "Not able to delete contents");
      }
    }

    // delete course
    const indexOfDeleted = admin.courses.findIndex(
      (course) => course === course._id
    );
    if (indexOfDeleted == -1) {
      throw new ApiError(400, "Something went wrong while delete operation");
    }
    const deletedCourse = await course.deleteOne();

    // remove reference from admin
    admin.courses.splice(indexOfDeleted, 1);
    await admin.save();

    // send response
    return res
      .status(201)
      .json(
        new ApiResponse(201, { deletedCourse }, "Course delete successful")
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const setCoursePrice = asyncHandler(async (req, res) => {
  try {
    // take validated admin
    const admin = req.admin;

    // check if course valid
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      throw new ApiError(401, "Course not found");
    }

    // if admin has the authorization for this operation on this course
    if (!course.createdBy.equals(admin._id)) {
      throw new ApiError(401, "You don't have permission for this course");
    }

    // take validated data
    const amount = req.body?.amount;

    // set price
    course.basePrice.amount = amount;
    const updatedCourse = await course.save();

    // send response
    return res
      .status(201)
      .json(
        new ApiResponse(201, { updatedCourse }, "New price set successfully")
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const publishCourse = asyncHandler(async (req, res) => {
  try {
    // take validated admin
    const admin = req.admin;

    // check if course valid
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      throw new ApiError(401, "Course not found");
    }

    // if admin has the authorization for this operation on this course
    if (!course.createdBy.equals(admin._id)) {
      throw new ApiError(401, "You don't have permission for this course");
    }

    // toggle isPublished flag
    course.isPublished = !course.isPublished;
    const updatedCourse = await course.save();

    //send response
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { updatedCourse },
          `Publish flag set to: ${updatedCourse.isPublished}`
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const getAllCreatedCourse = asyncHandler(async (req, res) => {
  try {
    const admin = req.admin;

    const courses = await Course.find({ createdBy: admin._id });
    return res
      .status(200)
      .json(
        new ApiResponse(200, { courses }, "All Courses fetched successfully")
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

export {
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
  setCoursePrice,
  publishCourse,
  getAllCreatedCourse,
};
