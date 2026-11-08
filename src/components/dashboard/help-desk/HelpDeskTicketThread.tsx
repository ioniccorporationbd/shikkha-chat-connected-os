"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { FiAlertCircle } from "react-icons/fi";

import ConversationComposer, { type ComposerInput } from "@/components/help-desk/conversation/ConversationComposer";
import ConversationActionLink from "@/components/dashboard/help-desk/ConversationActionLink";
import ConversationHeader from "@/components/help-desk/conversation/ConversationHeader";
import ConversationThread, { type ThreadSystemEvent } from "@/components/help-desk/conversation/ConversationThread";
import PinnedMessageBanner from "@/components/help-desk/conversation/PinnedMessageBanner";
import DeleteMessageDialog from "@/components/help-desk/conversation/DeleteMessageDialog";
import ForwardMessageDialog from "@/components/help-desk/conversation/ForwardMessageDialog";
import ConversationTimeline from "@/components/help-desk/conversation/ConversationTimeline";
import ProblemInfoCard from "@/components/help-desk/conversation/ProblemInfoCard";
import HelpDeskBackButton from "@/components/dashboard/help-desk/HelpDeskBackButton";
import { useTicketRealtime } from "@/lib/help-desk/use-ticket-realtime";
import {
  addRequirement,
  alignConversation,
  getConversation,
  orderConversation,
  markConversationRead,
  sendMessage,
  setMessageReaction,
  setTicketStatus,
} from "@/lib/help-desk/conversations";
import { conversationCopyFor, conversationStatusLabel } from "@/lib/help-desk/conversation-copy";
import { erpStampOf, parseErpTimestamp } from "@/lib/help-desk/format";
import { helpDeskCopyFor } from "@/lib/help-desk/messages";
import { deleteMessage, forwardMessage, pinTicketMessage, reopenTicket } from "@/lib/help-desk/service";
import { LOGIN_PATH } from "@/lib/auth/session";
import { missingTicketHeader, resolveTicketHeader } from "@/lib/help-desk/ticket-view";
import { reportClientError } from "@/lib/log/report-error";
import { toast } from "@/lib/ui/toast";
import type {
  ConversationMessage,
  ConversationPayload,
  ConversationReaction,
  ConversationTimelineEvent,
  Ticket,
} from "@/lib/help-desk/types";

const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]";

/**
 * Sends this tab has already shown on screen: message id -> ISO moment.
 *
 * A reply can come back from the ERP without a usable stamp — the desk's own
 * rows have reached the payload with an empty `createdAt` — and the
 * সম্পূর্ণ কথোপকথন টাইমলাইন then listed the words with a bare "—" where today's
 * date and the sending time belong. The composer knows the true moment (it was
 * pressed here), so the first rendering remembers it by id and every later
 * payload refresh re-applies it instead of losing the clock again.
 */
const sentAtById = new Map<string, string>();

/** Give a just-arrived reply the moment it reached this tab when the ERP left the clock blank. */
function stampWhenBlank(ticket: string, message: ConversationMessage): ConversationMessage {
  // Message ids are only unique inside their ticket, so the key carries both.
  const key = `${ticket}:${message.id}`;
  if (message.createdAt && !Number.isNaN(parseErpTimestamp(message.createdAt).getTime())) {
    sentAtById.set(key, message.createdAt);
    return message;
  }
  const stamp = sentAtById.get(key) ?? new Date().toISOString();
  sentAtById.set(key, stamp);
  return { ...message, createdAt: stamp };
}
const CARD_SHADOW = "shadow-[0_18px_44px_-26px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";

/**
 * How often an open thread asks the ERP for new messages (ms) while realtime is
 * NOT connected. Small on purpose: a reply from the other side must land within
 * a few seconds even when the socket bridge is unavailable, and a delta read is
 * one tiny indexed query.
 */
const POLL_INTERVAL_MS = 4_000;

/**
 * Did the call fail because the portal session ended?
 *
 * The API routes answer a dead/expired `sid` with 401 + `not_authenticated`
 * (and clear the cookie), so this is the one failure the composer must report
 * as "sign in again" instead of a retryable send error.
 */
/**
 * Local prediction of what the reaction chips become, so a tap answers at once.
 * One reaction per person per message: my old emoji is dropped, the tapped one
 * is added (or removed when it was already mine). The ERP's own list replaces
 * this the moment the POST answers.
 */
function optimisticReactions(
  current: ConversationReaction[],
  emoji: string
): ConversationReaction[] {
  const hadMine = current.some((reaction) => reaction.emoji === emoji && reaction.mine);
  const next = current.map((reaction) => ({
    ...reaction,
    count: reaction.mine ? Math.max(0, reaction.count - 1) : reaction.count,
    mine: false,
  }));
  if (!hadMine) {
    const target = next.find((reaction) => reaction.emoji === emoji);
    if (target) {
      target.count += 1;
      target.mine = true;
    } else {
      next.push({ emoji, count: 1, mine: true });
    }
  }
  return next.filter((reaction) => reaction.count > 0);
}

/**
 * A write that outran the portal's upstream ceiling.
 *
 * The socket timeout ends *our* wait, not the ERP's work: a reply can land after
 * the portal has already told the UI it failed (0602). Callers must re-read the
 * thread before reporting a failure, or the customer retypes a message that is
 * already on the ticket.
 */
function isPossibleTimeout(error: unknown): boolean {
  const err = error as { code?: string; message?: string } | null;
  if (err?.code === "upstream_unreachable") return true;
  return typeof err?.message === "string" && /did not answer within/i.test(err.message);
}

