"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiDollarSign,
} from "react-icons/fi";

import {
  createExpenseClaim,
  fetchExpenseClaimLinkOptions,
  fetchExpenseClaimSchema,
} from "@/lib/expense-claim/api";
import { formatAmount } from "@/lib/expense-claim/format";
import { expenseClaimCopyFor, type ExpenseClaimCopy } from "@/lib/expense-claim/messages";
import type {
  ExpenseClaimCreateResult,
  ExpenseClaimFieldMeta,
  ExpenseClaimLinkOption,
  ExpenseClaimSchema,
  ExpenseRowValue,
} from "@/lib/expense-claim/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { toast } from "@/lib/ui/toast";

const CARD =
  "rounded-[22px] border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4 shadow-[0_18px_44px_-28px_color-mix(in_srgb,var(--color-primary)_40%,transparent)] sm:p-5";

const INPUT_BASE =
  "w-full rounded-2xl border bg-[var(--color-white)] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] disabled:cursor-not-allowed disabled:bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]";

const LABEL = "text-[12px] font-semibold text-[var(--color-primary)]";
const HELPER = "text-[11.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]";

const TEXTAREA_TYPES = new Set(["Small Text", "Text", "Long Text", "Text Editor"]);
const NUMBER_TYPES = new Set(["Int", "Float", "Currency", "Percent"]);

/**
 * Fields the backend resolves for every claim. `Exchange Rate` /
 * `Conversion Rate` are mandatory on ERPNext's Expense Claim, but a portal claim
 * is always created in the company's own currency, so the server fills the rate.
 * The portal must never render or send these - removed from the frontend.
 */
const SERVER_RESOLVED_FIELDS = new Set(["exchange_rate", "conversion_rate", "currency", "base_currency"]);

