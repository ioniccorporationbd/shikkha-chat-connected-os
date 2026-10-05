"use client";

import { getJson, postJson } from "@/lib/api/http";

import type {
  CustomerCreateResult,
  CustomerDeleteResult,
  CustomerDetails,
  CustomerFormValues,
  CustomerLinkOptionsPayload,
  CustomerListPayload,
  CustomerSchema,
} from "./types";

/** `GET /api/customer/schema` — the sectioned Customer field catalogue. */
export function fetchCustomerSchema(language: string): Promise<CustomerSchema> {
  const params = new URLSearchParams({ language });
  return getJson<CustomerSchema>(`/api/customer/schema?${params.toString()}`);
}

/** `GET /api/customer/link-options` — real option rows for a Link field. */
export function fetchCustomerLinkOptions(
  doctype: string,
  txt: string | undefined,
  language: string
): Promise<CustomerLinkOptionsPayload> {
  const params = new URLSearchParams({ doctype, language });
  if (txt && txt.trim()) params.set("txt", txt.trim());

  return getJson<CustomerLinkOptionsPayload>(`/api/customer/link-options?${params.toString()}`);
}

/** `POST /api/customer/create` — insert a real ERPNext Customer document. */
export function createCustomer(
  values: CustomerFormValues,
  language: string
): Promise<CustomerCreateResult> {
  return postJson<CustomerCreateResult>("/api/customer/create", { data: values, language });
}

/** `GET /api/customer/list` — the signed-in user's own Customers (owner-scoped). */
export function fetchCustomerList(language: string): Promise<CustomerListPayload> {
  const params = new URLSearchParams({ language });
  return getJson<CustomerListPayload>(`/api/customer/list?${params.toString()}`);
}

/** `GET /api/customer/details` — prefill values for one owned Customer. */
export function fetchCustomerDetails(name: string, language: string): Promise<CustomerDetails> {
  const params = new URLSearchParams({ name, language });
  return getJson<CustomerDetails>(`/api/customer/details?${params.toString()}`);
}

/** `POST /api/customer/update` — update an owned Customer. */
export function updateCustomer(
  name: string,
  values: CustomerFormValues,
  language: string
): Promise<CustomerCreateResult> {
  return postJson<CustomerCreateResult>("/api/customer/update", { name, data: values, language });
}

/** `POST /api/customer/delete` — delete an owned Customer (standard Frappe delete). */
export function deleteCustomer(name: string, language: string): Promise<CustomerDeleteResult> {
  return postJson<CustomerDeleteResult>("/api/customer/delete", { name, language });
}
