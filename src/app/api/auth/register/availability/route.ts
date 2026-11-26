import { callFrappe } from "@/lib/api/frappe";
import { fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import type { RegisterAvailabilityPayload } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live "is this email/mobile still free?" probe for the sign-up form.
 *
 * A thin, guest-safe pass-through to `registration.availability` (which is
 * itself rate-limited). It only ever answers booleans, so it cannot leak any
 * account data beyond "taken / not taken".
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") ?? "").trim();
  const mobile = (url.searchParams.get("mobile") ?? "").trim();

  if (!email && !mobile) {
    return jsonFail("Provide an email or mobile number to check.", "validation_error", 200);
  }

  const query = new URLSearchParams();
  if (email) query.set("email", email);
  if (mobile) query.set("mobile", mobile);

  const result = await callFrappe<RegisterAvailabilityPayload>(
    `shikkha_os.api.v1.registration.availability?${query.toString()}`,
    { httpMethod: "GET" }
  );

  if (!result.ok) return fromFrappeFailure(result);

  return jsonOk(result.data);
}
