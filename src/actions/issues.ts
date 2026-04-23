"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/session";
import {
  createIssueSchema,
  updateIssueSchema,
  updateIssueStatusSchema,
  issueFilterSchema,
} from "@/lib/validators";
import { IssueStatus } from "@prisma/client";

export async function createIssue(formData: FormData) {
  const user = await requireAuth();

  const parsed = createIssueSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    priority: formData.get("priority") || "MEDIUM",
    wing: formData.get("wing") || undefined,
    location: formData.get("location") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const attachmentUrls = JSON.parse(
    (formData.get("attachments") as string) || "[]"
  ) as Array<{
    url: string;
    type: "IMAGE" | "VIDEO";
    filename: string;
    size: number;
  }>;

  const issue = await prisma.$transaction(async (tx) => {
    const newIssue = await tx.issue.create({
      data: {
        ...parsed.data,
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
        note: "Issue reported",
      },
    });

    return newIssue;
  });

  revalidatePath("/issues");
  revalidatePath("/dashboard");
  return { success: true, issueId: issue.id };
}

export async function updateIssue(issueId: string, formData: FormData) {
  const user = await requireAuth();

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { createdById: true },
  });

  if (!issue) return { error: "Issue not found" };
  if (issue.createdById !== user.id && user.role !== "ADMIN") {
    return { error: "Not authorized to edit this issue" };
  }

  const parsed = updateIssueSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    priority: formData.get("priority"),
    wing: formData.get("wing") || undefined,
    location: formData.get("location") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await prisma.issue.update({
    where: { id: issueId },
    data: parsed.data,
  });

  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/issues");
  return { success: true };
}

export async function updateIssueStatus(
  issueId: string,
  data: { status: string; note?: string }
) {
  const user = await requireAdmin();

  const parsed = updateIssueStatusSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { status: true },
  });

  if (!issue) return { error: "Issue not found" };

  const newStatus = parsed.data.status as IssueStatus;

  await prisma.$transaction(async (tx) => {
    await tx.issue.update({
      where: { id: issueId },
      data: {
        status: newStatus,
        resolvedAt:
          newStatus === IssueStatus.COMPLETED ? new Date() : undefined,
      },
    });

    await tx.statusHistory.create({
      data: {
        issueId,
        fromStatus: issue.status,
        toStatus: newStatus,
        changedById: user.id,
        note: parsed.data.note,
      },
    });
  });

  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/issues");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function assignIssue(issueId: string, adminId: string | null) {
  await requireAdmin();

  await prisma.issue.update({
    where: { id: issueId },
    data: { assignedToId: adminId || null },
  });

  revalidatePath(`/issues/${issueId}`);
  return { success: true };
}

export async function deleteIssue(issueId: string) {
  const user = await requireAuth();

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { createdById: true },
  });

  if (!issue) return { error: "Issue not found" };
  if (issue.createdById !== user.id && user.role !== "ADMIN") {
    return { error: "Not authorized to delete this issue" };
  }

  await prisma.issue.delete({ where: { id: issueId } });

  revalidatePath("/issues");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getIssues(searchParams: Record<string, string>) {
  const user = await requireAuth();
  const filters = issueFilterSchema.parse(searchParams);

  const where: Record<string, unknown> = { issueType: "SOCIETY" };

  if (filters.status) where.status = filters.status;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.priority) where.priority = filters.priority;
  if (filters.wing) where.wing = filters.wing;
  if (filters.unassigned) where.assignedToId = null;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      include: {
        category: true,
        createdBy: { select: { name: true, wing: true, flatNo: true } },
        assignedTo: { select: { name: true } },
        attachments: { take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.issue.count({ where }),
  ]);

  return {
    issues,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getIssueById(id: string) {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      category: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          wing: true,
          flatNo: true,
        },
      },
      assignedTo: { select: { id: true, name: true, email: true } },
      attachments: true,
      statusHistory: {
        include: {
          changedBy: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return issue;
}

export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getAdmins() {
  return prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}
