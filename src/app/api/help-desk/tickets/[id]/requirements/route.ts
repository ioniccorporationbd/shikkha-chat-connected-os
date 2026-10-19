import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { ConversationPayload } from "@/lib/help-desk/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST an additional requirement on an Open ticket.
 *
 * -> shikkha_os.api.v1.help_desk_messages.add_requirement
 *
 * Stored as one more `Communication` row on the same ticket — not a new
 * DocType, child table or local store. The ERP refuses it unless the ticket is
 * still Open at the instant of insert, and the requirement shows up in the
 * employee's problem view as well as the customer's thread.
 */

const REQUIREMENT_METHOD = "shikkha_os.api.v1.help_desk_messages.add_requirement";

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

  const result = await callFrappe<ConversationPayload>(REQUIREMENT_METHOD, {
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
