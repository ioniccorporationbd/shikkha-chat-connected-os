"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiEdit2, FiX } from "react-icons/fi";

import { ApiError } from "@/lib/api/http";
import {
  fetchLeadTaskDetail,
  fetchLeadTaskOptions,
  updateLeadTaskGlobal,
} from "@/lib/leads/api";
import { leadsCopyFor } from "@/lib/leads/messages";
import type { LeadTaskCreated, LeadTaskEdit, LeadTaskOptions } from "@/lib/leads/types";
import { reportClientError } from "@/lib/log/report-error";

/** Used only when the options call fails; mirrors CRM Task's own priorities. */
const FALLBACK_TASK_PRIORITIES = [
  { value: "", label: "No Priority" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

/** Used only when the options call fails; mirrors CRM Task's own statuses. */
const FALLBACK_TASK_STATUSES = [
  { value: "Backlog", label: "Backlog" },
  { value: "Todo", label: "Todo" },
  { value: "In Progress", label: "In Progress" },
  { value: "Done", label: "Done" },
  { value: "Cancelled", label: "Cancelled" },
];

/** What the board row already knows about a task — enough to paint the popup. */
export interface TaskDetailInitial {
  title: string;
  description?: string;
  priority: string;
  status: string;
  due_date: string;
  /** The current assignee's User id (CRM Task.assigned_to), if any. */
  assigned_to?: string;
}

interface TaskDetailModalProps {
  /** The CRM Task docname this popup edits. */
  taskName: string;
  initial: TaskDetailInitial;
  language: string;
  onClose: () => void;
  onSaved: (updated: LeadTaskCreated) => void | Promise<void>;
}

/**
 * Editable Task-detail popup for the global Tasks board.
 *
 * Mirrors the lead sheet's TaskDetailModal but is not scoped to a lead — it
 * edits one CRM Task by its own docname and only writes the fields the user
 * actually changed. The board row already carries title/priority/status/due/
 * assignee; the description is fetched on open (the list rows omit it).
 */
export default function TaskDetailModal({
  taskName,
  initial,
  language,
  onClose,
  onSaved,
}: TaskDetailModalProps) {
  const detail = leadsCopyFor(language).detail;
  const cf = detail.taskForm;
  const dt = detail.taskDetail;

  const [options, setOptions] = useState<LeadTaskOptions | null>(null);
  const [optionsFailed, setOptionsFailed] = useState(false);
  const [title, setTitle] = useState(initial.title || "");
  const [description, setDescription] = useState(initial.description || "");
  const [priority, setPriority] = useState(initial.priority || "");
  const [status, setStatus] = useState(initial.status || "");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState((initial.due_date || "").slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  // The values as loaded — Save only sends what changed from here.
  const baselineRef = useRef<LeadTaskEdit>({
    title: initial.title || "",
    description: initial.description || "",
    priority: initial.priority || "",
    status: initial.status || "",
    due_date: (initial.due_date || "").slice(0, 10),
  });

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Row rows omit the description; fetch the full record once to load it.
  useEffect(() => {
    if (initial.description !== undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const payload = await fetchLeadTaskDetail(taskName, language);
        if (cancelled) return;
        if (payload.task.description && payload.task.description !== description) {
          setDescription(payload.task.description);
          baselineRef.current = { ...baselineRef.current, description: payload.task.description };
        }
      } catch (cause) {
        if (cancelled) return;
        reportClientError({
          scope: "leads:task-detail-load",
          message: "The task details could not be loaded",
          detail: cause instanceof Error ? cause.message : cause,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
    // description is only used as a fallback comparison here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskName, language, initial.description]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payload = await fetchLeadTaskOptions(language);
        if (cancelled) return;
        setOptions(payload);

        // The row carries the assignee's User, the dropdown lists Employees —
        // resolve once so the select shows the right person, not "—".
        const assigneeUser = (initial.assigned_to || "").trim();
        const match = assigneeUser
          ? payload.employees.find((employee) => employee.user === assigneeUser)
          : undefined;
        if (match) {
          setAssignedTo(match.value);
          baselineRef.current = { ...baselineRef.current, assigned_to: match.value };
        }
      } catch (cause) {
        if (cancelled) return;
        setOptionsFailed(true);
        reportClientError({
          scope: "leads:task-detail-options",
          message: "The task details options could not be loaded",
          detail: cause instanceof Error ? cause.message : cause,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language, initial.assigned_to]);

  const priorities =
    options && options.priorities.length > 0 ? options.priorities : FALLBACK_TASK_PRIORITIES;
  const statuses = options && options.statuses?.length ? options.statuses : FALLBACK_TASK_STATUSES;
  const employees = options?.employees ?? [];
  const statusValue = status || options?.status_default || "Todo";

  const submit = async () => {
    if (saving) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError(cf.required);
      titleRef.current?.focus();
      return;
    }

    const base = baselineRef.current;
    const edits: LeadTaskEdit = {};
    if (cleanTitle !== (base.title ?? "")) edits.title = cleanTitle;
    if (description.trim() !== (base.description ?? "")) edits.description = description.trim();
    if (priority !== (base.priority ?? "")) edits.priority = priority;
    // Compare the raw state, not the defaulted display value: an untouched task
    // whose status is empty must not be silently flipped to the default status.
    if (status !== (base.status ?? "")) edits.status = status || statusValue;
    if (assignedTo !== (base.assigned_to ?? "")) edits.assigned_to = assignedTo;
    if (dueDate !== (base.due_date ?? "")) edits.due_date = dueDate;

    if (!taskName) {
      setFormError(dt.notFound);
      return;
    }

    // Nothing changed — closing is the honest outcome, no write, no noise.
    if (Object.keys(edits).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const result = await updateLeadTaskGlobal(taskName, edits, language);
      await onSaved(result.task);
    } catch (cause) {
      setFormError(cause instanceof ApiError ? cause.message : dt.updateFailed);
      reportClientError({
        scope: "leads:task-detail",
        message: "The task could not be saved",
        detail: cause instanceof Error ? cause.message : cause,
      });
    } finally {
      setSaving(false);
    }
  };

  const labelClass =
    "mb-1 block text-[11.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]";
  const fieldClass =
    "w-full rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-3 py-2 text-[12.5px] text-[var(--color-primary)] outline-none transition focus:border-[color-mix(in_srgb,var(--color-action)_45%,transparent)]";

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dt.title}
      data-task-detail-modal=""
      className="fixed inset-0 z-[160] flex items-end justify-center bg-[rgba(9,12,24,0.42)] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[20px] bg-[var(--color-white)] p-5 pb-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)] sm:max-w-[540px] sm:rounded-[20px]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-[var(--color-primary)]">{dt.title}</h3>
            <p
              className="mt-0.5 truncate text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
              data-task-detail-name=""
            >
              {`${dt.subtitle} · ${taskName}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label={detail.close}
            data-task-detail-close=""
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] disabled:opacity-50"
          >
            <FiX size={16} className="pointer-events-none" />
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          <div>
            <label className={labelClass} htmlFor="board-task-detail-title">
              {cf.title}
            </label>
            <input
              id="board-task-detail-title"
              ref={titleRef}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (formError) setFormError(null);
              }}
              placeholder={cf.titlePlaceholder}
              maxLength={140}
              data-task-detail-title=""
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="board-task-detail-description">
              {cf.description}
            </label>
            <textarea
              id="board-task-detail-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={cf.descriptionPlaceholder || dt.emptyDescription}
              rows={4}
              maxLength={5000}
              data-task-detail-description=""
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="board-task-detail-priority">
                {cf.priority}
              </label>
              <select
                id="board-task-detail-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                data-task-detail-priority=""
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
              <label className={labelClass} htmlFor="board-task-detail-status">
                {cf.status}
              </label>
              <select
                id="board-task-detail-status"
                value={statusValue}
                onChange={(event) => setStatus(event.target.value)}
                data-task-detail-status=""
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

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="board-task-detail-assignee">
                {cf.assignedTo}
              </label>
              <select
                id="board-task-detail-assignee"
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
                data-task-detail-assignee=""
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

            <div>
              <label className={labelClass} htmlFor="board-task-detail-due">
                {cf.dueDate}
              </label>
              <input
                id="board-task-detail-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                data-task-detail-due=""
                className={fieldClass}
              />
            </div>
          </div>
        </div>

        {formError ? (
          <p
            className="mt-3 text-[12px] font-medium text-[var(--color-danger)]"
            data-task-detail-error=""
          >
            {formError}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            data-task-detail-cancel=""
            className="rounded-full px-4 py-2 text-[12.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] disabled:opacity-50"
          >
            {detail.cancel}
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            data-task-detail-save=""
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-action)] px-4 py-2 text-[12.5px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiEdit2 size={13} className="pointer-events-none" />
            <span className="pointer-events-none">{saving ? dt.saving : detail.save}</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Rendered into <body>: keeps a `fixed` popup free of any parent transform.
  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
