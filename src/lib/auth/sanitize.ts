/**
 * Guess whether an error string is a raw technical message (an exception type,
 * an HTTP status, a stack fragment) rather than something a person should read.
 *
 * Backend messages are Bangla-first and already human; the guard exists so a
 * stray `frappe.throw(exc)` / traceback / `HTTP 502` can never be shown. Any
 * message that carries Bangla (or another non-Latin script) is treated as human
 * copy and always passes.
 */
const TECHNICAL_PATTERN =
  /(exception|traceback|doctype|attributeerror|typeerror|authenticationerror|validationerror|ratelimitexceedederror|rate_limit|http\s*\d{3}|\b5\d{2}\b|otp_invalid|otp_expired|not_configured|upstream_|_error\b|\b(error|failed|invalid|denied)\b\s*:|undefined|\bnull\b|<[^>]+>)/i;

const NON_LATIN = /[^\u0000-\u024f\s]/;

export function looksTechnical(message: string): boolean {
  const value = (message ?? "").trim();
  if (!value) return false;
  // Bangla (and any non-Latin) copy is human-authored — never "technical".
  if (/[\u0980-\u09ff]/.test(value)) return false;
  if (NON_LATIN.test(value) && !/[\u0000-\u007f]{3,}/.test(value)) return false;
  return TECHNICAL_PATTERN.test(value);
}
