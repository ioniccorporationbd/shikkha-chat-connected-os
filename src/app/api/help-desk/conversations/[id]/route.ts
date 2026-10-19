import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
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
 */

const DETAIL_METHOD = "shikkha_os.api.v1.help_desk_messages.get_conversation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const { id } = await params;
  if (!id) return jsonFail("The ticket could not be found.", "not_found", 404);

  const query = new URLSearchParams({ name: id });
  const language = new URL(request.url).searchParams.get("language");
  query.set("language", language === "en" ? "en" : "bn");

  const result = await callFrappe<ConversationPayload>(`${DETAIL_METHOD}?${query.toString()}`, { sid });

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
