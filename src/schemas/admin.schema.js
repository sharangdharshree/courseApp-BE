import { z } from "zod/v4";

const registerSchema = z.object({
  email: z.email().trim().toLowerCase(),
  fullName: z.string().trim().toLowerCase().min(2),
  password: z
    .string()
    .min(6)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()])$/),
  phone: z.number().gte(1000000000).lte(9999999999).nonnegative(),
  role: z.string().trim().min(4).max(5).toUpperCase(),
});
const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(6),
});
const adminUpdateSchema = z.object({
  fullName: z.string().trim().toLowerCase().min(2),
});
const passwordChangeSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z
    .string()
    .min(6)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()])$/),
});

export { registerSchema, loginSchema, adminUpdateSchema, passwordChangeSchema };
