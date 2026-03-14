import { z } from "zod/v4";

const createCouponSchema = z.object({
  code: z.string().trim().min(3).max(20),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().positive(),
  minOrderValue: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  applicableOn: z.enum(["ALL", "CATEGORY", "COURSE"]).optional(),
  applicableCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
});

const updateCouponSchema = z.object({
  discountType: z.enum(["PERCENT", "FIXED"]).optional(),
  discountValue: z.number().positive().optional(),
  minOrderValue: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  applicableOn: z.enum(["ALL", "CATEGORY", "COURSE"]).optional(),
  applicableCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
});

const applyCouponSchema = z.object({
  code: z.string().trim().min(1),
});

export { createCouponSchema, updateCouponSchema, applyCouponSchema };
