"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiBold,
  FiCalendar,
  FiCheckSquare,
  FiChevronDown,
  FiDatabase,
  FiEdit2,
  FiFileText,
  FiCode,
  FiImage,
  FiInbox,
  FiItalic,
  FiLink,
  FiList,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiPaperclip,
  FiMoreHorizontal,
  FiPlus,
  FiSend,
  FiType,
  FiUserPlus,
  FiX,
} from "react-icons/fi";

import ShikkhaLoader from "./ShikkhaLoader";
import { ApiError } from "@/lib/api/http";
import {
  addLeadComment,
  addLeadNote,
  addLeadTask,
  fetchLeadDetail,
  fetchLeadTaskOptions,
  leadFileSrc,
  updateLeadDetail,
  uploadLeadAttachment,
} from "@/lib/leads/api";
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
import type {
  LeadActivity,
  LeadAttachment,
  LeadDetailPayload,
  LeadNoteCreated,
  LeadTaskCreated,
  LeadTaskOptions,
} from "@/lib/leads/types";
import { useOverlayPresence } from "@/lib/dashboard/useOverlayPresence";
import { createPortal } from "react-dom";
import { reportClientError } from "@/lib/log/report-error";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/** Must stay in sync with `MAX_ATTACHMENT_BYTES` in the attachment proxy route. */
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

/** What the file picker offers; the proxy and the ERP enforce size + name. */
const ATTACHMENT_ACCEPT =
  ".png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip";

/** `File` -> bare base64 (no data: prefix): what the JSON proxy forwards. */
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}


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

/**
 * A person's picture with a monogram fallback.
 *
 * ERP avatars hold site-relative paths (`/files/sir_shakil_10.jpeg`) that the
 * portal origin cannot load — before this component every timeline avatar was
 * a broken-image icon. `leadFileSrc` routes them through the same-origin file
 * proxy; when the picture is missing or not an image at all, the monogram wins.
 */
