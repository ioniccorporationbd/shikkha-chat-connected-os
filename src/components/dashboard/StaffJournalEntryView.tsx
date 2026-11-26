"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiBookOpen, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";

import DashboardSelect from "@/components/dashboard/DashboardSelect";
import { formatAmount } from "@/lib/expense-claim/format";
import { todayLocalIso } from "@/lib/format/datetime";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  createJournalEntry,
  fetchJournalEntryContext,
  fetchJournalParties,
} from "@/lib/journal-entry/api";
import type {
  AccountOption,
  JournalEntryCreateInput,
  JournalEntryFormContext,
  SelectOption,
} from "@/lib/journal-entry/types";
import { reportClientError } from "@/lib/log/report-error";
import { toast } from "@/lib/ui/toast";

interface DraftRow {
  id: string;
  account: string;
  partyType: string; // "" | "Supplier" | "Customer"
  party: string;
  debit: string;
  credit: string;
  costCenter: string;
}

let rowSeq = 0;
function newRow(): DraftRow {
  rowSeq += 1;
  return {
    id: `je-row-${rowSeq}`,
    account: "",
    partyType: "",
    party: "",
    debit: "",
    credit: "",
    costCenter: "",
  };
}

/** Which party type an account demands, from its `account_type`. */
function partyTypeFor(accounts: AccountOption[], name: string): string {
  const found = accounts.find((account) => account.value === name);
  const type = (found?.account_type || "").trim().toLowerCase();
  if (type === "payable") return "Supplier";
  if (type === "receivable") return "Customer";
  return "";
}

