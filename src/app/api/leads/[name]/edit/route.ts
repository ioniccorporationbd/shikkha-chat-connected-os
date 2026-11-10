import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ditto the ERP's own guard — the endpoint enforces the real whitelist. */
const MAX_FIELD_LENGTH = 1000;
const MAX_FIELDS = 20;

/**
 * Same-origin proxy for the Data tab's **Edit** action.
 *
 * POST -> leads.update_lead: writes only the fields the ERP endpoint allows
 * (first_name, last_name, email, organization, phone, …), so the portal can
 * never touch a column the endpoint does not list. Permission is the lead's
 * own write permission — a caller who may not edit the record gets the
 * endpoint's 403, not a silent no-op.
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

  let body: { updates?: unknown; language?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonFail("A JSON body is required.", "validation_error", 400);
  }

  const raw = body.updates;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return jsonFail("The changes could not be read.", "validation_error", 400);
  }

  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length === 0) {
    return jsonFail("There is nothing to save.", "validation_error", 400);
  }
  if (entries.length > MAX_FIELDS) {
    return jsonFail("Too many fields were sent at once.", "validation_error", 400);
  }

  const updates: Record<string, string> = {};
  for (const [field, value] of entries) {
    if (typeof field !== "string" || !field.trim()) {
      return jsonFail("The changes could not be read.", "validation_error", 400);
    }
    const text = value === null || value === undefined ? "" : String(value);
    if (text.length > MAX_FIELD_LENGTH) {
      return jsonFail("A field value is too long.", "validation_error", 400);
    }
    updates[field] = text;
  }

  const language = typeof body.language === "string" && body.language ? body.language : "bn";
  const query = new URLSearchParams({ name: leadName, language });
  // `name` rides in the body as well: Frappe binds a POST's kwargs from the
  // request body only, so a query-string name never reaches the endpoint.
  const result = await callFrappe<{ updated: Record<string, string> }>(
    `shikkha_os.api.v1.leads.update_lead?${query.toString()}`,
    { sid, httpMethod: "POST", body: { name: leadName, updates, language } }
  );

  if (!result.ok) {
    console.error(`[leads] update_lead failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
