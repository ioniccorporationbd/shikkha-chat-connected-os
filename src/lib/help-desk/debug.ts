import { reportClientError } from "@/lib/log/report-error";

import { erpStampOf, parseErpTimestamp } from "./format";
import type { ConversationPayload } from "./types";

/**
 * A readable trace of what the Help Desk actually fetched.
 *
 * Two complaints keep coming back on the portal thread — "the rows are out of
 * order" and "my picture came apart from my words" — and neither can be judged
 * from a screenshot: the answer is in *what the ERP returned and with which
 * stamp*. This module prints exactly that, row by row, in the browser console,
 * and reports the impossible cases to the ERP Error Log
 * (`/desk/system/error-log`) so a report from a customer's machine leaves a
 * trace on the server as well.
 *
 * It is silent unless switched on, either at build time
 * (`NEXT_PUBLIC_HELPDESK_DEBUG=1`) or, without a rebuild, from the browser:
 *
 *     localStorage.hdDebug = "1"; location.reload();
 *     localStorage.hdDebug = "0"; location.reload();   // back to quiet
 */

const DEBUG_KEY = "hdDebug";

/** One ticket is reported once per anomaly kind, not on every poll. */
const reported = new Set<string>();

export function helpDeskDebugEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_HELPDESK_DEBUG === "1") return true;
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DEBUG_KEY) === "1";
  } catch {
    return false;
  }
}

interface TraceRow {
  order: number;
  id: string;
  channel: string;
  author: string;
  rawStamp: string;
  /** Every field the row actually carried — the clue when no clock is found. */
  keys: string;
  localTime: string;
  epoch: number | "missing" | "invalid";
  words: string;
  files: string;
}

function describeRow(
  message: ConversationPayload["messages"][number],
  index: number
): TraceRow {
  const raw = erpStampOf(message);
  const date = raw.trim() ? parseErpTimestamp(raw) : null;
  const ms = date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
  return {
    order: index + 1,
    id: String(message.id ?? ""),
    channel: String(message.channel ?? ""),
    author: String(message.author ?? ""),
    rawStamp: raw,
    keys: Object.keys(message as unknown as Record<string, unknown>).join("|"),
    localTime: ms === null ? "—" : date!.toLocaleString("en-GB", { hour12: false }),
    epoch: ms ?? (raw.trim() ? "invalid" : "missing"),
    words: String(message.body ?? "").replace(/\s+/g, " ").slice(0, 70),
    files: (message.attachments ?? [])
      .map((file) => String(file.fileName || file.url || ""))
      .filter(Boolean)
      .join(", "),
  };
}

function reportOnce(key: string, message: string, detail: Record<string, unknown>): void {
  if (reported.has(key)) return;
  reported.add(key);
  reportClientError({ scope: "help-desk:timeline", message, detail });
}

/**
 * Log one fetched conversation: which ticket, what came back, each row with the
 * stamp the ERP sent and the instant this browser read it as, and whether the
 * drawn order still ascends in time. Returns the rows so a caller (e.g. a test)
 * can assert on them.
 */
export function traceConversation(
  where: string,
  ticketId: string,
  payload: ConversationPayload | null | undefined,
  options: { quiet?: boolean } = {}
): TraceRow[] {
  if (!payload) {
    if (helpDeskDebugEnabled() && !options.quiet) {
      console.info(`[hd-debug] ${where} · ticket ${ticketId} · no payload`);
    }
    return [];
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const rows = messages.map((message, index) => describeRow(message, index));
  const undated = rows.filter((row) => row.epoch === "missing" || row.epoch === "invalid");
  const timed = rows
    .map((row, index) => ({ index, ms: typeof row.epoch === "number" ? row.epoch : null }))
    .filter((entry) => entry.ms !== null) as { index: number; ms: number }[];
  const brokenAt = timed.findIndex((entry, position) => position > 0 && entry.ms < timed[position - 1].ms);

  if (helpDeskDebugEnabled() && !options.quiet) {
    console.groupCollapsed(
      `[hd-debug] ${where} · ticket ${ticketId} · ${messages.length} message(s)` +
        (undated.length ? ` · ${undated.length} without a usable time` : "")
    );
    console.info("what the ERP returned", {
      api: `/api/help-desk/conversations/${ticketId}`,
      page: typeof window === "undefined" ? "" : window.location.pathname,
      messages: messages.length,
      timelineEvents: Array.isArray(payload.timeline) ? payload.timeline.length : 0,
      viewerIsSupport: payload.isSupport ?? null,
      channels: messages.reduce<Record<string, number>>((count, message) => {
        const key = String(message.channel ?? "unknown");
        count[key] = (count[key] ?? 0) + 1;
        return count;
      }, {}),
    });
    console.table(rows);
    console.debug("raw payload as fetched (compare with message.activities[])", payload);
    console.info(
      "order check (top row = first drawn)",
      brokenAt < 0
        ? `ascends in time ✓ (${timed.length}/${rows.length} dated)`
        : `OUT OF ORDER at row ${timed[brokenAt].index + 1}`
    );
    if (undated.length) {
      console.warn(
        "rows with no usable timestamp (they draw after every dated row)",
        undated.map((row) => ({ id: row.id, channel: row.channel, rawStamp: row.rawStamp }))
      );
    }
    console.groupEnd();
  }

  if (undated.length) {
    reportOnce(
      `${ticketId}:undated`,
      `Help Desk rows without a usable timestamp (ticket ${ticketId})`,
      {
        ticket: ticketId,
        where,
        rows: undated.map((row) => ({
          id: row.id,
          channel: row.channel,
          rawStamp: row.rawStamp,
          keys: row.keys,
        })),
      }
    );
  }
  if (brokenAt >= 0) {
    reportOnce(
      `${ticketId}:order`,
      `Help Desk thread drew out of time order (ticket ${ticketId})`,
      {
        ticket: ticketId,
        where,
        at: timed[brokenAt].index + 1,
        rows: rows.map((row) => ({ id: row.id, rawStamp: row.rawStamp })),
      }
    );
  }

  return rows;
}
