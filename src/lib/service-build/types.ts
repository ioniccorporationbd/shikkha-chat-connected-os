/** Shared shapes for the customer Service Build (Sales Invoice) panel. */

export type SalesInvoiceStatusKey =
  | "draft"
  | "submitted"
  | "unpaid"
  | "paid"
  | "partly paid"
  | "overdue"
  | "return"
  | "cancelled";

/** One row of the customer's Sales Invoice history. */
export interface SalesInvoiceRow {
  name: string;
  posting_date: string;
  due_date: string;
  status: string;
  docstatus: number;
  grand_total: number;
  rounded_total: number;
  net_total: number;
  total: number;
  outstanding_amount: number;
  currency: string;
  company: string;
  customer: string;
  customer_name: string;
  is_return: number;
  return_against: string;
  po_no: string;
  project: string;
  /** The amount meaningful for the customer (the invoice grand total). */
  amount: number;
  /** Derived from the document's own docstatus / status field. */
  display_status: SalesInvoiceStatusKey | string;
}

/** One billed line from the Sales Invoice's ``items`` child table. */
export interface SalesInvoiceItem {
  item_code?: string;
  item_name?: string;
  description?: string;
  qty?: number;
  uom?: string;
  rate?: number;
  amount?: number;
}

export interface SalesInvoiceDetails extends SalesInvoiceRow {
  remark?: string;
  items: SalesInvoiceItem[];
  /** Backend proof that the record really exists in the Sales Invoice table. */
  verified: boolean;
  debit_to?: string;
  base_grand_total?: number;
  base_net_total?: number;
  discount_amount?: number;
  total_taxes_and_charges?: number;
  contact_person?: string;
  contact_email?: string;
  territory?: string;
  tax_id?: string;
}

export interface SalesInvoiceSummary {
  total: number;
  total_amount: number;
  total_outstanding: number;
  this_month_count: number;
  this_month_amount: number;
  latest_invoice_date: string;
  currency: string;
}

export interface SalesInvoiceListPayload {
  doctype: string;
  linked: boolean;
  customer?: { name: string; customer_name: string };
  invoices: SalesInvoiceRow[];
  summary: SalesInvoiceSummary;
}
