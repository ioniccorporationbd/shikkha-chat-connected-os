import { callFrappe } from "@/lib/api/frappe";

/**
 * Best-effort mirror of a portal-side failure into the ERP **Error Log**
 * (`https://dash.shikkhachat.com/desk/error-log`).
 *
 * When the browser's call to the payment-history proxy failed - a missing
 * endpoint after a partial deploy, an upstream 502, an unexpected shape - the
 * cause is written to the ERP so the team sees it in the Desk rather than only
 * in a browser console. Never throws: logging must not break the request.
 *
 * `not_authenticated` / `not_permitted` are expected, actionable states and are
 * skipped (they are already shown to the user).
 */
const SKIP_CODES = new Set(["not_authenticated", "not_permitted"]);

export async function reportPaymentError(
  sid: string,
  message: string,
  context: string,
  code?: string
): Promise<void> {
  if (code && SKIP_CODES.has(code)) return;

  try {
    await callFrappe("shikkha_os.api.v1.payment_entry.report_error", {
      sid,
      httpMethod: "POST",
      body: { message, context },
    });
  } catch {
    /* best-effort: nothing to do if even the logger is unreachable */
  }
}
