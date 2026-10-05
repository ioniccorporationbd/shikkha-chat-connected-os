import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { CustomerDeleteResult } from "@/lib/customer/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for deleting an owned Customer.
 *
 * The ERP verifies ownership + the delete permission and runs the standard
 * `frappe.delete_doc` flow, so a linked transaction (Sales Invoice / Order /
 * Payment Entry / ...) blocks the delete with a friendly message rather than a
 * raw exception.
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

  const result = await callFrappe<CustomerDeleteResult>("shikkha_os.api.v1.customer.delete", {
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
