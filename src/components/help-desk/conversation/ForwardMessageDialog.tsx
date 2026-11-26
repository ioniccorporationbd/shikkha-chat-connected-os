"use client";

import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiSend, FiX } from "react-icons/fi";

import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";
import { listTickets } from "@/lib/help-desk/service";
import type { Ticket } from "@/lib/help-desk/types";

/**
 * WhatsApp-style forward sheet: pick the ticket that should receive the
 * message. The forward itself is a normal reply on the target ticket, so the
 * ERP keeps it as a real `Communication` — nothing is copied by the frontend.
 */
export default function ForwardMessageDialog({
  copy,
  currentTicketId,
  onClose,
  onForward,
}: {
  copy: ConversationCopy;
  currentTicketId: string;
  onClose: () => void;
  /** Returns true when the forward landed, so the sheet can close itself. */
  onForward: (ticketId: string) => Promise<boolean>;
}) {
  const [rows, setRows] = useState<Ticket[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listTickets()
      .then((data) => {
        if (alive) setRows(data);
      })
      .catch(() => {
        if (alive) {
          setRows([]);
          setFailed(true);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyId) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busyId, onClose]);

  const options = useMemo(() => {
    const list = (rows ?? []).filter((ticket) => ticket.id !== currentTicketId);
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (ticket) =>
        ticket.id.toLowerCase().includes(needle) || (ticket.subject || "").toLowerCase().includes(needle),
    );
  }, [currentTicketId, query, rows]);

  const pick = async (ticket: Ticket) => {
    if (busyId) return;
    setBusyId(ticket.id);
    const ok = await onForward(ticket.id);
    setBusyId(null);
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[rgba(9,20,26,0.55)] p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busyId) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forward-message-title"
        className="flex max-h-[82dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-[var(--color-white)] shadow-[0_24px_60px_rgba(9,20,26,0.28)] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-4 py-3">
          <div className="min-w-0">
            <h2 id="forward-message-title" className="text-[14.5px] font-bold text-[var(--color-primary)]">
              {copy.forwardTitle}
            </h2>
            <p className="mt-0.5 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
              {copy.forwardHint}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busyId)}
            aria-label={copy.deleteCancel}
            className="rounded-lg p-1.5 text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
          >
            <FiX size={16} aria-hidden />
          </button>
        </div>

        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] px-3 py-2">
            <FiSearch size={14} className="text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.forwardHint}
              aria-label={copy.forwardHint}
              className="w-full bg-transparent text-[12.5px] text-[var(--color-primary)] outline-none placeholder:text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)]"
            />
          </div>
        </div>

        <div className="mt-2 flex-1 overflow-y-auto px-2 pb-3">
          {rows === null ? (
            <div className="space-y-2 p-2" aria-busy="true">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-11 animate-pulse rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))]" />
              ))}
            </div>
          ) : options.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
              {copy.forwardEmpty}
            </p>
          ) : (
            <ul>
              {options.map((ticket) => (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => void pick(ticket)}
                    disabled={Boolean(busyId)}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
                  >
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_9%,var(--color-white))] text-[11px] font-bold text-[var(--color-primary)]">
                      {(ticket.subject || ticket.id).slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold text-[var(--color-primary)]">
                        {ticket.subject || ticket.id}
                      </span>
                      <span className="block truncate text-[11px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                        {ticket.id}
                      </span>
                    </span>
                    <FiSend
                      size={14}
                      className={busyId === ticket.id ? "animate-pulse text-[var(--color-action)]" : "text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]"}
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {failed ? (
            <p className="px-3 pb-2 text-center text-[11.5px] text-[var(--color-action)]">{copy.forwardFailed}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
