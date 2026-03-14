import Coupon from "../models/coupon.model.js";
import { Course } from "../models/course.model.js";
import Purchase from "../models/purchase.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ---- Admin CRUD ----

const createCoupon = asyncHandler(async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new ApiError(403, "Admin access required");
    }

    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      applicableOn,
      applicableCategories,
      applicableProducts,
    } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      throw new ApiError(409, "Coupon code already exists");
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      usageLimit,
      perUserLimit,
      applicableOn,
      applicableCategories,
      applicableProducts,
      createdBy: admin._id,
      status: "ACTIVE",
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { coupon }, "Coupon created successfully"));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const updateCoupon = asyncHandler(async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new ApiError(403, "Admin access required");
    }

    const coupon = await Coupon.findById(req.params.couponId);
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }
    if (!coupon.createdBy.equals(admin._id)) {
      throw new ApiError(403, "You don't have permission for this coupon");
    }

    const allowedFields = [
      "discountType",
      "discountValue",
      "minOrderValue",
      "maxDiscount",
      "startDate",
      "endDate",
      "usageLimit",
      "perUserLimit",
      "applicableOn",
      "applicableCategories",
      "applicableProducts",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        coupon[field] =
          field === "startDate" || field === "endDate"
            ? new Date(req.body[field])
            : req.body[field];
      }
    }

    const updatedCoupon = await coupon.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, { coupon: updatedCoupon }, "Coupon updated successfully")
      );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const deleteCoupon = asyncHandler(async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new ApiError(403, "Admin access required");
    }

    const coupon = await Coupon.findById(req.params.couponId);
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }
    if (!coupon.createdBy.equals(admin._id)) {
      throw new ApiError(403, "You don't have permission for this coupon");
    }

    await coupon.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Coupon deleted successfully"));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const getAllCoupons = asyncHandler(async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new ApiError(403, "Admin access required");
    }

    const coupons = await Coupon.find({ createdBy: admin._id });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { coupons }, "Coupons fetched successfully")
      );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const toggleCouponStatus = asyncHandler(async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new ApiError(403, "Admin access required");
    }

    const coupon = await Coupon.findById(req.params.couponId);
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }
    if (!coupon.createdBy.equals(admin._id)) {
      throw new ApiError(403, "You don't have permission for this coupon");
    }

    coupon.status = coupon.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const updatedCoupon = await coupon.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { coupon: updatedCoupon },
          `Coupon ${updatedCoupon.status === "ACTIVE" ? "activated" : "disabled"}`
        )
      );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

// ---- User: Apply Coupon (preview discount, no DB mutation) ----

const validateAndCalculateDiscount = async (code, courseId, userId) => {
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    status: "ACTIVE",
  });
  if (!coupon) {
    throw new ApiError(404, "Invalid or inactive coupon code");
  }

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    throw new ApiError(400, "Coupon has expired or is not yet active");
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit reached");
  }

  if (coupon.perUserLimit) {
    const userUsageCount = await Purchase.countDocuments({
      owner: userId,
      "amountBreakdown.couponId": coupon._id,
      purchaseStatus: "COMPLETED",
    });
    if (userUsageCount >= coupon.perUserLimit) {
      throw new ApiError(400, "You have already used this coupon the maximum number of times");
    }
  }

  const course = await Course.findById(courseId);
  if (!course || !course.isPublished) {
    throw new ApiError(404, "Course not available");
  }

  if (coupon.applicableOn === "COURSE") {
    const isApplicable = coupon.applicableProducts.some((pid) =>
      pid.equals(course._id)
    );
    if (!isApplicable) {
      throw new ApiError(400, "Coupon is not applicable to this course");
    }
  } else if (coupon.applicableOn === "CATEGORY") {
    if (!coupon.applicableCategories.includes(course.category)) {
      throw new ApiError(400, "Coupon is not applicable to this category");
    }
  }

  const mrp = course.basePrice.amount;

  if (coupon.minOrderValue && mrp < coupon.minOrderValue) {
    throw new ApiError(
      400,
      `Minimum order value of ${coupon.minOrderValue} required`
    );
  }

  let discount = 0;
  if (coupon.discountType === "PERCENT") {
    discount = Math.round((mrp * coupon.discountValue) / 100);
    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = coupon.discountValue;
  }

  discount = Math.min(discount, mrp);

  return { coupon, course, mrp, discount, finalPrice: mrp - discount };
};

const applyCoupon = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      throw new ApiError(401, "Login required");
    }

    const { code } = req.body;
    const courseId = req.params.courseId;

    const { coupon, mrp, discount, finalPrice } =
      await validateAndCalculateDiscount(code, courseId, user._id);

    return res.status(200).json(
      new ApiResponse(200, {
        couponCode: coupon.code,
        couponId: coupon._id,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        mrp,
        discount,
        finalPrice,
      }, "Coupon applied successfully")
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

export {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAllCoupons,
  toggleCouponStatus,
  applyCoupon,
  validateAndCalculateDiscount,
};
