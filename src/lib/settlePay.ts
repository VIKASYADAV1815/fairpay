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

/**
 * Build WhatsApp message for expense notification (when someone adds a new expense)
 * Notifies unpaid members immediately after expense is created
 */
export function buildExpenseNotificationMessage(opts: {
  memberName: string;
  payerName: string;
  amount: number;
  expenseTitle: string;
  tripName: string;
  currency?: string;
  method?: PaymentMethod | null;
  payLink?: string;
  returnUrl?: string; // Deep link to return after payment
}) {
  const money = formatMoney(opts.amount, opts.currency);
  const greeting = `Hey ${opts.memberName}! 👋`;
  const main = `${opts.payerName} paid *${money}* for *${opts.expenseTitle}* in "${opts.tripName}".`;
  const share = `Your share: *${money}*`;

  const bits: string[] = [greeting, main, share];
  
  if (opts.method?.handle) {
    bits.push(`\n💳 *PAY TO:*`);
    bits.push(`${opts.payerName}`);
    bits.push(`${railMeta(opts.method.rail).label}: ${opts.method.handle}`);
  }
  
  if (opts.payLink) {
    bits.push(`\n📱 *STEP 1 - Pay now:*`);
    bits.push(opts.payLink);
    bits.push(`👆 Tap to open payment app`);
    
    if (opts.returnUrl) {
      bits.push(`\n✅ *STEP 2 - After paying:*`);
      bits.push(opts.returnUrl);
      bits.push(`👆 Tap to confirm in Fairpay`);
    }
  } else if (opts.returnUrl) {
    bits.push(`\n✅ *After paying, confirm here:*`);
    bits.push(opts.returnUrl);
    bits.push(`👆 Tap to mark as paid`);
  }
  
  bits.push('\n💚 — Fairpay');
  return bits.join('\n');
}

/**
 * Send WhatsApp notifications to all unpaid members after expense is created
 * Opens WhatsApp for each member sequentially (user must tap through each one)
 */
export async function sendExpenseNotifications(opts: {
  expense: {
    id: string;
    title: string;
    amount: number;
    paidById: string;
    splits: Array<{ memberId: string; amount: number; isPaid: boolean }>;
  };
  members: Array<{ id: string; name: string; paymentMethods?: PaymentMethod[] }>;
  tripId: string;
  tripName: string;
  currency?: string;
  payerPhone?: string;
}) {
  const payer = opts.members.find((m) => m.id === opts.expense.paidById);
  if (!payer) return;

  const payerMethod = opts.members.find((m) => m.id === opts.expense.paidById)?.paymentMethods?.[0];
  
  // Get unpaid splits (everyone except the payer)
  const unpaidSplits = opts.expense.splits.filter((s) => !s.isPaid);
  
  for (const split of unpaidSplits) {
    const member = opts.members.find((m) => m.id === split.memberId);
    if (!member) continue;

    // Build payment link if payer has a payment method
    const payLink = payerMethod
      ? buildPayLink({
          method: payerMethod,
          payeeName: payer.name,
          amount: split.amount,
          note: `${opts.expense.title} - ${opts.tripName}`,
        })
      : undefined;

    // Build return URL for after payment
    const returnUrl = `fairpay://payment-complete?tripId=${opts.tripId}&expenseId=${opts.expense.id}&memberId=${split.memberId}`;

    const message = buildExpenseNotificationMessage({
      memberName: member.name,
      payerName: payer.name,
      amount: split.amount,
      expenseTitle: opts.expense.title,
      tripName: opts.tripName,
      currency: opts.currency,
      method: payerMethod,
      payLink,
      returnUrl,
    });

    // Open WhatsApp with the message
    // Note: This opens WhatsApp sequentially - user needs to send/skip each message
    await openWhatsAppWithMessage(message);
    
    // Add small delay between WhatsApp opens to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/**
 * Build WhatsApp reminder message for unpaid expense
 * Similar to initial notification but as a gentle reminder
 */
export function buildPaymentReminderMessage(opts: {
  memberName: string;
  payerName: string;
  amount: number;
  expenseTitle: string;
  tripName: string;
  currency?: string;
  method?: PaymentMethod | null;
  payLink?: string;
  returnUrl?: string;
}) {
  const money = formatMoney(opts.amount, opts.currency);
  const greeting = `Hey ${opts.memberName}! 👋`;
  const reminder = `🔔 *Friendly reminder:*`;
  const main = `You have *${money}* pending for *${opts.expenseTitle}* in "${opts.tripName}"`;

  const bits: string[] = [greeting, reminder, main];
  
  if (opts.method?.handle) {
    bits.push(`\n💳 *PAY TO:*`);
    bits.push(`${opts.payerName}`);
    bits.push(`${railMeta(opts.method.rail).label}: ${opts.method.handle}`);
  }
  
  if (opts.payLink) {
    bits.push(`\n📱 *Tap to pay:*`);
    bits.push(opts.payLink);
    
    if (opts.returnUrl) {
      bits.push(`\n✅ *After paying, confirm:*`);
      bits.push(opts.returnUrl);
    }
  } else if (opts.returnUrl) {
    bits.push(`\n✅ *Tap to mark as paid:*`);
    bits.push(opts.returnUrl);
  }
  
  bits.push('\n💚 — Fairpay');
  return bits.join('\n');
}

/**
 * Send payment reminder to a specific member for an unpaid expense
 */
export async function sendPaymentReminder(opts: {
  member: { id: string; name: string; paymentMethods?: PaymentMethod[] };
  payer: { id: string; name: string; paymentMethods?: PaymentMethod[] };
  expense: {
    id: string;
    title: string;
    amount: number;
  };
  splitAmount: number;
  tripId: string;
  tripName: string;
  currency?: string;
}) {
  const payerMethod = opts.payer.paymentMethods?.[0];
  
  // Build payment link if payer has a payment method
  const payLink = payerMethod
    ? buildPayLink({
        method: payerMethod,
        payeeName: opts.payer.name,
        amount: opts.splitAmount,
        note: `${opts.expense.title} - ${opts.tripName}`,
      })
    : undefined;

  // Build return URL
  const returnUrl = `fairpay://payment-complete?tripId=${opts.tripId}&expenseId=${opts.expense.id}&memberId=${opts.member.id}`;

  const message = buildPaymentReminderMessage({
    memberName: opts.member.name,
    payerName: opts.payer.name,
    amount: opts.splitAmount,
    expenseTitle: opts.expense.title,
    tripName: opts.tripName,
    currency: opts.currency,
    method: payerMethod,
    payLink,
    returnUrl,
  });

  // Open WhatsApp with the reminder message
  await openWhatsAppWithMessage(message);
}
