/**
 * Help Desk — small formatting helpers (dates, sizes, ids).
 *
 * Kept pure so they can be unit-tested and reused by list, card and details
 * views without duplicating locale logic.
 */

import type { TicketStatus } from "./types";

/**
 * Parse an ERP timestamp without guessing the timezone.
 *
 * Frappe stores `creation`/`modified` as a *naive* datetime in the site's
 * business timezone (Asia/Dhaka) — "2026-10-26 18:20:00". Handing that to
 * `new Date()` makes the browser read it in ITS OWN zone and then the Dhaka
 * formatter shifts it by the difference, so a UTC visitor saw 00:20 and a
 * Dhaka visitor saw 18:20 for the same row. Attaching the fixed +06:00 offset
 * (Dhaka has never observed DST) turns the wall clock the ERP recorded into
 * the instant it actually was, so every formatter below prints the time the
 * ticket was really created.
 *
 * Strings that already carry an offset or `Z` are respected as-is.
 */
export function parseErpTimestamp(iso: string): Date {
  const text = iso.trim();
  const naive = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
  if (naive.test(text)) {
    return new Date(`${text.replace(" ", "T")}+06:00`);
  }
  return new Date(text);
}

/** Uppercase the day-period token (`pm` -> `PM`) without touching the digits. */
function upperPeriod(text: string): string {
  return text.replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());
}

/** Render an ISO timestamp as a readable date (locale follows the language). */
export function formatDateTime(iso: string | undefined, language: string): string {
  if (!iso) return "—";
  const date = parseErpTimestamp(iso);
  if (Number.isNaN(date.getTime())) return "—";

  try {
    // Every timestamp in the Help Desk is shown in Asia/Dhaka — the site's
    // business timezone — so a browser set to UTC+0 and one set to Dhaka read
    // the same time, and the ERP's stored value is never shifted.
    return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "bn-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dhaka",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

/**
 * The list column stamp, e.g. `26/10/2026, 06:20 PM` — day/month/year and a
 * 12-hour clock, both from the ERP timestamp in Asia/Dhaka.
 */
export function formatDateTimeNumeric(iso: string | undefined, language: string): string {
  if (!iso) return "—";
  const date = parseErpTimestamp(iso);
  if (Number.isNaN(date.getTime())) return "—";

  try {
    return upperPeriod(
      new Intl.DateTimeFormat(language === "en" ? "en-GB" : "bn-BD", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Dhaka",
      }).format(date),
    );
  } catch {
    return date.toISOString().slice(0, 16).replace("T", " ");
  }
}

/** Render an ISO timestamp as a readable date only. */
export function formatDate(iso: string | undefined, language: string): string {
  if (!iso) return "—";
  const date = parseErpTimestamp(iso);
  if (Number.isNaN(date.getTime())) return "—";

  try {
    return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "bn-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Dhaka",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Time of day only, e.g. `08:10 PM` — the clock half of a chat-style stamp. */
export function formatTime(iso: string | undefined, language: string): string {
  if (!iso) return "";
  const date = parseErpTimestamp(iso);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "bn-BD", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dhaka",
    }).format(date);
  } catch {
    return date.toISOString().slice(11, 16);
  }
}

/** Time shown inside a chat bubble footer, e.g. `08:10 PM`. */
export function formatBubbleTime(iso: string, language: string): string {
  return formatTime(iso, language);
}

/** Day the timestamp belongs to in Asia/Dhaka, as `YYYY-MM-DD`. */
function dhakaDayKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Dhaka",
  }).format(date);
  return parts; // en-CA renders as YYYY-MM-DD
}

/**
 * Separator label for a chat day: Today / Yesterday, otherwise a short date.
 * The comparison uses the site business timezone, not the browser's.
 */
export function formatChatDay(iso: string | undefined, language: string): string {
  if (!iso) return "—";
  const date = parseErpTimestamp(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const key = dhakaDayKey(date);
  const now = Date.now();
  if (key === dhakaDayKey(new Date(now))) return language === "en" ? "Today" : "আজ";
  if (key === dhakaDayKey(new Date(now - 86_400_000))) return language === "en" ? "Yesterday" : "গতকাল";

  try {
    // Carry the year so an old thread reads "১৮ অক্টোবর, ২০২৬" instead of a
    // bare day/month that could be any October.
    return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "bn-BD", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Dhaka",
    }).format(date);
  } catch {
    return key;
  }
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
