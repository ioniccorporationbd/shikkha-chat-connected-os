/**
 * Shared shapes for the customer "Make Payment" (manual proof submission) flow.
 *
 * These mirror the backend contract (`shikkha_os.api.v1.manual_payment`): the
 * portal posts a proof to the ERP, which writes a real **Manual Payment
 * Request** row (status "Draft") — it never creates/submits an
 * ERPNext Payment Entry from an unverified screenshot.
 */

/** The tender a manual payment is sent with (portal-side key). */
export type ManualPaymentMethod = "bkash" | "rocket" | "bank";

/** The top-level choice on the first step of the Make Payment modal. */
export type PaymentChannel = "online" | "manual";

/** Which screen the modal is currently showing. */
export type MakePaymentStep =
  | "method"
  | "manual"
  | "bkash"
  | "rocket"
  | "bank"
  | "success";

/** One supported bank account the customer can transfer money to. */
export interface SupportedBank {
  /** DocType name of the Supported Payment Bank row (= its bank name). */
  name: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string;
  routing_number?: string;
  instructions?: string;
  /**
   * True while this row still holds placeholder / demo values. The UI shows a
   * clear "demo data" note for any bank flagged here so nobody mistakes it for a
   * real production account.
   */
  is_placeholder?: boolean;
}

/** Server status text -> a stable key the UI can switch on. */
export type ManualPaymentStatusKey =
  | "draft"
  | "pending"
  | "verified"
  | "rejected"
  | "cancelled";

/** A stored Manual Payment Request as returned by the ERP. */
export interface ManualPaymentRecord {
  /** The real ERP document name (e.g. "MPR-2026-00001"). */
  name: string;
  payment_method: string;
  amount: number;
  currency: string;
  payment_date: string;
  sender_mobile?: string;
  transaction_id?: string;
  bank?: string;
  sender_account_name?: string;
  sender_account_number?: string;
  transfer_reference?: string;
  proof_attachment?: string;
  note?: string;
  /** Raw server status text (e.g. "Draft"). */
  status: string;
  submitted_at: string;
  verified_on?: string;
  rejection_reason?: string;
  payment_entry?: string;
}

export interface ManualPaymentSummary {
  total: number;
  total_amount: number;
  draft: number;
  verified: number;
  rejected: number;
  currency: string;
}

export interface ManualPaymentListPayload {
  linked: boolean;
  customer?: { name: string; customer_name: string };
  requests: ManualPaymentRecord[];
  summary: ManualPaymentSummary;
}

/** What a form produces and the service posts to the backend. */
export interface ManualPaymentSubmitInput {
  payment_method: ManualPaymentMethod;
  amount: number;
  payment_date: string;
  note?: string;
  // bKash / Rocket
  sender_mobile?: string;
  transaction_id?: string;
  // Bank
  bank?: string;
  sender_account_name?: string;
  sender_account_number?: string;
  transfer_reference?: string;
  // Proof (base64 `data:` URL + original file name) — required for a Bank
  // transfer only; omitted entirely for bKash / Rocket (no screenshot).
  proof_file_data?: string;
  proof_file_name?: string;
  language: string;
}

/** The backend acknowledgement the success screen renders. */
export interface ManualPaymentResult {
  name: string;
  request_id: string;
  status: string;
  payment_method: string;
  amount: number;
  currency: string;
  payment_date: string;
  submitted_at: string;
}
