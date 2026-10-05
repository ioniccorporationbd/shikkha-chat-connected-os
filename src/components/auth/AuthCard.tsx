import type { ReactNode } from "react";

/**
 * The shared auth card: white surface, soft border, rounded corners, subtle
 * shadow and a balanced max-width/padding — identical across every auth form
 * so the visual family never drifts. Business logic stays in the forms.
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
      className={`relative z-10 w-full max-w-[460px] rounded-[28px] border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] p-6 shadow-[0_30px_70px_-32px_color-mix(in_srgb,var(--color-primary)_32%,transparent)] sm:p-8 ${className}`}
    >
      {children}
    </section>
  );
}
