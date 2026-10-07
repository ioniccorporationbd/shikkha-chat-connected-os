/**
 * SSLCommerz data layer — the seam between the Make Payment UI and the backend.
 *
 * Not a mock: every call goes through the same-origin proxy
 * (`/api/payment-entry/sslcommerz*`). `initiate` asks the ERP to open a real
 * SSLCommerz session and returns its `GatewayPageURL`; the browser is then sent
 * there. `fetchSslcommerzStatus` reads the *local* transaction status (never a
 * query parameter), which is what makes the success page trustworthy.
 */

import { fetchSslcommerzStatusRequest, initiateSslcommerzRequest } from "./api";
import type {
  SslcommerzInitiateInput,
  SslcommerzInitiateResult,
  SslcommerzStatusResult,
} from "./types";

export function initiateSslcommerz(
  input: SslcommerzInitiateInput
): Promise<SslcommerzInitiateResult> {
  return initiateSslcommerzRequest(input);
}

export function fetchSslcommerzStatus(
  tranId: string,
  language: string
): Promise<SslcommerzStatusResult> {
  return fetchSslcommerzStatusRequest(tranId, language);
}
