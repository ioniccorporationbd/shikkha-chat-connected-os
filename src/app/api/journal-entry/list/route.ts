import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type {
  JournalEntryListResult,
  JournalEntryRow,
  JournalEntrySummary,
} from "@/lib/journal-entry/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the staff "জার্নাল এন্ট্রি তালিকা" history table.
 *
 * Reads straight from the ERP CORE API (`frappe.client.get_list`) on the
 * `Journal Entry` doctype — the same records the desk list
 * (`/desk/accounts/journal-entry`) shows — scoped to `owner == <logged-in user>`
 * so the table shows exactly the Journal Entries this employee created
 * (including the JEs auto-posted by their Payment Entries), newest first.
 * Permission-checked by the session cookie: get_list only returns rows the
 * signed-in user may Read.
 *
 * The row shape mirrors the payment-entry history table (`JournalEntryRow`) so
 * the panel renders the same columns/styles/statuses.
 */

type Row = Record<string, unknown>;

/**
 * Explicit field list — every name is a real `Journal Entry` column (verified
 * against the doctype). `docstatus`/`owner`/`creation` are Frappe standard
 * columns present on every table. A wrong field name would make get_list error
 * and the whole list arrive empty, so this stays on verified columns only.
 */
const LIST_FIELDS = [
  "name",
  "posting_date",
  "voucher_type",
  "title",
  "remark",
  "total_debit",
  "total_credit",
  "total_amount",
  "docstatus",
  "company",
  "cheque_no",
  "bill_no",
  "creation",
];

async function coreList(
  sid: string,
  fields: string[],
  orderBy: string,
  filters: unknown[] = []
) {
  const params = new URLSearchParams();
  params.set("doctype", "Journal Entry");
  params.set("fields", JSON.stringify(fields));
  if (filters.length) params.set("filters", JSON.stringify(filters));
  if (orderBy) params.set("order_by", orderBy);
  params.set("limit_page_length", "0");
  return callFrappe<Row[]>(`frappe.client.get_list?${params.toString()}`, { sid });
}

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(str(value) || "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Draft / Submitted / Cancelled derived from docstatus (JE has no status field). */
function displayStatus(row: Row): string {
  const docstatus = num(row.docstatus);
  if (docstatus === 2) return "Cancelled";
  if (docstatus === 1) return "Submitted";
  return "Draft";
}

export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  // Confirm the session maps to a real user before touching the doctype.
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

  const rowsRes = await coreList(sid, LIST_FIELDS, "posting_date desc, creation desc", [
    ["owner", "=", user],
  ]);
  if (!rowsRes.ok) {
    const response = fromFrappeFailure(rowsRes);
    return rowsRes.status === 401 ? clearSessionCookie(response) : response;
  }

  const records = Array.isArray(rowsRes.data) ? (rowsRes.data as Row[]) : [];
  const entries: JournalEntryRow[] = records
    .map((row) => {
      const debit = num(row.total_debit);
      const credit = num(row.total_credit);
      return {
        name: str(row.name),
        posting_date: str(row.posting_date),
        voucher_type: str(row.voucher_type),
        title: str(row.title),
        remark: str(row.remark),
        total_debit: debit,
        total_credit: credit,
        amount: num(row.total_amount) || debit || credit,
        status: displayStatus(row),
        docstatus: num(row.docstatus),
        company: str(row.company),
        currency: "BDT",
        cheque_no: str(row.cheque_no),
        bill_no: str(row.bill_no),
        creation: str(row.creation),
      };
    })
    .filter((row) => Boolean(row.name));

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let totalAmount = 0;
  let monthCount = 0;
  let monthAmount = 0;
  let submittedCount = 0;
  let submittedAmount = 0;
  for (const row of entries) {
    totalAmount += row.amount;
    if (row.posting_date.startsWith(monthPrefix)) {
      monthCount += 1;
      monthAmount += row.amount;
    }
    if (row.docstatus === 1) {
      submittedCount += 1;
      submittedAmount += row.amount;
    }
  }

  const summary: JournalEntrySummary = {
    total: entries.length,
    total_amount: totalAmount,
    this_month_count: monthCount,
    this_month_amount: monthAmount,
    submitted_count: submittedCount,
    submitted_amount: submittedAmount,
    latest_date: entries[0]?.posting_date || "",
    currency: "BDT",
  };

  const result: JournalEntryListResult = {
    doctype: "Journal Entry",
    entries,
    summary,
  };
  return jsonOk(result);
}
