import nodemailer from "nodemailer";
import { BRANDING } from "@/config/branding";
import { renderEmailTemplate, escapeHtml } from "@/lib/email-template-renderer";

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

// Best-effort send for non-critical notifications — logs failures instead of throwing
// so registration/approval workflows never break because of an email/SMTP issue.
async function sendMailSafe(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  const to = Array.isArray(options.to) ? options.to.filter(Boolean).join(",") : options.to;
  if (!to) return;

  try {
    await sendMail({ ...options, to });
  } catch (err) {
    console.error(`[mailer] Failed to send "${options.subject}" to ${to}:`, err);
  }
}

function getAppUrl(path: string): string | null {
  const base = process.env.NEXTAUTH_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}${path}`;
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  code: string,
  expiryMinutes: number
) {
  const subject = `${BRANDING.communityName} — Password Reset Code`;
  const html = renderEmailTemplate("password-reset", {
    name: escapeHtml(name),
    communityName: BRANDING.communityName,
    expiryMinutes: String(expiryMinutes),
    code,
  });
  const text = `Your ${BRANDING.communityName} password reset code is ${code}. It expires in ${expiryMinutes} minutes. If you did not request this, ignore this email.`;

  await sendMail({ to, subject, html, text });
}

// Notifies all active admins that a new registration needs their review.
export async function sendAdminNewRegistrationEmail(
  adminEmails: string[],
  registrant: {
    name: string;
    email: string;
    phone?: string | null;
    wing?: string | null;
    flatNo?: string | null;
  }
) {
  const subject = `${BRANDING.communityName} — New Registration Pending Approval`;
  const details = [
    `<strong>Name:</strong> ${escapeHtml(registrant.name)}`,
    `<strong>Email:</strong> ${escapeHtml(registrant.email)}`,
    registrant.phone ? `<strong>Phone:</strong> ${escapeHtml(registrant.phone)}` : null,
    registrant.wing ? `<strong>Wing:</strong> ${escapeHtml(registrant.wing)}` : null,
    registrant.flatNo
      ? `<strong>${escapeHtml(BRANDING.unitLabel)}:</strong> ${escapeHtml(registrant.flatNo)}`
      : null,
  ]
    .filter(Boolean)
    .join("<br/>");
  const reviewUrl = getAppUrl("/admin/users");

  const html = renderEmailTemplate("admin-new-registration", {
    memberLabel: BRANDING.memberLabel.toLowerCase(),
    communityName: BRANDING.communityName,
    details,
    reviewLink: reviewUrl
      ? `<p><a href="${reviewUrl}" style="color: #2563eb;">Review pending registrations</a></p>`
      : "",
  });

  await sendMailSafe({ to: adminEmails, subject, html });
}

// Confirms to the registrant that their sign-up was received and is pending approval.
export async function sendRegistrationReceivedEmail(to: string, name: string) {
  const subject = `${BRANDING.communityName} — Registration Received`;
  const html = renderEmailTemplate("registration-received", {
    name: escapeHtml(name),
    communityName: BRANDING.communityName,
  });

  await sendMailSafe({ to, subject, html });
}

// Lets the user know their account was approved and they can now sign in.
export async function sendAccountApprovedEmail(to: string, name: string) {
  const subject = `${BRANDING.communityName} — Account Approved`;
  const loginUrl = getAppUrl("/login");
  const html = renderEmailTemplate("account-approved", {
    name: escapeHtml(name),
    communityName: BRANDING.communityName,
    loginLink: loginUrl
      ? `<p><a href="${loginUrl}" style="color: #2563eb;">Sign in to your account</a></p>`
      : "",
  });

  await sendMailSafe({ to, subject, html });
}

// Lets the user know their registration was not approved.
export async function sendAccountRejectedEmail(to: string, name: string) {
  const subject = `${BRANDING.communityName} — Registration Update`;
  const html = renderEmailTemplate("account-rejected", {
    name: escapeHtml(name),
    communityName: BRANDING.communityName,
  });

  await sendMailSafe({ to, subject, html });
}
