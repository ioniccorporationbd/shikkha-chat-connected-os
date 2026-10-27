import { io, type Socket } from "socket.io-client";
import { frappeBaseUrl } from "@/lib/api/frappe";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live bridge: browser  --SSE-->  this route  --socket.io-->  Frappe realtime.
 *
 * The browser cannot hold Frappe's socket itself without exposing the session
 * cookie to JavaScript, so this route keeps it HttpOnly and opens the socket on
 * the server instead, authenticated by the same `sid` cookie every other proxy
 * route already forwards:
 *
 *  * Frappe's own realtime infrastructure is reused as-is — no new service, no
 *    new auth, no extra port. The socket authenticates with the cookie, so the
 *    ERP joins it to that user's private room (`user:<email>`).
 *  * Only events whose `ticket` matches this route's ticket are forwarded, so a
 *    customer tab can never receive another ticket's activity, and no message
 *    content is carried at all — the client re-reads through the permission
 *    checked API.
 *  * If the socket cannot connect (blocked port, proxy, server without realtime
 *    enabled), the stream simply reports `unavailable`; the client keeps its
 *    existing polling fallback and the page behaves exactly as before.
 */

const REALTIME_EVENT = "help_desk_message";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid || !id) {
    return new Response("no session", { status: 401 });
  }

  const base = frappeBaseUrl();
  if (!base) {
    return new Response("no erp", { status: 503 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let socket: Socket | null = null;

      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };
      const send = (event: string, data: unknown) => {
        write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      const teardown = () => {
        if (closed) return;
        closed = true;
        clearInterval(ping);
        try {
          socket?.close();
        } catch {
          // already gone
        }
        try {
          controller.close();
        } catch {
          // already closed by the peer
        }
      };

      // Comment frames keep intermediate proxies from idling the stream out.
      const ping = setInterval(() => write(": ping\n\n"), 20_000);
      request.signal.addEventListener("abort", teardown);

      try {
        socket = io(base, {
          transports: ["websocket", "polling"],
          withCredentials: true,
          extraHeaders: { cookie: `sid=${sid}` },
          auth: {},
          reconnection: true,
          reconnectionDelay: 1_000,
          reconnectionDelayMax: 10_000,
          timeout: 10_000,
        });
      } catch {
        send("unavailable", { reason: "socket_init_failed" });
        teardown();
        return;
      }

      let announcedReady = false;
      socket.on("connect", () => {
        announcedReady = true;
        send("ready", { transport: socket?.io.engine.transport.name ?? "unknown" });
      });
      // A dropped socket asks the browser to catch up on anything missed while
      // it was away (the client re-reads with `since=`), then resumes live.
      socket.on("disconnect", () => {
        if (announcedReady) send("reconnecting", {});
      });
      socket.on("connect_error", () => {
        if (announcedReady) send("reconnecting", {});
      });
      socket.on(REALTIME_EVENT, (payload: unknown) => {
        const event = payload as { ticket?: string; kind?: string; messageId?: string | null } | null;
        if (!event || String(event.ticket ?? "") !== id) return;
        send("message", { kind: event.kind ?? "message", messageId: event.messageId ?? null });
      });

      // Give the handshake a bounded window: if the ERP realtime is not
      // reachable from this host, say so once and let the client poll.
      setTimeout(() => {
        if (!announcedReady && !closed) send("unavailable", { reason: "connect_timeout" });
      }, 12_000);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // Nginx and friends must not buffer a live stream.
      "x-accel-buffering": "no",
    },
  });
}
