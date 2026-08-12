"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/session";
import { meetingSchema } from "@/lib/validators";

type ActionResult = { success: boolean } | { error: string };

function parseMeetingDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid meeting date");
  return date;
}

/** Non-admins only ever see published minutes; admins see everything. */
export async function getMeetings(params: { year?: number } = {}) {
  const user = await requireAuth();
  const isAdmin = user.role === "ADMIN";

  return prisma.meeting.findMany({
    where: {
      ...(params.year ? { year: params.year } : {}),
      ...(isAdmin ? {} : { status: "PUBLISHED" }),
    },
    orderBy: [{ meetingDate: "desc" }],
    include: { createdBy: { select: { name: true } } },
  });
}

export async function getLatestMeeting() {
  const user = await requireAuth();
  const isAdmin = user.role === "ADMIN";

  return prisma.meeting.findFirst({
    where: isAdmin ? {} : { status: "PUBLISHED" },
    orderBy: [{ meetingDate: "desc" }],
    include: { createdBy: { select: { name: true } } },
  });
}

export async function getMeetingYears() {
  const user = await requireAuth();
  const isAdmin = user.role === "ADMIN";

  const rows = await prisma.meeting.findMany({
    where: isAdmin ? {} : { status: "PUBLISHED" },
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" },
  });
  return rows.map((r: { year: number }) => r.year);
}

export async function getMeeting(id: string) {
  const user = await requireAuth();
  const isAdmin = user.role === "ADMIN";

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true } } },
  });

  if (!meeting) return null;
  if (!isAdmin && meeting.status !== "PUBLISHED") return null;
  return meeting;
}

export async function createMeeting(formData: FormData): Promise<ActionResult> {
  const user = await requireAdmin();

  const parsed = meetingSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    meetingDate: formData.get("meetingDate"),
    status: formData.get("status") || "DRAFT",
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const meetingDate = parseMeetingDate(parsed.data.meetingDate);

  await prisma.meeting.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      meetingDate,
      year: meetingDate.getFullYear(),
      status: parsed.data.status,
      publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
      createdById: user.id,
    },
  });

  revalidatePath("/meetings");
  return { success: true };
}

export async function updateMeeting(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing) return { error: "Meeting not found" };

  const parsed = meetingSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    meetingDate: formData.get("meetingDate"),
    status: formData.get("status") || existing.status,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const meetingDate = parseMeetingDate(parsed.data.meetingDate);
  const isNewlyPublished = parsed.data.status === "PUBLISHED" && existing.status !== "PUBLISHED";

  await prisma.meeting.update({
    where: { id },
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      meetingDate,
      year: meetingDate.getFullYear(),
      status: parsed.data.status,
      publishedAt: isNewlyPublished ? new Date() : existing.publishedAt,
    },
  });

  revalidatePath("/meetings");
  revalidatePath(`/meetings/${id}`);
  return { success: true };
}

export async function setMeetingStatus(id: string, status: "DRAFT" | "PUBLISHED"): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing) return { error: "Meeting not found" };

  await prisma.meeting.update({
    where: { id },
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });

  revalidatePath("/meetings");
  return { success: true };
}

export async function deleteMeeting(id: string): Promise<ActionResult> {
  await requireAdmin();

  await prisma.meeting.delete({ where: { id } });

  revalidatePath("/meetings");
  return { success: true };
}
