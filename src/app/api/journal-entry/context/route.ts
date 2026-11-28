import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type {
  AccountOption,
  CostCenterOption,
  JournalEntryFormContext,
  SelectOption,
} from "@/lib/journal-entry/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

/** Standard Journal Entry voucher types (mirrors the desk dropdown). */
const VOUCHER_TYPES = [
  "Journal Entry",
  "Bank Entry",
  "Cash Entry",
  "Contra Entry",
  "Excise Entry",
  "Write Off Entry",
  "Opening Entry",
  "Depreciation Entry",
  "Exchange Rate Revaluation",
  "Exchange Gain Or Loss",
];

async function getList(
  doctype: string,
  fields: string[],
  filters: unknown[],
  sid: string,
  orderBy = "name asc",
  limit = "0"
) {
  const query = new URLSearchParams();
  query.set("doctype", doctype);
  query.set("fields", JSON.stringify(fields));
  if (filters.length) query.set("filters", JSON.stringify(filters));
  query.set("order_by", orderBy);
  query.set("limit_page_length", limit);
  return callFrappe<Row[]>(`frappe.client.get_list?${query.toString()}`, { sid });
}

/**
 * Same-origin proxy that feeds the staff Journal Entry form.
 *
 * Reads everything straight from the ERP's CORE API (`frappe.client.get_list`)
 * with the caller's own permissions, so it works without deploying any custom
 * backend method:
 *  - Companies           -> the Company default-currency set
 *  - Accounts            -> every non-group ledger account of the company. This
 *                           is exactly the pool the Accounts Payable / Accounts
 *                           Receivable reports draw from (those reports group by
 *                           Account.account_type = "Payable" / "Receivable"), so
 *                           the payable and receivable accounts appear here with
 *                           their `account_type` intact for the party column.
 *  - Cost Center         -> the Cost Center tree's leaf nodes.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const params = new URL(request.url).searchParams;
  const requestedCompany = (params.get("company") || "").trim();

  const companyRes = await getList("Company", ["name", "default_currency"], [], sid, "name asc");
  if (!companyRes.ok) {
    const response = fromFrappeFailure(companyRes);
    return companyRes.status === 401 ? clearSessionCookie(response) : response;
  }

  const companyRows = Array.isArray(companyRes.data) ? companyRes.data : [];
  const companies: SelectOption[] = companyRows
    .map((row) => ({ value: String(row.name ?? ""), label: String(row.name ?? "") }))
    .filter((option) => option.value);

  const company = requestedCompany || companies[0]?.value || "";
  if (!company) return jsonFail("No company is configured for this account.", "no_company", 200);

  const matchRow = companyRows.find((row) => String(row.name ?? "") === company);
  const currency = String((matchRow?.default_currency as string) || "BDT");

  const accountRes = await getList(
    "Account",
    ["name", "account_type", "account_currency"],
    [["company", "=", company], ["is_group", "=", 0]],
    sid,
    "name asc"
  );
  if (!accountRes.ok) {
    const response = fromFrappeFailure(accountRes);
    return accountRes.status === 401 ? clearSessionCookie(response) : response;
  }

  const costRes = await getList(
    "Cost Center",
    ["name"],
    [["company", "=", company]],
    sid,
    "name asc"
  );
  if (!costRes.ok) {
    const response = fromFrappeFailure(costRes);
    return costRes.status === 401 ? clearSessionCookie(response) : response;
  }

  const accounts: AccountOption[] = (Array.isArray(accountRes.data) ? accountRes.data : [])
    .map((row) => ({
      value: String(row.name ?? ""),
      label: String(row.name ?? ""),
      account_type: row.account_type ? String(row.account_type) : undefined,
      account_currency: row.account_currency ? String(row.account_currency) : undefined,
    }))
    .filter((option) => option.value);

  const cost_centers: CostCenterOption[] = (Array.isArray(costRes.data) ? costRes.data : [])
    .map((row) => ({ value: String(row.name ?? ""), label: String(row.name ?? "") }))
    .filter((option) => option.value);

  const partyTypeRes = await getList("Party Type", ["name"], [], sid, "name asc");
  if (!partyTypeRes.ok) {
    const response = fromFrappeFailure(partyTypeRes);
    return partyTypeRes.status === 401 ? clearSessionCookie(response) : response;
  }
  const party_types: SelectOption[] = (Array.isArray(partyTypeRes.data) ? partyTypeRes.data : [])
    .map((row) => ({ value: String(row.name ?? ""), label: String(row.name ?? "") }))
    .filter((option) => option.value);

  // Dedicated Payable list that mirrors the desk view
  // `account/view/list?account_type=Payable` EXACTLY (no is_group filter, so
  // group-level payable accounts such as "Creditors - X" are included). This is
  // what feeds the second row of the accounts grid.
  const payableRes = await getList(
    "Account",
    ["name"],
    [["company", "=", company], ["account_type", "=", "Payable"]],
    sid,
    "name asc"
  );
  if (!payableRes.ok) {
    const response = fromFrappeFailure(payableRes);
    return payableRes.status === 401 ? clearSessionCookie(response) : response;
  }
  const payable_accounts: SelectOption[] = (Array.isArray(payableRes.data) ? payableRes.data : [])
    .map((row) => ({ value: String(row.name ?? ""), label: String(row.name ?? "") }))
    .filter((option) => option.value);

  const payload: JournalEntryFormContext = {
    company,
    companies,
    currency,
    posting_date: "",
    voucher_types: VOUCHER_TYPES.map((value) => ({ value, label: value })),
    accounts,
    payable_accounts,
    cost_centers,
    party_types,
  };

  return jsonOk(payload);
}
