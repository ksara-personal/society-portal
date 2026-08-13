"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { expenseCategorySchema, expenseItemSchema, expenseTypeSchema, paymentTypeSchema } from "@/lib/validators";

type ActionResult = { success: true } | { error: string };

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getExpenseCategories() {
  return prisma.expenseCategory.findMany({ orderBy: { name: "asc" } });
}

export async function createExpenseCategory(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = expenseCategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const slug = toSlug(parsed.data.name);
  const existing = await prisma.expenseCategory.findFirst({
    where: { OR: [{ name: parsed.data.name }, { slug }] },
  });
  if (existing) return { error: "An expense category with this name already exists" };

  await prisma.expenseCategory.create({
    data: { ...parsed.data, slug },
  });

  revalidatePath("/admin/expense-categories");
  return { success: true };
}

export async function updateExpenseCategory(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = expenseCategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const slug = toSlug(parsed.data.name);
  const existing = await prisma.expenseCategory.findFirst({
    where: {
      AND: [{ id: { not: id } }, { OR: [{ name: parsed.data.name }, { slug }] }],
    },
  });
  if (existing) return { error: "An expense category with this name already exists" };

  await prisma.expenseCategory.update({
    where: { id },
    data: { ...parsed.data, slug },
  });

  revalidatePath("/admin/expense-categories");
  return { success: true };
}

export async function deleteExpenseCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.expenseCategory.delete({ where: { id } });
  revalidatePath("/admin/expense-categories");
  return { success: true };
}

export async function getExpenseTypes() {
  return prisma.expenseType.findMany({ orderBy: { name: "asc" } });
}

export async function getExpenseItems(filters?: { quarterId?: string }) {
  return prisma.expenseItem.findMany({
    where: filters?.quarterId ? { quarterId: filters.quarterId } : undefined,
    orderBy: { date: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      quarter: true,
      expenseCategory: true,
      expenseType: true,
    },
  });
}

