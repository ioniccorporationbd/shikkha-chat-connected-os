"use client";

import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiEdit2,
  FiGlobe,
  FiInfo,
  FiLoader,
  FiLock,
  FiPhone,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiTag,
  FiUser,
  FiUserPlus,
  FiX,
} from "react-icons/fi";

import {
  createCustomer,
  fetchCustomerDetails,
  fetchCustomerLinkOptions,
  fetchCustomerSchema,
  updateCustomer,
} from "@/lib/customer/api";
import { customerCopyFor, isDuplicateError, type CustomerCopy } from "@/lib/customer/messages";
import type {
  CustomerCreateResult,
  CustomerFieldMeta,
  CustomerFieldValue,
  CustomerFormValues,
  CustomerLinkOption,
  CustomerSchema,
} from "@/lib/customer/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { toast } from "@/lib/ui/toast";

/* ------------------------------------------------------------------ */
/* Layout constants                                                    */
/* ------------------------------------------------------------------ */

const PAGE = "mx-auto flex w-full max-w-[920px] flex-col gap-4";

const CARD =
  "rounded-[24px] border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4 shadow-[0_18px_44px_-28px_color-mix(in_srgb,var(--color-primary)_40%,transparent)] sm:p-5";

const HEADER_CARD =
  "relative overflow-hidden rounded-[24px] border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_10%,var(--color-white)),var(--color-white)_58%)] p-4 shadow-[0_22px_50px_-30px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] sm:p-6";

const ACTIONS_CARD =
  "sticky bottom-3 z-20 flex flex-col-reverse gap-2 rounded-[20px] border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_92%,transparent)] p-3 shadow-[0_18px_44px_-30px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] backdrop-blur sm:flex-row sm:items-center sm:justify-end";

const INPUT_BASE =
  "w-full rounded-2xl border bg-[var(--color-white)] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] disabled:cursor-not-allowed disabled:bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]";

const LABEL = "text-[12px] font-semibold text-[var(--color-primary)]";
const HELPER = "text-[11.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]";
const ERROR_TEXT = "text-[11.5px] font-medium text-[var(--color-danger-strong)]";

const REQUIRED_PILL =
  "rounded-full bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--color-white))] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-danger-strong)]";

const ICON_TILE =
  "grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[16px] text-[var(--color-primary)]";

const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))] disabled:cursor-not-allowed disabled:opacity-60";

const BTN_PRIMARY =
  "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

const TEXTAREA_TYPES = new Set(["Small Text", "Text", "Long Text", "Text Editor"]);
const NUMBER_TYPES = new Set(["Int", "Float", "Currency", "Percent"]);
const SEGMENT_MAX = 4;

const SECTION_ICON: Record<string, IconType> = {
  customer_information: FiUser,
  basic_information: FiUser,
  contact_information: FiPhone,
  address_information: FiGlobe,
  business_tax: FiBriefcase,
  additional_information: FiInfo,
};

const DRAFT_KEY = "shikkha:create-customer:draft";
const DRAFT_VERSION = 1;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function borderFor(invalid: boolean): string {
  return invalid
    ? "border-[var(--color-danger)]"
    : "border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]";
}

function isBlank(value: CustomerFieldValue | undefined): boolean {
  return value === undefined || value === null || value === "" || value === false;
}

function valuesEqual(a: CustomerFormValues, b: CustomerFormValues): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => (a[key] ?? "") === (b[key] ?? ""));
}

/** Coerce an ERP value (string | number | boolean | null) to a form value. */
function coerceValue(value: unknown, fieldType: string): CustomerFieldValue {
  if (fieldType === "Check") {
    return value === true || value === 1 || value === "1" || value === "true" || value === "Yes";
  }
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value;
  return String(value);
}

function buildInitialValues(schema: CustomerSchema): CustomerFormValues {
  const out: CustomerFormValues = {};
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.fieldtype === "Check") {
        out[field.fieldname] = field.default === "1" || field.default === "true" || field.default === "Yes";
      } else {
        out[field.fieldname] = field.default ?? "";
      }
    }
  }
  return out;
}

function firstRequiredField(schema: CustomerSchema): string | null {
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.required && !field.read_only && field.fieldtype !== "Check") return field.fieldname;
    }
  }
  return null;
}

interface InputTraits {
  type: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email" | "url" | "search";
  autoComplete: string;
  /** `mobile` renders the BD phone hint instead of the raw description. */
  helperKind?: "mobile";
}

