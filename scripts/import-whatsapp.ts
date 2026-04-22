/**
 * CSV → Issue Tracker Import Script
 * ───────────────────────────────────
 * Reads a CSV file with columns: Title, Description, ImageFile, Category
 * Uploads each media file to Vercel Blob and creates an issue in the database.
 *
 * Usage:
 *   ts-node --project tsconfig.seed.json scripts/import-whatsapp.ts <csv-file> <media-folder> [options]
 *
 * Options:
 *   --wing <A|B|C|D>   Wing to tag on all imported issues (optional)
 *   --dry-run          Preview without writing anything
 *
 * Examples:
 *   ts-node --project tsconfig.seed.json scripts/import-whatsapp.ts ./processed_chat.csv ./whatsapp-media
 *   ts-node --project tsconfig.seed.json scripts/import-whatsapp.ts ./processed_chat.csv ./whatsapp-media --wing A --dry-run
 */

import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

// Load env — .env.production.local first (Vercel creds), then .env.local
dotenv.config({ path: path.resolve(".env.production.local") });
dotenv.config({ path: path.resolve(".env.local") });

const prisma = new PrismaClient();

// ─── CSV parser ───────────────────────────────────────────────────────────────

interface CsvRow {
  Title: string;
  Description: string;
  ImageFile: string;
  Category: string;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Parse a single CSV line respecting double-quoted fields
  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // Escaped quote inside a quoted field: ""
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]).map((h) => h.replace(/^"|"$/g, ""));
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.replace(/^"|"$/g, "") ?? "";
    });
    if (row.Title && row.ImageFile) {
      rows.push(row as unknown as CsvRow);
    }
  }

  return rows;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    mp4: "video/mp4", webm: "video/webm", mov: "video/mp4", "3gp": "video/mp4",
  };
  return map[ext] ?? "application/octet-stream";
}

