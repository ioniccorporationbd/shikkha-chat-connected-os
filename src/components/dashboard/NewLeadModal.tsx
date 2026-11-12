"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

import DashboardModal from "@/components/dashboard/DashboardModal";
import DashboardSelect from "@/components/dashboard/DashboardSelect";
import { ApiError } from "@/lib/api/http";
import { createLead, fetchLeadFormOptions } from "@/lib/leads/api";
import { leadsCopyFor } from "@/lib/leads/messages";
import type { LeadFormOptions, NewLeadCreated, NewLeadDraft } from "@/lib/leads/types";
import { reportClientError } from "@/lib/log/report-error";
import { toast } from "@/lib/ui/toast";

/** Shared input styling (layout only; readable copy lives on the label span). */
const FIELD_CLASS =
  "w-full rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)] outline-none transition focus:border-[color-mix(in_srgb,var(--color-action)_50%,transparent)] focus:bg-[var(--color-white)] focus:ring-2 focus:ring-[var(--color-action-ring)] disabled:cursor-not-allowed";

const LABEL_CLASS =
  "text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_75%,transparent)]";

const EMPTY_DRAFT: NewLeadDraft = {
  salutation: "",
  firstName: "",
  lastName: "",
  email: "",
  mobileNo: "",
  gender: "",
  organization: "",
  website: "",
  noOfEmployees: "1-10",
  territory: "",
  annualRevenue: "0",
  industry: "",
  companyDescription: "",
  status: "New",
  leadOwner: "",
};

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

