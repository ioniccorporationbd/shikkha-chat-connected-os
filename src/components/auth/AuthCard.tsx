import type { ReactNode } from "react";

/**
 * The shared auth card: white surface, soft border, rounded corners, subtle
 * shadow and a balanced max-width/padding — identical across every auth form
 * so the visual family never drifts. Business logic stays in the forms.
 *
 * Premium Shikkha-red treatment: a whisper of Shikkha red anchors the top edge
 * of the card (the brand hairline) and the drop shadow carries a low-opacity
 * red so the card reads as part of the dashboard's action-colour system.
 */
export default function AuthCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      data-no-translate="true"
      className={`relative z-10 w-full max-w-[468px] overflow-hidden rounded-[30px] border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-6 shadow-[0_36px_80px_-40px_color-mix(in_srgb,var(--color-action)_38%,transparent),0_2px_10px_-6px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] sm:p-8 ${className}`}
    >
      {/* Brand hairline: a centered arc of Shikkha red along the top edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-[linear-gradient(90deg,transparent,var(--color-action),transparent)] opacity-80"
      />
      {children}
    </section>
  );
}
