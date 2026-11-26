import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { JournalEntryCreateInput } from "@/lib/journal-entry/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

/**
 * Create a Draft Journal Entry (docstatus 0) on the ERP's desk
 * (`/desk/accounts/journal-entry`) via the CORE `frappe.client.insert`. The
 * document's own server-side `validate` runs, so debit/credit balance, party
 * requirements for Payable/Receivable accounts and cost-centre rules are all
 * enforced by ERPNext — we only shape the payload.
 */
export async function POST(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonFail("Invalid request body.", "invalid_request", 400);
  }

  const data = (body?.data ?? body) as JournalEntryCreateInput;
  if (!data || !data.company) return jsonFail("A company is required.", "invalid_request", 400);
  if (!data.posting_date) return jsonFail("A posting date is required.", "invalid_request", 400);

  const rows = Array.isArray(data.accounts) ? data.accounts : [];
  const accounts = rows
    .filter((row) => row && row.account)
    .map((row) => {
      const line: Row = {
        account: row.account,
        debit_in_account_currency: Number(row.debit) || 0,
        credit_in_account_currency: Number(row.credit) || 0,
      };
      if (row.cost_center) line.cost_center = row.cost_center;
      if (row.party_type && row.party) {
        line.party_type = row.party_type;
        line.party = row.party;
      }
      return line;
    });

  if (accounts.length < 2) {
    return jsonFail("Add at least two account lines.", "invalid_request", 400);
  }

  const doc: Row = {
    doctype: "Journal Entry",
    voucher_type: data.voucher_type || "Journal Entry",
    company: data.company,
    posting_date: data.posting_date,
    multi_currency: 0,
    accounts,
  };
  if (data.title) doc.title = data.title;
  if (data.remark) doc.remark = data.remark;

  const result = await callFrappe<Row>("frappe.client.insert", {
    httpMethod: "POST",
    body: { doc },
    sid,
  });
  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  const created = (result.data ?? {}) as Row;
  return jsonOk({
    name: String(created.name ?? ""),
    docstatus: Number(created.docstatus ?? 0),
    voucher_type: String(created.voucher_type ?? doc.voucher_type),
    company: String(created.company ?? doc.company),
    posting_date: String(created.posting_date ?? doc.posting_date),
    total_debit: Number(created.total_debit ?? 0),
    total_credit: Number(created.total_credit ?? 0),
    currency: String(created.total_amount_currency ?? "BDT"),
  });
}
