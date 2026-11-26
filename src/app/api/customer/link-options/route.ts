import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { CustomerLinkOptionsPayload } from "@/lib/customer/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for a Link field's data source.
 *
 * `doctype` must be a real Link target of the Customer DocType — the ERP checks
 * that allow-list before returning rows, so this cannot be used to probe
 * arbitrary DocTypes.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const params = new URL(request.url).searchParams;
  const doctype = params.get("doctype") || "";
  if (!doctype) return jsonFail("A target DocType is required.", "validation_error", 200);

  const forwarded = new URLSearchParams({ doctype });
  const txt = params.get("txt");
  if (txt) forwarded.set("txt", txt);
  forwarded.set("language", params.get("language") || "bn");

  const result = await callFrappe<CustomerLinkOptionsPayload>(
    `shikkha_os.api.v1.customer.link_options?${forwarded.toString()}`,
    { sid }
  );

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
