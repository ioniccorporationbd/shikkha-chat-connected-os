import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ditto the ERP endpoint's own caps — it re-validates everything. */
const MAX_TITLE = 140;
const MAX_DESCRIPTION = 5000;

/** CRM Task's own statuses; anything else is dropped (the ERP keeps the old one). */
const TASK_STATUSES = ["Backlog", "Todo", "In Progress", "Done", "Cancelled"];

/** The only fields the detail popup may save. */
const EDITABLE = ["title", "description", "priority", "status", "assigned_to", "due_date"];

/**
 * Same-origin proxy for the Tasks tab's **details** popup.
 *
 * POST -> leads.update_lead_task: saves the edited fields of one `CRM Task`
 * that is already linked to this lead. Only the keys the popup actually sends
 * are forwarded, so saving never blanks a field the form did not touch.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ name: string; task: string }> }
) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const { name, task: taskParam } = await context.params;
  const leadName = (name || "").trim();
  const taskName = (taskParam || "").trim();
  if (!leadName) return jsonFail("A lead name is required.", "validation_error", 400);
  if (!taskName) return jsonFail("A task name is required.", "validation_error", 400);

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

  // Whitelisted keys only — anything else the browser sends is dropped here.
  const task: Record<string, string> = {};
  for (const field of EDITABLE) {
    if (!(field in source)) continue;
    task[field] = text(source[field]).trim();
  }

  if (!Object.keys(task).length) {
    return jsonFail("Nothing to save.", "validation_error", 400);
  }

  if ("title" in task) {
    if (!task.title) return jsonFail("Give the task a title.", "validation_error", 400);
    if (task.title.length > MAX_TITLE) {
      return jsonFail("The task title is too long.", "validation_error", 400);
    }
  }

  if ("description" in task && task.description.length > MAX_DESCRIPTION) {
    return jsonFail("The task description is too long.", "validation_error", 400);
  }

  if ("status" in task && task.status) {
    const match = TASK_STATUSES.find((item) => item.toLowerCase() === task.status.toLowerCase());
    if (match) task.status = match;
    else delete task.status;
  }

  const language = typeof body.language === "string" && body.language ? body.language : "bn";
  const query = new URLSearchParams({ name: leadName, task_name: taskName, language });
  // `name` / `task_name` ride in the body as well: Frappe binds a POST's kwargs
  // from the request body only, so a query-string name never reaches the endpoint.
  const result = await callFrappe(
    `shikkha_os.api.v1.leads.update_lead_task?${query.toString()}`,
    { sid, httpMethod: "POST", body: { name: leadName, task_name: taskName, task, language } }
  );

  if (!result.ok) {
    console.error(`[leads] update_lead_task failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
