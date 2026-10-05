/**
 * Static config for the customer "Make Payment" (manual) flow.
 *
 * Everything here is deliberately ISOLATED: it is the single place the manual
 * payment UI reads its constants and receive-details from, so wiring it to the
 * real backend later (site-config key or DocType) is a change confined to this
 * file — no component hardcodes any of it.
 */

import type { SupportedBank } from "./types";

/** Largest proof image the picker accepts (bytes). */
export const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 MB
export const PROOF_MAX_LABEL = "5 MB";

/** `accept` attribute for the <input type="file">. */
export const PROOF_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";

/** MIME types the picker treats as a valid proof image. */
export const PROOF_MIME_ALLOWED = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/** Extension allow-list (some browsers report an empty MIME for screenshots). */
export const PROOF_EXT_ALLOWED = [".jpg", ".jpeg", ".png", ".webp"];

/** Bangladesh mobile shape: 11 digits, 01[3-9]XXXXXXXX (bKash / Rocket). */
export const BD_MOBILE_PATTERN = /^01[3-9]\d{8}$/;

/** Strip spaces / dashes / +880 so a pasted number validates. */
export function normalizeMobile(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 13 && digits.startsWith("880")) return `0${digits.slice(3)}`;
  if (digits.length === 14 && digits.startsWith("0880")) return `0${digits.slice(4)}`;
  return digits;
}

/** True when a File looks like an accepted proof image (by MIME or extension). */
export function isAllowedProofFile(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  if (PROOF_MIME_ALLOWED.includes(type)) return true;
  const lower = file.name.toLowerCase();
  return PROOF_EXT_ALLOWED.some((ext) => lower.endsWith(ext));
}

/** Human-readable size (e.g. "1.2 MB"). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * SUPPORTED BANKS — receive-details the customer transfers to.
 *
 * ⚠️ These are PLACEHOLDER / DEMO values for the current UI phase. They are NOT
 * real production accounts and must never be used as the source of truth for an
 * actual transfer. The UI renders a visible "demo data" note whenever
 * `is_placeholder` is set. When the backend lands, this array is replaced by a
 * read of an isolated config source (site-config key such as
 * `shikkha_manual_payment_banks`, or a DocType) and deleted from the bundle.
 */
export const SUPPORTED_BANKS: SupportedBank[] = [
  {
    id: "dbbl",
    bank_name: "Dutch-Bangla Bank",
    account_name: "Shikkha Chat Limited",
    account_number: "PLACEHOLDER-1101-00000000",
    branch: "Motijheel Branch",
    routing_number: "090000000",
    instructions: "Add the student/account reference exactly as shown.",
    is_placeholder: true,
  },
  {
    id: "brac",
    bank_name: "BRAC Bank",
    account_name: "Shikkha Chat Limited",
    account_number: "PLACEHOLDER-1501-00000000",
    branch: "Gulshan Branch",
    routing_number: "060000000",
    is_placeholder: true,
  },
  {
    id: "city",
    bank_name: "The City Bank",
    account_name: "Shikkha Chat Limited",
    account_number: "PLACEHOLDER-1401-00000000",
    branch: "Dhanmondi Branch",
    routing_number: "225000000",
    is_placeholder: true,
  },
  {
    id: "islami",
    bank_name: "Islami Bank Bangladesh",
    account_name: "Shikkha Chat Limited",
    account_number: "PLACEHOLDER-1251-00000000",
    branch: "Agrabad Branch",
    routing_number: "125000000",
    is_placeholder: true,
  },
  {
    id: "ebl",
    bank_name: "Eastern Bank",
    account_name: "Shikkha Chat Limited",
    account_number: "PLACEHOLDER-1011-00000000",
    branch: "Banani Branch",
    routing_number: "095000000",
    is_placeholder: true,
  },
  {
    id: "sonali",
    bank_name: "Sonali Bank",
    account_name: "Shikkha Chat Limited",
    account_number: "PLACEHOLDER-2001-00000000",
    branch: "Head Office Branch",
    routing_number: "200000000",
    is_placeholder: true,
  },
];

/** Look a supported bank up by its stable id. */
export function findBank(id: string | undefined): SupportedBank | null {
  if (!id) return null;
  return SUPPORTED_BANKS.find((bank) => bank.id === id) ?? null;
}
