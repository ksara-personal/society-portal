"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validators";

export async function getProfile() {
  const sessionUser = await requireAuth();
  return prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      wing: true,
      flatNo: true,
      role: true,
      approvalStatus: true,
      createdAt: true,
      _count: { select: { createdIssues: true } },
    },
  });
}

export async function updateProfile(formData: FormData) {
  const sessionUser = await requireAuth();

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    wing: formData.get("wing"),
    flatNo: formData.get("flatNo"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      wing: parsed.data.wing,
      flatNo: parsed.data.flatNo,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const sessionUser = await requireAuth();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  // Fetch the stored hash
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { password: true },
  });

  if (!user) return { error: "User not found" };

  const currentMatch = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!currentMatch) {
    return { error: "Current password is incorrect" };
  }

  if (parsed.data.newPassword === parsed.data.currentPassword) {
    return { error: "New password must be different from current password" };
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { password: hashed },
  });

  return { success: true };
}
