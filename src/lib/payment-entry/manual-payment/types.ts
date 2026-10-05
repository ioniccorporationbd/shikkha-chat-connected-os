/**
 * Shared shapes for the customer "Make Payment" (manual proof submission) flow.
 *
 * This is the request/response contract between the UI and the (future) backend
 * Manual Payment Request endpoint. Keeping it here — separate from the existing
 * Payment Entry list/detail types — means the list flow never has to change.
 */

/** The tender a manual payment is sent with. */
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
  /** Stable local key (used by the selector + request payload). */
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string;
  routing_number?: string;
  instructions?: string;
  /**
   * True while this record still holds placeholder / demo values. The UI shows a
   * clear "demo data" note for any bank flagged here so nobody mistakes it for a
   * real production account. Clear it once the values come from site-config / a
   * DocType.
   */
  is_placeholder?: boolean;
}

/** A tiny, serialisable description of the uploaded proof (never the file). */
export interface PaymentProofMeta {
  name: string;
  size: number;
  type: string;
}

/** The lifecycle of a manual payment request. */
export type ManualPaymentStatus = "pending_verification";

/** A manual payment the customer is asking to be verified. */
export interface ManualPaymentRequest {
  customer_name: string;
  method: ManualPaymentMethod;
  amount: number;
  currency: string;
  /** bKash / Rocket. */
  transaction_id?: string;
  /** bKash / Rocket — the wallet the money was sent from. */
  sender_mobile?: string;
  /** Bank only. */
  bank_id?: string;
  bank_name?: string;
  sender_account_name?: string;
  sender_account_number?: string;
  bank_reference?: string;
  /** ISO date (YYYY-MM-DD) the customer made the transfer. */
  payment_date: string;
  proof_image?: PaymentProofMeta | null;
  note?: string;
  status: ManualPaymentStatus;
}

/** A stored request, as the UI ledger shows it. */
export interface ManualPaymentRecord extends ManualPaymentRequest {
  request_id: string;
  submitted_at: string;
}

/** What the service resolves with on a successful (local) submission. */
export interface ManualPaymentResult {
  request_id: string;
  status: ManualPaymentStatus;
  submitted_at: string;
}
