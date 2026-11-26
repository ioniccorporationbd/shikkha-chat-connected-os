import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { ProfileDetails } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the caller's own editable profile.
 *
 *   GET -> the editable profile (populates the "Edit profile" form)
 *
 * A profile edit is no longer written directly here: the portal stages the
 * change and commits it only after the OTP step, so the write lives in the
 * `profile/otp` + `profile/otp/verify` routes. This route stays read-only.
 *
 * Only the caller's own session is forwarded, so the ERP acts on that account.
 * A 401 from the ERP clears the portal cookie (session gone).
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const result = await callFrappe<ProfileDetails>("shikkha_os.api.v1.profile.details", { sid });

  if (!result.ok) {
    if (result.status === 401) return clearSessionCookie(fromFrappeFailure(result));
    return fromFrappeFailure(result);
  }

  return jsonOk(result.data);
}
