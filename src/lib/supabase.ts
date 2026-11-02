import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace these with your actual Supabase credentials
// Get them from: https://app.supabase.com → Your Project → Settings → API

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if credentials are configured
const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http');

// Create a dummy client if not configured (prevents crashes during development)
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

// Helper to check if Supabase is ready
export const isSupabaseConfigured = () => isConfigured;

// Log warning if not configured
if (!isConfigured && __DEV__) {
  console.warn(
    '⚠️  Supabase not configured!\n' +
    'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env file.\n' +
    'Auth features will not work until configured.'
  );
}

// Database types (auto-generated from Supabase schema)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone_number: string | null;
          email: string | null;
          name: string;
          avatar_url: string | null;
          payment_methods: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone_number?: string | null;
          email?: string | null;
          name: string;
          avatar_url?: string | null;
          payment_methods?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone_number?: string | null;
          email?: string | null;
          name?: string;
          avatar_url?: string | null;
          payment_methods?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          name: string;
          purpose: string | null;
          currency: string;
          invite_code: string;
          pot_cashback: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          purpose?: string | null;
          currency?: string;
          invite_code: string;
          pot_cashback?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          purpose?: string | null;
          currency?: string;
          invite_code?: string;
          pot_cashback?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trip_members: {
        Row: {
          trip_id: string;
          user_id: string;
          role: string;
          payment_methods: any;
          joined_at: string;
        };
        Insert: {
          trip_id: string;
          user_id: string;
          role?: string;
          payment_methods?: any;
          joined_at?: string;
        };
        Update: {
          trip_id?: string;
          user_id?: string;
          role?: string;
          payment_methods?: any;
          joined_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          trip_id: string;
          title: string;
          amount: number;
          paid_by_id: string | null;
          tag: string | null;
          receipt_url: string | null;
          recurring: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          title: string;
          amount: number;
          paid_by_id?: string | null;
          tag?: string | null;
          receipt_url?: string | null;
          recurring?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          title?: string;
          amount?: number;
          paid_by_id?: string | null;
          tag?: string | null;
          receipt_url?: string | null;
          recurring?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          amount: number;
          is_paid: boolean;
          paid_at: string | null;
          confirmed_by_payer: boolean;
          confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string;
          amount: number;
          is_paid?: boolean;
          paid_at?: string | null;
          confirmed_by_payer?: boolean;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          expense_id?: string;
          user_id?: string;
          amount?: number;
          is_paid?: boolean;
          paid_at?: string | null;
          confirmed_by_payer?: boolean;
          confirmed_at?: string | null;
          created_at?: string;
        };
      };
      payment_notifications: {
        Row: {
          id: string;
          trip_id: string;
          expense_id: string;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          status: string;
          seen: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          expense_id: string;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          status?: string;
          seen?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          expense_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          amount?: number;
          status?: string;
          seen?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      paid_transfers: {
        Row: {
          id: string;
          trip_id: string;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          paid_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          paid_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          amount?: number;
          paid_at?: string;
          created_at?: string;
        };
      };
    };
  };
};
