"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiEdit2,
  FiLoader,
  FiLock,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";

import { deleteCustomer, fetchCustomerList } from "@/lib/customer/api";
import { customerManagementCopyFor } from "@/lib/customer/management-messages";
import type { CustomerListRow } from "@/lib/customer/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { toast } from "@/lib/ui/toast";

/* ------------------------------------------------------------------ */
/* Layout tokens (mirrors the Create Customer surface)                 */
/* ------------------------------------------------------------------ */

const PAGE = "mx-auto flex w-full max-w-[1080px] flex-col gap-4";

const CARD =
  "rounded-[24px] border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4 shadow-[0_18px_44px_-28px_color-mix(in_srgb,var(--color-primary)_40%,transparent)] sm:p-5";

const HEADER_CARD =
  "relative overflow-hidden rounded-[24px] border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_10%,var(--color-white)),var(--color-white)_58%)] p-4 shadow-[0_22px_50px_-30px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] sm:p-6";

const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] disabled:cursor-not-allowed disabled:opacity-60";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60";

const INPUT_BASE =
  "w-full rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]";

const PERMISSION_HINTS = [
  "permission",
  "not permitted",
  "অনুমতি",
  "not a system user",
  "only system users",
];

function isPermissionRefusal(code: string | undefined, message: string): boolean {
  if (code === "not_permitted" || code === "no_permission") return true;
  const haystack = (message || "").toLowerCase();
  return PERMISSION_HINTS.some((hint) => haystack.includes(hint));
}

