import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for one Journal Entry's account lines (`frappe.client.get`),
 * used by the right-side history table's "বিস্তারিত দেখুন" popup.
 *
 * The list rows (`/api/journal-entry/list`) carry no party information — party
 * type + party live on the JE `accounts` child table — so the details popup
 * fetches them here on demand and shows them (plus keeps them in Print /
 * Download, which render the same detail sections).
 */

type Row = Record<string, unknown>;

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const url = new URL(request.url);
  const name = (url.searchParams.get("name") || "").trim();
  if (!name) return jsonFail("Missing journal entry name.", "invalid_argument", 400);

  const userRes = await callFrappe<unknown>("frappe.auth.get_logged_user", { sid });
  if (!userRes.ok) {
    const response = fromFrappeFailure(userRes);
    return userRes.status === 401 ? clearSessionCookie(response) : response;
  }
  const user = typeof userRes.data === "string" ? userRes.data : "";
  if (!user || user === "Guest") {
    const response = jsonFail("Please sign in to continue.", "not_authenticated", 401);
    return clearSessionCookie(response);
  }

  const params = new URLSearchParams();
  params.set("doctype", "Journal Entry");
  params.set("name", name);
  const docRes = await callFrappe<Row>(`frappe.client.get?${params.toString()}`, { sid });
  if (!docRes.ok) {
    const response = fromFrappeFailure(docRes);
    return docRes.status === 401 ? clearSessionCookie(response) : response;
  }

  const doc = docRes.data || {};
  const accounts = Array.isArray(doc.accounts) ? (doc.accounts as Row[]) : [];
  const lines = accounts.map((line) => ({
    account: str(line.account),
    party_type: str(line.party_type),
    party: str(line.party),
  }));

  return jsonOk({
    name: str(doc.name) || name,
    party_type: str(doc.party_type),
    party: str(doc.party),
    accounts: lines,
  });
}
