import AuthBackground from "@/components/auth/AuthBackground";

/**
 * Shared layout for every auth route. Centralises the premium white/off-white
 * background and the centered column so Login and Register (and their OTP /
 * reset steps) share one structure and one source of truth.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <AuthBackground />
      {children}
    </main>
  );
}
