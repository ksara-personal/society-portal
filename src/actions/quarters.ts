"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { quarterSchema } from "@/lib/validators";

type ActionResult = { success: boolean } | { error: string };

function toSlug(name: string, year: number) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${year}`;
}

export async function getQuarters() {
  return prisma.paymentQuarter.findMany({
    orderBy: [{ year: "desc" }, { order: "asc" }],
  });
}

export async function getActiveQuarters() {
  return prisma.paymentQuarter.findMany({
    where: { isActive: true },
    orderBy: [{ year: "desc" }, { order: "asc" }],
  });
}

export async function createQuarter(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = quarterSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    year: formData.get("year"),
    order: formData.get("order"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const slug = toSlug(parsed.data.name, parsed.data.year);
  const existing = await prisma.paymentQuarter.findUnique({ where: { slug } });
  if (existing) return { error: "A quarter with this name and year already exists" };

  await prisma.paymentQuarter.create({
    data: { ...parsed.data, slug },
  });

  revalidatePath("/admin/quarters");
  return { success: true };
}

export async function updateQuarter(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = quarterSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    year: formData.get("year"),
    order: formData.get("order"),
    defaultAmount: formData.get("defaultAmount"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.paymentQuarter.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath("/admin/quarters");
  return { success: true };
}

export async function deleteQuarter(id: string): Promise<ActionResult> {
  await requireAdmin();

  const paymentCount = await prisma.payment.count({ where: { quarterId: id } });
  if (paymentCount > 0) {
    return { error: `Cannot delete: ${paymentCount} payment(s) are linked to this quarter` };
  }

  await prisma.paymentQuarter.delete({ where: { id } });
  revalidatePath("/admin/quarters");
  return { success: true };
}