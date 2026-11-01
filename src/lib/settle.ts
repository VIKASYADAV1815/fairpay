import type { Expense, Member } from '@/store/trips';
import { memberPayMethod } from '@/store/trips';
import type { PaymentMethod } from '@/lib/payments';

export type Balance = {
  memberId: string;
  name: string;
  upiId?: string;
  payMethod?: PaymentMethod;
  net: number; // positive = owed money, negative = owes
};

export type Transfer = {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  toUpiId?: string;
  toPayMethod?: PaymentMethod;
  amount: number;
};

/** Net balance per member from expenses */
export function computeBalances(members: Member[], expenses: Expense[]): Balance[] {
  const map = new Map<string, number>();
  members.forEach((m) => map.set(m.id, 0));

  for (const e of expenses) {
    if (!e.splits || !e.splits.length) continue;
    
    // Payer gets credited the full amount
    map.set(e.paidById, (map.get(e.paidById) ?? 0) + e.amount);
    
    // Deduct each person's share
    for (const split of e.splits) {
      map.set(split.memberId, (map.get(split.memberId) ?? 0) - split.amount);
    }
  }

  return members.map((m) => ({
    memberId: m.id,
    name: m.name,
    upiId: m.upiId,
    payMethod: memberPayMethod(m),
    net: Math.round((map.get(m.id) ?? 0) * 100) / 100,
  }));
}

/** Minimize transfers: greedy match debtors → creditors */
export function minimizeTransfers(balances: Balance[]): Transfer[] {
  const debtors = balances
    .filter((b) => b.net < -0.009)
    .map((b) => ({ ...b, net: -b.net }))
    .sort((a, b) => b.net - a.net);
  const creditors = balances
    .filter((b) => b.net > 0.009)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.net - a.net);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const amount = Math.round(Math.min(d.net, c.net) * 100) / 100;
    if (amount > 0) {
      transfers.push({
        fromId: d.memberId,
        fromName: d.name,
        toId: c.memberId,
        toName: c.name,
        toUpiId: c.upiId,
        toPayMethod: c.payMethod,
        amount,
      });
    }
    d.net -= amount;
    c.net -= amount;
    if (d.net < 0.01) i += 1;
    if (c.net < 0.01) j += 1;
  }

  return transfers;
}
