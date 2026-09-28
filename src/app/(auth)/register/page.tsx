import type { Metadata } from "next";

import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "রেজিস্ট্রেশন · Shikkha Chat",
  description: "Create a Shikkha Chat account with your email and mobile number.",
};

export default function RegisterPage() {
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

      <RegisterForm />
    </main>
  );
}
