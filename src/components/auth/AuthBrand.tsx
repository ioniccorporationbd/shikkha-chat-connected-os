import Image from "next/image";

/**
 * The Shikkha Chat logo that heads every authentication surface (sign-in,
 * sign-up, and both OTP / forgot-password steps). One component so the
 * placement, size and spacing stay identical across all of them. Uses the
 * existing brand asset — no new artwork. Centered, proportional, ~120px wide
 * and responsive down to small phones.
 */
export default function AuthBrand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Image
        src="/images/logo.png"
        alt="Shikkha Chat"
        width={180}
        height={72}
        priority
        className="h-10 w-auto object-contain sm:h-12"
      />
      {subtitle ? (
        <p className="text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
