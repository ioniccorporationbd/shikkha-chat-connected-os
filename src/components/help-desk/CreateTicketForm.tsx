"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiHelpCircle,
  FiInfo,
  FiPaperclip,
  FiRefreshCw,
  FiSend,
  FiShield,
  FiTool,
  FiUpload,
  FiUser,
  FiX,
} from "react-icons/fi";

import DashboardSelect from "@/components/dashboard/DashboardSelect";
import { useAuthStore } from "@/lib/auth/store";
import { HD_CARD, HD_INPUT, PRIORITY_TONE } from "@/lib/help-desk/config";
import { formatFileSize } from "@/lib/help-desk/format";
import { uid } from "@/lib/help-desk/ids";
import { MIN_DESCRIPTION_LENGTH, type HelpDeskCopy } from "@/lib/help-desk/messages";
import {
  iconForType,
  priorityChoices,
  priorityLabel,
  teamChoices,
  typeChoices,
  typeLabel,
  type TypeIconKey,
} from "@/lib/help-desk/options";
import { helpDeskLinks } from "@/lib/help-desk/paths";
import { createTicket, getOptions } from "@/lib/help-desk/service";
import { reportClientError } from "@/lib/log/report-error";
import type {
  HelpDeskOptions,
  HelpDeskOptionPriority,
  HelpDeskOptionType,
  PreferredContact,
  Ticket,
  TicketAttachment,
} from "@/lib/help-desk/types";
import { toast } from "@/lib/ui/toast";

import TicketSuccessCard from "./TicketSuccessCard";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTACHMENTS = 3;
/** Backend hard limit (shikkha_os.api.v1.help_desk.upload_attachment). */
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,.pdf,.txt,.log,.csv,.doc,.docx,.xls,.xlsx";

const TYPE_ICONS: Record<TypeIconKey, typeof FiTool> = {
  technical: FiTool,
  billing: FiCreditCard,
  account: FiUser,
  usage: FiBookOpen,
  other: FiHelpCircle,
  generic: FiPaperclip,
};

type FieldErrors = Partial<Record<"name" | "email" | "subject" | "description", string>>;
type OptionsState = "loading" | "ready" | "error";

