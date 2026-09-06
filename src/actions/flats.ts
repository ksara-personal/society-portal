"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { flatSchema, flatRangeSchema } from "@/lib/validators";
import {
  CACHE_TAGS,
  getCachedFlatEligibilityCounts,
  getCachedFlatPairs,
  getCachedFlatsForWing,
  getCachedWings,
} from "@/lib/master-data";

type ActionResult = { success: boolean; count?: number } | { error: string };

function padFlatNo(n: number) {
  return String(n).padStart(3, "0");
}

/** Called by every flat mutation so the cached reference reads pick up the change. */
function invalidateFlatCaches() {
  updateTag(CACHE_TAGS.flats);
  revalidatePath("/admin/flats");
}

export async function getFlats() {
  return prisma.flat.findMany({
    orderBy: [{ wing: "asc" }, { flatNo: "asc" }],
  });
}

/** Counts of flats/villas by maintenance eligibility. */
export async function getFlatEligibilityCounts() {
  return getCachedFlatEligibilityCounts();
}

/** Distinct wing names present in the Flat master, sorted alphabetically. */
export async function getWings(): Promise<string[]> {
  return getCachedWings();
}

/**
 * Padded flat/villa numbers for a given wing. If wing is empty or not found,
 * returns all flats across every wing.
 */
export async function getFlatsForWing(wing?: string, options?: { eligibleOnly?: boolean }): Promise<string[]> {
  return getCachedFlatsForWing(wing, options?.eligibleOnly ?? false);
}

export async function getFlatPairs(
  wing?: string,
  options?: { eligibleOnly?: boolean }
): Promise<Array<{ wing: string; flatNo: string; eligibleForMaintenance: boolean }>> {
  return getCachedFlatPairs(wing, options?.eligibleOnly ?? false);
}

export async function createFlat(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = flatSchema.safeParse({
    wing: formData.get("wing"),
    flatNo: formData.get("flatNo"),
    eligibleForMaintenance: formData.get("eligibleForMaintenance"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const existing = await prisma.flat.findUnique({
    where: { wing_flatNo: { wing: parsed.data.wing, flatNo: parsed.data.flatNo } },
  });
  if (existing) return { error: "A flat/villa with this wing and number already exists" };

  await prisma.flat.create({ data: parsed.data });

  invalidateFlatCaches();
  return { success: true };
}

export async function updateFlat(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = flatSchema.safeParse({
    wing: formData.get("wing"),
    flatNo: formData.get("flatNo"),
    eligibleForMaintenance: formData.get("eligibleForMaintenance"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const existing = await prisma.flat.findFirst({
    where: { wing: parsed.data.wing, flatNo: parsed.data.flatNo, NOT: { id } },
  });
  if (existing) return { error: "A flat/villa with this wing and number already exists" };

  await prisma.flat.update({ where: { id }, data: parsed.data });

  invalidateFlatCaches();
  return { success: true };
}

export async function deleteFlat(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.flat.delete({ where: { id } });
  invalidateFlatCaches();
  return { success: true };
}

/** Bulk-create flats/villas for a wing across a numeric range, e.g. 1-9 → 001..009. */
export async function createFlatRange(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = flatRangeSchema.safeParse({
    wing: formData.get("wing"),
    flatStart: formData.get("flatStart"),
    flatEnd: formData.get("flatEnd"),
    eligibleForMaintenance: formData.get("eligibleForMaintenance"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { wing, flatStart, flatEnd, eligibleForMaintenance } = parsed.data;

  const existing = await prisma.flat.findMany({ where: { wing }, select: { flatNo: true } });
  const existingSet = new Set(existing.map((f) => f.flatNo));

  const toCreate = Array.from({ length: flatEnd - flatStart + 1 }, (_, i) => padFlatNo(flatStart + i))
    .filter((flatNo) => !existingSet.has(flatNo))
    .map((flatNo) => ({ wing, flatNo, eligibleForMaintenance }));

  if (toCreate.length === 0) return { error: "All flats/villas in this range already exist" };

  await prisma.flat.createMany({ data: toCreate });

  invalidateFlatCaches();
  return { success: true, count: toCreate.length };
}
