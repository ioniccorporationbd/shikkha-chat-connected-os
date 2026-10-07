"use client";

import { postJson } from "@/lib/api/http";

import type {
  SslcommerzInitiateInput,
  SslcommerzInitiateResult,
  SslcommerzStatusResult,
} from "./types";

/** `POST /api/payment-entry/sslcommerz/initiate` — open a gateway session. */
export function initiateSslcommerzRequest(
  input: SslcommerzInitiateInput
): Promise<SslcommerzInitiateResult> {
  return postJson<SslcommerzInitiateResult>("/api/payment-entry/sslcommerz/initiate", input);
}

/** `POST /api/payment-entry/sslcommerz/status` — the DB-backed status of a txn. */
export function fetchSslcommerzStatusRequest(
  tranId: string,
  language: string
): Promise<SslcommerzStatusResult> {
  return postJson<SslcommerzStatusResult>("/api/payment-entry/sslcommerz/status", {
    tran_id: tranId,
    language,
  });
}
