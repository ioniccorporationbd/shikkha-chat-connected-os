import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ditto the ERP endpoint's own caps — it re-validates everything. */
const MAX_TITLE = 140;
const MAX_CONTENT = 40000;

/**
 * Same-origin proxy for the Notes tab's **New note** form.
 *
 * POST -> leads.add_lead_note: creates a real `FCRM Note` linked to the lead, so
 * the record lands where the team already looks — Desk ▸ CRM ▸ Notes
 * (`/crm/notes/view/list`). The content is the rich-text editor's HTML; the ERP
 * endpoint sanitises it before storing, and the body is capped here as well.
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

  let body: { note?: unknown; language?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonFail("A JSON body is required.", "validation_error", 400);
  }

  const raw = body.note;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return jsonFail("The note could not be read.", "validation_error", 400);
  }

  const source = raw as Record<string, unknown>;
  const text = (value: unknown) => (value === null || value === undefined ? "" : String(value));

  const title = text(source.title).trim();
  if (!title) return jsonFail("Give the note a title.", "validation_error", 400);
  if (title.length > MAX_TITLE) {
    return jsonFail("The note title is too long.", "validation_error", 400);
  }

  const content = text(source.content).trim();
  if (content.length > MAX_CONTENT) {
    return jsonFail("The note is too long.", "validation_error", 400);
  }

  // Whitelisted keys only — anything else the browser sends is dropped here.
  const note = { title, content };

  const language = typeof body.language === "string" && body.language ? body.language : "bn";
  const query = new URLSearchParams({ name: leadName, language });
  // `name` rides in the body as well: Frappe binds a POST's kwargs from the
  // request body only, so a query-string name never reaches the endpoint.
  const result = await callFrappe(
    `shikkha_os.api.v1.leads.add_lead_note?${query.toString()}`,
    { sid, httpMethod: "POST", body: { name: leadName, note, language } }
  );

  if (!result.ok) {
    console.error(`[leads] add_lead_note failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
