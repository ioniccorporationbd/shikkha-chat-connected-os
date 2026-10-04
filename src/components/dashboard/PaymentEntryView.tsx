"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiActivity,
  FiArrowLeft,
  FiCheckCircle,
  FiChevronRight,
  FiCreditCard,
  FiFileText,
  FiRefreshCw,
  FiUserCheck,
  FiX,
} from "react-icons/fi";

import { ApiError } from "@/lib/api/http";
import { fetchPaymentDetails, fetchPayments } from "@/lib/payment-entry/api";
import { formatAmount, formatDate } from "@/lib/payment-entry/format";
import { paymentEntryCopyFor, type PaymentEntryCopy } from "@/lib/payment-entry/messages";
import type {
  PaymentEntryDetails,
  PaymentEntryListPayload,
  PaymentEntryReference,
  PaymentEntryRow,
  PaymentEntryStatusKey,
} from "@/lib/payment-entry/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { toast } from "@/lib/ui/toast";

const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]";
const CARD_SHADOW =
  "shadow-[0_18px_44px_-26px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";

interface PaymentEntryViewProps {
  onBack?: () => void;
}

/** A status chip derived from the real ERPNext Payment Entry fields. */
function StatusBadge({
  status,
  copy,
}: {
  status: PaymentEntryStatusKey | string;
  copy: PaymentEntryCopy;
}) {
  const map: Record<PaymentEntryStatusKey, string> = {
    submitted:
      "border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] text-[var(--color-primary)]",
    reconciled:
      "border border-[color-mix(in_srgb,var(--color-success)_32%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-white))] text-[var(--color-success)]",
    received:
      "border border-[color-mix(in_srgb,var(--color-success)_32%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-white))] text-[var(--color-success)]",
    paid: "border border-[color-mix(in_srgb,var(--color-success)_40%,transparent)] bg-[var(--color-success)] text-[var(--color-white)]",
    draft:
      "border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]",
    cancelled:
      "border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-white))] text-[var(--color-danger-strong)]",
  };

  // The label comes straight from the document's own `status` field (e.g.
  // "Draft", "Submitted", "Reconciled"): a known state gets the localised
  // label + colour, anything else is shown exactly as the ERP returned it.
  const raw = String(status || "").trim();
  const lower = raw.toLowerCase() as PaymentEntryStatusKey;
  const known = (Object.keys(map) as PaymentEntryStatusKey[]).includes(lower);
  const key: PaymentEntryStatusKey = known ? lower : "submitted";
  const label = known ? copy.statuses[key] ?? raw : raw || "—";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${map[key]}`}>
      <span className="text-[11px] font-semibold">{label}</span>
    </span>
  );
}

function paymentTypeLabel(row: PaymentEntryRow, copy: PaymentEntryCopy): string {
  const key = String(row.payment_type || "").trim();
  return copy.paymentTypes[key] || key || "—";
}

/**
 * The customer Payment Entry history.
 *
 * Every figure comes from the ERP, scoped to the logged-in customer: the list,
 * the summary and the details are all filtered server-side (`party_type =
 * "Customer"`, `party = current customer`), so the browser can never see another
 * customer's payments. Draft and Submitted receipts are shown; Cancelled entries
 * are never returned.
 */
export default function PaymentEntryView({ onBack }: PaymentEntryViewProps) {
  const { language } = useLanguage();
  const copy = paymentEntryCopyFor(language);

  const [data, setData] = useState<PaymentEntryListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [expired, setExpired] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [detailName, setDetailName] = useState<string | null>(null);
  const [detail, setDetail] = useState<PaymentEntryDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const load = useCallback(async () => {
    try {
      const payload = await fetchPayments(language);
      setData(payload);
      setLoadError("");
      setPermissionDenied(false);
      setExpired(false);
    } catch (error) {
      const err = error as ApiError;
      // Requirement: a portal failure must be visible in the browser console.
      console.error("[payment-entry] list load failed", {
        code: err?.code ?? "unknown",
        message: err?.message ?? String(error),
      });
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
      // Never open a details call for a blank name - it would 404 and get
      // logged. The list never renders nameless rows (see `payments` below).
      if (!name) return;
      setDetailName(name);
      setDetail(null);
      setDetailError("");
      setDetailLoading(true);
      try {
        const payload = await fetchPaymentDetails(name, language);
        setDetail(payload);
      } catch (error) {
        const err = error as ApiError;
        console.error("[payment-entry] details load failed", {
          name,
          code: err?.code ?? "unknown",
          message: err?.message ?? String(error),
        });
        setDetailError(err?.message || copy.loadFailed);
      } finally {
        setDetailLoading(false);
      }
    },
    [language, copy.loadFailed]
  );

  const closeDetails = useCallback(() => {
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

  // Defensive: a Payment Entry is always named, but never render a row without a
  // name - it would hand React a duplicate `null` key and fire a details call for
  // null. The backend now always requests `name` (see payment_entry.py).
  const payments = (data?.payments ?? []).filter((payment) => Boolean(payment?.name));
  const summary = data?.summary;
  const currency = summary?.currency || payments[0]?.currency || "BDT";

  const summaryCards: { key: string; label: string; value: string; sub?: string }[] = summary
    ? [
        { key: "total", label: copy.summaryTotal, value: String(summary.total) },
        {
          key: "amount",
          label: copy.summaryAmount,
          value: formatAmount(summary.total_amount, currency, language),
        },
        {
          key: "month",
          label: copy.summaryMonth,
          value: String(summary.this_month_count),
          sub: formatAmount(summary.this_month_amount, currency, language),
        },
        {
          key: "latest",
          label: copy.summaryLatest,
          value: summary.latest_payment_date
            ? formatDate(summary.latest_payment_date, language)
            : copy.summaryNone,
        },
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
            <FiCreditCard size={20} />
          </span>

          <div className="min-w-0">
            <h1 className="text-[19px] font-semibold leading-tight sm:text-[21px]">{copy.heading}</h1>
            <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
              {copy.subtitle}
            </p>
          </div>
        </div>

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

      {/* ----------------------------------------------------------- body */}
      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((index) => (
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
            title={copy.noCustomerTitle}
            hint={copy.noCustomerHint}
          />
        ) : data ? (
          <div className="flex flex-col gap-5">
            {/* ------------------------------------------------ summary cards */}
            {summaryCards.length ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
                  <h2 className="text-[15px] font-semibold">{copy.summaryHeading}</h2>
                  <p className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                    {copy.summaryHint}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {summaryCards.map((card) => (
                    <div
                      key={card.key}
                      className="flex flex-col gap-1 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] p-4"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                        {card.label}
                      </span>
                      <span className="text-[22px] font-semibold leading-tight">{card.value}</span>
                      {card.sub ? (
                        <span className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                          {card.sub}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
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

              {payments.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-5 py-10 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]">
                    <FiFileText size={22} />
                  </span>
                  <h3 className="text-[16px] font-semibold">{copy.emptyTitle}</h3>
                  <p className="max-w-[46ch] text-[13px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                    {copy.emptyHint}
                  </p>
                </div>
              ) : (
                <>
                  {/* desktop table */}
                  <div className="hidden overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] md:block">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]">
                        <tr>
                          {[
                            copy.colId,
                            copy.colDate,
                            copy.colType,
                            copy.colAmount,
                            copy.colMode,
                            copy.colStatus,
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
                        {payments.map((payment) => (
                          <tr
                            key={payment.name}
                            className="border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]"
                          >
                            <td className="px-4 py-3 text-[13px] font-semibold">{payment.name}</td>
                            <td className="px-4 py-3 text-[13px]">
                              {formatDate(payment.posting_date, language)}
                            </td>
                            <td className="px-4 py-3 text-[13px]">{paymentTypeLabel(payment, copy)}</td>
                            <td className="px-4 py-3 text-[13px] font-medium">
                              {formatAmount(payment.amount, payment.currency || currency, language)}
                            </td>
                            <td className="px-4 py-3 text-[13px]">{payment.mode_of_payment || "—"}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={payment.display_status} copy={copy} />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => void openDetails(payment.name)}
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
                    {payments.map((payment) => (
                      <PaymentCard
                        key={payment.name}
                        payment={payment}
                        copy={copy}
                        language={language}
                        currency={currency}
                        onOpen={() => void openDetails(payment.name)}
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

/** A compact, mobile-first payment card. */
function PaymentCard({
  payment,
  copy,
  language,
  currency,
  onOpen,
}: {
  payment: PaymentEntryRow;
  copy: PaymentEntryCopy;
  language: string;
  currency: string;
  onOpen: () => void;
}) {
  const code = payment.currency || currency;
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">{payment.name}</p>
          <p className="mt-0.5 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {formatDate(payment.posting_date, language)} · {paymentTypeLabel(payment, copy)}
          </p>
        </div>
        <StatusBadge status={payment.display_status} copy={copy} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
            {copy.colAmount}
          </span>
          <span className="text-[13px] font-semibold">
            {formatAmount(payment.amount, code, language)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
            {copy.colMode}
          </span>
          <span className="text-[13px] font-semibold">{payment.mode_of_payment || "—"}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-1.5 transition hover:border-[var(--color-primary)]"
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

/** The payment details drawer (own payment only — enforced server-side). */
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
  detail: PaymentEntryDetails | null;
  loading: boolean;
  error: string;
  copy: PaymentEntryCopy;
  language: string;
  onClose: () => void;
}) {
  const code = detail?.currency || "BDT";

  const rows: { label: string; value: string }[] = detail
    ? [
        { label: copy.dParty, value: detail.party_name || detail.party || "" },
        { label: copy.dPostingDate, value: formatDate(detail.posting_date, language) },
        {
          label: copy.dPaymentType,
          value: copy.paymentTypes[String(detail.payment_type || "").trim()] || detail.payment_type || "",
        },
        { label: copy.dAmount, value: formatAmount(detail.amount, code, language) },
        { label: copy.dCurrency, value: detail.currency || "" },
        { label: copy.dMode, value: detail.mode_of_payment || "" },
        { label: copy.dReferenceNo, value: detail.reference_no || "" },
        {
          label: copy.dReferenceDate,
          value: detail.reference_date ? formatDate(detail.reference_date, language) : "",
        },
        { label: copy.dCompany, value: detail.company || "" },
      ]
    : [];

  // Extra fields taken from the document itself (paid/received, accounts,
  // allocation, contact). Only shown when the ERP actually returned a value.
  const extraRows: { label: string; value: string }[] = detail
    ? (
        [
          {
            label: copy.dPaidAmount,
            value: Number(detail.paid_amount) ? formatAmount(Number(detail.paid_amount), code, language) : "",
          },
          {
            label: copy.dReceivedAmount,
            value: Number(detail.received_amount) ? formatAmount(Number(detail.received_amount), code, language) : "",
          },
          { label: copy.dPaidFrom, value: detail.paid_from || "" },
          { label: copy.dPaidTo, value: detail.paid_to || "" },
          {
            label: copy.dAllocated,
            value: Number(detail.total_allocated_amount)
              ? formatAmount(Number(detail.total_allocated_amount), code, language)
              : "",
          },
          {
            label: copy.dUnallocated,
            value: Number(detail.unallocated_amount)
              ? formatAmount(Number(detail.unallocated_amount), code, language)
              : "",
          },
          { label: copy.dContactPerson, value: detail.contact_person || "" },
          { label: copy.dContactEmail, value: detail.contact_email || "" },
        ] as { label: string; value: string }[]
      ).filter((row) => row.value)
    : [];

  const allRows = [...rows, ...extraRows];

  const references: PaymentEntryReference[] = detail?.references ?? [];

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
        className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-[26px] border-t border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] p-5 shadow-[0_-30px_70px_-30px_color-mix(in_srgb,var(--color-primary)_75%,transparent)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[86vh] sm:w-[620px] sm:max-w-[92vw] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[26px] sm:border"
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
            <p className="py-6 text-center text-[13px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
              {copy.detailsLoading}
            </p>
          ) : error ? (
            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_6%,var(--color-white))] p-4">
              <p className="text-[13px] font-semibold text-[var(--color-danger-strong)]">
                {copy.loadFailed}
              </p>
              <p className="mt-1 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                {error}
              </p>
            </div>
          ) : detail ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.display_status} copy={copy} />
                {detail.verified ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-success)]">
                    <FiCheckCircle size={13} />
                    {copy.colId}
                  </span>
                ) : null}
              </div>

              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {allRows.map((row) => (
                  <div key={row.label} className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                      {row.label}
                    </dt>
                    <dd className="mt-0.5 break-words text-[13px] font-medium">{row.value || "—"}</dd>
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
                <p className="text-[12px] font-semibold">{copy.referencesHeading}</p>
                {references.length === 0 ? (
                  <p className="mt-2 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                    {copy.referencesEmpty}
                  </p>
                ) : (
                  <div className="mt-2 overflow-x-auto rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]">
                        <tr>
                          {[
                            copy.rDocType,
                            copy.rReference,
                            copy.rDue,
                            copy.rTotal,
                            copy.rOutstanding,
                            copy.rAllocated,
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
                        {references.map((row, index) => (
                          <tr
                            key={index}
                            className="border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]"
                          >
                            <td className="px-3 py-2 text-[12px]">{row.reference_doctype || "—"}</td>
                            <td className="px-3 py-2 text-[12px]">{row.reference_name || "—"}</td>
                            <td className="px-3 py-2 text-[12px]">
                              {row.due_date ? formatDate(String(row.due_date), language) : "—"}
                            </td>
                            <td className="px-3 py-2 text-[12px]">
                              {formatAmount(Number(row.total_amount ?? 0), code, language)}
                            </td>
                            <td className="px-3 py-2 text-[12px]">
                              {formatAmount(Number(row.outstanding_amount ?? 0), code, language)}
                            </td>
                            <td className="px-3 py-2 text-[12px] font-medium">
                              {formatAmount(Number(row.allocated_amount ?? 0), code, language)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** A calm, centred card for the non-happy states (permission, no customer, ...). */
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