function isVideo(filename: string): boolean {
  return /\.(mp4|webm|mov|3gp)$/i.test(filename);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2 || args.includes("--help")) {
    console.log([
      "",
      "  CSV → Issue Tracker Import",
      "",
      "  Usage:",
      "    ts-node --project tsconfig.seed.json scripts/import-whatsapp.ts <csv-file> <media-folder> [options]",
      "",
      "  CSV columns expected:  Title, Description, ImageFile, Category",
      "",
      "  Options:",
      "    --wing <letter>   Wing to tag all issues (e.g. A)",
      "    --dry-run         Preview without writing anything",
      "",
      "  Example:",
      "    ts-node --project tsconfig.seed.json scripts/import-whatsapp.ts ./processed_chat.csv ./whatsapp-media --wing A",
      "",
    ].join("\n"));
    process.exit(0);
  }

  const csvFile    = path.resolve(args[0]);
  const mediaDir   = path.resolve(args[1]);
  const wingArg    = args[findFlag(args, "--wing")];
  const dryRun     = args.includes("--dry-run");

  // Validate inputs
  if (!fs.existsSync(csvFile)) {
    console.error(`\n❌  CSV file not found: ${csvFile}\n`);
    process.exit(1);
  }
  if (!fs.existsSync(mediaDir)) {
    console.error(`\n❌  Media folder not found: ${mediaDir}\n`);
    process.exit(1);
  }

  // Parse CSV
  const rows = parseCsv(fs.readFileSync(csvFile, "utf8"));
  console.log(`\n📋  CSV rows     : ${rows.length}`);
  console.log(`📁  Media folder : ${mediaDir}`);
  if (wingArg) console.log(`🏢  Wing         : ${wingArg}`);
  if (dryRun)  console.log(`\n⚠️   DRY RUN — nothing will be written\n`);

  if (rows.length === 0) {
    console.error("\n❌  No valid rows found in CSV. Check the file has Title and ImageFile columns.\n");
    process.exit(1);
  }

  // ── Dry run: just preview ──────────────────────────────────────────────────
  if (dryRun) {
    console.log("─────────────────────────────────────────────────────────────\n");
    let missing = 0;
    rows.forEach((row, i) => {
      const filePath = path.join(mediaDir, row.ImageFile);
      const exists   = fs.existsSync(filePath);
      if (!exists) missing++;
      console.log(`  ${String(i + 1).padStart(3, " ")}. ${row.Title}`);
      console.log(`       File     : ${row.ImageFile} ${exists ? "✅" : "❌ NOT FOUND"}`);
      console.log(`       Category : ${row.Category}`);
      console.log(`       Desc     : ${row.Description.substring(0, 80)}${row.Description.length > 80 ? "…" : ""}\n`);
    });
    console.log(`─────────────────────────────────────────────────────────────`);
    console.log(`  Total : ${rows.length}  |  Missing media : ${missing}\n`);
    console.log(`Run without --dry-run to import.\n`);
    return;
  }

  // ── Real import ────────────────────────────────────────────────────────────

  // Load all active categories once
  const allCategories = await prisma.category.findMany({ where: { isActive: true } });
  const categoryMap   = new Map(allCategories.map((c) => [c.name.toLowerCase(), c]));

  // Admin user
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", approvalStatus: "APPROVED" } });
  if (!admin) {
    console.error("\n❌  No approved admin found. Run npm run db:seed first.\n");
    process.exit(1);
  }

  console.log(`\n👤  Admin : ${admin.name}\n`);

  let imported = 0, skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row      = rows[i];
    const num      = `[${String(i + 1).padStart(3, " ")}/${rows.length}]`;
    const filePath = path.join(mediaDir, row.ImageFile);

    // Check media file exists
    if (!fs.existsSync(filePath)) {
      console.log(`${num} ⚠️  Skipped (file not found) : ${row.ImageFile}`);
      skipped++;
      continue;
    }

    // Resolve category — fall back to first available if not matched
    const category =
      categoryMap.get(row.Category.toLowerCase()) ??
      allCategories[0];

    if (!category) {
      console.log(`${num} ⚠️  Skipped (no categories in DB) : ${row.Title}`);
      skipped++;
      continue;
    }

    if (!categoryMap.has(row.Category.toLowerCase())) {
      console.log(`${num} ⚠️  Category "${row.Category}" not found — using "${category.name}" instead`);
    }

    try {
      // Upload media to Vercel Blob
      process.stdout.write(`${num} ⬆️  Uploading ${row.ImageFile} … `);
      const buffer   = fs.readFileSync(filePath);
      const fileSize = fs.statSync(filePath).size;
      const blob     = await put(`issues/${Date.now()}-${row.ImageFile}`, buffer, {
        access:      "public",
        contentType: mimeType(row.ImageFile),
      });
      process.stdout.write("✅\n");

      // Create issue with attachment and status history
      const issue = await prisma.issue.create({
        data: {
          title:       row.Title,
          description: row.Description.length >= 10 ? row.Description : row.Description.padEnd(10, "."),
          status:      "PENDING",
          priority:    "MEDIUM",
          wing:        wingArg ?? null,
          categoryId:  category.id,
          createdById: admin.id,
          attachments: {
            create: {
              url:      blob.url,
              type:     isVideo(row.ImageFile) ? "VIDEO" : "IMAGE",
              filename: row.ImageFile,
              size:     fileSize,
            },
          },
          statusHistory: {
            create: {
              toStatus:    "PENDING",
              changedById: admin.id,
              note:        "Imported from CSV",
            },
          },
        },
      });

      console.log(`       ✅ Issue created : ${issue.id}`);
      imported++;
    } catch (err: any) {
      console.error(`${num} ❌  Failed for "${row.Title}": ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n─────────────────────────────────────────────────`);
  console.log(`✅  Imported : ${imported}`);
  if (skipped) console.log(`⚠️   Skipped  : ${skipped}`);
  console.log(`─────────────────────────────────────────────────\n`);
}

function findFlag(arr: string[], flag: string): number {
  const i = arr.indexOf(flag);
  return i === -1 ? -1 : i + 1;
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
