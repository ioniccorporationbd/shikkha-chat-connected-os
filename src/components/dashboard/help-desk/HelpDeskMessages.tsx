"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowRight, FiInbox, FiMessageSquare, FiRefreshCw, FiSearch } from "react-icons/fi";

import ListPagination from "@/components/dashboard/ListPagination";
import { genericPaginationCopy } from "@/lib/dashboard/list-controls";
import { useReloadHandler } from "@/lib/dashboard/reload-registry";
import {
  conversationCopyFor,
  conversationPriorityLabel,
  conversationStatusLabel,
} from "@/lib/help-desk/conversation-copy";
import { listConversations } from "@/lib/help-desk/conversations";
import { PRIORITY_TONE, STATUS_TONE } from "@/lib/help-desk/config";
import { formatDateTime } from "@/lib/help-desk/format";
import type { ConversationSummary } from "@/lib/help-desk/types";

const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]";
const CARD_SHADOW = "shadow-[0_18px_44px_-26px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";
const ROWS_OPTIONS = [10, 20, 50] as const;

/** How long the search box waits after the last keystroke before it queries. */
const SEARCH_DEBOUNCE_MS = 320;

/**
 * Messages — the per-ticket conversation index.
 *
 * One row per ticket that actually holds messages. Every value (last message,
 * sender, time, unread badge) comes from the ERP on each load; the page never
 * invents a thread, a preview or an unread count. The table is the same design
 * system as the Open/Solved ticket boards, so the two lists read as one product.
 */
