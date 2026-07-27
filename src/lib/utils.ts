import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BUILDING_CONFIG } from "@/config/building";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Derived from BUILDING_CONFIG — do not hardcode here, edit src/config/building.ts
export const WINGS = BUILDING_CONFIG.wings.map((w) => w.name);
export type Wing = (typeof BUILDING_CONFIG.wings)[number]["name"];

/**
 * Returns padded flat numbers ("001", "002", …) for a given wing.
 * If wing is empty or not found, returns all flats across every wing.
 */
export function getFlatsForWing(wing?: string): string[] {
  const config = BUILDING_CONFIG.wings.find((w) => w.name === wing);
  if (config) {
    return Array.from(
      { length: config.flatEnd - config.flatStart + 1 },
      (_, i) => String(config.flatStart + i).padStart(3, "0")
    );
  }
  // No wing selected — return all flats as fallback
  return BUILDING_CONFIG.wings.flatMap((w) =>
    Array.from(
      { length: w.flatEnd - w.flatStart + 1 },
      (_, i) => String(w.flatStart + i).padStart(3, "0")
    )
  );
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatHours(hours: number | null): string {
  if (hours === null || hours === undefined) return "N/A";
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  OVERDUE: "Overdue",
  WAIVED: "Waived",
};
