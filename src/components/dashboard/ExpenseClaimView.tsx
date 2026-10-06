"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiActivity,
  FiArrowLeft,
  FiCheckCircle,
  FiChevronRight,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiUserCheck,
  FiX,
} from "react-icons/fi";

import { ApiError } from "@/lib/api/http";
import { fetchExpenseClaimDetails, fetchExpenseClaims } from "@/lib/expense-claim/api";
import { formatAmount, formatDate } from "@/lib/expense-claim/format";
import { expenseClaimCopyFor, type ExpenseClaimCopy } from "@/lib/expense-claim/messages";
import type {
  ExpenseClaimDetails,
  ExpenseClaimListPayload,
  ExpenseClaimRow,
  ExpenseClaimStatusKey,
} from "@/lib/expense-claim/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { toast } from "@/lib/ui/toast";

const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]";
const CARD_SHADOW =
  "shadow-[0_18px_44px_-26px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";

/** The chip colours for each known, backend-derived status key. */
const STATUS_BADGE_CLS: Record<ExpenseClaimStatusKey, string> = {
  draft: "border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))] text-[var(--color-primary)]",
  submitted:
    "border border-[color-mix(in_srgb,#b45309_28%,transparent)] bg-[color-mix(in_srgb,#f59e0b_14%,var(--color-white))] text-[#92400e]",
  approved:
    "border border-[color-mix(in_srgb,var(--color-success)_32%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-white))] text-[var(--color-success)]",
  rejected:
    "border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-white))] text-[var(--color-danger-strong)]",
  paid: "border border-[color-mix(in_srgb,var(--color-success)_40%,transparent)] bg-[var(--color-success)] text-[var(--color-white)]",
  cancelled:
    "border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)]",
};

/** Neutral chip used when a key is unknown. */
const STATUS_BADGE_UNKNOWN_CLS =
  "border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)]";

/**
 * The human label for a status key. Known ERPNext states get a translation;
 * anything else falls back to the document's own status text (never invented).
 */
function statusLabel(status: string, raw: string, copy: ExpenseClaimCopy): string {
  switch (status) {
    case "draft":
      return copy.statusDraft;
    case "submitted":
      return copy.statusSubmitted;
    case "approved":
      return copy.statusApproved;
    case "rejected":
      return copy.statusRejected;
    case "paid":
      return copy.statusPaid;
    case "cancelled":
      return copy.statusCancelled;
    default:
      return raw && raw.trim() ? raw : copy.statusSubmitted;
  }
}

interface ExpenseClaimViewProps {
  onBack?: () => void;
  /** Navigate to the New Expense Claim form (`/userDashboard/expense-claim/new`). */
  onNew?: () => void;
}

