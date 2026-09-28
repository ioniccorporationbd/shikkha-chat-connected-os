import { callFrappe, logAuthEvent } from "@/lib/api/frappe";
import { fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import type { LoginOtpStartPayload } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Step 1 of OTP sign-in: browser -> portal -> ERP.
 *
 * Forwards the identifier (email OR mobile) to
 * `shikkha_os.api.v1.auth.send_login_otp`, which stores a one-time code and
 * delivers it over MiMSMS (SMS) + SendGrid (email) — the same channels the
 * sign-up flow uses. The ERP returns a masked destination plus per-channel
 * delivery flags; the portal never sees the code.
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
  const password = typeof payload.password === "string" ? payload.password : "";
  const language = typeof payload.language === "string" && payload.language.trim() ? payload.language.trim() : "bn";

  if (!identifier) {
    return jsonFail("Enter your email or mobile number.", "validation_error", 200);
  }

  if (!password) {
    return jsonFail("Enter your password.", "validation_error", 200);
  }

  const result = await callFrappe<LoginOtpStartPayload>(
    "shikkha_os.api.v1.auth.send_login_otp",
    { httpMethod: "POST", body: { identifier, password, language } }
  );

  if (!result.ok) {
    logAuthEvent(
      `login otp send rejected for ${identifier}: code=${result.code} status=${result.status} message=${result.message}`
    );
    return fromFrappeFailure(result);
  }

  logAuthEvent(
    `login otp sent for ${identifier} (sms=${result.data?.delivery?.sms} email=${result.data?.delivery?.email})`
  );

  return jsonOk(result.data);
}
