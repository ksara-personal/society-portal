"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

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
