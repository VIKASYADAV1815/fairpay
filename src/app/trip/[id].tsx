import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
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
import { ShareGroupSheet } from '@/components/ShareGroupSheet';
import { OffersPanel } from '@/components/OffersPanel';
import { useTripStore, type ExpenseStatus } from '@/store/trips';
import { useProStore } from '@/store/pro';
import { useColors, useThemeStore } from '@/store/theme';
import { shareTripPdf } from '@/lib/report';
import { computeBalances } from '@/lib/settle';
import { currencySymbol, formatMoney } from '@/lib/currency';
import { space, type } from '@/theme/tokens';
import { enter, spring } from '@/theme/motion';

type SpendFilter = 'all' | ExpenseStatus;

export default function TripScreen() {
  const { id, onboard } = useLocalSearchParams<{ id: string; onboard?: string }>();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const trip = useTripStore((s) => s.trips.find((t) => t.id === id));
  const addMember = useTripStore((s) => s.addMember);
  const addExpense = useTripStore((s) => s.addExpense);
  const setExpenseStatus = useTripStore((s) => s.setExpenseStatus);
  const removeExpense = useTripStore((s) => s.removeExpense);
  const removeTrip = useTripStore((s) => s.removeTrip);
  const addCashback = useTripStore((s) => s.addCashback);
  const isPro = useProStore((s) => s.isPro);

  const [crewOpen, setCrewOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [filter, setFilter] = useState<SpendFilter>('all');

  useEffect(() => {
    if (onboard === '1') {
      const t = setTimeout(() => setCrewOpen(true), 420);
      return () => clearTimeout(t);
    }
  }, [onboard]);

  const total = useMemo(
    () => trip?.expenses.reduce((a, e) => a + e.amount, 0) ?? 0,
    [trip],
  );

  const balances = useMemo(
    () => (trip ? computeBalances(trip.members, trip.expenses) : []),
    [trip],
  );

  const filteredExpenses = useMemo(() => {
    if (!trip) return [];
    if (filter === 'all') return trip.expenses;
    return trip.expenses.filter((e) => (e.status ?? 'pending') === filter);
  }, [trip, filter]);

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
    const order: ExpenseStatus[] = ['pending', 'received', 'settled'];
    const i = order.indexOf(current ?? 'pending');
    setExpenseStatus(trip.id, expenseId, order[(i + 1) % order.length]);
  };

  const confirmDeleteExpense = (expenseId: string, title: string) => {
    Alert.alert('Delete expense?', title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeExpense(trip.id, expenseId),
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
          <FadeIn delay={160}>
            <SoftCard style={styles.empty}>
              <EmptyArt kind="spend" width={140} height={100} />
              <Text style={[styles.emptyTitle, { color: c.text }]}>
                {trip.expenses.length === 0 ? 'No expenses yet' : 'Nothing in this filter'}
              </Text>
              <Text style={[styles.emptyBody, { color: c.textSecondary }]}>
                {trip.expenses.length === 0
                  ? 'Tap + — tag it however you want · AI receipt scan coming (Pro)'
                  : 'Tap an expense to cycle Tick / Received / Pending'}
              </Text>
            </SoftCard>
          </FadeIn>
        ) : (
          <View style={styles.list}>
            {filteredExpenses.map((e, i) => {
              const payer = trip.members.find((m) => m.id === e.paidById);
              const status = e.status ?? 'pending';
              return (
                <MotiView
                  key={e.id}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={enter(80 + i * 40)}
                >
                  <Pressable
                    onLongPress={() => confirmDeleteExpense(e.id, e.title)}
                    delayLongPress={450}
                  >
                    <SoftCard style={styles.expenseRow}>
                      <View style={styles.expLeft}>
                        <Pressable
                          onPress={() => cycleStatus(e.id, status)}
                          style={[
                            styles.expIcon,
                            {
                              backgroundColor:
                                status === 'settled'
                                  ? c.accent
                                  : status === 'received'
                                    ? c.accentSoft
                                    : c.fillSecondary,
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              status === 'settled'
                                ? 'checkmark'
                                : status === 'received'
                                  ? 'arrow-down'
                                  : e.recurring
                                    ? 'repeat'
                                    : 'receipt-outline'
                            }
                            size={18}
                            color={c.accentInk}
                          />
                        </Pressable>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.expTitle, { color: c.text }]}>
                            {e.title}
                            {e.tag ? ` · ${e.tag}` : ''}
                            {e.recurring ? ' · recurring' : ''}
                          </Text>
                          <Text style={[styles.expMeta, { color: c.textSecondary }]}>
                            {payer?.name ?? '—'} · {status}
                            {e.receiptUri ? ' · receipt' : ''}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.expAmount, { color: c.text }]}>
                        {formatMoney(e.amount, trip.currency)}
                      </Text>
                    </SoftCard>
                  </Pressable>
                </MotiView>
              );
            })}
          </View>
        )}

        <OffersPanel tripId={trip.id} onCashback={(amount) => addCashback(trip.id, amount)} />

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
        onClose={() => setExpenseOpen(false)}
        onAdd={(data) => addExpense(trip.id, data)}
      />

      <ShareGroupSheet
        visible={shareOpen}
        groupName={trip.name}
        inviteCode={trip.inviteCode}
        onClose={() => setShareOpen(false)}
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
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  expLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    flex: 1,
  },
  expIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expTitle: { ...type.subheadline },
  expMeta: {
    ...type.caption1,
    marginTop: 2,
  },
  expAmount: { ...type.headline },
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
