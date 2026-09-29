import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { ProfileImageUploadResult } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for staging a new profile picture.
 *
 * The image (base64, from the edit form) is forwarded to the ERP, which saves it
 * privately against the caller's own account and returns the file url. The
 * picture is only attached to the account when the OTP step commits the edit —
 * this route just uploads the bytes.
 *
 * The upload can be a couple of megabytes, so the upstream timeout is raised.
 */
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

  const result = await callFrappe<ProfileImageUploadResult>(
    "shikkha_os.api.v1.profile.upload_image",
    { sid, httpMethod: "POST", body, timeoutMs: 30_000 }
  );

  if (!result.ok) {
    if (result.status === 401) return clearSessionCookie(fromFrappeFailure(result));
    return fromFrappeFailure(result);
  }

  return jsonOk(result.data);
}
