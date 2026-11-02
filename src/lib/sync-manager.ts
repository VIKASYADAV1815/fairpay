/**
 * Sync Manager - Handles cloud sync, offline queue, and conflict resolution
 */

import NetInfo from '@react-native-community/netinfo';
import { isSupabaseConfigured } from './supabase';
import { processQueue, queueOperation, getQueueSize } from './offline-queue';
import { createTrip, updateTrip, deleteTrip } from './api/trips';
import { createExpense, updateExpense, deleteExpense } from './api/expenses';
import { addTripMember, updateTripMember, removeTripMember } from './api/members';
import type { Trip } from '@/store/trips';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

class SyncManager {
  private status: SyncStatus = 'idle';
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private isOnline: boolean = true;
  private autoSyncEnabled: boolean = true;

  constructor() {
    this.setupNetworkListener();
  }

  /**
   * Setup network state listener
   */
  private setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected === true;

      if (!wasOnline && this.isOnline) {
        // Just came back online
        console.log('🌐 Back online - processing queue...');
        this.setStatus('syncing');
        this.processOfflineQueue();
      } else if (wasOnline && !this.isOnline) {
        // Just went offline
        console.log('📴 Offline - queueing operations');
        this.setStatus('offline');
      }
    });
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return this.status;
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Update status and notify listeners
   */
  private setStatus(status: SyncStatus) {
    if (this.status !== status) {
      this.status = status;
      this.listeners.forEach((callback) => callback(status));
    }
  }

  /**
   * Check if we can sync (online + Supabase configured)
   */
  canSync(): boolean {
    return this.isOnline === true && isSupabaseConfigured() === true;
  }

  /**
   * Sync a trip to cloud
   */
  async syncTrip(trip: Trip, userId: string): Promise<{ success: boolean; error?: Error }> {
    if (!this.canSync()) {
      await queueOperation('create_trip', { trip, userId });
      return { success: false, error: new Error('Offline - queued for sync') };
    }

    try {
      this.setStatus('syncing');

      const { trip: cloudTrip, error } = await createTrip({
        name: trip.name,
        purpose: trip.purpose,
        currency: trip.currency,
        userId,
      });

      if (error) throw error;

      this.setStatus('idle');
      return { success: true };
    } catch (error) {
      console.error('Sync trip error:', error);
      this.setStatus('error');
      
      // Queue for retry
      await queueOperation('create_trip', { trip, userId });
      
      return { success: false, error: error as Error };
    }
  }

  /**
   * Sync an expense to cloud
   */
  async syncExpense(data: any): Promise<{ success: boolean; error?: Error }> {
    if (!this.canSync()) {
      await queueOperation('create_expense', data);
      return { success: false, error: new Error('Offline - queued for sync') };
    }

    try {
      this.setStatus('syncing');

      const { expense, error } = await createExpense(data);

      if (error) throw error;

      this.setStatus('idle');
      return { success: true };
    } catch (error) {
      console.error('Sync expense error:', error);
      this.setStatus('error');
      
      await queueOperation('create_expense', data);
      
      return { success: false, error: error as Error };
    }
  }

  /**
   * Process offline queue
   */
  async processOfflineQueue(): Promise<void> {
    if (!this.canSync()) {
      console.log('⚠️  Cannot process queue - offline or Supabase not configured');
      return;
    }

    try {
      const queueSize = await getQueueSize();
      if (queueSize === 0) {
        this.setStatus('idle');
        return;
      }

      console.log(`🔄 Processing ${queueSize} queued operations...`);

      await processQueue({
        create_trip: async (data) => {
          await createTrip({
            name: data.trip.name,
            purpose: data.trip.purpose,
            currency: data.trip.currency,
            userId: data.userId,
          });
        },
        update_trip: async (data) => {
          await updateTrip(data.tripId, data.updates);
        },
        delete_trip: async (data) => {
          await deleteTrip(data.tripId);
        },
        create_expense: async (data) => {
          await createExpense(data);
        },
        update_expense: async (data) => {
          await updateExpense(data.expenseId, data.updates);
        },
        delete_expense: async (data) => {
          await deleteExpense(data.expenseId);
        },
      });

      this.setStatus('idle');
      console.log('✅ Queue processed successfully');
    } catch (error) {
      console.error('❌ Queue processing error:', error);
      this.setStatus('error');
    }
  }

  /**
   * Enable/disable auto-sync
   */
  setAutoSync(enabled: boolean) {
    this.autoSyncEnabled = enabled;
    console.log(`🔄 Auto-sync ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Manual sync trigger
   */
  async triggerSync(): Promise<void> {
    if (!this.canSync()) {
      console.warn('Cannot sync - offline or not configured');
      return;
    }

    this.setStatus('syncing');
    await this.processOfflineQueue();
    this.setStatus('idle');
  }

  /**
   * Get network status
   */
  isOffline(): boolean {
    return !this.isOnline;
  }
}

// Singleton instance
export const syncManager = new SyncManager();

// Helper hooks for React components
export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = React.useState(syncManager.getStatus());

  React.useEffect(() => {
    return syncManager.onStatusChange(setStatus);
  }, []);

  return status;
}

// Note: Need to add React import for hooks
import React from 'react';
