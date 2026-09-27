import { callFrappe, logAuthEvent } from "@/lib/api/frappe";
import { fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import type { RegisterStartPayload } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Step 1 of sign-up: browser -> portal -> ERP.
 *
 * Forwards the form to `shikkha_os.api.v1.registration.send_otp`, which stores a
 * one-time code and delivers it over MiMSMS (SMS) + SendGrid (email). The ERP
 * returns a masked destination and the TTL; the portal never sees the code.
 */
export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const full_name = str(payload.full_name);
  const email = str(payload.email);
  const mobile = str(payload.mobile);
  const password = typeof payload.password === "string" ? payload.password : "";
  const language = str(payload.language) || "bn";

  if (!full_name || !email || !mobile || !password) {
    return jsonFail("Please fill in every field.", "validation_error", 200);
  }

  const result = await callFrappe<RegisterStartPayload>(
    "shikkha_os.api.v1.registration.send_otp",
    { httpMethod: "POST", body: { full_name, email, mobile, password, language } }
  );

  if (!result.ok) {
    logAuthEvent(
      `register send_otp rejected for ${email}: code=${result.code} status=${result.status} message=${result.message}`
    );
    return fromFrappeFailure(result);
  }

  logAuthEvent(
    `register otp sent for ${email} (sms=${result.data?.delivery?.sms} email=${result.data?.delivery?.email})`
  );

  return jsonOk(result.data);
}
