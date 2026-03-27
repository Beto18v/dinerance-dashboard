export interface CurrencyOption {
  code: string;
  label: string;
}

export const currencyOptions: CurrencyOption[] = [
  { code: "COP", label: "COP - Colombian Peso" },
  { code: "USD", label: "USD - US Dollar" },
  { code: "EUR", label: "EUR - Euro" },
  { code: "MXN", label: "MXN - Mexican Peso" },
  { code: "ARS", label: "ARS - Argentine Peso" },
  { code: "CLP", label: "CLP - Chilean Peso" },
  { code: "PEN", label: "PEN - Peruvian Sol" },
  { code: "BRL", label: "BRL - Brazilian Real" },
  { code: "GBP", label: "GBP - British Pound" },
  { code: "CAD", label: "CAD - Canadian Dollar" },
  { code: "AUD", label: "AUD - Australian Dollar" },
  { code: "CHF", label: "CHF - Swiss Franc" },
  { code: "JPY", label: "JPY - Japanese Yen" },
];

export function normalizeCurrencyCode(value: string) {
  return value.trim().toUpperCase();
}

export function isValidCurrencyCode(value: string) {
  return /^[A-Z]{3}$/.test(normalizeCurrencyCode(value));
}

export function formatCurrencyAmount(
  value: string | number,
  currency: string,
  locale: string,
) {
  const normalizedCurrency = normalizeCurrencyCode(currency || "COP");
  const amount = Number(value || 0);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: normalizedCurrency,
    ...(normalizedCurrency === "COP"
      ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
      : {}),
  })
    .format(amount)
    .replace(/\s+/g, "");
}
