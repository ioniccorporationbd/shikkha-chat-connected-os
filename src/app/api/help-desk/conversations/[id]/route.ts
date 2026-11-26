import { callFrappeWithSessionCheck } from "@/lib/api/frappe";
import {
  clearSessionCookie,
  fromFrappeFailure,
  jsonFail,
  jsonOk,
  jsonSessionExpired,
} from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { ConversationPayload } from "@/lib/help-desk/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One ticket conversation.
 *
 * GET -> shikkha_os.api.v1.help_desk_messages.get_conversation
 *
 * Returns the ticket, its full message history (with quote references and
 * attachments) and, as a side effect in the ERP, records this reader's read
 * state so the unread counter is never guessed on the client.
 *
 * This route is polled while a ticket is open, so a single transient 401 must
 * not sign the customer out mid-conversation: the session is probed and the
 * read retried once before any cookie is dropped.
 */

const DETAIL_METHOD = "shikkha_os.api.v1.help_desk_messages.get_conversation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonSessionExpired("no_sid_cookie");

  if (!id) return jsonFail("The ticket could not be found.", "not_found", 404);

  const query = new URLSearchParams({ name: id });
  const search = new URL(request.url).searchParams;
  const language = search.get("language");
  query.set("language", language === "en" ? "en" : "bn");
  // Paging passthrough — the ERP applies the window in SQL. Absent params keep
  // the old full-thread behaviour for every caller that does not ask for a page.
  const limit = Number.parseInt(search.get("limit") ?? "", 10);
  if (Number.isFinite(limit) && limit > 0) query.set("limit", String(Math.min(limit, 200)));
  const cursor = search.get("cursor");
  if (cursor) query.set("cursor", cursor);
  const since = search.get("since");
  if (since) query.set("since", since);

  const result = await callFrappeWithSessionCheck<ConversationPayload>(
    `${DETAIL_METHOD}?${query.toString()}`,
    { sid }
  );

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    // Same policy as the send route: only an expiry the ERP itself confirmed
    // discards the cookie, so one ambiguous 401 cannot sign a poller out.
    return result.status === 401 && result.reason === "session_expired"
      ? clearSessionCookie(response)
      : response;
  }

  return jsonOk(result.data);
}
