import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { callFrappe } from "@/lib/api/frappe";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Browser error intake.
 *
 * Forwards a client-side error to `shikkha_os.api.v1.client_log.report`, which
 * writes a normal Frappe **Error Log** entry (`shikkha_os: portal client error`)
 * that can be read in Desk at `/desk/system/error-log`. The ERP method does the
 * rate limiting and refuses unauthenticated callers, so this route only has to
 * normalise the payload and hand over the session cookie.
 *
 * Always answers 202: a reporter that returns an error would only produce more
 * errors in the page it is reporting about.
 */
export async function POST(request: Request) {
  const accepted = NextResponse.json({ ok: true }, { status: 202 });

  const body = (await request.json().catch(() => null)) as
    | { scope?: unknown; message?: unknown; detail?: unknown; page?: unknown }
    | null;

  if (!body || typeof body.message !== "string" || !body.message.trim()) {
    return accepted;
  }

  const cookieStore = await cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sid) return accepted;

  await callFrappe("shikkha_os.api.v1.client_log.report", {
    httpMethod: "POST",
    sid,
    body: {
      scope: typeof body.scope === "string" ? body.scope : "client",
      message: body.message,
      detail: typeof body.detail === "string" ? body.detail : undefined,
      page: typeof body.page === "string" ? body.page : undefined,
      user_agent: request.headers.get("user-agent") ?? undefined,
    },
  }).catch(() => undefined);

  return accepted;
}
