import { NextResponse } from "next/server";

import type { FrappeFailure } from "@/lib/api/frappe";
import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * One response contract for every portal route handler.
 *
 *   success                  -> 200 { success: true,  data }
 *   Frappe validation error  -> 200 { success: false, message, code }   (per proxy convention)
 *   not signed in            -> 401 { success: false, message, code }
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

export function fromFrappeFailure(failure: FrappeFailure): NextResponse {
  return jsonFail(failure.message, failure.code, failure.status);
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
