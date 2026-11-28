"use client";

import DashboardSelect from "@/components/dashboard/DashboardSelect";
import StaffPaymentHistoryPanel from "@/components/dashboard/StaffPaymentHistoryPanel";
import { todayLocalIso } from "@/lib/format/datetime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiCreditCard,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";

import { formatAmount } from "@/lib/expense-claim/format";
import { useOverlayPresence } from "@/lib/dashboard/useOverlayPresence";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  createPaymentEntry,
  fetchPaymentEntryFormContext,
  fetchPaymentEntryParties,
} from "@/lib/staff-payment/api";
import type {
  PartyOption,
  PaymentEntryFormContext,
  PaymentType,
  PartyType,
} from "@/lib/staff-payment/types";
import { toast } from "@/lib/ui/toast";
import { reportClientError } from "@/lib/log/report-error";

const CARD =
  "rounded-[22px] border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4 shadow-[0_18px_44px_-28px_color-mix(in_srgb,var(--color-primary)_40%,transparent)] sm:p-5";

const INPUT_BASE =
  "w-full rounded-2xl border bg-[var(--color-white)] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] focus:border-[color-mix(in_srgb,var(--color-action)_50%,transparent)] focus:ring-2 focus:ring-[var(--color-action-ring)] disabled:cursor-not-allowed disabled:bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]";

const LABEL = "text-[12px] font-semibold text-[var(--color-primary)]";
const HELPER = "text-[11.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]";

function borderClass(invalid: boolean): string {
  return invalid
    ? "border-[var(--color-danger)]"
    : "border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]";
}

interface Copy {
  heading: string;
  subtitle: string;
  back: string;
  paymentType: string;
  amount: string;
  amountHint: string;
  postingDate: string;
  partyType: string;
  party: string;
  partyPlaceholder: string;
  partySearching: string;
  partyEmpty: string;
  mode: string;
  modePlaceholder: string;
  fromAccount: string;
  toAccount: string;
  accountPlaceholder: string;
  referenceNo: string;
  referenceNoHint: string;
  referenceDate: string;
  remarks: string;
  remarksHint: string;
  submit: string;
  submitting: string;
  reset: string;
  total: string;
  errAmount: string;
  errParty: string;
  errMode: string;
  errAccounts: string;
  errSameAccount: string;
  successTitle: string;
  successBody: string;
  entryNo: string;
  status: string;
  createAnother: string;
  done: string;
  loadFailed: string;
  retry: string;
  sessionExpired: string;
  signInAgain: string;
  permission: string;
  permissionHint: string;
  draftNote: string;
}

