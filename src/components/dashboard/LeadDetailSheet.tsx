"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiCheckSquare,
  FiChevronDown,
  FiDatabase,
  FiFileText,
  FiInbox,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiPaperclip,
  FiPlus,
  FiSend,
  FiUserPlus,
  FiX,
} from "react-icons/fi";

import ShikkhaLoader from "./ShikkhaLoader";
import { ApiError } from "@/lib/api/http";
import { addLeadComment, fetchLeadDetail } from "@/lib/leads/api";
import {
  formatCount,
  leadInitials,
  leadRelativeTime,
  leadsCopyFor,
  leadStatusLabel,
  leadStatusTone,
  type LeadsCopy,
  type LeadsDetailCopy,
} from "@/lib/leads/messages";
import type { LeadActivity, LeadAttachment, LeadDetailPayload } from "@/lib/leads/types";
import { useOverlayPresence } from "@/lib/dashboard/useOverlayPresence";
import { reportClientError } from "@/lib/log/report-error";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const TAB_KEYS = [
  "activity",
  "emails",
  "comments",
  "data",
  "calls",
  "tasks",
  "notes",
  "attachments",
] as const;

type TabKey = (typeof TAB_KEYS)[number];

const TAB_ICONS: Record<TabKey, typeof FiActivity> = {
  activity: FiActivity,
  emails: FiMail,
  comments: FiMessageSquare,
  data: FiDatabase,
  calls: FiPhone,
  tasks: FiCheckSquare,
  notes: FiFileText,
  attachments: FiPaperclip,
};

const ACTIVITY_ICONS: Record<string, typeof FiActivity> = {
  created: FiUserPlus,
  owner: FiUserPlus,
  status: FiActivity,
  comment: FiMessageSquare,
  note: FiFileText,
  email: FiMail,
  call: FiPhone,
  task: FiCheckSquare,
  attachment: FiPaperclip,
  version: FiActivity,
};

const MUTED = "text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]";

function RelativeTime({ at, copy }: { at: string; copy: LeadsCopy }) {
  const { language } = useLanguage();
  const label = leadRelativeTime(copy, at, language);
  if (!label) return null;

  return (
    <span className={`shrink-0 whitespace-nowrap text-[11.5px] ${MUTED}`} data-lead-time={at}>
      {label}
    </span>
  );
}

function EmptyTab({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center" data-lead-tab-empty="true">
      <FiInbox size={24} className="text-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]" />
      <p className={`text-[12.5px] ${MUTED}`}>{text}</p>
    </div>
  );
}

/** One activity row of the desk timeline: icon rail, actor + action, body, relative time. */
function ActivityItem({ activity, copy }: { activity: LeadActivity; copy: LeadsCopy }) {
  const Icon = ACTIVITY_ICONS[activity.kind] ?? FiActivity;
  const isBody = Boolean(activity.body) && (activity.kind === "comment" || activity.kind === "note");

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0" data-lead-activity={activity.key}>
      {/* connector */}
      <span
        aria-hidden
        className="absolute left-[13px] top-8 bottom-0 w-px bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] last:hidden"
      />
      <span className="relative z-[1] grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)]">
        <Icon size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="min-w-0 text-[12.5px] leading-relaxed text-[var(--color-primary)]">
            <span className="font-semibold">{activity.actor}</span>{" "}
            <span className={MUTED}>{activity.text}</span>
          </p>
          <RelativeTime at={activity.at} copy={copy} />
        </div>
        {isBody ? (
          <div
            className="mt-2 whitespace-pre-line rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_78%,transparent)]"
            data-lead-activity-body=""
          >
            {activity.body}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function SimpleActivityList({
  items,
  copy,
  empty,
}: {
  items: LeadActivity[];
  copy: LeadsCopy;
  empty: string;
}) {
  if (items.length === 0) return <EmptyTab text={empty} />;

  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <ActivityItem key={item.key} activity={item} copy={copy} />
      ))}
    </ul>
  );
}

