/**
 * Trips API - Supabase operations for trips (groups)
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type Trip = Database['public']['Tables']['trips']['Row'];
type TripInsert = Database['public']['Tables']['trips']['Insert'];
type TripUpdate = Database['public']['Tables']['trips']['Update'];

/**
 * Generate a unique 6-character invite code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars (0,O,1,I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new trip
 */
export async function createTrip(data: {
  name: string;
  purpose?: string;
  currency?: string;
  userId: string;
}): Promise<{ trip: Trip | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { trip: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        name: data.name,
        purpose: data.purpose || null,
        currency: data.currency || 'INR',
        invite_code: generateInviteCode(),
        created_by: data.userId,
      })
      .select()
      .single();

    if (error) throw error;

    // Also add creator as a member
    if (trip) {
      await supabase.from('trip_members').insert({
        trip_id: trip.id,
        user_id: data.userId,
        role: 'admin',
      });
    }

    return { trip, error: null };
  } catch (error) {
    console.error('Create trip error:', error);
    return { trip: null, error: error as Error };
  }
}

/**
 * Get all trips for a user
 */
export async function getUserTrips(userId: string): Promise<{
  trips: Trip[];
  error: Error | null;
}> {
  if (!isSupabaseConfigured()) {
    return { trips: [], error: new Error('Supabase not configured') };
  }

  try {
    // Get trip IDs where user is a member
    const { data: memberData, error: memberError } = await supabase
      .from('trip_members')
      .select('trip_id')
      .eq('user_id', userId);

    if (memberError) throw memberError;

    if (!memberData || memberData.length === 0) {
      return { trips: [], error: null };
    }

    const tripIds = memberData.map((m) => m.trip_id);

    // Get trip details
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .in('id', tripIds)
      .order('created_at', { ascending: false });

    if (tripsError) throw tripsError;

    return { trips: trips || [], error: null };
  } catch (error) {
    console.error('Get user trips error:', error);
    return { trips: [], error: error as Error };
  }
}

/**
 * Get a single trip by ID
 */
export async function getTrip(tripId: string): Promise<{
  trip: Trip | null;
  error: Error | null;
}> {
  if (!isSupabaseConfigured()) {
    return { trip: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data: trip, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error) throw error;

    return { trip, error: null };
  } catch (error) {
    console.error('Get trip error:', error);
    return { trip: null, error: error as Error };
  }
}

/**
 * Update a trip
 */
export async function updateTrip(
  tripId: string,
  updates: TripUpdate
): Promise<{ trip: Trip | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { trip: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data: trip, error } = await supabase
      .from('trips')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId)
      .select()
      .single();

    if (error) throw error;

    return { trip, error: null };
  } catch (error) {
    console.error('Update trip error:', error);
    return { trip: null, error: error as Error };
  }
}

/**
 * Delete a trip (and all related data)
 */
export async function deleteTrip(tripId: string): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase not configured') };
  }

  try {
    // Supabase will cascade delete related data (members, expenses, etc.)
    const { error } = await supabase.from('trips').delete().eq('id', tripId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Delete trip error:', error);
    return { error: error as Error };
  }
}

/**
 * Join a trip by invite code
 */
export async function joinTripByCode(
  inviteCode: string,
  userId: string
): Promise<{ trip: Trip | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { trip: null, error: new Error('Supabase not configured') };
  }

  try {
    // Find trip by invite code
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (tripError) throw tripError;
    if (!trip) throw new Error('Invalid invite code');

    // Check if already a member
    const { data: existing } = await supabase
      .from('trip_members')
      .select('*')
      .eq('trip_id', trip.id)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Already a member
      return { trip, error: null };
    }

    // Add as member
    const { error: memberError } = await supabase.from('trip_members').insert({
      trip_id: trip.id,
      user_id: userId,
      role: 'member',
    });

    if (memberError) throw memberError;

    return { trip, error: null };
  } catch (error) {
    console.error('Join trip error:', error);
    return { trip: null, error: error as Error };
  }
}

/**
 * Subscribe to real-time trip updates
 */
export function subscribeToTrip(
  tripId: string,
  callback: (trip: Trip) => void
) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - real-time disabled');
    return { unsubscribe: () => {} };
  }

  const channel = supabase
    .channel(`trip:${tripId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trips',
        filter: `id=eq.${tripId}`,
      },
      (payload) => {
        if (payload.new) {
          callback(payload.new as Trip);
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      channel.unsubscribe();
    },
  };
}
