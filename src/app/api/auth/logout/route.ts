import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sign-out is best-effort towards the ERP and always clears the portal cookie,
 * so a user can never get stuck in a half-signed-in state.
 */
export async function POST(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);

  if (sid) {
    await callFrappe<SessionPayload>("shikkha_os.api.v1.auth.logout", { sid });
  }

  return clearSessionCookie(
    jsonOk<Pick<SessionPayload, "authenticated" | "user">>({
      authenticated: false,
      user: null,
    })
  );
}
