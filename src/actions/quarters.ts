"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { quarterSchema } from "@/lib/validators";
import {
  CACHE_TAGS,
  getCachedActiveQuarters,
  getCachedQuarters,
} from "@/lib/master-data";

type ActionResult = { success: boolean } | { error: string };

/** Called by every quarter mutation so the cached reference reads pick up the change. */
function invalidateQuarterCaches() {
  updateTag(CACHE_TAGS.quarters);
  revalidatePath("/admin/quarters");
}

function toSlug(name: string, year: number) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${year}`;
}

export async function getQuarters() {
  return getCachedQuarters();
}

export async function getActiveQuarters() {
  return getCachedActiveQuarters();
}

// Deliberately not cached: which quarter is "current" depends on today's date,
// and it is a single indexed lookup.
export async function getCurrentQuarter() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.paymentQuarter.findFirst({
    where: {
      isActive: true,
      startDate: { lte: today },
      endDate: { gte: today },
    },
  });
}

function parseQuarterDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
  return date;
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

  const data = {
    ...parsed.data,
    startDate: parseQuarterDate(parsed.data.startDate),
    endDate: parseQuarterDate(parsed.data.endDate),
  };

  await prisma.paymentQuarter.create({
    data: { ...data, slug },
  });

  invalidateQuarterCaches();
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

  const data = {
    ...parsed.data,
    startDate: parseQuarterDate(parsed.data.startDate),
    endDate: parseQuarterDate(parsed.data.endDate),
  };

  await prisma.paymentQuarter.update({
    where: { id },
    data,
  });

  invalidateQuarterCaches();
  return { success: true };
}

export async function deleteQuarter(id: string): Promise<ActionResult> {
  await requireAdmin();

  const paymentCount = await prisma.payment.count({ where: { quarterId: id } });
  if (paymentCount > 0) {
    return { error: `Cannot delete: ${paymentCount} payment(s) are linked to this quarter` };
  }

  await prisma.paymentQuarter.delete({ where: { id } });
  invalidateQuarterCaches();
  return { success: true };
}