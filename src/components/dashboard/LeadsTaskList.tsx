"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiInbox,
} from "react-icons/fi";

import { ApiError } from "@/lib/api/http";
import { useReloadHandler } from "@/lib/dashboard/reload-registry";
import { fetchLeadTasks } from "@/lib/leads/api";
import { leadsCopyFor } from "@/lib/leads/messages";
import type { LeadTaskRow, LeadTasksPayload } from "@/lib/leads/types";
import { reportClientError } from "@/lib/log/report-error";

interface LeadsTaskListProps {
  /** Assigned Tasks tab: only tasks whose "Assigned To" is the caller. */
  mine: boolean;
  language: string;
}

type Window = "today" | "week";

/** Status pill colours (CRM Task status → tone). Unknown statuses fall back to slate. */
const STATUS_TONES: Record<string, string> = {
  Open: "bg-[color-mix(in_srgb,#2f9bff_12%,var(--color-white))] text-[#2f9bff]",
  Todo: "bg-[color-mix(in_srgb,#8a94a6_14%,var(--color-white))] text-[#5b6472]",
  Backlog: "bg-[color-mix(in_srgb,#8a94a6_14%,var(--color-white))] text-[#5b6472]",
  "In Progress": "bg-[color-mix(in_srgb,#f59e0b_14%,var(--color-white))] text-[#b9770b]",
  Done: "bg-[color-mix(in_srgb,#22c55e_14%,var(--color-white))] text-[#15803d]",
  Closed: "bg-[color-mix(in_srgb,#22c55e_14%,var(--color-white))] text-[#15803d]",
  Cancelled: "bg-[color-mix(in_srgb,#ef4444_12%,var(--color-white))] text-[#dc2626]",
};

const AVATAR_TINTS = [
  "#7c3aed",
  "#0ea5e9",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#ef4444",
  "#8b5cf6",
  "#22c55e",
];

