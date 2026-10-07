/**
 * The stable colour tone for a Payment Entry status key. Shared so the chart
 * bar, its legend and the Payment Success page never drift apart on colour, and
 * so the success route does not pull the whole history view into its bundle.
 */
export function statusTone(key: string): string {
  switch (key) {
    case "paid":
      return "var(--color-success)";
    case "reconciled":
    case "received":
      return "color-mix(in srgb, var(--color-success) 72%, var(--color-white))";
    case "submitted":
      return "var(--color-primary)";
    case "draft":
      return "color-mix(in srgb, var(--color-primary) 42%, var(--color-white))";
    case "cancelled":
      return "var(--color-danger-strong)";
    default:
      return "color-mix(in srgb, var(--color-primary) 55%, var(--color-white))";
  }
}
