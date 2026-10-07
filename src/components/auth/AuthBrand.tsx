import Image from "next/image";

/**
 * The Shikkha Chat logo that heads every authentication surface (sign-in,
 * sign-up, and both OTP / forgot-password steps). One component so the
 * placement, size and spacing stay identical across all of them. Uses the
 * existing brand asset — no new artwork.
 *
 * Premium Shikkha-red lockup: the logo sits on a soft red-tinted plate with a
 * faint inner white ring and a low red shadow, so the mark reads as the fixed
 * brand anchor of the card. Centered, proportional and responsive down to
 * small phones.
 */
export default function AuthBrand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <span className="relative inline-flex items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--color-action)_16%,transparent)] bg-[var(--color-action-tint)] px-4 py-2.5 shadow-[0_12px_28px_-20px_color-mix(in_srgb,var(--color-action)_60%,transparent)]">
        <Image
          src="/images/logo.png"
          alt="Shikkha Chat"
          width={180}
          height={72}
          priority
          className="h-8 w-auto object-contain sm:h-9"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-[color-mix(in_srgb,var(--color-white)_65%,transparent)]"
        />
      </span>
      {subtitle ? (
        <p className="text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
