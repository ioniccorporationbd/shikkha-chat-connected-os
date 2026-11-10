import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { LeadsPayload } from "@/lib/leads/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the CRM lead board (`/userDashboard/leads`).
 *
 * GET -> crm_leads.list_leads. The ERP resolves the caller from the session and
 *       answers through `frappe.get_list`, so the caller's own CRM permissions
 *       (owner / sales-stage scoping) decide which leads come back — the portal
 *       never widens the scope, and the browser never talks to the ERP directly.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const params = new URL(request.url).searchParams;
  const language = params.get("language") || "bn";
  const search = (params.get("search") || "").trim();
  const status = (params.get("status") || "").trim();
  const start = (params.get("start") || "").trim();
  const limit = (params.get("limit") || "").trim();

  const query = new URLSearchParams({ language });
  if (search) query.set("search", search);
  if (status) query.set("status", status);
  if (start) query.set("start", start);
  if (limit) query.set("limit", limit);

  const method = `shikkha_os.api.v1.leads.list_leads?${query.toString()}`;
  const result = await callFrappe<LeadsPayload>(method, { sid });

  if (!result.ok) {
    // A method-not-found after a partial deploy / an upstream error must be
    // visible: server log now (the ERP Error Log pick-up is the caller's page).
    console.error(`[leads] list_leads failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
