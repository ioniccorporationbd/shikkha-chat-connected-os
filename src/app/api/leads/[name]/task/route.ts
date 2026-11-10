import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ditto the ERP endpoint's own caps — it re-validates everything. */
const MAX_TITLE = 140;
const MAX_DESCRIPTION = 5000;

/**
 * Same-origin proxy for the Tasks tab's **New task** form.
 *
 * POST -> leads.add_lead_task: creates a real `CRM Task` linked to the lead, so
 * the record lands where the team already looks — Desk ▸ CRM ▸ Tasks
 * (`/crm/tasks/view/list`). `assigned_to` is an HR Employee id; the ERP endpoint
 * resolves the employee's User itself, so no user id ever leaves the server.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ name: string }> }
) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const { name } = await context.params;
  const leadName = (name || "").trim();
  if (!leadName) return jsonFail("A lead name is required.", "validation_error", 400);

  let body: { task?: unknown; language?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonFail("A JSON body is required.", "validation_error", 400);
  }

  const raw = body.task;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return jsonFail("The task could not be read.", "validation_error", 400);
  }

  const source = raw as Record<string, unknown>;
  const text = (value: unknown) => (value === null || value === undefined ? "" : String(value));

  const title = text(source.title).trim();
  if (!title) return jsonFail("Give the task a title.", "validation_error", 400);
  if (title.length > MAX_TITLE) {
    return jsonFail("The task title is too long.", "validation_error", 400);
  }

  const description = text(source.description).trim();
  if (description.length > MAX_DESCRIPTION) {
    return jsonFail("The task description is too long.", "validation_error", 400);
  }

  // Whitelisted keys only — anything else the browser sends is dropped here.
  const task = {
    title,
    description,
    priority: text(source.priority).trim(),
    assigned_to: text(source.assigned_to).trim(),
    due_date: text(source.due_date).trim(),
  };

  const language = typeof body.language === "string" && body.language ? body.language : "bn";
  const query = new URLSearchParams({ name: leadName, language });
  // `name` rides in the body as well: Frappe binds a POST's kwargs from the
  // request body only, so a query-string name never reaches the endpoint.
  const result = await callFrappe(
    `shikkha_os.api.v1.leads.add_lead_task?${query.toString()}`,
    { sid, httpMethod: "POST", body: { name: leadName, task, language } }
  );

  if (!result.ok) {
    console.error(`[leads] add_lead_task failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