/**
 * The New Ticket form.
 *
 * Everything it *offers* is read from the ERP (`HD Ticket Type`,
 * `HD Ticket Priority`, `HD Team`) — there is no hard-coded option list in the
 * frontend. The ERP decides what a ticket can be filed under; this component
 * only decides how those rows look.
 */
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
  const [ticketType, setTicketType] = useState("");
  const [priority, setPriority] = useState("");
  const [description, setDescription] = useState("");
  const [relatedRoute, setRelatedRoute] = useState("");
  const [preferredContact, setPreferredContact] = useState<PreferredContact>("email");
  const [team, setTeam] = useState("");
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Ticket | null>(null);

  const [options, setOptions] = useState<HelpDeskOptions | null>(null);
  const [optionsState, setOptionsState] = useState<OptionsState>("loading");
  const [optionsNonce, setOptionsNonce] = useState(0);
  const [dragging, setDragging] = useState(false);

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

  // Offer exactly what the ERP is configured for. Nothing is guessed locally:
  // if the ERP has no categories the section says so, and if the call fails the
  // customer gets an inline retry instead of stale hard-coded values.
  useEffect(() => {
    let alive = true;
    getOptions()
      .then((payload) => {
        if (!alive) return;
        setOptions(payload);
        setOptionsState("ready");
        setTicketType((current) =>
          current && payload.categories.some((item) => item.value === current) ? current : payload.categories[0]?.value ?? ""
        );
        setPriority((current) =>
          current && payload.priorities.some((item) => item.name === current) ? current : payload.priorities[0]?.name ?? ""
        );
      })
      .catch((error) => {
        if (!alive) return;
        setOptions(null);
        setOptionsState("error");
        toast.error(copy.toastOptionsFailed);
        reportClientError({
          scope: "help-desk:options",
          message: "Loading the ERP-managed ticket options failed.",
          detail: error instanceof Error ? `${error.name}: ${error.message}` : error,
        });
      });
    return () => {
      alive = false;
    };
  }, [optionsNonce, copy.toastOptionsFailed]);

  const categories: HelpDeskOptionType[] = useMemo(() => typeChoices(options), [options]);
  const priorities: HelpDeskOptionPriority[] = useMemo(() => priorityChoices(options), [options]);
  const teams: string[] = useMemo(() => teamChoices(options), [options]);

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: TicketAttachment[] = [...attachments];
    let added = 0;
    for (const file of Array.from(files)) {
      if (next.length >= MAX_ATTACHMENTS) {
        toast.error(copy.toastAttachLimit.replace("{count}", String(MAX_ATTACHMENTS)));
        break;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name}: ${formatFileSize(MAX_FILE_BYTES)}`);
        continue;
      }
      next.push({
        id: uid("att"),
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        file,
      });
      added += 1;
    }
    setAttachments(next);
    if (added > 0) toast.success(copy.toastAttachAdded);
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => {
      const target = current.find((a) => a.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((a) => a.id !== id);
    });
    toast.info(copy.toastAttachRemoved);
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
      // Identity/ownership is decided by the ERP from the session cookie — the
      // form only sends what the customer typed, plus the ERP-configured names.
      const ticket = await createTicket({
        subject,
        ticketType: ticketType || undefined,
        priority: priority || undefined,
        description,
        contact: { name, email, mobile, preferredContact },
        relatedRoute,
        department: team || undefined,
        attachments,
      });

      setCreated(ticket);
      toast.success(copy.toastCreated.replace("{id}", ticket.id));
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : copy.toastLoadFailed);
      reportClientError({
        scope: "help-desk:create",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Creating the ticket failed without a message.",
        detail: {
          error: error instanceof Error ? `${error.name}` : typeof error,
          stack: error instanceof Error ? error.stack?.slice(0, 1200) : undefined,
          ticketType,
          priority,
          department: team || undefined,
          attachments: attachments.length,
        },
      });
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
    setTicketType(categories[0]?.value ?? "");
    setPriority(priorities[0]?.name ?? "");
    setPreferredContact("email");
    setTeam("");
    // Keep name/email (identity), keep mobile.
  };

  if (created) {
    return <TicketSuccessCard ticket={created} copy={copy} language={language} basePath={basePath} onAnother={resetForm} />;
  }

  const descriptionLength = description.trim().length;
  const descriptionLeft = Math.max(0, MIN_DESCRIPTION_LENGTH - descriptionLength);
  const descriptionDone = descriptionLeft === 0;
  const selectedType = categories.find((item) => item.value === ticketType) ?? null;
  const selectedPriority = priorities.find((item) => item.name === priority) ?? null;
  const translatedCategories = copy.categories as unknown as Record<string, string>;
  const translatedPriorities = copy.priorities as unknown as Record<string, string>;
  const priorityTone = selectedPriority?.id ? (PRIORITY_TONE as Record<string, string>)[selectedPriority.id] ?? "var(--color-primary)" : "var(--color-primary)";
  const canSubmit = !submitting && optionsState !== "loading";

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_312px]">
      <div className="min-w-0 space-y-5">
        {/* Steps 1–2: identity + ticket details */}
        <Section step={1} title={copy.sectionBasic} hint={copy.sectionBasicHint} copy={copy}>
          <div className="grid gap-4 sm:grid-cols-3">
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
            <Field label={copy.fieldMobile} htmlFor="hd-mobile">
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

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-[var(--color-primary)]">{copy.fieldPreferredContact}</p>
            <div role="radiogroup" aria-label={copy.fieldPreferredContact} className="inline-flex rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] p-1">
              {(["email", "mobile"] as PreferredContact[]).map((option) => {
                const selected = preferredContact === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPreferredContact(option)}
                    className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] ${
                      selected
                        ? "bg-[var(--color-white)] text-[var(--color-primary)] shadow-sm"
                        : "text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))] hover:text-[var(--color-primary)]"
                    }`}
                  >
                    {option === "email" ? copy.preferredEmail : copy.preferredMobile}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        <Section step={2} title={copy.sectionTicket} hint={copy.sectionTicketHint} copy={copy}>
          <Field label={copy.fieldSubject} error={errors.subject} htmlFor="hd-subject">
            <input
              id="hd-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={copy.phSubject}
              className={HD_INPUT}
              maxLength={140}
            />
          </Field>

          {/* Category — one card per configured `HD Ticket Type` */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-[var(--color-primary)]">{copy.fieldCategory}</p>
              {optionsState === "ready" ? (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]">
                  <FiShield className="h-3 w-3" aria-hidden />
                  {copy.liveBadge}
                </span>
              ) : null}
            </div>

            {optionsState === "loading" ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-busy="true" aria-label={copy.optionsLoading}>
                {[0, 1, 2].map((key) => (
                  <div key={key} className="h-[46px] animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]" />
                ))}
              </div>
            ) : optionsState === "error" ? (
              <OptionsError
                copy={copy}
                onRetry={() => {
                  setOptionsState("loading");
                  setOptionsNonce((n) => n + 1);
                }}
              />
            ) : categories.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] px-4 py-3 text-xs text-[color-mix(in_srgb,var(--color-primary)_70%,var(--color-white))]">
                {copy.optionsEmptyType}
              </p>
            ) : (
              <div role="radiogroup" aria-label={copy.fieldCategory} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((option) => {
                  const selected = ticketType === option.value;
                  const Icon = TYPE_ICONS[iconForType(option.value, option.key)];
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setTicketType(option.value)}
                      className={`group relative flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] ${
                        selected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] shadow-[0_6px_18px_-8px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]"
                          : "border-[color-mix(in_srgb,var(--color-primary)_20%,var(--color-white))] bg-[var(--color-white)] hover:-translate-y-[1px] hover:border-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-white))] hover:bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))]"
                      }`}
                    >
                      <Icon className={`h-4 w-4 flex-none ${selected ? "text-[var(--color-white)]" : "text-[var(--color-primary)]"}`} aria-hidden />
                      <span className={`min-w-0 text-sm font-semibold leading-snug ${selected ? "text-[var(--color-white)]" : "text-[var(--color-primary)]"}`}>
                        {typeLabel(option, translatedCategories)}
                      </span>
                      {selected ? (
                        <FiCheckCircle className="ml-auto h-4 w-4 flex-none text-[var(--color-white)]" aria-hidden />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Priority — one pill per configured `HD Ticket Priority` */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold text-[var(--color-primary)]">{copy.fieldPriority}</p>
            {optionsState === "loading" ? (
              <div className="flex flex-wrap gap-2" aria-busy="true">
                {[0, 1, 2, 3].map((key) => (
                  <div key={key} className="h-[42px] w-24 animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]" />
                ))}
              </div>
            ) : optionsState === "error" ? null : priorities.length === 0 ? (
              <p className="text-xs text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]">{copy.optionsEmptyPriority}</p>
            ) : (
              <div role="radiogroup" aria-label={copy.fieldPriority} className="flex flex-wrap gap-2">
                {priorities.map((option) => {
                  const selected = priority === option.name;
                  const tone = option.id ? (PRIORITY_TONE as Record<string, string>)[option.id] ?? "var(--color-primary)" : "var(--color-primary)";
                  return (
                    <button
                      key={option.name}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setPriority(option.name)}
                      className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
                      style={{
                        // Selected = brand ink, so the choice is unmistakable even
                        // for the neutral (grey) priorities; the severity colour
                        // stays as the dot and in the summary panel.
                        borderColor: selected ? "var(--color-primary)" : `color-mix(in srgb, ${tone} 30%, white)`,
                        backgroundColor: selected ? "var(--color-primary)" : "white",
                      }}
                    >
                      <span
                        className="h-2 w-2 flex-none rounded-full"
                        style={{ backgroundColor: selected ? "rgba(255,255,255,0.85)" : tone }}
                        aria-hidden
                      />
                      <span className="text-sm font-semibold" style={{ color: selected ? "var(--color-white)" : tone }}>
                        {priorityLabel(option, translatedPriorities)}
                      </span>
                      {selected ? <FiCheck className="h-3.5 w-3.5 text-[var(--color-white)]" aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Description with a live progress meter toward the minimum */}
          <div className="mt-5">
            <Field label={copy.fieldDescription} error={errors.description} htmlFor="hd-description">
              <textarea
                id="hd-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={copy.phDescription}
                rows={6}
                className={`${HD_INPUT} resize-y`}
              />
            </Field>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${descriptionDone ? "bg-[var(--color-success)]" : "bg-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-white))]"}`}
                  style={{ width: `${Math.min(100, (descriptionLength / MIN_DESCRIPTION_LENGTH) * 100)}%` }}
                />
              </div>
              <span className={`inline-flex flex-none items-center gap-1 text-[11px] font-medium ${descriptionDone ? "text-[var(--color-success)]" : "text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]"}`}>
                {descriptionDone ? <FiCheckCircle className="h-3 w-3" aria-hidden /> : null}
                {descriptionDone ? `${descriptionLength}` : `${descriptionLength}/${MIN_DESCRIPTION_LENGTH}`}
              </span>
            </div>
          </div>
        </Section>

        <Section step={3} title={copy.sectionOptional} hint={copy.sectionOptionalHint} copy={copy}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={copy.fieldDepartment} htmlFor="hd-team">
              <DashboardSelect
                ariaLabel={copy.fieldDepartment}
                value={team}
                onChange={(value) => setTeam(value)}
                options={[
                  { value: "", label: teams.length ? "—" : copy.optionsEmptyTeam },
                  ...teams.map((option) => ({ value: option, label: option })),
                ]}
              />
            </Field>
            <Field label={copy.fieldRelatedRoute} htmlFor="hd-route">
              <input
                id="hd-route"
                type="text"
                value={relatedRoute}
                onChange={(e) => setRelatedRoute(e.target.value)}
                placeholder={copy.phRelatedRoute}
                className={HD_INPUT}
              />
            </Field>
          </div>

          {/* Drop zone */}
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-[var(--color-primary)]">{copy.attachTitle}</p>
              <span className="text-[11px] text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]">
                {attachments.length}/{MAX_ATTACHMENTS}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
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
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              disabled={attachments.length >= MAX_ATTACHMENTS}
              className={`mt-2 flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] ${
                dragging
                  ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]"
                  : "border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] hover:border-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-white))]"
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]">
                <FiUpload className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
              </span>
              <span className="text-xs font-semibold text-[var(--color-primary)]">{copy.attachDrop}</span>
              <span className="text-[11px] text-[color-mix(in_srgb,var(--color-primary)_58%,var(--color-white))]">
                {copy.attachMax.replace("{count}", String(MAX_ATTACHMENTS))} · ≤ {formatFileSize(MAX_FILE_BYTES)}
              </span>
            </button>

            {attachments.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] bg-[var(--color-white)] p-2.5"
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
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]">
                        <FiFileText className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--color-primary)]">{file.name}</p>
                      <p className="text-xs text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.id)}
                      aria-label={`${copy.attachRemove}: ${file.name}`}
                      className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_20%,var(--color-white))] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]"
                    >
                      <FiX className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]">
              <FiInfo className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden />
              {copy.attachNote}
            </p>
          </div>
        </Section>

        {/* Actions */}
        <div className={`${HD_CARD} flex flex-col-reverse gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between`}>
          <button
            type="button"
            onClick={() => router.push(links.root)}
            className="inline-flex items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,var(--color-white))] px-5 py-3 transition duration-200 hover:bg-[var(--color-action-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
          >
            <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.cancel}</span>
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-6 py-3 shadow-[0_16px_30px_-16px_color-mix(in_srgb,var(--color-action)_75%,transparent)] transition duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] focus-visible:ring-offset-2"
          >
            <FiSend className="h-4 w-4 text-[var(--color-white)]" aria-hidden />
            <span className="text-sm font-semibold text-[var(--color-white)]">{submitting ? copy.submitting : copy.submit}</span>
          </button>
        </div>
      </div>

      {/* Sticky summary — desktop only; the same information is in the form on mobile */}
      <aside className="hidden lg:sticky lg:top-4 lg:block">
        <div className={`${HD_CARD} p-4`}>
          <p className="text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]">
            {copy.summaryTitle}
          </p>

          <dl className="mt-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-xs text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">{copy.summaryCategory}</dt>
              <dd className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)]">
                {selectedType ? (
                  <>
                    {(() => {
                      const Icon = TYPE_ICONS[iconForType(selectedType.value, selectedType.key)];
                      return <Icon className="h-3.5 w-3.5 flex-none" aria-hidden />;
                    })()}
                    <span className="truncate">{typeLabel(selectedType, translatedCategories)}</span>
                  </>
                ) : (
                  <span className="text-[color-mix(in_srgb,var(--color-primary)_50%,var(--color-white))]">{copy.summaryNone}</span>
                )}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-2">
              <dt className="text-xs text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">{copy.summaryPriority}</dt>
              <dd className="text-xs font-semibold" style={{ color: priorityTone }}>
                {selectedPriority ? priorityLabel(selectedPriority, translatedPriorities) : copy.summaryNone}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-2">
              <dt className="text-xs text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">{copy.summaryFiles}</dt>
              <dd className="text-xs font-semibold text-[var(--color-primary)]">{attachments.length}</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-primary)]">
              <FiClock className="h-3.5 w-3.5" aria-hidden />
              {copy.nextTitle}
            </p>
            <ol className="mt-2 space-y-1.5">
              {[copy.nextStep1, copy.nextStep2, copy.nextStep3].map((line, index) => (
                <li key={index} className="flex gap-2 text-[11px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_68%,var(--color-white))]">
                  <span className="mt-[3px] flex h-3.5 w-3.5 flex-none items-center justify-center rounded-full bg-[var(--color-primary)] text-[8.5px] font-bold tabular-nums text-[var(--color-white)]">
                    {index + 1}
                  </span>
                  {line}
                </li>
              ))}
            </ol>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-action)] px-4 py-2.5 transition duration-200 hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
          >
            <FiSend className="h-3.5 w-3.5 text-[var(--color-white)]" aria-hidden />
            <span className="text-xs font-semibold text-[var(--color-white)]">{submitting ? copy.submitting : copy.submit}</span>
          </button>
        </div>
      </aside>
    </form>
  );
}

