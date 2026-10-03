"use client";

import axios from "axios";

import type { ApiEnvelope } from "@/lib/auth/types";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

function fallbackMessage(status: number): string {
  if (status === 401) return "Please sign in to continue.";
  if (status === 429) return "Too many attempts. Please wait a few minutes.";
  if (status >= 500 || status === 0) return "The server is unavailable. Please try again.";
  return "Something went wrong. Please try again.";
}

// Normalise every failure into one ApiError so components never have to read
// axios internals - and so a normalised Frappe message always wins over the
// generic status text.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = (error?.response?.data ?? null) as Record<string, unknown> | null;
    const status: number = error?.response?.status ?? 0;

    const payloadMessage = typeof payload?.message === "string" ? payload.message.trim() : "";
    const message = payloadMessage || fallbackMessage(status);

    const payloadCode = typeof payload?.code === "string" ? payload.code : "";
    const code = payloadCode || "network_error";

    return Promise.reject(new ApiError(message, code, status));
  }
);

function unwrap<T>(envelope: ApiEnvelope<T> | undefined): T {
  if (!envelope) {
    throw new ApiError(fallbackMessage(0), "empty_response", 0);
  }

  if (envelope.success) return envelope.data;

  throw new ApiError(envelope.message, envelope.code, 200);
}

/**
 * Surface every failed portal call in the browser console with the portal's own
 * explanation (code + message). A bare "502 (Bad Gateway)" on its own never
 * names the cause; the portal's JSON body does, e.g.
 *   code=not_configured      the portal has no FRAPPE_BASE_URL
 *   code=upstream_unreachable the ERP host did not answer (DNS / down / TLS)
 *   code=upstream_error      the ERP answered 5xx / an HTML error page
 *   code=validation_error    the ERP refused the input (a normal outcome)
 */
// Failures that are a normal part of the flow (the ERP refused the input, or the
// portal user lacks a permission) are expected outcomes, not bugs - the comment
// above even calls validation_error "a normal outcome". Log those quietly with
// console.debug so they never shout on the error channel; keep console.error for
// the ones that are genuinely broken (unreachable host, misconfig, 5xx).
const QUIET_CODES = new Set(["validation_error", "not_permitted"]);

function logFailure(method: "GET" | "POST", url: string, error: unknown): void {
  if (process.env.NEXT_PUBLIC_HTTP_DEBUG === "0") return;

  const apiError = error as ApiError;
  const status = apiError?.status ?? 0;
  const code = apiError?.code ?? "network_error";
  const message = apiError?.message ?? (error instanceof Error ? error.message : String(error));
  const line = `[http] ${method} ${url} failed: status=${status} code=${code} message=${message}`;

  if (QUIET_CODES.has(code)) {
    console.debug(line);
    return;
  }

  console.error(line);
}

export async function postJson<T>(url: string, body?: unknown): Promise<T> {
  try {
    const response = await api.post<ApiEnvelope<T>>(url, body ?? {});
    return unwrap(response.data);
  } catch (error) {
    logFailure("POST", url, error);
    throw error;
  }
}

export async function getJson<T>(url: string): Promise<T> {
  try {
    const response = await api.get<ApiEnvelope<T>>(url);
    return unwrap(response.data);
  } catch (error) {
    logFailure("GET", url, error);
    throw error;
  }
}
