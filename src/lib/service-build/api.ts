"use client";

import { getJson } from "@/lib/api/http";

import type { SalesInvoiceDetails, SalesInvoiceListPayload } from "./types";

/** `GET /api/service-build` — the customer's own invoices + summary. */
export function fetchInvoices(language: string): Promise<SalesInvoiceListPayload> {
  const params = new URLSearchParams({ language });
  return getJson<SalesInvoiceListPayload>(`/api/service-build?${params.toString()}`);
}

/** `GET /api/service-build/[name]` — one own invoice, with its item rows. */
export function fetchInvoiceDetails(
  name: string,
  language: string
): Promise<SalesInvoiceDetails> {
  const params = new URLSearchParams({ language });
  return getJson<SalesInvoiceDetails>(
    `/api/service-build/${encodeURIComponent(name)}?${params.toString()}`
  );
}