function inputTraits(field: CustomerFieldMeta): InputTraits {
  const name = field.fieldname.toLowerCase();
  if (name === "email_id" || name === "email" || name.endsWith("_email") || field.fieldtype === "Email") {
    return { type: "email", inputMode: "email", autoComplete: "email" };
  }
  if (name === "website" || field.fieldtype === "URL" || name.endsWith("_url")) {
    return { type: "url", inputMode: "url", autoComplete: "url" };
  }
  if (name === "mobile_no" || name.includes("mobile") || name.includes("phone") || field.fieldtype === "Phone") {
    return { type: "tel", inputMode: "tel", autoComplete: "tel", helperKind: "mobile" };
  }
  if (field.fieldtype === "Date") return { type: "date", autoComplete: "off" };
  if (field.fieldtype === "Datetime") return { type: "datetime-local", autoComplete: "off" };
  if (NUMBER_TYPES.has(field.fieldtype)) return { type: "text", inputMode: "decimal", autoComplete: "off" };
  return { type: "text", autoComplete: "off" };
}

/* ------------------------------------------------------------------ */
/* Draft storage (sessionStorage — no secrets persisted by design)      */
/* ------------------------------------------------------------------ */

function readDraft(): CustomerFormValues | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v?: number; values?: CustomerFormValues };
    if (!parsed || parsed.v !== DRAFT_VERSION || !parsed.values) return null;
    return parsed.values;
  } catch {
    return null;
  }
}

function writeDraft(values: CustomerFormValues): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ v: DRAFT_VERSION, values }));
  } catch {
    /* storage might be full or blocked — drafts are best-effort */
  }
}

function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Permission sniffing (older backends report it as a validation error) */
/* ------------------------------------------------------------------ */

const PERMISSION_HINTS = [
  "permission to create",
  "do not have permission",
  "not permitted",
  "অনুমতি নেই",
  "অনুমতি দেওয়া",
];

function isPermissionRefusal(code: string | undefined, message: string): boolean {
  if (code === "not_permitted" || code === "no_permission") return true;
  const haystack = (message || "").toLowerCase();
  return PERMISSION_HINTS.some((hint) => haystack.includes(hint.toLowerCase()));
}

/* ------------------------------------------------------------------ */
/* Link field — searchable, keyboard-navigable                          */
/* ------------------------------------------------------------------ */

interface LinkFieldProps {
  field: CustomerFieldMeta;
  value: CustomerFieldValue;
  invalid: boolean;
  copy: CustomerCopy;
  language: string;
  disabled?: boolean;
  inputId: string;
  onChange: (fieldname: string, value: CustomerFieldValue) => void;
}

