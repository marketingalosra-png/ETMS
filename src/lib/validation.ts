import { z } from "zod";

const optionalUrl = z
  .union([z.string().url(), z.literal(""), z.null(), z.undefined()])
  .transform((value) => (value === "" ? null : value));

const optionalText = z
  .string()
  .nullish()
  .transform((value) => (value === "" ? null : value));

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  identifier: z.string().min(1, "Employee ID, username, or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ---------------------------------------------------------------------------
// Employee — required: fullName, employeeCode, email
// ---------------------------------------------------------------------------

export const employeeSchema = z.object({
  fullName: z
    .string()
    .min(2, "Please enter the employee's full name (min 2 characters)"),
  employeeCode: z
    .string()
    .min(2, "Please enter a unique employee ID (e.g. EMP-1001)"),
  email: z.string().email("Please provide a valid email address"),
  departmentId: z.string().optional().nullable(),
  jobTitle: z
    .string()
    .nullish()
    .transform((v) => (v === "" ? null : v)),
  manager: optionalText,
  phone: optionalText,
  nationalId: optionalText,
  joiningDate: z.coerce.date().optional().nullable(),
  birthDate: z.coerce.date().optional().nullable(),
  gender: z
    .enum(["FEMALE", "MALE", "OTHER", "UNDISCLOSED"])
    .default("UNDISCLOSED"),
  address: optionalText,
  emergencyContact: optionalText,
  notes: optionalText,
  photoUrl: optionalUrl,
  status: z.enum(["ACTIVE", "INACTIVE", "DEACTIVATED"]).default("ACTIVE"),
});

// ---------------------------------------------------------------------------
// Training
// ---------------------------------------------------------------------------

export const trainingSchema = z.object({
  title: z
    .string()
    .min(3, "Training title is required (min 3 characters)"),
  description: z
    .string()
    .min(10, "Please provide a description (min 10 characters)"),
  category: z
    .string()
    .min(2, "Please enter a category (e.g. Safety, HR, Technical)"),
  difficulty: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .default("BEGINNER"),
  estimatedMinutes: z.coerce
    .number()
    .min(1, "Please enter the estimated duration in minutes (e.g. 30)"),
  dueDate: z.coerce.date().optional().nullable(),
  thumbnailUrl: optionalUrl,
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: z
    .enum(["DRAFT", "PUBLISHED", "ARCHIVED"])
    .default("PUBLISHED"),
  tags: z.array(z.string()).default([]),
  completionCriteria: z
    .enum(["WATCH_95_PERCENT", "OPEN_ALL_ASSETS", "PASS_ACKNOWLEDGEMENT"])
    .default("PASS_ACKNOWLEDGEMENT"),
});

// ---------------------------------------------------------------------------
// Assignment
// ---------------------------------------------------------------------------

export const assignmentSchema = z.object({
  trainingIds: z
    .array(z.string())
    .min(1, "Please select at least one training"),
  employeeIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
  everyone: z.boolean().default(false),
  dueDate: z.coerce.date().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Progress tracking
// ---------------------------------------------------------------------------

export const progressSchema = z.object({
  assignmentId: z.string(),
  assetId: z.string(),
  lastSecond: z.coerce.number().min(0),
  watchedSeconds: z.coerce.number().min(0),
  durationSeconds: z.coerce.number().min(1),
  pausedCount: z.coerce.number().min(0).default(0),
  skippedCount: z.coerce.number().min(0).default(0),
  replayedCount: z.coerce.number().min(0).default(0),
  playbackRate: z.coerce.number().min(0.25).max(2).default(1),
});

// ---------------------------------------------------------------------------
// Training completion (employee submits after watching)
// ---------------------------------------------------------------------------

export const completionSchema = z.object({
  learningSummary: z
    .string()
    .min(20, "Please describe what you learned (minimum 20 characters)")
    .max(1000, "Learning summary must not exceed 1000 characters"),
  completionNotes: z
    .string()
    .nullish()
    .transform((v) => (v === "" ? null : v)),
});

// ---------------------------------------------------------------------------
// Admin review
// ---------------------------------------------------------------------------

export const reviewSchema = z.object({
  reviewStatus: z.enum([
    "APPROVED",
    "REJECTED",
    "RESUBMISSION_REQUESTED",
  ], { required_error: "Please select a review status" }),
  reviewNote: z
    .string()
    .nullish()
    .transform((v) => (v === "" ? null : v)),
});
