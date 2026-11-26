import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Must stay in sync with `_MAX_ATTACHMENT_BYTES` in shikkha_os/api/v1/leads.py. */
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

/** Same allow-list the file picker offers — the ERP re-checks size, not type. */
const ALLOWED_EXTENSION = /\.(png|jpe?g|gif|webp|svg|pdf|docx?|xlsx?|csv|txt|zip)$/i;

/** Must stay in sync with `_MAX_COMMENT` in shikkha_os/api/v1/leads.py. */
const MAX_COMMENT = 5000;

/** Base64 length -> decoded byte length, without decoding the payload twice. */
function base64Bytes(value: string): number {
  const clean = value.replace(/[\r\n\s]/g, "");
  if (!clean) return 0;
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

/**
 * The comment box's paperclip (`/userDashboard/leads` -> বিস্তারিত -> মন্তব্য).
 *
 * POST -> leads.add_lead_comment_attachment: the bytes arrive here as base64
 * JSON and the site writes a PUBLIC `File` row (is_private=0 — the box in
 * `/desk/data/file` stays unchecked) plus the Comment whose HTML embeds the
 * picture, so the file shows in Desk and the image shows in the thread.
 * A text-only call (no file) falls through to the plain comment writer.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ name: string }> }
) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const { name } = await context.params;
  const leadName = (name || "").trim();
  if (!leadName) return jsonFail("A lead name is required.", "validation_error", 400);

  let body: { file_name?: unknown; content_base64?: unknown; content?: unknown; language?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonFail("A JSON body is required.", "validation_error", 400);
  }

  const fileName = typeof body.file_name === "string" ? body.file_name.trim() : "";
  const contentBase64 =
    typeof body.content_base64 === "string" ? body.content_base64.trim() : "";
  const text = typeof body.content === "string" ? body.content : "";

  if (text.length > MAX_COMMENT) {
    return jsonFail("The comment is too long.", "validation_error", 400);
  }

  if (!fileName && !contentBase64) {
    if (!text.trim()) {
      return jsonFail("Add a comment or attach a file.", "validation_error", 400);
    }
  } else {
    if (!fileName) return jsonFail("A file name is required.", "validation_error", 400);
    if (!ALLOWED_EXTENSION.test(fileName)) {
      return jsonFail("This file type is not allowed.", "validation_error", 400);
    }
    if (!contentBase64) return jsonFail("The file is empty.", "validation_error", 400);

    const bytes = base64Bytes(contentBase64);
    if (bytes <= 0) return jsonFail("The file is empty.", "validation_error", 400);
    if (bytes > MAX_ATTACHMENT_BYTES) {
      return jsonFail("The file cannot be larger than 5 MB.", "validation_error", 400);
    }
  }

  const language = typeof body.language === "string" && body.language ? body.language : "bn";
  const query = new URLSearchParams({ name: leadName, language });
  const result = await callFrappe<{ comment: unknown; file: unknown; images: unknown }>(
    `shikkha_os.api.v1.leads.add_lead_comment_attachment?${query.toString()}`,
    {
      sid,
      httpMethod: "POST",
      // `name` must ride in the body — Frappe binds a POST's kwargs from the
      // request body only, so a query-string name never reaches the endpoint.
      body: { name: leadName, file_name: fileName, content_base64: contentBase64, content: text, language },
    }
  );

  if (!result.ok) {
    console.error(
      `[leads] add_lead_comment_attachment failed: status=${result.status} code=${result.code}`
    );
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
