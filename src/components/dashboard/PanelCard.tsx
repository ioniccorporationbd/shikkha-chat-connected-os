import type { ReactNode } from "react";

interface PanelCardProps {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function PanelCard({ title, hint, action, children, className }: PanelCardProps) {
  return (
    <section
      className={`rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] p-4 shadow-[0_18px_42px_color-mix(in_srgb,var(--color-primary)_8%,transparent)] sm:p-5 ${
        className ?? ""
      }`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[var(--color-primary)]">{title}</h2>
          {hint ? (
            <p className="mt-0.5 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
              {hint}
            </p>
          ) : null}
        </div>
        {action}
      </header>

      {children}
    </section>
  );
}
