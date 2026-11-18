import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { SoftCard } from '@/components/SoftCard';
import { BeamUnlockButton } from '@/components/BeamUnlockButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { PaymentCheckoutModal } from '@/components/PaymentCheckoutModal';
import { FadeIn } from '@/components/FadeIn';
import { SectionLabel } from '@/components/SectionLabel';
import { Diamond } from '@/assets/illustrations';
import {
  PRO_FEATURES,
  PRO_PRICE_LABEL,
  TRIP_PASS_FEATURES,
  TRIP_PASS_PRICE_LABEL,
  useProStore,
} from '@/store/pro';
import { useTripStore } from '@/store/trips';
import { useColors, useThemeStore } from '@/store/theme';
import { BILLING_NOTE, restorePurchases } from '@/lib/billing';
import { radius, space, type } from '@/theme/tokens';
import { timing } from '@/theme/motion';

const VALUE_ROWS = [
  { free: 'Single WhatsApp notify', pro: 'Batch notify all unpaid' },
  { free: 'Manual bill typing', pro: 'AI receipt camera scanner' },
  { free: 'On-screen balances', pro: 'Official branded PDF reports' },
  { free: 'Manual nudges', pro: 'Automated WhatsApp settle links' },
] as const;

export default function ProScreen() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const trip = useTripStore((s) => (tripId ? s.trips.find((t) => t.id === tripId) : undefined));

  const isPro = useProStore((s) => s.isPro);
  const isTripUnlocked = useProStore((s) => s.isTripUnlocked);
  const unlockPro = useProStore((s) => s.unlockPro);
  const unlockTrip = useProStore((s) => s.unlockTrip);

  const tripUnlocked = tripId ? isTripUnlocked(tripId) : false;
  const [selectedPlan, setSelectedPlan] = useState<'trip' | 'annual'>(tripId ? 'trip' : 'annual');
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutConfig, setCheckoutConfig] = useState<{
    amount: number;
    currency: string;
    title: string;
    planType: 'trip_pass' | 'pro_annual';
    tripId?: string;
  }>({
    amount: 49,
    currency: trip?.currency || 'INR',
    title: `Trip Pass · ${trip?.name || 'Group'}`,
    planType: 'trip_pass',
    tripId,
  });

  const openTripPassCheckout = () => {
    if (!tripId) return;
    setCheckoutConfig({
      amount: (trip?.currency || 'INR') === 'INR' ? 49 : 0.99,
      currency: trip?.currency || 'INR',
      title: `Trip Pass · ${trip?.name || 'Group'}`,
      planType: 'trip_pass',
      tripId,
    });
    setCheckoutVisible(true);
  };

  const openProCheckout = () => {
    setCheckoutConfig({
      amount: (trip?.currency || 'INR') === 'INR' ? 399 : 4.99,
      currency: trip?.currency || 'INR',
      title: 'Fairpay Pro (Annual)',
      planType: 'pro_annual',
    });
    setCheckoutVisible(true);
  };

  const restore = async () => {
    const result = await restorePurchases();
    Alert.alert(
      result.ok ? 'Restored' : 'Nothing to restore',
      result.ok ? 'Purchases restored.' : result.reason,
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>
          {trip ? `${trip.name} · Upgrade` : 'Fairpay Plans'}
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          {/* Premium Hero Card */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={
                darkMode
                  ? ['rgba(178, 255, 36, 0.15)', 'rgba(0, 163, 255, 0.08)', 'transparent']
                  : ['rgba(178, 255, 36, 0.22)', 'rgba(0, 163, 255, 0.06)', 'transparent']
              }
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.heroContent}>
              <View style={styles.heroText}>
                <View style={[styles.heroEyebrowBadge, { backgroundColor: '#0A0A0A' }]}>
                  <Text style={[styles.heroEyebrow, { color: c.accent }]}>
                    {isPro ? '✓ Pro active' : tripUnlocked ? '✓ Trip Pass active' : 'Upgrade your experience'}
                  </Text>
                </View>
                <Text style={[styles.heroTitle, { color: c.text }]}>
                  {isPro
                    ? "You're Pro"
                    : tripUnlocked
                    ? `${trip?.name} Unlocked`
                    : 'Settle faster.\nNo bill awkwardness.'}
                </Text>
                <Text style={[styles.heroSub, { color: c.textSecondary }]}>
                  Unlock instant batch WhatsApp settlement, PDF audit reports, and AI bill splitting.
                </Text>
              </View>
              <View style={styles.heroIllustration}>
                <Diamond width={100} height={100} />
              </View>
            </View>
          </View>
        </FadeIn>

        {/* Pricing Selection Tiers */}
        {!isPro && (
          <>
            <SectionLabel>Choose your option</SectionLabel>
            <View style={styles.planCardsContainer}>
              {tripId && (
                <Pressable
                  onPress={() => setSelectedPlan('trip')}
                  style={[
                    styles.planCard,
                    {
                      borderColor: selectedPlan === 'trip' ? c.accent : c.separator,
                      backgroundColor: selectedPlan === 'trip' ? (darkMode ? '#232D15' : '#F6FFDC') : c.fill,
                    },
                  ]}
                >
                  <View style={styles.planHeader}>
                    <View>
                      <Text style={[styles.planTitle, { color: c.text }]}>Trip Pass</Text>
                      <Text style={[styles.planSub, { color: c.textSecondary }]}>
                        For "{trip?.name}" only
                      </Text>
                    </View>
                    <View style={styles.planBadge}>
                      <Text style={[styles.planBadgeText, { color: c.accentInk }]}>Popular</Text>
                    </View>
                  </View>
                  <Text style={[styles.planPrice, { color: c.text }]}>{TRIP_PASS_PRICE_LABEL}</Text>
                  <Text style={[styles.planNote, { color: c.textSecondary }]}>
                    One-time payment · No subscription
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => setSelectedPlan('annual')}
                style={[
                  styles.planCard,
                  {
                    borderColor: selectedPlan === 'annual' ? c.accent : c.separator,
                    backgroundColor: selectedPlan === 'annual' ? (darkMode ? '#232D15' : '#F6FFDC') : c.fill,
                  },
                ]}
              >
                <View style={styles.planHeader}>
                  <View>
                    <Text style={[styles.planTitle, { color: c.text }]}>Fairpay Pro</Text>
                    <Text style={[styles.planSub, { color: c.textSecondary }]}>
                      Unlimited trips + Work GST exports
                    </Text>
                  </View>
                  <View style={[styles.planBadge, { backgroundColor: c.accent }]}>
                    <Text style={[styles.planBadgeText, { color: c.accentInk }]}>Best Value</Text>
                  </View>
                </View>
                <Text style={[styles.planPrice, { color: c.text }]}>{PRO_PRICE_LABEL}</Text>
                <Text style={[styles.planNote, { color: c.textSecondary }]}>
                  Works for all trips, flatmates & teams
                </Text>
              </Pressable>
            </View>

            {/* Action Button */}
            <View style={{ marginTop: space.lg, marginBottom: space.xl }}>
              {selectedPlan === 'trip' && tripId ? (
                <PrimaryButton
                  label={tripUnlocked ? '✓ Trip Pass Already Active' : `Unlock This Trip · ${TRIP_PASS_PRICE_LABEL}`}
                  variant="accent"
                  disabled={tripUnlocked}
                  onPress={openTripPassCheckout}
                />
              ) : (
                <BeamUnlockButton
                  label={`Unlock All Trips · ${PRO_PRICE_LABEL}`}
                  tone="neon"
                  onPress={openProCheckout}
                />
              )}
              <Pressable onPress={restore} style={{ marginTop: space.md, alignItems: 'center' }}>
                <Text style={[styles.fine, { color: c.textSecondary, marginTop: 0 }]}>
                  Restore purchases
                </Text>
              </Pressable>
              <Text style={[styles.fine, { color: c.textTertiary }]}>{BILLING_NOTE}</Text>
            </View>
          </>
        )}

        <SectionLabel>What's included</SectionLabel>
        {(selectedPlan === 'trip' ? TRIP_PASS_FEATURES : PRO_FEATURES).map((f, i) => (
          <MotiView
            key={f}
            from={{ opacity: 0, translateX: -6 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={timing(240, i * 35)}
          >
            <SoftCard style={styles.row}>
              <View style={[styles.check, { backgroundColor: c.accent }]}>
                <Ionicons name="checkmark" size={16} color={c.accentInk} />
              </View>
              <Text style={[styles.feature, { color: c.text }]}>{f}</Text>
            </SoftCard>
          </MotiView>
        ))}

        <SectionLabel>Free vs upgraded</SectionLabel>
        {VALUE_ROWS.map((row, i) => (
          <MotiView
            key={row.pro}
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={timing(240, i * 35)}
          >
            <SoftCard style={styles.compare}>
              <View style={styles.compareCol}>
                <Text style={[styles.compareLbl, { color: c.textTertiary }]}>Free</Text>
                <Text style={[styles.compareVal, { color: c.textSecondary }]}>{row.free}</Text>
              </View>
              <View style={[styles.compareDiv, { backgroundColor: c.separator }]} />
              <View style={styles.compareCol}>
                <View style={[styles.compareBadge, { backgroundColor: '#0A0A0A' }]}>
                  <Text style={[styles.compareLbl, { color: c.accent }]}>With Pass / Pro</Text>
                </View>
                <Text style={[styles.compareVal, { color: c.text, marginTop: 4 }]}>{row.pro}</Text>
              </View>
            </SoftCard>
          </MotiView>
        ))}
      </ScrollView>

      <PaymentCheckoutModal
        visible={checkoutVisible}
        options={checkoutConfig}
        onClose={() => setCheckoutVisible(false)}
        onSuccess={() => {
          if (checkoutConfig.planType === 'trip_pass' && tripId) {
            unlockTrip(tripId);
          } else {
            unlockPro();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
    marginTop: space.sm,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...type.headline },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: space.xl,
    minHeight: 180,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: space.lg,
    gap: space.md,
  },
  heroText: { flex: 1 },
  heroIllustration: { opacity: 0.95, marginTop: -6 },
  heroEyebrowBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  heroEyebrow: {
    ...type.caption2,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    ...type.largeTitle,
    fontSize: 26,
    marginTop: 6,
    marginBottom: 8,
  },
  heroSub: {
    ...type.footnote,
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.9,
  },
  planCardsContainer: { gap: space.md },
  planCard: {
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  planTitle: {
    ...type.headline,
    fontSize: 18,
  },
  planSub: {
    ...type.caption1,
    marginTop: 2,
  },
  planBadge: {
    backgroundColor: '#B2FF24',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  planBadgeText: {
    ...type.caption2,
    fontWeight: '800',
  },
  planPrice: {
    ...type.title1,
    fontSize: 24,
    marginTop: space.sm,
  },
  planNote: {
    ...type.caption2,
    marginTop: 2,
  },
  compare: {
    flexDirection: 'row',
    marginBottom: space.sm,
    gap: space.md,
  },
  compareCol: { flex: 1 },
  compareBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  compareLbl: { ...type.caption2, fontWeight: '800' },
  compareVal: { ...type.footnote, fontWeight: '600' },
  compareDiv: { width: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feature: { ...type.subheadline, flex: 1 },
  fine: {
    ...type.caption1,
    textAlign: 'center',
    marginTop: space.md,
  },
});