/** A numbered card section: badge + title + hint, then the fields. */
function Section({
  step,
  title,
  hint,
  copy,
  children,
}: {
  step: number;
  title: string;
  hint: string;
  copy: HelpDeskCopy;
  children: React.ReactNode;
}) {
  return (
    <section className={`${HD_CARD} p-5 sm:p-6`} aria-label={title}>
      <header className="flex items-start gap-3 border-b border-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] pb-4">
        {/* Step badge: brand ink, NOT the action red — red is reserved for the
            primary submit action and never used to "number" a step. */}
        <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-xl bg-[var(--color-primary)] text-[11.5px] font-bold tabular-nums text-[var(--color-white)] shadow-[0_6px_16px_-8px_color-mix(in_srgb,var(--color-primary)_75%,transparent)]">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold leading-tight text-[var(--color-primary)]">{title}</h2>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">{hint}</p>
        </div>
        <span className="sr-only">{copy.stepLabel.replace("{n}", String(step))}</span>
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function OptionsError({ copy, onRetry }: { copy: HelpDeskCopy; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_28%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-danger)_6%,var(--color-white))] px-4 py-3">
      <FiAlertCircle className="h-4 w-4 flex-none text-[var(--color-danger)]" aria-hidden />
      <span className="min-w-0 flex-1 text-xs font-medium text-[var(--color-danger)]">{copy.optionsFailed}</span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex flex-none items-center gap-1.5 rounded-xl border border-[var(--color-danger)] px-3 py-1.5 text-[11px] font-semibold text-[var(--color-danger)] transition hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
      >
        <FiRefreshCw className="h-3 w-3" aria-hidden />
        {copy.optionsRetry}
      </button>
    </div>
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