const toNumber = (value: string): number => {
  const parsed = Number((value || "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function StaffJournalEntryView({ onBack }: { onBack?: () => void }) {
  const { language } = useLanguage();
  const copy = copyFor(language);

  const [context, setContext] = useState<JournalEntryFormContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [company, setCompany] = useState("");
  const [voucherType, setVoucherType] = useState("Journal Entry");
  const [postingDate, setPostingDate] = useState(todayLocalIso());
  const [title, setTitle] = useState("");
  const [remark, setRemark] = useState("");
  const [rows, setRows] = useState<DraftRow[]>(() => [newRow(), newRow()]);

  const [partyCache, setPartyCache] = useState<Record<string, SelectOption[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadContext = useCallback(
    async (targetCompany?: string) => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await fetchJournalEntryContext(targetCompany, language);
        setContext(data);
        setCompany((prev) => prev || data.company);
        setVoucherType((prev) => prev || data.voucher_types[0]?.value || "Journal Entry");
      } catch (error) {
        setLoadError(copy.loadError);
        reportClientError({
          scope: "journal-entry:context",
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    },
    [language, copy.loadError]
  );

  useEffect(() => {
    void loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const ensureParties = useCallback(
    async (partyType: string) => {
      if (!partyType || partyCache[partyType]) return;
      try {
        const options = await fetchJournalParties(partyType, language);
        setPartyCache((prev) => ({ ...prev, [partyType]: options }));
      } catch (error) {
        reportClientError({
          scope: "journal-entry:parties",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [partyCache, language]
  );

  const updateRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const onAccountChange = (id: string, account: string) => {
    const partyType = partyTypeFor(context?.accounts || [], account);
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? { ...row, account, partyType, party: partyType ? row.party : "" }
          : row
      )
    );
    if (partyType) void ensureParties(partyType);
  };

  const addRow = () => setRows((prev) => [...prev, newRow()]);
  const removeRow = (id: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    for (const row of rows) {
      debit += toNumber(row.debit);
      credit += toNumber(row.credit);
    }
    return { debit, credit, diff: Math.round((debit - credit) * 100) / 100 };
  }, [rows]);
  const balanced = totals.debit > 0 && Math.abs(totals.diff) < 0.005;

  const accountOptions: SelectOption[] = useMemo(
    () => (context?.accounts || []).map((account) => ({ value: account.value, label: account.label })),
    [context]
  );
  const costCenterOptions: SelectOption[] = useMemo(
    () =>
      (context?.cost_centers || []).map((center) => ({ value: center.value, label: center.label })),
    [context]
  );
  const vendorOptions: SelectOption[] = useMemo(
    () => (context?.companies || []).map((option) => ({ value: option.value, label: option.label })),
    [context]
  );
  const voucherOptions: SelectOption[] = useMemo(
    () => context?.voucher_types || [{ value: "Journal Entry", label: "Journal Entry" }],
    [context]
  );

  const validate = (): string | null => {
    if (!company) return copy.errCompany;
    if (!postingDate) return copy.errDate;
    const filled = rows.filter((row) => row.account || toNumber(row.debit) > 0 || toNumber(row.credit) > 0);
    if (filled.length < 2) return copy.errRows;
    for (const row of filled) {
      if (!row.account) return copy.errAccount;
      const debit = toNumber(row.debit);
      const credit = toNumber(row.credit);
      if ((debit > 0 && credit > 0) || (debit <= 0 && credit <= 0)) return copy.errDebitCredit;
      if (row.partyType && !row.party) return copy.errParty;
    }
    if (!balanced) return copy.errBalance;
    return null;
  };

  const onSubmit = async () => {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }

    const currency = context?.currency || "BDT";
    void currency;
    setSubmitting(true);
    try {
      const payload: JournalEntryCreateInput = {
        company,
        voucher_type: voucherType,
        posting_date: postingDate,
        title: title.trim() || undefined,
        remark: remark.trim() || undefined,
        accounts: rows
          .filter((row) => row.account)
          .map((row) => ({
            account: row.account,
            party_type: row.partyType || undefined,
            party: row.partyType ? row.party : undefined,
            debit: toNumber(row.debit),
            credit: toNumber(row.credit),
            cost_center: row.costCenter || undefined,
          })),
      };
      const result = await createJournalEntry(payload, language);
      toast.success(copy.success.replace("{name}", result.name));
      setTitle("");
      setRemark("");
      setRows([newRow(), newRow()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.submitError;
      toast.error(message);
      reportClientError({ scope: "journal-entry:create", message });
    } finally {
      setSubmitting(false);
    }
  };

  const currency = context?.currency || "BDT";

  if (loading) {
    return (
      <div className="grid min-h-[280px] place-items-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-muted)]">
        <span className="flex items-center gap-2">
          <FiRefreshCw className="animate-spin" size={15} /> {copy.loading}
        </span>
      </div>
    );
  }

  if (loadError || !context) {
    return (
      <div className="grid min-h-[280px] place-items-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-[var(--color-muted)]">{loadError || copy.loadError}</p>
          <button
            type="button"
            onClick={() => void loadContext(company)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--color-action)] hover:bg-[var(--color-action-tint)]"
          >
            <FiRefreshCw size={13} /> {copy.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-action-tint)] text-[var(--color-action)]">
            <FiBookOpen size={20} />
          </span>
          <div>
            <h1 className="text-[19px] font-semibold leading-tight text-[var(--color-ink)]">
              {copy.title}
            </h1>
            <p className="mt-0.5 text-[13px] text-[var(--color-muted)]">{copy.subtitle}</p>
          </div>
        </div>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--color-muted)] hover:bg-[var(--color-action-tint)] hover:text-[var(--color-action)]"
          >
            <FiArrowLeft size={13} /> {copy.back}
          </button>
        ) : null}
      </div>

      {/* Entry details */}
      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="mb-4 text-[15px] font-semibold text-[var(--color-ink)]">{copy.detailsHeading}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.fVoucherType}>
            <DashboardSelect
              value={voucherType}
              onChange={setVoucherType}
              options={voucherOptions}
              ariaLabel={copy.fVoucherType}
            />
          </Field>
          <Field label={copy.fCompany}>
            <DashboardSelect
              value={company}
              onChange={(value) => {
                setCompany(value);
                void loadContext(value);
              }}
              options={vendorOptions}
              ariaLabel={copy.fCompany}
            />
          </Field>
          <Field label={copy.fPostingDate}>
            <input
              type="date"
              value={postingDate}
              onChange={(event) => setPostingDate(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={copy.fTitle}>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={copy.fTitlePlaceholder}
              className={inputClass}
            />
          </Field>
          <Field label={copy.fRemark} className="sm:col-span-2">
            <textarea
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              placeholder={copy.fRemarkPlaceholder}
              rows={2}
              className={`${inputClass} resize-y`}
            />
          </Field>
        </div>
      </section>

      {/* Accounts */}
      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">{copy.accountsHeading}</h2>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-action)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--color-action)] hover:bg-[var(--color-action-tint)]"
          >
            <FiPlus size={13} /> {copy.addRow}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                <th className="whitespace-nowrap px-2 py-2">{copy.colAccount}</th>
                <th className="whitespace-nowrap px-2 py-2">{copy.colParty}</th>
                <th className="whitespace-nowrap px-2 py-2 text-right">{copy.colDebit}</th>
                <th className="whitespace-nowrap px-2 py-2 text-right">{copy.colCredit}</th>
                <th className="whitespace-nowrap px-2 py-2">{copy.colCostCenter}</th>
                <th className="px-2 py-2" aria-label={copy.colAction} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--color-line)] align-top">
                  <td className="min-w-[220px] px-2 py-2">
                    <DashboardSelect
                      value={row.account}
                      onChange={(value) => onAccountChange(row.id, value)}
                      options={accountOptions}
                      placeholder={copy.selectAccount}
                      ariaLabel={copy.colAccount}
                    />
                  </td>
                  <td className="min-w-[170px] px-2 py-2">
                    {row.partyType ? (
                      <DashboardSelect
                        value={row.party}
                        onChange={(value) => updateRow(row.id, { party: value })}
                        options={partyCache[row.partyType] || []}
                        placeholder={copy.selectParty}
                        ariaLabel={copy.colParty}
                      />
                    ) : (
                      <span className="block px-1 py-2 text-[12px] text-[var(--color-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <input
                      inputMode="decimal"
                      value={row.debit}
                      onChange={(event) => updateRow(row.id, { debit: event.target.value })}
                      placeholder="0"
                      className={`${inputClass} w-24 text-right`}
                    />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <input
                      inputMode="decimal"
                      value={row.credit}
                      onChange={(event) => updateRow(row.id, { credit: event.target.value })}
                      placeholder="0"
                      className={`${inputClass} w-24 text-right`}
                    />
                  </td>
                  <td className="min-w-[150px] px-2 py-2">
                    <DashboardSelect
                      value={row.costCenter}
                      onChange={(value) => updateRow(row.id, { costCenter: value })}
                      options={costCenterOptions}
                      placeholder={copy.selectCostCenter}
                      ariaLabel={copy.colCostCenter}
                    />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length <= 1}
                      aria-label={copy.removeRow}
                      className="inline-grid h-8 w-8 place-items-center rounded-full text-[var(--color-muted)] hover:bg-[var(--color-action-tint)] hover:text-[var(--color-action)] disabled:opacity-40"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals + submit */}
        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--color-line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[13px]">
            <span className="text-[var(--color-muted)]">
              {copy.totalDebit}{" "}
              <b className="text-[var(--color-ink)]">{formatAmount(totals.debit, currency, language)}</b>
            </span>
            <span className="text-[var(--color-muted)]">
              {copy.totalCredit}{" "}
              <b className="text-[var(--color-ink)]">{formatAmount(totals.credit, currency, language)}</b>
            </span>
            <span className={balanced ? "text-[var(--color-success,#16a34a)]" : "text-[var(--color-danger,#dc2626)]"}>
              {copy.difference}{" "}
              <b>{formatAmount(totals.diff, currency, language)}</b>
            </span>
          </div>
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={submitting || !balanced}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-action)] px-5 py-2.5 text-[13.5px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? copy.submitting : copy.submit}
          </button>
        </div>
      </section>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[13.5px] text-[var(--color-ink)] outline-none transition focus:border-[var(--color-action)]";

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className || ""}`}>
      <span className="text-[12px] font-semibold text-[var(--color-muted)]">{label}</span>
      {children}
    </label>
  );
}

interface Copy {
  title: string;
  subtitle: string;
  back: string;
  loading: string;
  loadError: string;
  retry: string;
  detailsHeading: string;
  accountsHeading: string;
  fVoucherType: string;
  fCompany: string;
  fPostingDate: string;
  fTitle: string;
  fTitlePlaceholder: string;
  fRemark: string;
  fRemarkPlaceholder: string;
  addRow: string;
  removeRow: string;
  colAccount: string;
  colParty: string;
  colDebit: string;
  colCredit: string;
  colCostCenter: string;
  colAction: string;
  selectAccount: string;
  selectParty: string;
  selectCostCenter: string;
  totalDebit: string;
  totalCredit: string;
  difference: string;
  submit: string;
  submitting: string;
  success: string;
  submitError: string;
  errCompany: string;
  errDate: string;
  errRows: string;
  errAccount: string;
  errDebitCredit: string;
  errParty: string;
  errBalance: string;
}

const EN: Copy = {
  title: "Journal Entry",
  subtitle: "Record a debit and credit entry that balances.",
  back: "Back",
  loading: "Loading…",
  loadError: "Could not load the accounts. Please try again.",
  retry: "Retry",
  detailsHeading: "Entry details",
  accountsHeading: "Accounts",
  fVoucherType: "Voucher type",
  fCompany: "Company",
  fPostingDate: "Posting date",
  fTitle: "Title / Pay To / Received From",
  fTitlePlaceholder: "e.g. IONIC Corporation",
  fRemark: "Remark",
  fRemarkPlaceholder: "Reference or narration",
  addRow: "Add row",
  removeRow: "Remove row",
  colAccount: "Account",
  colParty: "Party",
  colDebit: "Debit",
  colCredit: "Credit",
  colCostCenter: "Cost center",
  colAction: "Action",
  selectAccount: "Select account",
  selectParty: "Select party",
  selectCostCenter: "Select cost center",
  totalDebit: "Total debit",
  totalCredit: "Total credit",
  difference: "Difference",
  submit: "Create journal entry",
  submitting: "Creating…",
  success: "Journal entry {name} created as a draft.",
  submitError: "Could not create the journal entry.",
  errCompany: "Choose a company.",
  errDate: "Choose a posting date.",
  errRows: "Add at least two account lines.",
  errAccount: "Every line needs an account.",
  errDebitCredit: "Each line must have either a debit or a credit, not both.",
  errParty: "Choose the party for the payable / receivable line.",
  errBalance: "Debit and credit must be equal and greater than zero.",
};

const BN: Copy = {
  title: "জার্নাল এন্ট্রি",
  subtitle: "যে ডেবিট ও ক্রেডিট এন্ট্রি সমান হবে তা লিখুন।",
  back: "ফিরে যান",
  loading: "লোড হচ্ছে…",
  loadError: "অ্যাকাউন্টগুলো লোড করা যায়নি। আবার চেষ্টা করুন।",
  retry: "আবার চেষ্টা",
  detailsHeading: "এন্ট্রির বিবরণ",
  accountsHeading: "অ্যাকাউন্টসমূহ",
  fVoucherType: "ভাউচার টাইপ",
  fCompany: "কোম্পানি",
  fPostingDate: "পোস্টিং তারিখ",
  fTitle: "টাইটেল / পরিশোধ / প্রাপ্তি",
  fTitlePlaceholder: "যেমন: IONIC Corporation",
  fRemark: "মন্তব্য",
  fRemarkPlaceholder: "রেফারেন্স বা বিবরণ",
  addRow: "সারি যোগ করুন",
  removeRow: "সারি মুছুন",
  colAccount: "অ্যাকাউন্ট",
  colParty: "পক্ষ",
  colDebit: "ডেবিট",
  colCredit: "ক্রেডিট",
  colCostCenter: "কস্ট সেন্টার",
  colAction: "অ্যাকশন",
  selectAccount: "অ্যাকাউন্ট নির্বাচন করুন",
  selectParty: "পক্ষ নির্বাচন করুন",
  selectCostCenter: "কস্ট সেন্টার নির্বাচন করুন",
  totalDebit: "মোট ডেবিট",
  totalCredit: "মোট ক্রেডিট",
  difference: "পার্থক্য",
  submit: "জার্নাল এন্ট্রি তৈরি করুন",
  submitting: "তৈরি হচ্ছে…",
  success: "জার্নাল এন্ট্রি {name} খসড়া হিসেবে তৈরি হয়েছে।",
  submitError: "জার্নাল এন্ট্রি তৈরি করা যায়নি।",
  errCompany: "একটি কোম্পানি নির্বাচন করুন।",
  errDate: "একটি পোস্টিং তারিখ নির্বাচন করুন।",
  errRows: "কমপক্ষে দুটি অ্যাকাউন্ট সারি যোগ করুন।",
  errAccount: "প্রতিটি সারিতে অ্যাকাউন্ট লাগবে।",
  errDebitCredit: "প্রতিটি সারিতে হয় ডেবিট নাহয় ক্রেডিট, দুটোই নয়।",
  errParty: "পেয়েবল / রিসিভেবল সারির জন্য পক্ষ নির্বাচন করুন।",
  errBalance: "ডেবিট ও ক্রেডিট সমান এবং শূন্যের বেশি হতে হবে।",
};

function copyFor(language: string): Copy {
  return language === "en" ? EN : BN;
}
