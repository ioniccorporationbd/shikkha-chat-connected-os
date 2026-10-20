import { callFrappe } from "@/lib/api/frappe";
import { clearSessionCookie, fromFrappeFailure, jsonFail, jsonOk } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Delete one conversation message.
 *
 * Chat messages are `Communication` records, so this removes exactly that
 * record through Frappe's own permission-checked delete — the portal never
 * keeps a shadow copy and never invents a "deleted" column.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const { id } = await params;
  // Synthetic ids (`created`, `status:<at>`) are markers the ERP derives from
  // the ticket itself; there is no record behind them to delete.
  if (!id || id === "created" || id.startsWith("status:")) {
    return jsonFail("This entry is a ticket event, not a message.", "validation_error", 400);
  }

  const result = await callFrappe<unknown>("frappe.client.delete", {
    sid,
    httpMethod: "POST",
    body: { doctype: "Communication", name: id },
  });

  if (!result.ok) {
    if (result.status === 401) return clearSessionCookie(fromFrappeFailure(result));
    return fromFrappeFailure(result);
  }

  return jsonOk({ deleted: true });
}
