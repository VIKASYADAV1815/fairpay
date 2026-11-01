import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CurrencyCode } from '@/lib/currency';
import { DEFAULT_CURRENCY } from '@/lib/currency';
import type { PayRail, PaymentMethod } from '@/lib/payments';
import { fromLegacyUpi, primaryHandle } from '@/lib/payments';

export type Member = {
  id: string;
  name: string;
  /** @deprecated use paymentMethods — kept for older persisted data */
  upiId?: string;
  paymentMethods?: PaymentMethod[];
};

export function memberPayMethod(m: Member): PaymentMethod | undefined {
  return primaryHandle(m.paymentMethods) ?? fromLegacyUpi(m.upiId)[0];
}

export type ExpenseStatus = 'pending' | 'received' | 'settled';

/** Per-person split tracking */
export type ExpenseSplit = {
  memberId: string;
  amount: number;
  /** Has this person paid their share? */
  isPaid: boolean;
  paidAt?: string;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  paidById: string;
  /** Per-person split amounts and payment status */
  splits: ExpenseSplit[];
  /** @deprecated - kept for migration from old format */
  splitAmongIds?: string[];
  /** @deprecated - kept for migration from old format */
  customSplitAmounts?: Record<string, number>;
  /** @deprecated - kept for migration from old format */
  status?: ExpenseStatus;
  createdAt: string;
  recurring?: boolean;
  /** Free-form tag — user decides (Travel, Office, Rent…) */
  tag?: string;
  /** Local receipt image URI */
  receiptUri?: string;
};

export type PaidTransfer = {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  paidAt: string;
};

/** Group = any shared money context (travel, office, flat, party…) */
export type Trip = {
  id: string;
  name: string;
  /** Optional free label user picked or typed */
  purpose?: string;
  /** Display + settle currency for this group */
  currency: CurrencyCode;
  /** 6-char local invite — backend will mint later */
  inviteCode: string;
  members: Member[];
  expenses: Expense[];
  paidTransfers: PaidTransfer[];
  potCashback: number;
  createdAt: string;
};

type TripStore = {
  /** Schema version for migration logic */
  version: number;
  trips: Trip[];
  addTrip: (
    name: string,
    purpose?: string,
    currency?: CurrencyCode,
    /** Seed you as first member — groups still need 2+ to split */
    creatorName?: string,
  ) => Trip;
  addMember: (
    tripId: string,
    name: string,
    pay?: { rail?: PayRail; handle?: string } | string,
  ) => void;
  updateMember: (
    tripId: string,
    memberId: string,
    data: {
      name?: string;
      upiId?: string;
      paymentMethods?: PaymentMethod[];
    },
  ) => void;
  removeMember: (tripId: string, memberId: string) => void;
  addExpense: (
    tripId: string,
    data: {
      title: string;
      amount: number;
      paidById: string;
      splits: ExpenseSplit[];
      recurring?: boolean;
      tag?: string;
      receiptUri?: string;
    },
  ) => void;
  updateExpense: (
    tripId: string,
    expenseId: string,
    data: Partial<Pick<Expense, 'title' | 'amount' | 'tag' | 'recurring' | 'receiptUri' | 'paidById' | 'splits'>>,
  ) => void;
  /** Mark a specific person's share as paid/unpaid */
  toggleExpenseSplit: (tripId: string, expenseId: string, memberId: string) => void;
  removeExpense: (tripId: string, expenseId: string) => void;
  removeTrip: (tripId: string) => void;
  addCashback: (tripId: string, amount: number) => void;
  joinByInviteCode: (code: string, yourName?: string) => Trip | null;
  markTransferPaid: (
    tripId: string,
    data: { fromId: string; toId: string; amount: number },
  ) => void;
  unmarkTransferPaid: (tripId: string, paidId: string) => void;
  getTripTotal: (tripId: string) => number;
};

const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

function makeInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function transferKey(fromId: string, toId: string, amount: number) {
  return `${fromId}|${toId}|${amount.toFixed(2)}`;
}

