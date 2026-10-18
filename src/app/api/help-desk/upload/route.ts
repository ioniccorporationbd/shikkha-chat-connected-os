import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { HelpDeskUploadedFile } from "@/lib/help-desk/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hard ceiling kept in sync with `shikkha_os.api.v1.help_desk`. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Attachment upload proxy.
 *
 * The browser posts `{ file_name, content }` (base64) here; this route forwards
 * it to the whitelisted ERP method, which writes a real private `File` owned by
 * the signed-in user. The file is attached to a ticket later, server-side, by
 * the create/reply call — the client can neither choose a folder nor re-attach
 * somebody else's file.
 */
export async function POST(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  let body: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    return jsonFail("The file could not be read. Please try again.", "bad_file", 400);
  }

  const fileName = typeof body.file_name === "string" ? body.file_name : "";
  const content = typeof body.content === "string" ? body.content : "";
  if (!fileName || !content) {
    return jsonFail("The file could not be read. Please try again.", "bad_file", 400);
  }

  // Cheap pre-check so huge payloads never reach the ERP (base64 is ~4/3 the size).
  if (content.length > Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 4096) {
    return jsonFail("The file is larger than 5MB.", "file_too_large", 413);
  }

  const result = await callFrappe<HelpDeskUploadedFile>("shikkha_os.api.v1.help_desk.upload_attachment", {
    sid,
    httpMethod: "POST",
    body: { file_name: fileName, content },
  });

  if (!result.ok) {
    if (result.status === 401) return clearSessionCookie(fromFrappeFailure(result));
    return fromFrappeFailure(result);
  }

  return jsonOk(result.data);
}
