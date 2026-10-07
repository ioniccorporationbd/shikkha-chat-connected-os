"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiAlertCircle, FiFileText, FiInfo, FiSend, FiUpload, FiX, FiZap } from "react-icons/fi";

import DashboardSelect from "@/components/dashboard/DashboardSelect";
import { useAuthStore } from "@/lib/auth/store";
import {
  DEFAULT_CATEGORY,
  DEFAULT_PRIORITY,
  HD_CARD,
  HD_INPUT,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  PRIORITY_TONE,
} from "@/lib/help-desk/config";
import { formatFileSize } from "@/lib/help-desk/format";
import { MIN_DESCRIPTION_LENGTH, type HelpDeskCopy } from "@/lib/help-desk/messages";
import { uid } from "@/lib/help-desk/mock-store";
import { helpDeskLinks } from "@/lib/help-desk/paths";
import { createTicket, ownerKeyForContact } from "@/lib/help-desk/service";
import type {
  PreferredContact,
  Ticket,
  TicketAttachment,
  TicketCategoryId,
  TicketPriority,
} from "@/lib/help-desk/types";
import { toast } from "@/lib/ui/toast";

import { DEMO_FORM_SAMPLES, HELPDESK_DEPARTMENTS, isHelpDeskDemoEnabled, type HelpDeskDepartment } from "@/lib/help-desk/demo";

import TicketSuccessCard from "./TicketSuccessCard";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTACHMENTS = 3;

type FieldErrors = Partial<Record<"name" | "email" | "subject" | "description", string>>;

