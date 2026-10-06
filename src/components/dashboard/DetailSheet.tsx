"use client";

import Image from "next/image";
import { useEffect, type ReactNode } from "react";
import { FiX } from "react-icons/fi";

export interface DetailRow {
  label: string;
  value: string;
  /** Emphasise the value (used for the headline amount). */
  emphasis?: boolean;
}

export interface DetailSection {
  key: string;
  title: string;
  icon?: ReactNode;
  rows: DetailRow[];
}

interface DetailSheetProps {
  open: boolean;
  onClose: () => void;
  closeLabel: string;
  /** Small eyebrow above the title (e.g. "Invoice details"). */
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Heading icon chip (context-specific). */
  icon?: ReactNode;
  /** Status chips / badges shown under the heading. */
  badges?: ReactNode;
  /** Logical content groups (Bill information, Amount, Reference, ...). */
  sections: DetailSection[];
  /** Optional block appended after the sections (item / reference tables). */
  children?: ReactNode;
  loading?: boolean;
  loadingText?: string;
  error?: string;
  errorTitle?: string;
}

/**
 * The shared details popup used by the customer Payment History and Service
 * Build panels, so both open the *same* visual family (logo header, grouped
 * cards, badges, emphasis amounts) — one component, never two forks.
 *
 * Behaviour matches the project's other dialogs: overlay + `Escape` close and
 * a body scroll-lock while open. Per the CSS convention, text/colour utilities
 * live on inner elements, never directly on the <button>.
 */
export default function DetailSheet({
  open,
  onClose,
  closeLabel,
  eyebrow,
  title,
  subtitle,
  icon,
  badges,
  sections,
  children,
  loading,
  loadingText,
  error,
  errorTitle,
}: DetailSheetProps) {
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130]" data-no-translate="true">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col overflow-hidden rounded-t-[26px] border-t border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] shadow-[0_-30px_70px_-30px_color-mix(in_srgb,var(--color-primary)_75%,transparent)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88vh] sm:w-[640px] sm:max-w-[93vw] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[26px] sm:border"
      >
        {/* modern header — Shikkha Chat logo + close */}
        <header className="flex items-center gap-3 border-b border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))_0%,var(--color-white)_72%)] px-5 py-3.5">
          <span className="relative block h-8 w-[118px] shrink-0">
            <Image
              src="/images/logo.png"
              alt="Shikkha Chat"
              fill
              priority
              sizes="118px"
              className="object-contain object-left"
            />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]"
          >
            <span className="text-[var(--color-primary)]">
              <FiX size={16} />
            </span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-8 text-center text-[13px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
              {loadingText}
            </p>
          ) : error ? (
            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_6%,var(--color-white))] p-4">
              <p className="text-[13px] font-semibold text-[var(--color-danger-strong)]">{errorTitle}</p>
              <p className="mt-1 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                {error}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                {icon ? (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]">
                    {icon}
                  </span>
                ) : null}
                <div className="min-w-0">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                    {eyebrow}
                  </p>
                  <h2 className="mt-0.5 truncate text-[17px] font-semibold">{title}</h2>
                  {subtitle ? (
                    <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </div>

              {badges ? <div className="flex flex-wrap items-center gap-2">{badges}</div> : null}

              {sections.map((section) => (
                <section
                  key={section.key}
                  className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_7%,var(--color-white))] p-4"
                >
                  <div className="flex items-center gap-2">
                    {section.icon ? (
                      <span className="text-[var(--color-primary)]">{section.icon}</span>
                    ) : null}
                    <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                      {section.title}
                    </h3>
                  </div>
                  <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                    {section.rows.map((row) => (
                      <div key={row.label} className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                          {row.label}
                        </dt>
                        <dd
                          className={
                            row.emphasis
                              ? "mt-0.5 break-words text-[15px] font-semibold"
                              : "mt-0.5 break-words text-[13px] font-medium"
                          }
                        >
                          {row.value || "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}

              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
