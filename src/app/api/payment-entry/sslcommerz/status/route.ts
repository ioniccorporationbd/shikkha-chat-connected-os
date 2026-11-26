import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { SslcommerzStatusResult } from "@/lib/payment-entry/sslcommerz/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for one of the customer's own gateway transactions.
 *
 * POST -> sslcommerz.status. After SSLCommerz sends the browser back to the
 * portal, the success/fail page reads the FINAL status from the ERP database
 * here — never from the redirect query parameters.
 */
export async function POST(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  let body: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    body = {};
  }

  const result = await callFrappe<SslcommerzStatusResult>(
    "shikkha_os.api.v1.sslcommerz.status",
    { sid, httpMethod: "POST", body }
  );

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
