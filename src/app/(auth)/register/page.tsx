import type { Metadata } from "next";

import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "রেজিস্ট্রেশন · Shikkha Chat",
  description: "Create a Shikkha Chat account with your email and mobile number.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