/** Frappe returns "YYYY-MM-DD HH:MM:SS" — show just the calendar date. */
function formatDate(value: string | undefined, locale: string): string {
  if (!value) return "";
  const iso = value.replace(" ", "T");
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  try {
    return parsed.toLocaleDateString(locale === "en" ? "en-GB" : "bn-BD", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return value.slice(0, 10);
  }
}

interface CustomerManagementViewProps {
  onBack: () => void;
  onNew: () => void;
  onEdit: (name: string) => void;
  /** Called when the last owned customer is deleted, so the host can switch to the create form. */
  onEmptied?: () => void;
}

export default function CustomerManagementView({ onBack, onNew, onEdit, onEmptied }: CustomerManagementViewProps) {
  const { language } = useLanguage();
  const copy = useMemo(() => customerManagementCopyFor(language), [language]);

  const [rows, setRows] = useState<CustomerListRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<{ code: string; message: string } | null>(null);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CustomerListRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadList = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      try {
        const data = await fetchCustomerList(language);
        const list = data.customers ?? [];
        setRows(list);
        setLoadError(null);
        return list;
      } catch (error) {
        const failure = error as { code?: string; message?: string };
        setLoadError({ code: failure?.code || "error", message: failure?.message || copy.loadFailed });
        return [];
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [language, copy.loadFailed]
  );

  useEffect(() => {
    // Kick the async load off the effect's synchronous path (keeps the body free
    // of setState for react-hooks/set-state-in-effect).
    const timer = setTimeout(() => {
      void loadList("initial");
    }, 0);
    return () => clearTimeout(timer);
  }, [loadList]);

  const filtered = useMemo(() => {
    // A row with no real document id can never be rendered: no nameless row, no
    // duplicate/blank React key (the id is what the backend guarantees).
    const list = (rows ?? []).filter((row) => Boolean(row?.name && String(row.name).trim()));
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((row) =>
      [row.name, row.customer_name, row.mobile_no, row.email_id, row.customer_type, row.customer_group, row.territory]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [rows, query]);

  const total = useMemo(
    () => (rows ?? []).filter((row) => Boolean(row?.name && String(row.name).trim())).length,
    [rows]
  );
  const cell = (value: string | undefined) => (value && String(value).trim() !== "" ? value : copy.notSet);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteTarget.name, language);
      toast.success(copy.deleteSuccess);
      setDeleteTarget(null);
      const remaining = await loadList("refresh");
      // The very last customer is gone -> hand back to the create form.
      if (onEmptied && remaining.length === 0) onEmptied();
    } catch (error) {
      const failure = error as { code?: string; status?: number; message?: string };
      const message = failure?.message || copy.deleteFailed;
      const blocked = failure?.code === "link_exists" || failure?.status === 409 || /linked|lend|transaction/i.test(message);
      toast.error(blocked ? copy.deleteBlocked : message, copy.deleteFailed);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, deleting, language, copy, loadList, onEmptied]);

  const isAuth = loadError?.code === "not_authenticated";
  const isPermission = loadError ? isPermissionRefusal(loadError.code, loadError.message) : false;

  /* ---------------------------------------------------------------- header */

  const header = (
    <header className={HEADER_CARD}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] text-[22px] text-[var(--color-primary)]">
            <FiUsers aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-[19px] font-bold tracking-[-0.01em] text-[var(--color-primary)] sm:text-[22px]">
              {copy.heading}
            </h1>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)] sm:text-[13.5px]">
              {copy.hint}
            </p>
          </div>
        </div>
        <button type="button" onClick={onBack} aria-label={copy.back} className={`${BTN_SECONDARY} shrink-0 px-3`}>
          <FiArrowLeft aria-hidden className="text-[var(--color-primary)]" />
          <span className="hidden text-[13px] font-semibold text-[var(--color-primary)] sm:inline">{copy.back}</span>
        </button>
      </div>
    </header>
  );

  /* ------------------------------------------------------------ states */

  if (loading) {
    return (
      <div className={PAGE}>
        {header}
        <div className={CARD} aria-busy="true">
          <div className="h-6 w-56 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))]" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]" />
            ))}
          </div>
          <span className="sr-only">{copy.loading}</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={PAGE}>
        {header}
        <section className={CARD}>
          <div className="flex flex-col items-start gap-3">
            <span
              className={`grid h-12 w-12 place-items-center rounded-2xl text-[22px] ${
                isPermission
                  ? "bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]"
                  : "bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--color-white))] text-[var(--color-danger-strong)]"
              }`}
            >
              {isPermission ? <FiLock aria-hidden /> : <FiAlertCircle aria-hidden />}
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-[var(--color-primary)]">
                {isPermission ? copy.permissionTitle : isAuth ? copy.sessionExpiredTitle : copy.loadFailed}
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                {isPermission ? copy.permissionHint : loadError.message}
              </p>
            </div>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              {!isPermission ? (
                <button type="button" onClick={() => void loadList("initial")} className={BTN_SECONDARY}>
                  <FiRefreshCw aria-hidden className="text-[var(--color-primary)]" />
                  <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.retry}</span>
                </button>
              ) : null}
              {isAuth ? (
                <a
                  href={`/login?next=${encodeURIComponent(window.location.pathname)}`}
                  className={BTN_PRIMARY}
                >
                  <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.signInAgain}</span>
                </a>
              ) : null}
              <button type="button" onClick={onBack} className={BTN_SECONDARY}>
                <FiArrowLeft aria-hidden className="text-[var(--color-primary)]" />
                <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.back}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* ------------------------------------------------------------- content */

  return (
    <div className={PAGE}>
      {header}

      {/* summary count */}
      <section className={CARD}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)] text-[20px] text-[var(--color-white)]">
              <FiUsers aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-[var(--color-primary)]">{copy.countLabel(total)}</p>
            </div>
          </div>
          <button type="button" onClick={onNew} className={BTN_PRIMARY}>
            <FiPlus aria-hidden className="text-[var(--color-white)]" />
            <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.createNew}</span>
          </button>
        </div>
      </section>

      {/* search */}
      <section className={CARD}>
        <div className="relative">
          <FiSearch
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            aria-label={copy.searchPlaceholder}
            className={`${INPUT_BASE} pl-9`}
          />
        </div>
        <div className="mt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={() => void loadList("refresh")}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1 text-[12px] font-semibold text-[var(--color-primary)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] disabled:opacity-60"
          >
            <FiRefreshCw aria-hidden className={refreshing ? "animate-spin" : ""} />
            {copy.retry}
          </button>
        </div>
      </section>

      {/* list */}
      {filtered.length === 0 ? (
        <section className={CARD}>
          <div className="flex flex-col items-start gap-2">
            <h2 className="text-[15px] font-semibold text-[var(--color-primary)]">
              {total === 0 ? copy.emptyTitle : copy.noResults}
            </h2>
            {total === 0 ? (
              <p className="text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                {copy.emptyHint}
              </p>
            ) : null}
          </div>
        </section>
      ) : (
        <>
          {/* desktop table */}
          <section className={`${CARD} hidden overflow-hidden p-0 lg:block`}>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))]">
                  {[copy.colSl, copy.colId, copy.colName, copy.colType, copy.colGroup, copy.colTerritory, copy.colMobile, copy.colEmail, copy.colCreated, copy.colActions].map(
                    (label, index) => (
                      <th
                        key={label}
                        scope="col"
                        className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] ${
                          index === 9 ? "text-right" : index === 0 ? "w-[60px]" : ""
                        }`}
                      >
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr
                    key={row.name}
                    className="border-b border-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] last:border-0 hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]"
                  >
                    <td className="px-4 py-3 text-[12.5px] font-semibold tabular-nums text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-lg bg-[color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))] px-2.5 py-1 text-[12px] font-bold tabular-nums text-[var(--color-primary)]">
                        {row.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium text-[var(--color-primary)]">
                      {cell(row.customer_name)}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_75%,transparent)]">
                      {cell(row.customer_type)}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_75%,transparent)]">
                      {cell(row.customer_group)}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_75%,transparent)]">
                      {cell(row.territory)}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] tabular-nums text-[color-mix(in_srgb,var(--color-primary)_75%,transparent)]">
                      {cell(row.mobile_no)}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_75%,transparent)]">
                      {cell(row.email_id)}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] tabular-nums text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)]">
                      {formatDate(row.creation, language) || copy.notSet}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(row.name)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-2.5 py-1.5 transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]"
                        >
                          <FiEdit2 aria-hidden className="text-[var(--color-primary)]" size={13} />
                          <span className="text-[12px] font-semibold text-[var(--color-primary)]">{copy.edit}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_28%,transparent)] px-2.5 py-1.5 transition hover:bg-[color-mix(in_srgb,var(--color-danger)_8%,var(--color-white))]"
                        >
                          <FiTrash2 aria-hidden className="text-[var(--color-danger-strong)]" size={13} />
                          <span className="text-[12px] font-semibold text-[var(--color-danger-strong)]">{copy.delete}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* mobile cards */}
          <div className="flex flex-col gap-3 lg:hidden">
            {filtered.map((row, index) => (
              <section key={row.name} className={CARD}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))] text-[11px] font-bold tabular-nums text-[var(--color-primary)]">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                        {copy.colId}
                      </p>
                      <p className="text-[13px] font-bold tabular-nums text-[var(--color-primary)]">{row.name}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-primary)]">
                    {cell(row.customer_type)}
                  </span>
                </div>

                <p className="mt-2 text-[14px] font-semibold text-[var(--color-primary)]">{cell(row.customer_name)}</p>

                <dl className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    [copy.colGroup, cell(row.customer_group)],
                    [copy.colTerritory, cell(row.territory)],
                    [copy.colMobile, cell(row.mobile_no)],
                    [copy.colEmail, cell(row.email_id)],
                    [copy.colCreated, formatDate(row.creation, language) || copy.notSet],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
                        {label}
                      </dt>
                      <dd className="mt-0.5 break-words text-[12.5px] font-medium text-[var(--color-primary)]">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => onEdit(row.name)} className={BTN_SECONDARY}>
                    <FiEdit2 aria-hidden className="text-[var(--color-primary)]" size={14} />
                    <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.edit}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_28%,transparent)] px-4 py-2.5 transition hover:bg-[color-mix(in_srgb,var(--color-danger)_8%,var(--color-white))]"
                  >
                    <FiTrash2 aria-hidden className="text-[var(--color-danger-strong)]" size={14} />
                    <span className="text-[13px] font-semibold text-[var(--color-danger-strong)]">{copy.delete}</span>
                  </button>
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {deleteTarget ? (
        <DeleteConfirm
          title={copy.deleteTitle}
          body={copy.deleteBody(deleteTarget.customer_name || deleteTarget.name)}
          confirmLabel={deleting ? copy.deleting : copy.deleteConfirm}
          cancelLabel={copy.deleteCancel}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Delete confirmation modal                                          */
/* ------------------------------------------------------------------ */

function DeleteConfirm({
  title,
  body,
  confirmLabel,
  cancelLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-[color-mix(in_srgb,var(--color-secondary)_60%,transparent)]"
      />
      <div className="relative w-full max-w-[430px] rounded-[22px] border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] p-5 shadow-[0_34px_72px_-30px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--color-white))] text-[19px] text-[var(--color-danger-strong)]">
            <FiTrash2 aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-[var(--color-primary)]">{title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">{body}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={busy} className={BTN_SECONDARY}>
            <span className="text-[13px] font-semibold text-[var(--color-primary)]">{cancelLabel}</span>
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-danger)] px-4 py-2.5 transition hover:bg-[var(--color-danger-strong)] disabled:opacity-60"
          >
            {busy ? <FiLoader aria-hidden className="animate-spin text-[var(--color-white)]" /> : null}
            <span className="text-[13px] font-semibold text-[var(--color-white)]">{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
