import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { SupportedBank } from "@/lib/payment-entry/manual-payment/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the enabled supported banks a customer can transfer to.
 *
 * Only enabled rows and public (non-accounting) fields are returned by the ERP,
 * so the selector can never see internal accounting data.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const result = await callFrappe<{ banks: SupportedBank[] }>(
    "shikkha_os.api.v1.manual_payment.supported_banks",
    { sid }
  );

  if (!result.ok) {
    console.error(
      `[manual-payment] supported_banks failed: status=${result.status} code=${result.code}`
    );
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
