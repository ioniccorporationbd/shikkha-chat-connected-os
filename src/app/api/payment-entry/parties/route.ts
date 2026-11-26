import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { PartyOptionsPayload } from "@/lib/staff-payment/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the party Link field on the Payment Entry form.
 *
 * GET ?party_type=Customer&txt=ta → search rows for that party type. The ERP
 * scopes results and refuses the call unless the caller may create a Payment
 * Entry.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const params = new URL(request.url).searchParams;
  const partyType = params.get("party_type") || "";
  if (!partyType) return jsonFail("A party type is required.", "invalid_request", 400);

  const language = params.get("language") || "bn";
  const txt = params.get("txt") || "";

  const query = new URLSearchParams({ party_type: partyType, language });
  if (txt.trim()) query.set("txt", txt.trim());

  const method = `shikkha_os.api.v1.staff_payment.party_options?${query.toString()}`;
  const result = await callFrappe<PartyOptionsPayload>(method, { sid });

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
