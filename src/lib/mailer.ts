import nodemailer from "nodemailer";
import { BRANDING } from "@/config/branding";

let transporter: nodemailer.Transporter | null = null;

// Lazily builds the SMTP transport from env vars (configured in Vercel project settings).
function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      "Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD (and optionally SMTP_SECURE, SMTP_FROM_EMAIL, SMTP_FROM_NAME) environment variables."
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || BRANDING.communityName;

  await getTransporter().sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, code: string) {
  const subject = `${BRANDING.communityName} — Password Reset Code`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #111827;">Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>Use the code below to reset your ${BRANDING.communityName} account password. This code expires in 15 minutes.</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; background: #f3f4f6; border-radius: 8px; padding: 16px 0; margin: 24px 0;">
        ${code}
      </div>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  `;
  const text = `Your ${BRANDING.communityName} password reset code is ${code}. It expires in 15 minutes. If you did not request this, ignore this email.`;

  await sendMail({ to, subject, html, text });
}
