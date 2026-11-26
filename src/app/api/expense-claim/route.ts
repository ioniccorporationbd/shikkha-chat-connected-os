import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { ExpenseClaimCreateResult, ExpenseClaimListPayload } from "@/lib/expense-claim/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the employee's own Expense Claims.
 *
 * GET  -> list_mine (the ERP scopes the query to the logged-in employee)
 * POST -> create    (the ERP resolves the employee from the session, never the body)
 *
 * The browser never talks to the ERP directly and can never ask about another
 * employee: ownership lives entirely on the server.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const language = new URL(request.url).searchParams.get("language") || "bn";
  const method = `shikkha_os.api.v1.expense_claim.list_mine?language=${encodeURIComponent(language)}`;

  const result = await callFrappe<ExpenseClaimListPayload>(method, { sid });

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}

export async function POST(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  let body: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    body = {};
  }

  const result = await callFrappe<ExpenseClaimCreateResult>("shikkha_os.api.v1.expense_claim.create", {
    sid,
    httpMethod: "POST",
    body,
  });

  if (!result.ok) {
    if (result.status === 401) return clearSessionCookie(fromFrappeFailure(result));
    return fromFrappeFailure(result);
  }

  return jsonOk(result.data);
}
