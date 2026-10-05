import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { CustomerListPayload } from "@/lib/customer/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the owner-scoped Customer list.
 *
 * The ERP resolves the caller from the session and returns only the Customers
 * whose `owner` is that user, so the browser can never widen the scope.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const language = new URL(request.url).searchParams.get("language") || "bn";
  const method = `shikkha_os.api.v1.customer.list_mine?language=${encodeURIComponent(language)}`;

  const result = await callFrappe<CustomerListPayload>(method, { sid });

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
