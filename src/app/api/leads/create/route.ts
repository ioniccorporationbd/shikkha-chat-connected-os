import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { NewLeadCreated } from "@/lib/leads/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ditto the ERP endpoint's own caps — it re-validates every field. */
const MAX_TEXT = 5000;

/** Whitelisted keys only — anything else the browser sends is dropped here. */
const ALLOWED = [
  "salutation",
  "first_name",
  "last_name",
  "email",
  "mobile_no",
  "gender",
  "organization",
  "website",
  "no_of_employees",
  "territory",
  "annual_revenue",
  "industry",
  "company_description",
  "status",
  "lead_owner",
] as const;

/**
 * Same-origin proxy for the New-Lead form's **Create** action.
 *
 * POST -> leads.create_lead: inserts a real `CRM Lead` owned by the session
 * user, so the record lands where the team already looks — Desk ▸ CRM ▸ Leads
 * (`/crm/leads/view/list`). The endpoint enforces permissions and re-validates
 * every field; this proxy only forwards a whitelist.
 */
export async function POST(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  let body: { lead?: unknown; language?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonFail("A JSON body is required.", "validation_error", 400);
  }

  const raw = body.lead;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return jsonFail("The lead could not be read.", "validation_error", 400);
  }

  const source = raw as Record<string, unknown>;
  const lead: Record<string, string> = {};
  for (const key of ALLOWED) {
    const value = source[key];
    if (value === null || value === undefined) continue;
    lead[key] = String(value).slice(0, MAX_TEXT);
  }

  if (!(lead.first_name || "").trim()) {
    return jsonFail("First name is required.", "validation_error", 400);
  }

  const language = typeof body.language === "string" && body.language ? body.language : "bn";
  const result = await callFrappe<{ lead: NewLeadCreated }>(
    "shikkha_os.api.v1.leads.create_lead",
    { sid, httpMethod: "POST", body: { lead, language } }
  );

  if (!result.ok) {
    console.error(`[leads] create_lead failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
