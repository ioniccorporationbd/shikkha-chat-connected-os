"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiBriefcase,
  FiCheckCircle,
  FiCreditCard,
  FiFileText,
  FiGrid,
  FiHash,
  FiHome,
  FiLock,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";

import { statusTone } from "@/lib/payment-entry/status";
import { CLIENT_DASHBOARD_PATH, LOGIN_PATH, PAYMENT_HISTORY_PATH } from "@/lib/auth/session";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { fetchPaymentDetails } from "@/lib/payment-entry/api";
import { formatAmount, formatDate } from "@/lib/payment-entry/format";
import { paymentEntryCopyFor } from "@/lib/payment-entry/messages";
import { paymentSuccessCopyFor } from "@/lib/payment-entry/success-messages";
import type { PaymentEntryDetails } from "@/lib/payment-entry/types";

const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]";
const CARD_SHADOW =
  "shadow-[0_18px_44px_-26px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";

type ErrorKind = "missing" | "not_found" | "not_owner" | "session" | "generic";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: PaymentEntryDetails }
  | { status: "error"; kind: ErrorKind };

/**
 * The dashboard-themed Payment Success page, rendered inside the client shell
 * at `/clientDashboard/payment-entry/success?payment=<PAYMENT_ENTRY_ID>`.
 *
 * The id is the ONLY value trusted from the URL, and only for a lookup: the
 * real details come from the existing `GET /api/payment-entry/[name]` proxy,
 * which delegates ownership to the ERP (`party_type` + `party` must be the
 * signed-in customer). A name picked off the URL can therefore never open
 * someone else's payment. Because the id lives in the query string and the
 * details are re-fetched on mount, the page survives a browser refresh.
 */
