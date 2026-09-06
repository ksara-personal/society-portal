import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Cached readers for the reference tables — wings, flats, categories, payment
 * and expense types, quarters. These change only when an admin edits them, but
 * were being re-queried on nearly every page render (and, for wings/flats, once
 * per client component mount across nine pages).
 *
 * All of this is community-wide data with no per-user component, so it is safe
 * to share one cache entry across requests and users.
 *
 * Each entry is invalidated by `revalidateTag` from the corresponding mutation;
 * the time limit is only a backstop in case a tag is ever missed.
 */
export const CACHE_TAGS = {
  flats: "flats",
  categories: "categories",
  paymentTypes: "payment-types",
  expenseCategories: "expense-categories",
  expenseTypes: "expense-types",
  quarters: "quarters",
} as const;

const BACKSTOP_SECONDS = 3600;

export const getCachedWings = unstable_cache(
  async (): Promise<string[]> => {
    const flats = await prisma.flat.findMany({
      select: { wing: true },
      distinct: ["wing"],
      orderBy: { wing: "asc" },
    });
    return flats.map((f) => f.wing).sort((a, b) => a.localeCompare(b));
  },
  ["wings"],
  { tags: [CACHE_TAGS.flats], revalidate: BACKSTOP_SECONDS }
);

export const getCachedFlatsForWing = unstable_cache(
  async (wing?: string, eligibleOnly?: boolean): Promise<string[]> => {
    const flats = await prisma.flat.findMany({
      where: {
        ...(wing ? { wing } : {}),
        ...(eligibleOnly ? { eligibleForMaintenance: true } : {}),
      },
      orderBy: { flatNo: "asc" },
      select: { flatNo: true },
    });
    return flats.map((f) => f.flatNo);
  },
  ["flats-for-wing"],
  { tags: [CACHE_TAGS.flats], revalidate: BACKSTOP_SECONDS }
);

export const getCachedFlatPairs = unstable_cache(
  async (
    wing?: string,
    eligibleOnly?: boolean
  ): Promise<Array<{ wing: string; flatNo: string; eligibleForMaintenance: boolean }>> => {
    return prisma.flat.findMany({
      where: {
        ...(wing ? { wing } : {}),
        ...(eligibleOnly ? { eligibleForMaintenance: true } : {}),
      },
      orderBy: [{ wing: "asc" }, { flatNo: "asc" }],
      select: { wing: true, flatNo: true, eligibleForMaintenance: true },
    });
  },
  ["flat-pairs"],
  { tags: [CACHE_TAGS.flats], revalidate: BACKSTOP_SECONDS }
);

export const getCachedFlatEligibilityCounts = unstable_cache(
  async () => {
    const [total, eligible] = await Promise.all([
      prisma.flat.count(),
      prisma.flat.count({ where: { eligibleForMaintenance: true } }),
    ]);
    return { total, eligible, notEligible: total - eligible };
  },
  ["flat-eligibility-counts"],
  { tags: [CACHE_TAGS.flats], revalidate: BACKSTOP_SECONDS }
);

export const getCachedActiveCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ["active-categories"],
  { tags: [CACHE_TAGS.categories], revalidate: BACKSTOP_SECONDS }
);

export const getCachedAllCategories = unstable_cache(
  async () => prisma.category.findMany({ orderBy: { name: "asc" } }),
  ["all-categories"],
  { tags: [CACHE_TAGS.categories], revalidate: BACKSTOP_SECONDS }
);

export const getCachedPaymentTypes = unstable_cache(
  async () => prisma.paymentType.findMany({ orderBy: { name: "asc" } }),
  ["payment-types"],
  { tags: [CACHE_TAGS.paymentTypes], revalidate: BACKSTOP_SECONDS }
);

export const getCachedExpenseCategories = unstable_cache(
  async () => prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
  ["expense-categories"],
  { tags: [CACHE_TAGS.expenseCategories], revalidate: BACKSTOP_SECONDS }
);

export const getCachedExpenseTypes = unstable_cache(
  async () => prisma.expenseType.findMany({ orderBy: { name: "asc" } }),
  ["expense-types"],
  { tags: [CACHE_TAGS.expenseTypes], revalidate: BACKSTOP_SECONDS }
);

export const getCachedQuarters = unstable_cache(
  async () =>
    prisma.paymentQuarter.findMany({
      orderBy: [{ year: "desc" }, { order: "asc" }],
    }),
  ["quarters"],
  { tags: [CACHE_TAGS.quarters], revalidate: BACKSTOP_SECONDS }
);

export const getCachedActiveQuarters = unstable_cache(
  async () =>
    prisma.paymentQuarter.findMany({
      where: { isActive: true },
      orderBy: [{ year: "desc" }, { order: "asc" }],
    }),
  ["active-quarters"],
  { tags: [CACHE_TAGS.quarters], revalidate: BACKSTOP_SECONDS }
);
