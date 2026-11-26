/**
 * Static config for the customer "Make Payment" (manual) flow.
 *
 * Only UI constants and pure helpers live here — the **supported bank list now
 * comes from the backend** (`Supported Payment Bank` DocType via
 * `/api/payment-entry/manual/banks`), so no account data is hardcoded in the
 * bundle any more.
 */

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
