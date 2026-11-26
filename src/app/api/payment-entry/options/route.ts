import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { PaymentEntryFormContext, SelectOption } from "@/lib/staff-payment/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the staff Payment Entry form catalogue.
 *
 * Reads the two dropdown sources straight from the ERP's CORE API
 * (`frappe.client.get_list`) instead of a custom whitelisted method, so the
 * data appears as soon as the signed-in user has Read on the doctypes — it does
 * NOT depend on `shikkha_os.api.v1.staff_payment.form_context` being deployed:
 *
 *   - Modes of Payment  <- the "Mode of Payment" doctype (accounts/mode-of-payment)
 *   - Party types       <- the "Party Type" doctype (setup/party-type)
 *
 * IMPORTANT: the Mode of Payment doctype has an `enabled` (Check) field, NOT a
 * `disabled` field. Filtering on a non-existent column makes get_list error and
 * the list silently arrives empty — the exact bug this route fixes.
 */

type Row = Record<string, unknown>;

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

const PAYMENT_TYPES: SelectOption[] = [
  { value: "Receive", label: "Receive" },
  { value: "Pay", label: "Pay" },
  { value: "Internal Transfer", label: "Internal Transfer" },
];

export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  // Modes of Payment — from the "Mode of Payment" doctype. `enabled = 1`.
  const modesRes = await coreList(sid, "Mode of Payment", ["name"], [["enabled", "=", 1]], "name asc");
  if (!modesRes.ok) {
    const response = fromFrappeFailure(modesRes);
    return modesRes.status === 401 ? clearSessionCookie(response) : response;
  }
  const modeRows = Array.isArray(modesRes.data) ? modesRes.data : [];

  // Party types — from the "Party Type" doctype (setup/party-type). Best effort.
  const partiesRes = await coreList(sid, "Party Type", ["name"], null, "name asc");
  const partyRows = partiesRes.ok && Array.isArray(partiesRes.data) ? partiesRes.data : [];

  // Company (currency + transfer-account scoping). Best effort.
  const companyRes = await coreList(sid, "Company", ["name", "default_currency"], null, "name asc");
  const companyRow =
    companyRes.ok && Array.isArray(companyRes.data) ? (companyRes.data[0] as Row | undefined) : undefined;
  const company = companyRow ? String(companyRow.name ?? "") : "";
  const currency = companyRow && companyRow.default_currency ? String(companyRow.default_currency) : "BDT";

  // Bank/Cash accounts for Internal Transfer. Best effort.
  const accountFilters: unknown[] = [
    ["is_group", "=", 0],
    ["disabled", "=", 0],
    ["account_type", "in", ["Bank", "Cash"]],
  ];
  if (company) accountFilters.unshift(["company", "=", company]);
  const accountsRes = await coreList(sid, "Account", ["name", "account_currency"], accountFilters, "name asc");
  const accountRows = accountsRes.ok && Array.isArray(accountsRes.data) ? accountsRes.data : [];

  const context: PaymentEntryFormContext = {
    company,
    currency,
    posting_date: new Date().toISOString().slice(0, 10),
    payment_types: PAYMENT_TYPES,
    party_types: partyRows
      .map((row): SelectOption => ({ value: String(row.name ?? ""), label: String(row.name ?? "") }))
      .filter((option) => option.value),
    mode_of_payments: modeRows
      .map((row) => ({
        value: String(row.name ?? ""),
        label: String(row.name ?? ""),
        account: "",
        account_currency: "",
      }))
      .filter((option) => option.value),
    transfer_accounts: accountRows
      .map((row) => ({
        value: String(row.name ?? ""),
        label: String(row.name ?? ""),
        account_currency: row.account_currency ? String(row.account_currency) : currency,
      }))
      .filter((option) => option.value),
  };

  return jsonOk(context);
}
