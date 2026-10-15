import Image from "next/image";

type LoaderSize = "md" | "lg";

const DIMS: Record<LoaderSize, { ring: number; inset: number; logoW: number }> = {
  md: { ring: 76, inset: 9, logoW: 52 },
  lg: { ring: 96, inset: 11, logoW: 66 },
};

const LABEL: Record<LoaderSize, string> = {
  md: "text-[12.5px]",
  lg: "text-[13px]",
};

interface ShikkhaLoaderProps {
  /** Optional caption under the spinner (e.g. "ড্যাশবোর্ড লোড হচ্ছে…"). */
  label?: string;
  size?: LoaderSize;
  className?: string;
}

/**
 * The dashboard's ONE branded loading indicator: the Shikkha Chat logo on a
 * white disc wrapped in a modern spinning ring (globals.css `.shk-loader-ring`).
 * Every dashboard loading state uses this instead of an ad-hoc spinner or the
 * old grey pulse blocks, so a "loading" moment always carries the brand.
 *
 * The source logo is a wide wordmark, so the ring is sized to the logo (the
 * wordmark sits centred on the inner disc) rather than the logo shrunk into a
 * tiny circle. Motion is disabled under `prefers-reduced-motion`.
 */
export default function ShikkhaLoader({ label, size = "md", className }: ShikkhaLoaderProps) {
  const { ring, inset, logoW } = DIMS[size];
  const logoH = Math.max(12, Math.round(logoW / 3.69));

  return (
    <div
      role="status"
      aria-live="polite"
      data-no-translate="true"
      className={`flex flex-col items-center justify-center gap-3 ${className ?? ""}`}
    >
      <span className="relative grid place-items-center" style={{ height: ring, width: ring }}>
        <span aria-hidden className="shk-loader-track absolute inset-0 rounded-full" />
        <span aria-hidden className="shk-loader-ring absolute inset-0 rounded-full" />
        <span
          className="absolute rounded-full bg-[var(--color-white)] shadow-[0_12px_26px_-14px_color-mix(in_srgb,var(--color-primary)_60%,transparent)]"
          style={{ inset }}
        />
        <span className="relative block" style={{ height: logoH, width: logoW }}>
          <Image
            src="/images/logo.png"
            alt="Shikkha Chat"
            fill
            priority
            sizes={`${logoW}px`}
            className="object-contain"
          />
        </span>
      </span>
      {label ? (
        <span
          className={`font-medium text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)] ${LABEL[size]}`}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