/** A status chip derived from the real ERPNext claim fields. */
function StatusBadge({
  status,
  raw,
  copy,
}: {
  /** Backend-derived key (draft/submitted/approved/rejected/paid/cancelled). */
  status: string;
  /** The document's own status text — shown verbatim when the key is unknown. */
  raw?: string;
  copy: ExpenseClaimCopy;
}) {
  const known = status in STATUS_BADGE_CLS;
  const cls = known ? STATUS_BADGE_CLS[status as ExpenseClaimStatusKey] : STATUS_BADGE_UNKNOWN_CLS;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${cls}`}>
      <span className="text-[11px] font-semibold">{statusLabel(status, raw ?? "", copy)}</span>
    </span>
  );
}

/** The Paid / Unpaid chip, straight from the ERP's `is_paid` field. */
function PaidBadge({ paid, copy }: { paid: boolean; copy: ExpenseClaimCopy }) {
  return (
    <span
      className={
        paid
          ? "inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-success)_32%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_10%,var(--color-white))] px-2.5 py-0.5"
          : "inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-2.5 py-0.5"
      }
    >
      <span
        className={
          paid
            ? "text-[11px] font-semibold text-[var(--color-success)]"
            : "text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)]"
        }
      >
        {paid ? copy.paidLabel : copy.unpaidLabel}
      </span>
    </span>
  );
}

/**
 * The Employee Expense Claim list.
 *
 * Every figure comes from the ERP, scoped to the logged-in employee: the list,
 * the summary and the details are all filtered server-side, so the browser can
 * never see another employee's claims.
 */
export default function ExpenseClaimView({ onBack, onNew }: ExpenseClaimViewProps) {
  const { language } = useLanguage();
  const copy = expenseClaimCopyFor(language);

  const [data, setData] = useState<ExpenseClaimListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [expired, setExpired] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [detailName, setDetailName] = useState<string | null>(null);
  const [detail, setDetail] = useState<ExpenseClaimDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  /** The claim currently being fetched/shown — blocks duplicate fetches. */
  const detailInFlightRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const payload = await fetchExpenseClaims(language);
      setData(payload);
      setLoadError("");
      setPermissionDenied(false);
      setExpired(false);
    } catch (error) {
      const err = error as ApiError;
      if (err?.code === "not_authenticated") {
        setExpired(true);
      } else if (err?.code === "not_permitted") {
        setPermissionDenied(true);
        setData(null);
      } else {
        setLoadError(err?.message || copy.loadFailed);
      }
    } finally {
      setLoading(false);
    }
  }, [language, copy.loadFailed]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await load();
      toast.success(copy.refreshed);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, load, copy.refreshed]);

  const openDetails = useCallback(
    async (name: string) => {
      // Defensive: never open a nameless row. A repeat click on the same claim
      // (while it is in flight or already shown) is also dropped.
      if (!name) return;
      if (detailInFlightRef.current === name) return;
      detailInFlightRef.current = name;
      setDetailName(name);
      setDetail(null);
      setDetailError("");
      setDetailLoading(true);
      try {
        const payload = await fetchExpenseClaimDetails(name, language);
        setDetail(payload);
      } catch (error) {
        detailInFlightRef.current = null;
        setDetailError((error as ApiError)?.message || copy.detailsFailed);
        toast.error(copy.detailsFailed);
      } finally {
        setDetailLoading(false);
      }
    },
    [language, copy.detailsFailed]
  );

  const closeDetails = useCallback(() => {
    detailInFlightRef.current = null;
    setDetailName(null);
    setDetail(null);
    setDetailError("");
  }, []);

  useEffect(() => {
    if (!detailName) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDetails();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailName, closeDetails]);

  // Guard: never render a row without a real document name (a nameless row would
  // show no id and raise React null/duplicate key warnings).
  const claims = (data?.claims ?? []).filter((claim) => Boolean(claim?.name));
  const summary = data?.summary;
  const currency = summary?.currency || claims[0]?.currency || "BDT";

  const summaryCards: { key: string; label: string; value: string }[] = summary
    ? [
        { key: "total", label: copy.summaryTotal, value: String(summary.total) },
        { key: "draft", label: copy.summaryDraft, value: String(summary.draft) },
        { key: "pending", label: copy.summaryPending, value: String(summary.pending) },
        { key: "approved", label: copy.summaryApproved, value: String(summary.approved) },
        { key: "paid", label: copy.summaryPaid, value: String(summary.paid) },
      ]
    : [];

  return (
    <section
      className={`overflow-hidden rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] ${CARD_SHADOW}`}
    >
      {/* ---------------------------------------------------------- header */}
      <div className="flex flex-col gap-4 border-b border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-secondary)_20%,var(--color-white))_0%,var(--color-white)_70%)] p-5 sm:flex-row sm:items-center sm:gap-3 sm:p-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)] shadow-[0_14px_30px_-16px_color-mix(in_srgb,var(--color-primary)_85%,transparent)]">
            <FiFileText size={20} />
          </span>

          <div className="min-w-0">
            <h1 className="text-[19px] font-semibold leading-tight sm:text-[21px]">{copy.heading}</h1>
            <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
              {copy.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {onNew ? (
            <button
              type="button"
              onClick={onNew}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-action)_85%,transparent)] transition hover:-translate-y-0.5 hover:bg-[var(--color-action-hover)]"
            >
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]">
                <FiPlus size={15} />
                {copy.newClaim}
              </span>
            </button>
          ) : null}

          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:border-[var(--color-primary)]"
            >
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-primary)]">
                <FiArrowLeft size={15} />
                {copy.back}
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {/* ----------------------------------------------------------- body */}
      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[0, 1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="h-[96px] animate-pulse rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
                />
              ))}
            </div>
            <div className="h-[220px] animate-pulse rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]" />
            <p className="text-center text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
              {copy.loading}
            </p>
          </div>
        ) : expired ? (
          <CalmState
            icon={<FiUserCheck size={22} />}
            title={copy.sessionExpiredTitle}
            hint={copy.loadFailed}
            action={
              <a
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 transition hover:opacity-90"
              >
                <span className="text-[13px] font-semibold text-[var(--color-white)]">
                  {copy.signInAgain}
                </span>
              </a>
            }
          />
        ) : permissionDenied ? (
          <CalmState
            icon={<FiUserCheck size={22} />}
            title={copy.permissionTitle}
            hint={copy.permissionHint}
            action={
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setPermissionDenied(false);
                  void load().finally(() => setLoading(false));
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:border-[var(--color-primary)]"
              >
                <span className="text-[13px] font-semibold text-[var(--color-primary)]">
                  {copy.retry}
                </span>
              </button>
            }
          />
        ) : loadError ? (
          <CalmState
            icon={<FiActivity size={22} />}
            title={copy.loadFailed}
            hint={loadError}
            action={
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setLoadError("");
                  void load().finally(() => setLoading(false));
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 transition hover:opacity-90"
              >
                <span className="text-[13px] font-semibold text-[var(--color-white)]">
                  {copy.retry}
                </span>
              </button>
            }
          />
        ) : data && !data.linked ? (
          <CalmState
            icon={<FiUserCheck size={22} />}
            title={copy.noEmployeeTitle}
            hint={copy.noEmployeeHint}
          />
        ) : data ? (
          <div className="flex flex-col gap-5">
            {/* ------------------------------------------------ summary cards */}
            {summaryCards.length ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
                  <h2 className="text-[15px] font-semibold">{copy.summaryHeading}</h2>
                  <p className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                    {copy.summarySiteScope}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {summaryCards.map((card) => (
                    <div
                      key={card.key}
                      className="flex flex-col gap-1 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] p-4"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                        {card.label}
                      </span>
                      <span className="text-[22px] font-semibold leading-tight">{card.value}</span>
                    </div>
                  ))}
                </div>

                {summary ? (
                  <div className="grid gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] p-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                        {copy.colClaimed}
                      </span>
                      <span className="text-[15px] font-semibold">
                        {formatAmount(summary.total_claimed_amount, currency, language)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                        {copy.colSanctioned}
                      </span>
                      <span className="text-[15px] font-semibold">
                        {formatAmount(summary.total_sanctioned_amount, currency, language)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                        {copy.summaryPaid}
                      </span>
                      <span className="text-[15px] font-semibold">
                        {formatAmount(summary.total_amount_reimbursed, currency, language)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* --------------------------------------------------------- list */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
                <h2 className="text-[15px] font-semibold">{copy.listHeading}</h2>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-2 transition hover:border-[var(--color-primary)] disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--color-primary)]">
                    <FiRefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? copy.refreshing : copy.refresh}
                  </span>
                </button>
              </div>

              {claims.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-5 py-10 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]">
                    <FiFileText size={22} />
                  </span>
                  <h3 className="text-[16px] font-semibold">{copy.emptyTitle}</h3>
                  <p className="max-w-[46ch] text-[13px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                    {copy.emptyHint}
                  </p>
                  {onNew ? (
                    <button
                      type="button"
                      onClick={onNew}
                      className="mt-1 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 transition hover:bg-[var(--color-action-hover)]"
                    >
                      <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]">
                        <FiPlus size={15} />
                        {copy.emptyCta}
                      </span>
                    </button>
                  ) : null}
                </div>
              ) : (
                <>
                  {/* desktop table */}
                  <div className="hidden overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] md:block">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]">
                        <tr>
                          {[
                            copy.colSl,
                            copy.colId,
                            copy.colDate,
                            copy.colClaimed,
                            copy.colSanctioned,
                            copy.colStatus,
                            copy.colPaid,
                            copy.colAction,
                          ].map((heading) => (
                            <th
                              key={heading}
                              className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {claims.map((claim, index) => (
                          <tr
                            key={claim.name}
                            className="border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]"
                          >
                            <td className="px-4 py-3 text-[13px] font-medium text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 text-[13px] font-semibold">{claim.name}</td>
                            <td className="px-4 py-3 text-[13px]">
                              {formatDate(claim.posting_date, language)}
                            </td>
                            <td className="px-4 py-3 text-[13px] font-medium">
                              {formatAmount(claim.total_claimed_amount, claim.currency || currency, language)}
                            </td>
                            <td className="px-4 py-3 text-[13px]">
                              {formatAmount(claim.total_sanctioned_amount, claim.currency || currency, language)}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge
                                status={claim.display_status}
                                raw={claim.status || claim.approval_status}
                                copy={copy}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <PaidBadge paid={claim.is_paid} copy={copy} />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => void openDetails(claim.name)}
                                className="inline-flex items-center gap-1.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-1.5 transition hover:border-[var(--color-primary)]"
                              >
                                <span className="text-[12px] font-semibold text-[var(--color-primary)]">
                                  {copy.viewDetails}
                                </span>
                                <FiChevronRight size={14} className="text-[var(--color-primary)]" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* mobile cards */}
                  <div className="flex flex-col gap-3 md:hidden">
                    {claims.map((claim, index) => (
                      <ClaimCard
                        key={claim.name}
                        claim={claim}
                        serial={index + 1}
                        copy={copy}
                        language={language}
                        currency={currency}
                        onOpen={() => void openDetails(claim.name)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {detailName ? (
        <DetailsDialog
          name={detailName}
          detail={detail}
          loading={detailLoading}
          error={detailError}
          copy={copy}
          language={language}
          onClose={closeDetails}
        />
      ) : null}
    </section>
  );
}

/** A compact, mobile-first claim card (SL + claim id, date, amount, status). */
function ClaimCard({
  claim,
  serial,
  copy,
  language,
  currency,
  onOpen,
}: {
  claim: ExpenseClaimRow;
  /** Display-only serial number within the current (sorted) list. */
  serial: number;
  copy: ExpenseClaimCopy;
  language: string;
  currency: string;
  onOpen: () => void;
}) {
  const code = claim.currency || currency;
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))]">
            <span className="text-[11px] font-semibold text-[var(--color-primary)]">{serial}</span>
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">{claim.name}</p>
            <p className="mt-0.5 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
              {formatDate(claim.posting_date, language)}
            </p>
          </div>
        </div>
        <StatusBadge
          status={claim.display_status}
          raw={claim.status || claim.approval_status}
          copy={copy}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
            {copy.colClaimed}
          </span>
          <span className="text-[13px] font-semibold">
            {formatAmount(claim.total_claimed_amount, code, language)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
            {copy.colSanctioned}
          </span>
          <span className="text-[13px] font-semibold">
            {formatAmount(claim.total_sanctioned_amount, code, language)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <PaidBadge paid={claim.is_paid} copy={copy} />
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-1.5 transition hover:border-[var(--color-primary)]"
        >
          <span className="text-[12px] font-semibold text-[var(--color-primary)]">
            {copy.viewDetails}
          </span>
          <FiChevronRight size={14} className="text-[var(--color-primary)]" />
        </button>
      </div>
    </div>
  );
}

/** The claim details drawer (own claim only — enforced server-side). */
function DetailsDialog({
  name,
  detail,
  loading,
  error,
  copy,
  language,
  onClose,
}: {
  name: string;
  detail: ExpenseClaimDetails | null;
  loading: boolean;
  error: string;
  copy: ExpenseClaimCopy;
  language: string;
  onClose: () => void;
}) {
  const code = detail?.currency || "BDT";

  // Only meaningful, non-empty values are listed — a blank field never becomes a
  // dead "—" row.
  const rows: { label: string; value: string }[] = [];
  if (detail) {
    const push = (label: string, value: unknown) => {
      const text = value == null ? "" : String(value).trim();
      if (text) rows.push({ label, value: text });
    };
    push(copy.dEmployee, detail.employee_name || detail.employee);
    push(copy.dEmployeeId, detail.employee);
    push(copy.dPostingDate, formatDate(detail.posting_date, language));
    push(copy.dCompany, detail.company);
    push(copy.dDepartment, detail.department);
    push(copy.dCostCenter, detail.cost_center);
    push(copy.dCurrency, detail.currency);
    push(copy.dStatus, statusLabel(detail.display_status, detail.status || detail.approval_status, copy));
    push(copy.dApproval, detail.approval_status);
    push(copy.dClaimed, formatAmount(detail.total_claimed_amount, code, language));
    push(copy.dSanctioned, formatAmount(detail.total_sanctioned_amount, code, language));
    push(copy.dGrandTotal, formatAmount(detail.grand_total || 0, code, language));
    if (Number(detail.total_amount_reimbursed) > 0) {
      push(copy.dReimbursed, formatAmount(detail.total_amount_reimbursed, code, language));
    }
    push(copy.dApprover, detail.expense_approver);
  }

  return (
    <div className="fixed inset-0 z-[130]" data-no-translate="true">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-[26px] border-t border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] p-5 shadow-[0_-30px_70px_-30px_color-mix(in_srgb,var(--color-primary)_75%,transparent)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[86vh] sm:w-[560px] sm:max-w-[92vw] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[26px] sm:border"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
              {copy.detailsHeading}
            </p>
            <h2 className="mt-1 truncate text-[16px] font-semibold">{name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_20%,var(--color-white))]"
          >
            <span className="text-[var(--color-primary)]">
              <FiX size={16} />
            </span>
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="flex flex-col gap-3 py-1">
              <div className="flex flex-wrap gap-2">
                <div className="h-6 w-24 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))]" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))]" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div
                    key={index}
                    className="h-11 animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
                  />
                ))}
              </div>
              <p className="text-center text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                {copy.detailsLoading}
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_6%,var(--color-white))] p-4">
              <p className="text-[13px] font-semibold text-[var(--color-danger-strong)]">
                {copy.detailsFailed}
              </p>
            </div>
          ) : detail ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={detail.display_status}
                  raw={detail.status || detail.approval_status}
                  copy={copy}
                />
                <PaidBadge paid={detail.is_paid} copy={copy} />
                {detail.verified ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-success)]">
                    <FiCheckCircle size={13} />
                    {copy.colId}
                  </span>
                ) : null}
              </div>

              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {rows.map((row) => (
                  <div key={row.label} className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                      {row.label}
                    </dt>
                    <dd className="mt-0.5 break-words text-[13px] font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>

              {detail.remark ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                    {copy.dRemark}
                  </p>
                  <p className="mt-0.5 text-[13px]">{detail.remark}</p>
                </div>
              ) : null}

              <div>
                <p className="text-[12px] font-semibold">{copy.dExpenses}</p>
                {detail.expenses.length === 0 ? (
                  <p className="mt-2 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                    {copy.emptyHint}
                  </p>
                ) : (
                  <>
                    {/* desktop: table */}
                    <div className="mt-2 hidden overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] md:block">
                      <table className="w-full border-collapse text-left">
                        <thead className="bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]">
                          <tr>
                            {[
                              copy.dExpenseDate,
                              copy.dExpenseType,
                              copy.dDescription,
                              copy.dAmount,
                              copy.dSanctioned,
                            ].map((heading) => (
                              <th
                                key={heading}
                                className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
                              >
                                {heading}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {detail.expenses.map((row, index) => (
                            <tr
                              key={index}
                              className="border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]"
                            >
                              <td className="px-3 py-2 text-[12px]">
                                {formatDate(String(row.expense_date ?? ""), language)}
                              </td>
                              <td className="px-3 py-2 text-[12px]">{row.expense_type ?? ""}</td>
                              <td className="px-3 py-2 text-[12px]">{row.description ?? ""}</td>
                              <td className="px-3 py-2 text-[12px] font-medium">
                                {formatAmount(Number(row.amount ?? 0), code, language)}
                              </td>
                              <td className="px-3 py-2 text-[12px]">
                                {Number(row.sanctioned_amount ?? 0) > 0
                                  ? formatAmount(Number(row.sanctioned_amount ?? 0), code, language)
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* mobile: stacked cards */}
                    <div className="mt-2 flex flex-col gap-2 md:hidden">
                      {detail.expenses.map((row, index) => {
                        const sanctioned = Number(row.sanctioned_amount ?? 0);
                        return (
                          <div
                            key={index}
                            className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[12px] font-semibold">
                                {row.expense_type || "—"}
                              </span>
                              <span className="text-[12px] font-semibold">
                                {formatAmount(Number(row.amount ?? 0), code, language)}
                              </span>
                            </div>
                            <p className="mt-1 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                              {formatDate(String(row.expense_date ?? ""), language)}
                            </p>
                            {row.description ? (
                              <p className="mt-1 text-[12px]">{row.description}</p>
                            ) : null}
                            {sanctioned > 0 ? (
                              <p className="mt-1 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                                {copy.dSanctioned}: {formatAmount(sanctioned, code, language)}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** A calm, centred card for the non-happy states (permission, no employee, ...). */
function CalmState({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-5 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]">
        {icon}
      </span>
      <h2 className="text-[16px] font-semibold">{title}</h2>
      {hint ? (
        <p className="max-w-[46ch] text-[13px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
          {hint}
        </p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
