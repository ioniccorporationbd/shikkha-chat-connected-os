import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { CheckinPunchResult } from "@/lib/checkin/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for creating a real `Employee Checkin`.
 *
 * The ERP resolves the employee from the authenticated session (never from the
 * body), applies its own duplicate / permission rules on a standard `insert()`
 * and refuses a Guest, so a direct call cannot forge a check-in for anyone else.
 * ERPNext's validation message (already checked in, ...) reaches the UI as-is.
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

  const result = await callFrappe<CheckinPunchResult>("shikkha_os.api.v1.checkin.punch", {
    sid,
    httpMethod: "POST",
    body,
  });

  if (!result.ok) {
    if (result.status === 401) return clearSessionCookie(fromFrappeFailure(result));
    return fromFrappeFailure(result);
  }

  return jsonOk(result.data);
}
