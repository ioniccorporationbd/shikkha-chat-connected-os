/**
 * Types for the staff Payment Entry form (`/userDashboard/payment-entry`).
 *
 * Mirrors the ERPNext `Payment Entry` shape the panel form is allowed to set.
 * The browser never drives `paid_from`/`paid_to`/accounts for a Receive/Pay —
 * the ERP resolves those from the party + Mode of Payment — so they are absent
 * from the *input* type and only appear on the *result* type.
 */

export interface SelectOption {
  value: string;
  label: string;
}

export interface ModeOfPaymentOption extends SelectOption {
  account?: string;
  account_currency?: string;
}

export interface TransferAccountOption extends SelectOption {
  account_currency?: string;
}

/** `GET /api/payment-entry/options` — everything the form's dropdowns need. */
export interface PaymentEntryFormContext {
  company: string;
  currency: string;
  posting_date: string;
  payment_types: SelectOption[];
  party_types: SelectOption[];
  mode_of_payments: ModeOfPaymentOption[];
  transfer_accounts: TransferAccountOption[];
}

export interface PartyOption {
  value: string;
  label: string;
}

/** `GET /api/payment-entry/parties` — Link-search rows for the chosen party type. */
export interface PartyOptionsPayload {
  options: PartyOption[];
}

export type PaymentType = "Receive" | "Pay" | "Internal Transfer";
export type PartyType = "Customer" | "Employee" | "Shareholder" | "Supplier";

/** `POST /api/payment-entry/create` — the validated form values. */
export interface PaymentEntryCreateInput {
  payment_type: PaymentType;
  /** Receive/Pay only. */
  party_type?: PartyType;
  party?: string;
  /** Receive/Pay only. */
  mode_of_payment?: string;
  /** Internal Transfer only. */
  from_account?: string;
  to_account?: string;
  paid_amount: number;
  posting_date: string;
  reference_no?: string;
  reference_date?: string;
  remarks?: string;
}

/** The created Payment Entry echoed back after a successful submit. */
export interface PaymentEntryResult {
  name: string;
  payment_entry?: string;
  status: string;
  payment_type: string;
  party_type?: string;
  party?: string;
  party_name?: string;
  mode_of_payment?: string;
  amount: number;
  currency: string;
  posting_date: string;
  company: string;
  paid_from: string;
  paid_to: string;
}
