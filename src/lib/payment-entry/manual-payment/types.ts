/**
 * Shared shapes for the customer "Make Payment" flow.
 *
 * These mirror the backend contract (`shikkha_os.api.v1.manual_payment`): the
 * portal posts a manual payment to the ERP, which writes a real ERPNext
 * **Payment Entry** (status "Draft") with the matching Mode of Payment — there
 * is no separate "Manual Payment Request" DocType any more.
 */

/** The tender a manual payment is sent with (portal-side key). */
export type ManualPaymentMethod = "bkash" | "rocket" | "nagad" | "bank";

/** The top-level choice on the first step of the Make Payment modal. */
export type PaymentChannel = "online" | "manual";

/** Which screen the modal is currently showing. */
export type MakePaymentStep =
  | "method"
  | "manual"
  | "bkash"
  | "rocket"
  | "nagad"
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
  | "submitted"
  | "paid"
  | "reconciled"
  | "cancelled"
  | "other";

/** What a form produces and the service posts to the backend. */
export interface ManualPaymentSubmitInput {
  payment_method: ManualPaymentMethod;
  amount: number;
  payment_date: string;
  note?: string;
  // bKash / Rocket / Nagad
  sender_mobile?: string;
  transaction_id?: string;
  // Bank
  bank?: string;
  sender_account_name?: string;
  sender_account_number?: string;
  transfer_reference?: string;
  // Proof (base64 `data:` URL + original file name) — required for a Bank
  // transfer only; omitted entirely for wallet transfers (no screenshot).
  proof_file_data?: string;
  proof_file_name?: string;
  language: string;
}

/** The backend acknowledgement the success screen renders. */
export interface ManualPaymentResult {
  /// The real ERP document name (e.g. "ACC-PAY-2026-00001").
  name: string;
  request_id: string;
  payment_entry?: string;
  status: string;
  payment_method: string;
  mode_of_payment?: string;
  amount: number;
  currency: string;
  payment_date: string;
  submitted_at: string;
}