function LinkField({ field, value, invalid, copy, language, disabled, inputId, onChange }: LinkFieldProps) {
  const current = typeof value === "string" ? value : "";
  const [query, setQuery] = useState(current);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<CustomerLinkOption[]>([]);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const reqRef = useRef(0);

  const listId = `cc-link-list-${field.fieldname}`;
  const optId = useCallback((index: number) => `cc-link-opt-${field.fieldname}-${index}`, [field.fieldname]);

  // Debounced option fetch while the dropdown is open.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const reqId = ++reqRef.current;
      setLoading(true);
      fetchCustomerLinkOptions(field.link_doctype, query, language)
        .then((payload) => {
          if (reqRef.current !== reqId) return;
          setOptions(payload.options ?? []);
          setActive(-1);
        })
        .catch(() => {
          if (reqRef.current === reqId) setOptions([]);
        })
        .finally(() => {
          if (reqRef.current === reqId) setLoading(false);
        });
    }, 180);
    return () => clearTimeout(timer);
  }, [open, query, field.link_doctype, language]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocPointer(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointer);
    return () => document.removeEventListener("mousedown", onDocPointer);
  }, [open]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (active < 0 || !listRef.current) return;
    listRef.current.querySelector<HTMLElement>(`#${optId(active)}`)?.scrollIntoView({ block: "nearest" });
  }, [active, optId]);

  const selectOption = useCallback(
    (option: CustomerLinkOption) => {
      onChange(field.fieldname, option.value);
      setQuery(option.value);
      setOpen(false);
      setActive(-1);
    },
    [field.fieldname, onChange]
  );

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActive((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      if (open && active >= 0 && options[active]) {
        event.preventDefault();
        selectOption(options[active]);
      }
    } else if (event.key === "Escape") {
      if (open) {
        event.stopPropagation();
        setOpen(false);
        setActive(-1);
      }
    }
  }

  const showClear = current !== "" && !disabled;

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <FiSearch
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
        />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
          aria-invalid={invalid || undefined}
          aria-required={field.required || undefined}
          autoComplete="off"
          disabled={disabled}
          value={open ? query : current}
          placeholder={copy.searchPlaceholder}
          onFocus={() => {
            setQuery(current);
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange(field.fieldname, event.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`${INPUT_BASE} ${borderFor(invalid)} pl-9 ${showClear ? "pr-9" : ""}`}
        />
        {showClear ? (
          <button
            type="button"
            aria-label={copy.clearSelection}
            onClick={() => {
              onChange(field.fieldname, "");
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
          >
            <FiX aria-hidden />
          </button>
        ) : null}
      </div>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] p-1 shadow-[0_26px_54px_-24px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
        >
          {loading ? (
            <li className="flex items-center gap-2 px-3 py-2">
              <FiLoader aria-hidden className="animate-spin text-[var(--color-primary)]" />
              <span className={HELPER}>{copy.linkLoading}</span>
            </li>
          ) : null}

          {!loading && options.length === 0 ? (
            <li className="px-3 py-2">
              <span className={HELPER}>{copy.linkNoOptions}</span>
            </li>
          ) : null}

          {!loading
            ? options.map((option, index) => {
                const isActive = index === active;
                const isSelected = option.value === current;
                return (
                  <li key={option.value} id={optId(index)} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => selectOption(option)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${
                        isActive
                          ? "bg-[color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))]"
                          : "hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
                      }`}
                    >
                      <span className="min-w-0 truncate text-[13px] font-medium text-[var(--color-primary)]">
                        {option.label}
                      </span>
                      {isSelected ? <FiCheck aria-hidden className="shrink-0 text-[var(--color-primary)]" /> : null}
                    </button>
                  </li>
                );
              })
            : null}
        </ul>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field row                                                           */
/* ------------------------------------------------------------------ */

interface FieldRowProps {
  field: CustomerFieldMeta;
  value: CustomerFieldValue;
  errorText?: string;
  copy: CustomerCopy;
  language: string;
  disabled?: boolean;
  formKey?: number;
  onChange: (fieldname: string, value: CustomerFieldValue) => void;
}

function FieldRow({ field, value, errorText, copy, language, disabled, formKey, onChange }: FieldRowProps) {
  const inputId = `cc-input-${field.fieldname}`;
  const invalid = Boolean(errorText);
  const traits = inputTraits(field);
  const fullWidth = TEXTAREA_TYPES.has(field.fieldtype);
  const helper = invalid ? "" : traits.helperKind === "mobile" ? copy.mobileHelper : field.description || "";

  let control: React.ReactNode;
  if (field.fieldtype === "Check") {
    control = (
      <button
        type="button"
        role="switch"
        aria-checked={value === true}
        aria-label={field.label}
        disabled={disabled || field.read_only}
        onClick={() => onChange(field.fieldname, !(value === true))}
        className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 transition ${borderFor(invalid)} ${
          value === true
            ? "bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))]"
            : "bg-[var(--color-white)]"
        }`}
      >
        <span
          aria-hidden
          className={`grid h-5 w-5 place-items-center rounded-full transition ${
            value === true ? "bg-[var(--color-primary)] text-[var(--color-white)]" : "bg-[color-mix(in_srgb,var(--color-secondary)_30%,var(--color-white))]"
          }`}
        >
          {value === true ? <FiCheck className="text-[12px]" /> : null}
        </span>
        <span className="text-[12.5px] font-medium text-[var(--color-primary)]">
          {value === true ? copy.yes : copy.no}
        </span>
      </button>
    );
  } else if (field.fieldtype === "Select" && field.options.length > 0 && field.options.length <= SEGMENT_MAX) {
    control = (
      <div role="radiogroup" aria-label={field.label} className="flex flex-wrap gap-2">
        {field.options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled || field.read_only}
              onClick={() => onChange(field.fieldname, option)}
              className={`min-w-[110px] flex-1 rounded-2xl border px-3 py-2 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))]"
                  : "border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] hover:border-[var(--color-primary)]"
              }`}
            >
              <span
                className={`text-[13px] font-semibold ${
                  selected ? "text-[var(--color-primary)]" : "text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]"
                }`}
              >
                {option}
              </span>
            </button>
          );
        })}
      </div>
    );
  } else if (field.fieldtype === "Select") {
    control = (
      <div className="relative">
        <select
          id={inputId}
          value={typeof value === "string" ? value : ""}
          disabled={disabled || field.read_only}
          aria-invalid={invalid || undefined}
          aria-required={field.required || undefined}
          onChange={(event) => onChange(field.fieldname, event.target.value)}
          className={`${INPUT_BASE} ${borderFor(invalid)} appearance-none pr-9`}
        >
          <option value="">{copy.selectPlaceholder}</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <FiChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]"
        />
      </div>
    );
  } else if (field.fieldtype === "Link" || field.fieldtype === "Dynamic Link") {
    control = (
      <LinkField
        key={formKey}
        field={field}
        value={value}
        invalid={invalid}
        copy={copy}
        language={language}
        disabled={disabled || field.read_only}
        inputId={inputId}
        onChange={onChange}
      />
    );
  } else if (TEXTAREA_TYPES.has(field.fieldtype)) {
    control = (
      <textarea
        id={inputId}
        rows={3}
        value={typeof value === "string" ? value : ""}
        readOnly={field.read_only}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-required={field.required || undefined}
        placeholder={field.placeholder ?? ""}
        onChange={(event) => onChange(field.fieldname, event.target.value)}
        className={`${INPUT_BASE} ${borderFor(invalid)} resize-y`}
      />
    );
  } else {
    control = (
      <input
        id={inputId}
        type={traits.type}
        inputMode={traits.inputMode}
        autoComplete={traits.autoComplete}
        value={typeof value === "string" ? value : ""}
        readOnly={field.read_only}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-required={field.required || undefined}
        placeholder={field.placeholder ?? ""}
        onChange={(event) => onChange(field.fieldname, event.target.value)}
        className={`${INPUT_BASE} ${borderFor(invalid)}`}
      />
    );
  }

  return (
    <div id={`cc-field-${field.fieldname}`} className={fullWidth ? "sm:col-span-2" : undefined}>
      <label htmlFor={inputId} className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className={LABEL}>{field.label}</span>
        {field.required ? <span className={REQUIRED_PILL}>{copy.requiredMark}</span> : null}
        {field.read_only ? (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_20%,var(--color-white))] px-1.5 py-0.5 text-[10px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            read-only
          </span>
        ) : null}
      </label>
      {control}
      {errorText ? (
        <p role="alert" className={`mt-1.5 ${ERROR_TEXT}`}>
          {errorText}
        </p>
      ) : helper ? (
        <p className={`mt-1.5 ${HELPER}`}>{helper}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Confirm modal                                                       */
/* ------------------------------------------------------------------ */

interface ConfirmModalProps {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ title, body, confirmLabel, cancelLabel, tone = "default", onConfirm, onCancel }: ConfirmModalProps) {
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
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[19px] text-[var(--color-primary)]">
            <FiAlertCircle aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-[var(--color-primary)]">{title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
              {body}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className={BTN_SECONDARY}>
            <span className="text-[13px] font-semibold text-[var(--color-primary)]">{cancelLabel}</span>
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 transition hover:opacity-90 ${
              tone === "danger" ? "bg-[var(--color-danger)]" : "bg-[var(--color-primary)]"
            }`}
          >
            <span className="text-[13px] font-semibold text-[var(--color-white)]">{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header({
  copy,
  onBack,
  heading,
  hint,
}: {
  copy: CustomerCopy;
  onBack: () => void;
  heading?: string;
  hint?: string;
}) {
  return (
    <header className={HEADER_CARD}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] text-[22px] text-[var(--color-primary)]">
            <FiUserPlus aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-[19px] font-bold tracking-[-0.01em] text-[var(--color-primary)] sm:text-[22px]">
              {heading ?? copy.heading}
            </h1>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)] sm:text-[13.5px]">
              {hint ?? copy.hint}
            </p>
            <p className={`mt-1.5 inline-flex items-center gap-1.5 ${HELPER}`}>
              <FiInfo aria-hidden />
              <span>{copy.requiredNote}</span>
            </p>
          </div>
        </div>
        <button type="button" onClick={onBack} aria-label={copy.back} className={`${BTN_SECONDARY} shrink-0 px-3`}>
          <FiArrowLeft aria-hidden className="text-[var(--color-primary)]" />
          <span className="hidden text-[13px] font-semibold text-[var(--color-primary)] sm:inline">{copy.back}</span>
        </button>
      </div>

      {copy.quickInfo.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] pt-3">
          {copy.quickInfo.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] px-2.5 py-1 text-[11px] font-medium text-[color-mix(in_srgb,var(--color-primary)_68%,transparent)]"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Success card                                                        */
/* ------------------------------------------------------------------ */

function SuccessCard({
  result,
  values,
  copy,
  mode,
  onAnother,
  onBack,
}: {
  result: CustomerCreateResult;
  values: CustomerFormValues;
  copy: CustomerCopy;
  mode: "create" | "edit";
  onAnother?: () => void;
  onBack: () => void;
}) {
  const contact = [values.mobile_no, values.email_id]
    .filter((entry): entry is string => typeof entry === "string" && entry.trim() !== "")
    .join(" · ");

  const rows: Array<[string, string]> = [
    [copy.idLabel, result.name],
    result.customer_type ? [copy.typeLabel, result.customer_type] : null,
    result.customer_group ? [copy.groupLabel, result.customer_group] : null,
    result.territory ? [copy.territoryLabel, result.territory] : null,
    contact ? [copy.contactLabel, contact] : null,
  ].filter((row): row is [string, string] => Boolean(row && row[1]));

  return (
    <section className="rounded-[24px] border border-[color-mix(in_srgb,var(--color-success)_32%,transparent)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-success)_9%,var(--color-white)),var(--color-white)_62%)] p-5 shadow-[0_22px_50px_-30px_color-mix(in_srgb,var(--color-success)_60%,transparent)] sm:p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-success)_18%,var(--color-white))] text-[28px] text-[var(--color-success)]">
          <FiCheckCircle aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[var(--color-primary)]">
            {mode === "edit" ? copy.updatedTitle : copy.createdTitle}
          </h2>
          {result.customer_name ? (
            <p className="mt-0.5 text-[14px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_82%,transparent)]">
              {result.customer_name}
            </p>
          ) : null}
          <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.createdName(result.name)}
          </p>
          {result.verified ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-white))] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--color-success)]">
              <FiCheck aria-hidden />
              {copy.verifiedLabel}
            </p>
          ) : null}
        </div>
      </div>

      {rows.length > 0 ? (
        <dl className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 bg-[var(--color-white)] px-4 py-3">
              <dt className="text-[11.5px] font-medium uppercase tracking-[0.05em] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                {label}
              </dt>
              <dd className="min-w-0 truncate text-right text-[13px] font-semibold text-[var(--color-primary)]">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onBack} className={BTN_SECONDARY}>
          <FiArrowLeft aria-hidden className="text-[var(--color-primary)]" />
          <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.back}</span>
        </button>
        {mode === "create" && onAnother ? (
          <button type="button" onClick={onAnother} className={BTN_PRIMARY}>
            <FiUserPlus aria-hidden className="text-[var(--color-white)]" />
            <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.createAnother}</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Loading / failure / permission states                               */
/* ------------------------------------------------------------------ */

function LoadingView({ copy }: { copy: CustomerCopy }) {
  return (
    <div className={PAGE} aria-busy="true" aria-live="polite">
      <div className="h-[132px] animate-pulse rounded-[24px] border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]" />
      {[0, 1].map((index) => (
        <div key={index} className={CARD}>
          <div className="h-5 w-40 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))]" />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((cell) => (
              <div key={cell} className="space-y-2">
                <div className="h-3.5 w-24 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))]" />
                <div className="h-11 animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">{copy.loading}</span>
    </div>
  );
}

function StateCard({
  icon,
  iconTone = "primary",
  title,
  body,
  actions,
}: {
  icon: React.ReactNode;
  iconTone?: "primary" | "danger";
  title: string;
  body?: string;
  actions: React.ReactNode;
}) {
  return (
    <section className={CARD}>
      <div className="flex flex-col items-start gap-3">
        <span
          className={`grid h-12 w-12 place-items-center rounded-2xl text-[22px] ${
            iconTone === "danger"
              ? "bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--color-white))] text-[var(--color-danger-strong)]"
              : "bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]"
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[var(--color-primary)]">{title}</h2>
          {body ? (
            <p className="mt-1 text-[12.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
              {body}
            </p>
          ) : null}
        </div>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap">{actions}</div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Main view                                                           */
/* ------------------------------------------------------------------ */

interface CreateCustomerViewProps {
  onBack: () => void;
  /** When set, the form edits this owned Customer instead of creating one. */
  editName?: string;
}

export default function CreateCustomerView({ onBack, editName }: CreateCustomerViewProps) {
  const { language } = useLanguage();
  const copy = useMemo(() => customerCopyFor(language), [language]);
  const isEdit = Boolean(editName);

  const [schema, setSchema] = useState<CustomerSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ code: string; message: string } | null>(null);
  const [values, setValues] = useState<CustomerFormValues>({});
  const [initial, setInitial] = useState<CustomerFormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CustomerCreateResult | null>(null);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  // Bumped on reset so link fields remount with fresh (cleared) internal state.
  const [formKey, setFormKey] = useState(0);

  const createdRef = useRef<CustomerCreateResult | null>(null);
  const autoFocusRef = useRef(false);

  useEffect(() => {
    createdRef.current = created;
  }, [created]);

  const isDirty = useMemo(() => !valuesEqual(values, initial), [values, initial]);
  const firstRequired = useMemo(() => (schema ? firstRequiredField(schema) : null), [schema]);

  const focusField = useCallback((fieldname: string, scroll = true) => {
    requestAnimationFrame(() => {
      const wrap = document.getElementById(`cc-field-${fieldname}`);
      if (!wrap) return;
      if (scroll) wrap.scrollIntoView({ behavior: "smooth", block: "center" });
      const control = wrap.querySelector<HTMLElement>(
        "input, select, textarea, [role='radio'], [role='switch']"
      );
      control?.focus({ preventScroll: !scroll });
    });
  }, []);

  /* --- schema load (with draft hydration / edit prefill) --- */
  // NOTE: no synchronous setState before the first await — keeps the effect
  // clean under react-hooks/set-state-in-effect (see the retry handler below
  // for the explicit reload path, where setState in an event handler is fine).
  const loadSchema = useCallback(async () => {
    try {
      const data = await fetchCustomerSchema(language);
      const base = buildInitialValues(data);

      if (editName) {
        // Edit mode: prefill every editable field from the owned document.
        const details = await fetchCustomerDetails(editName, language);
        const merged: CustomerFormValues = { ...base };
        for (const section of data.sections) {
          for (const field of section.fields) {
            if (Object.prototype.hasOwnProperty.call(details.values ?? {}, field.fieldname)) {
              merged[field.fieldname] = coerceValue(details.values[field.fieldname], field.fieldtype);
            }
          }
        }
        setSchema(data);
        setInitial(merged);
        setValues(merged);
        setErrors({});
        setCreated(null);
        return;
      }

      const draft = readDraft();
      let next = base;
      if (draft) {
        const merged: CustomerFormValues = { ...base };
        let restored = false;
        for (const key of Object.keys(base)) {
          const draftValue = draft[key];
          if (typeof draftValue === "string" && draftValue !== "" && draftValue !== base[key]) {
            merged[key] = draftValue;
            restored = true;
          }
        }
        if (restored) {
          next = merged;
          toast.info(copy.draftRestored);
        }
      }
      setSchema(data);
      setInitial(base);
      setValues(next);
      setErrors({});
      setCreated(null);
    } catch (error) {
      const failure = error as { code?: string; message?: string };
      setLoadError({ code: failure?.code || "error", message: failure?.message || copy.loadFailed });
    } finally {
      setLoading(false);
    }
  }, [language, editName, copy.draftRestored, copy.loadFailed]);

  const retry = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    void loadSchema();
  }, [loadSchema]);

  useEffect(() => {
    // Kick the async load off the effect's synchronous path so the body stays
    // free of setState (react-hooks/set-state-in-effect); all state writes in
    // loadSchema happen inside its promise callbacks.
    const timer = setTimeout(() => {
      void loadSchema();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSchema]);

  /* --- autofocus the first required editable field (create only) --- */
  useEffect(() => {
    if (isEdit) return;
    if (!schema || loading || created || autoFocusRef.current) return;
    autoFocusRef.current = true;
    if (!firstRequired) return;
    const timer = setTimeout(() => focusField(firstRequired, false), 80);
    return () => clearTimeout(timer);
  }, [isEdit, schema, loading, created, firstRequired, focusField]);

  /* --- draft persistence (create only) --- */
  useEffect(() => {
    if (isEdit || !schema || createdRef.current) return;
    if (isDirty) writeDraft(values);
    else clearDraft();
  }, [isEdit, values, isDirty, schema]);

  /* --- tab-close / refresh guard --- */
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (createdRef.current || !isDirty) return;
      event.preventDefault();
      event.returnValue = "";
      return "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const setValue = useCallback((fieldname: string, value: CustomerFieldValue) => {
    setValues((prev) => ({ ...prev, [fieldname]: value }));
    setErrors((prev) => {
      if (!prev[fieldname]) return prev;
      const next = { ...prev };
      delete next[fieldname];
      return next;
    });
  }, []);

  const validate = useCallback((): Record<string, string> => {
    if (!schema) return {};
    const found: Record<string, string> = {};
    for (const section of schema.sections) {
      for (const field of section.fields) {
        if (field.read_only || !field.required) continue;
        if (isBlank(values[field.fieldname])) found[field.fieldname] = copy.missingRequired(field.label);
      }
    }
    return found;
  }, [schema, values, copy]);

  const handleSubmit = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      if (submitting || createdRef.current) return;

      const found = validate();
      if (Object.keys(found).length > 0) {
        setErrors(found);
        const order = schema?.sections.flatMap((section) => section.fields.map((field) => field.fieldname)) ?? [];
        const firstInvalid = order.find((fieldname) => found[fieldname]) ?? Object.keys(found)[0];
        const firstLabel = schema?.sections
          .flatMap((section) => section.fields)
          .find((field) => field.fieldname === firstInvalid)?.label;
        if (firstInvalid) focusField(firstInvalid);
        toast.error(firstLabel ? copy.missingRequired(firstLabel) : copy.validationTitle, copy.validationTitle);
        return;
      }

      setSubmitting(true);
      try {
        const result =
          isEdit && editName
            ? await updateCustomer(editName, values, language)
            : await createCustomer(values, language);
        setCreated(result);
        createdRef.current = result;
        clearDraft();
        toast.success(
          copy.successBody(result.name),
          isEdit ? copy.updateSuccessTitle : copy.successTitle
        );
      } catch (error) {
        const failure = error as { code?: string; message?: string };
        const message = failure?.message || copy.loadFailed;
        if (isDuplicateError(message)) {
          toast.error(message, copy.duplicateTitle);
        } else if (isPermissionRefusal(failure?.code, message)) {
          setLoadError({ code: failure?.code || "not_permitted", message });
        } else {
          toast.error(message, copy.errorTitle);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, validate, schema, copy, focusField, values, language, isEdit, editName]
  );

  const resetForm = useCallback(
    (focus: boolean) => {
      setValues(initial);
      setErrors({});
      setCreated(null);
      createdRef.current = null;
      clearDraft();
      setFormKey((key) => key + 1);
      if (focus && !isEdit && firstRequired) focusField(firstRequired);
    },
    [initial, firstRequired, focusField, isEdit]
  );

  const requestReset = useCallback(() => {
    if (isDirty) {
      setShowResetConfirm(true);
      return;
    }
    resetForm(false);
  }, [isDirty, resetForm]);

  const guardedBack = useCallback(() => {
    if (createdRef.current || !isDirty) {
      onBack();
      return;
    }
    setShowUnsaved(true);
  }, [isDirty, onBack]);

  /* -------------------- render -------------------- */

  if (loading) {
    return (
      <div className={PAGE}>
        <LoadingView copy={copy} />
      </div>
    );
  }

  const isAuth = loadError?.code === "not_authenticated";
  const isPermission = loadError ? isPermissionRefusal(loadError.code, loadError.message) : false;

  if (loadError) {
    return (
      <div className={PAGE}>
        <Header copy={copy} onBack={onBack} heading={isEdit ? copy.editHeading : undefined} hint={isEdit ? copy.editHint : undefined} />
        {isPermission ? (
          <StateCard
            icon={<FiLock aria-hidden />}
            title={copy.permissionTitle}
            body={copy.permissionHint}
            actions={
              <button type="button" onClick={onBack} className={BTN_SECONDARY}>
                <FiArrowLeft aria-hidden className="text-[var(--color-primary)]" />
                <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.back}</span>
              </button>
            }
          />
        ) : (
          <StateCard
            icon={<FiAlertCircle aria-hidden />}
            iconTone="danger"
            title={isAuth ? copy.sessionExpiredTitle : copy.errorTitle}
            body={isAuth ? loadError.message : loadError.message || copy.loadFailed}
            actions={
              <>
                <button type="button" onClick={retry} className={BTN_SECONDARY}>
                  <FiRefreshCw aria-hidden className="text-[var(--color-primary)]" />
                  <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.retry}</span>
                </button>
                {isAuth ? (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
                    }}
                    className={BTN_PRIMARY}
                  >
                    <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.signInAgain}</span>
                  </button>
                ) : null}
              </>
            }
          />
        )}
      </div>
    );
  }

  if (!schema) {
    return (
      <div className={PAGE}>
        <Header copy={copy} onBack={onBack} heading={isEdit ? copy.editHeading : undefined} hint={isEdit ? copy.editHint : undefined} />
        <StateCard icon={<FiInfo aria-hidden />} title={copy.empty} actions={null} />
      </div>
    );
  }

  if (created) {
    return (
      <div className={PAGE}>
        <Header copy={copy} onBack={guardedBack} heading={isEdit ? copy.editHeading : undefined} hint={isEdit ? copy.editHint : undefined} />
        <SuccessCard
          result={created}
          values={values}
          copy={copy}
          mode={isEdit ? "edit" : "create"}
          onAnother={isEdit ? undefined : () => resetForm(true)}
          onBack={onBack}
        />
      </div>
    );
  }

  const sections = schema.sections.filter((section) => section.fields.length > 0);
  const Heading = isEdit ? copy.editHeading : undefined;
  const Hint = isEdit ? copy.editHint : undefined;

  return (
    <div className={PAGE}>
      <Header copy={copy} onBack={guardedBack} heading={Heading} hint={Hint} />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {sections.map((section) => {
          const SectionIcon = SECTION_ICON[section.key] ?? FiTag;
          const label = copy.sectionLabels[section.label] || section.label;
          const help = copy.sectionHelp[section.label];
          return (
            <section key={section.key} className={CARD}>
              <div className="mb-4 flex items-start gap-3">
                <span className={ICON_TILE}>
                  <SectionIcon aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[13.5px] font-semibold text-[var(--color-primary)]">{label}</h3>
                  {help ? (
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                      {help}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mb-4 h-px w-full bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <FieldRow
                    key={field.fieldname}
                    field={field}
                    value={values[field.fieldname]}
                    errorText={errors[field.fieldname]}
                    copy={copy}
                    language={language}
                    disabled={submitting}
                    formKey={formKey}
                    onChange={setValue}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <div className={ACTIONS_CARD}>
          <button type="button" onClick={requestReset} disabled={submitting} className={BTN_SECONDARY}>
            <FiRotateCcw aria-hidden className="text-[var(--color-primary)]" />
            <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.reset}</span>
          </button>
          <button type="submit" disabled={submitting} className={BTN_PRIMARY} aria-busy={submitting}>
            {submitting ? (
              <>
                <FiLoader aria-hidden className="animate-spin text-[var(--color-white)]" />
                <span className="text-[13px] font-semibold text-[var(--color-white)]">
                  {isEdit ? copy.submittingEdit : copy.submitting}
                </span>
              </>
            ) : (
              <>
                {isEdit ? (
                  <FiEdit2 aria-hidden className="text-[var(--color-white)]" />
                ) : (
                  <FiUserPlus aria-hidden className="text-[var(--color-white)]" />
                )}
                <span className="text-[13px] font-semibold text-[var(--color-white)]">
                  {isEdit ? copy.submitEdit : copy.submit}
                </span>
              </>
            )}
          </button>
        </div>
      </form>

      {showUnsaved ? (
        <ConfirmModal
          title={copy.unsavedTitle}
          body={copy.unsavedBody}
          confirmLabel={copy.unsavedLeave}
          cancelLabel={copy.unsavedStay}
          tone="danger"
          onConfirm={() => {
            setShowUnsaved(false);
            onBack();
          }}
          onCancel={() => setShowUnsaved(false)}
        />
      ) : null}

      {showResetConfirm ? (
        <ConfirmModal
          title={copy.resetConfirmTitle}
          body={copy.resetConfirmBody}
          confirmLabel={copy.resetConfirmYes}
          cancelLabel={copy.resetConfirmNo}
          tone="danger"
          onConfirm={() => {
            setShowResetConfirm(false);
            resetForm(true);
          }}
          onCancel={() => setShowResetConfirm(false)}
        />
      ) : null}
    </div>
  );
}
