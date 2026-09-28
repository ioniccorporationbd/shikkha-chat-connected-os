/**
 * Shared class strings for the auth surfaces.
 *
 * Per the project's CSS convention, layout/decoration live on the outer
 * element and every text/colour/typography utility lives on an inner element
 * (an unlayered reset otherwise beats Tailwind utilities on <a>/<button>).
 */

/** The "back to home" action, styled as a proper button (not a plain link). */
export const AUTH_HOME_BUTTON_CLASS =
  "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))] px-4 py-2.5 shadow-[0_10px_24px_-20px_color-mix(in_srgb,var(--color-primary)_75%,transparent)] transition duration-300 ease-out hover:-translate-y-[1px] hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_30%,var(--color-white))] hover:shadow-[0_16px_30px_-18px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]";

/** Inner content of the home button — carries the text colour. */
export const AUTH_HOME_INNER_CLASS =
  "inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-primary)]";

/**
 * Mask an email / mobile client-side. Used only as a fallback when the backend
 * did not return a masked destination; the real masking is always server-side.
 * A full address must never reach the UI, so this never returns the raw value.
 */
export function maskIdentity(value: string): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  if (raw.includes("@")) {
    const [local, domain = ""] = raw.split("@");
    const maskedLocal =
      local.length <= 2
        ? `${local.slice(0, 1)}*`
        : `${local[0]}${"*".repeat(Math.max(1, local.length - 2))}${local.slice(-1)}`;
    return `${maskedLocal}@${domain}`;
  }

  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 4) return "*".repeat(digits.length || raw.length);
  return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
}
