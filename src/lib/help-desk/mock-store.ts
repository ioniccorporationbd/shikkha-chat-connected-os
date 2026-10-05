/**
 * Help Desk — mock persistence layer.
 *
 * THERE IS NO BACKEND YET. Until a Frappe/ERPNext "Help Desk Ticket" DocType
 * (and its whitelist API) exists, tickets live entirely in the browser's
 * localStorage so the experience survives a refresh during a demo.
 *
 * This module is intentionally the ONLY place that touches storage. The UI and
 * `service.ts` talk to plain ticket objects; when a real backend lands, replace
 * the bodies here (or the service functions) with HTTP calls and nothing else
 * changes. No secrets, passwords or tokens are ever stored.
 */

import { buildDemoTickets, isHelpDeskDemoEnabled } from "./demo";
import type { Ticket } from "./types";

const STORAGE_KEY = "shikkha.helpdesk.tickets.v1";
/** Bump when the seed shape changes so stale demo data is refreshed. */
const SEED_VERSION = 4;

interface StoredShape {
  version: number;
  tickets: Ticket[];
}

/** True when running in the browser (localStorage is available). */
function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Id generator that works in both modern and older browsers. */
export function uid(prefix = "id"): string {
  const cryptoObj = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return `${prefix}-${cryptoObj.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Seed the demo ticket set — ONLY while demo mode is on (see ./demo.ts), so the
 * app can never fabricate tickets once a real Help Desk API exists.
 */
function seedTickets(): Ticket[] {
  return isHelpDeskDemoEnabled() ? buildDemoTickets() : [];
}

/** Read + parse the stored payload, or `null` if missing/corrupt. */
function readStorage(): StoredShape | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredShape;
    if (!parsed || !Array.isArray(parsed.tickets)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist the payload. Silently ignores quota/private-mode errors. */
function writeStorage(tickets: Ticket[]): void {
  if (!hasStorage()) return;
  try {
    const payload: StoredShape = { version: SEED_VERSION, tickets };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Private mode / quota exceeded — the in-memory copy still works this session.
  }
}

/**
 * Load all tickets, seeding the demo set on first run (or after a version
 * bump). Always returns a fresh array the caller may safely mutate.
 */
export function loadTickets(): Ticket[] {
  const stored = readStorage();
  if (stored && stored.version === SEED_VERSION) {
    return stored.tickets;
  }

  const seeded = seedTickets();
  writeStorage(seeded);
  return seeded;
}

/** Persist the full list. */
export function saveTickets(tickets: Ticket[]): void {
  writeStorage(tickets);
}

/** Allocate the next display id, e.g. `HD-2026-00004`. */
export function nextTicketId(existing: Ticket[]): string {
  const year = new Date().getFullYear();
  const prefix = `HD-${year}-`;
  let max = 0;
  for (const ticket of existing) {
    if (ticket.id.startsWith(prefix)) {
      const n = Number.parseInt(ticket.id.slice(prefix.length), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return `${prefix}${String(max + 1).padStart(5, "0")}`;
}

/** Normalise an email/mobile for lenient equality checks. */
export function normaliseContact(value: string | undefined | null): string {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/[\s()-]/g, "");
}
