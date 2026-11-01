import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { GiantAmount } from '@/components/GiantAmount';
import { SoftCard } from '@/components/SoftCard';
import { FadeIn } from '@/components/FadeIn';
import { EmptyArt } from '@/components/EmptyArt';
import { AddCrewSheet } from '@/components/AddCrewSheet';
import { AddExpenseSheet } from '@/components/AddExpenseSheet';
import { EditExpenseSheet } from '@/components/EditExpenseSheet';
import { ExpenseDetailSheet } from '@/components/ExpenseDetailSheet';
import { ShareGroupSheet } from '@/components/ShareGroupSheet';
import { PaymentConfirmationBanner } from '@/components/PaymentConfirmationBanner';
import { ExpenseStatusBadge } from '@/components/ExpenseStatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { ExpenseFilters, ExpenseFilterState } from '@/components/ExpenseFilters';
import { useTripStore, type ExpenseStatus, type Expense } from '@/store/trips';
import { useNotificationStore, PaymentConfirmation } from '@/store/notifications';
import { useProStore } from '@/store/pro';
import { useColors, useThemeStore } from '@/store/theme';
import { shareTripPdf } from '@/lib/report';
import { computeBalances } from '@/lib/settle';
import { currencySymbol, formatMoney } from '@/lib/currency';
import { sendExpenseNotifications, sendPaymentReminder } from '@/lib/settlePay';
import { formatRelativeTime, getTimeGroup, getTimeGroupLabel } from '@/lib/time';
import { space, type } from '@/theme/tokens';
import { enter, spring } from '@/theme/motion';

type SpendFilter = 'all' | ExpenseStatus;

