import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { LeadDetailPayload } from "@/lib/leads/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_COMMENT_LENGTH = 5000;

/**
 * Same-origin proxy for one CRM lead (`View details` on `/userDashboard/leads`).
 *
 * GET  -> leads.lead_detail: the lead's fields plus its desk timeline (comments,
 *         notes, e-mails, calls, tasks, attachments). `frappe.has_permission`
 *         decides visibility — a lead the caller may not read is a clean 403,
 *         never an empty page.
 * POST -> leads.add_lead_comment: the Desk comment box, guarded by the same read
 *         permission, so replying here writes exactly what Desk would write.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ name: string }> }
) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const { name } = await context.params;
  const leadName = (name || "").trim();
  if (!leadName) return jsonFail("A lead name is required.", "validation_error", 400);

  const params = new URL(request.url).searchParams;
  const language = params.get("language") || "bn";

  const query = new URLSearchParams({ name: leadName, language });
  const result = await callFrappe<LeadDetailPayload>(
    `shikkha_os.api.v1.leads.lead_detail?${query.toString()}`,
    { sid }
  );

  if (!result.ok) {
    console.error(`[leads] lead_detail failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ name: string }> }
) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const { name } = await context.params;
  const leadName = (name || "").trim();
  if (!leadName) return jsonFail("A lead name is required.", "validation_error", 400);

  let body: { content?: unknown; language?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonFail("A JSON body is required.", "validation_error", 400);
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) return jsonFail("The comment cannot be empty.", "validation_error", 400);
  if (content.length > MAX_COMMENT_LENGTH) {
    return jsonFail("The comment is too long.", "validation_error", 400);
  }

  const language = typeof body.language === "string" && body.language ? body.language : "bn";
  const query = new URLSearchParams({ name: leadName, language });
  const result = await callFrappe<{ comment: unknown }>(
    `shikkha_os.api.v1.leads.add_lead_comment?${query.toString()}`,
    { sid, httpMethod: "POST", body: { content } }
  );

  if (!result.ok) {
    console.error(`[leads] add_lead_comment failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
