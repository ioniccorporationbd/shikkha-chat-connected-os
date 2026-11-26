"use client";

import { getJson, postJson } from "@/lib/api/http";

import type {
  ManualPaymentResult,
  ManualPaymentSubmitInput,
  SupportedBank,
} from "./types";

/** `GET /api/payment-entry/manual/banks` — enabled supported banks. */
export function fetchSupportedBanks(): Promise<{ banks: SupportedBank[] }> {
  return getJson<{ banks: SupportedBank[] }>("/api/payment-entry/manual/banks");
}

/** `POST /api/payment-entry/manual` — record a manual payment (Draft Payment Entry). */
export function submitManualPaymentRequest(
  input: ManualPaymentSubmitInput
): Promise<ManualPaymentResult> {
  return postJson<ManualPaymentResult>("/api/payment-entry/manual", input);
}
