import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { PaymentEntryListPayload } from "@/lib/payment-entry/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the customer's own submitted Payment Entries.
 *
 * GET -> list_mine (the ERP resolves the Customer from the session and filters
 *        the query by party=that customer, party_type="Customer", docstatus=1).
 *
 * The browser never talks to the ERP directly and can never ask about another
 * customer: ownership lives entirely on the server.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const language = new URL(request.url).searchParams.get("language") || "bn";
  const method = `shikkha_os.api.v1.payment_entry.list_mine?language=${encodeURIComponent(language)}`;

  const result = await callFrappe<PaymentEntryListPayload>(method, { sid });

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
