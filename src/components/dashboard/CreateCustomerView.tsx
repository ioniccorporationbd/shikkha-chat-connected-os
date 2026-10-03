"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiRefreshCw,
  FiSearch,
  FiUserPlus,
} from "react-icons/fi";

import { createCustomer, fetchCustomerLinkOptions, fetchCustomerSchema } from "@/lib/customer/api";
import { customerCopyFor, type CustomerCopy } from "@/lib/customer/messages";
import type {
  CustomerCreateResult,
  CustomerFieldMeta,
  CustomerFormValues,
  CustomerLinkOption,
  CustomerSchema,
} from "@/lib/customer/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { toast } from "@/lib/ui/toast";

const CARD =
  "rounded-[22px] border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4 shadow-[0_18px_44px_-28px_color-mix(in_srgb,var(--color-primary)_40%,transparent)] sm:p-5";

const INPUT_BASE =
  "w-full rounded-2xl border bg-[var(--color-white)] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] disabled:cursor-not-allowed disabled:bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]";

const LABEL = "text-[12px] font-semibold text-[var(--color-primary)]";
const HELPER = "text-[11.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]";

function borderClass(invalid: boolean): string {
  return invalid
    ? "border-[var(--color-danger)]"
    : "border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]";
}

const TEXTAREA_TYPES = new Set(["Small Text", "Text", "Long Text", "Text Editor"]);
const NUMBER_TYPES = new Set(["Int", "Float", "Currency", "Percent"]);

/**
 * Whether a schema-load failure is really a permission refusal.
 *
 * The current backend raises the refusal as `PermissionError`, which the API
 * layer maps to `not_permitted`. An older backend instead reports it as a
 * `validation_error` whose message is the localized "no permission" text — so
 * match on that text too, otherwise the user sees a scary "could not load" card
 * for what is actually an actionable "you need the Customer: create role".
 */
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

interface CreateCustomerViewProps {
  /** Return to the dashboard overview (keeps the same shell — no new dashboard). */
  onBack: () => void;
}

export default function CreateCustomerView({ onBack }: CreateCustomerViewProps) {
  const { language } = useLanguage();
  const copy = customerCopyFor(language);

  const [schema, setSchema] = useState<CustomerSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ message: string; code: string } | null>(null);

  const [values, setValues] = useState<CustomerFormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CustomerCreateResult | null>(null);

  const loadedRef = useRef(false);

  const buildInitialValues = useCallback((data: CustomerSchema): CustomerFormValues => {
    const initial: CustomerFormValues = {};
    data.sections.forEach((section) =>
      section.fields.forEach((field) => {
        if (field.fieldtype === "Check") initial[field.fieldname] = false;
        else initial[field.fieldname] = field.default ?? "";
      })
    );
    return initial;
  }, []);

  const loadSchema = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchCustomerSchema(language);
      setSchema(data);
      setValues(buildInitialValues(data));
      setErrors({});
    } catch (error) {
      const failure = error as { message?: string; code?: string };
      setLoadError({ message: failure?.message || copy.loadFailed, code: failure?.code || "error" });
    } finally {
      setLoading(false);
    }
  }, [language, copy.loadFailed, buildInitialValues]);

  // Load once on mount: a language toggle must not wipe a half-filled form.
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void loadSchema();
  }, [loadSchema]);

  const setValue = useCallback((fieldname: string, value: string | boolean) => {
    setValues((current) => ({ ...current, [fieldname]: value }));
    setErrors((current) => {
      if (!current[fieldname]) return current;
      const next = { ...current };
      delete next[fieldname];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitting || !schema) return;

      const nextErrors: Record<string, string> = {};
      schema.sections.forEach((section) =>
        section.fields.forEach((field) => {
          if (!field.required || field.read_only) return;
          const value = values[field.fieldname];
          const empty = field.fieldtype === "Check" ? false : !String(value ?? "").trim();
          if (empty) nextErrors[field.fieldname] = copy.missingRequired(field.label);
        })
      );

      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        toast.error(Object.values(nextErrors)[0], copy.validationTitle);
        return;
      }

      setErrors({});
      setSubmitting(true);
      try {
        const result = await createCustomer(values, language);
        setCreated(result);
        toast.success(copy.successBody(result.name), copy.successTitle);
      } catch (error) {
        toast.error((error as Error)?.message || copy.loadFailed, copy.errorTitle);
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, schema, values, copy, language]
  );

  const handleReset = useCallback(() => {
    if (schema) setValues(buildInitialValues(schema));
    setErrors({});
    setCreated(null);
  }, [schema, buildInitialValues]);

  const sections = schema?.sections ?? [];
  const hasRequired = sections.some((section) => section.fields.some((field) => field.required));

  const heading = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[19px] text-[var(--color-primary)]">
          <FiUserPlus />
        </span>
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold text-[var(--color-primary)]">{copy.heading}</h2>
          <p className="mt-0.5 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.hint}
          </p>
          {hasRequired ? (
            <p className="mt-1 text-[11px] font-medium text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
              {copy.requiredNote}
            </p>
          ) : null}
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
          {[0, 1, 2, 3, 4, 5].map((index) => (
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
              className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-white)] transition hover:opacity-90"
            >
              <FiArrowLeft size={15} />
              {copy.signInAgain}
            </a>
          ) : isPermission ? (
            <button
              type="button"
              onClick={onBack}
              className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-white)] transition hover:opacity-90"
            >
              <FiArrowLeft size={15} />
              {copy.back}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void loadSchema()}
              className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-white)] transition hover:opacity-90"
            >
              <FiRefreshCw size={15} />
              {copy.retry}
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
            <p className="text-[14px] font-semibold text-[var(--color-primary)]">{created.customer_name}</p>
            <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
              {copy.createdLabel}: <span className="font-semibold">{created.name}</span>
            </p>
            {created.customer_group || created.territory ? (
              <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                {[
                  created.customer_group ? `${copy.groupLabel}: ${created.customer_group}` : "",
                  created.territory ? `${copy.territoryLabel}: ${created.territory}` : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
            {created.verified ? (
              <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-success)]">
                <FiCheckCircle size={14} />
                {copy.verifiedLabel}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-white)] transition hover:opacity-90"
            >
              {copy.createAnother}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
            >
              {copy.back}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <section className={CARD}>{heading}</section>

      {sections.length === 0 ? (
        <section className={CARD}>
          <p className={HELPER}>{copy.empty}</p>
        </section>
      ) : null}

      {sections.map((section) => (
        <section key={section.key} className={CARD}>
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-4 w-1 rounded-full bg-[var(--color-primary)]" />
            <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
              {copy.sectionLabels[section.label] ?? section.label}
            </h3>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <FieldRow
                key={`${section.key}:${field.fieldname}`}
                field={field}
                value={values[field.fieldname]}
                invalid={Boolean(errors[field.fieldname])}
                errorText={errors[field.fieldname]}
                copy={copy}
                language={language}
                onChange={(value) => setValue(field.fieldname, value)}
              />
            ))}
          </div>
        </section>
      ))}

      <section className={`${CARD} flex flex-wrap items-center justify-end gap-2`}>
        <button
          type="button"
          onClick={handleReset}
          disabled={submitting}
          className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] disabled:opacity-60"
        >
          {copy.reset}
        </button>

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 text-[13px] font-semibold text-[var(--color-white)] shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <FiRefreshCw size={15} className="animate-spin" /> : <FiUserPlus size={15} />}
          {submitting ? copy.submitting : copy.submit}
        </button>
      </section>
    </form>
  );
}