export default function TripScreen() {
  const { id, onboard, confirmPayment, memberId } = useLocalSearchParams<{
    id: string;
    onboard?: string;
    confirmPayment?: string;
    memberId?: string;
  }>();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const trip = useTripStore((s) => s.trips.find((t) => t.id === id));
  const addMember = useTripStore((s) => s.addMember);
  const addExpense = useTripStore((s) => s.addExpense);
  const updateExpense = useTripStore((s) => s.updateExpense);
  const toggleExpenseSplit = useTripStore((s) => s.toggleExpenseSplit);
  const removeExpense = useTripStore((s) => s.removeExpense);
  const removeTrip = useTripStore((s) => s.removeTrip);
  const addCashback = useTripStore((s) => s.addCashback);
  const isPro = useProStore((s) => s.isPro);
  const addConfirmation = useNotificationStore((s) => s.addConfirmation);
  const removeConfirmation = useNotificationStore((s) => s.removeConfirmation);
  const markSeen = useNotificationStore((s) => s.markSeen);
  
  // Use store getter to avoid selector re-render issues
  const [pendingConfirmations, setPendingConfirmations] = useState<PaymentConfirmation[]>([]);
  
  // Only update when notification count changes (tracked via store subscription)
  const notificationCount = useNotificationStore((s) => s.pendingConfirmations.length);
  
  useEffect(() => {
    if (id) {
      // Get notifications directly from store instead of using getForTrip
      const allNotifications = useNotificationStore.getState().pendingConfirmations;
      setPendingConfirmations(allNotifications.filter((n) => n.tripId === id));
    }
  }, [id, notificationCount]); // Removed getForTrip dependency

  const [crewOpen, setCrewOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [filter, setFilter] = useState<SpendFilter>('all');
  const [expenseFilters, setExpenseFilters] = useState<ExpenseFilterState>({
    searchQuery: '',
    filterByPerson: null,
    filterByStatus: 'all',
  });
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh - in real app this would refetch data from backend
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  useEffect(() => {
    if (onboard === '1') {
      const t = setTimeout(() => setCrewOpen(true), 420);
      return () => clearTimeout(t);
    }
  }, [onboard]);

  // Handle payment confirmation deep link
  useEffect(() => {
    if (confirmPayment && memberId && trip) {
      const expense = trip.expenses.find((e) => e.id === confirmPayment);
      const member = trip.members.find((m) => m.id === memberId);
      const split = expense?.splits.find((s) => s.memberId === memberId);
      
      if (expense && member && split) {
        // Check if already marked as paid
        if (split.isPaid) {
          // Already paid, just show success
          Alert.alert(
            '✅ Already confirmed!',
            `Your payment of ${formatMoney(split.amount, trip.currency)} for "${expense.title}" is already marked as paid.`,
            [{ text: 'Got it' }],
          );
          return;
        }
        
        // Show payment confirmation dialog with better UX
        const t = setTimeout(() => {
          const payerName = trip.members.find((m) => m.id === expense.paidById)?.name || 'the payer';
          
          Alert.alert(
            '💰 Confirm your payment',
            `Did you complete the ${formatMoney(split.amount, trip.currency)} payment to ${payerName} for "${expense.title}"?\n\n✓ Tap "Yes" if payment is done\n✗ Tap "Not yet" if still pending`,
            [
              {
                text: 'Not yet',
                style: 'cancel',
                onPress: () => {
                  // Don't mark - user can try again later
                  Alert.alert(
                    'No worries',
                    'Pay when ready, then return here to mark it.',
                    [{ text: 'OK' }],
                  );
                },
              },
              {
                text: '✓ Yes, I paid',
                onPress: () => {
                  // Toggle payment status
                  toggleExpenseSplit(trip.id, confirmPayment, memberId);
                  
                  // Add notification for payer
                  if (member) {
                    addConfirmation({
                      tripId: trip.id,
                      expenseId: expense.id,
                      memberId: member.id,
                      memberName: member.name,
                      amount: split.amount,
                      expenseTitle: expense.title,
                    });
                  }
                  
                  // Show success feedback with better copy
                  Alert.alert(
                    '✅ Payment marked!',
                    `${payerName} will be notified to confirm they received your payment. You'll be notified once confirmed.`,
                    [{ text: 'Perfect' }],
                  );
                },
              },
            ],
          );
        }, 500);
        return () => clearTimeout(t);
      }
    }
  }, [confirmPayment, memberId, trip?.id]); // Only depend on trip.id, not entire trip object

  const total = useMemo(
    () => trip?.expenses.reduce((a, e) => a + e.amount, 0) ?? 0,
    [trip?.id, trip?.expenses.length], // Depend on ID and length, not array reference
  );

  const balances = useMemo(
    () => {
      if (!trip) return [];
      try {
        return computeBalances(trip.members, trip.expenses);
      } catch (error) {
        console.error('Error computing balances:', error);
        return [];
      }
    },
    [trip?.id, trip?.members.length, trip?.expenses.length], // Depend on lengths, not arrays
  );

  const filteredExpenses = useMemo(() => {
    if (!trip) return [];
    
    try {
      let expenses = trip.expenses;
      
      // Apply search filter
      if (expenseFilters.searchQuery.trim()) {
        const query = expenseFilters.searchQuery.toLowerCase();
        expenses = expenses.filter((e) =>
          e.title.toLowerCase().includes(query) ||
          e.tag?.toLowerCase().includes(query)
        );
      }
      
      // Apply person filter (who paid)
      if (expenseFilters.filterByPerson) {
        expenses = expenses.filter((e) => e.paidById === expenseFilters.filterByPerson);
      }
      
      // Apply payment status filter
      if (expenseFilters.filterByStatus !== 'all') {
        expenses = expenses.filter((e) => {
          // Ensure splits exist (migration safety)
          if (!e.splits || e.splits.length === 0) {
            // Fallback to legacy status if splits don't exist
            const legacyStatus = e.status ?? 'pending';
            if (expenseFilters.filterByStatus === 'paid') return legacyStatus === 'settled';
            if (expenseFilters.filterByStatus === 'partial') return legacyStatus === 'received';
            if (expenseFilters.filterByStatus === 'unpaid') return legacyStatus === 'pending';
            return true;
          }
          
          const paidCount = e.splits.filter((s) => s.isPaid).length;
          const totalCount = e.splits.length;
          
          if (expenseFilters.filterByStatus === 'paid') {
            return paidCount === totalCount; // All paid
          } else if (expenseFilters.filterByStatus === 'partial') {
            return paidCount > 0 && paidCount < totalCount; // Partially paid
          } else if (expenseFilters.filterByStatus === 'unpaid') {
            return paidCount === 0; // None paid
          }
          return true;
        });
      }
      
      // Apply legacy filter for backward compatibility
      if (filter !== 'all') {
        expenses = expenses.filter((e) => {
          if (!e.splits || e.splits.length === 0) {
            return (e.status ?? 'pending') === filter;
          }
          
          const paidCount = e.splits.filter((s) => s.isPaid).length;
          const totalCount = e.splits.length;
          
          if (filter === 'settled') {
            return paidCount === totalCount;
          } else if (filter === 'received') {
            return paidCount > 0 && paidCount < totalCount;
          } else if (filter === 'pending') {
            return paidCount === 0 || paidCount < totalCount;
          }
          return true;
        });
      }
      
      return expenses;
    } catch (error) {
      console.error('Error filtering expenses:', error);
      return [];
    }
  }, [trip?.expenses, filter, expenseFilters]);

  // Group expenses by time period
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, typeof filteredExpenses> = {
      today: [],
      yesterday: [],
      'this-week': [],
      earlier: [],
    };
    
    filteredExpenses.forEach((expense) => {
      const group = getTimeGroup(expense.createdAt);
      groups[group].push(expense);
    });
    
    // Return only non-empty groups in order
    return [
      { key: 'today' as const, expenses: groups.today },
      { key: 'yesterday' as const, expenses: groups.yesterday },
      { key: 'this-week' as const, expenses: groups['this-week'] },
      { key: 'earlier' as const, expenses: groups.earlier },
    ].filter((g) => g.expenses.length > 0);
  }, [filteredExpenses]); // Depend on expenses array

  if (!trip) {
    return (
      <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top + space.xl }]}>
        <Text style={[styles.missing, { color: c.text }]}>Group not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: c.textSecondary }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const exportReport = async () => {
    if (!isPro) {
      Alert.alert('Fairpay Pro', 'PDF reports are a Pro feature.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'See Pro', onPress: () => router.push('/pro') },
      ]);
      return;
    }
    try {
      await shareTripPdf(trip);
    } catch {
      Alert.alert('Couldn’t export', 'Try again in a moment.');
    }
  };

  const cycleStatus = (expenseId: string, current?: ExpenseStatus) => {
    // Legacy function - now opens detail sheet instead
    setDetailExpense(trip.expenses.find((e) => e.id === expenseId) || null);
  };

  const handleToggleSplit = (expenseId: string, memberId: string) => {
    const expense = trip.expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    const split = expense.splits.find((s) => s.memberId === memberId);
    if (!split) return;

    const member = trip.members.find((m) => m.id === memberId);
    const payer = trip.members.find((m) => m.id === expense.paidById);

    if (!split.isPaid) {
      // Member is marking as paid - toggle and create notification for payer
      toggleExpenseSplit(trip.id, expenseId, memberId);
      
      if (member && payer) {
        // Add notification for payer to confirm
        addConfirmation({
          tripId: trip.id,
          expenseId: expense.id,
          memberId: member.id,
          memberName: member.name,
          amount: split.amount,
          expenseTitle: expense.title,
        });
      }
      
      // Show success feedback to the person who marked paid
      Alert.alert(
        '✓ Marked as paid',
        `${payer?.name || 'The payer'} will be notified to confirm receipt.`,
        [{ text: 'OK' }],
      );
    } else {
      // Payer is unmarking - simpler flow
      toggleExpenseSplit(trip.id, expenseId, memberId);
    }
  };

  const handleConfirmPayment = (notificationId: string, expenseId: string, memberId: string) => {
    // Payment already marked by member, payer just needs to acknowledge
    // Since isPaid is already true, we just remove the notification
    removeConfirmation(notificationId);
    
    // Optional: Show success message
    const expense = trip.expenses.find((e) => e.id === expenseId);
    const member = trip.members.find((m) => m.id === memberId);
    
    if (expense && member) {
      Alert.alert(
        '✓ Payment confirmed',
        `${member.name}'s payment for ${expense.title} has been confirmed.`,
        [{ text: 'OK' }],
      );
    }
  };

  const handleRejectPayment = (notificationId: string, expenseId: string, memberId: string) => {
    Alert.alert(
      'Reject payment?',
      'This will unmark the payment. The person will need to mark it as paid again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            // Unmark the payment
            toggleExpenseSplit(trip.id, expenseId, memberId);
            // Remove notification
            removeConfirmation(notificationId);
          },
        },
      ],
    );
  };

  const handleSendReminder = async (expenseId: string, memberId: string) => {
    const expense = trip.expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    const member = trip.members.find((m) => m.id === memberId);
    const payer = trip.members.find((m) => m.id === expense.paidById);
    const split = expense.splits.find((s) => s.memberId === memberId);

    if (!member || !payer || !split) return;

    Alert.alert(
      'Send reminder?',
      `Send WhatsApp reminder to ${member.name} for ${formatMoney(split.amount, trip.currency)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await sendPaymentReminder({
                member,
                payer,
                expense: {
                  id: expense.id,
                  title: expense.title,
                  amount: expense.amount,
                },
                splitAmount: split.amount,
                tripId: trip.id,
                tripName: trip.name,
                currency: trip.currency,
              });
              
              Alert.alert(
                '✓ Reminder sent',
                `WhatsApp reminder sent to ${member.name}.`,
                [{ text: 'OK' }],
              );
            } catch (error) {
              Alert.alert(
                'Could not send',
                'Failed to open WhatsApp. Try again.',
                [{ text: 'OK' }],
              );
            }
          },
        },
      ],
    );
  };

  const confirmDeleteExpense = (expenseId: string, title: string) => {
    Alert.alert('Delete expense?', title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeExpense(trip.id, expenseId);
          setEditingExpense(null);
        },
      },
    ]);
  };

  const confirmDeleteGroup = () => {
    Alert.alert('Delete group?', `Remove “${trip.name}” and all its spends?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeTrip(trip.id);
          router.replace('/');
        },
      },
    ]);
  };

  const filters: { id: SpendFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'all', label: 'All', icon: 'apps-outline' },
    { id: 'settled', label: 'Tick', icon: 'checkmark-circle' },
    { id: 'received', label: 'Received', icon: 'arrow-down-circle' },
    { id: 'pending', label: 'Pending', icon: 'time-outline' },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={c.accent}
            colors={[c.accent]}
          />
        }
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color={c.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
            {trip.name}
          </Text>
          <Pressable
            hitSlop={12}
            style={styles.iconBtn}
            onPress={() =>
              router.push({ pathname: '/people/[id]', params: { id: trip.id } })
            }
          >
            <Ionicons name="people-outline" size={22} color={c.text} />
          </Pressable>
        </View>

        <FadeIn>
          <View style={styles.hero}>
            <Text style={[styles.heroLabel, { color: c.textSecondary }]}>
              {trip.purpose ? `${trip.purpose} · ` : ''}Group total
            </Text>
            <GiantAmount amount={total} currency={trip.currency} accent />
            <View style={styles.metaRow}>
              <Pressable
                style={[styles.metaPill, { backgroundColor: c.accent }]}
                onPress={() =>
                  router.push({ pathname: '/people/[id]', params: { id: trip.id } })
                }
              >
                <Ionicons name="people" size={14} color={c.accentInk} />
                <Text style={[styles.metaText, { color: c.accentInk }]}>
                  {trip.members.length || 0} people
                </Text>
              </Pressable>
              <View style={[styles.metaPill, { backgroundColor: c.fill }]}>
                <Text style={[styles.metaMutedText, { color: c.text }]}>
                  {trip.expenses.length} expenses · {trip.currency ?? 'INR'}
                </Text>
              </View>
              {trip.potCashback > 0 ? (
                <View style={[styles.metaPill, { backgroundColor: c.accent }]}>
                  <Text style={[styles.metaText, { color: c.accentInk }]}>
                    Pot {formatMoney(trip.potCashback, trip.currency)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </FadeIn>

        {/* Payment Confirmation Banners */}
        {pendingConfirmations.length > 0 && (
          <View style={styles.notificationSection}>
            {pendingConfirmations.map((notification) => (
              <PaymentConfirmationBanner
                key={notification.id}
                notification={notification}
                currency={trip.currency}
                onConfirm={() => handleConfirmPayment(notification.id, notification.expenseId, notification.memberId)}
                onDeny={() => handleRejectPayment(notification.id, notification.expenseId, notification.memberId)}
                onDismiss={() => {
                  markSeen(notification.id);
                  // Optionally remove after a delay
                  setTimeout(() => removeConfirmation(notification.id), 5000);
                }}
              />
            ))}
          </View>
        )}

        <View style={styles.toolRow}>
          <Pressable
            style={[styles.tool, { backgroundColor: c.accent }]}
            onPress={() => {
              if (trip.members.length < 2) {
                Alert.alert('Need 2+ people', 'Invite or add someone before settling.', [
                  { text: 'Add people', onPress: () => setCrewOpen(true) },
                  { text: 'Invite', onPress: () => setShareOpen(true) },
                ]);
                return;
              }
              router.push({ pathname: '/settle/[id]', params: { id: trip.id } });
            }}
          >
            <Ionicons name="swap-horizontal" size={18} color={c.accentInk} />
            <Text style={[styles.toolText, { color: c.accentInk }]}>Settle</Text>
          </Pressable>
          <Pressable
            style={[styles.tool, { backgroundColor: c.fill }]}
            onPress={exportReport}
          >
            <Ionicons name="document-text-outline" size={18} color={c.text} />
            <Text style={[styles.toolText, { color: c.text }]}>PDF</Text>
          </Pressable>
          <Pressable
            style={[styles.tool, { backgroundColor: c.fill }]}
            onPress={() => setShareOpen(true)}
          >
            <Ionicons name="share-outline" size={18} color={c.text} />
            <Text style={[styles.toolText, { color: c.text }]}>Invite</Text>
          </Pressable>
        </View>

        <FadeIn delay={80}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>People & balances</Text>
          {trip.members.length < 2 ? (
            <Pressable onPress={() => setCrewOpen(true)}>
              <SoftCard tone={darkMode ? 'fill' : 'accent'} style={styles.ctaCard}>
                <Text style={[styles.ctaTitle, { color: darkMode ? c.text : c.accentInk }]}>
                  {trip.members.length === 0 ? 'Add people' : 'Need one more'}
                </Text>
                <Text
                  style={[
                    styles.ctaBody,
                    { color: darkMode ? c.textSecondary : c.accentInk },
                  ]}
                >
                  Groups need 2+ people — add a name or tap Invite
                </Text>
              </SoftCard>
            </Pressable>
          ) : (
            <View style={styles.balanceList}>
              {balances.map((b, i) => (
                <MotiView
                  key={b.memberId}
                  from={{ opacity: 0, translateX: -10 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={enter(100 + i * 40)}
                >
                  <SoftCard style={styles.balanceRow}>
                    <View style={styles.balLeft}>
                      <View style={[styles.balAvatar, { backgroundColor: c.accent }]}>
                        <Text style={[styles.balAvatarText, { color: c.accentInk }]}>
                          {b.name.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.balName, { color: c.text }]}>{b.name}</Text>
                    </View>
                    <Text
                      style={[
                        styles.balNet,
                        { color: b.net >= 0 ? c.accentInk : c.danger },
                      ]}
                    >
                      {b.net >= 0 ? '+' : '−'}
                      {formatMoney(Math.abs(b.net), trip.currency).replace(/^[^\d−-]+/, '')}
                    </Text>
                  </SoftCard>
                </MotiView>
              ))}
            </View>
          )}
        </FadeIn>

        <Text style={[styles.sectionTitle, { color: c.textSecondary, marginTop: space.xxl }]}>
          Spending
        </Text>

        {/* Search & Filter UI */}
        <View style={{ marginBottom: space.md }}>
          <ExpenseFilters
            members={trip.members}
            filters={expenseFilters}
            onFiltersChange={setExpenseFilters}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((f) => {
            const on = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[
                  styles.filterChip,
                  { backgroundColor: on ? c.accent : c.fill },
                ]}
              >
                <Ionicons name={f.icon} size={14} color={on ? c.accentInk : c.text} />
                <Text style={[styles.filterText, { color: on ? c.accentInk : c.text }]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filteredExpenses.length === 0 ? (
          <EmptyState
            type={
              trip.expenses.length === 0
                ? 'no-expenses'
                : (expenseFilters.searchQuery.trim() || 
                   expenseFilters.filterByPerson || 
                   expenseFilters.filterByStatus !== 'all')
                ? 'no-filtered-expenses'
                : filter !== 'all'
                ? 'no-filtered-expenses'
                : 'no-expenses'
            }
            onAction={() => {
              if (trip.expenses.length === 0) {
                // No expenses - open add expense sheet
                if (trip.members.length < 2) {
                  Alert.alert(
                    'Need 2+ people',
                    'Add or invite at least one more person before logging a spend.',
                    [
                      { text: 'Add people', onPress: () => setCrewOpen(true) },
                      { text: 'Invite', onPress: () => setShareOpen(true) },
                    ],
                  );
                } else {
                  setExpenseOpen(true);
                }
              } else {
                // Has expenses but filters are hiding them - clear filters
                setExpenseFilters({
                  searchQuery: '',
                  filterByPerson: null,
                  filterByStatus: 'all',
                });
                setFilter('all');
              }
            }}
            actionLabel={trip.expenses.length === 0 ? 'Add First Expense' : 'Clear Filters'}
          />
        ) : (
          <View style={styles.list}>
            {groupedExpenses.map((group) => (
              <View key={group.key}>
                {/* Date Group Header */}
                <Text style={[styles.groupHeader, { color: c.textSecondary }]}>
                  {getTimeGroupLabel(group.key)}
                </Text>
                
                {group.expenses.map((e, i) => {
              const payer = trip.members.find((m) => m.id === e.paidById);
              
              // Safety check: ensure splits exist
              if (!e.splits || e.splits.length === 0) {
                // Show old-style card for legacy expenses
                return (
                  <MotiView
                    key={e.id}
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={enter(80 + i * 40)}
                  >
                    <Pressable
                      onPress={() => setEditingExpense(e)}
                      onLongPress={() => setEditingExpense(e)}
                      delayLongPress={450}
                    >
                      <SoftCard style={styles.expenseRow}>
                        <View style={styles.expLeft}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.expTitle, { color: c.text }]}>
                              {e.title} · (Old format)
                            </Text>
                            <Text style={[styles.expMeta, { color: c.textSecondary }]}>
                              {payer?.name ?? '—'} · {e.status ?? 'pending'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.expRight}>
                          <Text style={[styles.expAmount, { color: c.text }]}>
                            {formatMoney(e.amount, trip.currency)}
                          </Text>
                        </View>
                      </SoftCard>
                    </Pressable>
                  </MotiView>
                );
              }
              
              const paidCount = e.splits.filter((s) => s.isPaid).length;
              const totalCount = e.splits.length;
              const allPaid = paidCount === totalCount;
              
              // Get unpaid members for "Waiting for..." message
              const unpaidMembers = e.splits
                .filter((s) => !s.isPaid)
                .map((s) => trip.members.find((m) => m.id === s.memberId)?.name)
                .filter(Boolean);
              
              return (
                <MotiView
                  key={e.id}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={enter(80 + i * 40)}
                >
                  <Pressable
                    onPress={() => setDetailExpense(e)}
                    onLongPress={() => setEditingExpense(e)}
                    delayLongPress={450}
                  >
                    <SoftCard style={styles.expenseRow}>
                      <View style={styles.expLeft}>
                        <View style={{ flex: 1 }}>
                          {/* Title row with status badge */}
                          <View style={styles.expTitleRow}>
                            <Text style={[styles.expTitle, { color: c.text, flex: 1 }]}>
                              {e.title}
                              {e.tag ? ` · ${e.tag}` : ''}
                            </Text>
                            <ExpenseStatusBadge paidCount={paidCount} totalCount={totalCount} />
                          </View>
                          
                          {/* Meta row with payer and waiting info */}
                          <View style={styles.expMetaRow}>
                            <Text style={[styles.expMeta, { color: c.textSecondary }]}>
                              {payer?.name ?? '—'} paid
                            </Text>
                            {unpaidMembers.length > 0 && unpaidMembers.length < totalCount && (
                              <>
                                <Text style={[styles.expMetaDot, { color: c.textTertiary }]}> · </Text>
                                <Text style={[styles.expMetaWaiting, { color: c.textSecondary }]}>
                                  Waiting for {unpaidMembers.slice(0, 2).join(', ')}
                                  {unpaidMembers.length > 2 ? ` +${unpaidMembers.length - 2}` : ''}
                                </Text>
                              </>
                            )}
                            {e.receiptUri && (
                              <>
                                <Text style={[styles.expMetaDot, { color: c.textTertiary }]}> · </Text>
                                <Ionicons name="image-outline" size={11} color={c.textSecondary} />
                              </>
                            )}
                          </View>
                          
                          {/* Time row */}
                          <Text style={[styles.expTime, { color: c.textTertiary }]}>
                            {formatRelativeTime(e.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.expRight}>
                        <Text style={[styles.expAmount, { color: c.text }]}>
                          {formatMoney(e.amount, trip.currency)}
                        </Text>
                      </View>
                    </SoftCard>
                  </Pressable>
                </MotiView>
              );
            })}
              </View>
            ))}
          </View>
        )}

        <Pressable onPress={confirmDeleteGroup} style={{ marginTop: space.xxl }}>
          <Text style={[styles.deleteGroup, { color: c.danger }]}>Delete group</Text>
        </Pressable>
      </ScrollView>

      <MotiView
        from={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring(16, 180)}
        style={[styles.fabWrap, { bottom: insets.bottom + 24 }]}
      >
        <Pressable
          style={[styles.fab, { backgroundColor: c.accent }]}
          onPress={() => {
            if (trip.members.length < 2) {
              Alert.alert(
                'Need 2+ people',
                'Add or invite at least one more person before logging a spend.',
                [
                  { text: 'Add people', onPress: () => setCrewOpen(true) },
                  { text: 'Invite', onPress: () => setShareOpen(true) },
                ],
              );
              return;
            }
            setExpenseOpen(true);
          }}
        >
          <Ionicons name="add" size={28} color={c.accentInk} />
        </Pressable>
      </MotiView>

      <AddCrewSheet
        visible={crewOpen}
        members={trip.members}
        onClose={() => setCrewOpen(false)}
        onAdd={(name, upiId) => addMember(trip.id, name, upiId)}
        doneLabel="Done with crew"
        minMembers={2}
        onInvite={() => setShareOpen(true)}
      />

      <AddExpenseSheet
        visible={expenseOpen}
        members={trip.members}
        currencySymbol={currencySymbol(trip.currency)}
        tripId={trip.id}
        tripName={trip.name}
        onClose={() => setExpenseOpen(false)}
        onAdd={async (data) => {
          addExpense(trip.id, data);
          
          // Send WhatsApp notifications to unpaid members
          try {
            await sendExpenseNotifications({
              expense: { ...data, id: 'temp' }, // ID will be assigned by store
              members: trip.members,
              tripId: trip.id,
              tripName: trip.name,
              currency: trip.currency,
            });
          } catch (error) {
            // Silent fail - expense is already added, notifications are optional
            console.warn('Failed to send WhatsApp notifications:', error);
          }
        }}
      />

      <ShareGroupSheet
        visible={shareOpen}
        groupName={trip.name}
        inviteCode={trip.inviteCode}
        onClose={() => setShareOpen(false)}
      />
      
      <EditExpenseSheet
        visible={!!editingExpense}
        expense={editingExpense}
        members={trip.members}
        currencySymbol={currencySymbol(trip.currency)}
        onClose={() => setEditingExpense(null)}
        onUpdate={(expenseId, data) => {
          updateExpense(trip.id, expenseId, data);
          setEditingExpense(null);
        }}
        onDelete={(expenseId) => {
          confirmDeleteExpense(expenseId, editingExpense?.title || '');
        }}
      />

      <ExpenseDetailSheet
        visible={!!detailExpense}
        expense={detailExpense}
        members={trip.members}
        currencySymbol={currencySymbol(trip.currency)}
        currency={trip.currency}
        onClose={() => setDetailExpense(null)}
        onTogglePaid={(memberId) => {
          if (detailExpense) {
            handleToggleSplit(detailExpense.id, memberId);
          }
        }}
        onSendReminder={(memberId) => {
          if (detailExpense) {
            handleSendReminder(detailExpense.id, memberId);
          }
        }}
        onEdit={() => {
          setEditingExpense(detailExpense);
          setDetailExpense(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: space.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.sm,
    marginBottom: space.xxl,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...type.headline,
    flex: 1,
    textAlign: 'center',
  },
  hero: { marginBottom: space.lg },
  heroLabel: {
    ...type.footnote,
    marginBottom: space.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.md,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
  },
  metaText: {
    ...type.caption1,
    fontWeight: '700',
  },
  metaMutedText: {
    ...type.caption1,
    fontWeight: '700',
  },
  notificationSection: {
    marginTop: space.md,
    marginBottom: space.md,
  },
  toolRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.xl,
  },
  tool: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  toolText: {
    ...type.footnote,
    fontWeight: '700',
  },
  sectionTitle: {
    ...type.footnote,
    fontWeight: '700',
    marginBottom: space.sm,
  },
  filterRow: { gap: space.sm, paddingBottom: space.md },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
  },
  filterText: { ...type.footnote, fontWeight: '700' },
  ctaCard: { marginBottom: space.sm },
  ctaTitle: { ...type.title3 },
  ctaBody: {
    ...type.footnote,
    marginTop: 4,
    opacity: 0.75,
  },
  balanceList: { gap: space.sm },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  balLeft: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  balAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balAvatarText: { ...type.subheadline },
  balName: { ...type.subheadline },
  balNet: { ...type.headline },
  empty: {
    alignItems: 'center',
    paddingVertical: space.xxxl,
  },
  emptyTitle: { ...type.subheadline, textAlign: 'center', marginTop: space.sm },
  emptyBody: {
    ...type.caption1,
    marginTop: 4,
    textAlign: 'center',
  },
  list: { gap: space.sm },
  groupHeader: {
    ...type.footnote,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: space.lg,
    marginBottom: space.sm,
    paddingLeft: 2,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: space.sm,
    gap: space.md,
  },
  expLeft: {
    flex: 1,
    minWidth: 0, // Allow text to truncate
  },
  expRight: {
    alignItems: 'flex-end',
  },
  expTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: 4,
  },
  expTitle: {
    ...type.subheadline,
  },
  expMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  expMeta: {
    ...type.caption1,
    fontWeight: '600',
  },
  expMetaDot: {
    ...type.caption1,
  },
  expMetaWaiting: {
    ...type.caption1,
    fontStyle: 'italic',
  },
  expTime: {
    ...type.caption2,
    marginTop: 2,
  },
  expAmount: {
    ...type.headline,
  },
  fabWrap: { position: 'absolute', right: space.xl },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missing: { ...type.title2 },
  backLink: {
    ...type.body,
    marginTop: space.md,
  },
  deleteGroup: {
    ...type.footnote,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: space.lg,
  },
});
