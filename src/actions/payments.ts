"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth, getCurrentUser } from "@/lib/session";
import { paymentSchema, bulkPaymentSchema } from "@/lib/validators";
import { summarizeFlatPayment } from "@/lib/payment-summary";
import { getFlatPairs } from "@/actions/flats";

type ActionResult = { success: boolean; count?: number } | { error: string };

export async function getPayments(filters?: {
  quarterId?: string;
  wing?: string;
  flatNo?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters?.quarterId) where.quarterId = filters.quarterId;
  if (filters?.wing) where.wing = filters.wing;
  if (filters?.flatNo) where.flatNo = filters.flatNo;
  if (filters?.status) where.status = filters.status;

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        quarter: true,
        paymentType: true,
        user: { select: { name: true, email: true } },
        collectedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return { items, total, pages: Math.ceil(total / limit) };
}

export async function getAdmins() {
  await requireAdmin();
  return prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export async function getMyPayments() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  return prisma.payment.findMany({
    where: {
      wing: user.wing!,
      flatNo: user.flatNo!,
    },
    include: { quarter: true, paymentType: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPayment(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const quarterId = String(formData.get("quarterId") || "");
  const fallbackQuarter = quarterId
    ? await prisma.paymentQuarter.findUnique({ where: { id: quarterId }, select: { defaultAmount: true } })
    : null;
  const amountValue = formData.get("amount") ? String(formData.get("amount")) : String(fallbackQuarter?.defaultAmount ?? 0);

  const parsed = paymentSchema.safeParse({
    amount: amountValue,
    quarterId,
    paymentTypeId: formData.get("paymentTypeId"),
    wing: formData.get("wing"),
    flatNo: formData.get("flatNo"),
    status: formData.get("status"),
    paidAt: formData.get("paidAt") || undefined,
    paymentMethod: formData.get("paymentMethod") || undefined,
    transactionId: formData.get("transactionId") || undefined,
    notes: formData.get("notes") || undefined,
    collectedById: formData.get("collectedById") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const resident = await prisma.user.findFirst({
    where: { wing: parsed.data.wing, flatNo: parsed.data.flatNo, isActive: true },
    select: { id: true },
  });

  const admin = await getCurrentUser();

  await prisma.payment.create({
    data: {
      ...parsed.data,
      userId: resident?.id ?? null,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : null,
      collectedById: parsed.data.collectedById || admin?.id || null,
    },
  });

  revalidatePath("/admin/payments");
  return { success: true };
}

export async function updatePayment(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = paymentSchema.partial().safeParse({
    quarterId: formData.get("quarterId"),
    paymentTypeId: formData.get("paymentTypeId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
    paidAt: formData.get("paidAt") || undefined,
    paymentMethod: formData.get("paymentMethod") || undefined,
    transactionId: formData.get("transactionId") || undefined,
    notes: formData.get("notes") || undefined,
    collectedById: formData.get("collectedById") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const admin = await getCurrentUser();

  const updateData: any = {
    ...parsed.data,
    paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : null,
  };

  if (parsed.data.collectedById) {
    updateData.collectedById = parsed.data.collectedById;
  } else if (parsed.data.status === "PAID") {
    updateData.collectedById = admin?.id ?? null;
  }

  await prisma.payment.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/admin/payments");
  return { success: true };
}

export async function deletePayment(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.payment.delete({ where: { id } });
  revalidatePath("/admin/payments");
  return { success: true };
}

export async function generateBulkPayments(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const quarterIdValue = String(formData.get("quarterId") || "");
  const quarter = quarterIdValue
    ? await prisma.paymentQuarter.findUnique({ where: { id: quarterIdValue }, select: { defaultAmount: true } })
    : null;
  const amountValue = formData.get("amount") ? String(formData.get("amount")) : String(quarter?.defaultAmount ?? 0);

  const parsed = bulkPaymentSchema.safeParse({
    quarterId: quarterIdValue,
    amount: amountValue,
    wing: formData.get("wing") || undefined,
    flatNos: JSON.parse((formData.get("flatNos") as string) || "[]"),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { quarterId, amount, wing, flatNos } = parsed.data;
  const effectiveAmount = amount ?? Number(quarter?.defaultAmount ?? 0);

  const users = await prisma.user.findMany({
    where: {
      role: "RESIDENT",
      approvalStatus: "APPROVED",
      isActive: true,
      ...(wing ? { wing } : {}),
      flatNo: { in: flatNos },
    },
    select: { id: true, wing: true, flatNo: true },
  });

  const existing = await prisma.payment.findMany({
    where: { quarterId, flatNo: { in: flatNos }, ...(wing ? { wing } : {}) },
    select: { wing: true, flatNo: true },
  });
  const existingSet = new Set(existing.map((e) => `${e.wing}-${e.flatNo}`));

  const toCreate = users
    .filter((u) => !existingSet.has(`${u.wing}-${u.flatNo}`))
    .map((u) => ({
      amount: effectiveAmount,
      quarterId,
      wing: u.wing!,
      flatNo: u.flatNo!,
      userId: u.id,
      status: "PENDING" as const,
    }));

  if (toCreate.length === 0) return { error: "Payments already exist for all selected flats" };

  await prisma.payment.createMany({ data: toCreate });

  revalidatePath("/admin/payments");
  return { success: true, count: toCreate.length };
}

export async function getCurrentQuarterDues(filters?: {
  wing?: string;
}) {
  // Shared with residents via the Dues Tracker page
  await requireAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the quarter that contains today's date
  const currentQuarter = await prisma.paymentQuarter.findFirst({
    where: {
      isActive: true,
      startDate: { lte: today },
      endDate: { gte: today },
    },
  });

  if (!currentQuarter) {
    return { error: "No active quarter is configured for the current date range." };
  }

  // Get all users for display details (include admins and other roles)
  const allResidents = await prisma.user.findMany({
    where: {
      ...(filters?.wing ? { wing: filters.wing } : {}),
    },
    select: { id: true, name: true, email: true, phone: true, wing: true, flatNo: true },
    orderBy: [{ wing: "asc" }, { flatNo: "asc" }, { name: "asc" }],
  });

  function normalizeFlatNo(flatNo?: string | null) {
    const raw = String(flatNo ?? "").trim();
    return /^\d+$/.test(raw) ? raw.padStart(3, "0") : raw;
  }

  const residentMap = new Map<string, typeof allResidents>();
  for (const resident of allResidents) {
    const key = `${resident.wing}-${normalizeFlatNo(resident.flatNo)}`;
    const existing = residentMap.get(key) ?? [];
    existing.push(resident);
    residentMap.set(key, existing);
  }

  // If some flats don't have residents in the map (e.g. user not APPROVED/isActive),
  // try a secondary lookup without approval/isActive filters so we can still show names.
  // Build list of flat keys that are missing residents.
  const missingKeys: string[] = [];

  // Get existing payments for this quarter (Dues Tracker only tracks the Maintenance payment type;
  // untyped/legacy records are treated as Maintenance too, only explicit other types are excluded)
  const existingPayments = await prisma.payment.findMany({
    where: {
      quarterId: currentQuarter.id,
      ...(filters?.wing ? { wing: filters.wing } : {}),
      OR: [{ paymentTypeId: null }, { paymentType: { slug: "maintenance" } }],
    },
    select: { wing: true, flatNo: true, status: true, amount: true, userId: true, id: true },
  });

  // Use configured wing/flat ranges as the baseline for dues, then include any existing payment records.
  const configuredFlats = (await getFlatPairs(filters?.wing, { eligibleOnly: true })).map((flat) => ({
    ...flat,
    flatNo: normalizeFlatNo(flat.flatNo),
  }));

  const allFlatKeys = new Set(configuredFlats.map((flat) => `${flat.wing}-${flat.flatNo}`));
  for (const payment of existingPayments) {
    allFlatKeys.add(`${payment.wing}-${normalizeFlatNo(payment.flatNo)}`);
  }

  const uniqueFlats = Array.from(allFlatKeys)
    .map((key) => {
      const [wing, flatNo] = key.split("-", 2);
      return { wing, flatNo: normalizeFlatNo(flatNo) };
    })
    .sort((a, b) => {
      const wingCompare = a.wing.localeCompare(b.wing);
      if (wingCompare !== 0) return wingCompare;
      return (parseInt(a.flatNo, 10) || 0) - (parseInt(b.flatNo, 10) || 0);
    });

  const paymentsByFlat = new Map<string, Array<(typeof existingPayments)[number]>>();
  for (const payment of existingPayments) {
    const key = `${payment.wing}-${normalizeFlatNo(payment.flatNo)}`;
    const current = paymentsByFlat.get(key) ?? [];
    current.push(payment);
    paymentsByFlat.set(key, current);
  }

  // Build dues list: flats without a PAID payment for current quarter
  // compute missingKeys before building dues
  for (const flat of uniqueFlats) {
    const key = `${flat.wing}-${flat.flatNo}`;
    if (!residentMap.has(key)) missingKeys.push(key);
  }

  if (missingKeys.length > 0) {
    // Fetch any users that match the missing wing/flatNo pairs regardless of approval/isActive
    const orConditions = missingKeys.map((k) => {
      const [wing, flatNo] = k.split("-", 2);
      return { wing, flatNo } as any;
    });
    try {
      const extraResidents = await prisma.user.findMany({
        where: { OR: orConditions },
        select: { id: true, name: true, email: true, phone: true, wing: true, flatNo: true },
      });
      for (const resident of extraResidents) {
        const key = `${resident.wing}-${normalizeFlatNo(resident.flatNo)}`;
        const existing = residentMap.get(key) ?? [];
        existing.push(resident);
        residentMap.set(key, existing);
      }
    } catch (err) {
      // ignore lookup errors and continue with whatever we have
    }
  }

  const dues = uniqueFlats
    .map((flat) => {
      const key = `${flat.wing}-${flat.flatNo}`;
      const flatPayments = paymentsByFlat.get(key) ?? [];
      const { payment, hasPaid } = summarizeFlatPayment(flatPayments);
      const residents = residentMap.get(key) ?? [];

      return {
        flat,
        primaryResident: residents[0] ?? null,
        allResidents: residents,
        payment: payment || null,
        hasPaid,
      };
    })
    .filter((d) => !d.hasPaid);

  const totalFlats = uniqueFlats.length;
  const paidCount = uniqueFlats.length - dues.length;
  const unpaidCount = dues.length;
  const quarterTarget = Number(currentQuarter.defaultAmount ?? 0);
  const totalDueAmount = dues.reduce((sum, due) => {
    // A PARTIAL payment's amount is what has already been paid, so the outstanding due is the remainder, not the full recorded amount
    if (due.payment?.status === "PARTIAL") {
      const paidAmount = Number(due.payment.amount ?? 0);
      return sum + Math.max(quarterTarget - paidAmount, 0);
    }
    const paymentAmount = Number(due.payment?.amount ?? quarterTarget);
    return sum + paymentAmount;
  }, 0);

  return {
    quarter: currentQuarter,
    dues,
    summary: {
      totalFlats,
      paidCount,
      unpaidCount,
      totalDueAmount,
      collectionRate: totalFlats > 0 ? Math.round((paidCount / totalFlats) * 100) : 0,
    },
  };
}

export async function getFinanceUserSummary(filters?: { quarterId?: string; userId?: string }) {
  await requireAdmin();

  const paymentWhere: any = {
    status: { in: ["PAID", "PARTIAL"] },
    collectedById: { not: null },
  };
  if (filters?.quarterId) paymentWhere.quarterId = filters.quarterId;
  if (filters?.userId) paymentWhere.collectedById = filters.userId;

  const paymentSummaries = await prisma.payment.groupBy({
    by: ["collectedById"],
    where: paymentWhere,
    _sum: { amount: true },
  });

  const expenseWhere: any = {};
  if (filters?.quarterId) expenseWhere.quarterId = filters.quarterId;
  if (filters?.userId) expenseWhere.createdById = filters.userId;

  const expenseSummaries = await prisma.expenseItem.groupBy({
    by: ["createdById"],
    where: expenseWhere,
    _sum: { amount: true },
  });

  const userIds = new Set<string>();
  paymentSummaries.forEach((entry) => {
    if (entry.collectedById) userIds.add(entry.collectedById);
  });
  expenseSummaries.forEach((entry) => {
    if (entry.createdById) userIds.add(entry.createdById);
  });

  const users = userIds.size > 0
    ? await prisma.user.findMany({
        where: { id: { in: Array.from(userIds) } },
        select: { id: true, name: true, email: true },
      })
    : [];

  const userMap = new Map(users.map((user) => [user.id, user]));

  const rows = Array.from(new Set<string>([
    ...paymentSummaries.map((entry) => entry.collectedById).filter(Boolean) as string[],
    ...expenseSummaries.map((entry) => entry.createdById).filter(Boolean) as string[],
  ]))
    .map((userId) => {
      const user = userMap.get(userId) ?? { id: userId, name: "Unknown", email: "" };
      const collected = Number(paymentSummaries.find((entry) => entry.collectedById === userId)?._sum.amount ?? 0);
      const expenses = Number(expenseSummaries.find((entry) => entry.createdById === userId)?._sum.amount ?? 0);
      return {
        userId,
        user,
        collected,
        expenses,
        remaining: collected - expenses,
      };
    })
    .sort((left, right) => right.remaining - left.remaining);

  return rows;
}

export async function markPaymentPaid(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const paidAt = formData.get("paidAt") as string;
  const paymentMethod = formData.get("paymentMethod") as string;
  const transactionId = formData.get("transactionId") as string;
  const notes = formData.get("notes") as string;

  await prisma.payment.update({
    where: { id },
    data: {
      status: "PAID",
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      paymentMethod: paymentMethod || "Cash",
      transactionId: transactionId || null,
      notes: notes || null,
      collectedById: (await getCurrentUser())?.id ?? null,
    },
  });

  revalidatePath("/admin/dues-tracker");
  return { success: true };
}

export async function createDuePayment(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const quarterId = String(formData.get("quarterId") || "");
  const fallbackQuarter = quarterId
    ? await prisma.paymentQuarter.findUnique({ where: { id: quarterId }, select: { defaultAmount: true } })
    : null;
  const amountValue = formData.get("amount") ? String(formData.get("amount")) : String(fallbackQuarter?.defaultAmount ?? 0);

  const parsed = paymentSchema.safeParse({
    amount: amountValue,
    quarterId,
    wing: formData.get("wing"),
    flatNo: formData.get("flatNo"),
    status: "PENDING",
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const resident = await prisma.user.findFirst({
    where: { wing: parsed.data.wing, flatNo: parsed.data.flatNo, isActive: true },
    select: { id: true },
  });

  await prisma.payment.create({
    data: {
      ...parsed.data,
      userId: resident?.id ?? null,
    },
  });

  // set collectedBy to current admin when creating due-payment via Dues UI
  await prisma.payment.updateMany({
    where: { quarterId: parsed.data.quarterId, wing: parsed.data.wing as string, flatNo: parsed.data.flatNo as string, status: "PENDING" },
    data: { collectedById: (await getCurrentUser())?.id ?? null },
  });

  revalidatePath("/admin/dues-tracker");
  return { success: true };
}

export async function getQuarterlyBalances(year?: number) {
  await requireAdmin();

  const quarters = await prisma.paymentQuarter.findMany({
    where: typeof year === "number" ? { year } : {},
    orderBy: [{ year: "asc" }, { order: "asc" }],
  });

  if (quarters.length === 0) return [];

  const quarterIds = quarters.map((q) => q.id);

  // load payment types map by slug
  const paymentTypes = await prisma.paymentType.findMany({ select: { id: true, slug: true } });
  const slugToId = new Map(paymentTypes.map((pt) => [pt.slug, pt.id]));

  // group payments per quarter and paymentType (PARTIAL amounts are real cash already collected)
  const paymentsByQuarterAndType = await prisma.payment.groupBy({
    by: ["quarterId", "paymentTypeId"],
    where: { quarterId: { in: quarterIds }, status: { in: ["PAID", "PARTIAL"] } },
    _sum: { amount: true },
  });

  const paymentsTotalByQuarter = await prisma.payment.groupBy({
    by: ["quarterId"],
    where: { quarterId: { in: quarterIds }, status: { in: ["PAID", "PARTIAL"] } },
    _sum: { amount: true },
  });

  const expensesByQuarter = await prisma.expenseItem.groupBy({
    by: ["quarterId"],
    where: { quarterId: { in: quarterIds } },
    _sum: { amount: true },
  });

  // helper maps
  const paymentsTypeMap = new Map<string, number>();
  for (const entry of paymentsByQuarterAndType) {
    const key = `${entry.quarterId}::${entry.paymentTypeId ?? "-"}`;
    paymentsTypeMap.set(key, Number(entry._sum.amount ?? 0));
  }

  const paymentsTotalMap = new Map(paymentsTotalByQuarter.map((p) => [p.quarterId, Number(p._sum.amount ?? 0)]));
  const expensesMap = new Map(expensesByQuarter.map((e) => [e.quarterId, Number(e._sum.amount ?? 0)]));

  // For opening balance we compute cumulative sums from all quarters that end before this quarter's start
  const results: Array<any> = [];
  const today = new Date();

  for (const q of quarters) {
    // quarters that haven't started yet carry no activity - keep them at zero so totals aren't inflated
    // by repeating the last known closing balance across every future row
    if (q.startDate > today) {
      results.push({
        quarterId: q.id,
        name: q.name,
        startDate: q.startDate,
        endDate: q.endDate,
        opening: 0,
        maintenance: 0,
        builderFunds: 0,
        otherIncome: 0,
        totalExpenses: 0,
        netMovement: 0,
        closing: 0,
      });
      continue;
    }

    // find previous quarters
    const prevQuarters = await prisma.paymentQuarter.findMany({ where: { endDate: { lt: q.startDate } }, select: { id: true } });
    const prevIds = prevQuarters.map((p) => p.id);

    let prevPaymentsSum = 0;
    let prevExpensesSum = 0;
    if (prevIds.length > 0) {
      const prevPay = await prisma.payment.aggregate({ where: { quarterId: { in: prevIds }, status: { in: ["PAID", "PARTIAL"] } }, _sum: { amount: true } });
      const prevExp = await prisma.expenseItem.aggregate({ where: { quarterId: { in: prevIds } }, _sum: { amount: true } });
      prevPaymentsSum = Number(prevPay._sum.amount ?? 0);
      prevExpensesSum = Number(prevExp._sum.amount ?? 0);
    }

    const opening = prevPaymentsSum - prevExpensesSum;

    const maintenanceId = slugToId.get("maintenance") ?? null;
    const builderId = slugToId.get("builder-funds") ?? null;
    const otherId = slugToId.get("other-income") ?? null;

    const maintenance = maintenanceId ? Number(paymentsTypeMap.get(`${q.id}::${maintenanceId}`) ?? 0) : 0;
    const builderFunds = builderId ? Number(paymentsTypeMap.get(`${q.id}::${builderId}`) ?? 0) : 0;
    const otherIncome = otherId ? Number(paymentsTypeMap.get(`${q.id}::${otherId}`) ?? 0) : 0;

    const totalExpenses = Number(expensesMap.get(q.id) ?? 0);
    const receipts = Number(paymentsTotalMap.get(q.id) ?? 0);

    const netMovement = receipts - totalExpenses;
    const closing = opening + netMovement;

    results.push({
      quarterId: q.id,
      name: q.name,
      startDate: q.startDate,
      endDate: q.endDate,
      opening,
      maintenance,
      builderFunds,
      otherIncome,
      totalExpenses,
      netMovement,
      closing,
    });
  }

  return results;
}

export async function getQuarterlyPersonBalances(year?: number) {
  await requireAdmin();

  const quarters = await prisma.paymentQuarter.findMany({
    where: typeof year === "number" ? { year } : {},
    orderBy: [{ year: "asc" }, { order: "asc" }],
  });

  if (quarters.length === 0) return { quarters: [], rows: [] };

  const quarterIds = quarters.map((q) => q.id);

  const paymentsByQuarterAndCollector = await prisma.payment.groupBy({
    by: ["quarterId", "collectedById"],
    where: { quarterId: { in: quarterIds }, status: { in: ["PAID", "PARTIAL"] }, collectedById: { not: null } },
    _sum: { amount: true },
  });

  const expensesByQuarterAndCreator = await prisma.expenseItem.groupBy({
    by: ["quarterId", "createdById"],
    where: { quarterId: { in: quarterIds } },
    _sum: { amount: true },
  });

  const userIds = new Set<string>();
  paymentsByQuarterAndCollector.forEach((entry) => {
    if (entry.collectedById) userIds.add(entry.collectedById);
  });
  expensesByQuarterAndCreator.forEach((entry) => userIds.add(entry.createdById));

  const users = userIds.size > 0
    ? await prisma.user.findMany({
        where: { id: { in: Array.from(userIds) } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user]));

  const collectedMap = new Map<string, number>();
  for (const entry of paymentsByQuarterAndCollector) {
    if (!entry.collectedById) continue;
    collectedMap.set(`${entry.quarterId}::${entry.collectedById}`, Number(entry._sum.amount ?? 0));
  }

  const spentMap = new Map<string, number>();
  for (const entry of expensesByQuarterAndCreator) {
    spentMap.set(`${entry.quarterId}::${entry.createdById}`, Number(entry._sum.amount ?? 0));
  }

  const rows = Array.from(userIds)
    .map((userId) => {
      const user = userMap.get(userId) ?? { id: userId, name: "Unknown", email: "" };
      let totalCollected = 0;
      let totalSpent = 0;
      const perQuarter = quarters.map((q) => {
        const collected = collectedMap.get(`${q.id}::${userId}`) ?? 0;
        const spent = spentMap.get(`${q.id}::${userId}`) ?? 0;
        totalCollected += collected;
        totalSpent += spent;
        return { quarterId: q.id, collected, spent };
      });

      return {
        userId,
        user,
        perQuarter,
        totalCollected,
        totalSpent,
        balance: totalCollected - totalSpent,
      };
    })
    .sort((left, right) => (left.user.name ?? "").localeCompare(right.user.name ?? ""));

  return {
    quarters: quarters.map((q) => ({ id: q.id, name: q.name })),
    rows,
  };
}

function normalizeFlatNo(flatNo?: string | null) {
  const raw = String(flatNo ?? "").trim();
  return /^\d+$/.test(raw) ? raw.padStart(3, "0") : raw;
}

export async function getDuesTrackerData(year?: number) {
  // Shared with residents via the Dues Tracker page
  await requireAuth();

  const quarters = await prisma.paymentQuarter.findMany({
    where: typeof year === "number" ? { year } : {},
    orderBy: [{ order: "asc" }],
  });

  if (quarters.length === 0) return { quarters: [] as typeof quarters, rows: [] as never[] };

  const quarterIds = quarters.map((q) => q.id);

  const residents = await prisma.user.findMany({
    where: { },
    select: { name: true, wing: true, flatNo: true },
    orderBy: [{ wing: "asc" }, { flatNo: "asc" }, { name: "asc" }],
  });

  const ownersByFlat = new Map<string, string[]>();
  for (const resident of residents) {
    const key = `${resident.wing}-${normalizeFlatNo(resident.flatNo)}`;
    const existing = ownersByFlat.get(key) ?? [];
    existing.push(resident.name);
    ownersByFlat.set(key, existing);
  }

  // Configured wing/flat ranges form the baseline row set; any flat with a payment record is included too.
  const allFlatPairs = await getFlatPairs();
  const eligibilityByFlat = new Map<string, boolean>();
  for (const flat of allFlatPairs) {
    eligibilityByFlat.set(`${flat.wing}-${normalizeFlatNo(flat.flatNo)}`, flat.eligibleForMaintenance);
  }

  const flatKeys = new Set(
    allFlatPairs
      .filter((flat) => flat.eligibleForMaintenance)
      .map((flat) => `${flat.wing}-${normalizeFlatNo(flat.flatNo)}`)
  );

  const payments = await prisma.payment.findMany({
    where: {
      quarterId: { in: quarterIds },
      status: { in: ["PAID", "PARTIAL", "WAIVED"] },
      OR: [{ paymentTypeId: null }, { paymentType: { slug: "maintenance" } }],
    },
    select: { quarterId: true, wing: true, flatNo: true, amount: true, status: true },
  });

  const paidByFlatAndQuarter = new Map<string, number>();
  // PAID/WAIVED fully resolve a quarter regardless of the recorded amount (e.g. a
  // reduced amount approved for residents who don't use all facilities)
  const resolvedFlatQuarters = new Set<string>();
  for (const payment of payments) {
    const flatKey = `${payment.wing}-${normalizeFlatNo(payment.flatNo)}`;
    flatKeys.add(flatKey);
    const key = `${flatKey}::${payment.quarterId}`;
    paidByFlatAndQuarter.set(key, (paidByFlatAndQuarter.get(key) ?? 0) + Number(payment.amount));
    if (payment.status === "PAID" || payment.status === "WAIVED") {
      resolvedFlatQuarters.add(key);
    }
  }

  const flats = Array.from(flatKeys)
    .map((key) => {
      const [wing, flatNo] = key.split("-", 2);
      return { wing, flatNo };
    })
    .sort((a, b) => {
      const wingCompare = a.wing.localeCompare(b.wing);
      if (wingCompare !== 0) return wingCompare;
      return (parseInt(a.flatNo, 10) || 0) - (parseInt(b.flatNo, 10) || 0);
    });

  const rows = flats.map((flat) => {
    const flatKey = `${flat.wing}-${flat.flatNo}`;
    const owners = ownersByFlat.get(flatKey) ?? [];

    const quarterAmounts = quarters.map((quarter) => {
      const key = `${flatKey}::${quarter.id}`;
      const paid = paidByFlatAndQuarter.get(key) ?? 0;
      // Flats not eligible for maintenance owe nothing, regardless of the quarter's default amount
      const isEligible = eligibilityByFlat.get(flatKey) ?? true;
      const target = isEligible ? Number(quarter.defaultAmount ?? 0) : 0;
      const resolved = resolvedFlatQuarters.has(key);
      return {
        quarterId: quarter.id,
        paid,
        target,
        isShort: !resolved && paid < target,
      };
    });

    return {
      wing: flat.wing,
      flatNo: flat.flatNo,
      ownerName: owners.join(", ") || "Unregistered",
      quarterAmounts,
      total: quarterAmounts.reduce((sum, qa) => sum + qa.paid, 0),
    };
  });

  return { quarters, rows };
}