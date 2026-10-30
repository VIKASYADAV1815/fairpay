import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SoftCard } from '@/components/SoftCard';
import { FadeIn } from '@/components/FadeIn';
import { SectionLabel } from '@/components/SectionLabel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useColors, useThemeStore } from '@/store/theme';
import { useProStore } from '@/store/pro';
import { useTripStore } from '@/store/trips';
import { MOCK_DEALS } from '@/data/uiMock';
import { AFFILIATE_OFFERS } from '@/lib/affiliates';
import { formatMoney } from '@/lib/currency';
import { space, type } from '@/theme/tokens';
import { enter } from '@/theme/motion';

export default function DealsScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const isPro = useProStore((s) => s.isPro);
  const pot = useTripStore((s) =>
    s.trips.reduce((n, t) => n + (t.potCashback || 0), 0),
  );

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <ScreenHeader
        title="Deals"
        right={
          <Pressable onPress={() => router.push('/pro')} hitSlop={8}>
            <Ionicons name="diamond-outline" size={20} color={c.text} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          <SoftCard tone={darkMode ? 'fill' : 'accent'} style={styles.hero}>
            <Text style={[styles.heroEyebrow, { color: darkMode ? c.accent : c.accentInk }]}>
              GROUP POT
            </Text>
            <Text style={[styles.heroTitle, { color: darkMode ? c.text : c.accentInk }]}>
              Book · split · cashback
            </Text>
            <Text
              style={[
                styles.heroBody,
                { color: darkMode ? c.textSecondary : c.accentInk },
              ]}
            >
              Partner stays feed cashback into your group pot — not your personal wallet.
              That’s Fairpay’s wedge: earn together while you settle.
            </Text>
            <View style={styles.potRow}>
              <Text style={[styles.potLabel, { color: darkMode ? c.textSecondary : c.accentInk }]}>
                Pot so far
              </Text>
              <Text style={[styles.potVal, { color: darkMode ? c.text : c.accentInk }]}>
                {formatMoney(pot, 'INR')}
              </Text>
            </View>
          </SoftCard>
        </FadeIn>

        {!isPro ? (
          <SoftCard style={styles.upsell}>
            <Text style={[styles.upsellTitle, { color: c.text }]}>Pro tracks cashback</Text>
            <Text style={[styles.upsellBody, { color: c.textSecondary }]}>
              Free: browse deals. Pro: credits land in the pot with a receipt trail.
            </Text>
            <PrimaryButton
              label="See Pro"
              variant="accent"
              onPress={() => router.push('/pro')}
              style={{ marginTop: space.md }}
            />
          </SoftCard>
        ) : null}

        <SectionLabel>Featured partners</SectionLabel>
        {MOCK_DEALS.map((d, i) => {
          const offer = AFFILIATE_OFFERS.find((o) => o.brand === d.brand);
          return (
            <MotiView
              key={d.id}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={enter(70 + i * 45)}
            >
              <Pressable onPress={() => offer && Linking.openURL(offer.url)}>
                <SoftCard style={styles.row}>
                  <View style={[styles.badge, { backgroundColor: c.accent }]}>
                    <Text style={[styles.pct, { color: c.accentInk }]}>{d.pct}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: c.text }]}>
                      {d.brand} · {d.title}
                    </Text>
                    <Text style={[styles.blurb, { color: c.textSecondary }]}>{d.blurb}</Text>
                    <Text style={[styles.meta, { color: c.textTertiary }]}>
                      {isPro ? 'Tracked → pot' : 'Browse free · track with Pro'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
                </SoftCard>
              </Pressable>
            </MotiView>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.xl },
  hero: { marginBottom: space.lg },
  heroEyebrow: {
    ...type.caption2,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  heroTitle: { ...type.title1, marginTop: 6 },
  heroBody: { ...type.footnote, marginTop: 8, opacity: 0.9 },
  potRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.lg,
  },
  potLabel: { ...type.caption1, fontWeight: '600' },
  potVal: { ...type.title3 },
  upsell: { marginBottom: space.xl },
  upsellTitle: { ...type.subheadline },
  upsellBody: { ...type.caption1, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: { ...type.subheadline },
  title: { ...type.subheadline },
  blurb: { ...type.caption1, marginTop: 2 },
  meta: { ...type.caption2, marginTop: 4, fontWeight: '600' },
});
