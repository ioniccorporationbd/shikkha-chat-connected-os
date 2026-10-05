"use client";

import MobileWalletForm, { type MobileWalletFormProps } from "./MobileWalletForm";

/** bKash manual-payment form (thin wrapper over the shared wallet form). */
export default function BkashPaymentForm(props: Omit<MobileWalletFormProps, "method">) {
  return <MobileWalletForm {...props} method="bkash" />;
}