function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayDiff(fromISO: string, toISO: string): number {
  const a = Date.parse(`${fromISO.slice(0, 10)}T00:00:00`);
  const b = Date.parse(`${toISO.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.POSITIVE_INFINITY;
  return Math.round((b - a) / 86_400_000);
}

function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]!.charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : "";
  return `${first}${last}`.toUpperCase();
}

function avatarTint(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length]!;
}

export default function LeadsTaskList({ mine, language }: LeadsTaskListProps) {
  const copy = useMemo(() => leadsCopyFor(language), [language]);
  const board = copy.tasksBoard;

  const [window, setWindow] = useState<Window>("today");
  const [assignee, setAssignee] = useState("");
  const [taskType, setTaskType] = useState("");

  const [data, setData] = useState<LeadTasksPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const beginReload = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const payload = await fetchLeadTasks({ language, mine });
        if (cancelled) return;
        setData(payload);
        setError(null);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : language === "bn"
              ? "টাস্ক লোড করা যায়নি।"
              : "Could not load tasks.";
        setError(message);
        setLoading(false);
        console.error("[leads:tasks] load failed", err);
        reportClientError({
          scope: "leads:tasks",
          message,
          detail:
            err instanceof ApiError
              ? { status: err.status, code: err.code, tab: mine ? "assigned" : "all" }
              : String(err),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [language, mine, reloadKey]);

  useReloadHandler(() => {
    beginReload();
    setReloadKey((key) => key + 1);
  });

  const today = useMemo(() => isoToday(), []);

  const rows = useMemo(() => {
    const allTasks = data?.tasks ?? [];
    return allTasks.filter((task) => {
      const due = task.due_date ? task.due_date.slice(0, 10) : "";
      const diff = dayDiff(due, today);
      const windowOk =
        window === "today" ? diff === 0 : diff >= 0 && diff <= 6;
      const assigneeOk = !assignee || task.assigned_to === assignee;
      const typeOk = !taskType || task.type === taskType;
      return windowOk && assigneeOk && typeOk;
    });
  }, [data, window, assignee, taskType, today]);

  const summary = data?.summary ?? { today: 0, week: 0, completed_week: 0, overdue: 0 };
  const cards = [
    { key: "today", label: board.summary.today, value: summary.today, icon: FiClock, tone: "text-[#7c3aed]", bg: "bg-[color-mix(in_srgb,#7c3aed_10%,var(--color-white))]" },
    { key: "week", label: board.summary.week, value: summary.week, icon: FiCalendar, tone: "text-[#2f9bff]", bg: "bg-[color-mix(in_srgb,#2f9bff_10%,var(--color-white))]" },
    { key: "completed", label: board.summary.completed, value: summary.completed_week, icon: FiCheckSquare, tone: "text-[#16a34a]", bg: "bg-[color-mix(in_srgb,#22c55e_10%,var(--color-white))]" },
    { key: "overdue", label: board.summary.overdue, value: summary.overdue, icon: FiAlertCircle, tone: "text-[#ef4444]", bg: "bg-[color-mix(in_srgb,#ef4444_10%,var(--color-white))]" },
  ] as const;

  const changeWindow = (next: Window) => {
    if (next === window) return;
    setWindow(next);
  };
  const changeAssignee = (value: string) => setAssignee(value);
  const changeType = (value: string) => setTaskType(value);
  const retry = () => {
    beginReload();
    setReloadKey((key) => key + 1);
  };

  if (loading && !data) {
    return (
      <div className="grid place-items-center py-16" data-leads-tasks-loading="true">
        <span className="animate-pulse text-[13px] font-medium text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
          {board.loading}
        </span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center" data-leads-tasks-error="true">
        <FiAlertCircle size={26} className="text-[var(--color-danger)]" />
        <p className="text-[13.5px] font-semibold text-[var(--color-primary)]">{board.errorTitle}</p>
        <p className="max-w-[46ch] text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">{error}</p>
        <button
          type="button"
          onClick={retry}
          className="rounded-full bg-[var(--color-action)] px-4 py-2 text-[12.5px] font-semibold text-[var(--color-white)]"
        >
          {board.retry}
        </button>
      </div>
    );
  }

  if (data && !data.available) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-14 text-center" data-leads-tasks-unavailable="true">
        <FiInbox size={26} className="text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]" />
        <p className="max-w-[40ch] text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
          {board.unavailable}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5" data-leads-tasks-board="">
      {/* summary cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className={`flex items-center gap-3 rounded-2xl ${card.bg} px-3.5 py-3`}
              data-leads-task-card={card.key}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--color-white)] ${card.tone} shadow-sm`}>
                <Icon size={16} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10.5px] font-medium text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                  {card.label}
                </p>
                <p className="text-[17px] font-bold leading-tight text-[var(--color-primary)]">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* window toggle + filters */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] p-0.5">
          <button
            type="button"
            onClick={() => changeWindow("today")}
            data-leads-window="today"
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
              window === "today"
                ? "bg-[var(--color-action)] text-[var(--color-white)] shadow-sm"
                : "text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]"
            }`}
          >
            {board.window.today} ({summary.today})
          </button>
          <button
            type="button"
            onClick={() => changeWindow("week")}
            data-leads-window="week"
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
              window === "week"
                ? "bg-[var(--color-action)] text-[var(--color-white)] shadow-sm"
                : "text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]"
            }`}
          >
            {board.window.week} ({summary.week})
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:w-[180px]">
            <span className="sr-only">{board.allAssignees}</span>
            <select
              value={assignee}
              onChange={(event) => changeAssignee(event.target.value)}
              data-leads-task-assignee=""
              className="w-full rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] px-3 py-2 text-[12px] text-[var(--color-primary)] outline-none transition focus:border-[color-mix(in_srgb,var(--color-action)_45%,transparent)]"
            >
              <option value="">{board.allAssignees}</option>
              {(data?.assignees ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {data?.has_type ? (
            <label className="sm:w-[180px]">
              <span className="sr-only">{board.allTaskTypes}</span>
              <select
                value={taskType}
                onChange={(event) => changeType(event.target.value)}
                data-leads-task-type=""
                className="w-full rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] px-3 py-2 text-[12px] text-[var(--color-primary)] outline-none transition focus:border-[color-mix(in_srgb,var(--color-action)_45%,transparent)]"
              >
                <option value="">{board.allTaskTypes}</option>
                {(data?.task_types ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>

      {/* table */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] px-6 py-12 text-center" data-leads-tasks-empty="true">
          <FiInbox size={26} className="text-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]" />
          <p className="text-[13px] font-semibold text-[var(--color-primary)]">{board.emptyTitle}</p>
          <p className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">{board.emptyHint}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
          <table className="w-full min-w-[640px] border-collapse text-left" data-leads-tasks-table="">
            <thead>
              <tr className="bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
                <th className="px-3 py-2.5 font-semibold">
                  <span className="sr-only">select</span>
                  <span className="inline-block h-3.5 w-3.5 rounded border border-[color-mix(in_srgb,var(--color-primary)_25%,transparent)]" />
                </th>
                <th className="px-3 py-2.5">{board.columns.task}</th>
                <th className="px-3 py-2.5">{board.columns.lead}</th>
                <th className="px-3 py-2.5">{board.columns.dueDate}</th>
                <th className="px-3 py-2.5">{board.columns.assignedTo}</th>
                <th className="px-3 py-2.5">{board.columns.status}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((task: LeadTaskRow) => {
                const due = task.due_date ? task.due_date.slice(0, 10) : "";
                const isToday = due === today;
                const overdue = due !== "" && dayDiff(due, today) > 0 && !["Done", "Closed", "Cancelled"].includes(task.status);
                const statusLabel = board.statusLabels[task.status] ?? task.status;
                const statusTone =
                  STATUS_TONES[task.status] ??
                  "bg-[color-mix(in_srgb,#8a94a6_14%,var(--color-white))] text-[#5b6472]";
                const assigneeLabel = task.assigned_label || board.unassigned;

                return (
                  <tr key={task.name} className="border-t border-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] align-middle text-[12.5px] text-[var(--color-primary)]" data-leads-task-row={task.name}>
                    <td className="px-3 py-2.5">
                      <span className="inline-block h-3.5 w-3.5 rounded border border-[color-mix(in_srgb,var(--color-primary)_25%,transparent)]" />
                    </td>
                    <td className="px-3 py-2.5 font-medium">{task.title || task.name}</td>
                    <td className="px-3 py-2.5">
                      {task.lead ? (
                        <span className="font-medium text-[#2f9bff]">{task.lead}</span>
                      ) : (
                        <span className="text-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {isToday ? (
                        <span className="font-semibold text-[#ef4444]">{board.today}</span>
                      ) : due ? (
                        <span className={overdue ? "font-semibold text-[#ef4444]" : "text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]"}>
                          {due}
                        </span>
                      ) : (
                        <span className="text-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {task.assigned_to ? (
                        <span className="flex items-center gap-2">
                          <span
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold text-[var(--color-white)]"
                            style={{ backgroundColor: avatarTint(task.assigned_to) }}
                          >
                            {initials(assigneeLabel)}
                          </span>
                          <span className="truncate">{assigneeLabel}</span>
                        </span>
                      ) : (
                        <span className="text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]">{board.unassigned}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone}`}>
                        {statusLabel || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
