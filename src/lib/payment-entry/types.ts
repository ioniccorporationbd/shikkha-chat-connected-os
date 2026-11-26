/** Shared shapes for the customer Payment History panel. */

export type PaymentEntryStatusKey =
  | "submitted"
  | "reconciled"
  | "paid"
  | "received"
  | "draft"
  | "cancelled";

/** One row of the customer's submitted Payment Entry history. */
export interface PaymentEntryRow {
  name: string;
  posting_date: string;
  payment_type: string;
  party_type: string;
  party: string;
  party_name: string;
  paid_amount: number;
  received_amount: number;
  mode_of_payment: string;
  reference_no: string;
  reference_date: string;
  status: string;
  docstatus: number;
  company: string;
  /** Amount meaningful for the customer (derived server-side from the real
   *  ``paid_amount`` / ``received_amount`` according to ``payment_type``). */
  amount: number;
  currency: string;
  /** Derived from the document's own docstatus / status field. */
  display_status: PaymentEntryStatusKey | string;
}

/** One reference row from the Payment Entry's ``references`` child table. */
export interface PaymentEntryReference {
  reference_doctype?: string;
  reference_name?: string;
  due_date?: string;
  total_amount?: number;
  outstanding_amount?: number;
  allocated_amount?: number;
}

export interface PaymentEntryDetails extends PaymentEntryRow {
  remark: string;
  references: PaymentEntryReference[];
  /** Backend proof that the record really exists in the Payment Entry table. */
  verified: boolean;
  /** Extra real Payment Entry fields shown in the details popup. Optional so the
   *  shape stays correct on sites where a field does not exist. */
  paid_from?: string;
  paid_to?: string;
  paid_from_account_currency?: string;
  paid_to_account_currency?: string;
  contact_person?: string;
  contact_email?: string;
  total_allocated_amount?: number;
  unallocated_amount?: number;
}

export interface PaymentEntrySummary {
  total: number;
  total_amount: number;
  this_month_count: number;
  this_month_amount: number;
  latest_payment_date: string;
  currency: string;
}

export interface PaymentEntryListPayload {
  doctype: string;
  linked: boolean;
  customer?: { name: string; customer_name: string };
  payments: PaymentEntryRow[];
  summary: PaymentEntrySummary;
}
