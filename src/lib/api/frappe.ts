/**
 * Server-side Frappe client.
 *
 * Every call to the ERP goes through a Next.js route handler, never the
 * browser:
 *
 *  - the ERP API is not exposed to the client,
 *  - the `sid` cookie stays HttpOnly on the portal origin,
 *  - Frappe's HTTP errors are normalised before they reach the UI, so a
 *    `frappe.throw()` message is never replaced by a generic
 *    "Request failed with status code 417".
 */

const METHOD_BASE = "/api/method/";

const DEFAULT_TIMEOUT_MS = 15_000;

export type FrappeFailureCode =
  | "not_configured"
  | "upstream_unreachable"
  | "upstream_error"
  | "invalid_payload"
  | "not_authenticated"
  | "rate_limited"
  | "validation_error";

export interface FrappeFailure {
  ok: false;
  status: number;
  code: FrappeFailureCode;
  message: string;
}

export interface FrappeSuccess<T> {
  ok: true;
  status: number;
  data: T;
  setCookies: string[];
}

export type FrappeResult<T> = FrappeSuccess<T> | FrappeFailure;

export interface CallFrappeOptions {
  /** HTTP verb used towards Frappe. Defaults to GET. */
  httpMethod?: "GET" | "POST";
  body?: unknown;
  /** ERP `sid` to forward, if the caller has one. */
  sid?: string | null;
  timeoutMs?: number;
}

export function frappeBaseUrl(): string {
  const raw = process.env.FRAPPE_BASE_URL || process.env.NEXT_PUBLIC_FRAPPE_BASE_URL || "";
  return raw.trim().replace(/\/+$/, "");
}

function parseJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * `_server_messages` is a JSON string holding an array of JSON strings.
 * Each entry is either the message itself or an object with `.message`.
 */
function parseServerMessages(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        if (typeof entry !== "string") return "";

        try {
          const object = JSON.parse(entry) as { message?: unknown };
          return typeof object?.message === "string" ? object.message : entry;
        } catch {
          return entry;
        }
      })
      .map((entry) => stripHtml(entry))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function extractMessage(payload: unknown, fallback: string): string {
  const record = (payload ?? {}) as Record<string, unknown>;

  const serverMessages = parseServerMessages(record._server_messages);
  if (serverMessages.length) return serverMessages[0];

  if (typeof record.message === "string" && record.message.trim()) {
    return stripHtml(record.message);
  }

  if (Array.isArray(record.messages) && typeof record.messages[0] === "string") {
    return stripHtml(record.messages[0]);
  }

  return fallback;
}

/** Frappe wraps whitelist return values in `{"message": ...}`. */
function unwrapEnvelope<T>(payload: unknown): T {
  const record = (payload ?? {}) as Record<string, unknown>;
  const envelope = "message" in record ? record.message : payload;

  const inner = (envelope ?? {}) as Record<string, unknown>;
  if (inner && typeof inner === "object" && "data" in inner && "ok" in inner) {
    return inner.data as T;
  }

  return envelope as T;
}

function normalizeFailure(response: Response, payload: unknown): FrappeFailure {
  const status = response.status;
  const record = (payload ?? {}) as Record<string, unknown>;
  const excType = typeof record.exc_type === "string" ? record.exc_type : "";
  const message = extractMessage(payload, "The ERP rejected the request. Please try again.");

  if (status === 429 || excType === "RateLimitExceededError") {
    return { ok: false, status: 429, code: "rate_limited", message };
  }

  if (excType === "AuthenticationError") {
    return {
      ok: false,
      status: status === 401 ? 401 : 502,
      code: "not_authenticated",
      message,
    };
  }

  if (excType === "ValidationError" || status === 417 || status === 418) {
    // Validation refusals are normal, expected outcomes: hand them to the UI as
    // a readable message instead of an opaque HTTP failure.
    return { ok: false, status: 200, code: "validation_error", message };
  }

  return { ok: false, status: 502, code: "upstream_error", message };
}

export async function callFrappe<T>(
  method: string,
  options: CallFrappeOptions = {}
): Promise<FrappeResult<T>> {
  const base = frappeBaseUrl();

  if (!base) {
    return {
      ok: false,
      status: 502,
      code: "not_configured",
      message:
        "The portal is not connected to an ERP server yet (FRAPPE_BASE_URL is not set).",
    };
  }

  const { httpMethod = "GET", body, sid, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const target = new URL(base);
  const headers = new Headers({ accept: "application/json" });

  // Frappe resolves the *site* from `x-forwarded-host`. It must be the ERP
  // host, never the portal host, or the session lands on the wrong site and
  // every authenticated call arrives as Guest.
  headers.set("x-forwarded-host", target.host);
  headers.set("x-forwarded-proto", target.protocol.replace(":", ""));

  if (sid) headers.set("cookie", `sid=${sid}`);

  let payload: string | undefined;
  if (body !== undefined) {
    headers.set("content-type", "application/json");
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${base}${METHOD_BASE}${method}`, {
      method: httpMethod,
      headers,
      body: payload,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return {
      ok: false,
      status: 502,
      code: "upstream_unreachable",
      message: "The ERP server could not be reached. Please try again in a moment.",
    };
  }

  const text = await response.text();
  const parsed = parseJson(text);

  if (response.ok) {
    return {
      ok: true,
      status: response.status,
      data: unwrapEnvelope<T>(parsed),
      setCookies: response.headers.getSetCookie?.() ?? [],
    };
  }

  return normalizeFailure(response, parsed);
}

/** Read the ERP `sid` out of a login response's `Set-Cookie` headers. */
export function extractSid(setCookies: string[]): string | null {
  const pattern = /(?:^|[,\s])sid=([^;,\s]+)/;

  for (const header of setCookies) {
    const match = header.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}