function FormField({
  label,
  required,
  requiredMark,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  requiredMark?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <span className={LABEL_CLASS}>
        {label}
        {required ? (
          <span className="ml-0.5 text-[color-mix(in_srgb,var(--color-action)_85%,transparent)]">
            {requiredMark ?? "*"}
          </span>
        ) : null}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint ? (
        <p className="mt-1 text-[11px] leading-snug text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface NewLeadModalProps {
  open: boolean;
  language: string;
  onClose: () => void;
  /** Fired after a successful create so the list can refresh + the modal close. */
  onCreated: (lead: NewLeadCreated) => void;
}

/**
 * The portal "New Lead" form — a Desk-parity CRM Lead creator launched from the
 * leads page's top-right toolbar (next to Refresh).
 *
 * Field set / defaults are fixed by spec: Salutation, First/Last Name, Email,
 * Mobile, Gender, Organization, Website, No. of Employees (default 1-10),
 * Territory, Annual Revenue, Industry, Company Description, Status (default
 * New) and Lead Owner (Active employees loaded from HR). Submission inserts a
 * real `CRM Lead`, so the row appears in Desk ▸ CRM ▸ Leads.
 */
export default function NewLeadModal({ open, language, onClose, onCreated }: NewLeadModalProps) {
  const copy = leadsCopyFor(language).newLead;

  const [options, setOptions] = useState<LeadFormOptions | null>(null);
  const [optionsErr, setOptionsErr] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [form, setForm] = useState<NewLeadDraft>({ ...EMPTY_DRAFT });
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  // Loading is derived: no options yet and no error means the fetch is in
  // flight. This keeps the effect body free of synchronous setState (React 19).
  const loadingOptions = options === null && optionsErr === null;

  // Load the dropdowns whenever the modal opens (or a retry bumps reloadKey).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const opts = await fetchLeadFormOptions(language);
        if (cancelled) return;
        setOptions(opts);
        setForm({
          ...EMPTY_DRAFT,
          noOfEmployees: opts.defaultEmployees || "1-10",
          status: opts.defaultStatus || "New",
          leadOwner: opts.defaultOwner || "",
        });
      } catch (err) {
        if (cancelled) return;
        setOptionsErr(copy.loadOptionsFailed);
        console.error("[leads] lead_form_options failed", err);
        reportClientError({
          scope: "leads:create",
          message: copy.loadOptionsFailed,
          detail: err instanceof Error ? err.stack : String(err),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, language, reloadKey, copy.loadOptionsFailed]);

  // Retry from the error state (event handler — state writes here are fine).
  const retryOptions = () => {
    setOptionsErr(null);
    setOptions(null);
    setReloadKey((k) => k + 1);
  };

  // Close + reset so a later open starts clean (event handler).
  const handleClose = () => {
    setOptions(null);
    setOptionsErr(null);
    setSubmitErr(null);
    setForm({ ...EMPTY_DRAFT });
    onClose();
  };

  const set = (key: keyof NewLeadDraft) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit() {
    if (submitting) return;
    if (!form.firstName.trim()) {
      setSubmitErr(copy.firstNameRequired);
      return;
    }
    if (!form.status) {
      setSubmitErr(copy.statusRequired);
      return;
    }
    setSubmitting(true);
    setSubmitErr(null);
    try {
      const { lead } = await createLead(form, language);
      toast.success(copy.created);
      // Reset so the next open starts clean (options null → spinner refetch).
      setOptions(null);
      setOptionsErr(null);
      setSubmitErr(null);
      setForm({ ...EMPTY_DRAFT });
      onCreated(lead);
    } catch (err) {
      const message = err instanceof ApiError && err.message ? err.message : copy.createFailed;
      setSubmitErr(message);
      console.error("[leads] create_lead failed", err);
      reportClientError({
        scope: "leads:create",
        message,
        detail: err instanceof Error ? err.stack : String(err),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const selectOpts = (list: string[]) => list.map((value) => ({ value, label: value }));
  const disabled = loadingOptions || !options;

  return (
    <DashboardModal
      open={open}
      title={copy.title}
      closeLabel={copy.close}
      onClose={submitting ? () => {} : handleClose}
      widthClass="max-w-[760px]"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-4 py-2.5 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)] disabled:opacity-60"
          >
            <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.cancel}</span>
          </button>
          <button
            type="button"
            data-new-lead-submit
            onClick={handleSubmit}
            disabled={submitting || disabled}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 shadow-[0_14px_30px_-16px_color-mix(in_srgb,var(--color-action)_80%,transparent)] transition hover:bg-[var(--color-action-hover)] disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]">
              {submitting ? (
                <>
                  <Spinner className="h-3.5 w-3.5" />
                  {copy.creating}
                </>
              ) : (
                copy.create
              )}
            </span>
          </button>
        </>
      }
    >
      {loadingOptions ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Spinner className="h-7 w-7 text-[var(--color-action)]" />
          <p className="text-[13px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            {copy.loadingOptions}
          </p>
        </div>
      ) : optionsErr || !options ? (
        <div
          data-new-lead-error
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-action)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-5 py-10 text-center"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-action)_12%,transparent)] text-[var(--color-action)]">
            <FiAlertCircle size={20} />
          </span>
          <p className="text-[13px] text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
            {optionsErr || copy.loadOptionsFailed}
          </p>
          <button
            type="button"
            onClick={retryOptions}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-3 py-1.5 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)]"
          >
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-primary)]">
              <FiRefreshCw size={13} />
              {copy.retry}
            </span>
          </button>
        </div>
      ) : (
        <div data-new-lead-form className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {submitErr ? (
            <div
              data-new-lead-error
              className="flex items-start gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-action)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-action)_8%,var(--color-white))] px-3.5 py-2.5 sm:col-span-3"
            >
              <span className="mt-0.5 shrink-0 text-[var(--color-action)]">
                <FiAlertCircle size={15} />
              </span>
              <span className="text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_80%,transparent)]">
                {submitErr}
              </span>
            </div>
          ) : null}

          <FormField label={copy.fields.salutation}>
            <DashboardSelect
              value={form.salutation}
              onChange={set("salutation")}
              options={selectOpts(options.salutations)}
              placeholder={copy.placeholders.salutation}
              ariaLabel={copy.fields.salutation}
              className="w-full"
            />
          </FormField>

          <FormField label={copy.fields.firstName} required requiredMark={copy.requiredMark}>
            <input
              className={FIELD_CLASS}
              value={form.firstName}
              onChange={(e) => set("firstName")(e.target.value)}
              placeholder={copy.placeholders.firstName}
              autoComplete="off"
              data-new-lead-field="firstName"
            />
          </FormField>

          <FormField label={copy.fields.lastName}>
            <input
              className={FIELD_CLASS}
              value={form.lastName}
              onChange={(e) => set("lastName")(e.target.value)}
              placeholder={copy.placeholders.lastName}
              autoComplete="off"
            />
          </FormField>

          <FormField label={copy.fields.email}>
            <input
              type="email"
              className={FIELD_CLASS}
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder={copy.placeholders.email}
              autoComplete="off"
            />
          </FormField>

          <FormField label={copy.fields.mobileNo}>
            <input
              type="tel"
              className={FIELD_CLASS}
              value={form.mobileNo}
              onChange={(e) => set("mobileNo")(e.target.value)}
              placeholder={copy.placeholders.mobileNo}
              autoComplete="off"
            />
          </FormField>

          <FormField label={copy.fields.gender}>
            <DashboardSelect
              value={form.gender}
              onChange={set("gender")}
              options={selectOpts(options.genders)}
              placeholder={copy.placeholders.gender}
              ariaLabel={copy.fields.gender}
              className="w-full"
            />
          </FormField>

          <div className="hidden h-px w-full bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] sm:col-span-3 sm:block" />

          <FormField label={copy.fields.organization}>
            <input
              className={FIELD_CLASS}
              value={form.organization}
              onChange={(e) => set("organization")(e.target.value)}
              placeholder={copy.placeholders.organization}
              autoComplete="off"
            />
          </FormField>

          <FormField label={copy.fields.website}>
            <input
              type="url"
              className={FIELD_CLASS}
              value={form.website}
              onChange={(e) => set("website")(e.target.value)}
              placeholder={copy.placeholders.website}
              autoComplete="off"
            />
          </FormField>

          <FormField label={copy.fields.noOfEmployees}>
            <DashboardSelect
              value={form.noOfEmployees}
              onChange={set("noOfEmployees")}
              options={selectOpts(options.employeeRanges)}
              placeholder={copy.placeholders.noOfEmployees}
              ariaLabel={copy.fields.noOfEmployees}
              className="w-full"
            />
          </FormField>

          <FormField label={copy.fields.territory}>
            <input
              className={FIELD_CLASS}
              value={form.territory}
              onChange={(e) => set("territory")(e.target.value)}
              placeholder={copy.placeholders.territory}
              autoComplete="off"
            />
          </FormField>

          <FormField label={copy.fields.annualRevenue}>
            <span className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                ৳
              </span>
              <input
                inputMode="decimal"
                className={`${FIELD_CLASS} pl-11`}
                value={form.annualRevenue}
                onChange={(e) => set("annualRevenue")(e.target.value)}
                placeholder={copy.placeholders.annualRevenue}
                data-new-lead-field="annualRevenue"
              />
            </span>
          </FormField>

          <FormField label={copy.fields.industry}>
            <input
              className={FIELD_CLASS}
              value={form.industry}
              onChange={(e) => set("industry")(e.target.value)}
              placeholder={copy.placeholders.industry}
              autoComplete="off"
            />
          </FormField>

          <FormField
            label={copy.fields.companyDescription}
            hint={copy.descriptionHint}
            className="sm:col-span-3"
          >
            <textarea
              className={`${FIELD_CLASS} min-h-[92px] resize-y`}
              value={form.companyDescription}
              onChange={(e) => set("companyDescription")(e.target.value)}
              placeholder={copy.placeholders.companyDescription}
              rows={3}
            />
          </FormField>

          <div className="hidden h-px w-full bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] sm:col-span-3 sm:block" />

          <FormField label={copy.fields.status} required requiredMark={copy.requiredMark}>
            <DashboardSelect
              value={form.status}
              onChange={set("status")}
              options={options.statuses.map((s) => ({ value: s.value, label: s.label, color: s.color }))}
              placeholder={copy.placeholders.status}
              ariaLabel={copy.fields.status}
              className="w-full"
            />
          </FormField>

          <FormField label={copy.fields.leadOwner}>
            <DashboardSelect
              value={form.leadOwner}
              onChange={set("leadOwner")}
              options={options.leadOwners.map((o) => ({
                value: o.value,
                label: o.label,
                avatar: (o.label || o.value).trim().charAt(0).toUpperCase(),
              }))}
              placeholder={copy.placeholders.leadOwner}
              ariaLabel={copy.fields.leadOwner}
              className="w-full"
            />
          </FormField>
        </div>
      )}
    </DashboardModal>
  );
}
