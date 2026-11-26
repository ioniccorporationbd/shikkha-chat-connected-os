import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { PaymentEntryFormContext } from "@/lib/staff-payment/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the staff Payment Entry form catalogue.
 *
 * Returns the payment types, party types, enabled Modes of Payment (with their
 * resolved ledger accounts) and the Bank/Cash transfer accounts. The ERP only
 * answers for a caller allowed to create a Payment Entry.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const language = new URL(request.url).searchParams.get("language") || "bn";
  const method = `shikkha_os.api.v1.staff_payment.form_context?language=${encodeURIComponent(language)}`;

  const result = await callFrappe<PaymentEntryFormContext>(method, { sid });

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
