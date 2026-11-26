import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { LeadFormOptions } from "@/lib/leads/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the New-Lead form's dropdowns.
 *
 * GET -> leads.lead_form_options: salutations, genders, statuses, employee
 *        bands and Lead Owners (Active employees mapped to a Desk User). The
 *        ERP resolves the caller from the session, so the browser never talks
 *        to the ERP directly.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const language = new URL(request.url).searchParams.get("language") || "bn";
  const query = new URLSearchParams({ language });
  const result = await callFrappe<LeadFormOptions>(
    `shikkha_os.api.v1.leads.lead_form_options?${query.toString()}`,
    { sid }
  );

  if (!result.ok) {
    console.error(`[leads] lead_form_options failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
