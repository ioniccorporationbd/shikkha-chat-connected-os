/**
 * Manual-payment submission service — the isolated data layer for the Make
 * Payment flow.
 *
 * ⚠️ FRONTEND-ONLY (mock) FOR THIS PHASE. There is **no** backend submit
 * endpoint yet, and per the task we must **not** create a real ERPNext Payment
 * Entry from an unverified screenshot. So this module:
 *   • normalises + keeps the request in a module-level ledger (session-scoped),
 *   • resolves with a "pending_verification" acknowledgement,
 *   • never writes to the ERP and never fabricates a fake gateway/API call.
 *
 * When the backend lands (a Manual Payment Request DocType + endpoint), replace
 * the body of `submitManualPayment` with a single proxy call, e.g.
 *     return postJson<ManualPaymentResult>("/api/payment-entry/manual", request);
 * and everything above this file keeps working unchanged. The proof image File
 * is intentionally NOT uploaded yet (there is nowhere to put it) — only its
 * metadata (name/size/type) travels in the request, and the UI says so.
 */

import type {
  ManualPaymentRecord,
  ManualPaymentRequest,
  ManualPaymentResult,
} from "./types";

/** A stable empty array for `useSyncExternalStore`'s server snapshot. */
const EMPTY: ManualPaymentRecord[] = [];

let snapshot: ManualPaymentRecord[] = EMPTY;
const listeners = new Set<() => void>();

/** Current ledger (newest first). Referentially stable between mutations. */
export function listManualPaymentRequests(): ManualPaymentRecord[] {
  return snapshot;
}

/** Server snapshot — always empty, so SSR and first client render agree. */
export function manualPaymentServerSnapshot(): ManualPaymentRecord[] {
  return EMPTY;
}

/** Subscribe to ledger changes (for `useSyncExternalStore`). */
export function subscribeManualPaymentRequests(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  for (const listener of listeners) listener();
}

let sequence = 0;

/**
 * Submit a manual payment for verification (frontend-only — see module header).
 * Returns the acknowledgement the success screen renders.
 */
export async function submitManualPayment(
  request: ManualPaymentRequest
): Promise<ManualPaymentResult> {
  // Simulated latency so the UI's submitting state is honest and visible. This
  // is a local ledger write, NOT a network/ERP call.
  await new Promise((resolve) => setTimeout(resolve, 600));

  sequence += 1;
  const submittedAt = new Date().toISOString();
  const requestId = `MPR-${Date.now().toString().slice(-8)}-${sequence}`;

  const record: ManualPaymentRecord = {
    ...request,
    request_id: requestId,
    submitted_at: submittedAt,
    status: "pending_verification",
  };

  snapshot = [record, ...snapshot];
  emit();

  return {
    request_id: requestId,
    status: "pending_verification",
    submitted_at: submittedAt,
  };
}

/** Clear the local ledger (used on sign-out / tests). */
export function clearManualPaymentRequests(): void {
  snapshot = EMPTY;
  emit();
}
