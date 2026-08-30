"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { subDays, format } from "date-fns";
import { getMyPayments } from "@/actions/payments";
import { getLatestMeeting } from "@/actions/meetings";

export async function getDashboardStats() {
  await requireAuth();

  const [total, byStatus, byCategory, byWing, recentIssues] =
    await Promise.all([
      prisma.issue.count({ where: { issueType: "SOCIETY" } }),

      prisma.issue.groupBy({
        by: ["status"],
        where: { issueType: "SOCIETY" },
        _count: { id: true },
      }),

      prisma.issue.groupBy({
        by: ["categoryId"],
        where: { issueType: "SOCIETY" },
        _count: { id: true },
      }),

      prisma.issue.groupBy({
        by: ["wing"],
        where: { issueType: "SOCIETY", wing: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),

      prisma.issue.findMany({
        where: { issueType: "SOCIETY" },
        include: {
          category: true,
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  // Resolve category names
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  const categoryMap = Object.fromEntries(
    categories.map((c) => [c.id, c.name])
  );

  // Format status counts
  const statusCounts: Record<string, number> = {
    PENDING: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    REJECTED: 0,
  };
  for (const s of byStatus) {
    statusCounts[s.status] = s._count.id;
  }

  // Avg resolution time (days)
  let avgResolutionDays: number | null = null;
  try {
    const resolved = await prisma.issue.findMany({
      where: { issueType: "SOCIETY", status: "COMPLETED", resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    });
    if (resolved.length > 0) {
      const totalMs = resolved.reduce(
        (acc, i) => acc + (i.resolvedAt!.getTime() - i.createdAt.getTime()),
        0
      );
      avgResolutionDays = totalMs / resolved.length / (1000 * 60 * 60 * 24);
    }
  } catch {
    avgResolutionDays = null;
  }

  // Trend: issues per day last 30 days
  const trendIssues = await prisma.issue.findMany({
    where: { issueType: "SOCIETY", createdAt: { gte: subDays(new Date(), 30) } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const trendMap = new Map<string, number>();
  for (const issue of trendIssues) {
    const key = format(issue.createdAt, "MMM dd");
    trendMap.set(key, (trendMap.get(key) || 0) + 1);
  }

  return {
    total,
    statusCounts,
    categoryData: byCategory
      .map((c) => ({
        name: categoryMap[c.categoryId] || "Unknown",
        count: c._count.id,
      }))
      .sort((a, b) => b.count - a.count),
    wingData: byWing.map((w) => ({
      name: w.wing || "Unspecified",
      count: w._count.id,
    })),
    recentIssues,
    avgResolutionDays,
    trendData: Array.from(trendMap.entries()).map(([date, count]) => ({
      date,
      count,
    })),
  };
}

// Resident-facing "My Home" summary: dues status, open issue counts, latest meeting.
export async function getResidentDashboardSummary() {
  const user = await requireAuth();
  const today = new Date();

  const flatUsers =
    user.wing && user.flatNo
      ? await prisma.user.findMany({
          where: { wing: user.wing, flatNo: user.flatNo },
          select: { id: true },
        })
      : [{ id: user.id }];
  const flatmateIds = flatUsers.map((u) => u.id);

  const [payments, currentQuarter, societyOpenCount, villaOpenCount, recentIssues, latestMeeting] =
    await Promise.all([
      getMyPayments(),
      prisma.paymentQuarter.findFirst({
        where: { isActive: true, startDate: { lte: today }, endDate: { gte: today } },
      }),
      prisma.issue.count({
        where: {
          issueType: "SOCIETY",
          createdById: user.id,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      }),
      prisma.issue.count({
        where: {
          issueType: "VILLA",
          createdById: { in: flatmateIds },
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      }),
      prisma.issue.findMany({
        where: {
          OR: [
            { issueType: "SOCIETY", createdById: user.id },
            { issueType: "VILLA", createdById: { in: flatmateIds } },
          ],
        },
        include: { category: true, createdBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      getLatestMeeting(),
    ]);

  // Same outstanding-total rule as the My Payments page: PAID/WAIVED always resolved,
  // PARTIAL only leaves the remainder (target - paid) outstanding.
  const outstandingAmount =
    payments
      .filter((p) => p.status === "PENDING" || p.status === "OVERDUE")
      .reduce((sum, p) => sum + Number(p.amount), 0) +
    payments
      .filter((p) => p.status === "PARTIAL")
      .reduce((sum, p) => sum + Math.max(Number(p.quarter.defaultAmount) - Number(p.amount), 0), 0);

  const currentQuarterPayment = currentQuarter
    ? payments.find((p) => p.quarterId === currentQuarter.id) ?? null
    : null;

  return {
    dues: {
      outstandingAmount,
      currentQuarterName: currentQuarter?.name ?? null,
      currentQuarterStatus: currentQuarterPayment?.status ?? (currentQuarter ? "PENDING" : null),
    },
    issues: { societyOpenCount, villaOpenCount, recentIssues },
    latestMeeting,
  };
}
