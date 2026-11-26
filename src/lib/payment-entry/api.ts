"use client";

import { getJson } from "@/lib/api/http";

import type { PaymentEntryDetails, PaymentEntryListPayload } from "./types";

/** `GET /api/payment-entry` — the customer's own submitted payments + summary. */
export function fetchPayments(language: string): Promise<PaymentEntryListPayload> {
  const params = new URLSearchParams({ language });
  return getJson<PaymentEntryListPayload>(`/api/payment-entry?${params.toString()}`);
}

/** `GET /api/payment-entry/[name]` — one own payment, with reference rows. */
export function fetchPaymentDetails(
  name: string,
  language: string
): Promise<PaymentEntryDetails> {
  const params = new URLSearchParams({ language });
  return getJson<PaymentEntryDetails>(
    `/api/payment-entry/${encodeURIComponent(name)}?${params.toString()}`
  );
}
