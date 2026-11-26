import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { CheckinHistoryPayload } from "@/lib/checkin/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the employee's own check-in history.
 *
 * The ERP resolves the employee from the session and filters to that employee's
 * own `Employee Checkin` rows, so the browser never asks about another employee.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const params = new URL(request.url).searchParams;
  const language = params.get("language") || "bn";
  const days = params.get("days") || "10";
  const fromDate = (params.get("from_date") || "").trim();
  const toDate = (params.get("to_date") || "").trim();

  // Forward the explicit range when present; the backend validates it (and never
  // trusts a client-supplied employee — the employee is resolved server-side).
  const forwarded = new URLSearchParams({ language, days });
  if (fromDate) forwarded.set("from_date", fromDate);
  if (toDate) forwarded.set("to_date", toDate);
  const method = `shikkha_os.api.v1.checkin.history?${forwarded.toString()}`;

  const result = await callFrappe<CheckinHistoryPayload>(method, { sid });

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