/** The New Ticket form: basic info → ticket info → optional extras. */
export default function CreateTicketForm({
  copy,
  language,
  basePath,
  initialContact,
}: {
  copy: HelpDeskCopy;
  language: string;
  basePath?: string;
  initialContact?: { name?: string; email?: string; mobile?: string };
}) {
  const router = useRouter();
  const links = helpDeskLinks(basePath);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategoryId>(DEFAULT_CATEGORY);
  const [priority, setPriority] = useState<TicketPriority>(DEFAULT_PRIORITY);
  const [description, setDescription] = useState("");
  const [relatedRoute, setRelatedRoute] = useState("");
  const [preferredContact, setPreferredContact] = useState<PreferredContact>("email");
  const [department, setDepartment] = useState<HelpDeskDepartment | "">("");
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Ticket | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefilled = useRef(false);

  // Prefill name/email from the signed-in profile, once, when the session lands.
  // setState is deferred to a microtask so it never runs synchronously inside
  // the effect body (house pattern — see PaymentEntryView).
  useEffect(() => {
    if (prefilled.current) return;
    prefilled.current = true;
    queueMicrotask(() => {
      setName((current) => current || initialContact?.name || user?.full_name || user?.name || "");
      setEmail((current) => current || initialContact?.email || user?.email || "");
      setMobile((current) => current || initialContact?.mobile || "");
    });
  }, [status, user, initialContact]);

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: TicketAttachment[] = [...attachments];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_ATTACHMENTS) break;
      next.push({
        id: uid("att"),
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      });
    }
    setAttachments(next);
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => {
      const target = current.find((a) => a.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((a) => a.id !== id);
    });
  };

  // Dev/test aid: fill the form with a ready-made sample. Never auto-submits and
  // never runs on open — only on an explicit click, and only while demo is on.
  const fillDemo = () => {
    const sample = DEMO_FORM_SAMPLES[Math.floor(Math.random() * DEMO_FORM_SAMPLES.length)];
    setSubject(sample.subject);
    setCategory(sample.category);
    setPriority(sample.priority);
    setDepartment(sample.department);
    setDescription(sample.description);
    setRelatedRoute(sample.relatedRoute);
    setErrors({});
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = copy.errRequired;
    if (!email.trim()) next.email = copy.errRequired;
    else if (!EMAIL_RE.test(email.trim())) next.email = copy.errEmail;
    if (!subject.trim()) next.subject = copy.errRequired;
    if (description.trim().length < MIN_DESCRIPTION_LENGTH) next.description = copy.errDescriptionShort;
    return next;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);

    if (Object.keys(found).length > 0) {
      const first = found.description ?? found.subject ?? found.email ?? found.name;
      toast.error(first || copy.toastValidation);
      return;
    }

    setSubmitting(true);
    try {
      const ownerKey =
        status === "authenticated" && user
          ? ownerKeyForContact({ email: user.email, name: user.full_name })
          : undefined;

      const ticket = await createTicket(
        {
          subject,
          category,
          priority,
          description,
          contact: { name, email, mobile, preferredContact },
          relatedRoute,
          department: department || undefined,
          attachments,
        },
        ownerKey,
      );

      setCreated(ticket);
      toast.success(copy.toastCreated.replace("{id}", ticket.id));
    } catch {
      toast.error(copy.toastLoadFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCreated(null);
    setSubject("");
    setDescription("");
    setRelatedRoute("");
    setAttachments([]);
    setErrors({});
    setCategory(DEFAULT_CATEGORY);
    setPriority(DEFAULT_PRIORITY);
    setPreferredContact("email");
    setDepartment("");
    // Keep name/email (identity), keep mobile.
  };

  if (created) {
    return <TicketSuccessCard ticket={created} copy={copy} language={language} basePath={basePath} onAnother={resetForm} />;
  }

  const descriptionLeft = Math.max(0, MIN_DESCRIPTION_LENGTH - description.trim().length);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {isHelpDeskDemoEnabled() ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_28%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))] px-4 py-3">
          <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-white)]">
            {copy.demoBadge}
          </span>
          <button
            type="button"
            onClick={fillDemo}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-primary)] px-3 py-1.5 transition hover:bg-[var(--color-action-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
          >
            <FiZap className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden />
            <span className="text-xs font-semibold text-[var(--color-primary)]">{copy.demoFill}</span>
          </button>
        </div>
      ) : null}

      {/* Basic information */}
      <fieldset className={`${HD_CARD} p-5 sm:p-6`}>
        <legend className="px-1 text-base font-bold text-[var(--color-primary)]">{copy.sectionBasic}</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label={copy.fieldName} error={errors.name} htmlFor="hd-name">
            <input
              id="hd-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={copy.phName}
              className={HD_INPUT}
              autoComplete="name"
            />
          </Field>
          <Field label={copy.fieldEmail} error={errors.email} htmlFor="hd-email">
            <input
              id="hd-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={copy.phEmail}
              className={HD_INPUT}
              autoComplete="email"
            />
          </Field>
          <Field label={copy.fieldMobile} error={undefined} htmlFor="hd-mobile">
            <input
              id="hd-mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder={copy.phMobile}
              className={HD_INPUT}
              autoComplete="tel"
            />
          </Field>
        </div>
      </fieldset>

      {/* Ticket information */}
      <fieldset className={`${HD_CARD} p-5 sm:p-6`}>
        <legend className="px-1 text-base font-bold text-[var(--color-primary)]">{copy.sectionTicket}</legend>

        <div className="mt-3 space-y-5">
          <Field label={copy.fieldSubject} error={errors.subject} htmlFor="hd-subject">
            <input
              id="hd-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={copy.phSubject}
              className={HD_INPUT}
            />
          </Field>

          {/* Category */}
          <div>
            <p className="mb-2 text-xs font-semibold text-[var(--color-primary)]">{copy.fieldCategory}</p>
            <div role="radiogroup" aria-label={copy.fieldCategory} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TICKET_CATEGORIES.map((option) => {
                const selected = category === option.id;
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setCategory(option.id)}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] ${
                      selected
                        ? "border-[var(--color-action)] bg-[var(--color-action)]"
                        : "border-[color-mix(in_srgb,var(--color-primary)_20%,var(--color-white))] bg-[var(--color-white)] hover:bg-[var(--color-action-tint)]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 flex-none ${selected ? "text-[var(--color-white)]" : "text-[var(--color-primary)]"}`} aria-hidden />
                    <span className={`text-sm font-semibold ${selected ? "text-[var(--color-white)]" : "text-[var(--color-primary)]"}`}>{copy.categories[option.id]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <p className="mb-2 text-xs font-semibold text-[var(--color-primary)]">{copy.fieldPriority}</p>
            <div role="radiogroup" aria-label={copy.fieldPriority} className="flex flex-wrap gap-2">
              {TICKET_PRIORITIES.map((option) => {
                const selected = priority === option;
                const tone = PRIORITY_TONE[option];
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPriority(option)}
                    className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
                    style={{
                      borderColor: selected ? tone : `color-mix(in srgb, ${tone} 32%, white)`,
                      backgroundColor: selected ? `color-mix(in srgb, ${tone} 16%, white)` : "white",
                    }}
                  >
                    <span className="h-2 w-2 flex-none rounded-full" style={{ backgroundColor: tone }} aria-hidden />
                    <span className="text-sm font-semibold" style={{ color: tone }}>
                      {copy.priorities[option]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <Field label={copy.fieldDescription} error={errors.description} htmlFor="hd-description">
            <textarea
              id="hd-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={copy.phDescription}
              rows={6}
              className={`${HD_INPUT} resize-y`}
            />
            <span className="text-xs text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">
              {descriptionLeft > 0 ? `${copy.errDescriptionShort} (${descriptionLeft})` : ""}
            </span>
          </Field>
        </div>
      </fieldset>

      {/* Optional */}
      <fieldset className={`${HD_CARD} p-5 sm:p-6`}>
        <legend className="px-1 text-base font-bold text-[var(--color-primary)]">{copy.sectionOptional}</legend>

        <div className="mt-3">
          <Field label={copy.fieldDepartment} error={undefined} htmlFor="hd-department">
            <DashboardSelect
              ariaLabel={copy.fieldDepartment}
              value={department}
              onChange={(value) => setDepartment(value as HelpDeskDepartment | "")}
              options={[
                { value: "", label: "—" },
                ...HELPDESK_DEPARTMENTS.map((option) => ({ value: option, label: option })),
              ]}
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={copy.fieldRelatedRoute} error={undefined} htmlFor="hd-route">
            <input
              id="hd-route"
              type="text"
              value={relatedRoute}
              onChange={(e) => setRelatedRoute(e.target.value)}
              placeholder={copy.phRelatedRoute}
              className={HD_INPUT}
            />
          </Field>

          <div>
            <p className="mb-2 text-xs font-semibold text-[var(--color-primary)]">{copy.fieldPreferredContact}</p>
            <div role="radiogroup" aria-label={copy.fieldPreferredContact} className="flex gap-2">
              {(["email", "mobile"] as PreferredContact[]).map((option) => {
                const selected = preferredContact === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPreferredContact(option)}
                    className={`flex-1 rounded-2xl border px-4 py-2.5 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] ${
                      selected
                        ? "border-[var(--color-action)] bg-[var(--color-action)]"
                        : "border-[color-mix(in_srgb,var(--color-primary)_20%,var(--color-white))] bg-[var(--color-white)]"
                    }`}
                  >
                    <span className={`text-sm font-semibold ${selected ? "text-[var(--color-white)]" : "text-[var(--color-primary)]"}`}>
                      {option === "email" ? copy.preferredEmail : copy.preferredMobile}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-[var(--color-primary)]">{copy.attachTitle}</p>
          <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]">
            {copy.attachHint}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= MAX_ATTACHMENTS}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-primary)] px-4 py-2.5 transition duration-200 hover:bg-[var(--color-action-tint)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
            >
              <FiUpload className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
              <span className="text-sm font-semibold text-[var(--color-primary)]">
                {attachments.length > 0 ? copy.attachReplace : copy.attachChoose}
              </span>
            </button>
          </div>

          {attachments.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {attachments.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] bg-[var(--color-white)] p-2.5"
                >
                  {file.previewUrl ? (
                    <Image
                      src={file.previewUrl}
                      alt={file.name}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 flex-none rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-action)_12%,var(--color-white))]">
                      <FiFileText className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-primary)]">{file.name}</p>
                    <p className="text-xs text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(file.id)}
                    aria-label={`${copy.attachRemove}: ${file.name}`}
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_20%,var(--color-white))] hover:bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--color-white))]"
                  >
                    <FiX className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="mt-3 flex items-start gap-2 text-xs text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]">
            <FiInfo className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden />
            {copy.attachNote}
          </p>
        </div>
      </fieldset>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => router.push(links.root)}
          className="inline-flex items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,var(--color-white))] px-5 py-3 transition duration-200 hover:bg-[var(--color-action-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
        >
          <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.cancel}</span>
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-6 py-3 transition duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
        >
          <FiSend className="h-4 w-4 text-[var(--color-white)]" aria-hidden />
          <span className="text-sm font-semibold text-[var(--color-white)]">
            {submitting ? copy.submitting : copy.submit}
          </span>
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-[var(--color-primary)]">{label}</span>
      {children}
      {error ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-danger)]">
          <FiAlertCircle className="h-3.5 w-3.5" aria-hidden />
          {error}
        </span>
      ) : null}
    </label>
  );
}
