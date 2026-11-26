import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Caps mirror the ERP endpoint's own limits — it re-validates everything. */
const MAX_ADDRESSES = 20;
const MAX_ADDRESS = 320;
const MAX_SUBJECT = 140;
const MAX_CONTENT = 200_000;

function toList(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const out: string[] = [];
  for (const item of raw) {
    const addr = (item === null || item === undefined ? "" : String(item)).trim().slice(0, MAX_ADDRESS);
    if (addr && !out.includes(addr)) out.push(addr);
    if (out.length >= MAX_ADDRESSES) break;
  }
  return out;
}

/**
 * Same-origin proxy for the Emails tab's **New Email** composer.
 *
 * POST -> leads.send_lead_email: sends a real email through Frappe's mailer and
 * writes a linked `Communication` on the lead (`reference_doctype` /
 * `reference_name`), so the thread is the same one Desk and the Emails tab show.
 * `to` may be empty — the ERP endpoint falls back to the lead's own email
 * address. A missing outgoing Email Account surfaces as a clear 417 that points
 * the user at /desk/system/email-account.
 */
export async function POST(request: Request, context: { params: Promise<{ name: string }> }) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const { name } = await context.params;
  const leadName = (name || "").trim();
  if (!leadName) return jsonFail("A lead name is required.", "validation_error", 400);

  let body: { email?: unknown; language?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonFail("A JSON body is required.", "validation_error", 400);
  }

  const raw = body.email;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return jsonFail("The email could not be read.", "validation_error", 400);
  }

  const source = raw as Record<string, unknown>;
  const text = (value: unknown) => (value === null || value === undefined ? "" : String(value)).trim();

  const content = text(source.content);
  if (!content) return jsonFail("Write the email body.", "validation_error", 400);

  // Whitelisted keys only — anything else the browser sends is dropped here.
  const email = {
    to: toList(source.to),
    cc: toList(source.cc),
    bcc: toList(source.bcc),
    subject: text(source.subject).slice(0, MAX_SUBJECT),
    content: content.slice(0, MAX_CONTENT),
  };

  const language = typeof body.language === "string" && body.language ? body.language : "bn";
  const query = new URLSearchParams({ name: leadName, language });
  // `name` rides in the body too: Frappe binds a POST's kwargs from the request
  // body only, so a query-string name never reaches the endpoint.
  const result = await callFrappe(
    `shikkha_os.api.v1.leads.send_lead_email?${query.toString()}`,
    { sid, httpMethod: "POST", body: { name: leadName, email, language } }
  );

  if (!result.ok) {
    console.error(`[leads] send_lead_email failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
