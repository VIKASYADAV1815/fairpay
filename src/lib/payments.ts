/**
 * Payment rails — country-aware handles for settle deep-links / share.
 * Fairpay does not move money; it stores preferred rails + builds messages.
 */

export type PayRail =
  | 'upi'
  | 'paypal'
  | 'venmo'
  | 'pix'
  | 'wise'
  | 'revolut'
  | 'iban'
  | 'cashapp'
  | 'other';

export type PaymentMethod = {
  rail: PayRail;
  handle: string;
};

export const PAY_RAILS: {
  rail: PayRail;
  label: string;
  placeholder: string;
  hint: string;
  regions: string;
}[] = [
  {
    rail: 'upi',
    label: 'UPI',
    placeholder: 'name@okaxis',
    hint: 'India · GPay / PhonePe / any UPI app',
    regions: 'IN',
  },
  {
    rail: 'paypal',
    label: 'PayPal',
    placeholder: 'you@email.com or paypal.me/you',
    hint: 'Global · email or paypal.me link',
    regions: 'Global',
  },
  {
    rail: 'venmo',
    label: 'Venmo',
    placeholder: '@username',
    hint: 'US · Venmo username',
    regions: 'US',
  },
  {
    rail: 'pix',
    label: 'Pix',
    placeholder: 'CPF / email / phone / key',
    hint: 'Brazil · Pix key',
    regions: 'BR',
  },
  {
    rail: 'wise',
    label: 'Wise',
    placeholder: 'tag or email',
    hint: 'Cross-border · Wise tag',
    regions: 'Global',
  },
  {
    rail: 'revolut',
    label: 'Revolut',
    placeholder: 'revolut.me/you or @revtag',
    hint: 'EU / UK · Revolut',
    regions: 'EU/UK',
  },
  {
    rail: 'iban',
    label: 'Bank / IBAN',
    placeholder: 'IBAN or account hint',
    hint: 'SEPA / wire · share details in chat',
    regions: 'EU+',
  },
  {
    rail: 'cashapp',
    label: 'Cash App',
    placeholder: '$cashtag',
    hint: 'US · Cash App',
    regions: 'US',
  },
  {
    rail: 'other',
    label: 'Other',
    placeholder: 'Handle or note',
    hint: 'Any local app or cash',
    regions: 'Global',
  },
];

export function railMeta(rail: PayRail) {
  return PAY_RAILS.find((r) => r.rail === rail) ?? PAY_RAILS[PAY_RAILS.length - 1];
}

export function primaryHandle(methods?: PaymentMethod[] | null): PaymentMethod | undefined {
  return methods?.find((m) => m.handle.trim().length > 0);
}

export function formatPayLabel(m?: PaymentMethod | null): string {
  if (!m?.handle) return 'No pay method';
  return `${railMeta(m.rail).label} · ${m.handle}`;
}

/** Legacy: treat bare UPI string as a payment method */
export function fromLegacyUpi(upiId?: string): PaymentMethod[] {
  if (!upiId?.trim()) return [];
  return [{ rail: 'upi', handle: upiId.trim() }];
}

export function settleHint(m?: PaymentMethod | null): string {
  if (!m?.handle) return 'Add a pay method on profile / people for auto-fill';
  return formatPayLabel(m);
}
