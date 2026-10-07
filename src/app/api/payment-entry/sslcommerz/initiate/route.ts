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
