import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import { reportServiceError } from "@/lib/service-build/report";
import type { SalesInvoiceDetails } from "@/lib/service-build/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for one of the customer's own Sales Invoices.
 *
 * The `name` is passed straight through, but ownership is enforced on the
 * server: the ERP refuses any invoice whose customer is not the logged-in
 * customer (and any Cancelled invoice), so a name picked from the URL can never
 * select someone else's invoice.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ name: string }> }
) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const { name } = await context.params;
  if (!name) return jsonFail("An invoice name is required.", "validation_error", 200);

  const language = new URL(request.url).searchParams.get("language") || "bn";
  const forwarded = new URLSearchParams({ name, language });

  const result = await callFrappe<SalesInvoiceDetails>(
    `shikkha_os.api.v1.sales_invoice.details?${forwarded.toString()}`,
    { sid }
  );

  if (!result.ok) {
    console.error(
      `[service-build] details failed: status=${result.status} code=${result.code} name=${name}`
    );
    await reportServiceError(sid, result.message, `details:${name}`, result.code);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
