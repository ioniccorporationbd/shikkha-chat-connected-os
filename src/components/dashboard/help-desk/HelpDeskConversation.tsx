"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiClock, FiHelpCircle, FiBookmark } from "react-icons/fi";

import ChatComposer from "@/components/help-desk/chat/ChatComposer";
import ChatThread from "@/components/help-desk/chat/ChatThread";
import TicketStatusBadge from "@/components/help-desk/TicketStatusBadge";
import { HD_CARD, HD_GHOST_BTN } from "@/lib/help-desk/config";
import { formatDate, formatTime } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";
import { addUserReply, getTicket, pinTicketMessage } from "@/lib/help-desk/service";
import type { Ticket } from "@/lib/help-desk/types";
import { toast } from "@/lib/ui/toast";

/**
 * The full WhatsApp-style conversation of one ticket — every message the
 * customer and the help desk exchanged, with pinning and the message composer.
 *
 * The details page shows only the latest five messages; this screen is the
 * "All conversations" view it links to. Data still comes from the ticket's
 * existing `Communication` records — nothing is duplicated or fabricated.
 */
export default function HelpDeskConversation({
  ticketId,
  copy,
  language,
  basePath,
}: {
  ticketId: string;
  copy: HelpDeskCopy;
  language: string;
  basePath: string;
}) {
  const links = helpDeskLinks(basePath);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const threadTopRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      const found = await getTicket(ticketId);
      if (!found) {
        if (!silent) setState("missing");
        return;
      }
      setTicket(found);
      setState("ready");
    } catch {
      if (!silent) setState("error");
    }
  }, [ticketId]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  // Live thread: pulls an employee reply that lands while the page is open.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const isResolved = Boolean(ticket && (ticket.status === "resolved" || ticket.status === "closed"));

  const sendMessage = async (text: string, attachments: Array<{ name: string; url: string }>) => {
    if (!ticket) return;
    const updated = await addUserReply(ticket.id, text || "📎", attachments);
    setTicket(updated);
    toast.info(copy.chatSent);
    queueMicrotask(() => threadTopRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
  };

  const togglePin = async (messageId: string, nextPinned: boolean) => {
    if (!ticket) return;
    try {
      const pinnedMessageId = await pinTicketMessage(ticket.id, messageId, nextPinned);
      setTicket({ ...ticket, pinnedMessageId });
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : copy.chatPinFailed);
    }
  };

  if (state === "loading") {
    return (
      <div className={`${HD_CARD} animate-pulse p-6`}>
        <div className="h-4 w-32 rounded bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]" />
        <div className="mt-4 space-y-3">
          <div className="h-16 rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))]" />
          <div className="h-16 rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))]" />
          <div className="h-16 rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))]" />
        </div>
      </div>
    );
  }

  if (state === "missing" || !ticket) {
    return (
      <div className={`${HD_CARD} p-8 text-center`}>
        <p className="text-sm font-semibold text-[var(--color-primary)]">{state === "error" ? copy.toastLoadFailed : copy.notFoundTitle}</p>
        <Link href={links.tickets} className={`${HD_GHOST_BTN} mt-4 inline-flex min-h-10 items-center gap-1.5`}>
          <FiArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {copy.backToList}
        </Link>
      </div>
    );
  }

  const pinnedMessage = ticket.pinnedMessageId
    ? ticket.messages.find((message) => message.id === ticket.pinnedMessageId)
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={links.ticket(ticket.id)} className={`${HD_GHOST_BTN} inline-flex min-h-10 items-center gap-1.5`}>
          <FiArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {copy.backToList}
        </Link>
        <Link href={links.root} className={`${HD_GHOST_BTN} inline-flex min-h-10 items-center gap-1.5`}>
          <FiHelpCircle className="h-3.5 w-3.5" aria-hidden />
          {copy.helpDeskHome}
        </Link>
      </div>

      <section className={`${HD_CARD} flex flex-col p-4 sm:p-5`}>
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] pb-3">
          <div className="min-w-0">
            <h1 className="truncate text-[16px] font-bold text-[var(--color-primary)] sm:text-[17px]">{ticket.subject}</h1>
            <p className="mt-0.5 inline-flex flex-wrap items-center gap-x-2 text-[11.5px] font-medium text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]">
              <span className="tabular-nums">{ticket.id}</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <FiClock className="h-3 w-3" aria-hidden />
                {formatDate(ticket.createdAt, language)} · {formatTime(ticket.createdAt, language)}
              </span>
              <span aria-hidden>·</span>
              <span className="tabular-nums">{ticket.messages.length} {copy.threadReplies}</span>
            </p>
          </div>
          <TicketStatusBadge status={ticket.status} copy={copy} />
        </header>

        {pinnedMessage ? (
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-[var(--color-action)] bg-[color-mix(in_srgb,var(--color-action)_6%,var(--color-white))] px-3 py-2.5">
            <FiBookmark className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--color-action)]" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--color-action)]">
                {copy.chatPinnedTitle}
              </p>
              <p className="mt-0.5 line-clamp-2 break-words text-[13px] font-medium text-[var(--color-primary)]">
                {pinnedMessage.body || copy.chatVoiceNote}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void togglePin(pinnedMessage.id, false)}
              className="flex-none rounded-full px-2 py-1 text-[11px] font-bold text-[var(--color-action)] transition hover:bg-[color-mix(in_srgb,var(--color-action)_10%,var(--color-white))]"
            >
              {copy.chatUnpinAction}
            </button>
          </div>
        ) : null}

        <div className="mt-3" ref={threadTopRef}>
          <ChatThread
            messages={ticket.messages}
            copy={copy}
            language={language}
            pinnedMessageId={ticket.pinnedMessageId}
            onPin={isResolved ? undefined : (messageId, next) => void togglePin(messageId, next)}
          />
        </div>

        <ChatComposer
          copy={copy}
          onSend={sendMessage}
          disabled={isResolved}
          notice={isResolved ? copy.chatClosedNotice : undefined}
        />
      </section>
    </div>
  );
}
