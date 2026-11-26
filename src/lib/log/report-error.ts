"use client";

/**
 * One-line error reporting for the portal.
 *
 * The requirement is deliberately simple: when something breaks in the browser,
 * it must be visible **both**
 *
 *  1. in the browser console (`[client-error] ...`, with the detail object), and
 *  2. in the ERP Error Log at `/desk/system/error-log`
 *     (`shikkha_os: portal client error`), so the same incident can be traced
 *     server-side without asking the user to reproduce it.
 *
 * Failures of the reporter itself are swallowed: reporting must never break the
 * page it is reporting about. Nothing secret is ever sent (no cookie, no sid, no
 * password fields); the message is clipped before it leaves the browser.
 */

const ENDPOINT = "/api/log/client-error";
const MAX_FIELD = 2000;
const MAX_SENT_PER_PAGE = 20;

export interface ClientErrorInput {
  /** Short subsystem tag, e.g. "help-desk:create", "window:error". */
  scope: string;
  /** Human-readable one-liner. */
  message: string;
  /** Anything helpful (API code, status, stack, target path). Optional. */
  detail?: unknown;
}

let sent = 0;
const seen = new Set<string>();

function clip(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;

  let text: string;

  if (typeof value === "string") {
    text = value;
  } else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = String(value);
    }
  }

  text = text.trim();
  if (!text) return undefined;

  return text.length > MAX_FIELD ? `${text.slice(0, MAX_FIELD)}...` : text;
}

function currentPage(): string | undefined {
  if (typeof window === "undefined") return undefined;

  return clip(window.location.href);
}

/**
 * Report a client-side error to the console **and** to the ERP Error Log.
 *
 * Safe to call from any client component; never throws and never awaits. The
 * same scope+message twice on one page is only sent once, and a hard cap stops
 * an error loop from flooding the Error Log.
 */
export function reportClientError({ scope, message, detail }: ClientErrorInput): void {
  const text = clip(message) ?? "Unknown client error";

  // The console copy is unconditional: it is the developer-facing half and it
  // still helps when the portal has no ERP session to log against.
  try {
    console.error(`[client-error:${scope}]`, text, detail ?? "");
  } catch {
    /* console unavailable - ignore */
  }

  if (typeof window === "undefined") return;

  const signature = `${scope}|${text}`;
  if (seen.has(signature) || sent >= MAX_SENT_PER_PAGE) return;
  seen.add(signature);
  sent += 1;

  const body = JSON.stringify({
    scope: clip(scope) ?? "client",
    message: text,
    detail: clip(detail),
    page: currentPage(),
  });

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }

    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => undefined);
  } catch {
    /* reporting must never surface its own failure */
  }
}
