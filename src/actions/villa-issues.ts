"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/session";
import { IssueStatus } from "@prisma/client";
import { z } from "zod";
import { BRANDING } from "@/config/branding";

const villaIssueSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  categoryId: z.string().min(1, "Please select a category"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  wing: z.string().optional(),
  flatNo: z.string().optional(),
  location: z.string().max(200).optional(),
});

async function checkOwnership(issueId: string, userId: string, role: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId, issueType: "VILLA" },
    select: { createdById: true, status: true },
  });
  if (!issue) return { error: "Issue not found" };
  if (issue.createdById !== userId && role !== "ADMIN") {
    return { error: "Not authorized to perform this action" };
  }
  return { issue };
}

export async function createVillaIssue(formData: FormData) {
  const user = await requireAuth();

  const parsed = villaIssueSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    priority: formData.get("priority") || "MEDIUM",
    wing: formData.get("wing") || undefined,
    flatNo: formData.get("flatNo") || undefined,
    location: formData.get("location") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const attachmentUrls = JSON.parse(
    (formData.get("attachments") as string) || "[]"
  ) as Array<{ url: string; type: "IMAGE" | "VIDEO"; filename: string; size: number }>;

  const issue = await prisma.$transaction(async (tx) => {
    const newIssue = await tx.issue.create({
      data: {
        ...parsed.data,
        issueType: "VILLA",
        createdById: user.id,
        attachments: {
          create: attachmentUrls.map((a) => ({
            url: a.url,
            type: a.type,
            filename: a.filename,
            size: a.size,
          })),
        },
      },
    });

    await tx.statusHistory.create({
      data: {
        issueId: newIssue.id,
        fromStatus: null,
        toStatus: IssueStatus.PENDING,
        changedById: user.id,
        note: `${BRANDING.unitLabel} issue reported`,
      },
    });

    return newIssue;
  });

  revalidatePath("/villa-issues");
  return { success: true, issueId: issue.id };
}

export async function updateVillaIssue(issueId: string, formData: FormData) {
  const user = await requireAuth();
  const check = await checkOwnership(issueId, user.id, user.role);
  if ("error" in check) return check;

  const parsed = villaIssueSchema.partial().safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    priority: formData.get("priority"),
    wing: formData.get("wing") || undefined,
    flatNo: formData.get("flatNo") || undefined,
    location: formData.get("location") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await prisma.issue.update({
    where: { id: issueId },
    data: parsed.data,
  });

  revalidatePath(`/villa-issues/${issueId}`);
  revalidatePath("/villa-issues");
  return { success: true };
}

export async function deleteVillaIssue(issueId: string) {
  const user = await requireAuth();
  const check = await checkOwnership(issueId, user.id, user.role);
  if ("error" in check) return check;

  await prisma.issue.delete({ where: { id: issueId } });
  revalidatePath("/villa-issues");
  return { success: true };
}

export async function resolveVillaIssue(issueId: string, resolve: boolean) {
  const user = await requireAuth();

  const issue = await prisma.issue.findUnique({
    where: { id: issueId, issueType: "VILLA" },
    select: { createdById: true, status: true },
  });

  if (!issue) return { error: "Issue not found" };
  if (issue.createdById !== user.id) {
    return { error: `Only the owner can resolve their ${BRANDING.unitLabel.toLowerCase()} issues` };
  }

  const newStatus = resolve ? IssueStatus.COMPLETED : IssueStatus.PENDING;

  await prisma.$transaction(async (tx) => {
    await tx.issue.update({
      where: { id: issueId },
      data: {
        status: newStatus,
        resolvedAt: resolve ? new Date() : null,
      },
    });

    await tx.statusHistory.create({
      data: {
        issueId,
        fromStatus: issue.status,
        toStatus: newStatus,
        changedById: user.id,
        note: resolve ? "Marked as resolved by resident" : "Reopened by resident",
      },
    });
  });

  revalidatePath(`/villa-issues/${issueId}`);
  revalidatePath("/villa-issues");
  return { success: true };
}

export async function getVillaIssues(
  userId: string,
  searchParams: Record<string, string> = {}
) {
  // Scope to the flat: find all users sharing the same wing + flatNo,
  // so flatmates see each other's issues. Falls back to userId-only if
  // the user has no wing/flatNo set.
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { wing: true, flatNo: true },
  });

  let flatmateIds: string[] = [userId];
  if (currentUser?.wing && currentUser?.flatNo) {
    const flatmates = await prisma.user.findMany({
      where: { wing: currentUser.wing, flatNo: currentUser.flatNo },
      select: { id: true },
    });
    flatmateIds = flatmates.map((f) => f.id);
  }

  const where: Record<string, unknown> = {
    issueType: "VILLA",
    createdById: { in: flatmateIds },
  };

  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: "insensitive" } },
      { description: { contains: searchParams.search, mode: "insensitive" } },
    ];
  }

  const page = Math.max(1, parseInt(searchParams.page || "1"));
  const limit = 12;

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      include: {
        category: true,
        createdBy: { select: { name: true, wing: true, flatNo: true } },
        attachments: { take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.issue.count({ where }),
  ]);

  return {
    issues,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── Admin: grouped summary of all villas with issues ───────────────────────

export async function getVillasWithIssueCounts(
  searchParams: Record<string, string> = {}
) {
  await requireAdmin();

  // Find users who have at least one villa issue, filtered by wing / flatNo
  const userWhere: Record<string, unknown> = {
    createdIssues: { some: { issueType: "VILLA" } },
  };
  if (searchParams.wing) userWhere.wing = searchParams.wing;
  if (searchParams.flatNo) userWhere.flatNo = searchParams.flatNo;

  const users = await prisma.user.findMany({
    where: userWhere,
    select: { id: true, name: true, wing: true, flatNo: true },
    orderBy: [{ wing: "asc" }, { flatNo: "asc" }],
  });

  if (users.length === 0) return [];

  // Count issues per user
  const counts = await prisma.issue.groupBy({
    by: ["createdById"],
    where: {
      issueType: "VILLA",
      createdById: { in: users.map((u) => u.id) },
    },
    _count: { id: true },
  });

  const countMap = Object.fromEntries(
    counts.map((c) => [c.createdById, c._count.id])
  );

  return users.map((u) => ({
    ...u,
    issueCount: countMap[u.id] ?? 0,
  }));
}

// ─── Admin: all villa issues for one specific resident ───────────────────────

export async function getVillaIssuesByUserId(
  targetUserId: string,
  searchParams: Record<string, string> = {}
) {
  await requireAdmin();

  const where: Record<string, unknown> = {
    issueType: "VILLA",
    createdById: targetUserId,
  };
  if (searchParams.status) where.status = searchParams.status;

  const [issues, resident] = await Promise.all([
    prisma.issue.findMany({
      where,
      include: {
        category: true,
        createdBy: { select: { name: true, wing: true, flatNo: true } },
        assignedTo: { select: { name: true } },
        attachments: { take: 1 },
      },
      orderBy: [{ category: { name: "asc" } }, { createdAt: "desc" }],
    }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: { name: true, wing: true, flatNo: true },
    }),
  ]);

  return { issues, resident };
}

export async function getVillaIssueById(id: string) {
  return prisma.issue.findUnique({
    where: { id, issueType: "VILLA" },
    include: {
      category: true,
      createdBy: {
        select: { id: true, name: true, email: true, wing: true, flatNo: true },
      },
      attachments: true,
      statusHistory: {
        include: { changedBy: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
