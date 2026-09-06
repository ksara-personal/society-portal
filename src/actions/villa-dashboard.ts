"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { subDays } from "date-fns";
import {
  getAvgResolutionDays,
  getDailyIssueCounts,
  getDistinctIssueCreatorCount,
} from "@/lib/issue-stats";

export async function getVillaDashboardStats() {
  await requireAdmin();

  // One wave for everything that doesn't depend on another result; only the
  // creator-name lookup has to wait, since it needs the ids from `byFlat`.
  const [
    total,
    byStatus,
    byWing,
    recentIssues,
    avgResolutionDays,
    trendData,
    uniqueVillasCount,
    byFlat,
  ] = await Promise.all([
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

    getAvgResolutionDays("VILLA"),

    getDailyIssueCounts("VILLA", subDays(new Date(), 30)),

    getDistinctIssueCreatorCount("VILLA"),

    // Per-flat breakdown: flat-level issue count
    prisma.issue.groupBy({
      by: ["createdById"],
      where: { issueType: "VILLA" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
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

  // Resolve creator names for the flat breakdown
  const creators = await prisma.user.findMany({
    where: { id: { in: byFlat.map((b) => b.createdById) } },
    select: { id: true, name: true, wing: true, flatNo: true },
  });
  const creatorMap = new Map(creators.map((c) => [c.id, c]));

  const flatData = byFlat.map((b) => {
    const creator = creatorMap.get(b.createdById);
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
    uniqueVillasCount,
    wingData: byWing.map((w) => ({
      name: `Wing ${w.wing}`,
      count: w._count.id,
    })),
    flatData,
    recentIssues,
    avgResolutionDays,
    trendData,
  };
}
