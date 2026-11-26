import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { CustomerDetailsPayload } from "@/lib/customer/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for one owned Customer's stored values.
 *
 * The browser names the Customer; the ERP decides whether the caller may see it
 * (the backend resolves the document through the session user's own Customers
 * before returning a single value), so the popup can never widen the scope.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const search = new URL(request.url).searchParams;
  const name = (search.get("name") || "").trim();
  if (!name) return jsonFail("A Customer name is required.", "invalid_request", 400);

  const language = search.get("language") || "bn";
  const method =
    `shikkha_os.api.v1.customer.details` +
    `?name=${encodeURIComponent(name)}&language=${encodeURIComponent(language)}`;

  const result = await callFrappe<CustomerDetailsPayload>(method, { sid });

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
