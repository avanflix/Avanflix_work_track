import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid company email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid company email"),
});

// Frontend form
export const verifyOtpSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
});

// Backend API
export const verifyOtpApiSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "Enter the 6-digit code"),
});

// Frontend form
export const resetPasswordFormSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordFormInput = z.infer<
  typeof resetPasswordFormSchema
>;

// Backend API
export const resetPasswordSchema = z.object({
  email: z.string().email(),
  resetToken: z.string().min(1, "Missing reset token"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createEmployeeSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean().optional(),
  availabilityStatus: z
    .enum(["ACTIVE", "ON_LEAVE", "INACTIVE"])
    .optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(5, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  department: z.string().min(1),
  assignedTo: z.string().min(1, "Assign an employee"),
  startDate: z.string().min(1),
  deadline: z.string().min(1),
  estimatedHours: z.coerce.number().positive().optional(),
});

export const taskProgressUpdateSchema = z
  .object({
    status: z.enum(["PENDING", "NOTICED", "IN_PROGRESS", "COMPLETED", "ISSUE", "DELAYED", "CANCELLED"]).optional(),
    progressPercent: z.coerce.number().min(0).max(100).optional(),
    workDone: z.string().optional(),
    comment: z.string().optional(),
    // Required explanation of what exactly is wrong when status is flagged as an issue.
    issueDescription: z.string().optional(),
    timeSpentMinutes: z.coerce.number().min(0).optional(),
    // Required when status is "Working On It" (IN_PROGRESS).
    estimatedCompletionDate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "ISSUE" && !data.issueDescription?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["issueDescription"],
        message: "Please explain what the issue is",
      });
    }
    if (data.status === "IN_PROGRESS" && !data.estimatedCompletionDate?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["estimatedCompletionDate"],
        message: "Please provide an estimated completion date & time",
      });
    }
  });


export const updateAvailabilitySchema = z.object({
  userId: z.string().min(1, "User ID is required"),

  availabilityStatus: z.enum([
    "ACTIVE",
    "ON_LEAVE",
    "WFH",
    "HALF_DAY",
    "INACTIVE",
  ]),

  leaveFrom: z.string().optional(),

  leaveTo: z.string().optional(),

  leaveReason: z.string().optional(),
});

export type UpdateAvailabilityInput =
  z.infer<typeof updateAvailabilitySchema>;


export const delaySubmissionSchema = z.object({
  reason: z.string().min(5, "Please describe the delay reason"),
  expectedCompletionDate: z.string().min(1),
});

export const delayReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const transferRequestSchema = z.object({
  transferTo: z.string().min(1, "Select who to transfer this task to"),
  reason: z.string().min(5, "Please explain why this task is being transferred"),
});

export const transferReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const createWorkLogSchema = z.object({
  // Which calendar day this log belongs to. Optional - defaults to "today"
  // server-side. Sent as an ISO date string, e.g. "2026-07-14".
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),

  summary: z
    .string()
    .trim()
    .min(1, "Please provide a work summary")
    .max(3000),

  blockers: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal("")),

  notes: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal("")),
});

export const workLogCalendarQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  employeeId: z.string().optional(),
});

export type CreateWorkLogInput = z.infer<typeof createWorkLogSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type verifyOtpApiInput = z.infer<typeof verifyOtpApiSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type TaskProgressUpdateInput = z.infer<typeof taskProgressUpdateSchema>;
export type DelaySubmissionInput = z.infer<typeof delaySubmissionSchema>;
export type TransferRequestInput = z.infer<typeof transferRequestSchema>;
