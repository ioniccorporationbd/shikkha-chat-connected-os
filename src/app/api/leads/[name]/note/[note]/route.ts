import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ditto the ERP endpoint's own caps — it re-validates everything. */
const MAX_TITLE = 140;
const MAX_CONTENT = 40000;

/** The only fields the note popup may save. */
const EDITABLE = ["title", "content"];

/**
 * Same-origin proxy for the Notes tab's per-note **details** popup.
 *
 * GET  -> leads.get_lead_note: one note's full HTML record (the row that was
 *         clicked only carries plain text), so the popup can edit it.
 * POST -> leads.update_lead_note: saves the edited title/content of one note
 *         already linked to this lead. Only the keys the popup actually sends
 *         are forwarded, so a partial save never blanks a field it did not touch.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ name: string; note: string }> }
) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const { name, note: noteParam } = await context.params;
  const leadName = (name || "").trim();
  const noteName = (noteParam || "").trim();
  if (!leadName) return jsonFail("A lead name is required.", "validation_error", 400);
  if (!noteName) return jsonFail("A note name is required.", "validation_error", 400);

  const language = (new URL(request.url).searchParams.get("language") || "bn").trim() || "bn";
  const query = new URLSearchParams({ name: leadName, note_name: noteName, language });
  const result = await callFrappe(
    `shikkha_os.api.v1.leads.get_lead_note?${query.toString()}`,
    { sid, httpMethod: "GET" }
  );

  if (!result.ok) {
    console.error(`[leads] get_lead_note failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ name: string; note: string }> }
) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const { name, note: noteParam } = await context.params;
  const leadName = (name || "").trim();
  const noteName = (noteParam || "").trim();
  if (!leadName) return jsonFail("A lead name is required.", "validation_error", 400);
  if (!noteName) return jsonFail("A note name is required.", "validation_error", 400);

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

  // Whitelisted keys only — anything else the browser sends is dropped here.
  const note: Record<string, string> = {};
  for (const field of EDITABLE) {
    if (!(field in source)) continue;
    note[field] = text(source[field]);
  }

  if (!Object.keys(note).length) {
    return jsonFail("Nothing to save.", "validation_error", 400);
  }

  if ("title" in note) {
    note.title = note.title.trim();
    if (!note.title) return jsonFail("Give the note a title.", "validation_error", 400);
    if (note.title.length > MAX_TITLE) {
      return jsonFail("The note title is too long.", "validation_error", 400);
    }
  }

  if ("content" in note && note.content.length > MAX_CONTENT) {
    return jsonFail("This note is too long to save.", "validation_error", 400);
  }

  const language = typeof body.language === "string" && body.language ? body.language : "bn";
  const query = new URLSearchParams({ name: leadName, note_name: noteName, language });
  // `name` / `note_name` ride in the body as well: Frappe binds a POST's kwargs
  // from the request body only, so a query-string name never reaches the endpoint.
  const result = await callFrappe(
    `shikkha_os.api.v1.leads.update_lead_note?${query.toString()}`,
    { sid, httpMethod: "POST", body: { name: leadName, note_name: noteName, note, language } }
  );

  if (!result.ok) {
    console.error(`[leads] update_lead_note failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
