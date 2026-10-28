import { callFrappeWithSessionCheck } from "@/lib/api/frappe";
import {
  clearSessionCookie,
  fromFrappeFailure,
  jsonFail,
  jsonOk,
  jsonSessionExpired,
} from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST one emoji reaction toggle onto a single message.
 *
 * -> shikkha_os.api.v1.help_desk_messages.set_message_reaction
 *
 * The ERP keeps the reaction on the message row itself, re-validates that the
 * message belongs to this ticket and applies the ticket's own read permission:
 * the browser only sends the message id and the emoji. The caller is the same
 * customer-or-agent session cookie the thread already uses — nothing here
 * identifies the user.
 */

const REACTION_METHOD = "shikkha_os.api.v1.help_desk_messages.set_message_reaction";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonSessionExpired("no_sid_cookie");
  if (!id) return jsonFail("The ticket could not be found.", "not_found", 404);

  let body: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    return jsonFail("A message and an emoji are required.", "bad_request", 400);
  }

  const messageId = String(body.message ?? "").trim();
  const emoji = String(body.emoji ?? "").trim();
  if (!messageId || !emoji) return jsonFail("A message and an emoji are required.", "bad_request", 400);

  const result = await callFrappeWithSessionCheck<{ message: string; reactions: unknown[] }>(
    REACTION_METHOD,
    {
      sid,
      httpMethod: "POST",
      body: { name: id, message: messageId, emoji, language: body.language },
    }
  );

  if (!result.ok) {
    if (result.status === 401) {
      const response = fromFrappeFailure(result);
      return result.reason === "session_expired" ? clearSessionCookie(response) : response;
    }
    return fromFrappeFailure(result);
  }

  return jsonOk(result.data);
}
