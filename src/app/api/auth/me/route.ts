import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonOk } from "@/lib/api/respond";
import {
  DEFAULT_SESSION_SECONDS,
  LOGIN_PATH,
  readCookie,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GUEST: SessionPayload = {
  authenticated: false,
  user: null,
  redirect_to: LOGIN_PATH,
  session_expiry_seconds: DEFAULT_SESSION_SECONDS,
};

/** Session probe + keep-alive. Never 401s: "not signed in" is a valid answer. */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);

  if (!sid) return jsonOk(GUEST);

  const result = await callFrappe<SessionPayload>("shikkha_os.api.v1.auth.session", { sid });

  if (!result.ok) {
    if (result.status === 401) return clearSessionCookie(jsonOk(GUEST));
    return fromFrappeFailure(result);
  }

  if (!result.data?.authenticated) return clearSessionCookie(jsonOk(GUEST));

  return jsonOk(result.data);
}
