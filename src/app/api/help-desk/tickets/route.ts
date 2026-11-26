import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { HelpDeskListPayload, HelpDeskTicketPayload } from "@/lib/help-desk/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the customer's Help Desk tickets.
 *
 * GET  -> shikkha_os.api.v1.help_desk.list_tickets
 *         (the ERP scopes the query to the session user — the browser never
 *          sends, and cannot fake, an owner identifier)
 * POST -> shikkha_os.api.v1.help_desk.create_ticket
 *         (inserts a real HD Ticket; ownership comes from the sid cookie)
 *
 * Both endpoints live in the installed `helpdesk` app's data model: nothing is
 * stored in a second ticket table and permissions are Frappe's own.
 */

const LIST_METHOD = "shikkha_os.api.v1.help_desk.list_tickets";
const CREATE_METHOD = "shikkha_os.api.v1.help_desk.create_ticket";

/** Only the supported query keys are forwarded (no passthrough of arbitrary
 *  Frappe filters — the ERP decides what a customer may ask for). */
const ALLOWED_QUERY_KEYS = ["status", "priority", "search", "page", "page_size", "language"] as const;

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

  const result = await callFrappe<HelpDeskListPayload>(`${LIST_METHOD}?${query.toString()}`, { sid });

  if (!result.ok) {
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}

export async function POST(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  let body: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    body = {};
  }

  const result = await callFrappe<HelpDeskTicketPayload>(CREATE_METHOD, {
    sid,
    httpMethod: "POST",
    body,
  });

  if (!result.ok) {
    if (result.status === 401) return clearSessionCookie(fromFrappeFailure(result));
    return fromFrappeFailure(result);
  }

  return jsonOk(result.data);
}
