"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getCurrentUser } from "@/lib/session";
import { paymentSchema, bulkPaymentSchema } from "@/lib/validators";
import { summarizeFlatPayment } from "@/lib/payment-summary";

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
      include: { quarter: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return { items, total, pages: Math.ceil(total / limit) };
}

export async function getMyPayments() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  return prisma.payment.findMany({
    where: {
      wing: user.wing!,
      flatNo: user.flatNo!,
    },
    include: { quarter: true },
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
    wing: formData.get("wing"),
    flatNo: formData.get("flatNo"),
    status: formData.get("status"),
    paidAt: formData.get("paidAt") || undefined,
    paymentMethod: formData.get("paymentMethod") || undefined,
    transactionId: formData.get("transactionId") || undefined,
    notes: formData.get("notes") || undefined,
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
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : null,
    },
  });

  revalidatePath("/admin/payments");
  return { success: true };
}

export async function updatePayment(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = paymentSchema.partial().safeParse({
    quarterId: formData.get("quarterId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
    paidAt: formData.get("paidAt") || undefined,
    paymentMethod: formData.get("paymentMethod") || undefined,
    transactionId: formData.get("transactionId") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.payment.update({
    where: { id },
    data: {
      ...parsed.data,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : null,
    },
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
  await requireAdmin();

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

  // Get all approved residents (may include multiple per flat)
  const allResidents = await prisma.user.findMany({
    where: {
      role: "RESIDENT",
      approvalStatus: "APPROVED",
      isActive: true,
      ...(filters?.wing ? { wing: filters.wing } : {}),
    },
    select: { id: true, name: true, email: true, phone: true, wing: true, flatNo: true },
    orderBy: [{ wing: "asc" }, { flatNo: "asc" }, { name: "asc" }],
  });

  // Deduplicate by wing+flat — keep all resident names for display
  const flatMap = new Map<string, { residents: typeof allResidents; wing: string; flatNo: string }>();
  for (const r of allResidents) {
    const key = `${r.wing}-${r.flatNo}`;
    const wing = r.wing ?? "";
    const flatNo = r.flatNo ?? "";
    if (!flatMap.has(key)) {
      flatMap.set(key, { residents: [], wing, flatNo });
    }
    flatMap.get(key)!.residents.push(r);
  }

  const uniqueFlats = Array.from(flatMap.values());

  // Get existing payments for this quarter
  const existingPayments = await prisma.payment.findMany({
    where: {
      quarterId: currentQuarter.id,
      ...(filters?.wing ? { wing: filters.wing } : {}),
    },
    select: { wing: true, flatNo: true, status: true, amount: true, userId: true, id: true },
  });

  const paymentsByFlat = new Map<string, Array<(typeof existingPayments)[number]>>();
  for (const payment of existingPayments) {
    const key = `${payment.wing}-${payment.flatNo}`;
    const current = paymentsByFlat.get(key) ?? [];
    current.push(payment);
    paymentsByFlat.set(key, current);
  }

  // Build dues list: flats without a PAID payment for current quarter
  const dues = uniqueFlats
    .map((flat) => {
      const key = `${flat.wing}-${flat.flatNo}`;
      const flatPayments = paymentsByFlat.get(key) ?? [];
      const { payment, hasPaid } = summarizeFlatPayment(flatPayments);

      return {
        flat,
        primaryResident: flat.residents[0], // first registered resident
        allResidents: flat.residents,
        payment: payment || null,
        hasPaid,
      };
    })
    .filter((d) => !d.hasPaid);

  const totalFlats = uniqueFlats.length;
  const paidCount = uniqueFlats.length - dues.length;
  const unpaidCount = dues.length;
  const totalDueAmount = dues.reduce((sum, due) => {
    const paymentAmount = Number(due.payment?.amount ?? currentQuarter.defaultAmount ?? 0);
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
    },
  });

  revalidatePath("/admin/dues");
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

  revalidatePath("/admin/dues");
  return { success: true };
}