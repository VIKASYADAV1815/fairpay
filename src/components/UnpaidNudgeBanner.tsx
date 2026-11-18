import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useColors, useThemeStore } from '@/store/theme';
import { formatMoney } from '@/lib/currency';
import {
  useRemindersStore,
  paymentReminderLabel,
  PAYMENT_REMINDER_PRESETS,
  type OverdueExpenseItem,
} from '@/store/reminders';
import { sendBatchPaymentReminders } from '@/lib/settlePay';
import type { Member } from '@/store/trips';
import { radius, space, type } from '@/theme/tokens';
import { enter } from '@/theme/motion';

type Props = {
  overdueItem: OverdueExpenseItem;
  members: Member[];
  tripId: string;
  tripName: string;
  currency?: string;
  onDismiss?: () => void;
};

export function UnpaidNudgeBanner({
  overdueItem,
  members,
  tripId,
  tripName,
  currency,
  onDismiss,
}: Props) {
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const paymentReminderHours = useRemindersStore((s) => s.paymentReminderHours);
  const setPaymentReminderHours = useRemindersStore((s) => s.setPaymentReminderHours);
  const dismissNudge = useRemindersStore((s) => s.dismissNudge);

  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [customHoursInput, setCustomHoursInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { expense, unpaidSplits, hoursAgo, totalUnpaidAmount } = overdueItem;
  const payer = members.find((m) => m.id === expense.paidById) || {
    id: expense.paidById,
    name: 'You',
  };

  const unpaidMembers = unpaidSplits
    .map((s) => {
      const m = members.find((mem) => mem.id === s.memberId);
      if (!m) return null;
      return {
        ...m,
        splitAmount: s.amount,
      };
    })
    .filter(Boolean) as Array<Member & { splitAmount: number }>;

  const unpaidNames = unpaidMembers.map((m) => m.name).join(', ');

  const handleSendNudge = async () => {
    if (unpaidMembers.length === 0) return;
    try {
      setIsSending(true);
      await sendBatchPaymentReminders({
        unpaidMembers,
        payer,
        expense: {
          id: expense.id,
          title: expense.title,
          amount: expense.amount,
        },
        tripId,
        tripName,
        currency,
      });
      Alert.alert(
        '✓ WhatsApp Opened',
        `Reminders prepared for ${unpaidNames}. Tap send in WhatsApp to deliver.`,
      );
    } catch (err: any) {
      console.warn('Failed to send reminder:', err);
      Alert.alert('Notice', 'Could not open WhatsApp.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDismiss = () => {
    dismissNudge(expense.id);
    onDismiss?.();
  };

  const handleSaveCustomHours = () => {
    const val = parseInt(customHoursInput.trim(), 10);
    if (!isNaN(val) && val > 0) {
      setPaymentReminderHours(val);
      setHoursModalOpen(false);
      setCustomHoursInput('');
    } else {
      Alert.alert('Invalid hours', 'Please enter a valid positive number of hours.');
    }
  };

  const formattedPending = formatMoney(totalUnpaidAmount, currency);

  return (
    <MotiView
      from={{ opacity: 0, translateY: -8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={enter(40)}
      style={[
        styles.container,
        {
          backgroundColor: darkMode ? '#261F12' : '#FFFBEB',
          borderColor: darkMode ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A',
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.iconCircle, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="notifications" size={14} color="#FFFFFF" />
          </View>
          <Text style={[styles.badgeText, { color: darkMode ? '#FBBF24' : '#B45309' }]}>
            Payment reminder · {hoursAgo >= 24 ? `${Math.floor(hoursAgo / 24)}d ago` : `${hoursAgo}h ago`}
          </Text>
        </View>

        <Pressable hitSlop={12} onPress={handleDismiss} style={styles.closeBtn}>
          <Ionicons
            name="close"
            size={18}
            color={darkMode ? '#D97706' : '#92400E'}
          />
        </Pressable>
      </View>

      <Text style={[styles.title, { color: darkMode ? '#FDF6B2' : '#78350F' }]}>
        {unpaidMembers.length === 1
          ? `${unpaidNames} hasn't settled yet`
          : `${unpaidMembers.length} friends haven't settled yet`}
      </Text>

      <Text style={[styles.subtitle, { color: darkMode ? '#D1D5DB' : '#92400E' }]}>
        <Text style={{ fontWeight: '700' }}>{formattedPending}</Text> still pending for "
        <Text style={{ fontWeight: '600' }}>{expense.title}</Text>".
      </Text>

      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.nudgeBtn, { backgroundColor: '#F59E0B' }]}
          onPress={handleSendNudge}
          disabled={isSending}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
          <Text style={styles.nudgeBtnText}>
            {isSending ? 'Opening...' : `Nudge ${unpaidMembers.length === 1 ? unpaidNames : 'All'}`}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.timerPill,
            {
              backgroundColor: darkMode ? '#362A17' : '#FEF3C7',
              borderColor: darkMode ? '#78350F' : '#FCD34D',
            },
          ]}
          onPress={() => setHoursModalOpen(true)}
        >
          <Ionicons name="time-outline" size={14} color={darkMode ? '#FBBF24' : '#B45309'} />
          <Text style={[styles.timerPillText, { color: darkMode ? '#FBBF24' : '#B45309' }]}>
            {paymentReminderLabel(paymentReminderHours)} ▾
          </Text>
        </Pressable>
      </View>

      {/* Modal to choose / customize reminder interval */}
      <Modal
        visible={hoursModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHoursModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setHoursModalOpen(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.separator }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Set Reminder Interval</Text>
              <Pressable onPress={() => setHoursModalOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={20} color={c.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.modalSub, { color: c.textSecondary }]}>
              Prompt to nudge friends when an expense is unpaid after:
            </Text>

            {/* Presets */}
            <View style={styles.presetsGrid}>
              {PAYMENT_REMINDER_PRESETS.map((h) => {
                const isSelected = paymentReminderHours === h;
                return (
                  <Pressable
                    key={h}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isSelected ? c.accent : c.fill,
                        borderColor: isSelected ? c.accent : c.separator,
                      },
                    ]}
                    onPress={() => {
                      setPaymentReminderHours(h);
                      setHoursModalOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: isSelected ? c.accentInk : c.text },
                      ]}
                    >
                      {h < 24 ? `${h}h` : `${h / 24}d`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Custom Hours Input */}
            <View style={styles.customInputRow}>
              <TextInput
                style={[
                  styles.customInput,
                  {
                    color: c.text,
                    backgroundColor: c.fill,
                    borderColor: c.separator,
                  },
                ]}
                placeholder="Or custom hours (e.g. 18)"
                placeholderTextColor={c.textTertiary}
                keyboardType="number-pad"
                value={customHoursInput}
                onChangeText={setCustomHoursInput}
              />
              <Pressable
                style={[styles.saveCustomBtn, { backgroundColor: c.accentInk }]}
                onPress={handleSaveCustomHours}
              >
                <Text style={[styles.saveCustomBtnText, { color: c.accent }]}>Set</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1.5,
    marginBottom: space.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...type.caption2,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    ...type.headline,
    fontSize: 16,
    marginTop: 2,
  },
  subtitle: {
    ...type.footnote,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: space.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    flexWrap: 'wrap',
  },
  nudgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  nudgeBtnText: {
    ...type.subheadline,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  timerPillText: {
    ...type.caption1,
    fontWeight: '600',
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: radius.xl,
    padding: space.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  modalTitle: {
    ...type.headline,
    fontSize: 18,
  },
  modalSub: {
    ...type.footnote,
    marginBottom: space.md,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.md,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  presetChipText: {
    ...type.subheadline,
    fontWeight: '700',
  },
  customInputRow: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    ...type.subheadline,
  },
  saveCustomBtn: {
    paddingHorizontal: space.lg,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveCustomBtnText: {
    ...type.subheadline,
    fontWeight: '700',
  },
});
