"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/session";
import { updateProfileSchema } from "@/lib/validators";

export async function getUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      wing: true,
      flatNo: true,
      phone: true,
      isActive: true,
      approvalStatus: true,
      approvedAt: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { createdIssues: true } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function getPendingUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    where: { approvalStatus: "PENDING" },
    select: {
      id: true,
      name: true,
      email: true,
      wing: true,
      flatNo: true,
      phone: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getUserById(userId: string) {
  await requireAdmin();
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      wing: true,
      flatNo: true,
      phone: true,
      isActive: true,
      approvalStatus: true,
      createdAt: true,
      _count: { select: { createdIssues: true } },
    },
  });
}

export async function updateUser(userId: string, formData: FormData) {
  await requireAdmin();

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    wing: formData.get("wing") || undefined,
    flatNo: formData.get("flatNo") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      wing: parsed.data.wing ?? null,
      flatNo: parsed.data.flatNo ?? null,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function getPendingUsersCount() {
  await requireAdmin();
  return prisma.user.count({ where: { approvalStatus: "PENDING" } });
}

export async function approveUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: {
      approvalStatus: "APPROVED",
      approvedAt: new Date(),
      isActive: true,
    },
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function rejectUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: {
      approvalStatus: "REJECTED",
      isActive: false,
    },
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await requireAdmin();

  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const hashed = await (await import("bcryptjs")).default.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function promoteToAdmin(userId: string) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN" },
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function demoteToResident(userId: string) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { role: "RESIDENT" },
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function getDailyLoginUsers() {
  await requireAdmin();

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);

  return prisma.user.findMany({
    where: {
      lastLoginAt: { gte: twoDaysAgo },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      wing: true,
      flatNo: true,
      lastLoginAt: true,
    },
    orderBy: { lastLoginAt: "desc" },
  });
}

export async function getResidents() {
  await requireAuth();
  return prisma.user.findMany({
    where: {
      approvalStatus: "APPROVED",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      wing: true,
      flatNo: true,
      isActive: true,
    },
    orderBy: [{ wing: "asc" }, { flatNo: "asc" }],
  });
}
