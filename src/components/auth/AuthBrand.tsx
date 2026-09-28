import Image from "next/image";

/**
 * The Shikkha Chat logo that heads every authentication surface (sign-in,
 * sign-up, and both OTP / forgot-password steps). One component so the
 * placement, size and spacing stay identical across all of them. Uses the
 * existing brand asset — no new artwork.
 */
export default function AuthBrand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <Image
        src="/images/logo.png"
        alt="Shikkha Chat"
        width={165}
        height={66}
        priority
        className="h-11 w-auto"
      />
      {subtitle ? (
        <p className="text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
