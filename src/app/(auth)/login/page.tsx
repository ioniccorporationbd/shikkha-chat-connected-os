import type { Metadata } from "next";
import { Suspense } from "react";

import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in · Shikkha Chat",
  description: "Sign in to the Shikkha Chat panel.",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[var(--color-primary)] px-4 py-10 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 22%, color-mix(in srgb, var(--color-secondary) 45%, transparent) 0%, transparent 42%), radial-gradient(circle at 82% 78%, color-mix(in srgb, var(--color-secondary) 30%, transparent) 0%, transparent 46%)",
        }}
      />

      {/* useSearchParams() inside LoginForm needs a Suspense boundary. */}
      <Suspense fallback={<div className="h-[420px] w-full max-w-[460px] rounded-[28px] border border-[var(--color-primary)] bg-[var(--color-white)]" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