const CURRENT_VERSION = 2;

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
  version: CURRENT_VERSION,
  trips: [],

  addTrip: (name, purpose, currency, creatorName) => {
    const you = creatorName?.trim();
    const trip: Trip = {
      id: uid('trip'),
      name: name.trim(),
      purpose: purpose?.trim() || undefined,
      currency: currency ?? DEFAULT_CURRENCY,
      inviteCode: makeInviteCode(),
      members: you
        ? [{ id: uid('m'), name: you }]
        : [],
      expenses: [],
      paidTransfers: [],
      potCashback: 0,
      createdAt: new Date().toISOString(),
    };
    set({ trips: [trip, ...get().trips] });
    return trip;
  },

  addMember: (tripId, name, pay) => {
    let paymentMethods: PaymentMethod[] | undefined;
    let upiId: string | undefined;
    if (typeof pay === 'string') {
      upiId = pay.trim() || undefined;
      paymentMethods = fromLegacyUpi(upiId);
    } else if (pay?.handle?.trim()) {
      const rail = pay.rail ?? 'other';
      paymentMethods = [{ rail, handle: pay.handle.trim() }];
      if (rail === 'upi') upiId = pay.handle.trim();
    }
    set({
      trips: get().trips.map((t) =>
        t.id !== tripId
          ? t
          : {
              ...t,
              members: [
                ...t.members,
                {
                  id: uid('m'),
                  name: name.trim(),
                  upiId,
                  paymentMethods: paymentMethods?.length ? paymentMethods : undefined,
                },
              ],
            },
      ),
    });
  },

  updateMember: (tripId, memberId, data) => {
    set({
      trips: get().trips.map((t) =>
        t.id !== tripId
          ? t
          : {
              ...t,
              members: t.members.map((m) => {
                if (m.id !== memberId) return m;
                const next: Member = {
                  ...m,
                  name: data.name?.trim() || m.name,
                };
                if (data.paymentMethods !== undefined) {
                  next.paymentMethods = data.paymentMethods;
                  const upi = data.paymentMethods.find((p) => p.rail === 'upi');
                  next.upiId = upi?.handle;
                } else if (data.upiId !== undefined) {
                  next.upiId = data.upiId.trim() || undefined;
                  next.paymentMethods = fromLegacyUpi(next.upiId);
                }
                return next;
              }),
            },
      ),
    });
  },

  removeMember: (tripId, memberId) => {
    set({
      trips: get().trips.map((t) =>
        t.id !== tripId
          ? t
          : {
              ...t,
              members: t.members.filter((m) => m.id !== memberId),
              expenses: t.expenses.map((e) => ({
                ...e,
                splitAmongIds: e.splitAmongIds?.filter((id) => id !== memberId),
              })),
            },
      ),
    });
  },

  addExpense: (tripId, data) => {
    set({
      trips: get().trips.map((t) =>
        t.id !== tripId
          ? t
          : {
              ...t,
              expenses: [
                {
                  id: uid('exp'),
                  title: data.title,
                  amount: data.amount,
                  paidById: data.paidById,
                  splits: data.splits,
                  recurring: data.recurring,
                  tag: data.tag?.trim() || undefined,
                  receiptUri: data.receiptUri,
                  createdAt: new Date().toISOString(),
                },
                ...t.expenses,
              ],
            },
      ),
    });
  },

  updateExpense: (tripId, expenseId, data) => {
    set({
      trips: get().trips.map((t) =>
        t.id !== tripId
          ? t
          : {
              ...t,
              expenses: t.expenses.map((e) =>
                e.id === expenseId ? { ...e, ...data } : e,
              ),
            },
      ),
    });
  },

  removeExpense: (tripId, expenseId) => {
    set({
      trips: get().trips.map((t) =>
        t.id !== tripId
          ? t
          : { ...t, expenses: t.expenses.filter((e) => e.id !== expenseId) },
      ),
    });
  },

  removeTrip: (tripId) => {
    set({ trips: get().trips.filter((t) => t.id !== tripId) });
  },

  toggleExpenseSplit: (tripId, expenseId, memberId) => {
    set({
      trips: get().trips.map((t) =>
        t.id !== tripId
          ? t
          : {
              ...t,
              expenses: t.expenses.map((e) =>
                e.id !== expenseId
                  ? e
                  : {
                      ...e,
                      splits: e.splits.map((s) =>
                        s.memberId !== memberId
                          ? s
                          : {
                              ...s,
                              isPaid: !s.isPaid,
                              paidAt: !s.isPaid ? new Date().toISOString() : undefined,
                            },
                      ),
                    },
              ),
            },
      ),
    });
  },

  joinByInviteCode: (code, yourName) => {
    const normalized = code.trim().toUpperCase();
    const existing = get().trips.find((t) => t.inviteCode === normalized);
    if (existing) {
      if (yourName?.trim()) {
        get().addMember(existing.id, yourName.trim());
      }
      return existing;
    }
    // Demo: create a local shadow group when code isn’t on this device
    const trip: Trip = {
      id: uid('trip'),
      name: `Joined · ${normalized}`,
      purpose: 'Invite',
      currency: DEFAULT_CURRENCY,
      inviteCode: normalized,
      members: yourName?.trim()
        ? [{ id: uid('m'), name: yourName.trim() }]
        : [],
      expenses: [],
      paidTransfers: [],
      potCashback: 0,
      createdAt: new Date().toISOString(),
    };
    set({ trips: [trip, ...get().trips] });
    return trip;
  },

  addCashback: (tripId, amount) => {
    set({
      trips: get().trips.map((t) =>
        t.id !== tripId ? t : { ...t, potCashback: Math.round((t.potCashback + amount) * 100) / 100 },
      ),
    });
  },

  markTransferPaid: (tripId, data) => {
    set({
      trips: get().trips.map((t) => {
        if (t.id !== tripId) return t;
        const key = transferKey(data.fromId, data.toId, data.amount);
        const already = t.paidTransfers.some(
          (p) => transferKey(p.fromId, p.toId, p.amount) === key,
        );
        if (already) return t;
        return {
          ...t,
          paidTransfers: [
            ...t.paidTransfers,
            {
              id: uid('paid'),
              fromId: data.fromId,
              toId: data.toId,
              amount: data.amount,
              paidAt: new Date().toISOString(),
            },
          ],
        };
      }),
    });
  },

  unmarkTransferPaid: (tripId, paidId) => {
    set({
      trips: get().trips.map((t) =>
        t.id !== tripId
          ? t
          : { ...t, paidTransfers: t.paidTransfers.filter((p) => p.id !== paidId) },
      ),
    });
  },

  getTripTotal: (tripId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return 0;
    return trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  },
}),
    {
      name: 'fairpay-trips',
      version: CURRENT_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState: any, version: number) => {
        // Migrate from v1 to v2: Convert splitAmongIds to splits array
        if (version < 2) {
          const state = persistedState as TripStore;
          state.trips = state.trips.map((t) => ({
            ...t,
            expenses: t.expenses.map((e: any) => {
              // Already has splits? Keep it
              if (e.splits && Array.isArray(e.splits)) return e;
              
              // Convert old format to new
              const splits: ExpenseSplit[] = [];
              const splitIds = e.splitAmongIds || [];
              
              if (e.customSplitAmounts) {
                // Custom splits
                splitIds.forEach((id: string) => {
                  splits.push({
                    memberId: id,
                    amount: e.customSplitAmounts[id] || 0,
                    isPaid: id === e.paidById, // Payer auto-paid
                    paidAt: id === e.paidById ? e.createdAt : undefined,
                  });
                });
              } else {
                // Equal splits
                const share = e.amount / (splitIds.length || 1);
                splitIds.forEach((id: string) => {
                  splits.push({
                    memberId: id,
                    amount: share,
                    isPaid: id === e.paidById,
                    paidAt: id === e.paidById ? e.createdAt : undefined,
                  });
                });
              }
              
              return {
                ...e,
                splits,
                // Keep old fields for compatibility
                splitAmongIds: e.splitAmongIds,
                customSplitAmounts: e.customSplitAmounts,
                status: e.status,
              };
            }),
          }));
        }
        return persistedState as TripStore;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<TripStore>;
        const trips = (p.trips ?? current.trips).map((t) => ({
          ...t,
          currency: t.currency ?? DEFAULT_CURRENCY,
          inviteCode: t.inviteCode || makeInviteCode(),
          members: (t.members ?? []).map((m) => ({
            ...m,
            paymentMethods:
              m.paymentMethods?.length ? m.paymentMethods : fromLegacyUpi(m.upiId),
          })),
        }));
        return { ...current, version: CURRENT_VERSION, ...p, trips };
      },
    },
  ),
);
