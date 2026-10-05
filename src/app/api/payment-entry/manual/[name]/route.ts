import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { ManualPaymentRecord } from "@/lib/payment-entry/manual-payment/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for one of the customer's own Manual Payment Requests.
 *
 * The `name` is passed straight through, but ownership is enforced on the ERP:
 * it refuses any request whose customer is not the logged-in customer, so a
 * name picked from the URL can never select someone else's request (or proof).
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ name: string }> }
) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const { name } = await context.params;
  if (!name) return jsonFail("A request name is required.", "validation_error", 200);

  const language = new URL(request.url).searchParams.get("language") || "bn";
  const forwarded = new URLSearchParams({ name, language });

  const result = await callFrappe<ManualPaymentRecord>(
    `shikkha_os.api.v1.manual_payment.details?${forwarded.toString()}`,
    { sid }
  );

  if (!result.ok) {
    console.error(
      `[manual-payment] details failed: status=${result.status} code=${result.code} name=${name}`
    );
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
