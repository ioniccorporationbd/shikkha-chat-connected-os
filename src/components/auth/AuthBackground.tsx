/**
 * The global auth background — one calm, premium surface shared by every
 * authentication screen (sign-in, sign-up and all OTP / reset steps via the
 * shared auth layout). Mostly white / off-white with a very subtle gradient and
 * soft blurred decorative shapes. Deliberately light — no dark or heavy fill.
 */
export default function AuthBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* base: white -> off-white -> cool off-white, very subtle */}
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#FFFFFF_0%,#FAFAFA_48%,#F8FAFC_100%)]" />

      {/* soft decorative shapes in the brand's light tint */}
      <div className="absolute -left-28 -top-28 h-[440px] w-[440px] rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_42%,transparent)] blur-[130px]" />
      <div className="absolute -right-24 top-1/4 h-[380px] w-[380px] rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_34%,transparent)] blur-[120px]" />
      <div className="absolute bottom-[-12%] left-1/3 h-[320px] w-[320px] rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_30%,transparent)] blur-[110px]" />
    </div>
  );
}
