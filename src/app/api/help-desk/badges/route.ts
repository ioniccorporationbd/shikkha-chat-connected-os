import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { HelpDeskBadgesPayload } from "@/lib/help-desk/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the Help Desk activity badges.
 *
 * GET -> shikkha_os.api.v1.help_desk_messages.help_desk_badges
 *
 * The ERP counts unread `Communication` rows for the session user across the
 * tickets that user may already open. Nothing is cached here: a badge that
 * lags reality is worse than no badge.
 */

const BADGES_METHOD = "shikkha_os.api.v1.help_desk_messages.help_desk_badges";

export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  const language = incoming.get("language");
  query.set("language", language || "bn");

  const result = await callFrappe<HelpDeskBadgesPayload>(`${BADGES_METHOD}?${query.toString()}`, { sid });

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