interface FieldRowProps {
  field: CustomerFieldMeta;
  value: string | boolean | undefined;
  invalid: boolean;
  errorText?: string;
  copy: CustomerCopy;
  language: string;
  onChange: (value: string | boolean) => void;
}

function FieldRow({ field, value, invalid, errorText, copy, language, onChange }: FieldRowProps) {
  const isWide = field.fieldtype === "Check";

  return (
    <div className={isWide ? "sm:col-span-2" : ""}>
      <label className="flex items-center gap-1">
        <span className={LABEL}>{field.label}</span>
        {field.required ? (
          <span aria-hidden className="text-[13px] leading-none text-[var(--color-danger)]">
            *
          </span>
        ) : null}
      </label>

      <div className="mt-1.5">
        {field.fieldtype === "Check" ? (
          <button
            type="button"
            role="switch"
            aria-checked={value === true}
            aria-label={field.label}
            disabled={field.read_only}
            onClick={() => onChange(!(value === true))}
            className={`inline-flex h-7 w-12 items-center rounded-full border transition ${
              value === true
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                : "border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_24%,var(--color-white))]"
            } disabled:opacity-60`}
          >
            <span
              className={`h-5 w-5 rounded-full bg-[var(--color-white)] shadow transition ${
                value === true ? "translate-x-6" : "translate-x-1"
              }`}
            />
            <span className="sr-only">{value === true ? copy.yes : copy.no}</span>
          </button>
        ) : field.fieldtype === "Select" ? (
          <select
            value={typeof value === "string" ? value : ""}
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
              value={typeof value === "string" ? value : ""}
              invalid={invalid}
              copy={copy}
              language={language}
              onChange={(next) => onChange(next)}
            />
          ) : (
            <input
              type="text"
              value={typeof value === "string" ? value : ""}
              readOnly={field.read_only}
              placeholder={field.placeholder || undefined}
              onChange={(event) => onChange(event.target.value)}
              className={`${INPUT_BASE} ${borderClass(invalid)}`}
            />
          )
        ) : TEXTAREA_TYPES.has(field.fieldtype) ? (
          <textarea
            value={typeof value === "string" ? value : ""}
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
            value={typeof value === "string" ? value : ""}
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
  field: CustomerFieldMeta;
  value: string;
  invalid: boolean;
  copy: CustomerCopy;
  language: string;
  onChange: (value: string) => void;
}

function LinkField({ field, value, invalid, copy, language, onChange }: LinkFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<CustomerLinkOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const loadedRef = useRef(false);

  const load = useCallback(
    async (txt: string) => {
      setLoading(true);
      try {
        const payload = await fetchCustomerLinkOptions(field.link_doctype, txt, language);
        setOptions(payload.options);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [field.link_doctype, language]
  );

  const openList = useCallback(() => {
    setOpen(true);
    setShowList(true);
    if (!loadedRef.current) {
      loadedRef.current = true;
      void load("");
    }
  }, [load]);

  // Debounced search while the list is open.
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
            // Delay so a click on an option lands before the list closes.
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
            <li className={`px-3 py-2 ${HELPER}`}>{copy.linkNoOptions}</li>
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
