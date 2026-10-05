"use client";

import { getJson, postJson } from "@/lib/api/http";

import type {
  ManualPaymentListPayload,
  ManualPaymentRecord,
  ManualPaymentResult,
  ManualPaymentSubmitInput,
  SupportedBank,
} from "./types";
/** `GET /api/payment-entry/manual` — the customer's own manual requests. */
export function fetchManualRequests(language: string): Promise<ManualPaymentListPayload> {
  const params = new URLSearchParams({ language });
  return getJson<ManualPaymentListPayload>(`/api/payment-entry/manual?${params.toString()}`);
}

/** `GET /api/payment-entry/manual/[name]` — one own request. */
export function fetchManualRequest(
  name: string,
  language: string
): Promise<ManualPaymentRecord> {
  const params = new URLSearchParams({ language });
  return getJson<ManualPaymentRecord>(
    `/api/payment-entry/manual/${encodeURIComponent(name)}?${params.toString()}`
  );
}

/** `GET /api/payment-entry/manual/banks` — enabled supported banks. */
export function fetchSupportedBanks(): Promise<{ banks: SupportedBank[] }> {
  return getJson<{ banks: SupportedBank[] }>("/api/payment-entry/manual/banks");
}

/** `POST /api/payment-entry/manual` — submit a proof for verification. */
export function submitManualPaymentRequest(
  input: ManualPaymentSubmitInput
): Promise<ManualPaymentResult> {
  return postJson<ManualPaymentResult>("/api/payment-entry/manual", input);
}

