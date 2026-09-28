import { callFrappe, logAuthEvent } from "@/lib/api/frappe";
import { fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import type { ResetDonePayload } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Forgot-password step 2: browser -> portal -> ERP.
 *
 * `shikkha_os.api.v1.auth.verify_reset_otp` checks the code, replaces the
 * account's password with a fresh 6-digit value and sends it on the same channel
 * the code went to. No session is opened - the user returns to the sign-in form
 * and logs in with the new password.
 */
export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const identifier = typeof payload.identifier === "string" ? payload.identifier.trim() : "";
  const otp = typeof payload.otp === "string" ? payload.otp.trim() : "";
  const language =
    typeof payload.language === "string" && payload.language.trim() ? payload.language.trim() : "bn";

  if (!identifier || !otp) {
    return jsonFail("Enter the code we sent you.", "validation_error", 200);
  }

  const result = await callFrappe<ResetDonePayload>("shikkha_os.api.v1.auth.verify_reset_otp", {
    httpMethod: "POST",
    body: { identifier, otp, language },
  });

  if (!result.ok) {
    logAuthEvent(
      `reset otp verify rejected for ${identifier}: code=${result.code} status=${result.status} message=${result.message}`
    );
    return fromFrappeFailure(result);
  }

  logAuthEvent(`reset otp ok for ${identifier} (channel=${result.data?.channel})`);

  return jsonOk(result.data);
}
