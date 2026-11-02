/**
 * Expenses API - Supabase operations for expenses and splits
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type Expense = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type ExpenseSplit = Database['public']['Tables']['expense_splits']['Row'];
type ExpenseSplitInsert = Database['public']['Tables']['expense_splits']['Insert'];

export type ExpenseWithSplits = Expense & {
  splits: ExpenseSplit[];
};

/**
 * Create a new expense with splits
 */
export async function createExpense(data: {
  tripId: string;
  title: string;
  amount: number;
  paidById: string;
  tag?: string;
  receiptUrl?: string;
  recurring?: boolean;
  splits: Array<{
    userId: string;
    amount: number;
    isPaid?: boolean;
  }>;
}): Promise<{ expense: ExpenseWithSplits | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { expense: null, error: new Error('Supabase not configured') };
  }

  try {
    // 1. Insert expense
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        trip_id: data.tripId,
        title: data.title,
        amount: data.amount,
        paid_by_id: data.paidById,
        tag: data.tag || null,
        receipt_url: data.receiptUrl || null,
        recurring: data.recurring || false,
      })
      .select()
      .single();

    if (expenseError) throw expenseError;

    // 2. Insert splits
    const splitsData: ExpenseSplitInsert[] = data.splits.map((split) => ({
      expense_id: expense.id,
      user_id: split.userId,
      amount: split.amount,
      is_paid: split.isPaid || false,
    }));

    const { data: splits, error: splitsError } = await supabase
      .from('expense_splits')
      .insert(splitsData)
      .select();

    if (splitsError) throw splitsError;

    return {
      expense: {
        ...expense,
        splits: splits || [],
      },
      error: null,
    };
  } catch (error) {
    console.error('Create expense error:', error);
    return { expense: null, error: error as Error };
  }
}

/**
 * Get all expenses for a trip
 */
export async function getTripExpenses(tripId: string): Promise<{
  expenses: ExpenseWithSplits[];
  error: Error | null;
}> {
  if (!isSupabaseConfigured()) {
    return { expenses: [], error: new Error('Supabase not configured') };
  }

  try {
    // Get expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (expensesError) throw expensesError;

    if (!expenses || expenses.length === 0) {
      return { expenses: [], error: null };
    }

    // Get splits for all expenses
    const expenseIds = expenses.map((e) => e.id);
    const { data: splits, error: splitsError } = await supabase
      .from('expense_splits')
      .select('*')
      .in('expense_id', expenseIds);

    if (splitsError) throw splitsError;

    // Combine expenses with their splits
    const expensesWithSplits: ExpenseWithSplits[] = expenses.map((expense) => ({
      ...expense,
      splits: (splits || []).filter((s) => s.expense_id === expense.id),
    }));

    return { expenses: expensesWithSplits, error: null };
  } catch (error) {
    console.error('Get trip expenses error:', error);
    return { expenses: [], error: error as Error };
  }
}

/**
 * Update an expense
 */
export async function updateExpense(
  expenseId: string,
  updates: {
    title?: string;
    amount?: number;
    tag?: string;
    receiptUrl?: string;
  }
): Promise<{ expense: Expense | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { expense: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data: expense, error } = await supabase
      .from('expenses')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', expenseId)
      .select()
      .single();

    if (error) throw error;

    return { expense, error: null };
  } catch (error) {
    console.error('Update expense error:', error);
    return { expense: null, error: error as Error };
  }
}

/**
 * Delete an expense (and all its splits)
 */
export async function deleteExpense(expenseId: string): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase not configured') };
  }

  try {
    // Cascade delete will remove splits automatically
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Delete expense error:', error);
    return { error: error as Error };
  }
}

/**
 * Toggle payment status for a split
 */
export async function toggleSplitPayment(
  splitId: string,
  isPaid: boolean
): Promise<{ split: ExpenseSplit | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { split: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data: split, error } = await supabase
      .from('expense_splits')
      .update({
        is_paid: isPaid,
        paid_at: isPaid ? new Date().toISOString() : null,
      })
      .eq('id', splitId)
      .select()
      .single();

    if (error) throw error;

    return { split, error: null };
  } catch (error) {
    console.error('Toggle split payment error:', error);
    return { split: null, error: error as Error };
  }
}

/**
 * Confirm payment by payer
 */
export async function confirmPayment(
  splitId: string,
  confirmed: boolean
): Promise<{ split: ExpenseSplit | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { split: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data: split, error } = await supabase
      .from('expense_splits')
      .update({
        confirmed_by_payer: confirmed,
        confirmed_at: confirmed ? new Date().toISOString() : null,
      })
      .eq('id', splitId)
      .select()
      .single();

    if (error) throw error;

    return { split, error: null };
  } catch (error) {
    console.error('Confirm payment error:', error);
    return { split: null, error: error as Error };
  }
}

/**
 * Subscribe to real-time expense changes for a trip
 */
export function subscribeToTripExpenses(
  tripId: string,
  callback: () => void
) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - real-time disabled');
    return { unsubscribe: () => {} };
  }

  const expensesChannel = supabase
    .channel(`expenses:${tripId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'expenses',
        filter: `trip_id=eq.${tripId}`,
      },
      () => {
        callback();
      }
    )
    .subscribe();

  // Also subscribe to splits changes (any trip's expenses)
  const splitsChannel = supabase
    .channel(`expense_splits:${tripId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'expense_splits',
      },
      () => {
        callback();
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      expensesChannel.unsubscribe();
      splitsChannel.unsubscribe();
    },
  };
}
