import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";

export const verifyJwt = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "unauthorized request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decodedToken?.role && decodedToken.role.includes("ADMIN")) {
      const admin = await Admin.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );

      if (!admin) {
        throw new ApiError(401, "Invalid Access Token");
      }

      req.admin = admin;
      next();
    } else {
      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );

      if (!user) {
        throw new ApiError(401, "Invalid Access Token");
      }

      req.user = user;
      next();
    }
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