export async function createExpenseItem(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = expenseItemSchema.safeParse({
    date: formData.get("date"),
    quarterId: formData.get("quarterId"),
    expenseCategoryId: formData.get("expenseCategoryId"),
    expenseTypeId: formData.get("expenseTypeId"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    createdById: formData.get("createdById") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  // "Paid by" must be an active admin - falls back to the current admin if none was picked
  let createdById = admin.id;
  if (parsed.data.createdById && parsed.data.createdById !== admin.id) {
    const paidBy = await prisma.user.findFirst({
      where: { id: parsed.data.createdById, role: "ADMIN", isActive: true },
      select: { id: true },
    });
    if (!paidBy) return { error: "Invalid 'Paid by' user" };
    createdById = paidBy.id;
  }

  await prisma.expenseItem.create({
    data: {
      date: new Date(parsed.data.date),
      description: parsed.data.description ?? "",
      amount: parsed.data.amount,
      createdById,
      quarterId: parsed.data.quarterId,
      expenseCategoryId: parsed.data.expenseCategoryId,
      expenseTypeId: parsed.data.expenseTypeId,
    },
  });

  revalidatePath("/admin/expense-items");
  return { success: true };
}

export async function deleteExpenseItem(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.expenseItem.delete({ where: { id } });
  revalidatePath("/admin/expense-items");
  return { success: true };
}

export interface ExpenseImportRow {
  Date: string;
  Quarter: string;
  Category: string;
  Description?: string;
  "Amount (₹)": string;
  "Paid By": string;
  "Expense Type": string;
}

export interface ExpenseImportRowResult {
  row: number;
  success: boolean;
  error?: string;
}

export async function importExpenseItems(
  rows: ExpenseImportRow[]
): Promise<{ results: ExpenseImportRowResult[] } | { error: string }> {
  await requireAdmin();

  if (!Array.isArray(rows) || rows.length === 0) return { error: "No rows to import" };

  const [quarters, categories, types, users] = await Promise.all([
    prisma.paymentQuarter.findMany(),
    prisma.expenseCategory.findMany(),
    prisma.expenseType.findMany(),
    prisma.user.findMany({ where: { isActive: true } }),
  ]);

  const byName = <T extends { name: string }>(list: T[], name: string) =>
    list.find((item) => item.name.trim().toLowerCase() === name.trim().toLowerCase());

  const results: ExpenseImportRowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // account for the header row

    const dateStr = (row.Date ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      results.push({ row: rowNum, success: false, error: `Invalid date "${dateStr}" (expected yyyy-MM-dd)` });
      continue;
    }
    const date = new Date(`${dateStr}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      results.push({ row: rowNum, success: false, error: `Invalid date "${dateStr}"` });
      continue;
    }

    const quarter = byName(quarters, row.Quarter ?? "");
    if (!quarter) {
      results.push({ row: rowNum, success: false, error: `Quarter "${row.Quarter}" not found` });
      continue;
    }

    const category = byName(categories, row.Category ?? "");
    if (!category) {
      results.push({ row: rowNum, success: false, error: `Expense category "${row.Category}" not found` });
      continue;
    }

    const expenseType = byName(types, row["Expense Type"] ?? "");
    if (!expenseType) {
      results.push({ row: rowNum, success: false, error: `Expense type "${row["Expense Type"]}" not found` });
      continue;
    }

    const paidByName = (row["Paid By"] ?? "").trim().toLowerCase();
    const paidBy = users.find(
      (u) => u.name.trim().toLowerCase() === paidByName || u.email.toLowerCase() === paidByName
    );
    if (!paidBy) {
      results.push({ row: rowNum, success: false, error: `User "${row["Paid By"]}" not found` });
      continue;
    }

    const amountRaw = (row["Amount (₹)"] ?? "").replace(/[₹,\s]/g, "");
    const amount = Number(amountRaw);
    if (!amountRaw || Number.isNaN(amount) || amount <= 0) {
      results.push({ row: rowNum, success: false, error: `Invalid amount "${row["Amount (₹)"]}"` });
      continue;
    }

    try {
      await prisma.expenseItem.create({
        data: {
          date,
          description: (row.Description ?? "").trim(),
          amount,
          createdById: paidBy.id,
          quarterId: quarter.id,
          expenseCategoryId: category.id,
          expenseTypeId: expenseType.id,
        },
      });
      results.push({ row: rowNum, success: true });
    } catch {
      results.push({ row: rowNum, success: false, error: "Failed to create expense item" });
    }
  }

  revalidatePath("/admin/expense-items");
  return { results };
}

export async function createExpenseType(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = expenseTypeSchema.safeParse({
    name: formData.get("name"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const slug = toSlug(parsed.data.name);
  const existing = await prisma.expenseType.findFirst({
    where: { OR: [{ name: parsed.data.name }, { slug }] },
  });
  if (existing) return { error: "An expense type with this name already exists" };

  await prisma.expenseType.create({
    data: { ...parsed.data, slug },
  });

  revalidatePath("/admin/expense-types");
  return { success: true };
}

export async function updateExpenseType(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = expenseTypeSchema.safeParse({
    name: formData.get("name"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const slug = toSlug(parsed.data.name);
  const existing = await prisma.expenseType.findFirst({
    where: {
      AND: [{ id: { not: id } }, { OR: [{ name: parsed.data.name }, { slug }] }],
    },
  });
  if (existing) return { error: "An expense type with this name already exists" };

  await prisma.expenseType.update({
    where: { id },
    data: { ...parsed.data, slug },
  });

  revalidatePath("/admin/expense-types");
  return { success: true };
}

export async function deleteExpenseType(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.expenseType.delete({ where: { id } });
  revalidatePath("/admin/expense-types");
  return { success: true };
}

export async function getPaymentTypes() {
  return prisma.paymentType.findMany({ orderBy: { name: "asc" } });
}

export async function createPaymentType(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = paymentTypeSchema.safeParse({
    name: formData.get("name"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const slug = toSlug(parsed.data.name);
  const existing = await prisma.paymentType.findFirst({
    where: { OR: [{ name: parsed.data.name }, { slug }] },
  });
  if (existing) return { error: "A payment type with this name already exists" };

  await prisma.paymentType.create({ data: { ...parsed.data, slug } });
  revalidatePath("/admin/payment-types");
  return { success: true };
}

export async function updatePaymentType(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = paymentTypeSchema.safeParse({
    name: formData.get("name"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const slug = toSlug(parsed.data.name);
  const existing = await prisma.paymentType.findFirst({
    where: {
      AND: [{ id: { not: id } }, { OR: [{ name: parsed.data.name }, { slug }] }],
    },
  });
  if (existing) return { error: "A payment type with this name already exists" };

  await prisma.paymentType.update({
    where: { id },
    data: { ...parsed.data, slug },
  });

  revalidatePath("/admin/payment-types");
  return { success: true };
}

export async function deletePaymentType(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.paymentType.delete({ where: { id } });
  revalidatePath("/admin/payment-types");
  return { success: true };
}