/** Message bodies are HTML; compare what the reader actually sees. */
function plainBody(html: string | null | undefined): string {
  return String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Did the text the composer tried to send reach the thread after all? */
async function landedInThread(ticketId: string, text: string): Promise<boolean> {
  const needle = plainBody(text).slice(0, 60);
  if (!needle) return false;
  try {
    const data = await getConversation(ticketId, { limit: 5 });
    return (data?.messages ?? [])
      .slice(-5)
      .some((message) => plainBody(message.body).includes(needle));
  } catch {
    return false;
  }
}

/**
 * Re-shape a write response onto the side the page reads from. Reads already
 * carry `viewAs`; a send response has to be laid on the same side or the row
 * the sender just wrote would jump to the middle of the room.
 */
function shapedFor(
  viewAs: "support" | "customer" | undefined,
  data: ConversationPayload | null
): ConversationPayload | null {
  return data && viewAs ? alignConversation(data, viewAs) : data;
}

function isAuthFailure(error: unknown): boolean {
  const err = error as { code?: string; status?: number } | null;
  return err?.code === "not_authenticated" || err?.status === 401;
}

/**
 * Draft safety across a forced sign-in.
 *
 * When a send is refused because the session ended, the text the customer
 * typed must not be lost: it is kept in `sessionStorage` (tab-scoped, never
 * sent anywhere) and handed back to the composer when this ticket reloads
 * after login. It is cleared only once a message actually lands, so a retry
 * after signing in cannot silently post a message twice.
 */
/** Messages per conversation page (newest first page, then 20 at a time). */
const PAGE_SIZE = 20;

/**
 * How much of the thread the conversation route opens with.
 *
 * A chat opens on the newest rows, but "newest rows" only reads as history if
 * it is actually the history: the reader on 0860 scrolled up looking for the
 * text he had sent ten minutes earlier and found the room starting at his last
 * few lines, with nothing above them and no sign that more existed — the walk
 * over the topic group ended up costing him a second send of the same words.
 * The opening read is therefore the widest page the ERP route serves (the
 * proxy caps `limit` at 200); older-than-that tickets still arrive twenty rows
 * at a time as the reader keeps scrolling up.
 */
const OPENING_WINDOW = 200;
/** Slow safety-net poll while the realtime socket is up (belt and braces). */
const LIVE_SAFETY_POLL_MS = 60_000;

function draftKey(ticketId: string): string {
  return `help-desk:draft:${ticketId}`;
}

function readDraft(ticketId: string): string {
  try {
    return window.sessionStorage.getItem(draftKey(ticketId)) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(ticketId: string, text: string): void {
  try {
    if (text.trim()) window.sessionStorage.setItem(draftKey(ticketId), text);
    else window.sessionStorage.removeItem(draftKey(ticketId));
  } catch {
    // Storage disabled/blocked: the composer still holds the text for this page.
  }
}

function clearDraft(ticketId: string): void {
  try {
    window.sessionStorage.removeItem(draftKey(ticketId));
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

/**
 * One ticket conversation — customer and employee use the same screen.
 *
 * Block A is the problem as the ERP stores it (`ProblemInfoCard`), block B the
 * full timeline and block C the write box. When the signed-in user is support,
 * the extra status/solution panel appears; when the customer is on an Open
 * ticket, the composer can switch to "additional requirement".
 *
 * Everything on screen is the ERP payload: `canReply`, `canAddRequirement`,
 * `canChangeStatus`, the message list and the unread count are all decided on
 * the server, never inferred here.
 */
export default function HelpDeskTicketThread({
  language,
  ticketId,
  listHref,
  backFallback,
  titleOverride,
  allConversationsHref,
  chatOnly = false,
  perspective,
}: {
  language: string;
  ticketId: string;
  /** Where the back pill and the error state send the user. */
  listHref: string;
  backFallback: string;
  titleOverride?: string;
  /** @deprecated every view now uses the tall chat box; kept so old callers compile. */
  expanded?: boolean;
  /** Link to the full conversation route, shown in the chat card header. */
  allConversationsHref?: string;
  /** Chat-only view: the conversation fills the page, problem/timeline hidden. */
  chatOnly?: boolean;
  /**
   * Force the side every bubble is drawn from, whatever the ERP guessed about
   * the reader. The full-conversation pages pass `"customer"` on *both*
   * dashboard so one ticket reads the same everywhere: the customer's own
   * messages on the right, every employee reply (text and file) on the left —
   * an employee opening the same page sees the room exactly as the customer
   * does, which is what the desk's own preview shows too. The ticket *detail*
   * page instead reads from its own side: `"support"` on the staff dashboard
   * (an employee's own text and files land on the right), `"customer"` on the
   * client dashboard (every employee reply stays on the left).
   */
  perspective?: "support" | "customer";
}) {
  const copy = useMemo(() => conversationCopyFor(language), [language]);
  // Every read/write on this thread is shaped for this side, so a bubble can
  // never land on the wrong half of the room between a first load, a poll and
  // a send response.
  const viewAs = perspective;
  // Status names come from the Help Desk copy so the chip reads "Closed", not
  // the raw lifecycle key the type carries.
  const hdCopy = useMemo(() => helpDeskCopyFor(language), [language]);

  const [payload, setPayload] = useState<ConversationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [missing, setMissing] = useState(false);
  // Session ended mid-page: shown as its own state so the customer is told to
  // sign in again instead of reading a generic "load failed" card.
  const [expired, setExpired] = useState(false);
  const pathname = usePathname();

  const [quoted, setQuoted] = useState<ConversationMessage | null>(null);
  // Text recovered from a previous attempt that was cut short by a session end.
  // Read synchronously (not in an effect) — it is only ever shown or seeded into
  // the composer after the payload loads, so there is no hydration mismatch.
  const [draft, setDraft] = useState<string>(() =>
    typeof window === "undefined" ? "" : readDraft(ticketId)
  );
  // Ticket-level pin: the ERP stores which message is pinned on the HD Ticket,
  // so this state is only ever a mirror of the server value.
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [pinBusy, setPinBusy] = useState(false);
  // Deleting a message removes a real Communication: always behind a confirm.
  const [deleteTargets, setDeleteTargets] = useState<ConversationMessage[] | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [forwardSource, setForwardSource] = useState<ConversationMessage | null>(null);
  // Jump request handed down to the thread (pinned banner).
  const [focus, setFocus] = useState<{ id: string; nonce: number } | null>(null);
  const [mode, setMode] = useState<"message" | "requirement">("message");
  const [reopenBusy, setReopenBusy] = useState(false);

  // Last load failure, shown under the retry card so a support question can be
  // answered without opening devtools.
  const [errorText, setErrorText] = useState("");

  const [statusValue, setStatusValue] = useState("");
  const [resolution, setResolution] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);

  // Paging: the immersive conversation route opens on the newest page instead
  // of the whole history and fetches one older page as the reader scrolls up.
  // The details route keeps the full thread — its timeline needs every row.
  const [hasOlder, setHasOlder] = useState(false);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  // Hard lock on the older-page request: scroll events can arrive faster than a
  // state commit, and two in-flight reads with the same cursor would fetch (and
  // then double-count) the same page.
  const olderInFlight = useRef(false);
  // Newest payload, for the poll/ping handlers that must not close over a stale
  // render (a timer fires between renders).
  const payloadRef = useRef<ConversationPayload | null>(null);
  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  const mounted = useRef(true);

  // A response belongs to the ticket it was asked for. Walking from 0496 to 0510
  // leaves the first read in flight; without this it would land afterwards and
  // paint 0496's messages under 0510's header.
  const activeTicket = useRef(ticketId);
  useEffect(() => {
    activeTicket.current = ticketId;
  }, [ticketId]);


  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(false);
      }
      try {
        const data = await getConversation(
          ticketId,
          chatOnly ? { limit: OPENING_WINDOW, viewAs } : { viewAs }
        );
        if (!mounted.current || activeTicket.current !== ticketId) return;
        if (!data) {
          setMissing(true);
          setPayload(null);
          return;
        }
        setMissing(false);
        setPayload(data);
        setHasOlder(Boolean(data.has_more));
        setOlderCursor(data.next_cursor ?? null);
        setPinnedId(data.ticket.pinnedMessageId ?? null);
        setError(false);
        setErrorText("");
        setExpired(false);
        setStatusValue((current) => current || data.currentStatus || "");
        if (data.unread > 0) {
          // Reading the thread clears the ERP's own unread marker for this user.
          void markConversationRead(ticketId)
            .then(() => {
              if (mounted.current) setPayload((current) => (current ? { ...current, unread: 0 } : current));
            })
            .catch((err) => {
              console.error("[help-desk] mark read failed", ticketId, err);
            });
        }
      } catch (err) {
        if (!mounted.current || activeTicket.current !== ticketId) return;
        if (isAuthFailure(err)) {
          // A dead sid is not a load failure: every retry would fail the same
          // way. Show the sign-in state (the route already dropped the cookie).
          setExpired(true);
          setError(false);
          return;
        }
        if (!silent) {
          setError(true);
          setErrorText(err instanceof Error ? err.message : String(err));
          // Keep the surface diagnosable without a toast library dependency.
          console.error("[help-desk] conversation load failed", ticketId);
          reportClientError({
            scope: "help-desk:thread-load",
            message: "Could not load the ticket conversation.",
            detail: { ticket: ticketId, error: err instanceof Error ? err.message : String(err) },
          });
        }
      } finally {
        if (mounted.current && !silent) setLoading(false);
      }
    },
    [chatOnly, ticketId, viewAs]
  );

  useEffect(() => {
    mounted.current = true;
    // Queued so the first fetch does not setState synchronously inside the effect.
    const kickoff = window.setTimeout(() => void load(), 0);
    return () => {
      mounted.current = false;
      window.clearTimeout(kickoff);
    };
  }, [load]);

  // Both meta values blank on a ticket the desk shows filled is a data-mapping
  // bug, not an empty ticket — say so once, in the console and in the ERP Error
  // Log, with the shape of what actually arrived, instead of leaving two silent
  // "—" cells on screen.
  const metaWarned = useRef(false);
  useEffect(() => {
    metaWarned.current = false;
  }, [ticketId]);
  useEffect(() => {
    if (!payload || metaWarned.current) return;
    const header = payload.ticket;
    if (!header || !missingTicketHeader(header)) return;
    metaWarned.current = true;
    const raw = header as unknown as Record<string, unknown>;
    const detail = {
      ticket: ticketId,
      assignedAgent: header.assignedAgent ?? null,
      createdAt: header.createdAt ?? null,
      payloadKeys: Object.keys(raw).slice(0, 40),
      hasAgent: raw.agent ?? null,
      hasCustomer: raw.customer ?? null,
      hasContact: raw.contact ?? null,
    };
    console.warn("[help-desk] ticket header is missing its assignee/submitted fields", ticketId, detail);
    reportClientError({
      scope: "help-desk:ticket-meta",
      message: "The ticket header arrived without its Assigned employee / Submitted value.",
      detail,
    });
  }, [payload, ticketId]);

  /**
   * Fold a fresh payload into what is already on screen.
   *
   * The write endpoints answer with the whole thread; on the paged route that
   * must not throw away the history the reader scrolled back through. Only
   * entries we do not already hold are added, keyed by the ERP row id, so the
   * same message can never appear twice and the loaded window stays put.
   */
  const mergeThread = useCallback((incoming: ConversationPayload) => {
    setPayload((current) => {
      if (!current || !current.paged) return incoming;
      const seen = new Set(current.messages.map((message) => message.id));
      // Only rows that actually arrived now are stamped; history keeps whatever
      // the ERP recorded, never a clock this browser made up.
      const added = incoming.messages
        .filter((message) => !seen.has(message.id))
        .map((message) => stampWhenBlank(ticketId, message));
      // Re-establish the reading order instead of appending: a desk reply that
      // answers an older comment can arrive after rows already on screen.
      const merged = added.length ? orderConversation([...current.messages, ...added]) : current.messages;
      return {
        ...incoming,
        messages: merged,
        // The page boundaries belong to what is loaded, not to the newest rows
        // the server happened to send back.
        paged: true,
        has_more: current.has_more,
        next_cursor: current.next_cursor,
        has_newer: false,
        // An empty delta answer carries no key; keep the one already tracked so
        // the next poll still asks "newer than X" instead of re-reading history.
        latest_cursor: incoming.latest_cursor ?? current.latest_cursor,
      };
    });
  }, [ticketId]);

  /**
   * One older page, fetched by cursor straight from the ERP query.
   *
   * Scrolling up in a chat is reading backwards, so `cursor` walks towards the
   * ticket's first message: 20 -> 40 -> 60 …, one request in flight, and never
   * a re-read of history that is already loaded.
   */
  const loadOlder = useCallback(async () => {
    if (!chatOnly || !hasOlder || loadingOlder || olderInFlight.current || !olderCursor) return;
    olderInFlight.current = true;
    setLoadingOlder(true);
    try {
      const data = await getConversation(ticketId, { limit: PAGE_SIZE, cursor: olderCursor, viewAs });
      if (!mounted.current || !data) return;
      setPayload((current) => {
        if (!current) return data;
        const seen = new Set(current.messages.map((message) => message.id));
        const older = data.messages.filter((message) => !seen.has(message.id));
        // A threaded comment reply can be newer than the root comment its page
        // was cut on, so the page is merged by time, never by position.
        return { ...current, messages: orderConversation([...older, ...current.messages]) };
      });
      setHasOlder(Boolean(data.has_more));
      setOlderCursor(data.next_cursor ?? null);
    } catch (err) {
      // Keep the page that is already on screen; the next scroll retries.
      console.error("[help-desk] older page failed", ticketId, err);
    } finally {
      olderInFlight.current = false;
      if (mounted.current) setLoadingOlder(false);
    }
  }, [chatOnly, hasOlder, loadingOlder, olderCursor, ticketId, viewAs]);

  /**
   * Catch up after a live ping, a reconnect or a poll tick.
   *
   * The details route keeps its full read (its timeline is part of the page).
   * The conversation route asks only for what is newer than the newest loaded
   * entry, so a background refresh costs a handful of rows instead of the whole
   * thread — and nothing already read is fetched again.
   */
  const refreshDelta = useCallback(async () => {
    if (!mounted.current) return;
    const current = payloadRef.current;
    if (!current || !current.paged) {
      void load(true);
      return;
    }
    // Delta read: only rows newer than the newest one on screen, one page at a
    // time, repeating while the ERP says there is more. A ping therefore costs
    // a handful of rows instead of the whole thread — which is what keeps the
    // fast fallback poll cheap.
    let cursor = current.latest_cursor ?? null;
    try {
      for (let round = 0; round < 5; round += 1) {
        const data = await getConversation(
          ticketId,
          cursor ? { limit: PAGE_SIZE, since: cursor, viewAs } : { limit: PAGE_SIZE, viewAs }
        );
        if (!mounted.current || !data) return;
        if (round > 0 && !data.messages.length) break;
        mergeThread(data);
        if (data.unread > 0) {
          void markConversationRead(ticketId)
            .then(() => {
              if (mounted.current) setPayload((prev) => (prev ? { ...prev, unread: 0 } : prev));
            })
            .catch(() => undefined);
        }
        if (!data.has_newer) break;
        cursor = data.latest_cursor ?? null;
        if (!cursor) break;
      }
    } catch {
      // Silent: the interval or the next ping tries again.
    }
  }, [load, mergeThread, ticketId, viewAs]);

  // Frappe realtime, bridged server-side (see the stream route). `live` is false
  // when the socket is unavailable, and the existing poll then keeps running at
  // its usual cadence — no behaviour change, no new requirement that the ERP
  // has realtime switched on.
  const live = useTicketRealtime(ticketId, (kind) => {
    // A reaction (or a reply quote) rewrites a row that is already on screen,
    // so a tail-only delta fetch would never see it — re-read the page instead.
    if (kind === "reaction") void load(true);
    else void refreshDelta();
  });

  // Fallback refresh so a reply that arrives while the page is open shows up
  // even with realtime off. With a live socket this drops to a slow safety net
  // (the ping does the real work), which keeps request volume down.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible" || statusBusy) return;
      if (live) void refreshDelta();
      else void load(true);
    };
    const timer = window.setInterval(tick, live ? LIVE_SAFETY_POLL_MS : POLL_INTERVAL_MS);
    // Coming back to the tab (or the window) is the moment a reader expects the
    // thread to be current, so ask right away instead of waiting out the
    // interval — this is what makes an employee's reply appear the instant the
    // customer returns to the page.
    const onFocus = () => {
      if (document.visibilityState === "visible") tick();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [live, load, refreshDelta, statusBusy]);

  const messages = payload?.messages ?? [];
  const requirements = payload?.requirements ?? [];

  const submitMessage = useCallback(
    async (input: ComposerInput) => {
      if (mode === "requirement" && (payload?.canAddRequirement ?? false)) {
        try {
          const data = shapedFor(
            viewAs,
            await addRequirement(ticketId, {
              message: input.message,
              replyTo: input.replyTo,
              attachments: input.files,
            })
          );
          if (!data) return false;
          mergeThread(data);
          setQuoted(null);
          clearDraft(ticketId);
          setDraft("");
          toast.success(copy.composerRequirementSent, copy.conversationTitle);
          return true;
        } catch (err) {
          if (isAuthFailure(err)) {
            // Nothing was written: keep what was typed for after sign-in.
            writeDraft(ticketId, input.message);
            setDraft(input.message);
            setExpired(true);
            toast.error(copy.sessionExpired);
            console.error("[help-desk] requirement rejected: session ended", ticketId);
            return false;
          }
          const text = err instanceof Error ? err.message : "";
          if (isPossibleTimeout(err)) {
            // The reply may be on the ticket already — check before failing it.
            const landed = await landedInThread(ticketId, input.message);
            await load(true);
            if (landed) {
              clearDraft(ticketId);
              setDraft("");
              setQuoted(null);
              toast.success(copy.composerRequirementSent, copy.conversationTitle);
              return true;
            }
            toast.warning(text || copy.composerFailed);
            console.warn("[help-desk] requirement outran the portal ceiling and is not on the ticket", ticketId);
            return false;
          }
          toast.error(text || copy.composerFailed);
          console.error("[help-desk] requirement failed", ticketId, err);
          return false;
        }
      }

      try {
        const data = shapedFor(
          viewAs,
          await sendMessage(ticketId, {
            message: input.message,
            replyTo: input.replyTo,
            attachments: input.files,
          })
        );
        if (!data) return false;
        mergeThread(data);
        setQuoted(null);
        clearDraft(ticketId);
        setDraft("");
        toast.success(copy.composerSent);
        return true;
      } catch (err) {
        if (isAuthFailure(err)) {
          // Nothing was written by us and nothing will be: the ticket stays as
          // it is, the draft is kept for the sign-in round trip, and the
          // customer is told the truth — the session ended, sign in again.
          writeDraft(ticketId, input.message);
          setDraft(input.message);
          setExpired(true);
          toast.error(copy.sessionExpired);
          console.error("[help-desk] message rejected: session ended", ticketId);
          return false;
        }
        const text = err instanceof Error ? err.message : "";
        if (isPossibleTimeout(err)) {
          // A slow site answers late: if the reply is on the ticket, say so and
          // do not ask the customer to send it twice.
          const landed = await landedInThread(ticketId, input.message);
          await load(true);
          if (landed) {
            clearDraft(ticketId);
            setDraft("");
            setQuoted(null);
            toast.success(copy.composerSent);
            console.warn("[help-desk] reply landed after the portal stopped waiting", ticketId);
            return true;
          }
          toast.warning(text || copy.composerFailed);
          console.warn("[help-desk] reply outran the portal ceiling and is not on the ticket", ticketId);
          reportClientError({
            scope: "help-desk:send",
            message: "Sending a ticket message failed.",
            detail: { ticket: ticketId, error: text || String(err) },
          });
          return false;
        }
        toast.error(text || copy.composerFailed);
        console.error("[help-desk] message send failed", ticketId, err);
        reportClientError({
          scope: "help-desk:send",
          message: "Sending a ticket message failed.",
          detail: { ticket: ticketId, error: text || String(err) },
        });
        return false;
      }
    },
    [copy.composerFailed, copy.composerRequirementSent, copy.composerSent, copy.conversationTitle, copy.sessionExpired, load, mergeThread, mode, payload?.canAddRequirement, ticketId, viewAs]
  );

  const submitStatus = useCallback(async () => {
    if (statusBusy) return;
    setStatusBusy(true);
    try {
      // The backend writes the solution Communication before the status change,
      // inside one transaction, so a ticket can never close without its answer.
      const data = await setTicketStatus(ticketId, { status: statusValue, resolution });
      mergeThread(data);
      setResolution("");
      toast.success(copy.statusUpdated);
    } catch (err) {
      const text = err instanceof Error ? err.message : "";
      toast.error(text || copy.statusFailed);
      console.error("[help-desk] status update failed", ticketId, err);
      reportClientError({
        scope: "help-desk:status",
        message: "Updating the ticket status failed.",
        detail: { ticket: ticketId, status: statusValue, error: text || String(err) },
      });
    } finally {
      setStatusBusy(false);
    }
  }, [copy.statusFailed, copy.statusUpdated, mergeThread, resolution, statusBusy, statusValue, ticketId]);

  // Closed tickets reject replies in this ERP. The only permitted way back is an
  // explicit reopen — never a silent status change.
  const reopen = useCallback(async () => {
    if (reopenBusy) return;
    setReopenBusy(true);
    try {
      await reopenTicket(ticketId);
      toast.success(copy.conversationReopened);
      await load(true);
    } catch (err) {
      const text = err instanceof Error ? err.message : "";
      toast.error(text || copy.conversationReopenFailed);
      console.error("[help-desk] reopen failed", ticketId, err);
    } finally {
      setReopenBusy(false);
    }
  }, [copy.conversationReopenFailed, copy.conversationReopened, load, reopenBusy, ticketId]);

  // Pin or unpin one message. The ERP decides whether the caller may; we only
  // reflect whatever pinned id it returns.
  const togglePin = useCallback(
    async (message: ConversationMessage) => {
      if (pinBusy) return;
      const nextPinned = pinnedId === message.id ? false : true;
      setPinBusy(true);
      try {
        const result = await pinTicketMessage(ticketId, message.id, nextPinned);
        setPinnedId(result);
        if (result) {
          toast.success(copy.pinToast);
          setFocus({ id: result, nonce: Date.now() });
        } else {
          toast.success(copy.unpinToast);
        }
      } catch (err) {
        console.error("[help-desk] pin failed", ticketId, message.id, err);
        toast.error(copy.pinFailed);
      } finally {
        setPinBusy(false);
      }
    },
    [copy.pinFailed, copy.pinToast, copy.unpinToast, pinBusy, pinnedId, ticketId]
  );

  // Delete one or several messages after confirmation. Each message is its own
  // Communication, so a batch is a loop of single, permission-checked deletes.
  const confirmDelete = useCallback(async () => {
    if (!deleteTargets?.length || deleteBusy) return;
    setDeleteBusy(true);
    let failed = 0;
    for (const target of deleteTargets) {
      try {
        await deleteMessage(target.id);
      } catch (err) {
        failed += 1;
        console.error("[help-desk] delete failed", ticketId, target.id, err);
      }
    }
    setDeleteBusy(false);
    setDeleteTargets(null);
    if (failed > 0) toast.error(copy.deleteFailed);
    else toast.success(copy.deleteDone);
    await load(true);
  }, [copy.deleteDone, copy.deleteFailed, deleteBusy, deleteTargets, load, ticketId]);

  // Forward reuses the reply path: the target ticket gets a real message.
  const forwardTo = useCallback(
    async (targetTicketId: string) => {
      if (!forwardSource) return false;
      const body = `${copy.forwardPrefix}${forwardSource.body ?? ""}`.trim();
      if (!body) return false;
      try {
        await forwardMessage(targetTicketId, body);
        toast.success(copy.forwardDone);
        return true;
      } catch (err) {
        const text = err instanceof Error ? err.message : "";
        toast.error(text || copy.forwardFailed);
        console.error("[help-desk] forward failed", ticketId, targetTicketId, err);
        return false;
      }
    },
    [copy.forwardDone, copy.forwardFailed, copy.forwardPrefix, forwardSource, ticketId]
  );

  // Emoji reactions: optimistic chip update, then the server's own group list.
  // A failed write restores exactly what the page had before the tap.
  const reactToMessage = useCallback(
    async (message: ConversationMessage, emoji: string) => {
      const previous = message.reactions ?? [];
      const apply = (reactions: ConversationReaction[]) =>
        setPayload((current) =>
          current
            ? {
                ...current,
                messages: current.messages.map((item) =>
                  item.id === message.id ? { ...item, reactions } : item
                ),
              }
            : current
        );
      apply(optimisticReactions(previous, emoji));
      try {
        const reactions = await setMessageReaction(ticketId, message.id, emoji);
        if (!mounted.current) return;
        apply(reactions);
      } catch (err) {
        if (!mounted.current) return;
        apply(previous);
        toast.error(copy.reactionFailed);
        console.error("[help-desk] reaction failed", ticketId, message.id, err);
        if (isAuthFailure(err)) setExpired(true);
      }
    },
    [copy.reactionFailed, ticketId]
  );

  // Where "sign in again" goes: back to this exact ticket after login.
  // `expired=1` lets the login page say why the customer is back here; `next`
  // returns them to this exact ticket afterwards.
  const signInHref = `${LOGIN_PATH}?next=${encodeURIComponent(pathname || listHref)}&expired=1`;

  const isSupport = payload?.isSupport ?? false;
  const canReply = payload?.canReply ?? false;
  const canAddRequirement = payload?.canAddRequirement ?? false;

  if (loading && !payload) {
    return (
      <div className="flex flex-col gap-4">
        <HelpDeskBackButton label={copy.back} homeLabel={copy.helpDeskHome} fallbackHref={backFallback} />
        <div className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-5 ${CARD_SHADOW}`} aria-busy="true">
          <div className="h-5 w-40 animate-pulse rounded bg-[color-mix(in_srgb,var(--color-primary)_9%,var(--color-white))]" />
          <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))]" />
          <div className="mt-6 h-40 animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]" />
        </div>
      </div>
    );
  }

  if (expired && !payload) {
    // The portal session ended while this page was open. The route already
    // cleared the dead cookie, so the only useful action is signing in again —
    // and coming straight back to this same ticket.
    return (
      <div className="flex flex-col gap-4">
        <HelpDeskBackButton label={copy.back} homeLabel={copy.helpDeskHome} fallbackHref={backFallback} />
        <div className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-8 text-center ${CARD_SHADOW}`}>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
            <FiAlertCircle size={22} aria-hidden />
          </span>
          <p className="mt-3 text-[14px] font-semibold text-[var(--color-primary)]">{copy.sessionExpired}</p>
          {draft ? (
            <p className="mt-1.5 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">{copy.draftSaved}</p>
          ) : null}
          <a
            href={signInHref}
            className="mt-3 inline-flex items-center rounded-xl bg-[var(--color-action)] px-3.5 py-2 text-[12px] font-bold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)]"
          >
            {copy.signInAgain}
          </a>
        </div>
      </div>
    );
  }

  if (missing || (!payload && !error)) {
    return (
      <div className="flex flex-col gap-4">
        <HelpDeskBackButton label={copy.back} homeLabel={copy.helpDeskHome} fallbackHref={backFallback} />
        <div className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-8 text-center ${CARD_SHADOW}`}>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
            <FiAlertCircle size={22} aria-hidden />
          </span>
          <p className="mt-3 text-[14px] font-semibold text-[var(--color-primary)]">{copy.conversationErrorTitle}</p>
          <p className="mt-1 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            {copy.conversationErrorHint}
          </p>
          <a
            href={listHref}
            className="mt-3 inline-flex items-center rounded-xl bg-[var(--color-action)] px-3.5 py-2 text-[12px] font-bold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)]"
          >
            {copy.back}
          </a>
        </div>
      </div>
    );
  }

  if (error && !payload) {
    // A transport failure is retryable — the ticket is fine, the bytes were not.
    // The button repeats the same read (which itself retries once) and keeps the
    // reader on this ticket instead of sending them back to the list.
    return (
      <div className="flex flex-col gap-4">
        <HelpDeskBackButton label={copy.back} homeLabel={copy.helpDeskHome} fallbackHref={backFallback} />
        <div className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-8 text-center ${CARD_SHADOW}`}>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
            <FiAlertCircle size={22} aria-hidden />
          </span>
          <p className="mt-3 text-[14px] font-semibold text-[var(--color-primary)]">{copy.conversationErrorTitle}</p>
          <p className="mt-1 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            {copy.conversationErrorHint}
          </p>
          {errorText ? (
            <p className="mx-auto mt-1.5 max-w-md text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
              {errorText}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-action)] px-3.5 py-2 text-[12px] font-bold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? copy.conversationRetrying : copy.conversationRetry}
            </button>
            <a
              href={listHref}
              className="rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-3.5 py-2 text-[12px] font-bold text-[var(--color-primary)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))]"
            >
              {copy.back}
            </a>
          </div>
        </div>
      </div>
    );
  }

  const ticket = payload!.ticket;


  const pinnedMessage = pinnedId ? messages.find((message) => message.id === pinnedId) ?? null : null;

  // The chat and the audit trail below it must read as ONE sequence: every
  // timeline row that is not already a bubble in this thread is folded in here,
  // in its own place by timestamp. Status moves stay centred chips; a row that
  // carries text (the opening description, a requirement the ERP filed as an
  // event) becomes a bubble on its author's side — the customer's on the right
  // for the customer, the employee's on the left, and mirrored on the employee's
  // own dashboard. Rows that ARE messages (same Communication/Comment id) are
  // left out: the thread already draws them, in the same order.
  const timeline: ConversationTimelineEvent[] = payload!.timeline ?? [];

  // A filed row must never print "—" where its moment belongs. The desk's own
  // rows (সাপোর্ট টিম, filed as the employee's Comment/Communication) can reach
  // the trail without an `at` while the same row's creation is still known to
  // the message list; that stamp is borrowed here, so both the trail and the
  // folded bubble show the real filing time, and a row the trail cannot date at
  // all falls back to its position in the record instead of an invented clock.
  const messageStampById = new Map<string, string>();
  // The same words, filed under a different record name: a trail row and its
  // chat twin do not always share an id (the row is the Communication, the
  // bubble is the message the desk re-shaped), so the author + text is kept as
  // a second key. Without it a Support row whose id changed kept printing "—".
  const voiceKey = (author: unknown, text: unknown) =>
    `${String(author ?? "").trim().toLowerCase()}|${String(text ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()}`;
  const messageStampByVoice = new Map<string, string>();
  for (const message of messages) {
    const stamp = erpStampOf(message);
    if (!stamp) continue;
    messageStampById.set(message.id, stamp);
    const key = voiceKey(message.author, message.body);
    if (key !== "|") messageStampByVoice.set(key, stamp);
  }
  const isUsableStamp = (value: string) => Boolean(value) && !Number.isNaN(parseErpTimestamp(value).getTime());
  const trailAt = (event: ConversationTimelineEvent): string =>
    (() => {
      const own = erpStampOf(event);
      if (isUsableStamp(own)) return own;
      // The desk's own row (Comment/Communication) can arrive without a stamp at
      // all — under no name. The same record's chat twin still knows when it was
      // filed, so the trail borrows that time rather than printing a bare "—":
      // first the twin that shares the row's id, then the twin that says the
      // same words on the same side.
      const twin = messageStampById.get(event.id) ?? messageStampByVoice.get(voiceKey(event.author, event.text));
      if (isUsableStamp(twin ?? "")) return twin as string;
      return own;
    })();

  // --- "Assigned employee" / "Submitted" must never read blank -------------
  // See resolveTicketHeader: the desk's Assignee / Customer values are resolved
  // from whichever column actually holds them, so the portal shows the same
  // thing the desk does on tickets it created itself.
  const displayTicket: Ticket = resolveTicketHeader(ticket, timeline, messages);
  const messageIds = new Set(messages.map((message) => message.id));

  // The room must show both sides. The ERP files an employee's reply under
  // `messages` only for the channels the viewer may read, but the very same
  // words always reach `timeline` — that is what "সম্পূর্ণ কথোপকথন টাইমলাইন" below
  // prints, and on this ticket it listed the employee's replies while the chat
  // card above it showed the customer's side only. Every timeline reply the
  // message list is missing is therefore drawn as a bubble on its author's side,
  // in the trail's own position, so the card and the record agree row for row.
  // Paged (immersive) routes keep the fold off: their timeline carries the whole
  // history and would undo the page size.
  const trailReplies: ConversationMessage[] = chatOnly
    ? []
    : timeline
        .filter(
          (event) =>
            // Every filed row that carries words belongs in the room: a plain
            // reply, a requirement the desk filed, or the employee's solution.
            // Only the opening description ("created") and status moves stay out
            // — they are markers, not conversation.
            (event.type === "message" || event.type === "requirement" || event.type === "resolution") &&
            Boolean(String(event.text ?? "").trim()) &&
            !messageIds.has(event.id),
        )
        .map((event) => ({
          id: event.id,
          author: event.author,
          authorName: event.authorName,
          recipients: event.recipients,
          body: event.text,
          createdAt: trailAt(event),
          kind: "message" as const,
          channel: "message" as const,
          replyTo: null,
          attachments: (event.files ?? []).map((file) => ({
            url: file.url,
            fileName: file.fileName,
            fileType: file.fileType,
            size: 0,
          })),
          isMine: event.author === "user" ? !isSupport : isSupport,
          seen: true,
        }));
  const roomMessages: ConversationMessage[] = trailReplies.length
    ? [...messages, ...trailReplies]
    : messages;
  // The chat above and this timeline below must read as one sequence, so the
  // timeline's own position for a row travels down with it. `ConversationThread`
  // prefers that position over any timestamp, which is what makes the two lists
  // agree row for row even when two entries share a second.
  const sequenceById = new Map(timeline.map((event, index) => [event.id, index]));
  const orderedMessages = sequenceById.size
    ? roomMessages.map((message) => {
        const sequence = sequenceById.get(message.id);
        return sequence === undefined ? message : { ...message, sequence };
      })
    : roomMessages;
  const timelineLabels: Record<string, string> = {
    created: copy.timelineCreated,
    requirement: copy.timelineRequirement,
    resolution: copy.timelineResolution,
    message: isSupport ? copy.timelineReplyCustomer : copy.timelineMessage,
  };
  const statusWord = (value: string | undefined) => {
    const key = String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return (
      conversationStatusLabel[key as keyof typeof conversationStatusLabel]?.[language === "en" ? "en" : "bn"] ??
      (value || "—")
    );
  };

  // The detail route repeats every message in its audit-trail card, so the chat
  // card above it must not draw the same rows inline — otherwise every reply the
  // customer or the employee sends appears twice on one page. The immersive
  // route has no audit card, so it folds the markers into the thread instead.
  const systemEvents: ThreadSystemEvent[] = chatOnly
    ? timeline
        .filter((event) => !messageIds.has(event.id))
        // The immersive route pages its thread, so a full timeline would double up
        // with rows it has not loaded yet: it keeps only the creation marker.
        .filter((event) => event.type === "created" || event.type === "status")
        .map((event) => {
      const sequence = sequenceById.get(event.id);
      if (event.type === "status") {
        const move = event.from || event.to ? `${statusWord(event.from)} → ${statusWord(event.to)}` : "";
        return {
          id: event.id,
          at: erpStampOf(event),
          sequence,
          label: move ? `${copy.timelineStatus}: ${move}` : copy.timelineStatus,
        };
      }
      // Whose side: an incoming row ("user") is the customer's. The reader's own
      // side is therefore the customer's when they are not support.
      const mine = event.author === "user" ? !isSupport : isSupport;
      return {
        id: event.id,
        at: event.at,
        sequence,
        label: timelineLabels[event.type] ?? copy.timelineMessage,
        body: event.text,
        authorName: event.authorName,
        side: mine ? ("mine" as const) : ("other" as const),
      };
        })
        .filter((event) => Boolean(event.label) || Boolean(event.body))
    : [];

  // The audit trail is the ticket's own record, and the answer typed into the
  // box above is part of that record: staff write a reply, watch the bubble
  // land in the chat, look down at "সম্পূর্ণ কথোপকথন টাইমলাইন" and find the
  // trail unchanged, because it is fed from the payload the page loaded with
  // and a fresh send is not in it yet. The message rows are therefore taken
  // from `messages` - already merged, folded and in order, and updated the
  // moment a send succeeds - while every non-message row (creation, an added
  // requirement, the employee's solution, ERP status moves) still comes from
  // the ERP timeline. Ids are carried through, so no row is drawn twice.
  const auditTrail: ConversationTimelineEvent[] = chatOnly
    ? []
    : [
        ...timeline
          .filter((event) => event.type !== "message" && !messageIds.has(event.id))
          // The stamp is written onto `at` even when the payload named it
          // something else: the sort below reads `at`, and a row whose time
          // lived under `timestamp` sorted as if it were undated — the ticket's
          // own creation fell to the bottom of its trail.
          .map((event) => ({ ...event, at: trailAt(event) })),
        ...orderedMessages.map((message) => ({
          id: message.id,
          type: "message" as const,
          at: erpStampOf(message),
          author: message.author === "support" ? ("support" as const) : ("user" as const),
          authorName: message.authorName ?? "",
          text: message.body,
          recipients: message.recipients,
          attachments: message.attachments.length,
          files: message.attachments.map((file) => ({
            url: file.url ?? "",
            fileName: file.fileName,
            fileType: file.fileType,
          })),
        })),
      ].sort((a, b) => {
        const left = Date.parse(a.at);
        const right = Date.parse(b.at);
        if (Number.isFinite(left) && Number.isFinite(right)) return left - right;
        // One side undated: keep the record's own order rather than letting an
        // unparseable value shuffle the page.
        if (Number.isFinite(left)) return -1;
        if (Number.isFinite(right)) return 1;
        return (sequenceById.get(a.id) ?? 0) - (sequenceById.get(b.id) ?? 0);
      });

  return (
    <div className="flex flex-col gap-4">
      <HelpDeskBackButton label={copy.back} homeLabel={copy.helpDeskHome} fallbackHref={backFallback} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="truncate text-[19px] font-semibold leading-tight text-[var(--color-primary)] sm:text-[22px]">
            {titleOverride || ticket.subject}
          </h1>
          <p className="mt-0.5 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            {ticket.id}
          </p>
        </div>
        {live ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] px-2.5 py-1 text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]"
            data-thread-live
          >
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
            </span>
            {language === "bn" ? "লাইভ" : "Live"}
          </span>
        ) : null}
      </div>

      {chatOnly ? null : (
        <ProblemInfoCard
          ticket={displayTicket}
          copy={copy}
          language={language}
          requirements={requirements}
          showCustomer={isSupport}
        />
      )}

      {/* B2 — full audit trail: creation, every reply/requirement, the
          employee solution and each ERP status change, oldest first. */}
      {chatOnly ? null : (
        <ConversationTimeline
          events={auditTrail}
          language={language}
          isSupport={isSupport}
        />
      )}

      {!chatOnly && payload!.canChangeStatus ? (
        <section className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-4 sm:p-5 ${CARD_SHADOW}`}>
          <h2 className="text-[13.5px] font-bold text-[var(--color-primary)]">{copy.statusTitle}</h2>
          <p className="mt-0.5 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            {copy.statusHint}
          </p>

          <div className="mt-3 grid gap-3 lg:grid-cols-[15rem_1fr]">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                {copy.problemStatus}
              </span>
              <select
                value={statusValue}
                onChange={(event) => setStatusValue(event.target.value)}
                className="rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-2.5 py-2 text-[12.5px] font-semibold text-[var(--color-primary)] outline-none focus:border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
              >
                <option value="">{copy.statusSelect}</option>
                {(payload!.statuses ?? []).map((status) => (
                  <option key={status.name} value={status.name}>
                    {status.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                {copy.statusResolution}
              </span>
              <textarea
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                rows={2}
                placeholder={copy.statusResolutionPlaceholder}
                className="resize-y rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-2.5 py-2 text-[12.5px] text-[var(--color-primary)] outline-none placeholder:text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)] focus:border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => void submitStatus()}
            disabled={statusBusy || !statusValue}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--color-action)] px-3.5 py-2 text-[12.5px] font-bold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
          >
            {statusBusy ? copy.statusUpdating : copy.statusUpdate}
          </button>
        </section>
      ) : null}

      <section className={`overflow-hidden rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] ${CARD_SHADOW}`}>
        <ConversationHeader
          copy={copy}
          ticket={displayTicket}
          isSupport={isSupport}
          statusLabel={hdCopy.statuses[ticket.status] ?? ticket.status}
          unread={payload!.unread}
          actions={
            allConversationsHref ? (
              <ConversationActionLink href={allConversationsHref} label={copy.allConversations} />
            ) : undefined
          }
        />

        {pinnedMessage ? (
          <PinnedMessageBanner
            copy={copy}
            message={pinnedMessage}
            onJump={() => setFocus({ id: pinnedMessage.id, nonce: Date.now() })}
            onUnpin={canReply ? () => void togglePin(pinnedMessage) : undefined}
            unpinBusy={pinBusy}
          />
        ) : null}

        <div
          data-hd="thread"
          className="bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))]"
        >
          <ConversationThread
            bare
            copy={copy}
            language={language}
            messages={orderedMessages}
            loading={false}
            error={false}
            hasOlder={chatOnly ? hasOlder : false}
            loadingOlder={loadingOlder}
            onLoadOlder={chatOnly ? () => void loadOlder() : undefined}
            olderHint={language === "bn" ? "পুরোনো মেসেজ লোড হচ্ছে…" : "Loading older messages…"}
            onQuote={canReply ? (message) => setQuoted(message) : undefined}
            onPin={canReply ? (message) => void togglePin(message) : undefined}
            canPin={canReply}
            onDelete={canReply ? (targets) => setDeleteTargets(targets) : undefined}
            canDelete={canReply}
            onForward={canReply ? (message) => setForwardSource(message) : undefined}
            canForward={canReply}
            onCopied={() => toast.success(copy.copied)}
            onCopyFailed={() => toast.error(copy.copyFailed)}
            onReact={canReply ? (message, emoji) => void reactToMessage(message, emoji) : undefined}
            pinnedId={pinnedId}
            focus={focus}
            systemEvents={systemEvents}
            heightClass={
              chatOnly
                ? "max-h-[calc(100dvh-17rem)] min-h-[24rem] sm:max-h-[calc(100dvh-15rem)]"
                : "max-h-[min(62vh,46rem)] min-h-[18rem]"
            }
          />
        </div>

        <div className="border-t border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] px-3 pb-3 pt-2.5 sm:px-4">
          {canReply ? (
            <div className="mb-2 flex w-fit items-center gap-1 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] p-1">
              {(
                [
                  { key: "message" as const, label: copy.composerSend },
                  { key: "requirement" as const, label: copy.composerRequirementSend },
                ]
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  disabled={tab.key === "requirement" && !canAddRequirement}
                  title={
                    tab.key === "requirement" && !canAddRequirement
                      ? language === "bn"
                        ? "শুধু গ্রাহকই অতিরিক্ত রিকোয়ারমেন্ট যোগ করতে পারেন"
                        : "Only the customer may add an extra requirement"
                      : undefined
                  }
                  onClick={() => { if (tab.key !== "requirement" || canAddRequirement) setMode(tab.key); }}
                  className={[
                    "rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition",
                    tab.key === "requirement" && !canAddRequirement
                      ? "cursor-not-allowed text-[color-mix(in_srgb,var(--color-primary)_32%,transparent)]"
                      : mode === tab.key
                        ? "bg-[var(--color-white)] text-[var(--color-primary)] shadow-[0_6px_14px_-10px_color-mix(in_srgb,var(--color-primary)_60%,transparent)]"
                        : "text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)] hover:text-[var(--color-primary)]",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}

          {expired ? (
            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] px-3.5 py-3">
              <p className="text-[12.5px] font-semibold text-[var(--color-primary)]">{copy.sessionExpired}</p>
              {draft ? (
                <p className="mt-1 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">{copy.draftSaved}</p>
              ) : null}
              <a
                href={signInHref}
                className="mt-2 inline-flex items-center rounded-xl bg-[var(--color-action)] px-3 py-1.5 text-[11.5px] font-bold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)]"
              >
                {copy.signInAgain}
              </a>
            </div>
          ) : canReply ? (
            <ConversationComposer
              copy={copy}
              quoted={quoted}
              onClearQuote={() => setQuoted(null)}
              onSubmit={submitMessage}
              requirementMode={mode === "requirement" && canAddRequirement}
              initialText={draft}
            />
          ) : (
            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] px-3.5 py-3">
              <p className="text-[12.5px] font-semibold text-[var(--color-primary)]">{copy.conversationClosed}</p>
              <p className="mt-0.5 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                {copy.conversationClosedHint}
              </p>
              {!isSupport ? (
                <button
                  type="button"
                  onClick={() => void reopen()}
                  disabled={reopenBusy}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-action)] px-3 py-1.5 text-[11.5px] font-bold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
                >
                  {reopenBusy ? copy.conversationReopening : copy.conversationReopen}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {deleteTargets ? (
        <DeleteMessageDialog
          copy={copy}
          count={deleteTargets.length}
          busy={deleteBusy}
          onCancel={() => setDeleteTargets(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}

      {forwardSource ? (
        <ForwardMessageDialog
          copy={copy}
          currentTicketId={ticketId}
          onClose={() => setForwardSource(null)}
          onForward={forwardTo}
        />
      ) : null}
    </div>
  );
}
