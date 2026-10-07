/**
 * Human-friendly timestamps for the login history.
 *
 * Shows date + hour + minute, never seconds, e.g. `05 Oct 2026 · 10:45 AM`.
 * Bangla mode renders Bangla digits and month names. The formatting is pure
 * (no `Intl` locale data), so the server-rendered HTML and the client render
 * always agree — no hydration mismatch.
 */

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const BN_MONTHS = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];

function toBnDigits(text: string): string {
  return text.replace(/\d/g, (digit) => BN_DIGITS[Number(digit)]);
}

/** Parse Frappe's `YYYY-MM-DD HH:MM:SS[.ffffff]` (site-local, no zone). */
function parseFrappe(value: string): Date | null {
  if (!value) return null;

  const iso = value.replace(" ", "T").replace(/\.(\d{3})\d*$/, ".$1");
  const parsed = new Date(iso);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatLoginStamp(value: string, language: string): string {
  const date = parseFrappe(value);
  if (!date) return value;

  const bn = language !== "en";
  const day = String(date.getDate()).padStart(2, "0");
  const month = (bn ? BN_MONTHS : EN_MONTHS)[date.getMonth()];
  const year = String(date.getFullYear());

  const hours24 = date.getHours();
  const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minute = String(date.getMinutes()).padStart(2, "0");
  const suffix = hours24 < 12 ? "AM" : "PM";

  const dateText = `${day} ${month} ${year}`;
  const timeText = `${hour12}:${minute} ${suffix}`;

  return bn ? `${toBnDigits(dateText)} · ${toBnDigits(timeText)}` : `${dateText} · ${timeText}`;
}

/**
 * Today's date as a local `YYYY-MM-DD` calendar date.
 *
 * Reads the local calendar fields directly (never `toISOString()`), so a
 * Bangladesh user just after midnight never sees yesterday's/tomorrow's date
 * from a UTC shift. Safe to use as an `<input type="date">` value.
 */
export function todayLocalIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
