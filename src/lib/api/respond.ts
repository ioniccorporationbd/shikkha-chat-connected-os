import { NextResponse } from "next/server";

import type { FrappeFailure } from "@/lib/api/frappe";
import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * One response contract for every portal route handler.
 *
 *   success                  -> 200 { success: true,  data }
 *   Frappe validation error  -> 200 { success: false, message, code }   (per proxy convention)
 *   not signed in            -> 401 { success: false, message, code, reason }
 *   throttled                -> 429 { success: false, message, code }
 *   anything else upstream   -> 502 { success: false, message, code }
 *
 * A raw Frappe 417 never reaches the browser: it is rewritten to a 200 carrying
 * the real message, so the UI shows what the backend actually said.
 */
export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonFail(message: string, code: string, status: number): NextResponse {
  return NextResponse.json({ success: false, message, code }, { status });
}

/**
 * Forward a Frappe failure. The `reason` (when the classifier produced one) is
 * kept so a 401 can be read precisely in the Network tab instead of guessed at.
 */
export function fromFrappeFailure(failure: FrappeFailure): NextResponse {
  if (failure.reason) {
    return NextResponse.json(
      { success: false, message: failure.message, code: failure.code, reason: failure.reason },
      { status: failure.status }
    );
  }

  return jsonFail(failure.message, failure.code, failure.status);
}

/**
 * The portal session is gone on *this* request — say which kind of gone:
 *
 *   `no_sid_cookie`        the browser sent no `shikkha_os_sid` at all
 *                          (cookie expired, never set, or dropped by the browser)
 *   `session_expired`      the cookie was there but the ERP no longer knows it
 *   `erp_rejected_session` the ERP answered 401 without claiming expiry and the
 *                          probe could not confirm the session either
 *
 * The wording shown to the customer is identical; the reason exists for
 * diagnostics (Network tab + server log) and never contains session material.
 */
export function jsonSessionExpired(
  reason: "no_sid_cookie" | "session_expired" | "erp_rejected_session"
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      code: "not_authenticated",
      reason,
      message: "Your session has expired. Please sign in again.",
    },
    { status: 401 }
  );
}

/** Drop the portal session cookie (used when the ERP says the session is gone). */
export function clearSessionCookie<T extends NextResponse>(response: T): T {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
