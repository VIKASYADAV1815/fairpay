/** Group / profile currencies — Phase A display only (no live FX yet) */

export type CurrencyCode =
  | 'INR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'AED'
  | 'SGD'
  | 'AUD'
  | 'CAD'
  | 'BRL'
  | 'JPY';

export type CurrencyMeta = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  /** BCP 47 locale for number grouping */
  locale: string;
  /** Minor units (JPY = 0) */
  decimals: number;
};

export const CURRENCIES: CurrencyMeta[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimals: 2 },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', decimals: 2 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'en-AE', decimals: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', decimals: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', decimals: 2 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', decimals: 0 },
];

export const DEFAULT_CURRENCY: CurrencyCode = 'INR';

export function getCurrency(code?: string | null): CurrencyMeta {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/** Format for lists / settle rows */
export function formatMoney(amount: number, code?: string | null): string {
  const meta = getCurrency(code);
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(meta.locale, {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  });
  const sign = amount < 0 ? '−' : '';
  return `${sign}${meta.symbol}${formatted}`;
}

export function currencySymbol(code?: string | null): string {
  return getCurrency(code).symbol;
}
