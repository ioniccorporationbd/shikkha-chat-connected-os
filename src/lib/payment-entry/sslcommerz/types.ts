/**
 * Shared shapes for the customer "Pay with SSLCommerz" flow.
 *
 * Mirrors the backend contract (`shikkha_os.api.v1.sslcommerz`): the portal
 * opens a gateway session server-side and, after the customer pays, the backend
 * validates the payment with SSLCommerz and writes a real ERPNext **Payment
 * Entry**. The portal only ever receives the gateway URL and the local status.
 */

/** What the amount panel posts to start a gateway session. */
export interface SslcommerzInitiateInput {
  amount: number;
  language: string;
}

/** The backend acknowledgement after a session is opened. */
export interface SslcommerzInitiateResult {
  transaction_id: string;
  gateway_page_url: string;
  amount: number;
  currency: string;
  environment: string;
  mode_of_payment?: string;
  company?: string;
}

/** A stable key the UI switches on, derived from the DB-backed status. */
export type SslcommerzState = "success" | "fail" | "cancel" | "pending";

/** The local, DB-backed state of one gateway transaction. */
export interface SslcommerzStatusResult {
  transaction_id: string;
  status: string;
  state: SslcommerzState;
  amount: number;
  currency: string;
  payment_entry?: string | null;
  bank_transaction_id?: string | null;
  validation_id?: string | null;
  gateway: string;
  environment: string;
  created: string;
}