const COPY: Record<"bn" | "en", Copy> = {
  bn: {
    heading: "Payment Entry",
    subtitle: "রিসিভ করুন, পেমেন্ট করুন বা অ্যাকাউন্টের মধ্যে ট্রান্সফার করুন।",
    back: "ফিরে যান",
    paymentType: "Payment Type",
    amount: "পরিমাণ",
    amountHint: "যত টাকা লেনদেন হবে।",
    postingDate: "Posting Date",
    partyType: "Party Type",
    party: "Party",
    partyPlaceholder: "নাম লিখে খুঁজুন…",
    partySearching: "খোঁজা হচ্ছে…",
    partyEmpty: "কোনো ফলাফল নেই।",
    mode: "Mode of Payment",
    modePlaceholder: "নির্বাচন করুন",
    fromAccount: "From Account",
    toAccount: "To Account",
    accountPlaceholder: "অ্যাকাউন্ট নির্বাচন করুন",
    referenceNo: "Reference No.",
    referenceNoHint: "ঐচ্ছিক — ট্রানজেকশন/চেক নম্বর।",
    referenceDate: "Reference Date",
    remarks: "মন্তব্য",
    remarksHint: "ঐচ্ছিক — এই এন্ট্রির জন্য নোট।",
    submit: "সাবমিট করুন",
    submitting: "সংরক্ষণ হচ্ছে…",
    reset: "রিসেট",
    total: "মোট",
    errAmount: "০ এর বেশি সঠিক পরিমাণ দিন।",
    errParty: "Party নির্বাচন করুন।",
    errMode: "Mode of Payment নির্বাচন করুন।",
    errAccounts: "From ও To account নির্বাচন করুন।",
    errSameAccount: "From ও To account একই হতে পারে না।",
    successTitle: "Payment Entry তৈরি হয়েছে",
    successBody: "এন্ট্রিটি Draft হিসেবে তৈরি হয়েছে। ডেস্কে (Payment Entry) রিভিউ করে সাবমিট করলে হিসাবে পোস্ট হবে।",
    entryNo: "Entry No.",
    status: "Status",
    createAnother: "আরেকটি তৈরি করুন",
    done: "ড্যাশবোর্ডে ফিরুন",
    loadFailed: "ফর্ম লোড করা যায়নি।",
    retry: "আবার চেষ্টা করুন",
    sessionExpired: "সেশন শেষ হয়েছে।",
    signInAgain: "আবার সাইন ইন করুন",
    permission: "অনুমতি নেই",
    permissionHint: "Payment Entry তৈরির অনুমতি আপনার নেই। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।",
    draftNote: "Draft",
  },
  en: {
    heading: "Payment Entry",
    subtitle: "Receive a payment, pay a party, or transfer between accounts.",
    back: "Back",
    paymentType: "Payment Type",
    amount: "Amount",
    amountHint: "How much money moves.",
    postingDate: "Posting Date",
    partyType: "Party Type",
    party: "Party",
    partyPlaceholder: "Type a name to search…",
    partySearching: "Searching…",
    partyEmpty: "No results.",
    mode: "Mode of Payment",
    modePlaceholder: "Select",
    fromAccount: "From Account",
    toAccount: "To Account",
    accountPlaceholder: "Select an account",
    referenceNo: "Reference No.",
    referenceNoHint: "Optional — transaction / cheque number.",
    referenceDate: "Reference Date",
    remarks: "Remarks",
    remarksHint: "Optional — a note for this entry.",
    submit: "Submit",
    submitting: "Saving…",
    reset: "Reset",
    total: "Total",
    errAmount: "Enter a valid amount greater than zero.",
    errParty: "Please choose a party.",
    errMode: "Please choose a Mode of Payment.",
    errAccounts: "Choose both a From and a To account.",
    errSameAccount: "The From and To accounts must be different.",
    successTitle: "Payment Entry created",
    successBody: "The entry was created as a Draft. Review and submit it in Desk (Payment Entry) to post it to the ledger.",
    entryNo: "Entry No.",
    status: "Status",
    createAnother: "Create another",
    done: "Back to dashboard",
    loadFailed: "Could not load the form.",
    retry: "Retry",
    sessionExpired: "Your session has expired.",
    signInAgain: "Sign in again",
    permission: "Not permitted",
    permissionHint: "You do not have permission to create a Payment Entry. Please contact an administrator.",
    draftNote: "Draft",
  },
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Async, debounced Link-style search for the Party field. */
function PartyPicker({
  partyType,
  value,
  display,
  onPick,
  language,
  placeholder,
  searchingLabel,
  emptyLabel,
  invalid,
}: {
  partyType: string;
  value: string;
  display: string;
  onPick: (option: PartyOption | null) => void;
  language: string;
  placeholder: string;
  searchingLabel: string;
  emptyLabel: string;
  invalid?: boolean;
}) {
  const [query, setQuery] = useState(display);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<PartyOption[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const { mounted, exiting } = useOverlayPresence(open, 150);

  useEffect(() => {
    if (!open || !partyType) return;
    const handle = window.setTimeout(() => {
      const id = ++requestId.current;
      setLoading(true);
      fetchPaymentEntryParties(partyType, query, language)
        .then((payload) => {
          if (id !== requestId.current) return;
          setOptions(payload.options ?? []);
        })
        .catch((error: unknown) => {
          if (id !== requestId.current) return;
          const failure = error as { code?: string; message?: string };
          reportClientError({
            scope: "payment-entry:parties",
            message: failure?.message || "Party search failed",
            detail: failure,
          });
          setOptions([]);
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, partyType, open, language]);

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const choose = (option: PartyOption) => {
    setQuery(option.label);
    onPick(option);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <FiSearch
          aria-hidden
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
        />
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          disabled={!partyType}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            onPick(null);
            setOpen(true);
          }}
          className={`${INPUT_BASE} ${borderClass(Boolean(invalid))} pl-9`}
        />
      </div>

      {mounted ? (
        <ul
          role="listbox"
          className={`absolute left-0 right-0 z-30 mt-1.5 max-h-60 origin-top overflow-y-auto rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] p-1.5 shadow-[0_26px_54px_-24px_color-mix(in_srgb,var(--color-primary)_60%,transparent)] ${
            exiting ? "u-shk-pop-out pointer-events-none" : "u-shk-pop-in"
          }`}
        >
          {loading ? (
            <li className="px-3 py-2 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
              {searchingLabel}
            </li>
          ) : options.length === 0 ? (
            <li className="px-3 py-2 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
              {emptyLabel}
            </li>
          ) : (
            options.map((option) => (
              <li key={option.value} role="option" aria-selected={option.value === value}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(option);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-[var(--color-action-tint)] ${
                    option.value === value ? "bg-[var(--color-action-tint)]" : ""
                  }`}
                >
                  <span className="min-w-0 truncate text-[13px] font-medium text-[var(--color-primary)]">
                    {option.label}
                  </span>
                  {option.label !== option.value ? (
                    <span className="shrink-0 text-[11px] text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
                      {option.value}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

export default function StaffPaymentEntryView({ onBack }: { onBack: () => void }) {
  const { language } = useLanguage();
  const copy = COPY[language === "en" ? "en" : "bn"];

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ code: string; message: string } | null>(null);
  const [context, setContext] = useState<PaymentEntryFormContext | null>(null);

  const [paymentType, setPaymentType] = useState<PaymentType>("Receive");
  const [partyType, setPartyType] = useState("Customer");
  const [party, setParty] = useState("");
  const [partyDisplay, setPartyDisplay] = useState("");
  const [mode, setMode] = useState("");
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [postingDate, setPostingDate] = useState(todayLocalIso());
  const [referenceNo, setReferenceNo] = useState("");
  const [referenceDate, setReferenceDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [historyToken, setHistoryToken] = useState(0);

  const loadedRef = useRef(false);

  const loadContext = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchPaymentEntryFormContext(language);
      setContext(data);
      setPaymentType((data.payment_types[0]?.value as PaymentType) || "Receive");
      setPartyType(data.party_types[0]?.value || "Customer");
      setPostingDate(data.posting_date || todayLocalIso());
    } catch (error) {
      const failure = error as { code?: string; message?: string };
      const message = failure?.message || copy.loadFailed;
      reportClientError({ scope: "payment-entry:load", message, detail: failure });
      setLoadError({
        code: failure?.code || "load_failed",
        message,
      });
    } finally {
      setLoading(false);
    }
  }, [language, copy.loadFailed]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void loadContext();
  }, [loadContext]);

  const isTransfer = paymentType === "Internal Transfer";

  const modeOptions = useMemo(
    () => (context?.mode_of_payments ?? []).map((item) => ({ value: item.value, label: item.label })),
    [context]
  );
  const accountOptions = useMemo(
    () => (context?.transfer_accounts ?? []).map((item) => ({ value: item.value, label: item.label })),
    [context]
  );
  const partyTypeOptions = useMemo(
    () => (context?.party_types ?? []).map((item) => ({ value: item.value, label: item.label })),
    [context]
  );
  const paymentTypeOptions = useMemo(
    () => (context?.payment_types ?? []).map((item) => ({ value: item.value, label: item.label })),
    [context]
  );

  const currency = context?.currency ?? "BDT";
  const numericAmount = Number.parseFloat(amount || "0") || 0;

  const resetForm = useCallback(() => {
    setPaymentType((context?.payment_types[0]?.value as PaymentType) || "Receive");
    setPartyType(context?.party_types[0]?.value || "Customer");
    setParty("");
    setPartyDisplay("");
    setMode("");
    setFromAccount("");
    setToAccount("");
    setAmount("");
    setPostingDate(context?.posting_date || todayLocalIso());
    setReferenceNo("");
    setReferenceDate("");
    setRemarks("");
    setErrors({});
  }, [context]);

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (!(numericAmount > 0)) next.amount = copy.errAmount;
    if (!DATE_RE.test(postingDate)) next.postingDate = copy.errAmount;
    if (isTransfer) {
      if (!fromAccount || !toAccount) next.accounts = copy.errAccounts;
      else if (fromAccount === toAccount) next.accounts = copy.errSameAccount;
    } else {
      if (!party) next.party = copy.errParty;
      if (!mode) next.mode = copy.errMode;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [numericAmount, postingDate, isTransfer, fromAccount, toAccount, party, mode, copy]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    if (!validate()) {
      toast.error(copy.errAmount, copy.heading);
      return;
    }
    setSubmitting(true);
    try {
      const result = await createPaymentEntry(
        {
          payment_type: paymentType,
          party_type: isTransfer ? undefined : (partyType as PartyType),
          party: isTransfer ? undefined : party,
          mode_of_payment: isTransfer ? undefined : mode,
          from_account: isTransfer ? fromAccount : undefined,
          to_account: isTransfer ? toAccount : undefined,
          paid_amount: numericAmount,
          posting_date: postingDate,
          reference_no: referenceNo.trim() || undefined,
          reference_date: referenceDate || undefined,
          remarks: remarks.trim() || undefined,
        },
        language
      );
      setHistoryToken((token) => token + 1);
      toast.success(`${result.name} · ${result.status}`, copy.successTitle);
      setOpen(false);
      resetForm();
    } catch (error) {
      const failure = error as { code?: string; message?: string };
      const message = failure?.message || copy.loadFailed;
      reportClientError({ scope: "payment-entry:create", message, detail: failure });
      toast.error(message, copy.heading);
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    validate,
    paymentType,
    isTransfer,
    partyType,
    party,
    mode,
    fromAccount,
    toAccount,
    numericAmount,
    postingDate,
    referenceNo,
    referenceDate,
    remarks,
    language,
    copy,
    resetForm,
  ]);

  const heading = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)] text-[19px] text-[var(--color-white)]">
          <FiCreditCard />
        </span>
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold text-[var(--color-primary)]">{copy.heading}</h2>
          <p className="mt-0.5 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.subtitle}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] px-3.5 py-2 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)]"
      >
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-primary)]">
          <FiArrowLeft size={15} />
          {copy.back}
        </span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <section className={CARD}>
        {heading}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-[66px] animate-pulse rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (loadError) {
    const isAuth = loadError.code === "not_authenticated";
    const isPermission = loadError.code === "not_permitted" || loadError.code === "permission_error";
    return (
      <section className={CARD}>
        {heading}
        <div className="mt-4 rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_6%,var(--color-white))] p-4">
          <p className="text-[13px] font-semibold text-[var(--color-danger-strong)]">
            {isAuth ? copy.sessionExpired : isPermission ? copy.permission : copy.loadFailed}
          </p>
          <p className={`mt-1 ${HELPER}`}>{loadError.message}</p>
          {isPermission ? <p className={`mt-1 ${HELPER}`}>{copy.permissionHint}</p> : null}
          {isAuth ? (
            <a
              href="/login"
              className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 transition hover:bg-[var(--color-action-hover)]"
            >
              <span className="text-[13px] font-semibold text-[var(--color-white)]">
                {copy.signInAgain}
              </span>
            </a>
          ) : (
            <button
              type="button"
              onClick={loadContext}
              className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 transition hover:bg-[var(--color-action-hover)]"
            >
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]">
                <FiRefreshCw size={15} />
                {copy.retry}
              </span>
            </button>
          )}
        </div>
      </section>
    );
  }

  const paymentForm = open ? (
    <div className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-primary)] text-[var(--color-white)]">
            <FiCreditCard size={16} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[var(--color-primary)]">{copy.heading}</h2>
            <p className="mt-0.5 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
              {copy.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!submitting) setOpen(false);
          }}
          disabled={submitting}
          aria-label={copy.back}
          className="grid h-9 w-9 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)] transition hover:bg-[var(--color-action-tint)] disabled:opacity-50"
        >
          <FiX size={16} />
        </button>
      </div>
      <div className="space-y-4">
        {/* Row 1: Payment type (left) | Mode of Payment (right) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className={LABEL}>{copy.paymentType}</span>
            <div className="mt-1.5">
              <DashboardSelect
                value={paymentType}
                onChange={(value) => {
                  setPaymentType(value as PaymentType);
                  setErrors({});
                }}
                options={paymentTypeOptions}
                placeholder={copy.paymentType}
                ariaLabel={copy.paymentType}
              />
            </div>
          </div>
          {isTransfer ? (
            <div>
              <span className={LABEL}>{copy.fromAccount}</span>
              <div className="mt-1.5">
                <DashboardSelect
                  value={fromAccount}
                  onChange={setFromAccount}
                  options={accountOptions}
                  placeholder={copy.accountPlaceholder}
                  ariaLabel={copy.fromAccount}
                  invalid={Boolean(errors.accounts)}
                />
              </div>
            </div>
          ) : (
            <div>
              <span className={LABEL}>{copy.mode}</span>
              <div className="mt-1.5">
                <DashboardSelect
                  value={mode}
                  onChange={setMode}
                  options={modeOptions}
                  placeholder={copy.modePlaceholder}
                  ariaLabel={copy.mode}
                  invalid={Boolean(errors.mode)}
                />
              </div>
              {errors.mode ? <p className="mt-1 text-[11.5px] text-[var(--color-danger-strong)]">{errors.mode}</p> : null}
            </div>
          )}
        </div>

        {/* Row 2: party (receive/pay) or destination account (transfer) */}
        {isTransfer ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={LABEL}>{copy.toAccount}</span>
              <div className="mt-1.5">
                <DashboardSelect
                  value={toAccount}
                  onChange={setToAccount}
                  options={accountOptions}
                  placeholder={copy.accountPlaceholder}
                  ariaLabel={copy.toAccount}
                  invalid={Boolean(errors.accounts)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={LABEL}>{copy.partyType}</span>
              <div className="mt-1.5">
                <DashboardSelect
                  value={partyType}
                  onChange={(value) => {
                    setPartyType(value);
                    setParty("");
                    setPartyDisplay("");
                  }}
                  options={partyTypeOptions}
                  placeholder={copy.partyType}
                  ariaLabel={copy.partyType}
                />
              </div>
            </div>
            <div>
              <span className={LABEL}>{copy.party}</span>
              <div className="mt-1.5">
                <PartyPicker
                  key={partyType}
                  partyType={partyType}
                  value={party}
                  display={partyDisplay}
                  onPick={(option) => {
                    if (option) {
                      setParty(option.value);
                      setPartyDisplay(option.label);
                    } else {
                      setParty("");
                      setPartyDisplay("");
                    }
                  }}
                  language={language}
                  placeholder={copy.partyPlaceholder}
                  searchingLabel={copy.partySearching}
                  emptyLabel={copy.partyEmpty}
                  invalid={Boolean(errors.party)}
                />
              </div>
              {errors.party ? <p className="mt-1 text-[11.5px] text-[var(--color-danger-strong)]">{errors.party}</p> : null}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className={LABEL}>{copy.amount}</span>
            <div className="mt-1.5 relative">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                className={`${INPUT_BASE} ${borderClass(Boolean(errors.amount))} pr-14`}
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                {currency}
              </span>
            </div>
            {errors.amount ? (
              <p className="mt-1 text-[11.5px] text-[var(--color-danger-strong)]">{errors.amount}</p>
            ) : (
              <p className={`mt-1 ${HELPER}`}>{copy.amountHint}</p>
            )}
          </div>
          <div>
            <span className={LABEL}>{copy.postingDate}</span>
            <div className="mt-1.5">
              <input
                type="date"
                value={postingDate}
                max={todayLocalIso()}
                onChange={(event) => setPostingDate(event.target.value)}
                className={`${INPUT_BASE} ${borderClass(Boolean(errors.postingDate))}`}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className={LABEL}>{copy.referenceNo}</span>
            <div className="mt-1.5">
              <input
                type="text"
                value={referenceNo}
                onChange={(event) => setReferenceNo(event.target.value)}
                placeholder="—"
                className={INPUT_BASE}
              />
            </div>
            <p className={`mt-1 ${HELPER}`}>{copy.referenceNoHint}</p>
          </div>
          <div>
            <span className={LABEL}>{copy.referenceDate}</span>
            <div className="mt-1.5">
              <input
                type="date"
                value={referenceDate}
                max={todayLocalIso()}
                onChange={(event) => setReferenceDate(event.target.value)}
                className={INPUT_BASE}
              />
            </div>
          </div>
        </div>

        <div>
          <span className={LABEL}>{copy.remarks}</span>
          <div className="mt-1.5">
            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={3}
              className={`${INPUT_BASE} resize-y`}
            />
          </div>
          <p className={`mt-1 ${HELPER}`}>{copy.remarksHint}</p>
        </div>

        {errors.accounts ? (
          <p className="text-[11.5px] text-[var(--color-danger-strong)]">{errors.accounts}</p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] pt-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
              {copy.total}
            </p>
            <p className="text-[18px] font-semibold text-[var(--color-primary)]">
              {formatAmount(numericAmount, currency, language)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copy.reset}
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-action)] px-5 py-2.5 transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? <FiRefreshCw size={15} className="animate-spin text-[var(--color-white)]" /> : null}
              <span className="text-[13px] font-semibold text-[var(--color-white)]">
                {submitting ? copy.submitting : copy.submit}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-5">
      <StaffPaymentHistoryPanel
        refreshToken={historyToken}
        canCreate
        onMakePayment={() => setOpen(true)}
        onBack={onBack}
      >
        {paymentForm}
      </StaffPaymentHistoryPanel>
    </div>
  );
}
