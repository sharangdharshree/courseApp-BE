import { z } from "zod/v4";

const courseSchema = z.object({
  title: z.string().trim(),
  overview: z.string().trim(),
  description: z.string().trim(),
  category: z.string(),
});

const sectionSchema = z.object({
  title: z.string().trim(),
  description: z.string().trim(),
});

const priceSchema = z.object({
  amount: z.number().gte(0).nonnegative(),
});

const contentSchema = z.object({
  title: z.string().trim(),
});

export { courseSchema, sectionSchema, priceSchema, contentSchema };
