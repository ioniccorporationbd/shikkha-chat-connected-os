import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for the New-task form's dropdowns.
 *
 * GET -> leads.get_task_options: the four priority choices (High / Medium /
 * Low / No Priority) and the assignable staff — HR ▸ Employee, exactly the list
 * the Desk page shows at /desk/hr-setup/employee. Cached briefly: employees do
 * not change between two openings of the same form.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const url = new URL(request.url);
  const language = url.searchParams.get("language")?.trim() || "bn";

  const query = new URLSearchParams({ language });
  const result = await callFrappe(
    `shikkha_os.api.v1.leads.get_task_options?${query.toString()}`,
    { sid }
  );

  if (!result.ok) {
    console.error(`[leads] get_task_options failed: status=${result.status} code=${result.code}`);
    const response = fromFrappeFailure(result);
    return result.status === 401 ? clearSessionCookie(response) : response;
  }

  return jsonOk(result.data);
}