export default function HelpDeskMessages({
  language,
  basePath,
  variant = "messages",
}: {
  language: string;
  basePath: string;
  /**
   * `messages` is the customer/employee conversation index (tickets that hold
   * at least one message). `problems` is support's incoming queue: every ticket
   * the ERP shows them, including ones nobody has replied to yet.
   */
  variant?: "messages" | "problems";
}) {
  const isProblems = variant === "problems";
  const copy = useMemo(() => conversationCopyFor(language), [language]);
  const paginationCopy = useMemo(() => genericPaginationCopy(language), [language]);
  const messagesBase = `${basePath}/help-desk/${isProblems ? "problems" : "messages"}`;

  const [rows, setRows] = useState<ConversationSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(ROWS_OPTIONS[0]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    try {
      const data = await listConversations({
        search,
        page,
        pageSize: rowsPerPage,
        includeEmpty: isProblems,
      });
      setRows(data.conversations);
      setTotal(data.total);
      setUnread(data.unread);
      setError(false);
    } catch {
      setRows([]);
      setTotal(0);
      setError(true);
    }
  }, [isProblems, page, rowsPerPage, search]);

  useReloadHandler(load);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  const retry = () => {
    setError(false);
    setRows(null);
    void load();
  };

  const list = rows ?? [];
  const pageCount = Math.max(1, Math.ceil(total / rowsPerPage));
  const rangeStart = total === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const rangeEnd = Math.min(total, (page - 1) * rowsPerPage + list.length);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <section className={`overflow-hidden rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] ${CARD_SHADOW}`}>
        <div className="flex flex-col gap-4 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))_0%,var(--color-white)_72%)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)]">
                <FiMessageSquare size={21} aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-[20px] font-semibold leading-tight sm:text-[23px]">
                  {isProblems ? copy.problemsTitle : copy.messagesTitle}
                </h1>
                <p className="mt-0.5 max-w-2xl text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                  {isProblems ? copy.problemsSubtitle : copy.messagesSubtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] px-3 py-1.5 text-[11.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
                {copy.messagesUnreadTotal(unread)}
              </span>
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-primary)] transition hover:border-[color-mix(in_srgb,var(--color-primary)_48%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
              >
                <FiRefreshCw size={13} aria-hidden />
                {copy.messagesRetry}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-3 py-2 sm:max-w-md">
            <FiSearch size={14} className="flex-none text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]" aria-hidden />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={copy.messagesSearch}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--color-primary)] outline-none placeholder:text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)]"
            />
          </label>
        </div>
      </section>

      {rows === null ? (
        <div className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-4 ${CARD_SHADOW}`} aria-busy="true">
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className="h-12 animate-pulse rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))]"
              />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-8 text-center ${CARD_SHADOW}`}>
          <p className="text-[14px] font-semibold text-[var(--color-primary)]">{copy.messagesErrorTitle}</p>
          <p className="mt-1 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            {copy.messagesErrorHint}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-primary)] transition hover:border-[color-mix(in_srgb,var(--color-primary)_48%,transparent)]"
          >
            <FiRefreshCw size={13} aria-hidden />
            {copy.messagesRetry}
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-8 text-center ${CARD_SHADOW}`}>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
            <FiInbox size={22} aria-hidden />
          </span>
          <p className="mt-3 text-[14px] font-semibold text-[var(--color-primary)]">
            {isProblems ? copy.problemsEmptyTitle : copy.messagesEmptyTitle}
          </p>
          <p className="mt-1 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            {isProblems ? copy.problemsEmptyHint : copy.messagesEmptyHint}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <section className={`hidden overflow-hidden rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] ${CARD_SHADOW} lg:block`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[62rem] border-collapse text-left">
                <thead>
                  <tr className="bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))]">
                    {[
                      copy.colSl,
                      copy.colTicket,
                      copy.colSubject,
                      copy.colLastMessage,
                      isProblems ? copy.colCustomer : copy.colSender,
                      copy.colUpdated,
                      copy.colUnread,
                      copy.colAction,
                    ].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((row, index) => (
                    <tr
                      key={row.ticketId}
                      className="border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))]"
                    >
                      <td className="px-3 py-2.5 text-[12px] tabular-nums text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                        {(page - 1) * rowsPerPage + index + 1}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] px-2 py-0.5 text-[11px] font-bold text-[var(--color-primary)]">
                          {row.ticketId}
                        </span>
                      </td>
                      <td className="max-w-[16rem] px-3 py-2.5">
                        <Link href={`${messagesBase}/${row.ticketId}`} className="block truncate text-[13px] font-semibold text-[var(--color-primary)] hover:underline">
                          {row.subject}
                        </Link>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${STATUS_TONE[row.status]} 13%, white)`,
                              color: STATUS_TONE[row.status],
                            }}
                          >
                            {conversationStatusLabel[row.status]?.[language === "en" ? "en" : "bn"] ?? row.status}
                          </span>
                          {isProblems ? (
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${PRIORITY_TONE[row.priority]} 13%, white)`,
                                color: PRIORITY_TONE[row.priority],
                              }}
                            >
                              {conversationPriorityLabel[row.priority]?.[language === "en" ? "en" : "bn"] ?? row.priority}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="max-w-[20rem] px-3 py-2.5">
                        <span className="line-clamp-2 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
                          {row.lastMessage}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[12.5px] font-semibold text-[var(--color-primary)]">
                        {row.lastSender}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)]">
                        {formatDateTime(row.lastMessageAt, language)}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.unread > 0 ? (
                          <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[10.5px] font-bold text-[var(--color-white)]">
                            {row.unread}
                          </span>
                        ) : (
                          <span className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]">
                            {copy.noUnread}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`${messagesBase}/${row.ticketId}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-action)] px-2.5 py-1.5 text-[11.5px] font-bold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
                        >
                          {copy.actionOpen}
                          <FiArrowRight size={12} className="text-[var(--color-white)]" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-2.5 lg:hidden">
            {list.map((row) => (
              <li key={row.ticketId}>
                <Link
                  href={`${messagesBase}/${row.ticketId}`}
                  className={`block rounded-2xl border ${CARD_BORDER} bg-[var(--color-white)] p-3.5 ${CARD_SHADOW} transition hover:border-[color-mix(in_srgb,var(--color-primary)_48%,transparent)]`}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] px-2 py-0.5 text-[10.5px] font-bold text-[var(--color-primary)]">
                      {row.ticketId}
                    </span>
                    {row.unread > 0 ? (
                      <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-white)]">
                        {row.unread}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 truncate text-[13.5px] font-semibold text-[var(--color-primary)]">{row.subject}</p>
                  <p className="mt-1 line-clamp-2 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_68%,transparent)]">
                    {row.lastMessage}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                    <span className="truncate">{row.lastSender}</span>
                    <span className="shrink-0">{formatDateTime(row.lastMessageAt, language)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <ListPagination
            copy={paginationCopy}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            total={total}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={ROWS_OPTIONS}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows);
              setPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}
