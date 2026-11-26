import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

/** Party doctype -> the field that carries its human label. */
const LABEL_FIELD: Record<string, string> = {
  Customer: "customer_name",
  Supplier: "supplier_name",
  Employee: "employee_name",
  Shareholder: "title",
  Student: "student_name",
  "Sales Partner": "partner_name",
  Lead: "lead_name",
};

/**
 * Supplier / Customer options for the Journal Entry party column. Uses the
 * caller's own Read permission via the CORE get_list API (no custom method).
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const params = new URL(request.url).searchParams;
  const partyType = (params.get("party_type") || "").trim();
  if (!partyType) {
    return jsonFail("A party type is required.", "invalid_request", 400);
  }

  // Only allow party types registered in the ERP "Party Type" doctype — the same
  // list the desk Journal Entry grid offers (Customer, Supplier, Employee, ...).
  const typeQuery = new URLSearchParams();
  typeQuery.set("doctype", "Party Type");
  typeQuery.set("fields", JSON.stringify(["name"]));
  typeQuery.set("filters", JSON.stringify([["name", "=", partyType]]));
  typeQuery.set("limit_page_length", "1");
  const typeRes = await callFrappe<Row[]>(`frappe.client.get_list?${typeQuery.toString()}`, { sid });
  if (!typeRes.ok) {
    const response = fromFrappeFailure(typeRes);
    return typeRes.status === 401 ? clearSessionCookie(response) : response;
  }
  if (!(Array.isArray(typeRes.data) && typeRes.data.length > 0)) {
    return jsonFail("Unsupported party type.", "invalid_request", 400);
  }

  const labelField = LABEL_FIELD[partyType];
  const fields = labelField ? ["name", labelField] : ["name"];

  const query = new URLSearchParams();
  query.set("doctype", partyType);
  query.set("fields", JSON.stringify(fields));
  query.set("order_by", "name asc");
  query.set("limit_page_length", "500");

  const result = await callFrappe<Row[]>(`frappe.client.get_list?${query.toString()}`, { sid });
  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  const rows = Array.isArray(result.data) ? result.data : [];
  const options = rows
    .map((row) => ({
      value: String(row.name ?? ""),
      label: String((labelField && row[labelField]) || row.name || ""),
    }))
    .filter((option) => option.value);

  return jsonOk({ options });
}
