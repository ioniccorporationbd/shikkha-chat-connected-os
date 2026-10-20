import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { ConversationListPayload } from "@/lib/help-desk/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the ticket conversations list.
 *
 * GET -> shikkha_os.api.v1.help_desk_messages.list_conversations
 *
 * One row per ticket that actually holds messages, built from the ERP's own
 * `Communication` records. The ERP decides which tickets the session user may
 * see, so the browser never sends (and cannot fake) an owner or role.
 */

const LIST_METHOD = "shikkha_os.api.v1.help_desk_messages.list_conversations";

/** Only these query keys are forwarded — the ERP decides everything else. */
const ALLOWED_QUERY_KEYS = ["search", "page", "page_size", "language", "include_empty", "statuses"] as const;

export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();

  for (const key of ALLOWED_QUERY_KEYS) {
    const value = incoming.get(key);
    if (value !== null) query.set(key, value);
  }
  if (!query.has("language")) query.set("language", "bn");

  const result = await callFrappe<ConversationListPayload>(`${LIST_METHOD}?${query.toString()}`, { sid });

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
