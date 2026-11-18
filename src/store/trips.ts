import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CurrencyCode } from '@/lib/currency';
import { DEFAULT_CURRENCY } from '@/lib/currency';
import type { PayRail, PaymentMethod } from '@/lib/payments';
import { fromLegacyUpi, primaryHandle } from '@/lib/payments';
import { syncManager } from '@/lib/sync-manager';
import { isCloudEnabled } from '@/lib/storage';

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
  
  /** Cloud sync state */
  loading: boolean;
  syncing: boolean;
  error: string | null;
  
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
  joinByInviteCodeAsync: (code: string, yourName?: string) => Promise<Trip | null>;
  syncTripFromCloud: (tripId: string) => Promise<void>;
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

export function mapCloudTripToLocal(
  cloudTrip: any,
  cloudMembers: any[],
  cloudExpenses: any[],
): Trip {
  const members: Member[] = (cloudMembers || []).map((m: any) => {
    const u = m.user || {};
    const rawMethods = m.payment_methods || u.payment_methods || [];
    const pm = Array.isArray(rawMethods) ? rawMethods : [];
    const upi = pm.find?.((p: any) => p?.rail === 'upi')?.handle;
    return {
      id: m.user_id || m.id,
      name: u.name || m.name || 'Member',
      upiId: upi,
      paymentMethods: pm.length > 0 ? pm : undefined,
    };
  });

  const expenses: Expense[] = (cloudExpenses || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    amount: Number(e.amount) || 0,
    paidById: e.paid_by_id || '',
    splits: (e.splits || []).map((s: any) => ({
      memberId: s.user_id,
      amount: Number(s.amount) || 0,
      isPaid: Boolean(s.is_paid),
      paidAt: s.paid_at || undefined,
    })),
    recurring: Boolean(e.recurring),
    tag: e.tag || undefined,
    receiptUri: e.receipt_url || undefined,
    createdAt: e.created_at || new Date().toISOString(),
  }));

  return {
    id: cloudTrip.id,
    name: cloudTrip.name,
    purpose: cloudTrip.purpose || undefined,
    currency: (cloudTrip.currency as CurrencyCode) || DEFAULT_CURRENCY,
    inviteCode: cloudTrip.invite_code || '',
    members,
    expenses,
    paidTransfers: [],
    potCashback: Number(cloudTrip.pot_cashback) || 0,
    createdAt: cloudTrip.created_at || new Date().toISOString(),
  };
}

