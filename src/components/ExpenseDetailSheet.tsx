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
import { SoftCard } from '@/components/SoftCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { Expense, Member } from '@/store/trips';
import { useColors } from '@/store/theme';
import { formatMoney } from '@/lib/currency';
import { radius, space, type } from '@/theme/tokens';

type Props = {
  visible: boolean;
  expense: Expense | null;
  members: Member[];
  currencySymbol?: string;
  currency?: string;
  currentUserId?: string; // For showing contextual actions
  onClose: () => void;
  onTogglePaid: (memberId: string) => void;
  onEdit?: () => void;
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
}: Props) {
  const c = useColors();

  if (!expense) return null;

  const payer = members.find((m) => m.id === expense.paidById);
  const paidCount = expense.splits.filter((s) => s.isPaid).length;
  const totalCount = expense.splits.length;

  const handleTogglePaid = (memberId: string) => {
    const split = expense.splits.find((s) => s.memberId === memberId);
    if (!split) return;

    if (!split.isPaid) {
      // Marking as paid
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
      // Unmarking - only if you're the payer confirming
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
      <View style={[styles.screen, { backgroundColor: c.bgGrouped }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="close" size={22} color={c.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]}>Expense details</Text>
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
          {/* Expense Summary */}
          <SoftCard tone="accent" style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.expenseTitle, { color: c.accentInk }]}>
                  {expense.title}
                </Text>
                {expense.tag && (
                  <Text style={[styles.expenseTag, { color: c.accentInk }]}>
                    {expense.tag}
                  </Text>
                )}
              </View>
              <Text style={[styles.expenseAmount, { color: c.accentInk }]}>
                {formatMoney(expense.amount, currency)}
              </Text>
            </View>
            <View style={styles.summaryMeta}>
              <View style={styles.metaRow}>
                <Ionicons name="person" size={14} color={c.accentInk} />
                <Text style={[styles.metaText, { color: c.accentInk }]}>
                  Paid by {payer?.name ?? '—'}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color={c.accentInk} />
                <Text style={[styles.metaText, { color: c.accentInk }]}>
                  {new Date(expense.createdAt).toLocaleDateString()}
                </Text>
              </View>
              {expense.recurring && (
                <View style={styles.metaRow}>
                  <Ionicons name="repeat" size={14} color={c.accentInk} />
                  <Text style={[styles.metaText, { color: c.accentInk }]}>Recurring</Text>
                </View>
              )}
            </View>
          </SoftCard>

          {/* Payment Progress */}
          <View style={styles.progressSection}>
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
              Payment Status
            </Text>
            <SoftCard style={styles.progressCard}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: c.accent,
                      width: `${(paidCount / totalCount) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: c.text }]}>
                {paidCount} of {totalCount} paid
              </Text>
            </SoftCard>
          </View>

          {/* Receipt */}
          {expense.receiptUri && (
            <View style={styles.receiptSection}>
              <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
                Receipt
              </Text>
              <Pressable
                onPress={() => {
                  // TODO: Open full-screen receipt viewer
                  Alert.alert('Receipt', 'Full screen viewer coming soon');
                }}
              >
                <SoftCard style={styles.receiptCard}>
                  <Image
                    source={{ uri: expense.receiptUri }}
                    style={styles.receiptImage}
                    resizeMode="cover"
                  />
                  <View style={styles.receiptOverlay}>
                    <Ionicons name="expand" size={20} color={c.accentInk} />
                    <Text style={[styles.receiptText, { color: c.accentInk }]}>
                      Tap to view
                    </Text>
                  </View>
                </SoftCard>
              </Pressable>
            </View>
          )}

          {/* Split Details */}
          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
            Who owes what
          </Text>
          {expense.splits.map((split) => {
            const member = members.find((m) => m.id === split.memberId);
            if (!member) return null;

            const isPayer = split.memberId === expense.paidById;
            const canToggle = !isPayer && (!split.isPaid || currentUserId === expense.paidById);

            return (
              <SoftCard key={split.memberId} style={styles.splitCard}>
                <View style={styles.splitLeft}>
                  <View
                    style={[
                      styles.splitAvatar,
                      {
                        backgroundColor: split.isPaid ? c.accent : c.fillSecondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.splitAvatarText,
                        { color: split.isPaid ? c.accentInk : c.text },
                      ]}
                    >
                      {member.name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.splitName, { color: c.text }]}>
                      {member.name}
                      {isPayer && ' (payer)'}
                    </Text>
                    <View style={styles.splitStatus}>
                      {split.isPaid ? (
                        <>
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={c.accent}
                          />
                          <Text style={[styles.splitStatusText, { color: c.accent }]}>
                            {isPayer
                              ? 'Auto-paid'
                              : split.paidAt
                                ? `Paid ${new Date(split.paidAt).toLocaleDateString()}`
                                : 'Paid'}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="time-outline" size={14} color={c.textSecondary} />
                          <Text
                            style={[styles.splitStatusText, { color: c.textSecondary }]}
                          >
                            Pending
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.splitRight}>
                  <Text style={[styles.splitAmount, { color: c.text }]}>
                    {formatMoney(split.amount, currency)}
                  </Text>
                  {canToggle && (
                    <Pressable
                      onPress={() => handleTogglePaid(split.memberId)}
                      style={[
                        styles.toggleBtn,
                        {
                          backgroundColor: split.isPaid ? c.fillSecondary : c.accent,
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
                </View>
              </SoftCard>
            );
          })}

          {/* Help Text */}
          <SoftCard tone="fill" style={{ marginTop: space.xl }}>
            <Text style={[styles.helpText, { color: c.textSecondary }]}>
              💡 Tap the checkmark to mark your payment. The payer will be notified to
              confirm receipt.
            </Text>
          </SoftCard>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label="Close" variant="accent" onPress={onClose} />
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
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...type.headline },
  body: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
  },
  summaryCard: {
    marginBottom: space.xl,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space.sm,
  },
  expenseTitle: {
    ...type.title2,
  },
  expenseTag: {
    ...type.footnote,
    marginTop: 2,
    opacity: 0.85,
  },
  expenseAmount: {
    ...type.title1,
  },
  summaryMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginTop: space.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...type.caption1,
    fontWeight: '700',
  },
  progressSection: {
    marginBottom: space.xl,
  },
  sectionLabel: {
    ...type.footnote,
    fontWeight: '700',
    marginBottom: space.sm,
    marginLeft: 4,
  },
  progressCard: {
    gap: space.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.sm,
  },
  progressText: {
    ...type.subheadline,
  },
  receiptSection: {
    marginBottom: space.xl,
  },
  receiptCard: {
    padding: 0,
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
    padding: space.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  receiptText: {
    ...type.footnote,
    fontWeight: '700',
  },
  splitCard: {
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
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitAvatarText: {
    ...type.subheadline,
  },
  splitName: {
    ...type.subheadline,
  },
  splitStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  splitStatusText: {
    ...type.caption1,
    fontSize: 12,
    fontWeight: '600',
  },
  splitRight: {
    alignItems: 'flex-end',
    gap: space.sm,
  },
  splitAmount: {
    ...type.headline,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    ...type.caption1,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
    paddingTop: space.md,
  },
});
