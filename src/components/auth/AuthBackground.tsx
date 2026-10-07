/**
 * The global auth background — one calm, premium surface shared by every
 * authentication screen (sign-in, sign-up and all OTP / reset steps via the
 * shared auth layout).
 *
 * Shikkha-red system: a very light white/off-white base carries three soft,
 * heavily-blurred glows in a low-opacity Shikkha red (the action colour), plus
 * a barely-there dot wash for depth. Deliberately light — no dark or heavy
 * fill, and the red never reads as an alert.
 */
export default function AuthBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* base: white -> warm off-white, very subtle */}
      <div className="absolute inset-0 bg-[linear-gradient(165deg,#FFFFFF_0%,#FEFCFC_52%,#FBF7F7_100%)]" />

      {/* soft decorative glows in the brand's action-red tint */}
      <div className="absolute -left-28 -top-32 h-[460px] w-[460px] rounded-full bg-[color-mix(in_srgb,var(--color-action)_10%,transparent)] blur-[140px]" />
      <div className="absolute -right-24 top-1/4 h-[400px] w-[400px] rounded-full bg-[color-mix(in_srgb,var(--color-action)_8%,transparent)] blur-[130px]" />
      <div className="absolute bottom-[-14%] left-1/3 h-[340px] w-[340px] rounded-full bg-[color-mix(in_srgb,var(--color-action)_7%,transparent)] blur-[120px]" />

      {/* faint dot wash for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,color-mix(in_srgb,var(--color-primary)_7%,transparent)_1px,transparent_0)] opacity-40 [background-size:22px_22px]" />
    </div>
  );
}
