import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SoftCard } from '@/components/SoftCard';
import { FadeIn } from '@/components/FadeIn';
import { useTripStore } from '@/store/trips';
import { useColors } from '@/store/theme';
import { MOCK_ACTIVITY } from '@/data/uiMock';
import { router } from 'expo-router';
import { formatMoney } from '@/lib/currency';
import { space, type } from '@/theme/tokens';
import { enter } from '@/theme/motion';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const trips = useTripStore((s) => s.trips);

  const live = trips.map((t) => ({
    id: t.id,
    title: t.name,
    subtitle: `${t.members.length} people · ${t.expenses.length} expenses · ${t.currency ?? 'INR'}`,
    amount: formatMoney(
      t.expenses.reduce((a, e) => a + e.amount, 0),
      t.currency,
    ),
    live: true as const,
  }));

  const rows = [
    ...live,
    ...MOCK_ACTIVITY.map((m) => ({ ...m, live: false as const })),
  ];

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <ScreenHeader title="History" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          <Text style={[styles.lead, { color: c.text }]}>Groups & activity</Text>
          <Text style={[styles.sub, { color: c.textSecondary }]}>
            Live groups + sample past activity for UI
          </Text>
        </FadeIn>

        {rows.map((r, i) => (
          <MotiView
            key={r.id}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={enter(60 + i * 40)}
          >
            <Pressable
              onPress={() => {
                if ('live' in r && r.live) {
                  router.push({ pathname: '/trip/[id]', params: { id: r.id } });
                }
              }}
            >
              <SoftCard style={styles.row}>
                <View style={[styles.icon, { backgroundColor: c.accent }]}>
                  <Ionicons
                    name={r.live ? 'flash' : 'time-outline'}
                    size={18}
                    color={c.accentInk}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: c.text }]}>{r.title}</Text>
                  <Text style={[styles.meta, { color: c.textSecondary }]}>{r.subtitle}</Text>
                </View>
                <Text style={[styles.amount, { color: c.text }]}>{r.amount}</Text>
              </SoftCard>
            </Pressable>
          </MotiView>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.xl },
  lead: { ...type.title2 },
  sub: { ...type.footnote, marginBottom: space.xl, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.subheadline },
  meta: { ...type.caption1, marginTop: 2 },
  amount: { ...type.headline },
});