export default function PaymentSuccessView({ onBack }: { onBack?: () => void }) {
  const { language } = useLanguage();
  const copy = paymentSuccessCopyFor(language);
  const peCopy = paymentEntryCopyFor(language);
  const router = useRouter();

  const name = (useSearchParams().get("payment") || "").trim();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(
    async (id: string) => {
      try {
        const details = await fetchPaymentDetails(id, language);
        setState({ status: "ready", data: details });
      } catch (error) {
        const err = error as { code?: string; status?: number };
        if (err?.status === 401) {
          setState({ status: "error", kind: "session" });
        } else if (err?.code === "not_owner" || err?.status === 403) {
          setState({ status: "error", kind: "not_owner" });
        } else if (err?.status === 404 || err?.code === "not_found") {
          setState({ status: "error", kind: "not_found" });
        } else {
          setState({ status: "error", kind: "generic" });
        }
      }
    },
    [language]
  );

  // Fetch whenever the id (from the URL) or the language changes. The empty-id
  // case is rendered directly, so this effect never fires a stray load.
  useEffect(() => {
    if (!name) return;
    // Defer the call out of the synchronous effect body — the same pattern the
    // Payment Entry list uses — so the fetch's setState can't cause a cascading
    // render, and drop the result if the id changed or we unmounted.
    let active = true;
    queueMicrotask(() => {
      if (active) void load(name);
    });
    return () => {
      active = false;
    };
  }, [name, load]);

  // Event-handler reset (not an effect): flip back to the skeleton, then refetch.
  const retry = useCallback(() => {
    if (!name) return;
    setState({ status: "loading" });
    void load(name);
  }, [name, load]);

  const goPaymentEntry = useCallback(() => {
    if (onBack) onBack();
    else router.push(PAYMENT_HISTORY_PATH);
  }, [onBack, router]);

  return (
    <section className="flex flex-col gap-4">
      {/* ------------------------------------------------------- breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1">
        <Link href={CLIENT_DASHBOARD_PATH} className="transition hover:text-[var(--color-action)]">
          <span className="text-[12.5px] font-medium text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
            {copy.crumbDashboard}
          </span>
        </Link>
        <span aria-hidden className="text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_38%,transparent)]">
          ›
        </span>
        <Link href={PAYMENT_HISTORY_PATH} className="transition hover:text-[var(--color-action)]">
          <span className="text-[12.5px] font-medium text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
            {copy.crumbPaymentEntry}
          </span>
        </Link>
        <span aria-hidden className="text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_38%,transparent)]">
          ›
        </span>
        <span aria-current="page" className="text-[12.5px] font-semibold text-[var(--color-primary)]">
          {copy.crumbSuccess}
        </span>
      </nav>

      {!name ? (
        <ErrorCard
          kind="missing"
          copy={copy}
          onRetry={goPaymentEntry}
          onPaymentEntry={goPaymentEntry}
          onSignIn={() => router.push(LOGIN_PATH)}
          cardBorder={CARD_BORDER}
          cardShadow={CARD_SHADOW}
        />
      ) : state.status === "loading" ? (
        <LoadingBlocks title={copy.loadingTitle} hint={copy.loadingHint} cardBorder={CARD_BORDER} />
      ) : state.status === "error" ? (
        <ErrorCard
          kind={state.kind}
          copy={copy}
          onRetry={retry}
          onPaymentEntry={goPaymentEntry}
          onSignIn={() => router.push(LOGIN_PATH)}
          cardBorder={CARD_BORDER}
          cardShadow={CARD_SHADOW}
        />
      ) : (
        <SuccessBody
          data={state.data}
          language={language}
          copy={copy}
          peCopy={peCopy}
          cardBorder={CARD_BORDER}
          cardShadow={CARD_SHADOW}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ ready */

function SuccessBody({
  data,
  language,
  copy,
  peCopy,
  cardBorder,
  cardShadow,
}: {
  data: PaymentEntryDetails;
  language: string;
  copy: ReturnType<typeof paymentSuccessCopyFor>;
  peCopy: ReturnType<typeof paymentEntryCopyFor>;
  cardBorder: string;
  cardShadow: string;
}) {
  const key = String(data.display_status || "");
  const tone = statusTone(key);
  const statusLabel = peCopy.statuses[key as keyof typeof peCopy.statuses] ?? data.display_status;
  const isDraft = key === "draft";
  const amount = formatAmount(data.amount ?? 0, data.currency || "BDT", language);
  const method = data.mode_of_payment || "";
  const typeLabel = data.payment_type ? peCopy.paymentTypes[data.payment_type] ?? data.payment_type : "";
  const date = formatDate(data.posting_date, language);
  const customer = data.party_name || data.party || "";
  const referenceNo = data.reference_no || "";
  const referenceDate = referenceNo ? formatDate(data.reference_date, language) : "";
  const bankTo = data.paid_to || "";
  const bankFrom = data.paid_from || "";
  const remark = (data.remark || "").trim();
  const references = data.references ?? [];
  const hasBank = Boolean(bankTo || bankFrom);

  return (
    <>
      {/* --------------------------------------------------------- hero */}
      <section className={`overflow-hidden rounded-[26px] border ${cardBorder} bg-[var(--color-white)] ${cardShadow}`}>
        <div className="flex flex-col gap-4 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-success)_14%,var(--color-white))_0%,var(--color-white)_62%)] p-5 sm:flex-row sm:items-start sm:p-6">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--color-success)_16%,var(--color-white))] text-[var(--color-success)]">
            <FiCheckCircle size={28} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
              {copy.heroEyebrow}
            </p>
            <h1 className="mt-1 text-[20px] font-bold leading-tight tracking-[-0.01em] sm:text-[23px]">
              {copy.heroTitle}
            </h1>
            <p className="mt-1.5 max-w-[56ch] text-[12.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
              {isDraft ? copy.heroBodyDraft : copy.heroBodyRecorded}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{ backgroundColor: `color-mix(in srgb, ${tone} 15%, var(--color-white))` }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: tone }}>
                  {statusLabel}
                </span>
              </span>

              {isDraft ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))] px-2.5 py-1">
                  <span className="text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_74%,transparent)]">
                    {copy.draftNote}
                  </span>
                </span>
              ) : null}

              {data.verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-white))] px-2.5 py-1">
                  <span className="text-[11px] font-semibold text-[var(--color-success)]">
                    {copy.verifiedLabel}
                  </span>
                </span>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 text-left sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
              {copy.amountLabel}
            </p>
            <p className="mt-0.5 text-[24px] font-black tracking-[-0.02em] tabular-nums sm:text-[27px]">
              {amount}
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- payment card */}
      <SectionCard title={copy.sectionPayment} icon={<FiCreditCard size={16} />} cardBorder={cardBorder} cardShadow={cardShadow}>
        <dl className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
          <InfoRow label={copy.idLabel} value={data.name} mono icon={<FiHash size={13} />} />
          <InfoRow label={copy.statusLabel} value={statusLabel ?? ""} />
          <InfoRow label={copy.amountLabel} value={`${amount} (${(data.currency || "BDT").toUpperCase()})`} />
          {method ? <InfoRow label={copy.methodLabel} value={method} /> : null}
          {typeLabel ? <InfoRow label={copy.typeLabel} value={typeLabel} /> : null}
          {date ? <InfoRow label={copy.dateLabel} value={date} /> : null}
          {customer ? <InfoRow label={copy.customerLabel} value={customer} icon={<FiUser size={13} />} /> : null}
          {data.company ? <InfoRow label={copy.companyLabel} value={data.company} icon={<FiBriefcase size={13} />} /> : null}
        </dl>
      </SectionCard>

      {/* -------------------------------------------- reference / bank card */}
      {referenceNo || hasBank ? (
        <SectionCard
          title={hasBank ? copy.sectionBank : copy.sectionReference}
          icon={<FiFileText size={16} />}
          cardBorder={cardBorder}
          cardShadow={cardShadow}
        >
          <dl className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
            {referenceNo ? <InfoRow label={copy.referenceNoLabel} value={referenceNo} mono /> : null}
            {referenceDate ? <InfoRow label={copy.referenceDateLabel} value={referenceDate} /> : null}
            {bankTo ? <InfoRow label={copy.bankToLabel} value={bankTo} /> : null}
            {bankFrom ? <InfoRow label={copy.bankFromLabel} value={bankFrom} /> : null}
          </dl>
        </SectionCard>
      ) : null}

      {/* ------------------------------------------------------ remark card */}
      <SectionCard title={copy.sectionMore} icon={<FiFileText size={16} />} cardBorder={cardBorder} cardShadow={cardShadow}>
        <p className="text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_78%,transparent)]">
          {remark || copy.remarkEmpty}
        </p>
      </SectionCard>

      {/* ------------------------------------------------------ references */}
      <SectionCard title={copy.referencesHeading} icon={<FiFileText size={16} />} cardBorder={cardBorder} cardShadow={cardShadow}>
        {references.length ? (
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                  <th className="px-2 pb-2">{copy.rDocType}</th>
                  <th className="px-2 pb-2">{copy.rReference}</th>
                  <th className="px-2 pb-2 text-right">{copy.rAllocated}</th>
                </tr>
              </thead>
              <tbody>
                {references.map((ref, index) => (
                  <tr
                    key={`${ref.reference_doctype || "ref"}-${ref.reference_name || index}`}
                    className="border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]"
                  >
                    <td className="px-2 py-2.5 text-[12.5px]">{ref.reference_doctype || "—"}</td>
                    <td className="px-2 py-2.5 text-[12.5px] font-medium">{ref.reference_name || "—"}</td>
                    <td className="px-2 py-2.5 text-right text-[12.5px] tabular-nums">
                      {typeof ref.allocated_amount === "number"
                        ? formatAmount(ref.allocated_amount, data.currency || "BDT", language)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[13px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.referencesEmpty}
          </p>
        )}
      </SectionCard>

      {/* ---------------------------------------------------------- actions */}
      <section className={`rounded-[26px] border ${cardBorder} bg-[var(--color-white)] p-5 ${cardShadow} sm:p-6`}>
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
          {copy.actionsHeading}
        </h2>
        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <Link
            href={PAYMENT_HISTORY_PATH}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-action)_80%,transparent)] transition hover:-translate-y-0.5 hover:bg-[var(--color-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] sm:w-auto"
          >
            <FiCreditCard size={16} className="text-[var(--color-white)]" />
            <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.actionPayAgain}</span>
          </Link>

          <Link
            href={CLIENT_DASHBOARD_PATH}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:-translate-y-0.5 hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] sm:w-auto"
          >
            <FiGrid size={16} className="text-[var(--color-primary)]" />
            <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.actionDashboard}</span>
          </Link>

          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 transition hover:bg-[var(--color-action-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] sm:w-auto"
          >
            <FiHome size={16} className="text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]" />
            <span className="text-[13px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
              {copy.actionHome}
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------ error state */

function ErrorCard({
  kind,
  copy,
  onRetry,
  onPaymentEntry,
  onSignIn,
  cardBorder,
  cardShadow,
}: {
  kind: ErrorKind;
  copy: ReturnType<typeof paymentSuccessCopyFor>;
  onRetry: () => void;
  onPaymentEntry: () => void;
  onSignIn: () => void;
  cardBorder: string;
  cardShadow: string;
}) {
  const title =
    kind === "missing"
      ? copy.errorMissingTitle
      : kind === "not_found"
        ? copy.errorNotFoundTitle
        : kind === "not_owner"
          ? copy.errorNotOwnerTitle
          : kind === "session"
            ? copy.errorSessionTitle
            : copy.errorTitle;

  const hint =
    kind === "missing"
      ? copy.errorMissingHint
      : kind === "not_found"
        ? copy.errorNotFoundHint
        : kind === "not_owner"
          ? copy.errorNotOwnerHint
          : kind === "session"
            ? copy.errorSessionHint
            : copy.errorGenericHint;

  return (
    <section className={`rounded-[26px] border ${cardBorder} bg-[var(--color-white)] p-6 ${cardShadow} sm:p-8`}>
      <div className="mx-auto flex max-w-[52ch] flex-col items-center gap-3 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
          {kind === "session" ? <FiLock size={24} /> : <FiAlertTriangle size={24} />}
        </span>
        <h1 className="text-[17px] font-bold leading-tight">{title}</h1>
        <p className="text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
          {hint}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2.5">
          {kind === "session" ? (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 transition hover:bg-[var(--color-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
            >
              <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.signInAgain}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 transition hover:bg-[var(--color-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
            >
              <FiRefreshCw size={15} className="text-[var(--color-white)]" />
              <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.retry}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onPaymentEntry}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
          >
            <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.backToPaymentEntry}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- loading */

function LoadingBlocks({ title, hint, cardBorder }: { title: string; hint: string; cardBorder: string }) {
  return (
    <section className={`rounded-[26px] border ${cardBorder} bg-[var(--color-white)] p-5 sm:p-6`}>
      <p className="text-[14px] font-semibold">{title}</p>
      <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">{hint}</p>
      <div className="mt-4 flex flex-col gap-3">
        <div className="h-[108px] animate-pulse rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-[92px] animate-pulse rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]" />
          <div className="h-[92px] animate-pulse rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]" />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- helpers */

function SectionCard({
  title,
  icon,
  children,
  cardBorder,
  cardShadow,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  cardBorder: string;
  cardShadow: string;
}) {
  return (
    <section className={`rounded-[26px] border ${cardBorder} bg-[var(--color-white)] p-5 ${cardShadow} sm:p-6`}>
      <div className="flex items-center gap-2">
        {icon ? <span className="text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">{icon}</span> : null}
        <h2 className="text-[14px] font-semibold">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
        {icon}
        {label}
      </dt>
      <dd
        className={`mt-0.5 break-words text-[13px] font-medium text-[var(--color-primary)] ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}
