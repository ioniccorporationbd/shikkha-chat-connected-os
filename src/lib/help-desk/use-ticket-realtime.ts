"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Live ticket updates, with the polling fallback kept intact.
 *
 * The browser opens one SSE stream per open ticket. The route holds Frappe's
 * socket server-side (so the session cookie never reaches JavaScript) and
 * forwards only "this ticket changed" pings — never message content — so the
 * subscriber always re-reads through the permission-checked API.
 *
 * `live` is false until the socket really is up, which is exactly what the
 * caller should use to choose between "refresh on ping" and "poll every N
 * seconds": no Frappe realtime, no behaviour change.
 */
export function useTicketRealtime(ticketId: string, onPing: (kind: string) => void) {
  const [live, setLive] = useState(false);
  const pingRef = useRef(onPing);
  // Keep the latest callback without re-opening the stream on every render.
  useEffect(() => {
    pingRef.current = onPing;
  }, [onPing]);

  useEffect(() => {
    if (typeof window === "undefined" || !ticketId) return;
    let source: EventSource | null = null;

    try {
      source = new EventSource(`/api/help-desk/conversations/${encodeURIComponent(ticketId)}/stream`);
    } catch {
      // EventSource unsupported (very old browser): the caller's polling wins.
      return;
    }

    const handleReady = () => setLive(true);
    const handleDown = () => setLive(false);
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      try {
        const parsed = JSON.parse(event.data) as { kind?: string };
        pingRef.current(parsed.kind ?? "message");
      } catch {
        pingRef.current("message");
      }
    };
    const handleUnavailable = () => setLive(false);

    source.addEventListener("ready", handleReady);
    source.addEventListener("reconnecting", handleDown);
    source.addEventListener("unavailable", handleUnavailable);
    source.addEventListener("message", handleMessage as EventListener);

    return () => {
      source?.removeEventListener("ready", handleReady);
      source?.removeEventListener("reconnecting", handleDown);
      source?.removeEventListener("unavailable", handleUnavailable);
      source?.removeEventListener("message", handleMessage as EventListener);
      source?.close();
    };
  }, [ticketId]);

  return live;
}
