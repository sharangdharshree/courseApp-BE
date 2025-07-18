import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Purchase from "../models/purchase.model.js";
import { Course } from "../models/course.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const accessToken = await user.generateAccessToken();

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
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

    // check if user already registered
    const existedUser = await User.findOne({
      $or: [{ email }, { phone }],
    });
    if (existedUser) {
      throw new ApiError(409, "User with this email or phone already exists");
    }

    // create user object and store in db
    const user = await User.create({
      fullName: fullName,
      email: email,
      password: await bcrypt.hash(password, 10),
      phone: phone,
    });

    // create response
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the User"
      );
    }
    //send response
    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while registering the user"
    );
  }
});

const loginUser = asyncHandler(async (req, res) => {
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

    // check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, "User not exist");
    }

    // check if password correct
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
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
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged in successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong at login");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    // find and clear refresh token from user document
    await User.findByIdAndUpdate(
      req.user._id,
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
      .json(new ApiResponse(200, {}, "User logged out successfully"));
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

    // check if received token matches with the DB token
    // if not matches, then signin expired, require signin to authenticate
    const user = await User.findOne({ refreshToken: refreshToken });
    if (!user) {
      throw new ApiError(401, "Unauthorized access, signin required");
    }

    // if incoming token matches with db token, then generate fresh access token
    const freshAccessToken = await user.generateAccessToken();
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
  try {
    const user = req.user;
    if (!user) {
      throw new ApiError(502, "Something went wrong while fetching user data");
    }
    return res
      .status(201)
      .json(new ApiResponse(201, user, "User data successfully fetched"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while fetching user detail"
    );
  }
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
    const updatedUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
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
    const updatedUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    return res
      .status(201)
      .json(new ApiResponse(201, updatedUser, "Account update successful"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const purchaseCourse = asyncHandler(async (req, res) => {
  try {
    const { amountBreakdown, paymentStatus, paymentMethod, transactionId } =
      req.body;
    const courseId = req.params.courseId;
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
        currency: course.basePrice.currency,
        mrp: course.basePrice.amount,
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
    if (purchase.paymentStatus === "COMPLETED") {
      purchase.invoiceNumber = purchase.generateInvoice();
      await purchase.save();
    }

    // adding purchased coursed to users db
    user.purchases.push(purchase);
    await user.save();

    const updatedUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

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
    const user = await User.findById(req.user._id)
      .populate({ path: "purchases" })
      .select("-password -refreshToken");
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    return res
      .status(202)
      .json(
        new ApiResponse(
          200,
          user.purchases,
          "all user's purchases fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while fetching purchased courses"
    );
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
