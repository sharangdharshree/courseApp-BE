import bcrypt from "bcrypt";
import Admin from "../models/admin.model.js";
import Course from "../models/course.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = asyncHandler(async (adminId) => {
  try {
    const admin = Admin.findById(adminId);

    const refreshToken = admin.generateRefreshToken();
    admin.refreshToken = refreshToken;
    await admin.save();

    const accessToken = admin.generateAccessToken();

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
});

const registerAdmin = asyncHandler(async (req, res) => {
  // validated with middleware in the route itself

  //take data
  const [fullName, email, password, phone] = req.body;

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
    password: await bcrypt(password, 10),
    phone: phone,
  });

  // create response
  const createdAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );
  if (!createdAdmin) {
    throw new ApiError(500, "Something went wrong while registering the admin");
  }
  //send response
  return res
    .status(201)
    .json(new ApiResponse(200, createdAdmin, "Admin registered successfully"));
});

const loginAdmin = asyncHandler(async (req, res) => {
  //validated input with middleware in route

  //take data
  const [email, password] = req.body;

  // check if admin exists
  const admin = await Admin.findOne(email);
  if (!admin) {
    throw new ApiError(401, "admin not exist");
  }

  // check if password correct
  if (!admin.isPasswordCorrect(password)) {
    throw new ApiError(401, "Wrong password");
  }

  // generate access and refresh tokens
  const { accessToken, refreshToken } = generateAccessAndRefreshTokens(
    admin._id
  );

  // create and send response and cookie
  const loggedInAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
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
});

const logoutAdmin = asyncHandler(async (req, res) => {
  // find and clear refresh token from admin document
  await Admin.findByIdAndUpdate(
    req.admin._id,
    {
      $set: {
        refreshToken: undefined,
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
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "admin logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    //verify refresh token
    const refreshToken = req.cookie?.refreshToken;
    if (!refreshToken) {
      throw new ApiError(401, "Send valid refresh token");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };

    // check if send token matches with the DB token
    const admin = Admin.findOne({ refreshToken: refreshToken });

    // if not matches, then signin expired, require signin to authenticate
    if (!admin) {
      throw new ApiError(401, "Unauthorized access, signin required");
    }

    // if incoming token matches with db token, then generate fresh access token
    const freshAccessToken = admin.generateAccessToken();
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
  const admin = req.admin;
  if (!admin) {
    throw new ApiError(502, "Something went wrong while fetching admin data");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, { admin }, "admin data successfully fetched"));
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
    const updatedAdmin = admin.select("-password -refreshToken");
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
    const updatedAdmin = admin.select("-password -refreshToken");
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
      thumbnail: thumbnail.url,
      category: category,
    });

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
    const course = await Course.findById(req.body.courseId);
    if (!course) {
      throw new ApiError(401, "Course not found");
    }

    // if admin has the authorization for this operation on this course
    if (course.createdBy !== admin) {
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
    const course = await Course.findById(req.body.courseId);
    if (!course) {
      throw new ApiError(401, "Course not found");
    }

    // if admin has the authorization for this operation on this course
    if (course.createdBy !== admin) {
      throw new ApiError(401, "You don't have permission for this course");
    }

    // check for local path of new thumbnail
    const thumbnailLocalPath = req.file?.path;
    if (!thumbnailLocalPath) {
      throw new ApiError(400, "Thumbnail file not found");
    }

    // upload on cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail.url) {
      throw new ApiError(400, "Thumbnail upload failed");
    }

    // set new thumbnail for course
    course.thumbnail = thumbnail.url;
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
    const course = await Course.findById(req.body.courseId);
    if (!course) {
      throw new ApiError(401, "Course not found");
    }

    // if admin has the authorization for this operation on this course
    if (course.createdBy !== admin) {
      throw new ApiError(401, "You don't have permission for this course");
    }

    // delete course
    const deletedCourse = await course.remove();

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
    const course = await Course.findById(req.body.courseId);
    if (!course) {
      throw new ApiError(401, "Course not found");
    }

    // if admin has the authorization for this operation on this course
    if (course.createdBy !== admin) {
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
    const course = await Course.findById(req.body.courseId);
    if (!course) {
      throw new ApiError(401, "Course not found");
    }

    // if admin has the authorization for this operation on this course
    if (course.createdBy !== admin) {
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
    const courses = await Course.find({ createdBy: admin });
    return res
      .status(200)
      .json(200, { courses }, "All courses fetched successfully");
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
