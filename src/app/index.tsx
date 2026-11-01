import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { ActionTile } from '@/components/ActionTile';
import { SoftCard } from '@/components/SoftCard';
import { NewTripSheet } from '@/components/NewTripSheet';
import { FadeIn } from '@/components/FadeIn';
import { FairpayLogo } from '@/components/FairpayLogo';
import { EarnStrip } from '@/components/EarnStrip';
import { SectionLabel } from '@/components/SectionLabel';
import { EmptyArt } from '@/components/EmptyArt';
import { useTripStore, type ExpenseStatus } from '@/store/trips';
import { useProStore } from '@/store/pro';
import { useAuthStore } from '@/store/auth';
import { useColors, useThemeStore } from '@/store/theme';
import { formatMoney } from '@/lib/currency';
import { space, type } from '@/theme/tokens';
import { enter } from '@/theme/motion';

type SpendFilter = 'all' | 'settled' | 'received' | 'pending';

function greetingFor(name: string) {
  const h = new Date().getHours();
  const hi = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${hi}, ${name}`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const trips = useTripStore((s) => s.trips);
  const addTrip = useTripStore((s) => s.addTrip);
  const isPro = useProStore((s) => s.isPro);
  const { isLoggedIn, name, questionsDone, onboardingDone } = useAuthStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [spendFilter, setSpendFilter] = useState<SpendFilter>('all');

  useEffect(() => {
    if (!onboardingDone) {
      router.replace('/onboarding');
    }
  }, [onboardingDone]);

  const allExpenses = useMemo(
    () =>
      trips.flatMap((t) =>
        t.expenses.map((e) => ({
          ...e,
          groupId: t.id,
          groupName: t.name,
          status: (e.status ?? 'pending') as ExpenseStatus,
        })),
      ),
    [trips],
  );

  const filteredSpend = useMemo(() => {
    if (spendFilter === 'all') return allExpenses;
    return allExpenses.filter((e) => e.status === spendFilter);
  }, [allExpenses, spendFilter]);

  const handleCreate = (
    groupName: string,
    purpose?: string,
    currency?: import('@/lib/currency').CurrencyCode,
  ) => {
    const trip = addTrip(groupName, purpose, currency, name || 'You');
    setSheetOpen(false);
    // onboard=1 opens add-crew; need 2+ people before splits work
    router.push({ pathname: '/trip/[id]', params: { id: trip.id, onboard: '1' } });
  };

  const openSettle = () => {
    if (trips.length === 0) {
      Alert.alert('Nothing to settle', 'Create a group first.');
      return;
    }
    const ready = trips.find((t) => t.members.length >= 2) ?? trips[0];
    if (ready.members.length < 2) {
      Alert.alert(
        'Need 2+ people',
        'Add at least one more person before settling.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open group',
            onPress: () =>
              router.push({ pathname: '/trip/[id]', params: { id: ready.id } }),
          },
        ],
      );
      return;
    }
    router.push({ pathname: '/settle/[id]', params: { id: ready.id } });
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
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 48 },
        ]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <FadeIn>
          <View style={styles.header}>
            <FairpayLogo width={140} />
            <View style={styles.headerActions}>
              <Pressable hitSlop={10} style={styles.headerIcon} onPress={() => router.push('/pro')}>
                <Ionicons
                  name={isPro ? 'diamond' : 'diamond-outline'}
                  size={20}
                  color={isPro ? c.accent : c.textSecondary}
                />
              </Pressable>
              <Pressable
                hitSlop={10}
                style={styles.headerIcon}
                onPress={() => router.push('/settings')}
              >
                <Ionicons name="settings-outline" size={20} color={c.textSecondary} />
              </Pressable>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={40}>
          <Text style={[styles.greeting, { color: c.text }]}>
            {greetingFor(isLoggedIn ? name : 'there')}
          </Text>
          <Text style={[styles.greetingSub, { color: c.textSecondary }]}>
            {isLoggedIn
              ? 'Here’s your shared money at a glance.'
              : 'Sign in to personalize Fairpay — or start a group now.'}
          </Text>
        </FadeIn>

        {!isLoggedIn ? (
          <FadeIn delay={70}>
            {/* Dark: muted box + green buttons (reverse of neon wall) */}
            <SoftCard tone={darkMode ? 'fill' : 'accent'} style={styles.authCard}>
              <Text style={[styles.authTitle, { color: darkMode ? c.text : c.accentInk }]}>
                Login / Sign up
              </Text>
              <Text
                style={[
                  styles.authBody,
                  { color: darkMode ? c.textSecondary : c.accentInk },
                ]}
              >
                Keep groups, pay methods, and settlements ready across devices.
              </Text>
              <View style={styles.authRow}>
                <Pressable
                  style={[
                    styles.authBtn,
                    {
                      backgroundColor: darkMode ? c.accent : c.accentInk,
                    },
                  ]}
                  onPress={() => router.push('/login')}
                >
                  <Text
                    style={[
                      styles.authBtnText,
                      { color: darkMode ? c.accentInk : c.accent },
                    ]}
                  >
                    Log in
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.authBtn,
                    {
                      backgroundColor: darkMode ? '#F5F5F7' : '#FFFFFF',
                      borderWidth: darkMode ? 0 : 1,
                      borderColor: 'rgba(0,0,0,0.08)',
                    },
                  ]}
                  onPress={() => router.push('/signup')}
                >
                  <Text style={[styles.authBtnText, { color: '#0A0A0A' }]}>Sign up</Text>
                </Pressable>
              </View>
            </SoftCard>
          </FadeIn>
        ) : null}

        {!questionsDone ? (
          <FadeIn delay={90}>
            <Pressable onPress={() => router.push('/questions')}>
              <SoftCard style={styles.askCard}>
                <View style={[styles.askIcon, { backgroundColor: c.accent }]}>
                  <Ionicons name="help-buoy-outline" size={20} color={c.accentInk} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.askTitle, { color: c.text }]}>Quick setup questions</Text>
                  <Text style={[styles.askBody, { color: c.textSecondary }]}>
                    Tell us how you split — takes 30 seconds
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
              </SoftCard>
            </Pressable>
          </FadeIn>
        ) : null}

        <View style={styles.actions}>
          <ActionTile
            icon="add-circle-outline"
            label="New"
            highlight
            delay={100}
            onPress={() => setSheetOpen(true)}
          />
          <ActionTile icon="swap-horizontal-outline" label="Settle" delay={150} onPress={openSettle} />
          <ActionTile icon="link-outline" label="Join" delay={200} onPress={() => router.push('/join')} />
          <ActionTile icon="time-outline" label="History" delay={250} onPress={() => router.push('/history')} />
        </View>

        <FadeIn delay={200}>
          <EarnStrip />
        </FadeIn>

        <FadeIn delay={260}>
          <View style={styles.midRow}>
            <SoftCard tone={darkMode ? 'fill' : 'accent'} style={styles.midCard}>
              <Text
                style={[
                  styles.midTitle,
                  { color: darkMode ? c.text : c.accentInk },
                ]}
              >
                Groups
              </Text>
              <View style={styles.midStatRow}>
                <Text
                  style={[
                    styles.midMuted,
                    { color: darkMode ? c.textSecondary : c.accentInk, opacity: 0.75 },
                  ]}
                >
                  Active
                </Text>
                <Text
                  style={[
                    styles.midValue,
                    { color: darkMode ? c.text : c.accentInk },
                  ]}
                >
                  {trips.length}
                </Text>
              </View>
              <View style={styles.midStatRow}>
                <Text
                  style={[
                    styles.midMuted,
                    { color: darkMode ? c.textSecondary : c.accentInk, opacity: 0.75 },
                  ]}
                >
                  People
                </Text>
                <Text
                  style={[
                    styles.midValue,
                    { color: darkMode ? c.text : c.accentInk },
                  ]}
                >
                  {trips.reduce((n, t) => n + t.members.length, 0)}
                </Text>
              </View>
            </SoftCard>
            <SoftCard tone="fill" style={[styles.midCard, darkMode && { backgroundColor: c.fillSecondary }]}>
              <Text style={[styles.midTitle, { color: c.text }]}>Quick</Text>
              <Pressable onPress={() => router.push('/settings')}>
                <Text style={[styles.midLink, { color: c.text }]}>Settings →</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/profile')}>
                <Text style={[styles.midLink, { color: c.text }]}>Profile →</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/onboarding')}>
                <Text style={[styles.midLink, { color: c.text }]}>Welcome →</Text>
              </Pressable>
            </SoftCard>
          </View>
        </FadeIn>

        <SectionLabel>Your groups</SectionLabel>
        {trips.length === 0 ? (
          <Pressable onPress={() => setSheetOpen(true)}>
            <SoftCard style={styles.emptyTripBlock}>
              <EmptyArt kind="groups" width={140} height={100} />
              <Text style={[styles.emptyTitle, { color: c.text, textAlign: 'center' }]}>
                Start any shared spend
              </Text>
              <Text style={[styles.emptyBody, { color: c.textSecondary, textAlign: 'center' }]}>
                Name it yourself — travel, office, rent… then invite 2+
              </Text>
            </SoftCard>
          </Pressable>
        ) : (
          <View style={styles.tripList}>
            {trips.map((trip, i) => {
              const total = trip.expenses.reduce((a, e) => a + e.amount, 0);
              return (
                <MotiView
                  key={trip.id}
                  from={{ opacity: 0, translateY: 12 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={enter(90 + i * 45)}
                >
                  <Pressable
                    onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } })}
                  >
                    <SoftCard style={styles.tripCard}>
                      <View style={styles.tripLeft}>
                        <View style={[styles.tripAvatar, { backgroundColor: c.accent }]}>
                          <Ionicons name="people" size={20} color={c.accentInk} />
                        </View>
                        <View>
                          <Text style={[styles.tripName, { color: c.text }]}>{trip.name}</Text>
                          <Text style={[styles.apyText, { color: c.textSecondary }]}>
                            {trip.members.length} {trip.members.length === 1 ? 'person' : 'people'} · {trip.expenses.length} expenses
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.tripAmount, { color: c.text }]}>
                        {formatMoney(total, trip.currency)}
                      </Text>
                    </SoftCard>
                  </Pressable>
                </MotiView>
              );
            })}
          </View>
        )}

        <SectionLabel style={{ marginTop: space.xxxl }}>Across groups</SectionLabel>
        <Text style={[styles.acrossHint, { color: c.textTertiary }]}>
          Open a group for its own total · filter status here
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((f) => {
            const on = spendFilter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setSpendFilter(f.id)}
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

        {filteredSpend.length === 0 ? (
          <SoftCard style={{ marginTop: space.sm, alignItems: 'center' }}>
            <EmptyArt kind="spend" width={120} height={90} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>No spends here yet</Text>
            <Text style={[styles.emptyBody, { color: c.textSecondary, textAlign: 'center' }]}>
              Add expenses in a group, then filter by Tick / Received / Pending
            </Text>
          </SoftCard>
        ) : (
          filteredSpend.slice(0, 8).map((e, i) => (
            <MotiView
              key={e.id}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={enter(40 + i * 30)}
            >
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/trip/[id]', params: { id: e.groupId } })
                }
              >
                <SoftCard style={styles.spendRow}>
                  <View
                    style={[
                      styles.spendIcon,
                      {
                        backgroundColor:
                          e.status === 'settled'
                            ? c.accent
                            : e.status === 'received'
                              ? c.accentSoft
                              : c.fillSecondary,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        e.status === 'settled'
                          ? 'checkmark'
                          : e.status === 'received'
                            ? 'arrow-down'
                            : 'ellipse-outline'
                      }
                      size={16}
                      color={c.accentInk}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tripName, { color: c.text }]}>{e.title}</Text>
                    <Text style={[styles.apyText, { color: c.textSecondary }]}>
                      {e.groupName} · {e.status}
                    </Text>
                  </View>
                  <Text style={[styles.tripAmount, { color: c.text }]}>
                    {formatMoney(
                      e.amount,
                      trips.find((t) => t.id === e.groupId)?.currency,
                    )}
                  </Text>
                </SoftCard>
              </Pressable>
            </MotiView>
          ))
        )}

        <View style={{ height: space.xxxl }} />
      </ScrollView>

      <NewTripSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreate={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: space.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.sm,
    marginBottom: space.lg,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIcon: { padding: 4 },
  greeting: { ...type.title2 },
  greetingSub: { ...type.footnote, marginTop: 4, marginBottom: space.lg },
  authCard: { marginBottom: space.lg },
  authTitle: { ...type.title3 },
  authBody: { ...type.footnote, marginTop: 4, opacity: 0.85 },
  authRow: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  authBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  authBtnGhost: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  authBtnText: { ...type.subheadline },
  askCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.lg,
  },
  askIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askTitle: { ...type.subheadline },
  askBody: { ...type.caption1, marginTop: 2 },
  actions: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  acrossHint: { ...type.caption1, marginBottom: space.md, marginLeft: 2 },
  midRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.xxl },
  midCard: { flex: 1, gap: space.sm, minHeight: 120 },
  midTitle: { ...type.subheadline, marginBottom: space.xs },
  midStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  midMuted: { ...type.caption1 },
  midValue: { ...type.callout },
  midLink: { ...type.footnote, fontWeight: '700', marginTop: 2 },
  sectionTitle: {
    ...type.footnote,
    fontWeight: '700',
    marginBottom: space.sm,
    marginLeft: 2,
  },
  emptyTripBlock: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
  emptyTitle: { ...type.subheadline },
  emptyBody: { ...type.caption1, marginTop: 2 },
  tripList: { gap: space.sm },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tripLeft: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  tripAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripAvatarText: { ...type.callout },
  tripName: { ...type.subheadline },
  apyText: { ...type.caption1, fontWeight: '600', marginTop: 2 },
  tripAmount: { ...type.headline },
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
  spendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  spendIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
