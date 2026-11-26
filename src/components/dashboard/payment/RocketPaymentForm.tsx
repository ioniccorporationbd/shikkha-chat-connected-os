"use client";

import MobileWalletForm, { type MobileWalletFormProps } from "./MobileWalletForm";

/** Rocket manual-payment form (thin wrapper over the shared wallet form). */
export default function RocketPaymentForm(props: Omit<MobileWalletFormProps, "method">) {
  return <MobileWalletForm {...props} method="rocket" />;
}
