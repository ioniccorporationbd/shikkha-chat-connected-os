import { LuLandmark } from "react-icons/lu";

import type { ManualPaymentMethod } from "@/lib/payment-entry/manual-payment/types";

/**
 * Locally-bundled brand marks (see public/payment). Each SVG carries its own
 * recognised brand colour, so no CSS filter / recolour is ever applied here.
 * Bank has no brand asset — it falls back to a semantic landmark glyph.
 */
const BRAND_SRC: Record<ManualPaymentMethod, string | null> = {
  bkash: "/payment/bkash.svg",
  nagad: "/payment/nagad.svg",
  rocket: "/payment/rocket.svg",
  bank: null,
};

interface PaymentBrandMarkProps {
  method: ManualPaymentMethod;
  /** Square tile edge, in px. */
  size?: number;
  className?: string;
}

/**
 * A square brand tile for one manual-payment method, so every method (brand
 * logos and the semantic Bank glyph alike) sits in the SAME footprint without
 * ever recolouring a brand mark.
 *
 * Purely presentational — it derives its asset from the `method` it is given
 * and holds no state.
 */
export default function PaymentBrandMark({ method, size = 40, className = "" }: PaymentBrandMarkProps) {
  const src = BRAND_SRC[method];

  if (src) {
    return (
      // Brand colours are baked into the asset, so a plain <img> is intentional
      // (next/image blocks SVG through the optimiser by default).
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-[27%] object-contain ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center rounded-2xl border border-[color-mix(in_srgb,var(--color-action)_22%,transparent)] bg-[var(--color-action-tint)] text-[var(--color-action)] ${className}`}
    >
      <LuLandmark size={Math.round(size * 0.5)} />
    </span>
  );
}
