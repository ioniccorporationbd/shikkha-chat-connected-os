import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pin / unpin one message of a ticket conversation.
 *
 * The backend keeps a single pin per ticket per customer in the shared cache
 * (no new DocType, field or table) and returns the resulting pinned id, which
 * `getTicket()` echoes so the details page can render the pinned message.
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

  const result = await callFrappe<{ pinnedMessageId?: string | null }>(
    "shikkha_os.api.v1.help_desk.pin_message",
    { sid, httpMethod: "POST", body: { ...body, name: id } }
  );

  if (!result.ok) {
    if (result.status === 401) return clearSessionCookie(fromFrappeFailure(result));
    return fromFrappeFailure(result);
  }

  return jsonOk(result.data);
}
