"use client";

import { getJson, postJson } from "@/lib/api/http";

import type {
  JournalEntryCreateInput,
  JournalEntryDetail,
  JournalEntryFormContext,
  JournalEntryListResult,
  JournalEntryResult,
  SelectOption,
} from "./types";

/** Load the form context (companies, accounts, cost centres, voucher types). */
export function fetchJournalEntryContext(
  company: string | undefined,
  language: string
): Promise<JournalEntryFormContext> {
  const params = new URLSearchParams({ language, _ts: String(Date.now()) });
  if (company) params.set("company", company);
  return getJson<JournalEntryFormContext>(`/api/journal-entry/context?${params.toString()}`);
}

/** Supplier / Customer options for the Party link on a payable/receivable line. */
export async function fetchJournalParties(
  partyType: string,
  language: string
): Promise<SelectOption[]> {
  const params = new URLSearchParams({ party_type: partyType, language });
  const data = await getJson<{ options: SelectOption[] }>(
    `/api/journal-entry/parties?${params.toString()}`
  );
  return Array.isArray(data?.options) ? data.options : [];
}

/** Create a Draft Journal Entry in the ERP. */
export function createJournalEntry(
  values: JournalEntryCreateInput,
  language: string
): Promise<JournalEntryResult> {
  return postJson<JournalEntryResult>("/api/journal-entry/create", { data: values, language });
}

/** List the created Journal Entries shown in the history table. */
export function fetchJournalEntries(language: string): Promise<JournalEntryListResult> {
  const params = new URLSearchParams({ language, _ts: String(Date.now()) });
  return getJson<JournalEntryListResult>(`/api/journal-entry/list?${params.toString()}`);
}

/** One Journal Entry's account lines (party type + party) for the details popup. */
export function fetchJournalEntryDetail(
  name: string,
  language: string
): Promise<JournalEntryDetail> {
  const params = new URLSearchParams({ name, language, _ts: String(Date.now()) });
  return getJson<JournalEntryDetail>(`/api/journal-entry/detail?${params.toString()}`);
}
