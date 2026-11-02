/**
 * Syncing Badge - Shows sync status in header
 */

import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useColors } from '@/store/theme';
import { useSyncStatus } from '@/lib/sync-manager';

export function SyncingBadge() {
  const colors = useColors();
  const status = useSyncStatus();

  if (status === 'idle') return null;

  const config = {
    syncing: {
      icon: null,
      text: 'Syncing...',
      color: colors.accent,
    },
    offline: {
      icon: 'cloud-offline-outline' as const,
      text: 'Offline',
      color: colors.textSecondary,
    },
    error: {
      icon: 'alert-circle-outline' as const,
      text: 'Sync error',
      color: colors.danger,
    },
  }[status];

  if (!config) return null;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={[styles.badge, { backgroundColor: colors.fillSecondary }]}
    >
      {status === 'syncing' ? (
        <ActivityIndicator size="small" color={config.color} />
      ) : (
        <Ionicons name={config.icon!} size={14} color={config.color} />
      )}
      <Text style={[styles.text, { color: config.color }]}>
        {config.text}
      </Text>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
