import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { HelpDeskTicketPayload } from "@/lib/help-desk/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Customer reply on an open ticket.
 *
 * Stored through the helpdesk app's own portal path
 * (`create_communication_via_contact`), so the message becomes a real
 * `Communication` record that agents see in the desk — no local comment store.
 */
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

  const result = await callFrappe<HelpDeskTicketPayload>("shikkha_os.api.v1.help_desk.reply_ticket", {
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
