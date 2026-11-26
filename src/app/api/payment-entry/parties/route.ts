import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { PartyOption, PartyOptionsPayload } from "@/lib/staff-payment/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the party Link field on the Payment Entry form.
 *
 * Reads rows straight from the ERP's CORE API (`frappe.client.get_list`) for the
 * chosen party doctype (Customer / Supplier / Employee / Shareholder / ...), so
 * it works with the caller's own Read permission and does not depend on the
 * custom `staff_payment.party_options` method being deployed.
 */

type Row = Record<string, unknown>;

/** Doctype -> the field that carries its human label (falls back to `name`). */
const LABEL_FIELD: Record<string, string> = {
  Customer: "customer_name",
  Supplier: "supplier_name",
  Employee: "employee_name",
  Shareholder: "title",
};

export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const params = new URL(request.url).searchParams;
  const partyType = params.get("party_type") || "";
  if (!partyType) return jsonFail("A party type is required.", "invalid_request", 400);

  const txt = (params.get("txt") || "").trim();
  const labelField = LABEL_FIELD[partyType];
  const fields = labelField && labelField !== "name" ? ["name", labelField] : ["name"];

  const query = new URLSearchParams();
  query.set("doctype", partyType);
  query.set("fields", JSON.stringify(fields));
  query.set("order_by", "modified desc");
  query.set("limit_page_length", "20");
  if (txt) {
    const like = `%${txt}%`;
    const orFilters: unknown[] = [["name", "like", like]];
    if (labelField && labelField !== "name") orFilters.push([labelField, "like", like]);
    query.set("or_filters", JSON.stringify(orFilters));
  }

  const result = await callFrappe<Row[]>(`frappe.client.get_list?${query.toString()}`, { sid });
  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  const rows = Array.isArray(result.data) ? result.data : [];
  const options: PartyOption[] = rows
    .map((row) => ({
      value: String(row.name ?? ""),
      label: String((labelField && row[labelField]) || row.name || ""),
    }))
    .filter((option) => option.value);

  const payload: PartyOptionsPayload = { options };
  return jsonOk(payload);
}
