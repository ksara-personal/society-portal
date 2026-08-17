import fs from "fs";
import path from "path";

const TEMPLATES_DIR = path.join(process.cwd(), "src/lib/email-templates");

// Each entry uses a fully literal path so bundlers/deploy tracing (Vercel) can
// detect and include the .html file at build time.
const TEMPLATES = {
  "password-reset": fs.readFileSync(path.join(TEMPLATES_DIR, "password-reset.html"), "utf-8"),
  "admin-new-registration": fs.readFileSync(
    path.join(TEMPLATES_DIR, "admin-new-registration.html"),
    "utf-8"
  ),
  "registration-received": fs.readFileSync(
    path.join(TEMPLATES_DIR, "registration-received.html"),
    "utf-8"
  ),
  "account-approved": fs.readFileSync(path.join(TEMPLATES_DIR, "account-approved.html"), "utf-8"),
  "account-rejected": fs.readFileSync(path.join(TEMPLATES_DIR, "account-rejected.html"), "utf-8"),
} as const;

export type EmailTemplateName = keyof typeof TEMPLATES;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Renders a template file by substituting {{key}} placeholders with the given values.
export function renderEmailTemplate(
  name: EmailTemplateName,
  vars: Record<string, string>
): string {
  return TEMPLATES[name].replace(/{{\s*(\w+)\s*}}/g, (_match, key: string) =>
    vars[key] !== undefined ? vars[key] : ""
  );
}
