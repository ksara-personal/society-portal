"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { subDays, format } from "date-fns";

export async function getDashboardStats() {
  const user = await requireAuth();
  const isAdmin = user.role === "ADMIN";

  const where = isAdmin ? {} : { createdById: user.id };

  const [total, byStatus, byCategory, byWing, recentIssues] =
    await Promise.all([
      prisma.issue.count({ where }),

      prisma.issue.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
      }),

      prisma.issue.groupBy({
        by: ["categoryId"],
        where,
        _count: { id: true },
      }),

      isAdmin
        ? prisma.issue.groupBy({
            by: ["wing"],
            where: { wing: { not: null } },
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
          })
        : Promise.resolve([]),

      prisma.issue.findMany({
        where,
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

  // Avg resolution time (days) — simple query
  let avgResolutionDays: number | null = null;
  try {
    const resolved = await prisma.issue.findMany({
      where: {
        ...where,
        status: "COMPLETED",
        resolvedAt: { not: null },
      },
      select: { createdAt: true, resolvedAt: true },
    });
    if (resolved.length > 0) {
      const totalMs = resolved.reduce((acc, i) => {
        return acc + (i.resolvedAt!.getTime() - i.createdAt.getTime());
      }, 0);
      avgResolutionDays = totalMs / resolved.length / (1000 * 60 * 60 * 24);
    }
  } catch {
    avgResolutionDays = null;
  }

  // Trend: issues per day last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30);
  const trendIssues = await prisma.issue.findMany({
    where: {
      ...where,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const trendMap = new Map<string, number>();
  for (const issue of trendIssues) {
    const key = format(issue.createdAt, "MMM dd");
    trendMap.set(key, (trendMap.get(key) || 0) + 1);
  }
  const trendData = Array.from(trendMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return {
    total,
    statusCounts,
    categoryData: byCategory
      .map((c) => ({
        name: categoryMap[c.categoryId] || "Unknown",
        count: c._count.id,
      }))
      .sort((a, b) => b.count - a.count),
    wingData: (byWing as Array<{ wing: string | null; _count: { id: number } }>).map((w) => ({
      name: w.wing || "Unspecified",
      count: w._count.id,
    })),
    recentIssues,
    avgResolutionDays,
    trendData,
  };
}