function PersonAvatar({
  actor,
  email,
  image,
}: {
  actor?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const [broken, setBroken] = useState(false);
  const src = broken ? "" : leadFileSrc(image);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={actor || email || ""}
        data-lead-avatar=""
        onError={() => setBroken(true)}
        className="h-7 w-7 shrink-0 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] object-cover"
      />
    );
  }

  return (
    <span
      data-lead-avatar-fallback=""
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[11px] font-bold text-[var(--color-primary)]"
    >
      {(actor || email || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

function CommentsList({ items, copy, empty }: { items: LeadActivity[]; copy: LeadsCopy; empty: string }) {
  if (items.length === 0) return <EmptyTab text={empty} />;

  return (
    <ul className="flex flex-col gap-3" data-lead-comments="">
      {items.map((entry) => (
        <li
          key={entry.key}
          data-lead-comment-item={entry.key}
          className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_9%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_2%,var(--color-white))] px-4 py-3"
        >
          <div className="flex items-start gap-2.5">
            <PersonAvatar actor={entry.actor} email={entry.actor_email} image={entry.actor_image} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-[var(--color-primary)]">
                {entry.actor || entry.actor_email}
              </p>
              {entry.actor_email ? (
                <p className="truncate text-[11px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                  {entry.actor_email}
                </p>
              ) : null}
            </div>
            <RelativeTime at={entry.at} copy={copy} />
          </div>
          {entry.body ? (
            <p
              className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_80%,transparent)]"
              data-lead-comment-body=""
            >
              {entry.body}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function NotesList({ items, copy, empty }: { items: LeadActivity[]; copy: LeadsCopy; empty: string }) {
  if (items.length === 0) return <EmptyTab text={empty} />;

  return (
    <ul className="flex flex-col gap-3" data-lead-notes="">
      {items.map((note) => (
        <li
          key={note.key}
          data-lead-note={note.key}
          className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_9%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_2%,var(--color-white))] px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p
              className="min-w-0 text-[13px] font-semibold text-[var(--color-primary)]"
              data-lead-note-title=""
            >
              {note.text}
            </p>
            <RelativeTime at={note.at} copy={copy} />
          </div>
          {note.body ? (
            <p
              className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_78%,transparent)]"
              data-lead-note-body=""
            >
              {note.body}
            </p>
          ) : null}
          {note.actor ? (
            <p className="mt-2.5 text-[11.5px] font-medium text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
              — {note.actor}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
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


/** Bengali labels for CRM Task's statuses; English is the stored value. */
const TASK_STATUS_LABELS: Record<string, { en: string; bn: string }> = {
  Backlog: { en: "Backlog", bn: "ব্যাকলগ" },
  Todo: { en: "Todo", bn: "করণীয়" },
  "In Progress": { en: "In Progress", bn: "চলমান" },
  Done: { en: "Done", bn: "সম্পন্ন" },
  Cancelled: { en: "Cancelled", bn: "বাতিল" },
};

/** Display labels for the fixed CRM Task priorities. */
const TASK_PRIORITY_LABELS: Record<string, { en: string; bn: string }> = {
  High: { en: "High", bn: "হাই" },
  Medium: { en: "Medium", bn: "মিডিয়াম" },
  Low: { en: "Low", bn: "লো" },
};

/** Priority chip for task rows and the form's dropdown. "" is No Priority. */
function TaskPriorityChip({ priority, language }: { priority: string; language: string }) {
  const value = (priority || "").trim();
  if (!value) return null;
  const label = TASK_PRIORITY_LABELS[value]?.[language === "bn" ? "bn" : "en"] ?? value;

  const tone =
    value === "High"
      ? { bg: "color-mix(in srgb, #e5484d 12%, white)", fg: "#b42318" }
      : value === "Medium"
        ? { bg: "color-mix(in srgb, #f5a524 18%, white)", fg: "#8a5a00" }
        : { bg: "color-mix(in srgb, #12b76a 12%, white)", fg: "#067647" };

  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
      data-lead-task-priority={value}
    >
      {label}
    </span>
  );
}

/** YYYY-MM-DD -> "5 Mar 2027" (Bengali numerals under the Bengali locale). */
function formatDueDate(value: string, language: string): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  try {
    return new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return value;
  }
}

/**
 * The Tasks tab: the lead's CRM Tasks with a **New task** button in the
 * section's top-right corner (the ask was explicit about the position).
 */
function TasksPanel({
  items,
  copy,
  detail,
  empty,
  language,
  onNew,
}: {
  items: LeadActivity[];
  copy: LeadsCopy;
  detail: LeadsDetailCopy;
  empty: string;
  language: string;
  onNew: () => void;
}) {
  return (
    <div data-lead-tasks="">
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={onNew}
          data-lead-new-task=""
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-[12px] font-semibold text-[var(--color-white)] transition hover:opacity-90"
        >
          <FiPlus size={13} className="pointer-events-none" />
          <span className="pointer-events-none">{detail.newTask}</span>
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyTab text={empty} />
      ) : (
        <ul className="flex flex-col gap-2" data-lead-task-list="">
          {items.map((item) => (
            <li
              key={item.key}
              data-lead-task-item={item.key}
              className="rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-3.5 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <FiCheckSquare size={14} className="shrink-0 text-[var(--color-action)]" />
                <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--color-primary)]">
                  {item.title || item.text}
                </p>
                <TaskPriorityChip priority={item.priority || ""} language={language} />
                {item.status ? (
                  <span
                    className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] px-2 py-0.5 text-[10.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)]"
                    data-lead-task-status={item.status}
                  >
                    {TASK_STATUS_LABELS[item.status]?.[language === "bn" ? "bn" : "en"] ??
                      item.status}
                  </span>
                ) : null}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-[22px] text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                <span data-lead-task-assignee="">
                  {item.assigned_label || detail.taskForm.unassigned}
                </span>
                {item.due_date ? (
                  <span className="inline-flex items-center gap-1">
                    <FiCalendar size={11} className="pointer-events-none" />
                    {formatDueDate(item.due_date, language)}
                  </span>
                ) : null}
                {item.at ? <RelativeTime at={item.at} copy={copy} /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Server priorities, with a local fallback when the options call fails. */
const FALLBACK_TASK_PRIORITIES = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
  { value: "", label: "No Priority" },
];

/** Used only when the options call fails; mirrors CRM Task's own statuses. */
const FALLBACK_TASK_STATUSES = [
  { value: "Backlog", label: "Backlog" },
  { value: "Todo", label: "Todo" },
  { value: "In Progress", label: "In Progress" },
  { value: "Done", label: "Done" },
  { value: "Cancelled", label: "Cancelled" },
];

/**
 * The New-task form: a popup over the lead sheet.
 *
 * Field set mirrors Frappe CRM's own task form — Title (required),
 * Description, Priority (High / Medium / Low / No Priority), Assigned To
 * (HR ▸ Employee) and Due date. Submitting creates a real `CRM Task` linked
 * to this lead, so the record shows up in Desk ▸ CRM ▸ Tasks.
 */
function TaskFormModal({
  name,
  language,
  detail,
  onClose,
  onCreated,
}: {
  name: string;
  language: string;
  detail: LeadsDetailCopy;
  onClose: () => void;
  onCreated: (task: LeadTaskCreated) => void | Promise<void>;
}) {
  const cf = detail.taskForm;
  const [options, setOptions] = useState<LeadTaskOptions | null>(null);
  const [optionsFailed, setOptionsFailed] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payload = await fetchLeadTaskOptions(language);
        if (!cancelled) setOptions(payload);
      } catch (cause) {
        if (cancelled) return;
        // The form still works: priorities fall back to the four fixed
        // choices and the assignee simply stays optional.
        setOptionsFailed(true);
        reportClientError({
          scope: "leads:task-options",
          message: "The task form options could not be loaded",
          detail: cause instanceof Error ? cause.message : cause,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const priorities =
    options && options.priorities.length > 0 ? options.priorities : FALLBACK_TASK_PRIORITIES;
  const statuses =
    options && options.statuses?.length ? options.statuses : FALLBACK_TASK_STATUSES;
  const employees = options?.employees ?? [];
  // The ERP decides the default status ("Todo"); keep the dropdown in sync.
  const statusValue = status || options?.status_default || "Todo";

  const submit = async () => {
    if (submitting) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError(cf.required);
      titleRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const result = await addLeadTask(
        name,
        {
          title: cleanTitle,
          description: description.trim(),
          priority,
          status: statusValue,
          assigned_to: assignedTo,
          due_date: dueDate,
        },
        language
      );
      await onCreated(result.task);
    } catch (cause) {
      setFormError(cause instanceof ApiError ? cause.message : cf.failed);
      reportClientError({
        scope: "leads:task",
        message: "The lead task could not be created",
        detail: cause instanceof Error ? cause.message : cause,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass = "mb-1 block text-[11.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]";
  const fieldClass =
    "w-full rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-3 py-2 text-[12.5px] text-[var(--color-primary)] outline-none transition focus:border-[color-mix(in_srgb,var(--color-action)_45%,transparent)]";

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={detail.newTask}
      data-task-modal=""
      className="fixed inset-0 z-[160] flex items-end justify-center bg-[rgba(9,12,24,0.42)] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[20px] bg-[var(--color-white)] p-5 pb-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)] sm:max-w-[520px] sm:rounded-[20px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-bold text-[var(--color-primary)]">{detail.newTask}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label={detail.close}
            data-task-cancel=""
            className="grid h-8 w-8 place-items-center rounded-full text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] disabled:opacity-50"
          >
            <FiX size={16} className="pointer-events-none" />
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          <div>
            <label className={labelClass} htmlFor="lead-task-title">
              {cf.title}
            </label>
            <input
              id="lead-task-title"
              ref={titleRef}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (formError) setFormError(null);
              }}
              placeholder={cf.titlePlaceholder}
              maxLength={140}
              data-task-title=""
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="lead-task-description">
              {cf.description}
            </label>
            <textarea
              id="lead-task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={cf.descriptionPlaceholder}
              rows={3}
              maxLength={5000}
              data-task-description=""
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="lead-task-priority">
                {cf.priority}
              </label>
              <select
                id="lead-task-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                data-task-priority=""
                className={fieldClass}
              >
                {priorities.map((option) => (
                  <option key={option.value || "none"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="lead-task-assignee">
                {cf.assignedTo}
              </label>
              <select
                id="lead-task-assignee"
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
                data-task-assignee=""
                className={fieldClass}
              >
                <option value="">—</option>
                {employees.map((employee) => (
                  <option key={employee.value} value={employee.value}>
                    {employee.designation
                      ? `${employee.label} · ${employee.designation}`
                      : employee.label}
                  </option>
                ))}
              </select>
              {optionsFailed ? (
                <p className="mt-1 text-[11px] text-[var(--color-danger)]">{cf.noEmployees}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="lead-task-due">
                {cf.dueDate}
              </label>
              <input
                id="lead-task-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                data-task-due=""
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="lead-task-status">
                {cf.status}
              </label>
              <select
                id="lead-task-status"
                value={statusValue}
                onChange={(event) => setStatus(event.target.value)}
                data-task-status=""
                className={fieldClass}
              >
                {statuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {formError ? (
          <p className="mt-3 text-[12px] font-medium text-[var(--color-danger)]" data-task-error="">
            {formError}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full px-4 py-2 text-[12.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] disabled:opacity-50"
          >
            {detail.cancel}
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            data-task-create=""
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-action)] px-4 py-2 text-[12.5px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiPlus size={13} className="pointer-events-none" />
            <span className="pointer-events-none">{submitting ? cf.creating : cf.create}</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Rendered into <body>: the sheet keeps an animation fill-mode transform,
  // which would otherwise trap a `fixed` popup inside the sheet's box.
  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

/** The Notes tab's list plus the top-right "New note" button. */
function NotesPanel({
  items,
  copy,
  detail,
  empty,
  onNew,
}: {
  items: LeadActivity[];
  copy: LeadsCopy;
  detail: LeadsDetailCopy;
  empty: string;
  onNew: () => void;
}) {
  return (
    <div data-lead-notes-panel="">
      <div className="mb-3.5 flex items-center justify-end">
        <button
          type="button"
          onClick={onNew}
          data-lead-new-note=""
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-action)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)]"
        >
          <FiPlus size={13} className="pointer-events-none" />
          <span className="pointer-events-none">{detail.newNote}</span>
        </button>
      </div>
      {items.length === 0 ? (
        <EmptyTab text={empty} />
      ) : (
        <NotesList items={items} copy={copy} empty={empty} />
      )}
    </div>
  );
}

/**
 * Desk-style "Create Note" form: a required title and a rich-text content box,
 * writing a `FCRM Note` linked to the lead (it then shows at /crm/notes too).
 */
function NoteFormModal({
  name,
  language,
  detail,
  onClose,
  onCreated,
}: {
  name: string;
  language: string;
  detail: LeadsDetailCopy;
  onClose: () => void;
  onCreated: (note: LeadNoteCreated) => void | Promise<void>;
}) {
  const cf = detail.noteForm;
  const [title, setTitle] = useState("");
  const [empty, setEmpty] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const syncEmpty = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const hasMedia = editor.querySelector("img,hr,table,li") !== null;
    setEmpty(!(editor.innerText || "").trim() && !hasMedia);
  };

  const exec = (command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    try {
      document.execCommand(command, false, value);
    } catch {
      /* older engines simply ignore unsupported commands */
    }
    syncEmpty();
  };

  const escapeHtml = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const onlyHttpUrl = (value: string | null) => {
    const url = (value || "").trim();
    if (!url) return "";
    return /^https?:\/\//i.test(url) ? url : "";
  };

  const addLink = () => {
    const url = onlyHttpUrl(window.prompt(cf.linkPrompt));
    if (url) exec("createLink", url);
  };

  const addImage = () => {
    const url = onlyHttpUrl(window.prompt(cf.imagePrompt));
    if (url) exec("insertImage", url);
  };

  const addCode = () => {
    const editor = editorRef.current;
    const selected = window.getSelection()?.toString() ?? "";
    if (!editor || !selected.trim()) {
      exec("insertHTML", `<code>${escapeHtml(selected || "code")}</code>`);
      return;
    }
    exec("insertHTML", `<code>${escapeHtml(selected)}</code>`);
  };

  const submit = async () => {
    if (submitting) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError(cf.titleRequired);
      titleRef.current?.focus();
      return;
    }

    const content = editorRef.current?.innerHTML ?? "";

    setSubmitting(true);
    setFormError(null);
    try {
      const result = await addLeadNote(name, { title: cleanTitle, content }, language);
      await onCreated(result.note);
    } catch (cause) {
      setFormError(cause instanceof ApiError ? cause.message : cf.saveFailed);
      reportClientError({
        scope: "leads:note",
        message: "The lead note could not be created",
        detail: cause instanceof Error ? cause.message : cause,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass =
    "mb-1 block text-[11.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]";
  const fieldClass =
    "w-full rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-3 py-2 text-[12.5px] text-[var(--color-primary)] outline-none transition focus:border-[color-mix(in_srgb,var(--color-action)_45%,transparent)]";
  const toolClass =
    "inline-flex h-7 min-w-[26px] items-center justify-center rounded-md px-1.5 text-[11.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]";

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={detail.newNote}
      data-note-modal=""
      className="fixed inset-0 z-[160] flex items-end justify-center bg-[rgba(9,12,24,0.42)] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[20px] bg-[var(--color-white)] p-5 pb-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)] sm:max-w-[560px] sm:rounded-[20px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-bold text-[var(--color-primary)]">{detail.newNote}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label={detail.close}
            data-note-close=""
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] disabled:opacity-50"
          >
            <FiX size={15} />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className={labelClass} htmlFor="lead-note-title">
              {cf.title} <span className="text-[#e0483f]">*</span>
            </label>
            <input
              id="lead-note-title"
              ref={titleRef}
              type="text"
              value={title}
              maxLength={140}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={cf.titlePlaceholder}
              data-note-title=""
              className={fieldClass}
            />
          </div>

          <div>
            <span className={labelClass}>{cf.content}</span>
            <div className="overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] focus-within:border-[color-mix(in_srgb,var(--color-action)_45%,transparent)]">
              <div
                role="toolbar"
                aria-label={cf.content}
                className="flex flex-wrap items-center gap-0.5 border-b border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] px-1.5 py-1"
              >
                <button type="button" title={cf.heading} className={toolClass} onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "<h1>"); }}>
                  <FiType size={13} className="pointer-events-none" />
                </button>
                <button type="button" title="H2" className={toolClass} onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "<h2>"); }}>
                  H2
                </button>
                <button type="button" title="H3" className={toolClass} onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "<h3>"); }}>
                  H3
                </button>
                <button type="button" title="H4" className={toolClass} onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "<h4>"); }}>
                  H4
                </button>
                <span className="mx-1 h-4 w-px bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]" />
                <button type="button" title={cf.bold} className={toolClass} onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}>
                  <FiBold size={13} className="pointer-events-none" />
                </button>
                <button type="button" title={cf.italic} className={toolClass} onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}>
                  <FiItalic size={13} className="pointer-events-none" />
                </button>
                <button type="button" title={cf.strike} className={toolClass} onMouseDown={(e) => { e.preventDefault(); exec("strikeThrough"); }}>
                  <span className="line-through">S</span>
                </button>
                <span className="mx-1 h-4 w-px bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]" />
                <button type="button" title={cf.bulletList} className={toolClass} onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }}>
                  <FiList size={13} className="pointer-events-none" />
                </button>
                <button type="button" title={cf.numberedList} className={toolClass} onMouseDown={(e) => { e.preventDefault(); exec("insertOrderedList"); }}>
                  <span className="text-[11px]">1.</span>
                </button>
                <span className="mx-1 h-4 w-px bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]" />
                <button type="button" title={cf.insertLink} className={toolClass} onMouseDown={(e) => { e.preventDefault(); addLink(); }}>
                  <FiLink size={13} className="pointer-events-none" />
                </button>
                <button type="button" title={cf.inlineCode} className={toolClass} onMouseDown={(e) => { e.preventDefault(); addCode(); }}>
                  <FiCode size={13} className="pointer-events-none" />
                </button>
                <button type="button" title={cf.insertImage} className={toolClass} onMouseDown={(e) => { e.preventDefault(); addImage(); }}>
                  <FiImage size={13} className="pointer-events-none" />
                </button>
                <span className="mx-1 h-4 w-px bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]" />
                <button type="button" title={cf.clearFormatting} className={toolClass} onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); }}>
                  <FiMoreHorizontal size={14} className="pointer-events-none" />
                </button>
              </div>
              <div className="relative">
                {empty ? (
                  <span className="pointer-events-none absolute inset-x-3 top-2.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)]">
                    {cf.contentPlaceholder}
                  </span>
                ) : null}
                <div
                  ref={editorRef}
                  role="textbox"
                  aria-multiline="true"
                  aria-label={cf.content}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={syncEmpty}
                  data-note-content=""
                  className="min-h-[180px] max-h-[340px] w-full overflow-y-auto px-3 py-2.5 text-[12.5px] leading-relaxed text-[var(--color-primary)] outline-none [&_a]:text-[var(--color-action)] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-2.5 [&_code]:rounded [&_code]:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] [&_code]:px-1 [&_h1]:text-[17px] [&_h1]:font-bold [&_h2]:text-[15px] [&_h2]:font-bold [&_h3]:text-[13.5px] [&_h3]:font-semibold [&_h4]:text-[12.5px] [&_h4]:font-semibold [&_img]:max-w-full [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc"
                />
              </div>
            </div>
          </div>

          {formError ? (
            <p role="alert" data-note-error="" className="text-[11.5px] font-medium text-[#d0453c]">
              {formError}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full px-4 py-2 text-[12.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] disabled:opacity-50"
          >
            {detail.cancel}
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            data-note-create=""
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4 py-2 text-[12.5px] font-semibold text-[var(--color-white)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,black)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="pointer-events-none">{submitting ? cf.creating : cf.create}</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Rendered into <body> for the same reason as the task form: the sheet's
  // animation fill-mode transform would otherwise clip a `fixed` popup.
  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
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

/** Mirrors `_EDITABLE_FIELDS` in the ERP endpoint; only a UI ordering hint. */
const FALLBACK_EDITABLE_FIELDS = [
  "first_name",
  "last_name",
  "salutation",
  "email",
  "mobile_no",
  "phone",
  "organization",
  "organization_name",
  "company_name",
  "job_title",
  "website",
  "territory",
  "industry",
  "status",
  "source",
];

/**
 * The Data tab: the lead's fields, editable in place.
 *
 * First Name / Last Name / E-mail are permanent rows (the ERP includes them
 * even when empty) so a lead created without them can be completed here. The
 * edit form only offers fields the ERP endpoint accepts — `editable` comes
 * from `_EDITABLE_FIELDS` server-side, and the endpoint re-validates on save.
 */
function DataGrid({
  payload,
  name,
  language,
  detail,
  onSaved,
  onNotice,
}: {
  payload: LeadDetailPayload;
  name: string;
  language: string;
  detail: LeadsDetailCopy;
  onSaved: () => Promise<void> | void;
  onNotice: (notice: { tone: "ok" | "error"; text: string } | null) => void;
}) {
  const fields = useMemo(() => payload.lead?.fields ?? [], [payload.lead?.fields]);

  const editableFields = useMemo(() => {
    const byField = new Map<string, (typeof fields)[number]>();
    for (const field of fields) {
      if (!field.field) continue;
      if (!field.editable && !FALLBACK_EDITABLE_FIELDS.includes(field.field)) continue;
      byField.set(field.field, field);
    }
    return byField;
  }, [fields]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  if (fields.length === 0) return null;

  const startEditing = () => {
    const next: Record<string, string> = {};
    for (const field of editableFields.values()) {
      if (field.field) next[field.field] = field.value;
    }
    setDraft(next);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft({});
  };

  const save = async () => {
    if (saving) return;

    const updates: Record<string, string> = {};
    for (const field of editableFields.values()) {
      if (!field.field) continue;
      const value = (draft[field.field] ?? "").trim();
      if (value !== (field.value ?? "").trim()) updates[field.field] = value;
    }

    if (Object.keys(updates).length === 0) {
      cancelEditing();
      return;
    }

    setSaving(true);
    onNotice(null);
    try {
      await updateLeadDetail(name, updates, language);
      onNotice({ tone: "ok", text: detail.saved });
      setEditing(false);
      setDraft({});
      await onSaved();
    } catch (cause) {
      onNotice({
        tone: "error",
        text: cause instanceof ApiError && cause.message ? cause.message : detail.saveFailed,
      });
      reportClientError({
        scope: "leads:update",
        message: "The lead could not be saved",
        detail: cause instanceof Error ? cause.message : cause,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-lead-data-wrapper="">
      <div className="mb-3 flex items-center justify-end gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              data-lead-edit-cancel=""
              className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {detail.cancel}
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              data-lead-save=""
              className="rounded-full bg-[var(--color-action)] px-4 py-1.5 text-[12px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? detail.saving : detail.save}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            disabled={editableFields.size === 0}
            data-lead-edit=""
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-[var(--color-primary)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiEdit2 size={12} className="pointer-events-none" />
            <span className="pointer-events-none">{detail.edit}</span>
          </button>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2" data-lead-data="" data-editing={editing ? "true" : undefined}>
        {fields.map((field) => {
          const key = field.field || field.label;
          const editable = Boolean(field.field && editableFields.has(field.field));

          return (
            <div
              key={key}
              className="flex flex-col gap-0.5 border-b border-[color-mix(in_srgb,var(--color-primary)_7%,transparent)] pb-2"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]">
                {field.label}
              </dt>
              {editing && editable && field.field ? (
                <dd>
                  <input
                    value={draft[field.field] ?? ""}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, [field.field as string]: event.target.value }))
                    }
                    placeholder={field.label}
                    aria-label={field.label}
                    data-lead-edit-field={field.field}
                    className="w-full rounded-lg border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-2.5 py-1.5 text-[13px] text-[var(--color-primary)] outline-none transition focus:border-[color-mix(in_srgb,var(--color-action)_45%,transparent)]"
                  />
                </dd>
              ) : (
                <dd
                  className="break-words text-[13px] text-[var(--color-primary)]"
                  data-lead-field={field.field || undefined}
                >
                  {field.value || "—"}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
    </div>
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
  const [uploading, setUploading] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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


  const pickAttachment = () => {
    if (uploading) return;
    setNotice(null);
    fileInputRef.current?.click();
  };

  const uploadAttachment = async (file: File) => {
    if (uploading) return;

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setNotice({ tone: "error", text: detail.attachmentTooLarge });
      return;
    }

    setUploading(true);
    setNotice(null);
    try {
      // The proxy speaks JSON to the ERP, so the bytes travel base64-encoded.
      const content_base64 = await readFileAsBase64(file);
      await uploadLeadAttachment(name, { file_name: file.name, content_base64 }, language);
      setNotice({ tone: "ok", text: detail.attachmentAdded });
      // The File row now exists, so show it where the user expects to find it.
      setTabState({ name, tab: "attachments" });
      await load();
    } catch (cause) {
      setNotice({
        tone: "error",
        text: cause instanceof ApiError ? cause.message : detail.attachmentFailed,
      });
      reportClientError({
        scope: "leads:attachment",
        message: "The lead attachment could not be uploaded",
        detail: cause instanceof Error ? cause.message : cause,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      {/* One hidden picker serves both the composer paperclip and the bar one. */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        data-lead-attach-input=""
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadAttachment(file);
        }}
      />

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
          <CommentsList items={payload.comments} copy={copy} empty={detail.empty.comments} />
        ) : activeTab === "data" ? (
          <DataGrid
            payload={payload}
            name={name}
            language={language}
            detail={detail}
            onSaved={load}
            onNotice={setNotice}
          />
        ) : activeTab === "calls" ? (
          <SimpleActivityList items={payload.calls} copy={copy} empty={detail.empty.calls} />
        ) : activeTab === "tasks" ? (
          <TasksPanel
            items={payload.tasks}
            copy={copy}
            detail={detail}
            empty={detail.empty.tasks}
            language={language}
            onNew={() => {
              setNotice(null);
              setTaskFormOpen(true);
            }}
          />
        ) : activeTab === "notes" ? (
          <NotesPanel
            items={payload.notes}
            copy={copy}
            detail={detail}
            empty={detail.empty.notes}
            onNew={() => {
              setNotice(null);
              setNoteFormOpen(true);
            }}
          />
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
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={pickAttachment}
              disabled={uploading}
              data-lead-attach=""
              aria-label={detail.attach}
              title={detail.attach}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiPaperclip size={13} className="pointer-events-none" />
              <span className="pointer-events-none">{uploading ? detail.attaching : detail.attach}</span>
            </button>
            <div className="flex items-center gap-2">
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
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setComposerState({ name, mode: "comment" });
              // Open the picker on the next tick so the bar stays in place.
              window.setTimeout(() => fileInputRef.current?.click(), 0);
            }}
            data-lead-attach-bar=""
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]"
            aria-label={detail.attach}
            title={detail.attach}
          >
            <FiPaperclip size={14} className="pointer-events-none" />
          </button>
        </div>
      )}

      {/* The New-task form floats over the whole sheet. */}
      {taskFormOpen ? (
        <TaskFormModal
          name={name}
          language={language}
          detail={detail}
          onClose={() => setTaskFormOpen(false)}
          onCreated={async () => {
            setTaskFormOpen(false);
            setNotice({ tone: "ok", text: detail.taskForm.created });
            setTabState({ name, tab: "tasks" });
            await load();
          }}
        />
      ) : null}

      {noteFormOpen ? (
        <NoteFormModal
          name={name}
          language={language}
          detail={detail}
          onClose={() => setNoteFormOpen(false)}
          onCreated={async () => {
            setNoteFormOpen(false);
            setNotice({ tone: "ok", text: detail.noteForm.created });
            setTabState({ name, tab: "notes" });
            await load();
          }}
        />
      ) : null}
    </div>
  );
}
