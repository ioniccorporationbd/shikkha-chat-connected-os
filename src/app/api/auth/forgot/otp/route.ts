import { callFrappe, logAuthEvent } from "@/lib/api/frappe";
import { fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import type { ResetOtpStartPayload } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Forgot-password step 1: browser -> portal -> ERP.
 *
 * Forwards the identifier (email OR mobile) to
 * `shikkha_os.api.v1.auth.send_reset_otp`, which stores a reset code and
 * delivers it over the channel the caller typed (SMS for a mobile number, email
 * for an address). The ERP returns the channel, a masked destination and a
 * per-channel delivery flag; the portal never sees the code.
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
  const language =
    typeof payload.language === "string" && payload.language.trim() ? payload.language.trim() : "bn";

  if (!identifier) {
    return jsonFail("Enter your email or mobile number.", "validation_error", 200);
  }

  const result = await callFrappe<ResetOtpStartPayload>("shikkha_os.api.v1.auth.send_reset_otp", {
    httpMethod: "POST",
    body: { identifier, language },
  });

  if (!result.ok) {
    logAuthEvent(
      `reset otp send rejected for ${identifier}: code=${result.code} status=${result.status} message=${result.message}`
    );
    return fromFrappeFailure(result);
  }

  logAuthEvent(`reset otp sent for ${identifier} (channel=${result.data?.channel})`);

  return jsonOk(result.data);
}
