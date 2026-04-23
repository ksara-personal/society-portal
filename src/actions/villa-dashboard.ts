"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { subDays, format } from "date-fns";

export async function getVillaDashboardStats() {
  await requireAdmin();

  const [total, byStatus, byWing, recentIssues] = await Promise.all([
    prisma.issue.count({ where: { issueType: "VILLA" } }),

    prisma.issue.groupBy({
      by: ["status"],
      where: { issueType: "VILLA" },
      _count: { id: true },
    }),

    prisma.issue.groupBy({
      by: ["wing"],
      where: { issueType: "VILLA", wing: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),

    prisma.issue.findMany({
      where: { issueType: "VILLA" },
      include: {
        category: true,
        createdBy: { select: { name: true, wing: true, flatNo: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Status counts
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
  const resolved = await prisma.issue.findMany({
    where: {
      issueType: "VILLA",
      status: "COMPLETED",
      resolvedAt: { not: null },
    },
    select: { createdAt: true, resolvedAt: true },
  });
  if (resolved.length > 0) {
    const totalMs = resolved.reduce(
      (acc, i) => acc + (i.resolvedAt!.getTime() - i.createdAt.getTime()),
      0
    );
    avgResolutionDays = totalMs / resolved.length / (1000 * 60 * 60 * 24);
  }

  // Trend: villa issues per day for last 30 days
  const trendIssues = await prisma.issue.findMany({
    where: {
      issueType: "VILLA",
      createdAt: { gte: subDays(new Date(), 30) },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const trendMap = new Map<string, number>();
  for (const issue of trendIssues) {
    const key = format(issue.createdAt, "MMM dd");
    trendMap.set(key, (trendMap.get(key) || 0) + 1);
  }

  // Unique villas (residents) with at least one villa issue
  const uniqueVillas = await prisma.issue.findMany({
    where: { issueType: "VILLA" },
    select: { createdById: true },
    distinct: ["createdById"],
  });

  // Per-flat breakdown: flat-level issue count
  const byFlat = await prisma.issue.groupBy({
    by: ["createdById"],
    where: { issueType: "VILLA" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 20,
  });

  // Resolve creator names for the flat breakdown
  const creatorIds = byFlat.map((b) => b.createdById);
  const creators = await prisma.user.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, name: true, wing: true, flatNo: true },
  });
  const creatorMap = Object.fromEntries(creators.map((c) => [c.id, c]));

  const flatData = byFlat.map((b) => {
    const creator = creatorMap[b.createdById];
    return {
      label: creator
        ? `${creator.name}${creator.wing && creator.flatNo ? ` (${creator.wing}-${creator.flatNo})` : ""}`
        : "Unknown",
      count: b._count.id,
    };
  });

  return {
    total,
    statusCounts,
    uniqueVillasCount: uniqueVillas.length,
    wingData: byWing.map((w) => ({
      name: `Wing ${w.wing}`,
      count: w._count.id,
    })),
    flatData,
    recentIssues,
    avgResolutionDays,
    trendData: Array.from(trendMap.entries()).map(([date, count]) => ({
      date,
      count,
    })),
  };
}
