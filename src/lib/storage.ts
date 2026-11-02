/**
 * Storage abstraction layer
 * Works both locally (Zustand) and with cloud (Supabase)
 * Provides offline-first experience with sync
 */

import { isSupabaseConfigured } from './supabase';

export type StorageMode = 'local' | 'cloud' | 'hybrid';

/**
 * Determine current storage mode based on configuration
 */
export function getStorageMode(): StorageMode {
  if (!isSupabaseConfigured()) {
    return 'local';
  }
  // For now, use hybrid mode when Supabase is configured
  // This allows local state + cloud sync
  return 'hybrid';
}

/**
 * Check if cloud features are available
 */
export function isCloudEnabled(): boolean {
  return getStorageMode() !== 'local';
}

/**
 * Check if we should use optimistic updates
 */
export function shouldUseOptimisticUpdates(): boolean {
  return getStorageMode() === 'hybrid';
}

/**
 * Log storage mode on app start
 */
export function logStorageMode() {
  const mode = getStorageMode();
  const emoji = mode === 'local' ? '📱' : mode === 'cloud' ? '☁️' : '🔄';
  
  console.log(`${emoji} Storage mode: ${mode.toUpperCase()}`);
  
  if (mode === 'local') {
    console.log('💾 Using local-only storage (Zustand + AsyncStorage)');
    console.log('⚠️  Add Supabase credentials to enable cloud sync');
  } else if (mode === 'hybrid') {
    console.log('🔄 Hybrid mode: Local state + Cloud sync');
    console.log('✅ Supabase configured');
  }
}
