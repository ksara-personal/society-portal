"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  registerSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
} from "@/lib/validators";
import { maskEmail } from "@/lib/utils";
import { sendPasswordResetEmail } from "@/lib/mailer";

const RESET_CODE_EXPIRY_MINUTES = 15;
const MAX_RESET_ATTEMPTS = 5;

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

function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Starts the forgot-password flow: validates the email belongs to an active
 * account, emails a 6-digit code, and returns a masked version of the email
 * for display on the next step.
 */
export async function requestPasswordReset(email: string) {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user || !user.isActive) {
    return { error: "No active account found with this email address" };
  }

  const code = generateResetCode();
  const codeHash = await bcrypt.hash(code, 10);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        email: user.email,
        codeHash,
        expiresAt: new Date(Date.now() + RESET_CODE_EXPIRY_MINUTES * 60 * 1000),
      },
    }),
  ]);

  try {
    await sendPasswordResetEmail(user.email, user.name, code);
  } catch {
    return {
      error: "Failed to send the reset email. Please try again later or contact the admin.",
    };
  }

  return { success: true, maskedEmail: maskEmail(user.email) };
}

// Shared lookup used by both code verification and the final password reset step.
async function getValidResetToken(email: string, code: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Invalid or expired code" };

  const token = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!token) {
    return { error: "Code expired or invalid. Please request a new one." };
  }
  if (token.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: token.id } });
    return { error: "Code expired. Please request a new one." };
  }
  if (token.attempts >= MAX_RESET_ATTEMPTS) {
    await prisma.passwordResetToken.delete({ where: { id: token.id } });
    return { error: "Too many incorrect attempts. Please request a new code." };
  }

  const matches = await bcrypt.compare(code, token.codeHash);
  if (!matches) {
    await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_RESET_ATTEMPTS - token.attempts - 1;
    return {
      error:
        remaining > 0
          ? `Incorrect code. ${remaining} attempt(s) remaining.`
          : "Too many incorrect attempts. Please request a new code.",
    };
  }

  return { user, token };
}

export async function verifyResetCode(email: string, code: string) {
  const parsed = verifyResetCodeSchema.safeParse({ email, code });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const result = await getValidResetToken(parsed.data.email, parsed.data.code);
  if ("error" in result) return { error: result.error };

  return { success: true };
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string
) {
  const parsed = resetPasswordSchema.safeParse({
    email,
    code,
    newPassword,
    confirmPassword,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const result = await getValidResetToken(parsed.data.email, parsed.data.code);
  if ("error" in result) return { error: result.error };

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: result.user.id },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: result.user.id } }),
  ]);

  return { success: true };
}
