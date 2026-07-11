import { z } from "zod";

const optionalUrl = z.union([z.string().url(), z.literal(""), z.null(), z.undefined()]).transform((value) => value === "" ? null : value);
const optionalText = z.string().nullish().transform((value) => value === "" ? null : value);

export const loginSchema = z.object({
  identifier: z.string().min(1, "Employee ID, username, or email is required"),
  password: z.string().min(1, "Password is required")
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
    confirmPassword: z.string().min(8)
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export const employeeSchema = z.object({
  fullName: z.string().min(2),
  employeeCode: z.string().min(2),
  email: z.string().email(),
  departmentId: z.string().optional().nullable(),
  jobTitle: z.string().min(2),
  manager: optionalText,
  phone: optionalText,
  nationalId: optionalText,
  joiningDate: z.coerce.date(),
  birthDate: z.coerce.date().optional().nullable(),
  gender: z.enum(["FEMALE", "MALE", "OTHER", "UNDISCLOSED"]).default("UNDISCLOSED"),
  address: optionalText,
  emergencyContact: optionalText,
  notes: optionalText,
  photoUrl: optionalUrl,
  status: z.enum(["ACTIVE", "INACTIVE", "DEACTIVATED"]).default("ACTIVE")
});

export const trainingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).default("BEGINNER"),
  estimatedMinutes: z.coerce.number().min(1),
  dueDate: z.coerce.date().optional().nullable(),
  thumbnailUrl: optionalUrl,
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  tags: z.array(z.string()).default([]),
  completionCriteria: z.enum(["WATCH_95_PERCENT", "OPEN_ALL_ASSETS", "PASS_ACKNOWLEDGEMENT"]).default("WATCH_95_PERCENT")
});

export const assignmentSchema = z.object({
  trainingIds: z.array(z.string()).min(1),
  employeeIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
  everyone: z.boolean().default(false),
  dueDate: z.coerce.date().optional().nullable()
});

export const progressSchema = z.object({
  assignmentId: z.string(),
  assetId: z.string(),
  lastSecond: z.coerce.number().min(0),
  watchedSeconds: z.coerce.number().min(0),
  durationSeconds: z.coerce.number().min(1),
  pausedCount: z.coerce.number().min(0).default(0),
  skippedCount: z.coerce.number().min(0).default(0),
  replayedCount: z.coerce.number().min(0).default(0),
  playbackRate: z.coerce.number().min(0.25).max(2).default(1)
});
