/**
 * Payment rails — country-aware handles for settle deep-links / share.
 * Fairpay does not move money; it stores preferred rails + builds messages.
 * Ideal for solo developers: 0 merchant fees, 0 backend gateways, 100% native deep links.
 */

export type PayRail =
  | 'upi'
  | 'phonepe'
  | 'gpay'
  | 'paytm'
  | 'paypal'
  | 'venmo'
  | 'cashapp'
  | 'pix'
  | 'wise'
  | 'revolut'
  | 'iban'
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
  brand: string;
}[] = [
  {
    rail: 'upi',
    label: 'UPI (Any App)',
    placeholder: 'username@okhdfcbank',
    hint: 'India · BHIM, Cred or any bank UPI',
    regions: 'IN',
    brand: 'upi',
  },
  {
    rail: 'phonepe',
    label: 'PhonePe',
    placeholder: '9876543210@ybl',
    hint: 'India · PhonePe UPI ID',
    regions: 'IN',
    brand: 'phonepe',
  },
  {
    rail: 'gpay',
    label: 'Google Pay',
    placeholder: 'name@okhdfcbank',
    hint: 'India · GPay UPI ID',
    regions: 'IN',
    brand: 'gpay',
  },
  {
    rail: 'paytm',
    label: 'Paytm',
    placeholder: '9876543210@paytm',
    hint: 'India · Paytm UPI ID',
    regions: 'IN',
    brand: 'paytm',
  },
  {
    rail: 'paypal',
    label: 'PayPal',
    placeholder: 'paypal.me/username',
    hint: 'Global · paypal.me link or email',
    regions: 'Global',
    brand: 'paypal',
  },
  {
    rail: 'venmo',
    label: 'Venmo',
    placeholder: '@username',
    hint: 'US · Venmo handle',
    regions: 'US',
    brand: 'venmo',
  },
  {
    rail: 'cashapp',
    label: 'Cash App',
    placeholder: '$cashtag',
    hint: 'US/UK · Cash App tag',
    regions: 'US/UK',
    brand: 'cashapp',
  },
  {
    rail: 'other',
    label: 'Bank / Cash',
    placeholder: 'Account / Bank note',
    hint: 'Direct bank transfer or cash',
    regions: 'Global',
    brand: 'bank',
  },
];

export function railMeta(rail: PayRail) {
  return PAY_RAILS.find((r) => r.rail === rail) ?? PAY_RAILS[0];
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