function AttachmentList({
  items,
  empty,
  copy,
}: {
  items: LeadAttachment[];
  empty: string;
  copy: LeadsCopy;
}) {
  if (items.length === 0) return <EmptyTab text={empty} />;

  return (
    <ul className="flex flex-col gap-2" data-lead-attachments="">
      {items.map((file) => (
        <li key={file.key}>
          <a
            href={file.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-3.5 py-2.5 transition hover:bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))]"
          >
            <FiPaperclip size={14} className="shrink-0 text-[var(--color-action)]" />
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[var(--color-primary)]">
              {file.file_name}
            </span>
            <RelativeTime at={file.at} copy={copy} />
          </a>
        </li>
      ))}
    </ul>
  );
}

function DataGrid({ payload }: { payload: LeadDetailPayload }) {
  const fields = payload.lead?.fields ?? [];
  if (fields.length === 0) return null;

  return (
    <dl
      className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2"
      data-lead-data=""
    >
      {fields.map((field) => (
        <div key={field.label} className="flex flex-col gap-0.5 border-b border-[color-mix(in_srgb,var(--color-primary)_7%,transparent)] pb-2">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]">
            {field.label}
          </dt>
          <dd className="break-words text-[13px] text-[var(--color-primary)]">
            {field.value || "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

interface LeadDetailSheetProps {
  open: boolean;
  name: string | null;
  onClose: () => void;
}

/**
 * Desk-style lead panel behind the list's **View details** action.
 *
 * Mirrors the CRM lead page the sales team already knows: the same tab strip
 * (Activity / Emails / Comments / Data / Calls / Tasks / Notes / Attachments),
 * the timeline with its actor + relative time, comment/note bodies, and the
 * Reply / Comment composer. Data comes from `leads.lead_detail`, so the ERP
 * permission on the doc decides whether it opens at all.
 */
export default function LeadDetailSheet({ open, name, onClose }: LeadDetailSheetProps) {
  const { mounted, exiting } = useOverlayPresence(open, 220);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !name) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center sm:p-4"
      data-no-translate="true"
    >
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-[rgba(9,26,23,0.45)] ${
          exiting ? "animate-[u-shk-fade-out_180ms_ease-in_forwards]" : "animate-[u-shk-fade-in_180ms_ease-out]"
        }`}
      />
      {/* Keyed by lead name so tab / composer / draft state resets per lead. */}
      <LeadDetailPanel key={name} name={name} onClose={onClose} exiting={exiting} />
    </div>
  );
}

function LeadDetailPanel({
  name,
  onClose,
  exiting,
}: {
  name: string;
  onClose: () => void;
  exiting: boolean;
}) {
  const { language } = useLanguage();
  const copy = useMemo(() => leadsCopyFor(language), [language]);
  const detail: LeadsDetailCopy = copy.detail;

  const [payload, setPayload] = useState<LeadDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabState, setTabState] = useState<{ name: string; tab: TabKey }>({
    name: "",
    tab: "activity",
  });
  const activeTab: TabKey = tabState.name === name ? tabState.tab : "activity";

  const [composerState, setComposerState] = useState<{
    name: string;
    mode: "reply" | "comment" | null;
  }>({ name: "", mode: null });
  const composerMode = composerState.name === name ? composerState.mode : null;

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const requestId = useRef(0);

  const load = useCallback(async () => {
    const ticket = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchLeadDetail(name, language);
      if (ticket !== requestId.current) return;
      setPayload(data);
    } catch (cause) {
      if (ticket !== requestId.current) return;
      setPayload(null);
      setError(cause instanceof ApiError ? cause.message : detail.errorTitle);
      reportClientError({
        scope: "leads:detail",
        message: "The lead detail could not be loaded",
        detail: cause instanceof Error ? cause.message : cause,
      });
    } finally {
      if (ticket === requestId.current) setLoading(false);
    }
  }, [name, language, detail.errorTitle]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  const counts = useMemo(() => {
    if (!payload) return {} as Record<TabKey, number>;
    return {
      activity: payload.activity.length,
      emails: payload.emails.length,
      comments: payload.comments.length,
      data: payload.lead?.fields.length ?? 0,
      calls: payload.calls.length,
      tasks: payload.tasks.length,
      notes: payload.notes.length,
      attachments: payload.attachments.length,
    } as Record<TabKey, number>;
  }, [payload]);

  const lead = payload?.lead;

  const sendComment = async () => {
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setNotice(null);
    try {
      await addLeadComment(name, content, language);
      setDraft("");
      setNotice({ tone: "ok", text: detail.commentAdded });
      setComposerState({ name, mode: null });
      await load();
    } catch (cause) {
      setNotice({
        tone: "error",
        text: cause instanceof ApiError ? cause.message : detail.commentFailed,
      });
      reportClientError({
        scope: "leads:comment",
        message: "The lead comment could not be added",
        detail: cause instanceof Error ? cause.message : cause,
      });
    } finally {
      setSending(false);
    }
  };

  const statusTone = lead?.status ? leadStatusTone(lead.status) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={lead?.lead_name || name}
      data-lead-detail={name}
      className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[24px] bg-[var(--color-white)] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)] sm:max-h-[88vh] sm:max-w-[1040px] sm:rounded-[24px] ${
        exiting
          ? "animate-[u-shk-sheet-out_200ms_ease-in_forwards]"
          : "animate-[u-shk-sheet-in_220ms_ease-out]"
      }`}
    >
      {/* ------------------------------------------------------------- header */}
      <div className="flex items-center gap-3 border-b border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-5 py-3.5">
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-action)_10%,var(--color-white))] text-[12.5px] font-bold text-[var(--color-action)]"
        >
          {leadInitials(lead?.lead_name || name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-[var(--color-primary)]" data-lead-detail-title="">
            {lead?.lead_name || name}
          </p>
          <p className={`truncate text-[11.5px] ${MUTED}`}>
            {[lead?.organization, name].filter(Boolean).join(" · ")}
          </p>
        </div>
        {lead?.status && statusTone ? (
          <span
            className="hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold sm:inline-flex"
            style={{ backgroundColor: statusTone.bg, color: statusTone.fg }}
            data-lead-status={lead.status}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusTone.fg }} />
            {leadStatusLabel(copy, lead.status)}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          aria-label={detail.close}
          data-lead-detail-close=""
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))]"
        >
          <FiX size={16} className="pointer-events-none" />
        </button>
      </div>

      {/* --------------------------------------------------------------- tabs */}
      <div
        role="tablist"
        className="flex shrink-0 items-stretch gap-1 overflow-x-auto border-b border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-2 sm:px-4"
      >
        {TAB_KEYS.map((key) => {
          const Icon = TAB_ICONS[key];
          const active = activeTab === key;

          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTabState({ name, tab: key })}
              data-lead-tab={key}
              data-active={active ? "true" : undefined}
              className={`relative -mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-3 text-[12.5px] font-medium transition sm:px-3 ${
                active
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] hover:text-[var(--color-primary)]"
              }`}
            >
              <Icon size={14} className="pointer-events-none" />
              <span className="pointer-events-none">{detail.tabs[key]}</span>
              {counts[key] > 0 && key !== "data" ? (
                <span
                  className={`pointer-events-none rounded-full px-1.5 text-[10.5px] font-semibold ${
                    active
                      ? "bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] text-[var(--color-primary)]"
                      : "bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
                  }`}
                >
                  {formatCount(counts[key], language)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* --------------------------------------------------------------- body */}
      <div className="min-h-[240px] flex-1 overflow-y-auto px-5 py-5 sm:px-6" data-lead-tab-panel={activeTab}>
        {loading ? (
          <div className="grid place-items-center py-16" data-lead-detail-loading="true">
            <ShikkhaLoader label={detail.loading} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center" data-lead-detail-error="true">
            <FiAlertCircle size={26} className="text-[var(--color-danger)]" />
            <p className="text-[13.5px] font-semibold text-[var(--color-primary)]">{detail.errorTitle}</p>
            <p className={`max-w-[46ch] text-[12px] ${MUTED}`}>{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-full bg-[var(--color-action)] px-4 py-2 text-[12.5px] font-semibold text-[var(--color-white)]"
            >
              {detail.retry}
            </button>
          </div>
        ) : !payload || !payload.available || !lead ? (
          <EmptyTab text={detail.empty.data} />
        ) : activeTab === "activity" ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-[16px] font-bold text-[var(--color-primary)]" data-lead-activity-heading="">
                {detail.activityHeading}
              </h3>
              <button
                type="button"
                data-lead-new=""
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-[12px] font-semibold text-[var(--color-white)] transition hover:opacity-90"
              >
                <FiPlus size={13} className="pointer-events-none" />
                <span className="pointer-events-none">{detail.newAction}</span>
                <FiChevronDown size={12} className="pointer-events-none opacity-80" />
              </button>
            </div>
            {payload.activity.length === 0 ? (
              <EmptyTab text={detail.empty.activity} />
            ) : (
              <ul className="flex flex-col" data-lead-activity-list="">
                {payload.activity.map((activity) => (
                  <ActivityItem key={activity.key} activity={activity} copy={copy} />
                ))}
              </ul>
            )}
          </>
        ) : activeTab === "emails" ? (
          <SimpleActivityList items={payload.emails} copy={copy} empty={detail.empty.emails} />
        ) : activeTab === "comments" ? (
          <SimpleActivityList items={payload.comments} copy={copy} empty={detail.empty.comments} />
        ) : activeTab === "data" ? (
          <DataGrid payload={payload} />
        ) : activeTab === "calls" ? (
          <SimpleActivityList items={payload.calls} copy={copy} empty={detail.empty.calls} />
        ) : activeTab === "tasks" ? (
          <SimpleActivityList items={payload.tasks} copy={copy} empty={detail.empty.tasks} />
        ) : activeTab === "notes" ? (
          <SimpleActivityList items={payload.notes} copy={copy} empty={detail.empty.notes} />
        ) : (
          <AttachmentList items={payload.attachments} empty={detail.empty.attachments} copy={copy} />
        )}
      </div>

      {/* ------------------------------------------------------ composer + bar */}
      {notice ? (
        <p
          className={`border-t border-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] px-5 py-2 text-[12px] font-medium ${
            notice.tone === "ok" ? "text-[var(--color-primary)]" : "text-[var(--color-danger)]"
          }`}
          data-lead-notice={notice.tone}
        >
          {notice.text}
        </p>
      ) : null}

      {composerMode ? (
        <div className="border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-5 py-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={detail.composerPlaceholder}
            rows={3}
            data-lead-composer=""
            className="w-full resize-none rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-3 py-2 text-[12.5px] text-[var(--color-primary)] outline-none transition focus:border-[color-mix(in_srgb,var(--color-action)_45%,transparent)]"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setComposerState({ name, mode: null })}
              className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]"
            >
              {detail.close}
            </button>
            <button
              type="button"
              onClick={() => void sendComment()}
              disabled={sending || draft.trim().length === 0}
              data-lead-send=""
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-action)] px-4 py-1.5 text-[12px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiSend size={12} className="pointer-events-none" />
              <span className="pointer-events-none">{sending ? detail.sending : detail.send}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-4 border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-5 py-3">
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setComposerState({ name, mode: "reply" });
            }}
            data-lead-reply=""
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12.5px] font-semibold text-[var(--color-primary)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]"
          >
            <FiMail size={14} className="pointer-events-none" />
            <span className="pointer-events-none">{detail.reply}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setComposerState({ name, mode: "comment" });
            }}
            data-lead-comment=""
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12.5px] font-semibold text-[var(--color-primary)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]"
          >
            <FiMessageSquare size={14} className="pointer-events-none" />
            <span className="pointer-events-none">{detail.comment}</span>
          </button>
        </div>
      )}
    </div>
  );
}
