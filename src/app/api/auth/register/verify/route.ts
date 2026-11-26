import { NextResponse } from "next/server";

import { callFrappe, extractSid, logAuthEvent } from "@/lib/api/frappe";
import { fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import {
  DEFAULT_SESSION_SECONDS,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";
import type { RegisterResultPayload } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Step 2 of sign-up: browser -> portal -> ERP.
 *
 * `shikkha_os.api.v1.registration.verify_otp` checks the code, creates the
 * **User** + **Customer**, and logs the new account in. From here it is exactly
 * the login flow: the ERP `sid` becomes an HttpOnly cookie on this origin.
 */
export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const full_name = str(payload.full_name);
  const email = str(payload.email);
  const mobile = str(payload.mobile);
  const password = typeof payload.password === "string" ? payload.password : "";
  const otp = str(payload.otp);
  const language = str(payload.language) || "bn";

  if (!email || !otp) {
    return jsonFail("Enter the OTP code we sent you.", "validation_error", 200);
  }

  const result = await callFrappe<RegisterResultPayload>(
    "shikkha_os.api.v1.registration.verify_otp",
    { httpMethod: "POST", body: { full_name, email, mobile, password, otp, language } }
  );

  if (!result.ok) {
    logAuthEvent(
      `register verify rejected for ${email}: code=${result.code} status=${result.status} message=${result.message}`
    );
    return fromFrappeFailure(result);
  }

  const sid = extractSid(result.setCookies);

  if (!sid) {
    logAuthEvent(`register verify accepted for ${email} but the ERP returned no sid cookie`);
    return jsonFail(
      "Your account was created, but the ERP did not return a session. Please sign in.",
      "no_session",
      502
    );
  }

  logAuthEvent(`register ok for ${email}`);

  const response: NextResponse = jsonOk(result.data);

  response.cookies.set(
    SESSION_COOKIE,
    sid,
    sessionCookieOptions(request, result.data?.session_expiry_seconds ?? DEFAULT_SESSION_SECONDS)
  );

  return response;
}