function borderClass(invalid: boolean): string {
  return invalid
    ? "border-[var(--color-danger)]"
    : "border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]";
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const PERMISSION_HINTS = [
  "permission to create",
  "do not have permission",
  "not permitted",
  "only system users",
  "অনুমতি নেই",
  "সিস্টেম ইউজার",
];

function isPermissionRefusal(code?: string, message?: string): boolean {
  if (code === "not_permitted" || code === "no_permission") return true;
  if (code !== "validation_error") return false;
  const haystack = (message ?? "").toLowerCase();
  return PERMISSION_HINTS.some((hint) => haystack.includes(hint.toLowerCase()));
}

interface NewExpenseClaimViewProps {
  /** Return to the Expense Claim list (`/userDashboard/expense-claim`). */
  onBack: () => void;
}

export default function NewExpenseClaimView({ onBack }: NewExpenseClaimViewProps) {
  const { language } = useLanguage();
  const copy = expenseClaimCopyFor(language);

  const [schema, setSchema] = useState<ExpenseClaimSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ message: string; code: string } | null>(null);

  const [parentValues, setParentValues] = useState<Record<string, string>>({});
  const [parentErrors, setParentErrors] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<ExpenseRowValue[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<number, Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<ExpenseClaimCreateResult | null>(null);

  const loadedRef = useRef(false);

  const emptyRow = useCallback((data: ExpenseClaimSchema): ExpenseRowValue => {
    const row: ExpenseRowValue = {};
    data.child.fields.forEach((field) => {
      row[field.fieldname] = field.default ?? "";
    });
    if (!row.expense_date) row.expense_date = todayIso();
    return row;
  }, []);

  const buildParentValues = useCallback((data: ExpenseClaimSchema): Record<string, string> => {
    const values: Record<string, string> = {};
    data.sections.forEach((section) =>
      section.fields.forEach((field) => {
        values[field.fieldname] = field.default ?? "";
      })
    );
    if (!values.posting_date) values.posting_date = todayIso();
    return values;
  }, []);

  const loadSchema = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchExpenseClaimSchema(language);
      setSchema(data);
      setParentValues(buildParentValues(data));
      setRows([emptyRow(data)]);
      setParentErrors({});
      setRowErrors({});
    } catch (error) {
      const failure = error as { message?: string; code?: string };
      setLoadError({ message: failure?.message || copy.loadFailed, code: failure?.code || "error" });
    } finally {
      setLoading(false);
    }
  }, [language, copy.loadFailed, buildParentValues, emptyRow]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void loadSchema();
  }, [loadSchema]);

  const setParentValue = useCallback((fieldname: string, value: string) => {
    setParentValues((current) => ({ ...current, [fieldname]: value }));
    setParentErrors((current) => {
      if (!current[fieldname]) return current;
      const next = { ...current };
      delete next[fieldname];
      return next;
    });
  }, []);

  const setRowValue = useCallback((index: number, fieldname: string, value: string) => {
    setRows((current) => {
      const next = current.slice();
      next[index] = { ...next[index], [fieldname]: value };
      return next;
    });
    setRowErrors((current) => {
      const rowErr = current[index];
      if (!rowErr?.[fieldname]) return current;
      const updated = { ...rowErr };
      delete updated[fieldname];
      return { ...current, [index]: updated };
    });
  }, []);

  const addRow = useCallback(() => {
    if (!schema) return;
    setRows((current) => [...current, emptyRow(schema)]);
  }, [schema, emptyRow]);

  const removeRow = useCallback((index: number) => {
    setRows((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));
    setRowErrors((current) => {
      const next: Record<number, Record<string, string>> = {};
      Object.entries(current).forEach(([key, value]) => {
        const i = Number(key);
        if (i < index) next[i] = value;
        else if (i > index) next[i - 1] = value;
      });
      return next;
    });
  }, []);

  const previewTotal = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [rows]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitting || !schema) return;

      const nextParentErrors: Record<string, string> = {};
      schema.sections.forEach((section) =>
        section.fields.forEach((field) => {
          if (!field.required || field.read_only) return;
          const value = parentValues[field.fieldname];
          if (!String(value ?? "").trim()) nextParentErrors[field.fieldname] = copy.missingRequired(field.label);
        })
      );

      const nextRowErrors: Record<number, Record<string, string>> = {};
      rows.forEach((row, index) => {
        const errs: Record<string, string> = {};
        schema.child.fields.forEach((field) => {
          if (!field.required) return;
          const value = rows[index][field.fieldname];
          if (!String(value ?? "").trim()) errs[field.fieldname] = copy.missingRequired(field.label);
        });
        if (Object.keys(errs).length) nextRowErrors[index] = errs;
      });

      const hasValidRow = rows.some(
        (row) => String(row.expense_type ?? "").trim() && Number(row.amount) > 0
      );

      if (Object.keys(nextParentErrors).length) {
        setParentErrors(nextParentErrors);
        toast.error(Object.values(nextParentErrors)[0], copy.errorTitle);
        return;
      }
      if (Object.keys(nextRowErrors).length) {
        setRowErrors(nextRowErrors);
        toast.error(Object.values(nextRowErrors)[0] ? Object.values(nextRowErrors[0])[0] : copy.rowMissing, copy.errorTitle);
        return;
      }
      if (!rows.length || !hasValidRow) {
        toast.error(copy.rowMissing, copy.errorTitle);
        return;
      }

      setParentErrors({});
      setRowErrors({});
      setSubmitting(true);
      try {
        const payload = {
          posting_date: parentValues.posting_date || "",
          cost_center: parentValues.cost_center || "",
          remark: parentValues.remark || "",
          expenses: rows.map((row) => {
            const clean: ExpenseRowValue = {};
            schema.child.fields.forEach((field) => {
              if (SERVER_RESOLVED_FIELDS.has(field.fieldname)) return;
              const value = row[field.fieldname];
              if (value !== undefined && String(value).trim() !== "") clean[field.fieldname] = String(value);
            });
            return clean;
          }),
        };
        const result = await createExpenseClaim(payload, language);
        setCreated(result);
        toast.success(copy.successBody(result.name), copy.successTitle);
      } catch (error) {
        toast.error((error as { message?: string })?.message || copy.loadFailed, copy.errorTitle);
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, schema, parentValues, rows, copy, language]
  );

  const handleReset = useCallback(() => {
    if (schema) {
      setParentValues(buildParentValues(schema));
      setRows([emptyRow(schema)]);
    }
    setParentErrors({});
    setRowErrors({});
    setCreated(null);
  }, [schema, buildParentValues, emptyRow]);

  const heading = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[19px] text-[var(--color-primary)]">
          <FiDollarSign />
        </span>
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold text-[var(--color-primary)]">{copy.formHeading}</h2>
          <p className="mt-0.5 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.formSubtitle}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] px-3.5 py-2 transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
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
    const isPermission = isPermissionRefusal(loadError.code, loadError.message);
    return (
      <section className={CARD}>
        {heading}
        <div
          className={
            isPermission
              ? "mt-4 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] p-4"
              : "mt-4 rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_6%,var(--color-white))] p-4"
          }
        >
          <p
            className={
              isPermission
                ? "text-[13px] font-semibold text-[var(--color-primary)]"
                : "text-[13px] font-semibold text-[var(--color-danger-strong)]"
            }
          >
            {isAuth
              ? copy.sessionExpiredTitle
              : isPermission
                ? copy.permissionTitle
                : copy.loadFailed}
          </p>
          <p className={`mt-1 ${HELPER}`}>{loadError.message}</p>
          {isPermission ? <p className={`mt-1 ${HELPER}`}>{copy.permissionHint}</p> : null}
          {isAuth ? (
            <a
              href="/login"
              className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 transition hover:opacity-90"
            >
              <span className="text-[13px] font-semibold text-[var(--color-white)]">
                {copy.signInAgain}
              </span>
            </a>
          ) : isPermission ? (
            <button
              type="button"
              onClick={onBack}
              className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 transition hover:opacity-90"
            >
              <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.back}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void loadSchema()}
              className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 transition hover:opacity-90"
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

  if (created) {
    return (
      <section className={CARD}>
        {heading}
        <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-success)_32%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_8%,var(--color-white))] p-5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-success)_18%,var(--color-white))] text-[24px] text-[var(--color-success)]">
            <FiCheckCircle />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-[var(--color-primary)]">
              {created.employee_name || created.employee}
            </p>
            <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
              {copy.createdLabel}: <span className="font-semibold">{created.name}</span>
            </p>
            <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
              {formatAmount(created.total_claimed_amount, created.currency || "BDT", language)} ·{" "}
              {created.status}
            </p>
            {created.verified ? (
              <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-success)]">
                <FiCheckCircle size={14} />
                {copy.createdLabel}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 transition hover:opacity-90"
            >
              <span className="text-[13px] font-semibold text-[var(--color-white)]">
                {copy.createAnother}
              </span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:border-[var(--color-primary)]"
            >
              <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.back}</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const parentFields = schema?.sections.flatMap((section) => section.fields) ?? [];
  const childFields = schema?.child.fields ?? [];
  const auto = schema?.auto ?? {};
  const autoEntries = Object.entries(auto).filter(([, value]) => Boolean(value));

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <section className={CARD}>{heading}</section>

      {/* ---------------------------------------------- server-resolved values */}
      {autoEntries.length ? (
        <section className={CARD}>
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-4 w-1 rounded-full bg-[var(--color-primary)]" />
            <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
              {copy.sectionAuto}
            </h3>
          </div>
          <p className={`mt-2 ${HELPER}`}>{copy.autoNote}</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {autoEntries.map(([key, value]) => (
              <div key={key} className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                  {autoLabel(key)}
                </dt>
                <dd className="mt-0.5 break-words text-[13px] font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {/* ------------------------------------------------------ claim details */}
      <section className={CARD}>
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-4 w-1 rounded-full bg-[var(--color-primary)]" />
          <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
            {copy.sectionClaim}
          </h3>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {parentFields.map((field) => (
            <FieldRow
              key={field.fieldname}
              field={field}
              value={parentValues[field.fieldname]}
              invalid={Boolean(parentErrors[field.fieldname])}
              errorText={parentErrors[field.fieldname]}
              copy={copy}
              language={language}
              onChange={(value) => setParentValue(field.fieldname, value)}
            />
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- expense rows */}
      <section className={CARD}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-4 w-1 rounded-full bg-[var(--color-primary)]" />
            <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
              {copy.sectionExpenses}
            </h3>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-2 transition hover:border-[var(--color-primary)]"
          >
            <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--color-primary)]">
              <FiPlus size={14} />
              {copy.addRow}
            </span>
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {rows.map((row, index) => (
            <div
              key={index}
              className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-[var(--color-primary)]">
                  {copy.rowLabel(index + 1)}
                </span>
                {rows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_24%,transparent)] bg-[var(--color-white)] px-2.5 py-1.5 transition hover:border-[var(--color-danger)]"
                  >
                    <FiTrash2 size={13} className="text-[var(--color-danger-strong)]" />
                    <span className="text-[11.5px] font-semibold text-[var(--color-danger-strong)]">
                      {copy.removeRow}
                    </span>
                  </button>
                ) : null}
              </div>

              <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {childFields.map((field) => (
                  <FieldRow
                    key={field.fieldname}
                    field={field}
                    value={row[field.fieldname]}
                    invalid={Boolean(rowErrors[index]?.[field.fieldname])}
                    errorText={rowErrors[index]?.[field.fieldname]}
                    copy={copy}
                    language={language}
                    onChange={(value) => setRowValue(index, field.fieldname, value)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] px-4 py-3">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
            {copy.totalClaimed}
          </span>
          <span className="text-[16px] font-semibold">
            {formatAmount(previewTotal, auto.currency || "BDT", language)}
          </span>
        </div>
        <p className={`mt-2 ${HELPER}`}>{copy.previewNote}</p>
      </section>

      {/* -------------------------------------------------------------- actions */}
      <section className={`${CARD} flex flex-wrap items-center justify-end gap-2`}>
        <button
          type="button"
          onClick={handleReset}
          disabled={submitting}
          className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:border-[var(--color-primary)] disabled:opacity-60"
        >
          <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.reset}</span>
        </button>

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <FiRefreshCw size={15} className="animate-spin" /> : <FiDollarSign size={15} />}
          <span className="text-[13px] font-semibold text-[var(--color-white)]">
            {submitting ? copy.submitting : copy.submit}
          </span>
        </button>
      </section>
    </form>
  );
}

const AUTO_LABELS: Record<string, string> = {
  employee: "Employee",
  employee_name: "Employee Name",
  company: "Company",
  department: "Department",
  cost_center: "Cost Center",
  currency: "Currency",
  expense_approver: "Expense Approver",
};

function autoLabel(key: string): string {
  return AUTO_LABELS[key] ?? key;
}

interface FieldRowProps {
  field: ExpenseClaimFieldMeta;
  value: string | undefined;
  invalid: boolean;
  errorText?: string;
  copy: ExpenseClaimCopy;
  language: string;
  onChange: (value: string) => void;
}

function FieldRow({ field, value, invalid, errorText, copy, language, onChange }: FieldRowProps) {
  const stringValue = typeof value === "string" ? value : "";

  return (
    <div>
      <label className="flex items-center gap-1">
        <span className={LABEL}>{field.label}</span>
        {field.required ? (
          <span aria-hidden className="text-[13px] leading-none text-[var(--color-danger)]">
            *
          </span>
        ) : null}
      </label>

      <div className="mt-1.5">
        {field.fieldtype === "Select" ? (
          <select
            value={stringValue}
            disabled={field.read_only}
            onChange={(event) => onChange(event.target.value)}
            className={`${INPUT_BASE} ${borderClass(invalid)}`}
          >
            <option value="">{copy.selectPlaceholder}</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : field.fieldtype === "Link" || field.fieldtype === "Dynamic Link" ? (
          field.link_doctype ? (
            <LinkField
              field={field}
              value={stringValue}
              invalid={invalid}
              copy={copy}
              language={language}
              onChange={onChange}
            />
          ) : (
            <input
              type="text"
              value={stringValue}
              readOnly={field.read_only}
              placeholder={field.placeholder || undefined}
              onChange={(event) => onChange(event.target.value)}
              className={`${INPUT_BASE} ${borderClass(invalid)}`}
            />
          )
        ) : TEXTAREA_TYPES.has(field.fieldtype) ? (
          <textarea
            value={stringValue}
            readOnly={field.read_only}
            rows={3}
            placeholder={field.placeholder || undefined}
            onChange={(event) => onChange(event.target.value)}
            className={`${INPUT_BASE} ${borderClass(invalid)} resize-y`}
          />
        ) : (
          <input
            type={
              field.fieldtype === "Date"
                ? "date"
                : field.fieldtype === "Datetime"
                  ? "datetime-local"
                  : field.fieldtype === "Time"
                    ? "time"
                    : NUMBER_TYPES.has(field.fieldtype)
                      ? "number"
                      : "text"
            }
            step={field.fieldtype === "Int" ? 1 : NUMBER_TYPES.has(field.fieldtype) ? "any" : undefined}
            value={stringValue}
            readOnly={field.read_only}
            placeholder={field.placeholder || undefined}
            onChange={(event) => onChange(event.target.value)}
            className={`${INPUT_BASE} ${borderClass(invalid)}`}
          />
        )}
      </div>

      {errorText ? (
        <p className="mt-1 text-[11.5px] font-medium text-[var(--color-danger-strong)]">{errorText}</p>
      ) : field.description ? (
        <p className={`mt-1 ${HELPER}`}>{field.description}</p>
      ) : null}
    </div>
  );
}

interface LinkFieldProps {
  field: ExpenseClaimFieldMeta;
  value: string;
  invalid: boolean;
  copy: ExpenseClaimCopy;
  language: string;
  onChange: (value: string) => void;
}

function LinkField({ field, value, invalid, copy, language, onChange }: LinkFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<ExpenseClaimLinkOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showList, setShowList] = useState(false);
  const loadedRef = useRef(false);

  const load = useCallback(
    async (txt: string) => {
      setLoading(true);
      try {
        const payload = await fetchExpenseClaimLinkOptions(field.link_doctype, txt, language);
        setOptions(payload.options);
        setLoadFailed(false);
      } catch {
        setOptions([]);
        setLoadFailed(true);
        toast.error(copy.linkLoadFailed, copy.errorTitle);
      } finally {
        setLoading(false);
      }
    },
    [field.link_doctype, language, copy]
  );

  const openList = useCallback(() => {
    setOpen(true);
    setShowList(true);
    if (!loadedRef.current) {
      loadedRef.current = true;
      void load("");
    }
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      void load(query);
    }, 220);
    return () => clearTimeout(handle);
  }, [open, query, load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (option) =>
        option.value.toLowerCase().includes(needle) || option.label.toLowerCase().includes(needle)
    );
  }, [options, query]);

  return (
    <div className="relative">
      <div className="relative">
        <FiSearch
          aria-hidden
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
        />
        <input
          type="text"
          value={value}
          readOnly={field.read_only}
          placeholder={field.placeholder || copy.searchPlaceholder}
          onFocus={openList}
          onBlur={() => {
            window.setTimeout(() => setShowList(false), 150);
          }}
          onChange={(event) => {
            onChange(event.target.value);
            setQuery(event.target.value);
            setShowList(true);
          }}
          className={`${INPUT_BASE} ${borderClass(invalid)} pl-9`}
        />
      </div>

      {showList && !field.read_only ? (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] p-1 shadow-[0_26px_54px_-24px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
          {loading ? (
            <li className={`px-3 py-2 ${HELPER}`}>{copy.linkLoading}</li>
          ) : filtered.length === 0 ? (
            <li className={`px-3 py-2 ${HELPER}`}>
              {!query.trim() && !loadFailed && field.link_doctype === "Expense Claim Type"
                ? copy.linkEmptyHint
                : copy.linkNoOptions}
            </li>
          ) : (
            filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setQuery("");
                    setShowList(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))]"
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
