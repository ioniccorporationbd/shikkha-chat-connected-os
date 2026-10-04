/** Format a payment amount in the document currency, in the active language. */

export function formatAmount(value: number, currency: string, language: string): string {
  const amount = Number.isFinite(value) ? value : 0;
  const locale = language === "en" ? "en-BD" : "bn-BD";
  const code = (currency || "BDT").toUpperCase();

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const symbol = code === "BDT" ? "৳" : `${code} `;
    return `${symbol}${amount.toLocaleString(locale, { maximumFractionDigits: 2 })}`;
  }
}

/** A short, localised date (Frappe returns "YYYY-MM-DD"). */
export function formatDate(value: string | null | undefined, language: string): string {
  if (!value) return "";
  const iso = value.length <= 10 ? `${value}T00:00:00` : value.replace(" ", "T");
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return value;

  try {
    return parsed.toLocaleDateString(language === "en" ? "en-GB" : "bn-BD", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return value;
  }
}
