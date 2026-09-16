import { NextResponse } from "next/server";

import { callFrappe, extractSid } from "@/lib/api/frappe";
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
 * Browser -> portal -> ERP. The ERP `sid` never reaches the browser as anything
 * other than an HttpOnly cookie scoped to this origin.
 */
export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const usr = typeof payload.usr === "string" ? payload.usr.trim() : "";
  const pwd = typeof payload.pwd === "string" ? payload.pwd : "";

  if (!usr || !pwd) {
    return jsonFail("Enter your email and password.", "validation_error", 200);
  }

  const result = await callFrappe<SessionPayload>("shikkha_os.api.v1.auth.login", {
    httpMethod: "POST",
    body: { usr, pwd },
  });

  if (!result.ok) return fromFrappeFailure(result);

  const sid = extractSid(result.setCookies);

  if (!sid) {
    return jsonFail(
      "The ERP did not return a session. Please try again.",
      "no_session",
      502
    );
  }

  const response: NextResponse = jsonOk(result.data);

  response.cookies.set(
    SESSION_COOKIE,
    sid,
    sessionCookieOptions(request, result.data?.session_expiry_seconds ?? DEFAULT_SESSION_SECONDS)
  );

  return response;
}
