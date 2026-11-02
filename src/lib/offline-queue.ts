/**
 * Offline queue for mutations
 * Queues operations when offline, syncs when back online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

type QueuedOperation = {
  id: string;
  type: 'create_trip' | 'update_trip' | 'delete_trip' | 'create_expense' | 'update_expense' | 'delete_expense';
  data: any;
  timestamp: number;
  retries: number;
};

const QUEUE_KEY = 'fairpay-offline-queue';
const MAX_RETRIES = 3;

/**
 * Add operation to offline queue
 */
export async function queueOperation(
  type: QueuedOperation['type'],
  data: any
): Promise<void> {
  try {
    const queue = await getQueue();
    const operation: QueuedOperation = {
      id: Date.now().toString() + Math.random(),
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };
    queue.push(operation);
    await saveQueue(queue);
    console.log(`📥 Queued ${type} operation (${queue.length} in queue)`);
  } catch (error) {
    console.error('Failed to queue operation:', error);
  }
}

/**
 * Get all queued operations
 */
export async function getQueue(): Promise<QueuedOperation[]> {
  try {
    const json = await AsyncStorage.getItem(QUEUE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Failed to get queue:', error);
    return [];
  }
}

/**
 * Save queue to storage
 */
async function saveQueue(queue: QueuedOperation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to save queue:', error);
  }
}

/**
 * Remove operation from queue
 */
export async function removeOperation(id: string): Promise<void> {
  try {
    const queue = await getQueue();
    const filtered = queue.filter((op) => op.id !== id);
    await saveQueue(filtered);
  } catch (error) {
    console.error('Failed to remove operation:', error);
  }
}

/**
 * Mark operation as failed (increment retries)
 */
export async function markOperationFailed(id: string): Promise<void> {
  try {
    const queue = await getQueue();
    const operation = queue.find((op) => op.id === id);
    if (operation) {
      operation.retries += 1;
      if (operation.retries >= MAX_RETRIES) {
        // Remove after max retries
        console.warn(`❌ Operation ${id} failed after ${MAX_RETRIES} retries, removing`);
        await removeOperation(id);
      } else {
        await saveQueue(queue);
      }
    }
  } catch (error) {
    console.error('Failed to mark operation as failed:', error);
  }
}

/**
 * Clear entire queue
 */
export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    console.log('🗑️  Offline queue cleared');
  } catch (error) {
    console.error('Failed to clear queue:', error);
  }
}

/**
 * Process queue (call when back online)
 */
export async function processQueue(
  handlers: Record<QueuedOperation['type'], (data: any) => Promise<void>>
): Promise<void> {
  const queue = await getQueue();
  
  if (queue.length === 0) {
    return;
  }

  console.log(`🔄 Processing ${queue.length} queued operations...`);

  for (const operation of queue) {
    try {
      const handler = handlers[operation.type];
      if (handler) {
        await handler(operation.data);
        await removeOperation(operation.id);
        console.log(`✅ Processed ${operation.type}`);
      } else {
        console.warn(`⚠️  No handler for ${operation.type}`);
        await removeOperation(operation.id);
      }
    } catch (error) {
      console.error(`❌ Failed to process ${operation.type}:`, error);
      await markOperationFailed(operation.id);
    }
  }

  console.log('✅ Queue processing complete');
}

/**
 * Get queue size
 */
export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
