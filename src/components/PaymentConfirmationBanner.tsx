import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/theme';
import { formatMoney } from '@/lib/currency';
import { space, type, radius } from '@/theme/tokens';
import type { PaymentConfirmation } from '@/store/notifications';

type Props = {
  notification: PaymentConfirmation;
  currency?: string;
  onConfirm: () => void;
  onDeny: () => void;
  onDismiss: () => void;
};

export function PaymentConfirmationBanner({
  notification,
  currency,
  onConfirm,
  onDeny,
  onDismiss,
}: Props) {
  const c = useColors();

  return (
    <View style={[styles.container, { backgroundColor: c.accent }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="cash-outline" size={20} color={c.accentInk} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: c.accentInk }]}>
            {notification.memberName} marked payment
          </Text>
          <Text style={[styles.subtitle, { color: c.accentInk }]}>
            {formatMoney(notification.amount, currency)} for {notification.expenseTitle}
          </Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={8} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color={c.accentInk} />
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onDeny}
          style={[
            styles.actionBtn,
            styles.denyBtn,
            { backgroundColor: 'rgba(0,0,0,0.1)' },
          ]}
        >
          <Ionicons name="close-circle-outline" size={16} color={c.accentInk} />
          <Text style={[styles.actionText, { color: c.accentInk }]}>Not received</Text>
        </Pressable>

        <Pressable
          onPress={onConfirm}
          style={[
            styles.actionBtn,
            styles.confirmBtn,
            { backgroundColor: c.accentInk },
          ]}
        >
          <Ionicons name="checkmark-circle" size={16} color={c.accent} />
          <Text style={[styles.actionText, { color: c.accent }]}>Received ✓</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    ...type.subheadline,
    fontWeight: '700',
  },
  subtitle: {
    ...type.caption1,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.9,
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  denyBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  confirmBtn: {
    // Solid background
  },
  actionText: {
    ...type.footnote,
    fontWeight: '700',
  },
});
