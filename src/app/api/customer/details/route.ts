import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { CustomerDetails } from "@/lib/customer/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for one owned Customer's prefill values (the edit form).
 *
 * The `name` is forwarded to the ERP, which verifies the caller created the
 * document before returning anything — a name typed into the browser can never
 * reach another creator's record.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const params = new URL(request.url).searchParams;
  const name = params.get("name") || "";
  if (!name) return jsonFail("A customer name is required.", "validation_error", 200);

  const forwarded = new URLSearchParams({ name, language: params.get("language") || "bn" });
  const method = `shikkha_os.api.v1.customer.details?${forwarded.toString()}`;

  const result = await callFrappe<CustomerDetails>(method, { sid });

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
