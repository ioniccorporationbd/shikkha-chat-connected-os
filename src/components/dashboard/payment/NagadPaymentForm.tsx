"use client";

import MobileWalletForm, { type MobileWalletFormProps } from "./MobileWalletForm";

/** Nagad manual-payment form (thin wrapper over the shared wallet form). */
export default function NagadPaymentForm(props: Omit<MobileWalletFormProps, "method">) {
  return <MobileWalletForm {...props} method="nagad" />;
}
