import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { ConversationPayload } from "@/lib/help-desk/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST a message onto the ticket conversation.
 *
 * -> shikkha_os.api.v1.help_desk_messages.send_message
 *
 * Customer or employee: the ERP reads the session, decides which side the
 * author is on, applies the closed-ticket rule and writes a real
 * `Communication` row. `replyTo` is re-validated server-side against the same
 * ticket before the quote is stored.
 */

const SEND_METHOD = "shikkha_os.api.v1.help_desk_messages.send_message";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const { id } = await params;
  if (!id) return jsonFail("The ticket could not be found.", "not_found", 404);

  let body: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    body = {};
  }

  const result = await callFrappe<ConversationPayload>(SEND_METHOD, {
    sid,
    httpMethod: "POST",
    body: { ...body, name: id },
  });

  if (!result.ok) {
    if (result.status === 401) return clearSessionCookie(fromFrappeFailure(result));
    return fromFrappeFailure(result);
  }

  return jsonOk(result.data);
}
