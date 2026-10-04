import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { ExpenseClaimSchema } from "@/lib/expense-claim/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the New Expense Claim form schema.
 *
 * The ERP builds the field catalogue from its own Expense Claim / Expense Claim
 * Detail metadata, so the form always matches the installed schema. Only an
 * employee with create permission gets past the ERP's own check.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const language = new URL(request.url).searchParams.get("language") || "bn";
  const method = `shikkha_os.api.v1.expense_claim.form_schema?language=${encodeURIComponent(language)}`;

  const result = await callFrappe<ExpenseClaimSchema>(method, { sid });

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
