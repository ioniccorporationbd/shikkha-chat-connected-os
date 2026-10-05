/**
 * Bangladesh mobile number — display normalisation.
 *
 * An ERP account can store the number in several shapes (`+8801…`, `8801…`,
 * `01…`, sometimes with spaces or dashes). The Overview always shows the local
 * `01XXXXXXXXX` form, no matter which shape was stored — the stored value is
 * never mutated. A value that is not a recognisable BD mobile is returned
 * unchanged (never invented).
 */

const BD_LOCAL = /^01\d{9}$/; // 11 digits — 01 + 9
const BD_NATIONAL = /^1\d{9}$/; // 10 digits — national form without the leading 0

export function formatBdMobile(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;

  let local = digits;
  if (local.startsWith("880")) local = local.slice(3);
  else if (local.startsWith("88")) local = local.slice(2);

  if (BD_LOCAL.test(local)) return local;
  if (BD_NATIONAL.test(local)) return `0${local}`;

  // Not a BD mobile number — leave it exactly as stored.
  return raw;
}
