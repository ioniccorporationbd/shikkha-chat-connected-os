/** Small, UI-only helpers for the manual-payment forms. */

import { todayLocalIso } from "@/lib/format/datetime";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Convert Bangla digits (০-৯) to ASCII so Number()/regex validation works. */
export function toAsciiDigits(value: string): string {
  return value.replace(/[০-৯]/g, (digit) => String(BN_DIGITS.indexOf(digit)));
}

/** Today's date as a local `YYYY-MM-DD` (never the UTC day). */
export function todayISO(): string {
  return todayLocalIso();
}

/** Keep only digits from a typed value (for the mobile number). */
export function digitsOnly(value: string, max = 11): string {
  return toAsciiDigits(value).replace(/\D/g, "").slice(0, max);
}

/** Keep digits + a single decimal point (for the amount). */
export function amountInput(value: string): string {
  const cleaned = toAsciiDigits(value).replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
}
