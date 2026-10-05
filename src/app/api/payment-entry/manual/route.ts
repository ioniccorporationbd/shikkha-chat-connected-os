import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type {
  ManualPaymentListPayload,
  ManualPaymentResult,
} from "@/lib/payment-entry/manual-payment/types";
import { reportPaymentError } from "@/lib/payment-entry/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the customer's own Manual Payment Requests.
 *
 * GET  -> manual_payment.list_mine (the ERP resolves the Customer from the
 *         session and filters by customer=that customer; the browser never
 *         talks to the ERP and can never ask about another customer).
 * POST -> manual_payment.create (a real Manual Payment Request row is written,
 *         status "Draft"; the proof image is stored privately by
 *         the ERP). The upload can be a few megabytes, so the timeout is raised.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const language = new URL(request.url).searchParams.get("language") || "bn";
  const method = `shikkha_os.api.v1.manual_payment.list_mine?language=${encodeURIComponent(language)}`;

  const result = await callFrappe<ManualPaymentListPayload>(method, { sid });

  if (!result.ok) {
    console.error(
      `[manual-payment] list_mine failed: status=${result.status} code=${result.code}`
    );
    await reportPaymentError(sid, result.message, "manual:list_mine", result.code);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}

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

  const result = await callFrappe<ManualPaymentResult>(
    "shikkha_os.api.v1.manual_payment.create",
    { sid, httpMethod: "POST", body, timeoutMs: 30_000 }
  );

  if (!result.ok) {
    console.error(
      `[manual-payment] create failed: status=${result.status} code=${result.code}`
    );
    // Validation / duplicate refusals are normal outcomes the user must see; only
    // genuinely unexpected failures are mirrored to the ERP Error Log.
    await reportPaymentError(sid, result.message, "manual:create", result.code);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