const CURRENT_VERSION = 2;

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
  version: CURRENT_VERSION,
  trips: [],
  
  // Cloud sync state
  loading: false,
  syncing: false,
  error: null,

  addTrip: (name, purpose, currency, creatorName) => {
    const you = creatorName?.trim();
    let creatorPayMethods: PaymentMethod[] | undefined;
    let creatorUpi: string | undefined;
    try {
      const { useAuthStore } = require('./auth');
      const auth = useAuthStore.getState();
      if (auth.paymentMethods && auth.paymentMethods.length > 0) {
        creatorPayMethods = auth.paymentMethods;
        creatorUpi = auth.paymentMethods.find((p: any) => p.rail === 'upi')?.handle || auth.upiId;
      } else if (auth.upiId) {
        creatorUpi = auth.upiId;
        creatorPayMethods = fromLegacyUpi(auth.upiId);
      }
    } catch {
      // ignore if store not available yet
    }

    const trip: Trip = {
      id: uid('trip'),
      name: name.trim(),
      purpose: purpose?.trim() || undefined,
      currency: currency ?? DEFAULT_CURRENCY,
      inviteCode: makeInviteCode(),
      members: you
        ? [{
            id: uid('m'),
            name: you,
            upiId: creatorUpi,
            paymentMethods: creatorPayMethods,
          }]
        : [],
      expenses: [],
      paidTransfers: [],
      potCashback: 0,
      createdAt: new Date().toISOString(),
    };
    set({ trips: [trip, ...get().trips] });
    
    // Sync to cloud
    if (isCloudEnabled()) {
      const { useAuthStore } = require('./auth');
      const user = useAuthStore.getState().user;
      syncManager.syncTrip(trip, user?.id || 'guest').catch((error) => {
        console.log('[Sync] group queued/synced:', error?.message);
      });
    }
    
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
    const memberId = uid('m');
    const newMember: Member = {
      id: memberId,
      name: name.trim(),
      upiId,
      paymentMethods: paymentMethods?.length ? paymentMethods : undefined,
    };
    set({
      trips: get().trips.map((t) =>
        t.id !== tripId
          ? t
          : {
              ...t,
              members: [
                ...t.members,
                newMember,
              ],
            },
      ),
    });

    if (isCloudEnabled()) {
      try {
        const { addTripMember } = require('@/lib/api/members');
        addTripMember({
          tripId,
          name: name.trim(),
          upiId,
          role: 'member',
          paymentMethods: paymentMethods?.length ? paymentMethods : undefined,
        }).catch((err: any) => console.log('[Sync] addMember note:', err?.message));
      } catch {
        // ignore
      }
    }
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

    if (isCloudEnabled()) {
      try {
        const { removeTripMember } = require('@/lib/api/members');
        removeTripMember(tripId, memberId).catch((err: any) => console.log('[Sync] removeMember note:', err?.message));
      } catch {
        // ignore
      }
    }
  },

  addExpense: (tripId, data) => {
    const expense: Expense = {
      id: uid('exp'),
      title: data.title,
      amount: data.amount,
      paidById: data.paidById,
      splits: data.splits,
      recurring: data.recurring,
      tag: data.tag?.trim() || undefined,
      receiptUri: data.receiptUri,
      createdAt: new Date().toISOString(),
    };
    
    set({
      trips: get().trips.map((t) =>
        t.id !== tripId
          ? t
          : {
              ...t,
              expenses: [expense, ...t.expenses],
            },
      ),
    });
    
    // Sync to cloud if logged in
    if (isCloudEnabled()) {
      const { useAuthStore } = require('./auth');
      const user = useAuthStore.getState().user;
      if (user) {
        const expenseData = {
          tripId,
          title: data.title,
          amount: data.amount,
          paidById: data.paidById,
          tag: data.tag,
          recurring: data.recurring,
          splits: data.splits.map(s => ({
            userId: s.memberId,
            amount: s.amount,
            isPaid: s.isPaid,
          })),
        };
        
        syncManager.syncExpense(expenseData).catch((error) => {
          console.error('Failed to sync expense:', error);
        });
      }
    }
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

    if (isCloudEnabled()) {
      try {
        const { deleteExpense } = require('@/lib/api/expenses');
        deleteExpense(expenseId).catch((err: any) => console.log('[Sync] deleteExpense note:', err?.message));
      } catch {
        // ignore
      }
    }
  },

  removeTrip: (tripId) => {
    set({ trips: get().trips.filter((t) => t.id !== tripId) });
  },

  toggleExpenseSplit: (tripId, expenseId, memberId) => {
    let nextPaid = false;
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
                      splits: e.splits.map((s) => {
                        if (s.memberId !== memberId) return s;
                        nextPaid = !s.isPaid;
                        return {
                          ...s,
                          isPaid: nextPaid,
                          paidAt: nextPaid ? new Date().toISOString() : undefined,
                        };
                      }),
                    },
              ),
            },
      ),
    });

    if (isCloudEnabled()) {
      try {
        const { toggleSplitPayment } = require('@/lib/api/expenses');
        toggleSplitPayment(expenseId, nextPaid).catch((err: any) => console.log('[Sync] toggleSplit note:', err?.message));
      } catch {
        // ignore
      }
    }
  },

  joinByInviteCode: (code, yourName) => {
    const normalized = code.trim().toUpperCase();
    const existing = get().trips.find((t) => t.inviteCode === normalized);
    
    let joinName = yourName?.trim();
    let joinPay: PaymentMethod | undefined;
    try {
      const { useAuthStore } = require('./auth');
      const auth = useAuthStore.getState();
      if (!joinName) joinName = auth.name || 'Friend';
      if (auth.paymentMethods && auth.paymentMethods.length > 0) {
        joinPay = auth.paymentMethods[0];
      } else if (auth.upiId) {
        joinPay = { rail: 'upi', handle: auth.upiId };
      }
    } catch {
      // ignore
    }

    if (existing) {
      if (joinName && !existing.members.some((m) => m.name.toLowerCase() === joinName?.toLowerCase())) {
        get().addMember(existing.id, joinName, joinPay);
      }
      return existing;
    }

    // Trigger cloud lookup in background if cloud is enabled
    if (isCloudEnabled()) {
      get().joinByInviteCodeAsync(normalized, yourName).catch(() => {});
    }

    // Demo: create a local shadow group when code isn’t on this device
    const trip: Trip = {
      id: uid('trip'),
      name: `Joined · ${normalized}`,
      purpose: 'Invite',
      currency: DEFAULT_CURRENCY,
      inviteCode: normalized,
      members: joinName
        ? [{
            id: uid('m'),
            name: joinName,
            upiId: joinPay?.rail === 'upi' ? joinPay.handle : undefined,
            paymentMethods: joinPay ? [joinPay] : undefined,
          }]
        : [],
      expenses: [],
      paidTransfers: [],
      potCashback: 0,
      createdAt: new Date().toISOString(),
    };
    set({ trips: [trip, ...get().trips] });
    return trip;
  },

  joinByInviteCodeAsync: async (code, yourName) => {
    const normalized = code.trim().toUpperCase();
    const existing = get().trips.find((t) => t.inviteCode === normalized);

    let joinName = yourName?.trim();
    let joinPay: PaymentMethod | undefined;
    let userId: string | undefined;

    try {
      const { useAuthStore } = require('./auth');
      const auth = useAuthStore.getState();
      userId = auth.user?.id;
      if (!joinName) joinName = auth.name || 'Friend';
      if (auth.paymentMethods && auth.paymentMethods.length > 0) {
        joinPay = auth.paymentMethods[0];
      } else if (auth.upiId) {
        joinPay = { rail: 'upi', handle: auth.upiId };
      }
    } catch {
      // ignore
    }

    // 1. If trip exists locally on this device
    if (existing) {
      if (joinName && !existing.members.some((m) => m.name.toLowerCase() === joinName?.toLowerCase())) {
        get().addMember(existing.id, joinName, joinPay);
      }
      if (isCloudEnabled() && userId) {
        try {
          const { joinTripByCode } = require('@/lib/api/trips');
          joinTripByCode(normalized, userId).catch(() => {});
        } catch {
          // ignore
        }
      }
      return get().trips.find((t) => t.id === existing.id) || existing;
    }

    // 2. Query cloud if configured
    if (isCloudEnabled()) {
      try {
        const { joinTripByCode } = require('@/lib/api/trips');
        const { getTripMembers } = require('@/lib/api/members');
        const { getTripExpenses } = require('@/lib/api/expenses');

        const { trip: cloudTrip, error } = await joinTripByCode(normalized, userId);
        if (cloudTrip && !error) {
          const [{ members: cloudMembers }, { expenses: cloudExpenses }] = await Promise.all([
            getTripMembers(cloudTrip.id).catch(() => ({ members: [] })),
            getTripExpenses(cloudTrip.id).catch(() => ({ expenses: [] })),
          ]);

          const syncedTrip = mapCloudTripToLocal(cloudTrip, cloudMembers || [], cloudExpenses || []);

          if (joinName && !syncedTrip.members.some((m) => m.name.toLowerCase() === joinName?.toLowerCase())) {
            syncedTrip.members.push({
              id: userId || uid('m'),
              name: joinName,
              upiId: joinPay?.rail === 'upi' ? joinPay.handle : undefined,
              paymentMethods: joinPay ? [joinPay] : undefined,
            });
          }

          set({ trips: [syncedTrip, ...get().trips.filter((t) => t.id !== syncedTrip.id)] });
          return syncedTrip;
        }
      } catch (cloudErr) {
        console.log('[TripStore] Cloud join lookup note:', cloudErr);
      }
    }

    // 3. Fallback: local shadow group
    return get().joinByInviteCode(normalized, yourName);
  },

  syncTripFromCloud: async (tripId: string) => {
    if (!isCloudEnabled()) return;
    try {
      const { getTrip } = require('@/lib/api/trips');
      const { getTripMembers } = require('@/lib/api/members');
      const { getTripExpenses } = require('@/lib/api/expenses');

      const { trip: cloudTrip, error } = await getTrip(tripId);
      if (error || !cloudTrip) return;

      const [{ members: cloudMembers }, { expenses: cloudExpenses }] = await Promise.all([
        getTripMembers(tripId).catch(() => ({ members: [] })),
        getTripExpenses(tripId).catch(() => ({ expenses: [] })),
      ]);

      const updated = mapCloudTripToLocal(cloudTrip, cloudMembers || [], cloudExpenses || []);

      set((state) => {
        const existing = state.trips.find((t) => t.id === tripId);
        if (!existing) return state;

        const mergedMembers = [...updated.members];
        for (const m of existing.members) {
          if (!mergedMembers.some((cm) => cm.id === m.id || cm.name === m.name)) {
            mergedMembers.push(m);
          }
        }

        return {
          trips: state.trips.map((t) =>
            t.id !== tripId
              ? t
              : {
                  ...updated,
                  members: mergedMembers,
                  paidTransfers: existing.paidTransfers,
                  potCashback: updated.potCashback || existing.potCashback,
                }
          ),
        };
      });
    } catch (err) {
      console.log('[TripStore] syncTripFromCloud note:', err);
    }
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
