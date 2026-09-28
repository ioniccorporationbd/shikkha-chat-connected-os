import { NextResponse } from "next/server";

import { callFrappe, extractSid, logAuthEvent } from "@/lib/api/frappe";
import { fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import {
  DEFAULT_SESSION_SECONDS,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Step 2 of OTP sign-in: browser -> portal -> ERP.
 *
 * `shikkha_os.api.v1.auth.verify_login_otp` checks the code and opens a session
 * **without a password**. From here it is exactly the password login flow: the
 * ERP `sid` becomes an HttpOnly cookie on this origin.
 */
export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const identifier = typeof payload.identifier === "string" ? payload.identifier.trim() : "";
  const otp = typeof payload.otp === "string" ? payload.otp.trim() : "";
  const language = typeof payload.language === "string" && payload.language.trim() ? payload.language.trim() : "bn";

  if (!identifier || !otp) {
    return jsonFail("Enter the OTP code we sent you.", "validation_error", 200);
  }

  const result = await callFrappe<SessionPayload>(
    "shikkha_os.api.v1.auth.verify_login_otp",
    { httpMethod: "POST", body: { identifier, otp, language } }
  );

  if (!result.ok) {
    logAuthEvent(
      `login otp verify rejected for ${identifier}: code=${result.code} status=${result.status} message=${result.message}`
    );
    return fromFrappeFailure(result);
  }

  const sid = extractSid(result.setCookies);

  if (!sid) {
    logAuthEvent(`login otp verify accepted for ${identifier} but the ERP returned no sid cookie`);
    return jsonFail("The ERP did not return a session. Please try again.", "no_session", 502);
  }

  logAuthEvent(`login otp ok for ${identifier}`);

  const response: NextResponse = jsonOk(result.data);

  response.cookies.set(
    SESSION_COOKIE,
    sid,
    sessionCookieOptions(request, result.data?.session_expiry_seconds ?? DEFAULT_SESSION_SECONDS)
  );

  return response;
}
