import { Linking } from 'react-native';
import { formatMoney } from '@/lib/currency';
import type { PaymentMethod } from '@/lib/payments';
import { railMeta } from '@/lib/payments';

/** India UPI intent — only when rail is upi */
export function buildUpiLink(opts: {
  pa: string;
  pn: string;
  am: number;
  tn?: string;
}) {
  const params = new URLSearchParams({
    pa: opts.pa,
    pn: opts.pn,
    am: opts.am.toFixed(2),
    cu: 'INR',
  });
  if (opts.tn) params.set('tn', opts.tn.slice(0, 80));
  return `upi://pay?${params.toString()}`;
}

/** Best-effort openable link for a pay method (or undefined) */
export function buildPayLink(opts: {
  method?: PaymentMethod | null;
  payeeName: string;
  amount: number;
  note?: string;
}): string | undefined {
  const m = opts.method;
  if (!m?.handle) return undefined;
  const h = m.handle.trim();

  if (m.rail === 'upi') {
    return buildUpiLink({
      pa: h,
      pn: opts.payeeName,
      am: opts.amount,
      tn: opts.note,
    });
  }
  if (m.rail === 'paypal') {
    if (h.includes('paypal.me')) {
      const base = h.startsWith('http') ? h : `https://${h.replace(/^\/\//, '')}`;
      return `${base}/${opts.amount.toFixed(2)}`;
    }
    return `https://www.paypal.com/paypalme/${h.replace(/^@/, '')}/${opts.amount.toFixed(2)}`;
  }
  if (m.rail === 'venmo') {
    const user = h.replace(/^@/, '');
    return `https://venmo.com/${user}?txn=pay&amount=${opts.amount.toFixed(2)}&note=${encodeURIComponent(opts.note ?? 'Fairpay')}`;
  }
  if (m.rail === 'cashapp') {
    const tag = h.startsWith('$') ? h : `$${h}`;
    return `https://cash.app/${tag}/${opts.amount.toFixed(2)}`;
  }
  if (m.rail === 'revolut' && h.includes('revolut.me')) {
    return h.startsWith('http') ? h : `https://${h}`;
  }
  // Pix / Wise / IBAN / other — no universal deep link; WhatsApp carries the handle
  return undefined;
}

export function buildWhatsAppSettleMessage(opts: {
  debtorName: string;
  creditorName: string;
  amount: number;
  tripName: string;
  currency?: string;
  method?: PaymentMethod | null;
  payLink?: string;
}) {
  const money = formatMoney(opts.amount, opts.currency);
  const base = `Hey ${opts.debtorName}, your share for *${opts.tripName}* is ${money}. Please pay ${opts.creditorName}.`;

  const bits: string[] = [base];
  if (opts.method?.handle) {
    bits.push(`Pay via ${railMeta(opts.method.rail).label}: ${opts.method.handle}`);
  }
  if (opts.payLink) {
    bits.push(`Link: ${opts.payLink}`);
  }
  bits.push('— via Fairpay');
  return bits.join('\n\n');
}

export async function openWhatsAppWithMessage(message: string, phoneDigits?: string) {
  const text = encodeURIComponent(message);
  const url = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${text}`
    : `https://wa.me/?text=${text}`;
  await Linking.openURL(url);
}

export async function openPayLink(link: string) {
  await Linking.openURL(link);
}
