import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ditto the ERP endpoint's own caps — it re-validates everything. */
const MAX_NUMBER = 50;
const MAX_DURATION = 20;

/** CRM Call Log's own enums; anything else is left for the ERP to default. */
const CALL_TYPES = ["Incoming", "Outgoing"];
const CALL_STATUSES = [
  "Initiated",
  "Ringing",
  "In Progress",
  "Completed",
  "Failed",
  "Busy",
  "No Answer",
  "Queued",
  "Canceled",
];

/**
 * Same-origin proxy for the Calls tab's **Log a Call** form.
 *
 * POST -> leads.add_lead_call_log: creates a real `CRM Call Log` linked to the
 * lead through `reference_doctype`/`reference_docname`, so the record lands
 * where the team already looks — Desk ▸ CRM ▸ Call Logs (`/crm/call-logs`).
 * `employee` is an HR Employee id; the ERP endpoint resolves the employee's
 * User itself for `caller`/`receiver`, so no user id ever leaves the server.
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

  let body: { call?: unknown; language?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonFail("A JSON body is required.", "validation_error", 400);
  }

  const raw = body.call;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return jsonFail("The call could not be read.", "validation_error", 400);
  }

  const source = raw as Record<string, unknown>;
  const text = (value: unknown) => (value === null || value === undefined ? "" : String(value)).trim();

  const type = CALL_TYPES.find((item) => item.toLowerCase() === text(source.type).toLowerCase());
  if (!type) return jsonFail("Choose the call type.", "validation_error", 400);

  const from = text(source.from).slice(0, MAX_NUMBER);
  const to = text(source.to).slice(0, MAX_NUMBER);
  if (!from) return jsonFail("Enter the From number.", "validation_error", 400);
  if (!to) return jsonFail("Enter the To number.", "validation_error", 400);

  const rawStatus = text(source.status);
  const status =
    CALL_STATUSES.find((item) => item.toLowerCase() === rawStatus.toLowerCase()) ?? "Initiated";

  // Whitelisted keys only — anything else the browser sends is dropped here.
  const call = {
    type,
    from,
    to,
    status,
    duration: text(source.duration).slice(0, MAX_DURATION),
    employee: text(source.employee),
  };

  const language = typeof body.language === "string" && body.language ? body.language : "bn";
  const query = new URLSearchParams({ name: leadName, language });
  // `name` rides in the body as well: Frappe binds a POST's kwargs from the
  // request body only, so a query-string name never reaches the endpoint.
  const result = await callFrappe(
    `shikkha_os.api.v1.leads.add_lead_call_log?${query.toString()}`,
    { sid, httpMethod: "POST", body: { name: leadName, call, language } }
  );

  if (!result.ok) {
    console.error(`[leads] add_lead_call_log failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
