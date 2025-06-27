import { overwrite, z } from "zod/v4";

const courseSchema = z.object({
  title: z.string().trim(),
  overview: z.string().trim(),
  description: z.string().trim(),
  category: z.string(),
});

const sectionSchema = z.object();

const priceSchema = z.object({
  amount: z.number().gte(1).nonnegative(),
});

const contentSchema = z.object();

export { courseSchema, sectionSchema, priceSchema, contentSchema };
