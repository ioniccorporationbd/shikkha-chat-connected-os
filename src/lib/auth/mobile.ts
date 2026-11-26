/**
 * Bangladeshi mobile numbers as the sign-up form accepts them.
 *
 * The ERP is still the authority (registration.send_otp revalidates), but the
 * field itself must only ever hold digits: letters and symbols are dropped on
 * typing *and* on paste, so an invalid value can never reach the API.
 *
 * Accepted local form: 11 digits starting `01`, operator prefix 3-9
 * (`013`–`019`). A pasted `+8801XXXXXXXXX` / `8801XXXXXXXXX` is normalised to
 * the same local form the form already advertises (`01XXXXXXXXX`).
 */

/** Local BD mobile: 01 + operator digit (3-9) + 8 digits. */
export const BD_MOBILE_PATTERN = /^01[3-9]\d{8}$/;

const MAX_LOCAL_DIGITS = 11;

/**
 * Digits only, local form, never longer than 11 characters.
 *
 * Runs on every keystroke and on paste, which is what makes "you cannot type
 * or paste a letter / special character" true rather than merely validated
 * after the fact.
 */
export function sanitizeBdMobile(raw: string): string {
  let digits = (raw ?? "").replace(/\D+/g, "");

  // +880 / 880 country code. Only strip once the value is long enough to be a
  // whole international number, otherwise a caller typing "88..." digit by
  // digit would lose the leading digits as they go.
  if (digits.length >= 12 && digits.startsWith("880")) {
    digits = digits.slice(3);
  } else if (digits.length >= 12 && digits.startsWith("88")) {
    digits = digits.slice(2);
  }

  // A pasted 10-digit national number ("1712345678") gets its leading zero
  // back. Only for "1...", which is what a BD number looks like once the
  // country code is gone - never for a half-typed "880...".
  if (digits.length === 10 && digits.startsWith("1")) {
    digits = `0${digits}`;
  }

  return digits.slice(0, MAX_LOCAL_DIGITS);
}

/** True when the value is a complete, valid BD mobile number. */
export function isValidBdMobile(value: string): boolean {
  return BD_MOBILE_PATTERN.test((value ?? "").trim());
}
