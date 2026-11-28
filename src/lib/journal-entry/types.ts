/** Shared types for the staff Journal Entry creator (`/userDashboard/journal-entry`). */

export interface SelectOption {
  value: string;
  label: string;
}

export interface AccountOption extends SelectOption {
  /** Frappe Account.account_type (e.g. "Payable", "Receivable", "Expense Account"). */
  account_type?: string;
  account_currency?: string;
}

export interface CostCenterOption extends SelectOption {}

export interface JournalEntryFormContext {
  company: string;
  companies: SelectOption[];
  currency: string;
  posting_date: string;
  voucher_types: SelectOption[];
  accounts: AccountOption[];
  /** Payable accounts exactly as the desk list (account_type=Payable) shows; may include group accounts. */
  payable_accounts: SelectOption[];
  cost_centers: CostCenterOption[];
  /** Party types from the ERP "Party Type" doctype (Customer, Supplier, Employee, ...). */
  party_types: SelectOption[];
}

/** One line of the accounts grid as the browser sends it. */
export interface JournalEntryAccountInput {
  account: string;
  party_type?: string;
  party?: string;
  debit: number;
  credit: number;
  cost_center?: string;
}

export interface JournalEntryCreateInput {
  company: string;
  voucher_type: string;
  posting_date: string;
  title?: string;
  remark?: string;
  accounts: JournalEntryAccountInput[];
}

export interface JournalEntryResult {
  name: string;
  docstatus: number;
  voucher_type: string;
  company: string;
  posting_date: string;
  total_debit: number;
  total_credit: number;
  currency: string;
}

/** One row of the history table (`GET /api/journal-entry/list`). */
export interface JournalEntryRow {
  name: string;
  posting_date: string;
  voucher_type: string;
  title: string;
  remark: string;
  total_debit: number;
  total_credit: number;
  /** The entry amount (total debit = total credit for a balanced entry). */
  amount: number;
  /** Draft / Submitted / Cancelled derived from docstatus. */
  status: string;
  docstatus: number;
  company: string;
  currency: string;
  cheque_no: string;
  bill_no: string;
  creation: string;
}

export interface JournalEntrySummary {
  total: number;
  total_amount: number;
  this_month_count: number;
  this_month_amount: number;
  latest_date: string;
  currency: string;
}

export interface JournalEntryListResult {
  doctype: string;
  entries: JournalEntryRow[];
  summary: JournalEntrySummary;
}

/** One account line of a Journal Entry (party lives here, not on the list row). */
export interface JournalEntryAccountLine {
  account: string;
  party_type: string;
  party: string;
}

/** Full detail for the "view details" popup (`GET /api/journal-entry/detail`). */
export interface JournalEntryDetail {
  name: string;
  party_type: string;
  party: string;
  accounts: JournalEntryAccountLine[];
}
