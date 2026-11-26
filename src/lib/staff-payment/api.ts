"use client";

import { getJson, postJson } from "@/lib/api/http";

import type {
  PartyOptionsPayload,
  PaymentEntryCreateInput,
  PaymentEntryFormContext,
  PaymentEntryResult,
} from "./types";

/**
 * Client bindings for the staff Payment Entry form.
 *
 * All four routes are same-origin Next.js proxies that forward to the
 * `shikkha_os.api.v1.staff_payment` whitelisted methods with the session sid.
 * The browser never talks to the ERP directly and never chooses the ledger
 * accounts of a Receive/Pay — the ERP resolves them from the party + mode.
 */

/** Dropdown catalogue: payment types, party types, modes, transfer accounts. */
export function fetchPaymentEntryFormContext(language: string): Promise<PaymentEntryFormContext> {
  const params = new URLSearchParams({ language });
  return getJson<PaymentEntryFormContext>(`/api/payment-entry/options?${params.toString()}`);
}

/** Link-search rows for a party type (Customer / Employee / Shareholder / Supplier). */
export function fetchPaymentEntryParties(
  partyType: string,
  txt: string | undefined,
  language: string
): Promise<PartyOptionsPayload> {
  const params = new URLSearchParams({ party_type: partyType, language });
  if (txt && txt.trim()) params.set("txt", txt.trim());
  return getJson<PartyOptionsPayload>(`/api/payment-entry/parties?${params.toString()}`);
}

/** Create a real, Draft ERPNext Payment Entry from the form values. */
export function createPaymentEntry(
  values: PaymentEntryCreateInput,
  language: string
): Promise<PaymentEntryResult> {
  return postJson<PaymentEntryResult>("/api/payment-entry/create", { data: values, language });
}
