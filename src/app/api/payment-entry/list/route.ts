import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { PaymentEntryRow } from "@/lib/payment-entry/types";
import type { StaffPaymentEntryListResult } from "@/lib/staff-payment/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the staff "my Payment Entries" history table.
 *
 * Reads straight from the ERP CORE API (`frappe.client.get_list`) on the
 * `Payment Entry` doctype, scoped to `owner == <logged-in user>`, so the rows
 * are exactly the entries *this employee* created — the staff form's own Drafts
 * included. It does NOT depend on any custom whitelisted method being deployed:
 * it works as soon as the signed-in user has Read on `Payment Entry`.
 *
 * The row shape mirrors the customer "পেমেন্ট তালিকা" table
 * (`PaymentEntryRow`), so the staff table renders the same columns/statuses.
 */

type Row = Record<string, unknown>;

/**
 * Explicit field list — each name is a real `Payment Entry` column (verified
 * against the doctype). `docstatus`/`owner`/`creation` are Frappe standard
 * columns present on every table. A wrong field name would make get_list error
 * and the whole list arrive empty, so this list is kept to verified columns.
 */
const LIST_FIELDS = [
  "name",
  "posting_date",
  "payment_type",
  "party_type",
  "party",
  "party_name",
  "paid_amount",
  "received_amount",
  "mode_of_payment",
  "reference_no",
  "reference_date",
  "status",
  "docstatus",
  "company",
  "paid_from_account_currency",
  "paid_to_account_currency",
  "creation",
];

async function coreList(
  sid: string,
  doctype: string,
  fields: string[],
  filters: unknown[] | null,
  orderBy?: string
) {
  const params = new URLSearchParams();
  params.set("doctype", doctype);
  params.set("fields", JSON.stringify(fields));
  if (filters && filters.length) params.set("filters", JSON.stringify(filters));
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

/** The amount that matters for this entry, from the real paid/received figures. */
function displayAmount(row: Row): number {
  const type = str(row.payment_type).trim().toLowerCase();
  const paid = num(row.paid_amount);
  const received = num(row.received_amount);
  if (type === "pay") return received || paid;
  return paid || received;
}

/** Currency of the account the money lands in (Receive/Transfer) or leaves (Pay). */
function displayCurrency(row: Row, fallback: string): string {
  const type = str(row.payment_type).trim().toLowerCase();
  if (type === "pay") {
    return str(row.paid_to_account_currency) || str(row.paid_from_account_currency) || fallback;
  }
  return str(row.paid_from_account_currency) || str(row.paid_to_account_currency) || fallback;
}

/** Mirror the customer table's status derivation from docstatus + status. */
function displayStatus(row: Row): string {
  const status = str(row.status).trim();
  if (status) return status;
  const docstatus = num(row.docstatus);
  if (docstatus === 2) return "Cancelled";
  if (docstatus === 1) return "Submitted";
  return "Draft";
}

export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  // Who is signed in? Used to scope `owner = <this employee>`.
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

  const rowsRes = await coreList(
    sid,
    "Payment Entry",
    LIST_FIELDS,
    [["owner", "=", user]],
    "posting_date desc, creation desc"
  );
  if (!rowsRes.ok) {
    const response = fromFrappeFailure(rowsRes);
    return rowsRes.status === 401 ? clearSessionCookie(response) : response;
  }
  const rows = Array.isArray(rowsRes.data) ? rowsRes.data : [];

  const entries: PaymentEntryRow[] = rows.map((row) => {
    const amount = displayAmount(row);
    return {
      name: str(row.name),
      posting_date: str(row.posting_date),
      payment_type: str(row.payment_type),
      party_type: str(row.party_type),
      party: str(row.party),
      party_name: str(row.party_name),
      paid_amount: num(row.paid_amount),
      received_amount: num(row.received_amount),
      mode_of_payment: str(row.mode_of_payment),
      reference_no: str(row.reference_no),
      reference_date: str(row.reference_date),
      status: str(row.status),
      docstatus: num(row.docstatus),
      company: str(row.company),
      amount,
      currency: displayCurrency(row, ""),
      display_status: displayStatus(row),
    };
  });

  const currency = entries.find((entry) => entry.currency)?.currency || "BDT";
  const monthKey = new Date().toISOString().slice(0, 7);
  let totalAmount = 0;
  let monthCount = 0;
  let monthAmount = 0;
  let latest = "";
  for (const entry of entries) {
    totalAmount += entry.amount;
    if (entry.posting_date.startsWith(monthKey)) {
      monthCount += 1;
      monthAmount += entry.amount;
    }
    if (entry.posting_date > latest) latest = entry.posting_date;
  }

  const payload: StaffPaymentEntryListResult = {
    doctype: "Payment Entry",
    entries,
    summary: {
      total: entries.length,
      total_amount: totalAmount,
      this_month_count: monthCount,
      this_month_amount: monthAmount,
      latest_payment_date: latest,
      currency,
    },
  };

  return jsonOk(payload);
}
