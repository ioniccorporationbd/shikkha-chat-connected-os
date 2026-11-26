import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the lead sheet's **Convert to Deal** action.
 *
 * GET  -> leads.get_deal_options: the CRM's Deal-status master (the coloured
 *         list shown in the popup) for the Status dropdown.
 * POST -> leads.convert_lead_to_deal: creates a real `CRM Deal`, plus its
 *         `CRM Contact` and `CRM Organization`, so the records land where the
 *         team already looks — CRM ▸ Deals / Contacts / Organizations.
 *         Only the chosen status is accepted from the browser; every other
 *         field is read server-side from the lead itself.
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

  const language = new URL(request.url).searchParams.get("language")?.trim() || "bn";
  const query = new URLSearchParams({ language });
  const result = await callFrappe(
    `shikkha_os.api.v1.leads.get_deal_options?${query.toString()}`,
    { sid }
  );

  if (!result.ok) {
    console.error(`[leads] get_deal_options failed: status=${result.status} code=${result.code}`);
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

  let body: { deal?: unknown; language?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonFail("A JSON body is required.", "validation_error", 400);
  }

  const raw = body.deal;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return jsonFail("The deal details could not be read.", "validation_error", 400);
  }

  const source = raw as Record<string, unknown>;
  const status = source.status === null || source.status === undefined ? "" : String(source.status).trim();

  // Whitelisted key only — the ERP reads everything else from the lead itself.
  const deal = { status };

  const language = typeof body.language === "string" && body.language ? body.language : "bn";
  const query = new URLSearchParams({ name: leadName, language });
  const result = await callFrappe(
    `shikkha_os.api.v1.leads.convert_lead_to_deal?${query.toString()}`,
    { sid, httpMethod: "POST", body: { name: leadName, deal, language } }
  );

  if (!result.ok) {
    console.error(`[leads] convert_lead_to_deal failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
