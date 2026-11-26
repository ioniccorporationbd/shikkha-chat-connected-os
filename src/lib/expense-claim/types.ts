/** Shapes for the Employee Expense Claim surface (ERPNext Expense Claim). */

export interface ExpenseClaimFieldMeta {
  fieldname: string;
  label: string;
  /** Frappe fieldtype: Data, Select, Link, Check, Date, Currency, Small Text, ... */
  fieldtype: string;
  /** Allowed values for a Select field (empty otherwise). */
  options: string[];
  /** Target DocType for a Link / Dynamic Link field (empty otherwise). */
  link_doctype: string;
  required: boolean;
  read_only: boolean;
  default?: string;
  description?: string;
  placeholder?: string;
  /** Frappe `depends_on` expression (informational; the portal keeps it visible). */
  depends_on?: string;
}

export interface ExpenseClaimSection {
  key: string;
  label: string;
  fields: ExpenseClaimFieldMeta[];
}

/** Server-resolved parent values (employee, company, department, ...). */
export type ExpenseClaimAuto = Record<string, string>;

export interface ExpenseClaimSchema {
  doctype: string;
  title: string;
  /** User-editable parent (claim) fields, grouped. */
  sections: ExpenseClaimSection[];
  /** The child ("Expense Claim Detail") expense-row catalogue. */
  child: {
    doctype: string;
    fields: ExpenseClaimFieldMeta[];
  };
  /** Values the server fills for the read-only parent fields. */
  auto: ExpenseClaimAuto;
  meta: {
    title_field: string;
    search_fields: string[];
  };
}

/** Derived from the real ERPNext fields (docstatus / status / approval_status / is_paid). */
export type ExpenseClaimStatusKey =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "paid"
  | "cancelled";

export interface ExpenseClaimRow {
  name: string;
  employee?: string;
  employee_name?: string;
  company?: string;
  department?: string;
  cost_center?: string;
  currency: string;
  posting_date: string;
  expense_approver?: string;
  status: string;
  approval_status: string;
  docstatus: number;
  is_paid: boolean;
  total_claimed_amount: number;
  total_sanctioned_amount: number;
  /** Sanctioned amount in the company's base currency (what the portal shows). */
  base_total_sanctioned_amount?: number;
  /** Claimed amount in the company's base currency. */
  base_total_claimed_amount?: number;
  grand_total: number;
  total_amount_reimbursed: number;
  remark?: string;
  display_status: ExpenseClaimStatusKey;
}

export interface ExpenseClaimSummary {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  paid: number;
  /** Cancelled claims (docstatus 2 / status "Cancelled"). */
  cancelled?: number;
  total_claimed_amount: number;
  total_sanctioned_amount: number;
  /** Sum of base_total_sanctioned_amount (company currency). */
  total_base_sanctioned_amount?: number;
  total_amount_reimbursed: number;
  currency: string;
}

export interface ExpenseClaimListPayload {
  doctype: string;
  /** False when the signed-in user has no Employee record linked. */
  linked: boolean;
  employee?: { name: string; employee_name: string };
  claims: ExpenseClaimRow[];
  summary: ExpenseClaimSummary;
}

/** One expense row value, keyed by the child fieldname. */
export type ExpenseRowValue = Record<string, string>;

export interface ExpenseClaimFormValues {
  posting_date?: string;
  /** Link to the ERPNext Department DocType (prefilled from the Employee). */
  department?: string;
  cost_center?: string;
  remark?: string;
  expenses: ExpenseRowValue[];
}

export interface ExpenseClaimDetails extends ExpenseClaimRow {
  expenses: ExpenseRowValue[];
  /** Backend self-check: the row exists in the Expense Claim table. */
  verified?: boolean;
}

export interface ExpenseClaimLinkOption {
  value: string;
  label: string;
}

export interface ExpenseClaimLinkOptionsPayload {
  doctype: string;
  options: ExpenseClaimLinkOption[];
}

export interface ExpenseClaimCreateResult {
  name: string;
  employee: string;
  employee_name: string;
  company: string;
  currency: string;
  posting_date: string;
  total_claimed_amount: number;
  total_sanctioned_amount?: number;
  /** Sanctioned total in company currency — the Payment Entry's paid amount. */
  base_total_sanctioned_amount?: number;
  status: string;
  approval_status: string;
  docstatus: number;
  is_paid: boolean;
  /** The reimbursement the backend posted for this claim. */
  payment_entry?: ExpenseClaimPaymentEntry | null;
  /** Why no Payment Entry could be posted (claim stays with the desk). */
  payment_error?: string | null;
  owner?: string;
  creation?: string;
  /** Backend self-check: the row exists in the Expense Claim table. */
  verified?: boolean;
}

/** The payment the portal posts against a freshly created claim. */
export interface ExpenseClaimPaymentEntry {
  name: string;
  paid_amount: number;
  currency?: string;
  status?: string;
  docstatus?: number;
  /** The Expense Claim this payment settles. */
  reference_name?: string;
}
