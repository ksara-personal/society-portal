"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { expenseCategorySchema, expenseItemSchema, expenseTypeSchema } from "@/lib/validators";

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

export async function getExpenseItems() {
  return prisma.expenseItem.findMany({
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
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.expenseItem.create({
    data: {
      date: new Date(parsed.data.date),
      description: parsed.data.description ?? "",
      amount: parsed.data.amount,
      createdById: admin.id,
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
