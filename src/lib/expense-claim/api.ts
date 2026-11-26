"use client";

import { getJson, postJson } from "@/lib/api/http";

import type {
  ExpenseClaimCreateResult,
  ExpenseClaimDetails,
  ExpenseClaimFormValues,
  ExpenseClaimLinkOptionsPayload,
  ExpenseClaimListPayload,
  ExpenseClaimSchema,
} from "./types";

/** `GET /api/expense-claim/schema` — the New Expense Claim field catalogue. */
export function fetchExpenseClaimSchema(language: string): Promise<ExpenseClaimSchema> {
  const params = new URLSearchParams({ language });
  return getJson<ExpenseClaimSchema>(`/api/expense-claim/schema?${params.toString()}`);
}

/** `GET /api/expense-claim` — the employee's own claims + summary. */
export function fetchExpenseClaims(language: string): Promise<ExpenseClaimListPayload> {
  const params = new URLSearchParams({ language });
  return getJson<ExpenseClaimListPayload>(`/api/expense-claim?${params.toString()}`);
}

/** `GET /api/expense-claim/[name]` — one own claim, with expense rows. */
export function fetchExpenseClaimDetails(
  name: string,
  language: string
): Promise<ExpenseClaimDetails> {
  const params = new URLSearchParams({ language });
  return getJson<ExpenseClaimDetails>(`/api/expense-claim/${encodeURIComponent(name)}?${params.toString()}`);
}

/** `GET /api/expense-claim/link-options` — real option rows for a Link field. */
export function fetchExpenseClaimLinkOptions(
  doctype: string,
  txt: string | undefined,
  language: string
): Promise<ExpenseClaimLinkOptionsPayload> {
  const params = new URLSearchParams({ doctype, language });
  if (txt && txt.trim()) params.set("txt", txt.trim());

  return getJson<ExpenseClaimLinkOptionsPayload>(
    `/api/expense-claim/link-options?${params.toString()}`
  );
}

/** `POST /api/expense-claim` — insert a real, Draft ERPNext Expense Claim. */
export function createExpenseClaim(
  values: ExpenseClaimFormValues,
  language: string
): Promise<ExpenseClaimCreateResult> {
  return postJson<ExpenseClaimCreateResult>("/api/expense-claim", { data: values, language });
}
