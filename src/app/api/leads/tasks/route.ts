import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { LeadTasksPayload } from "@/lib/leads/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the Leads ▸ Tasks board (`/crm/tasks/view/list`).
 *
 * GET -> crm_leads.list_tasks. The ERP resolves the caller from the session, so
 *       the caller's own CRM Task permissions decide which tasks come back — the
 *       portal never widens the scope, and the browser never talks to the ERP.
 *
 * Query: language, mine=1 (Assigned Tasks tab), assignee (User), task_type,
 *        window=today|week.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const params = new URL(request.url).searchParams;
  const language = params.get("language") || "bn";
  const mine = (params.get("mine") || "").trim();
  const assignee = (params.get("assignee") || "").trim();
  const taskType = (params.get("task_type") || "").trim();
  const window = (params.get("window") || "").trim();

  const query = new URLSearchParams({ language });
  if (mine === "1") query.set("mine", "1");
  if (assignee) query.set("assignee", assignee);
  if (taskType) query.set("task_type", taskType);
  if (window) query.set("window", window);

  const method = `shikkha_os.api.v1.leads.list_tasks?${query.toString()}`;
  const result = await callFrappe<LeadTasksPayload>(method, { sid });

  if (!result.ok) {
    console.error(`[leads:tasks] list_tasks failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
