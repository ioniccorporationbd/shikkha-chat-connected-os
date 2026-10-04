/**
 * Help Desk — small formatting helpers (dates, sizes, ids).
 *
 * Kept pure so they can be unit-tested and reused by list, card and details
 * views without duplicating locale logic.
 */

import type { TicketStatus } from "./types";

/** Render an ISO timestamp as a readable date (locale follows the language). */
export function formatDateTime(iso: string | undefined, language: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  try {
    return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "bn-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

/** Render an ISO timestamp as a readable date only. */
export function formatDate(iso: string | undefined, language: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  try {
    return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "bn-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Absolute time for a conversation bubble (date + HH:mm). */
export function formatBubbleTime(iso: string, language: string): string {
  return formatDateTime(iso, language);
}

/** Human file size, e.g. `184 KB`. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Sort tickets newest-updated first. */
export function byUpdatedDesc<T extends { updatedAt: string }>(a: T, b: T): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

/** True when a status means the ticket is finished. */
export function isFinishedStatus(status: TicketStatus): boolean {
  return status === "resolved" || status === "closed";
}
