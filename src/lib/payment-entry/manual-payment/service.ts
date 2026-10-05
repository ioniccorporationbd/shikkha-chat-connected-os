/**
 * Manual-payment data layer — the seam between the Make Payment UI and the
 * backend.
 *
 * Not a mock: every call goes to the ERP through the same-origin proxy
 * (`/api/payment-entry/manual*`), which writes/reads a real **Manual Payment
 * Request** document. The flow never creates an ERPNext Payment Entry from an
 * unverified screenshot — a proof becomes a request with status
 * "Draft", and the ERP returns its real document id
 * (e.g. "MPR-2026-00001").
 */

import { submitManualPaymentRequest } from "./api";
import type {
  ManualPaymentMethod,
  ManualPaymentStatusKey,
  ManualPaymentSubmitInput,
  ManualPaymentResult,
} from "./types";

export { fetchManualRequests, fetchSupportedBanks, fetchManualRequest } from "./api";

/** Submit a manual payment proof for verification (real backend write). */
export function submitManualPayment(
  input: ManualPaymentSubmitInput
): Promise<ManualPaymentResult> {
  return submitManualPaymentRequest(input);
}

/** Map the ERP's method text (bKash / Rocket / Bank) to the portal key. */
export function methodKey(server: string | undefined): ManualPaymentMethod {
  const value = (server || "").trim().toLowerCase();
  if (value === "rocket") return "rocket";
  if (value === "bank") return "bank";
  return "bkash";
}

/** Map the ERP's status text to a stable key the UI switches on. */
export function statusKey(server: string | undefined): ManualPaymentStatusKey {
  const value = (server || "").trim().toLowerCase();
  if (value.startsWith("verified")) return "verified";
  if (value.startsWith("rejected")) return "rejected";
  if (value.startsWith("cancel")) return "cancelled";
  if (value.startsWith("draft")) return "draft";
  return "pending";
}
