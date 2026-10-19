"use client";

import { FiFileText, FiUser } from "react-icons/fi";

import {
  conversationCategoryLabel,
  conversationPriorityLabel,
  conversationStatusLabel,
  type ConversationCopy,
} from "@/lib/help-desk/conversation-copy";
import { PRIORITY_TONE, STATUS_TONE } from "@/lib/help-desk/config";
import { formatDateTime, formatFileSize } from "@/lib/help-desk/format";
import { attachmentUrl } from "@/lib/help-desk/service";
import type { ConversationMessage, Ticket } from "@/lib/help-desk/types";

/**
 * Block A of a ticket conversation: the problem exactly as the ERP stores it.
 *
 * This is the same `HD Ticket` the help desk and the ERP desk show — subject,
 * description, category, priority, status, submit time, the assigned employee
 * that is safe to display, the original attachments and every additional
 * requirement the customer added while the ticket stayed open.
 */
export default function ProblemInfoCard({
  ticket,
  copy,
  language,
  requirements,
  showCustomer,
}: {
  ticket: Ticket;
  copy: ConversationCopy;
  language: string;
  requirements: ConversationMessage[];
  showCustomer?: boolean;
}) {
  const statusLabel = conversationStatusLabel[ticket.status]?.[language === "en" ? "en" : "bn"] ?? ticket.status;
  const priorityLabel = conversationPriorityLabel[ticket.priority]?.[language === "en" ? "en" : "bn"] ?? ticket.priority;
  const categoryLabel = conversationCategoryLabel[ticket.category]?.[language === "en" ? "en" : "bn"] ?? ticket.category;

  const meta: { key: string; label: string; value: string }[] = [
    { key: "category", label: copy.problemCategory, value: categoryLabel },
    { key: "priority", label: copy.problemPriority, value: priorityLabel },
    { key: "submitted", label: copy.problemSubmitted, value: formatDateTime(ticket.createdAt, language) },
    { key: "assigned", label: copy.problemAssigned, value: ticket.assignedAgent || "—" },
  ];
  if (showCustomer) {
    meta.push({ key: "customer", label: copy.problemCustomer, value: ticket.contact?.name || "—" });
  }

  return (
    <section className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_9%,var(--color-white))] px-2.5 py-1 text-[11px] font-bold text-[var(--color-primary)]">
          {ticket.id}
        </span>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{
            backgroundColor: `color-mix(in srgb, ${STATUS_TONE[ticket.status]} 14%, white)`,
            color: STATUS_TONE[ticket.status],
          }}
        >
          {statusLabel}
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{
            backgroundColor: `color-mix(in srgb, ${PRIORITY_TONE[ticket.priority]} 14%, white)`,
            color: PRIORITY_TONE[ticket.priority],
          }}
        >
          {priorityLabel}
        </span>
      </div>

      <h2 className="mt-3 text-[17px] font-bold leading-snug text-[var(--color-primary)]">{ticket.subject}</h2>

      <p className="mt-1.5 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_78%,transparent)]">
        {ticket.description || "—"}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {meta.map((item) => (
          <div key={item.key} className="min-w-0">
            <dt className="text-[10.5px] font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
              {item.label}
            </dt>
            <dd className="mt-0.5 truncate text-[12.5px] font-semibold text-[var(--color-primary)]">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4">
        <h3 className="text-[12px] font-bold text-[var(--color-primary)]">
          {copy.problemAttachments}
        </h3>
        {ticket.attachments?.length ? (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {ticket.attachments.map((file) => {
              const href = attachmentUrl(file);
              return (
                <li key={file.id}>
                  <a
                    href={href ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] px-2.5 py-1.5 transition hover:border-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]"
                  >
                    <FiFileText size={13} className="text-[var(--color-primary)]" aria-hidden />
                    <span className="max-w-[13rem] truncate text-[11.5px] font-semibold text-[var(--color-primary)]">
                      {file.name}
                    </span>
                    <span className="text-[10.5px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                      {formatFileSize(file.size)}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-1 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
            {copy.problemNoAttachments}
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[12.5px] font-bold text-[var(--color-primary)]">{copy.requirementsTitle}</h3>
          <span className="rounded-full bg-[color-mix(in_srgb,var(--color-warning)_16%,var(--color-white))] px-2 py-0.5 text-[10.5px] font-bold text-[#8a5a10]">
            {requirements.length}
          </span>
        </div>
        {requirements.length === 0 ? (
          <p className="mt-1.5 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
            {copy.requirementsEmpty}
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {requirements.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-[color-mix(in_srgb,var(--color-warning)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-warning)_7%,var(--color-white))] px-3 py-2"
              >
                <div className="flex items-center gap-2 text-[10.5px] font-semibold text-[#8a5a10]">
                  <FiUser size={11} aria-hidden />
                  <span>{entry.isMine ? copy.conversationYou : entry.authorName || copy.conversationCustomer}</span>
                  <span className="text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
                    {formatDateTime(entry.createdAt, language)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-[12.5px] text-[var(--color-primary)]">
                  {entry.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
