"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validators";

export async function registerUser(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    wing: formData.get("wing") || undefined,
    flatNo: formData.get("flatNo") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      phone: parsed.data.phone,
      wing: parsed.data.wing,
      flatNo: parsed.data.flatNo,
      approvalStatus: "PENDING",
    },
  });

  return { success: true };
}

/**
 * Returns the approval status for the given email.
 * Used by the login page to show a helpful message when sign-in fails.
 * Does NOT return any sensitive data — just the status string.
 */
export async function checkApprovalStatus(email: string): Promise<"PENDING" | "APPROVED" | "REJECTED" | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { approvalStatus: true },
  });
  return (user?.approvalStatus ?? null) as "PENDING" | "APPROVED" | "REJECTED" | null;
}
