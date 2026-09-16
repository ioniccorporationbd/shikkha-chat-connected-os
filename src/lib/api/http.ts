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

export async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await api.post<ApiEnvelope<T>>(url, body ?? {});
  return unwrap(response.data);
}

export async function getJson<T>(url: string): Promise<T> {
  const response = await api.get<ApiEnvelope<T>>(url);
  return unwrap(response.data);
}
