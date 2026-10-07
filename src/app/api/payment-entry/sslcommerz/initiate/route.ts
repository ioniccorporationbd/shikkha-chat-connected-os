import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import { reportPaymentError } from "@/lib/payment-entry/report";
import type { SslcommerzInitiateResult } from "@/lib/payment-entry/sslcommerz/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the customer's own SSLCommerz session.
 *
 * POST -> sslcommerz.initiate (the ERP resolves the amount & customer, creates a
 * local gateway transaction and opens a real SSLCommerz sandbox session, then
 * returns the `GatewayPageURL`). The store password stays on the ERP and never
 * reaches this handler or the browser.
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

  // Capture the portal's real origin so the ERP returns the customer *here*
  // after the gateway round-trip, instead of a hard-coded host that may 404.
  const returnUrl = callerOrigin(request);
  if (returnUrl) body.return_url = returnUrl;

  const result = await callFrappe<SslcommerzInitiateResult>(
    "shikkha_os.api.v1.sslcommerz.initiate",
    { sid, httpMethod: "POST", body, timeoutMs: 30_000 }
  );

  if (!result.ok) {
    console.error(`[sslcommerz] initiate failed: status=${result.status} code=${result.code}`);
    await reportPaymentError(sid, result.message, "sslcommerz:initiate", result.code);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}

/**
 * The public origin of the portal page that started this payment.
 *
 * Prefers the browser's `Origin` / `Referer` and falls back to the forwarded
 * host. The ERP stores this and redirects the customer back to it after
 * SSLCommerz validates the payment, so the return never depends on a
 * hard-coded host.
 */
function callerOrigin(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin && /^https?:\/\//i.test(origin)) return origin;

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      /* ignore a malformed referer */
    }
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return "";
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}
