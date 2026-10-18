/**
 * Small client-side id helper (attachments etc.).
 *
 * The mock store used to own this; the Help Desk now talks to the ERP, so the
 * only thing the UI still needs is a stable per-attachment id for React keys.
 */
export function uid(prefix = "id"): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${random}`;
}
