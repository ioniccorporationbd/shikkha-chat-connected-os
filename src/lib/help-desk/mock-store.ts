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

import type { Ticket } from "./types";

const STORAGE_KEY = "shikkha.helpdesk.tickets.v1";
/** Bump when the seed shape changes so stale demo data is refreshed. */
const SEED_VERSION = 3;

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

/** ISO time `minutes` ago. */
function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

/** ISO time `days` ago. */
function daysAgo(days: number): string {
  return minutesAgo(days * 24 * 60);
}

/**
 * A small, clearly-mock seed so the UI (list, conversation, resolved state,
 * ordered steps) can be exercised end to end. These are NOT production data.
 */
function buildSeedTickets(): Ticket[] {
  const demoContact = {
    name: "ডেমো রিপোর্টার",
    email: "customer@example.com",
    mobile: "01600000000",
    preferredContact: "email" as const,
  };

  const otpTicket: Ticket = {
    id: "HD-2026-00001",
    subject: "লগইন OTP পাওয়া যাচ্ছে না",
    category: "login",
    priority: "high",
    description: "লগইন করার সময় মোবাইলে OTP আসছে না, তাই অ্যাকাউন্টে ঢুকতে পারছি না।",
    status: "resolved",
    contact: { ...demoContact },
    relatedRoute: "/login",
    attachments: [],
    messages: [
      {
        id: "m-0001-1",
        author: "user",
        body: "আমি OTP পাচ্ছি না।",
        createdAt: daysAgo(3),
        statusChange: "open",
      },
      {
        id: "m-0001-2",
        author: "support",
        authorName: "রুমানা আক্তার",
        body: "আমরা আপনার নম্বর যাচাই করছি।",
        createdAt: daysAgo(3),
        statusChange: "in_progress",
      },
      {
        id: "m-0001-3",
        author: "support",
        authorName: "রুমানা আক্তার",
        body: "অনুগ্রহ করে নিচের ধাপগুলো অনুসরণ করে আবার চেষ্টা করুন।",
        steps: ["Logout করুন", "Browser cache clear করুন", "আবার login করুন"],
        createdAt: daysAgo(2),
      },
      {
        id: "m-0001-4",
        author: "support",
        authorName: "রুমানা আক্তার",
        body: "অনুগ্রহ করে পুনরায় OTP পাঠান। সমস্যাটি এখন সমাধান হয়েছে।",
        createdAt: daysAgo(2),
        statusChange: "resolved",
      },
    ],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
    resolvedAt: daysAgo(2),
    resolutionSummary: "নম্বর যাচাই করে OTP সমস্যা সমাধান হয়েছে; ব্যবহারকারী এখন সফলভাবে লগইন করতে পারছেন।",
    assignedAgent: "রুমানা আক্তার",
  };

  const paymentTicket: Ticket = {
    id: "HD-2026-00002",
    subject: "পেমেন্ট দেখাচ্ছে না",
    category: "payment",
    priority: "medium",
    description: "পেমেন্ট সম্পন্ন করেছি কিন্তু পেমেন্ট হিস্ট্রিতে কোনো এন্ট্রি দেখা যাচ্ছে না।",
    status: "in_progress",
    contact: { ...demoContact },
    relatedRoute: "/clientDashboard/payment-entry",
    attachments: [],
    messages: [
      {
        id: "m-0002-1",
        author: "user",
        body: "পেমেন্ট সফল হয়েছে কিন্তু হিস্ট্রিতে দেখা যাচ্ছে না।",
        createdAt: daysAgo(1),
        statusChange: "open",
      },
      {
        id: "m-0002-2",
        author: "support",
        authorName: "সাপোর্ট টিম",
        body: "আমরা আপনার পেমেন্ট রেকর্ড যাচাই করছি, অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।",
        createdAt: minutesAgo(300),
        statusChange: "in_progress",
      },
    ],
    createdAt: daysAgo(1),
    updatedAt: minutesAgo(300),
    assignedAgent: "সাপোর্ট টিম",
  };

  const expenseTicket: Ticket = {
    id: "HD-2026-00003",
    subject: "Expense Claim জমা দিতে পারছি না",
    category: "expense_claim",
    priority: "urgent",
    description: "এক্সপেন্স ক্লেইম ফর্মে জমা দিলে ত্রুটি দেখাচ্ছে, তাই খরচের দাবি পাঠাতে পারছি না।",
    status: "waiting_for_user",
    contact: { ...demoContact },
    relatedRoute: "/userDashboard/expense-claim/new",
    attachments: [],
    messages: [
      {
        id: "m-0003-1",
        author: "user",
        body: "এক্সপেন্স ক্লেইম জমা দিতে গেলে ত্রুটি আসছে।",
        createdAt: minutesAgo(120),
        statusChange: "open",
      },
      {
        id: "m-0003-2",
        author: "support",
        authorName: "সাপোর্ট টিম",
        body: "ত্রুটির একটি স্ক্রিনশট শেয়ার করতে পারবেন কি? তাতে দ্রুত সমাধান করা যাবে।",
        createdAt: minutesAgo(90),
        statusChange: "waiting_for_user",
      },
    ],
    createdAt: minutesAgo(120),
    updatedAt: minutesAgo(90),
    assignedAgent: "সাপোর্ট টিম",
  };

  return [otpTicket, paymentTicket, expenseTicket];
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

  const seeded = buildSeedTickets();
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
