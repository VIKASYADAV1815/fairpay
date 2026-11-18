import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { Expense, Member } from '@/store/trips';
import { useColors, useThemeStore } from '@/store/theme';
import { formatMoney } from '@/lib/currency';
import { radius, space, type } from '@/theme/tokens';

type Props = {
  visible: boolean;
  expense: Expense | null;
  members: Member[];
  currencySymbol?: string;
  currency?: string;
  currentUserId?: string;
  onClose: () => void;
  onTogglePaid: (memberId: string) => void;
  onEdit?: () => void;
  onSendReminder?: (memberId: string) => void;
};

export function ExpenseDetailSheet({
  visible,
  expense,
  members,
  currencySymbol = '₹',
  currency,
  currentUserId,
  onClose,
  onTogglePaid,
  onEdit,
  onSendReminder,
}: Props) {
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);

  if (!expense) return null;

  const payer = members.find((m) => m.id === expense.paidById);
  const paidCount = expense.splits.filter((s) => s.isPaid).length;
  const totalCount = expense.splits.length;

  const handleTogglePaid = (memberId: string) => {
    const split = expense.splits.find((s) => s.memberId === memberId);
    if (!split) return;

    if (!split.isPaid) {
      Alert.alert(
        'Mark as paid?',
        'Confirm that you have paid your share. The payer will be notified to confirm receipt.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, I paid',
            onPress: () => onTogglePaid(memberId),
          },
        ],
      );
    } else {
      if (currentUserId === expense.paidById) {
        Alert.alert(
          'Unmark payment?',
          'This will mark the payment as pending again.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Unmark',
              style: 'destructive',
              onPress: () => onTogglePaid(memberId),
            },
          ],
        );
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.screen, { backgroundColor: c.bg }]}>
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: c.separator }]}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color={c.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]}>Expense Details</Text>
          {onEdit ? (
            <Pressable onPress={onEdit} hitSlop={12} style={styles.iconBtn}>
              <Ionicons name="pencil" size={20} color={c.text} />
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Hero Card - High Contrast & Modern */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: c.card,
                borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              },
            ]}
          >
            <View style={styles.summaryTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.expenseTitle, { color: c.text }]}>
                  {expense.title}
                </Text>
                {expense.tag && (
                  <View style={[styles.tagBadge, { backgroundColor: darkMode ? '#2C2C2E' : '#E5E5EA' }]}>
                    <Text style={[styles.tagBadgeText, { color: c.textSecondary }]}>
                      {expense.tag}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.expenseAmount, { color: c.text }]}>
                {formatMoney(expense.amount, currency)}
              </Text>
            </View>

            <View style={[styles.summaryDivider, { backgroundColor: c.separator }]} />

            <View style={styles.summaryMeta}>
              <View style={styles.metaRow}>
                <Ionicons name="person-circle-outline" size={18} color={c.textSecondary} />
                <Text style={[styles.metaText, { color: c.textSecondary }]}>
                  Paid by <Text style={{ color: c.text, fontWeight: '700' }}>{payer?.name ?? 'Someone'}</Text>
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color={c.textSecondary} />
                <Text style={[styles.metaText, { color: c.textSecondary }]}>
                  {new Date(expense.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              {expense.recurring && (
                <View style={styles.metaRow}>
                  <Ionicons name="repeat" size={16} color={c.textSecondary} />
                  <Text style={[styles.metaText, { color: c.textSecondary }]}>Recurring</Text>
                </View>
              )}
            </View>
          </View>

          {/* Payment Progress */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
              Payment progress
            </Text>
            <View style={[styles.progressCard, { backgroundColor: c.card, borderColor: c.separator }]}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressText, { color: c.text }]}>
                  <Text style={{ fontWeight: '800', color: c.green }}>{paidCount}</Text> of {totalCount} people paid
                </Text>
                <Text style={[styles.progressPct, { color: c.textSecondary }]}>
                  {totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0}%
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: darkMode ? '#3A3A3C' : '#E5E5EA' }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: c.green,
                      width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Receipt Image if available */}
          {expense.receiptUri && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
                Attached receipt
              </Text>
              <Pressable
                onPress={() => {
                  Alert.alert('Receipt', 'Full-screen viewer');
                }}
              >
                <View style={[styles.receiptCard, { backgroundColor: c.card }]}>
                  <Image
                    source={{ uri: expense.receiptUri }}
                    style={styles.receiptImage}
                    resizeMode="cover"
                  />
                  <View style={styles.receiptOverlay}>
                    <Ionicons name="expand" size={18} color="#FFFFFF" />
                    <Text style={styles.receiptText}>Tap to enlarge</Text>
                  </View>
                </View>
              </Pressable>
            </View>
          )}

          {/* Split Details Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
              Split breakdown ({expense.splits.length})
            </Text>
            {expense.splits.map((split) => {
              const member = members.find((m) => m.id === split.memberId);
              if (!member) return null;

              const isPayer = split.memberId === expense.paidById;
              const canToggle = !isPayer && (!split.isPaid || currentUserId === expense.paidById);

              return (
                <View
                  key={split.memberId}
                  style={[
                    styles.splitCard,
                    {
                      backgroundColor: c.card,
                      borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
                  <View style={styles.splitLeft}>
                    <View
                      style={[
                        styles.splitAvatar,
                        {
                          backgroundColor: split.isPaid
                            ? (darkMode ? 'rgba(52, 199, 89, 0.25)' : '#DCFCE7')
                            : (darkMode ? '#3A3A3C' : '#F2F2F7'),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.splitAvatarText,
                          { color: split.isPaid ? c.green : c.text },
                        ]}
                      >
                        {member.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.splitName, { color: c.text }]}>
                        {member.name}
                        {isPayer && (
                          <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '500' }}>
                            {' '}(payer)
                          </Text>
                        )}
                      </Text>
                      <View style={styles.splitStatusBadge}>
                        {split.isPaid ? (
                          <View style={[styles.statusPill, { backgroundColor: darkMode ? 'rgba(52, 199, 89, 0.2)' : '#DCFCE7' }]}>
                            <Ionicons name="checkmark-circle" size={13} color={c.green} />
                            <Text style={[styles.statusPillText, { color: c.green }]}>
                              {isPayer
                                ? 'Covered by payer'
                                : split.paidAt
                                ? `Paid on ${new Date(split.paidAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                                : 'Paid'}
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.statusPill, { backgroundColor: darkMode ? 'rgba(255, 149, 0, 0.2)' : '#FEF3C7' }]}>
                            <Ionicons name="time-outline" size={13} color="#D97706" />
                            <Text style={[styles.statusPillText, { color: '#D97706' }]}>
                              Pending payment
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.splitRight}>
                    <Text style={[styles.splitAmount, { color: c.text }]}>
                      {formatMoney(split.amount, currency)}
                    </Text>

                    <View style={styles.splitActions}>
                      {canToggle && (
                        <Pressable
                          onPress={() => handleTogglePaid(split.memberId)}
                          style={[
                            styles.toggleBtn,
                            {
                              backgroundColor: split.isPaid
                                ? (darkMode ? '#3A3A3C' : '#E5E5EA')
                                : c.accent,
                            },
                          ]}
                        >
                          <Ionicons
                            name={split.isPaid ? 'close' : 'checkmark'}
                            size={16}
                            color={split.isPaid ? c.text : c.accentInk}
                          />
                        </Pressable>
                      )}

                      {!split.isPaid && currentUserId === expense.paidById && onSendReminder && (
                        <Pressable
                          onPress={() => onSendReminder(split.memberId)}
                          style={[
                            styles.reminderBtn,
                            { backgroundColor: darkMode ? '#3A3A3C' : '#E5E5EA' },
                          ]}
                        >
                          <Ionicons name="notifications-outline" size={15} color={c.text} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Informational Footer Note */}
          <View style={[styles.helpCard, { backgroundColor: c.card, borderColor: c.separator }]}>
            <Ionicons name="information-circle-outline" size={18} color={c.textSecondary} />
            <Text style={[styles.helpText, { color: c.textSecondary }]}>
              Tap the checkmark to mark a friend's share as paid. The payer will see a confirmation banner.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: c.bg, borderTopColor: c.separator }]}>
          <PrimaryButton label="Done" variant="accent" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    ...type.headline,
    fontSize: 18,
  },
  body: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xxxl,
  },
  summaryCard: {
    borderRadius: radius.lg,
    padding: space.xl,
    borderWidth: 1,
    marginBottom: space.xl,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.md,
  },
  expenseTitle: {
    ...type.title2,
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 28,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  tagBadgeText: {
    ...type.caption2,
    fontWeight: '700',
  },
  expenseAmount: {
    ...type.largeTitle,
    fontSize: 26,
    fontWeight: '800',
  },
  summaryDivider: {
    height: 1,
    marginVertical: space.md,
    opacity: 0.6,
  },
  summaryMeta: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    ...type.footnote,
    fontSize: 14,
  },
  section: {
    marginBottom: space.xl,
  },
  sectionLabel: {
    ...type.caption2,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: space.sm,
    marginLeft: 4,
  },
  progressCard: {
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    gap: space.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    ...type.subheadline,
    fontSize: 15,
  },
  progressPct: {
    ...type.subheadline,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  receiptCard: {
    borderRadius: radius.md,
    overflow: 'hidden',
    height: 180,
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  receiptOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: space.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  receiptText: {
    ...type.footnote,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  splitCard: {
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  splitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    flex: 1,
  },
  splitAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitAvatarText: {
    ...type.headline,
    fontWeight: '800',
  },
  splitName: {
    ...type.headline,
    fontSize: 16,
  },
  splitStatusBadge: {
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    ...type.caption2,
    fontWeight: '700',
  },
  splitRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  splitAmount: {
    ...type.headline,
    fontSize: 16,
    fontWeight: '700',
  },
  splitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: space.sm,
  },
  helpText: {
    ...type.caption1,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xl,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
