/**
 * Shared class strings for the auth surfaces.
 *
 * Per the project's CSS convention, layout/decoration live on the outer
 * element and every text/colour/typography utility lives on an inner element
 * (an unlayered reset otherwise beats Tailwind utilities on <a>/<button>).
 */

/** The "back to home" action — a solid dashboard-ink button with white text. */
export const AUTH_HOME_BUTTON_CLASS =
  "group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-deep-surface)] bg-[var(--color-deep-surface)] px-4 py-2.5 shadow-[0_14px_30px_-18px_color-mix(in_srgb,var(--color-primary)_80%,transparent)] transition duration-300 ease-out hover:-translate-y-[1px] hover:border-[var(--color-deep-surface-hover)] hover:bg-[var(--color-deep-surface-hover)] hover:shadow-[0_18px_34px_-18px_color-mix(in_srgb,var(--color-primary)_85%,transparent)]";

/** Inner content of the home button — white text on the dark-green surface. */
export const AUTH_HOME_INNER_CLASS =
  "inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)] transition-colors duration-300";

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
