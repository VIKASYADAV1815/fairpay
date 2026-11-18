/**
 * Members API - Supabase operations for trip members
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type TripMember = Database['public']['Tables']['trip_members']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export type MemberWithUser = TripMember & {
  user: User;
};

/**
 * Get all members of a trip
 */
export async function getTripMembers(tripId: string): Promise<{
  members: MemberWithUser[];
  error: Error | null;
}> {
  if (!isSupabaseConfigured()) {
    return { members: [], error: new Error('Supabase not configured') };
  }

  try {
    const { data, error } = await supabase
      .from('trip_members')
      .select(`
        *,
        user:users(*)
      `)
      .eq('trip_id', tripId)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    // TypeScript needs help with nested joins
    const members = (data as any[]).map((m) => ({
      ...m,
      user: m.user,
    })) as MemberWithUser[];

    return { members, error: null };
  } catch (error) {
    console.error('Get trip members error:', error);
    return { members: [], error: error as Error };
  }
}

/**
 * Add a member to a trip
 */
export async function addTripMember(data: {
  tripId: string;
  userId?: string;
  name?: string;
  upiId?: string;
  role?: 'admin' | 'member';
  paymentMethods?: any;
}): Promise<{ member: TripMember | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { member: null, error: new Error('Supabase not configured') };
  }

  try {
    const isValidUUID = (str?: string | null) =>
      str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) : false;

    const payload: any = {
      trip_id: data.tripId,
      user_id: isValidUUID(data.userId) ? data.userId : null,
      name: data.name || 'Member',
      role: data.role || 'member',
    };
    if (data.upiId) payload.upi_id = data.upiId;
    if (data.paymentMethods) payload.payment_methods = data.paymentMethods;

    let res = await supabase
      .from('trip_members')
      .insert(payload)
      .select()
      .single();

    // If Supabase schema lacks payment_methods column, retry without it
    if (res.error && res.error.message?.includes('payment_methods')) {
      delete payload.payment_methods;
      res = await supabase
        .from('trip_members')
        .insert(payload)
        .select()
        .single();
    }

    if (res.error) throw res.error;

    return { member: res.data as TripMember, error: null };
  } catch (error) {
    console.log('Add trip member note:', error);
    return { member: null, error: error as Error };
  }
}

/**
 * Update a trip member (e.g., change role, update payment methods)
 */
export async function updateTripMember(
  tripId: string,
  userId: string,
  updates: { role?: string; payment_methods?: any }
): Promise<{ member: TripMember | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { member: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data: member, error } = await supabase
      .from('trip_members')
      .update(updates)
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return { member, error: null };
  } catch (error) {
    console.error('Update trip member error:', error);
    return { member: null, error: error as Error };
  }
}

/**
 * Remove a member from a trip
 */
export async function removeTripMember(
  tripId: string,
  userId: string
): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase not configured') };
  }

  try {
    const { error } = await supabase
      .from('trip_members')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Remove trip member error:', error);
    return { error: error as Error };
  }
}

/**
 * Check if a user is a member of a trip
 */
export async function isTripMember(
  tripId: string,
  userId: string
): Promise<{ isMember: boolean; role: string | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { isMember: false, role: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data, error } = await supabase
      .from('trip_members')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found (expected for non-members)
      throw error;
    }

    return {
      isMember: !!data,
      role: data?.role || null,
      error: null,
    };
  } catch (error) {
    console.error('Check trip member error:', error);
    return { isMember: false, role: null, error: error as Error };
  }
}

/**
 * Subscribe to real-time member changes for a trip
 */
export function subscribeToTripMembers(
  tripId: string,
  callback: () => void
) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - real-time disabled');
    return { unsubscribe: () => {} };
  }

  const channel = supabase
    .channel(`trip_members:${tripId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trip_members',
        filter: `trip_id=eq.${tripId}`,
      },
      () => {
        callback();
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      channel.unsubscribe();
    },
  };
}
