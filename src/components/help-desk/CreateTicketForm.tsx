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
  FiEye,
  FiFileText,
  FiHelpCircle,
  FiInfo,
  FiLock,
  FiMail,
  FiPaperclip,
  FiRefreshCw,
  FiSend,
  FiShield,
  FiSmartphone,
  FiTool,
  FiUpload,
  FiUser,
  FiX,
} from "react-icons/fi";

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

import AttachmentLightbox from "./AttachmentLightbox";
import StepSelect, { type StepSelectOption } from "./StepSelect";
import TicketSuccessCard from "./TicketSuccessCard";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Shortest subject that counts as "valid text" (step 1 gate). */
const MIN_SUBJECT_LENGTH = 4;
/** Backend hard limit (shikkha_os.api.v1.help_desk._MAX_ATTACHMENTS). */
const MAX_ATTACHMENTS = 5;
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

type FieldErrors = Partial<
  Record<"name" | "email" | "mobile" | "subject" | "description" | "channels", string>
>;
type OptionsState = "loading" | "ready" | "error";
type Channels = { mobile: boolean; email: boolean };

const REVEAL =
  "grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";

/**
 * The New Ticket form — a step-by-step, gate-kept wizard.
 *
 * Step order (contact first; routing in one row; submit with the optional block):
 *   Contact → Subject → [Category → Priority → Department] → Description → Optional
 * and each step only opens once the one before it holds a valid value; all
 * five must be filled before the ticket can be submitted. Changing an earlier
 * answer re-validates everything downstream (a stale selection is dropped).
 *
 * Everything the form *offers* still comes from the ERP (`HD Ticket Type`,
 * `HD Ticket Priority`, `HD Team`) — there is no hard-coded option list here.
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
  const [channels, setChannels] = useState<Channels>({ mobile: false, email: false });
  const [team, setTeam] = useState("");
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Ticket | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const [options, setOptions] = useState<HelpDeskOptions | null>(null);
  const [optionsState, setOptionsState] = useState<OptionsState>("loading");
  const [optionsNonce, setOptionsNonce] = useState(0);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefilled = useRef(false);
  /** Hard guard against double submits (double click / Enter + click). */
  const submitLock = useRef(false);

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
  // if the ERP has no categories the step says so, and if the call fails the
  // customer gets an inline retry instead of stale hard-coded values.
  //
  // NOTE: nothing is auto-selected anymore — every step must be answered
  // explicitly, so the wizard can gate the next step on a real choice.
  useEffect(() => {
    let alive = true;
    getOptions()
      .then((payload) => {
        if (!alive) return;
        setOptions(payload);
        setOptionsState("ready");
        // Drop selections the ERP no longer offers.
        setTicketType((current) =>
          current && payload.categories.some((item) => item.value === current) ? current : ""
        );
        setPriority((current) =>
          current && payload.priorities.some((item) => item.name === current) ? current : ""
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

  // Cascade cleanup: a downstream value that is no longer offered by the ERP
  // is treated as unset (derived, not stored), which re-locks the steps after
  // it — the "previous step changed" contract — without an effect that writes
  // state during render.
  const teamValue = useMemo(() => (team && teams.includes(team) ? team : ""), [team, teams]);

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
      // Duplicate guard: the same name+size+mime is never queued twice, so a
      // double drop or a re-pick cannot upload the same bytes twice.
      const duplicate = next.some(
        (item) => item.name === file.name && item.size === file.size && item.mime === (file.type || "application/octet-stream")
      );
      if (duplicate) {
        toast.info(copy.duplicateFile);
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

  // ── Step gates ────────────────────────────────────────────────────────────
  // Contact comes first now: it is the only step open on a fresh form, and each
  // later gate is chained to the one before it so an edit that invalidates an
  // earlier step also closes everything downstream (and the submit button).
  const emailValid = EMAIL_RE.test(email.trim());
  const mobileDigits = mobile.replace(/\D/g, "");
  const channelCount = Number(channels.mobile) + Number(channels.email);

  const contactOk =
    channelCount > 0 &&
    Boolean(name.trim()) &&
    (!channels.email || emailValid) &&
    (!channels.mobile || mobileDigits.length >= 10);

  const subjectOk = contactOk && subject.trim().length >= MIN_SUBJECT_LENGTH;
  const categoryOk = subjectOk && Boolean(ticketType) && categories.some((item) => item.value === ticketType);
  const priorityOk = categoryOk && Boolean(priority) && priorities.some((item) => item.name === priority);
  const departmentOk = priorityOk && Boolean(teamValue);
  const descriptionOk = departmentOk && description.trim().length >= MIN_DESCRIPTION_LENGTH;

  const mandatorySteps = [contactOk, subjectOk, categoryOk, priorityOk, departmentOk, descriptionOk];
  const mandatoryDone = mandatorySteps.filter(Boolean).length;
  const allDone = descriptionOk && optionsState === "ready";
  const canSubmit = allDone && !submitting;

  // Move keyboard focus to the step that just opened (contact → subject → the
  // routing row → description).
  useEffect(() => {
    if (!subjectOk) return;
    document.getElementById("hd-subject")?.focus();
  }, [subjectOk]);
  useEffect(() => {
    if (!categoryOk) return;
    document.querySelector<HTMLElement>("#hd-step-category button[role='combobox']")?.focus();
  }, [categoryOk]);
  useEffect(() => {
    if (!priorityOk) return;
    document.querySelector<HTMLElement>("#hd-step-priority button[role='combobox']")?.focus();
  }, [priorityOk]);
  useEffect(() => {
    if (!departmentOk) return;
    document.querySelector<HTMLElement>("#hd-step-department button[role='combobox']")?.focus();
  }, [departmentOk]);
  useEffect(() => {
    if (!descriptionOk) return;
    document.getElementById("hd-description")?.focus();
  }, [descriptionOk]);

  const preferredContact: PreferredContact =
    channels.mobile && channels.email ? "both" : channels.mobile ? "mobile" : "email";

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!subjectOk) next.subject = copy.errSubjectShort;
    if (!name.trim()) next.name = copy.errRequired;
    if (channelCount === 0) next.channels = copy.errContactMethod;
    if (channels.email && !emailValid) next.email = email.trim() ? copy.errEmail : copy.errRequired;
    if (channels.mobile && mobileDigits.length < 10) next.mobile = copy.errMobileRequired;
    if (!descriptionOk) next.description = copy.errDescriptionShort;
    return next;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Double-submit guard: the button is disabled, but Enter/paste/assistive
    // tech can still fire a second submit while the first is in flight.
    if (submitLock.current) return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error(found.subject ?? found.description ?? found.channels ?? found.email ?? found.name ?? copy.toastValidation);
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    try {
      // Identity/ownership is decided by the ERP from the session cookie — the
      // form only sends what the customer typed, plus the ERP-configured names.
      const ticket = await createTicket({
        subject,
        ticketType,
        priority,
        description,
        contact: { name, email, mobile, preferredContact },
        relatedRoute,
        department: teamValue,
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
          department: teamValue,
          preferredContact,
          attachments: attachments.length,
        },
      });
    } finally {
      submitLock.current = false;
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
    setTicketType("");
    setPriority("");
    setChannels({ mobile: false, email: false });
    setTeam("");
    // Keep name/email/mobile (identity).
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
  const priorityTone = selectedPriority?.id
    ? (PRIORITY_TONE as Record<string, string>)[selectedPriority.id] ?? "var(--color-primary)"
    : "var(--color-primary)";

  const categoryOptions: StepSelectOption[] = categories.map((option) => ({
    value: option.value,
    label: typeLabel(option, translatedCategories),
  }));
  const priorityOptions: StepSelectOption[] = priorities.map((option) => ({
    value: option.name,
    label: priorityLabel(option, translatedPriorities),
  }));
  const departmentOptions: StepSelectOption[] = teams.map((option) => ({ value: option, label: option }));

  const steps: { key: string; title: string; done: boolean }[] = [
    { key: "contact", title: copy.contactStepTitle, done: contactOk },
    { key: "subject", title: copy.fieldSubject, done: subjectOk },
    { key: "category", title: copy.fieldCategory, done: categoryOk },
    { key: "priority", title: copy.fieldPriority, done: priorityOk },
    { key: "department", title: copy.fieldDepartment, done: departmentOk },
    { key: "description", title: copy.fieldDescription, done: descriptionOk },
  ];

  const imageAttachments = attachments.filter((item) => Boolean(item.previewUrl));

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_312px]">
      <div className="min-w-0 space-y-5">
        {/* Progress header */}
        <div className={`${HD_CARD} p-4 sm:p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]">
              {copy.stepProgress.replace("{done}", String(mandatoryDone)).replace("{total}", "6")}
            </p>
            {optionsState === "ready" ? (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]">
                <FiShield className="h-3 w-3" aria-hidden />
                {copy.liveBadge}
              </span>
            ) : null}
          </div>

          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))]">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                mandatoryDone === 6 ? "bg-[var(--color-deep-surface)]" : "bg-[var(--color-action)]"
              }`}
              style={{ width: `${(mandatoryDone / 6) * 100}%` }}
            />
          </div>

          <ol className="mt-3 flex flex-wrap gap-1.5">
            {steps.map((step, index) => (
              <li
                key={step.key}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition duration-300 ${
                  step.done
                    ? "border-[color-mix(in_srgb,var(--color-deep-surface)_26%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-deep-surface)_8%,var(--color-white))] text-[var(--color-deep-surface)]"
                    : "border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_58%,var(--color-white))]"
                }`}
              >
                {step.done ? (
                  <FiCheck className="h-3 w-3" aria-hidden />
                ) : (
                  <span className="tabular-nums">{index + 1}</span>
                )}
                <span className="truncate">{step.title}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Step 1 — Contact details (multi-channel, open on a fresh form) */}
        <StepCard step={1} title={copy.contactStepTitle} hint={copy.contactStepHint} open done={contactOk}>
          <div>
            <p className="text-xs font-semibold text-[var(--color-primary)]">{copy.fieldPreferredContact}</p>
            <p className="mb-2 mt-0.5 text-[11px] text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]">
              {copy.preferredContactHint}
            </p>
            {/* Channel buttons are the siblings of the header nav pills ("পেছনে যান" / "হেল্প ডেস্ক"):
                same 36.5px height, px-3 py-2.5, 16px radius, 12px gap, bold 12px label with a
                16.5px line box, 14px icon. Sized to content (w-fit) and left-aligned like a sidebar
                row; the always-mounted check slot keeps both buttons identical in every state. */}
            <div role="group" aria-label={copy.fieldPreferredContact} className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: "mobile" as const, label: copy.preferredMobile, hint: copy.preferredMobileHint, Icon: FiSmartphone },
                  { id: "email" as const, label: copy.preferredEmail, hint: copy.preferredEmailHint, Icon: FiMail },
                ]
              ).map(({ id, label, hint, Icon }) => {
                const selected = channels[id];
                return (
                  <button
                    key={id}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    title={hint}
                    onClick={() => {
                      setChannels((current) => ({ ...current, [id]: !current[id] }));
                      setErrors((current) => ({ ...current, channels: undefined }));
                    }}
                    className={`inline-flex w-fit items-center justify-center gap-3 rounded-2xl px-3 py-2.5 text-[12px] font-bold transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)] ${
                      selected
                        ? "bg-[var(--color-action)] text-[var(--color-white)] shadow-[0_12px_24px_-16px_color-mix(in_srgb,var(--color-action)_85%,transparent)] hover:-translate-y-[1px] hover:bg-[var(--color-action-hover)]"
                        : "bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)] hover:-translate-y-[1px] hover:bg-[var(--color-action-tint)] hover:text-[var(--color-action)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 flex-none" aria-hidden />
                    <span className="truncate font-bold" style={{ lineHeight: "16.5px" }}>
                      {label}
                    </span>
                    <FiCheck
                      aria-hidden
                      className={`h-3.5 w-3.5 flex-none transition-opacity duration-200 ${selected ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="sr-only">{hint}</span>
                  </button>
                );
              })}
            </div>

            {channelCount === 2 ? (
              <p className="mt-2 inline-flex items-start gap-1.5 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))] px-3 py-2 text-[11px] font-medium leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_72%,var(--color-white))]">
                <FiInfo className="mt-[1px] h-3.5 w-3.5 flex-none" aria-hidden />
                {copy.contactBothNote}
              </p>
            ) : null}

            {errors.channels ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-danger)]">
                <FiAlertCircle className="h-3.5 w-3.5" aria-hidden />
                {errors.channels}
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
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
            <Field label={copy.fieldMobile} error={errors.mobile} htmlFor="hd-mobile">
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
        </StepCard>

        {/* Step 2 — Subject */}
        <StepCard
          step={2}
          title={copy.fieldSubject}
          hidden={!contactOk}
          hint={copy.stepSubjectHint}
          open={contactOk}
          done={subjectOk}
          lockedHint={copy.stepLocked}
        >
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
            <span className="self-end text-[10.5px] font-medium tabular-nums text-[color-mix(in_srgb,var(--color-primary)_48%,var(--color-white))]">
              {subject.length}/140
            </span>
          </Field>
          {!subjectOk && subject.length > 0 ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-danger)_85%,var(--color-primary))]">
              <FiAlertCircle className="h-3.5 w-3.5" aria-hidden />
              {copy.errSubjectShort}
            </p>
          ) : null}
        </StepCard>

        {/* Steps 3–5 — routing: one horizontal row, each cell revealed in turn */}
        <div className="flex flex-col gap-5 md:flex-row md:items-stretch">
          <div className="min-w-0 md:basis-0 md:flex-1">
        {/* Step 3 — Category (first cell of the routing row) */}
        <StepCard
          step={3}
          title={copy.fieldCategory}
          hidden={!subjectOk}
          hint={copy.stepCategoryHint}
          open={subjectOk}
          done={categoryOk}
          dense
          lockedHint={copy.stepLocked}
        >
          {optionsState === "loading" ? (
            <div className="h-[60px] animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]" aria-busy="true" aria-label={copy.optionsLoading} />
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
            <div id="hd-step-category">
              <StepSelect
                label={copy.fieldCategory}
                placeholder={copy.selectPlaceholder}
                noMatchLabel={copy.noMatchOptions}
                options={categoryOptions}
                value={ticketType}
                onChange={setTicketType}
                tone="action"
              />
            </div>
          )}
        </StepCard>
          </div>
          <div className="min-w-0 md:basis-0 md:flex-1">
        {/* Step 4 — Priority (second cell of the routing row) */}
        <StepCard
          step={4}
          title={copy.fieldPriority}
          hidden={!categoryOk}
          hint={copy.stepPriorityHint}
          open={categoryOk}
          done={priorityOk}
          dense
          lockedHint={copy.stepLocked}
        >
          {priorities.length === 0 ? (
            <p className="text-xs text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]">{copy.optionsEmptyPriority}</p>
          ) : (
            <div id="hd-step-priority">
              <StepSelect
                label={copy.fieldPriority}
                placeholder={copy.selectPlaceholder}
                noMatchLabel={copy.noMatchOptions}
                options={priorityOptions}
                value={priority}
                onChange={setPriority}
                tone="action"
              />
            </div>
          )}
        </StepCard>
          </div>
          <div className="min-w-0 md:basis-0 md:flex-1">
        {/* Step 5 — Department (third cell of the routing row) */}
        <StepCard
          step={5}
          title={copy.fieldDepartment}
          hidden={!priorityOk}
          hint={copy.stepDepartmentHint}
          open={priorityOk}
          done={departmentOk}
          dense
          lockedHint={copy.stepLocked}
        >
          {teams.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] px-4 py-3 text-xs text-[color-mix(in_srgb,var(--color-primary)_70%,var(--color-white))]">
              {copy.optionsEmptyTeam}
            </p>
          ) : (
            <div id="hd-step-department">
              <StepSelect
                label={copy.fieldDepartment}
                placeholder={copy.selectPlaceholder}
                noMatchLabel={copy.noMatchOptions}
                options={departmentOptions}
                value={teamValue}
                onChange={setTeam}
                tone="action"
              />
            </div>
          )}

          {departmentOk ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-deep-surface)_9%,var(--color-white))] px-3 py-1 text-[11px] font-semibold text-[var(--color-deep-surface)]">
              <FiCheckCircle className="h-3.5 w-3.5" aria-hidden />
              {copy.stepComplete} — 5/6
            </p>
          ) : null}
        </StepCard>
          </div>
        </div>

        {/* Step 6 — Description (unlocks the optional block + submit) */}
        <StepCard
          step={6}
          title={copy.fieldDescription}
          hidden={!departmentOk}
          hint={copy.stepDescriptionHint}
          open={departmentOk}
          done={descriptionOk}
          lockedHint={copy.stepLocked}
        >
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
              {descriptionDone ? (
                <>
                  <FiCheckCircle className="h-3 w-3" aria-hidden />
                  {descriptionLength}
                </>
              ) : (
                <>
                  <span className="tabular-nums">{descriptionLength}/{MIN_DESCRIPTION_LENGTH}</span>
                  <span className="text-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-white))]">
                    · {copy.descriptionMinHint.replace("{count}", String(MIN_DESCRIPTION_LENGTH))}
                  </span>
                </>
              )}
            </span>
          </div>
        </StepCard>

        {/* Step 7 — Optional: page URL + attachments (revealed with submit) */}
        <StepCard
          step={7}
          title={copy.sectionOptional}
          hidden={!descriptionOk}
          hint={copy.sectionOptionalHint}
          open={descriptionOk}
          done={false}
          lockedHint={copy.stepLocked}
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="hidden sm:block" />
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

            {/* Image thumbnails — click for the full-size lightbox */}
            {imageAttachments.length > 0 ? (
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {imageAttachments.map((file) => {
                  const index = attachments.findIndex((item) => item.id === file.id);
                  return (
                    <li key={file.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => setPreviewIndex(index)}
                        aria-label={`${copy.previewLabel}: ${file.name}`}
                        className="block w-full overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] bg-[var(--color-white)] transition duration-200 hover:-translate-y-[1px] hover:border-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
                      >
                        <span className="relative block aspect-square w-full">
                          <Image
                            src={file.previewUrl as string}
                            alt={file.name}
                            fill
                            sizes="160px"
                            unoptimized
                            className="object-cover"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] opacity-0 transition duration-200 group-hover:opacity-100">
                            <FiEye className="h-5 w-5 text-[var(--color-white)]" aria-hidden />
                          </span>
                        </span>
                        <span className="block truncate px-2 py-1.5 text-[10.5px] font-semibold text-[var(--color-primary)]">
                          {file.name}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.id)}
                        aria-label={`${copy.attachRemove}: ${file.name}`}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-white)] shadow-[0_4px_10px_-4px_color-mix(in_srgb,var(--color-primary)_60%,transparent)] opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <FiX className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {/* Non-image files keep the compact row style */}
            {attachments.some((item) => !item.previewUrl) ? (
              <ul className="mt-3 space-y-2">
                {attachments
                  .filter((item) => !item.previewUrl)
                  .map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] bg-[var(--color-white)] p-2.5"
                    >
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]">
                        <FiFileText className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                      </span>
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
        </StepCard>

        {/* Actions */}
        <div className={`${HD_CARD} flex flex-col-reverse gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between`}>
          <button
            type="button"
            onClick={() => router.push(links.root)}
            className="inline-flex items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,var(--color-white))] px-5 py-3 transition duration-200 hover:bg-[var(--color-action-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
          >
            <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.cancel}</span>
          </button>
          <div className="flex items-center gap-3">
            {!allDone ? (
              <span className="hidden text-[11px] font-medium text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))] sm:inline">
                {copy.stepProgress.replace("{done}", String(mandatoryDone)).replace("{total}", "6")}
              </span>
            ) : null}
            {descriptionOk ? (
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-6 py-3 shadow-[0_16px_30px_-16px_color-mix(in_srgb,var(--color-action)_75%,transparent)] transition duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] focus-visible:ring-offset-2"
            >
              <FiSend className="h-4 w-4 text-[var(--color-white)]" aria-hidden />
              <span className="text-sm font-semibold text-[var(--color-white)]">{submitting ? copy.submitting : copy.submit}</span>
            </button>
            ) : null}
          </div>
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
              <dt className="text-xs text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">{copy.fieldDepartment}</dt>
              <dd className="min-w-0 truncate text-xs font-semibold text-[var(--color-primary)]">
                {teamValue || <span className="text-[color-mix(in_srgb,var(--color-primary)_50%,var(--color-white))]">{copy.summaryNone}</span>}
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

          {descriptionOk ? (
            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-action)] px-4 py-2.5 transition duration-200 hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
            >
              <FiSend className="h-3.5 w-3.5 text-[var(--color-white)]" aria-hidden />
              <span className="text-xs font-semibold text-[var(--color-white)]">{submitting ? copy.submitting : copy.submit}</span>
            </button>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_18%,var(--color-white))] px-3 py-2.5 text-center text-[11px] font-medium text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]">
              {copy.stepProgress.replace("{done}", String(mandatoryDone)).replace("{total}", "6")}
            </p>
          )}
        </div>
      </aside>

      {previewIndex !== null && attachments[previewIndex]?.previewUrl ? (
        <AttachmentLightbox
          src={attachments[previewIndex].previewUrl as string}
          alt={attachments[previewIndex].name}
          closeLabel={copy.close}
          onClose={() => setPreviewIndex(null)}
        />
      ) : null}
    </form>
  );
}

/**
 * A numbered wizard card.
 *
 * Closed steps stay mounted (so their values survive) but are `inert`: the
 * fieldset is disabled, the body collapses to zero height and a lock line
 * explains what unlocks it. Opening a step animates the body in with the same
 * 500ms `cubic-bezier(0.22,1,0.36,1)` used by the homepage pill dropdowns.
 */
function StepCard({
  step,
  title,
  hint,
  open,
  done,
  lockedHint,
  optionalLabel,
  hidden,
  dense = false,
  children,
}: {
  step: number;
  title: string;
  hint: string;
  open: boolean;
  done: boolean;
  lockedHint?: string;
  optionalLabel?: string;
  // Steps are revealed one at a time: anything not yet reached is not rendered at all.
  hidden?: boolean;
  // Row cells drop the hint line so the three cards keep identical header heights
  // and their dropdowns sit on one baseline.
  dense?: boolean;
  children: React.ReactNode;
}) {
  if (hidden) return null;

  return (
    <section
      className={`${HD_CARD} flex h-full flex-col overflow-hidden motion-safe:animate-[shk-fade-in_0.26s_ease-out]`}
      aria-label={title}
      aria-current={open && !done ? "step" : undefined}
    >
      <header className={`flex items-start gap-3 p-5 pb-4 sm:p-6 sm:pb-4 ${dense ? "sm:pb-3" : ""}`}>
        {/* Step badges all share the dashboard Sign-out green (--color-deep-surface). */}
        <span
          className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-xl text-[11.5px] font-bold tabular-nums shadow-[0_8px_18px_-10px_color-mix(in_srgb,var(--color-deep-surface)_70%,transparent)] ${
            done || open
              ? "bg-[var(--color-deep-surface)] text-[var(--color-white)]"
              : "bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))] shadow-none"
          }`}
        >
          {done ? <FiCheck className="h-3.5 w-3.5" aria-hidden /> : open ? step : <FiLock className="h-3 w-3" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold leading-tight text-[var(--color-primary)]">
            {title}
            {optionalLabel ? (
              <span className="ml-2 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] px-2 py-0.5 align-middle text-[10px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]">
                {optionalLabel}
              </span>
            ) : null}
          </h2>
          {dense ? (
            <p className="sr-only">{hint}</p>
          ) : (
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">{hint}</p>
          )}
        </div>
        {done ? <FiCheckCircle className="mt-1 h-4 w-4 flex-none text-[var(--color-deep-surface)]" aria-hidden /> : null}
      </header>

      <div className={`${REVEAL} ${open ? "flex-1 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="min-h-0">
          <fieldset disabled={!open} className="px-5 pb-5 disabled:opacity-100 sm:px-6 sm:pb-6">
            {children}
          </fieldset>
        </div>
      </div>

      {!open && lockedHint ? (
        <p className="flex items-center gap-1.5 px-5 pb-4 text-[11px] font-medium text-[color-mix(in_srgb,var(--color-primary)_48%,var(--color-white))] sm:px-6">
          <FiLock className="h-3 w-3 flex-none" aria-hidden />
          {lockedHint}
        </p>
      ) : null}
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
