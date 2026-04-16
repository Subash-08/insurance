import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Valid Indian mobile required"),
  email: z.string().email().optional().or(z.literal("")),
  pan: z.string().optional(),
  aadhaar: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  rememberDevice: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true').default(false)
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters").trim(),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters").refine((val) => {
    return /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val);
  }, "Password must be at least 8 characters with uppercase, lowercase, and a number"),
  confirmPassword: z.string(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit Indian mobile number").optional().or(z.literal("")),
  designation: z.string().max(50, "Designation cannot exceed 50 characters").optional().or(z.literal(""))
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format")
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").refine((val) => {
    return /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val);
  }, "Password must be at least 8 characters with uppercase, lowercase, and a number"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});
