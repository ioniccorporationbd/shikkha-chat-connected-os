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
  cost_centers: CostCenterOption[];
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
