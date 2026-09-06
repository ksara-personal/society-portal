import { format } from "date-fns";
import { prisma } from "@/lib/prisma";

/**
 * Aggregations that used to be done by loading every matching Issue row into
 * memory. They stay O(1) in transfer size as the table grows, which is what the
 * dashboards actually need.
 *
 * Day bucketing happens in the database, so buckets are UTC days rather than
 * the Node process's local days. On Vercel (UTC) that matches the previous
 * behaviour exactly; on a non-UTC dev machine boundaries can shift by a day.
 */
type IssueTypeValue = "SOCIETY" | "VILLA";

/** Mean days between an issue being reported and resolved. */
export async function getAvgResolutionDays(
  issueType: IssueTypeValue
): Promise<number | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ avg_days: number | null }>>`
      SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 86400)::float8 AS avg_days
      FROM "Issue"
      WHERE "issueType" = ${issueType}::"IssueType"
        AND "status" = 'COMPLETED'::"IssueStatus"
        AND "resolvedAt" IS NOT NULL
    `;
    return rows[0]?.avg_days ?? null;
  } catch {
    return null;
  }
}

/** Issue counts per day since `since`, for the trend charts. */
export async function getDailyIssueCounts(
  issueType: IssueTypeValue,
  since: Date
): Promise<Array<{ date: string; count: number }>> {
  const rows = await prisma.$queryRaw<Array<{ day: Date; count: number }>>`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
    FROM "Issue"
    WHERE "issueType" = ${issueType}::"IssueType"
      AND "createdAt" >= ${since}
    GROUP BY 1
    ORDER BY 1 ASC
  `;
  return rows.map((row) => ({
    date: format(row.day, "MMM dd"),
    count: row.count,
  }));
}

/** How many distinct residents have reported at least one issue of this type. */
export async function getDistinctIssueCreatorCount(
  issueType: IssueTypeValue
): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(DISTINCT "createdById")::int AS count
    FROM "Issue"
    WHERE "issueType" = ${issueType}::"IssueType"
  `;
  return rows[0]?.count ?? 0;
}
