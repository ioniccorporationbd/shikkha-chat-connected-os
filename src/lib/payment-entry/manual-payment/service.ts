/**
 * Manual-payment data layer — the seam between the Make Payment UI and the
 * backend.
 *
 * Not a mock: every call goes to the ERP through the same-origin proxy
 * (`/api/payment-entry/manual*`), which writes a real ERPNext **Payment Entry**
 * (status "Draft") with the matching Mode of Payment. The ERP returns its real
 * document id (e.g. "ACC-PAY-2026-00001").
 */

import { submitManualPaymentRequest } from "./api";
import type {
  ManualPaymentResult,
  ManualPaymentStatusKey,
  ManualPaymentSubmitInput,
} from "./types";

export { fetchSupportedBanks } from "./api";

/** Submit a manual payment (real backend write -> Draft Payment Entry). */
export function submitManualPayment(
  input: ManualPaymentSubmitInput
): Promise<ManualPaymentResult> {
  return submitManualPaymentRequest(input);
}

/** Map the ERP's Payment Entry status text to a stable key the UI switches on. */
export function statusKey(server: string | undefined): ManualPaymentStatusKey {
  const value = (server || "").trim().toLowerCase();
  if (value.startsWith("cancel")) return "cancelled";
  if (value.startsWith("reconcil")) return "reconciled";
  if (value === "paid") return "paid";
  if (value.startsWith("submit")) return "submitted";
  if (value.startsWith("draft")) return "draft";
  return "other";
}
