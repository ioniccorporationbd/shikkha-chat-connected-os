import Image from "next/image";

/**
 * The Shikkha Chat logo that heads every authentication surface (sign-in,
 * sign-up, and both OTP / forgot-password steps). One component so the
 * placement, size and spacing stay identical across all of them. Uses the
 * existing brand asset — no new artwork.
 *
 * The mark sits directly on the card: no plate, border, ring or shadow behind
 * it. The asset itself is a transparent PNG, so nothing but the logo's own ink
 * is visible. Size is a step larger than before, and the intrinsic aspect ratio
 * (790×316) is preserved by `w-auto object-contain`, so it scales cleanly from
 * small phones up to desktop.
 */
export default function AuthBrand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <Image
        src="/images/logo.png"
        alt="Shikkha Chat"
        width={264}
        height={106}
        priority
        className="h-12 w-auto max-w-full object-contain sm:h-14"
      />
      {subtitle ? (
        <p className="text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
