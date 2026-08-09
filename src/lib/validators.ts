import { z } from "zod";

export const createIssueSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000),
  categoryId: z.string().min(1, "Please select a category"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  wing: z.string().optional(),
  location: z.string().max(200).optional(),
});

export const updateIssueSchema = createIssueSchema.partial();

export const updateIssueStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"]),
  note: z.string().max(500).optional(),
});

export const issueFilterSchema = z.object({
  status: z
    .enum(["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"])
    .optional(),
  categoryId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  wing: z.string().optional(),
  search: z.string().optional(),
  unassigned: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().max(200).optional(),
  icon: z.string().max(50).optional(),
});

export const expenseCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(200).optional(),
  isActive: z.coerce.boolean().default(true),
});

export const expenseTypeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  isActive: z.coerce.boolean().default(true),
});

export const expenseItemSchema = z.object({
  date: z.string().min(1, "Date is required"),
  quarterId: z.string().min(1, "Quarter is required"),
  expenseCategoryId: z.string().min(1, "Expense category is required"),
  expenseTypeId: z.string().min(1, "Expense type is required"),
  description: z.string().max(500).optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  wing: z.string().optional(),
  flatNo: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.preprocess(
    (val) => (typeof val === "string" ? val.replace(/\D/g, "") : val),
    z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number (e.g. 9876543210)")
  ),
  wing: z.string().min(1, "Please select a wing"),
  flatNo: z.string().min(1, "Please select a flat number"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Contacts feature

const indianMobileRegex = /^[6-9]\d{9}$/;

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  type: z.enum(["INDIVIDUAL", "COMPANY"]),
  companyName: z.string().max(100).optional().or(z.literal("")),
  categoryId: z.string().min(1, "Please select a category"),
  phone: z.preprocess(
    (val) => (typeof val === "string" ? val.replace(/\D/g, "") : val),
    z.string()
      .regex(indianMobileRegex, "Enter a valid 10-digit mobile number without country code")
      .optional()
      .or(z.literal(""))
  ),
  altPhone: z.preprocess(
    (val) => (typeof val === "string" ? val.replace(/\D/g, "") : val),
    z.string()
      .regex(indianMobileRegex, "Enter a valid 10-digit mobile number without country code")
      .optional()
      .or(z.literal(""))
  ),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  website: z.string().url("Enter a valid URL (include https://)").optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const contactCategorySchema = z.object({
  name: z.string().min(2).max(50),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens"),
  icon: z.string().max(50).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Enter a valid hex color e.g. #f59e0b")
    .optional()
    .or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
});

export const quarterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  year: z.coerce.number().int().min(2000).max(2100),
  order: z.coerce.number().int().min(0).default(0),
  defaultAmount: z.coerce.number().nonnegative("Default amount must be 0 or greater").default(0),
  isActive: z.coerce.boolean().default(true),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  quarterId: z.string().min(1, "Please select a quarter"),
  wing: z.string().min(1, "Wing is required"),
  flatNo: z.string().min(1, "Flat number is required"),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "WAIVED"]).default("PENDING"),
  paidAt: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().max(50).optional().or(z.literal("")),
  transactionId: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const bulkPaymentSchema = z.object({
  quarterId: z.string().min(1, "Select a quarter"),
  amount: z.coerce.number().positive(),
  wing: z.string().optional(), // optional = all wings
  flatNos: z.array(z.string()).min(1, "Select at least one flat"),
});

export type QuarterFormValues = z.infer<typeof quarterSchema>;
export type PaymentFormValues = z.infer<typeof paymentSchema>;
export type ContactFormValues = z.infer<typeof contactSchema>;
export type ContactCategoryFormValues = z.infer<typeof contactCategorySchema>;
