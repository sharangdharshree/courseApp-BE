import jwt from "jsonwebtoken";
import {
  registerSchema,
  loginSchema,
  userUpdateSchema,
  passwordChangeSchema,
} from "../schemas/user.schema.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Purchase from "../models/purchase.model.js";
import Course from "../models/course.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = asyncHandler(async (userId) => {
  try {
    const user = User.findById(userId);

    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();

    const accessToken = user.generateAccessToken();

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
});

const registerUser = asyncHandler(async (req, res) => {
  // validated with middleware in the route itself

  //take data
  const [fullName, email, password, phone, role] = req.body;

  // check if user already registered
  const existedUser = await User.findOne({
    $or: [{ email }, { phone }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or phone exists");
  }

  // create user object and store in db
  const user = await User.create({
    fullName: fullName,
    email: email,
    password: await bcrypt(password, 10),
    phone: phone,
    role: role,
  });

  // create response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the User");
  }
  //send response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //validated input with middleware in route

  //take data
  const [email, password] = req.body;

  // check if user exists
  const user = await User.findOne(email);
  if (!user) {
    throw new ApiError(401, "User not exist");
  }

  // check if password correct
  if (!user.isPasswordCorrect(password)) {
    throw new ApiError(401, "Wrong password");
  }

  // generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // create and send response and cookie
  const loggedInUser = await User.findById(user._id).select(
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
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // find and clear refresh token from user document
  await User.findByIdAndUpdate(
    req.user._id,
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
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    //verify refresh token
    const refreshToken = req.cookie.refreshToken;
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const options = {
      httpOnly: true,
      secure: true,
    };

    // check if send token matches with the DB token
    const user = User.findOne({ refreshToken: refreshToken });

    // if not matches, then signin expired, require signin to authenticate
    if (!user) {
      throw new ApiError(401, "Unauthorized access, signin required");
    }

    // if incoming token matches with db token, then generate fresh access token
    const freshAccessToken = user.generateAccessToken();
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

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(502, "Something went wrong while fetching user data");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, user, "User data successfully fetched"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(502, "Something went wrong while fetching user data");
    }
    if (!(await bcrypt.compare(oldPassword, user.password))) {
      throw new ApiError(401, "Incorrect Old Password");
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    const updatedUser = user.select("-password -refreshToken");
    return res
      .status(201)
      .json(
        new ApiResponse(201, { updatedUser }, "Password changed successfully")
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  try {
    const fullName = req.body.fullName;
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(502, "Something went wrong while fetching user data");
    }
    user.fullName = fullName;
    await user.save();
    const updatedUser = user.select("-password -refreshToken");
    return res
      .status(201)
      .json(new ApiResponse(201, updatedUser, "Account update successful"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const purchaseCourse = asyncHandler(async (req, res) => {
  try {
    const [
      amountBreakdown,
      paymentStatus,
      paymentMethod,
      transactionId,
      courseId,
    ] = req.body;
    if (paymentStatus !== "SUCCESS") {
      throw new ApiError(401, "Payment not successful");
    }
    const user = await User.findById(req.user._id);
    const course = await Course.findById(courseId);
    if (!user || !course) {
      throw new ApiError(
        404,
        "Service not found, User or Course not available"
      );
    }
    const purchase = await Purchase.create({
      owner: user,
      course: course,
      amountBreakdown: {
        currency: amountBreakdown.currency,
        mrp: amountBreakdown.mrp,
        netDiscount: amountBreakdown.netDiscount,
        couponUsed: amountBreakdown.couponUsed,
        totalAmountPaid: amountBreakdown.totalAmountPaid,
      },
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod,
      transactionId: transactionId,
      purchaseStatus: "COMPLETED",
      purchasedAt: new Date(),
    });
    purchase.invoiceNumber = purchase.generateInvoice();
    await purchase.save();

    // adding purchased coursed to users db
    user.purchases.push(purchase);
    await user.save();

    const updatedUser = user.select("-password -refreshToken");

    return res
      .status(201)
      .json(new ApiResponse(201, updatedUser, "Course Purchased Successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong during purchase"
    );
  }
});

const getAllPurchasedCourse = asyncHandler(async (req, res) => {
  try {
    const user = User.findById(req.user._id);
    if (!user) {
      throw new ApiError(401, "User not found");
    }
    const purchases = user.purchases;
    const purchasedCourses = [];
    for (let i = 0; i < purchases.length; i++) {
      purchasedCourses.push(await Purchase.findOne(purchases[i]).course);
    }
    return res.status(
      202,
      { purchasedCourses },
      "Purchased courses fetched successfully"
    );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  purchaseCourse,
  getAllPurchasedCourse,
};
