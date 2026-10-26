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
 * POST a message onto the ticket conversation.
 *
 * -> shikkha_os.api.v1.help_desk_messages.send_message
 *
 * Customer or employee: the ERP reads the session, decides which side the
 * author is on, applies the closed-ticket rule and writes a real
 * `Communication` row. `replyTo` is re-validated server-side against the same
 * ticket before the quote is stored.
 *
 * A 401 is verified before it is believed: the ERP raises `require_login()`
 * *before* it writes anything, so when the session probe confirms the session
 * is still alive the send is retried once — a single transient unauthenticated
 * answer must not turn a valid customer's message into "session expired". Only
 * a 401 the probe agrees with drops the cookie and shows the sign-in notice.
 */

const SEND_METHOD = "shikkha_os.api.v1.help_desk_messages.send_message";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sid = readCookie(request, SESSION_COOKIE);
  // No sid means the portal session already ended on this browser (expiry, a
  // cleared cookie, or a cookie the browser dropped). Say that — with a
  // machine-readable reason — so the composer does not read it as a random
  // failure: the customer is told to sign in again, and nothing is sent.
  if (!sid) {
    console.warn("[help-desk] send rejected: no portal session cookie", { ticket: id });
    return jsonSessionExpired("no_sid_cookie");
  }

  if (!id) return jsonFail("The ticket could not be found.", "not_found", 404);

  let body: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    body = {};
  }

  const result = await callFrappeWithSessionCheck<ConversationPayload>(SEND_METHOD, {
    sid,
    httpMethod: "POST",
    body: { ...body, name: id },
  });

  if (!result.ok) {
    if (result.status === 401) {
      // Leave a server-side trail (no session material) so a reported failure
      // shows the exact path it took.
      console.warn("[help-desk] send rejected: session no longer valid", {
        ticket: id,
        reason: result.reason ?? "unknown",
      });

      const response = fromFrappeFailure(result);
      // Drop the cookie only when Frappe itself said the session expired. A bare
      // 401 the probe could not confirm is reported, not acted on: discarding a
      // possibly-live session would force the very re-login we are avoiding.
      return result.reason === "session_expired" ? clearSessionCookie(response) : response;
    }

    return fromFrappeFailure(result);
  }

  return jsonOk(result.data);
}
