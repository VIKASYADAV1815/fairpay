import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { SoftCard } from '@/components/SoftCard';
import { BeamUnlockButton } from '@/components/BeamUnlockButton';
import { FadeIn } from '@/components/FadeIn';
import { SectionLabel } from '@/components/SectionLabel';
import { PRO_FEATURES, PRO_PRICE_LABEL, useProStore } from '@/store/pro';
import { useColors, useThemeStore } from '@/store/theme';
import { BILLING_NOTE, purchasePro, restorePurchases } from '@/lib/billing';
import { space, type } from '@/theme/tokens';
import { timing } from '@/theme/motion';

const VALUE_ROWS = [
  { free: 'Single WhatsApp notify', pro: 'Batch notify all unpaid' },
  { free: 'Browse travel deals', pro: 'Cashback tracked → group pot' },
  { free: 'On-screen balances', pro: 'PDF settle reports' },
  { free: 'Manual reminders', pro: 'Scheduled settle nudges' },
] as const;

export default function ProScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const isPro = useProStore((s) => s.isPro);
  const unlockPro = useProStore((s) => s.unlockPro);

  const buy = async () => {
    const result = await purchasePro();
    if (result.ok) {
      unlockPro();
      Alert.alert('Fairpay Pro unlocked', BILLING_NOTE);
    } else {
      Alert.alert('Purchase failed', result.reason);
    }
  };

  const restore = async () => {
    const result = await restorePurchases();
    Alert.alert(
      result.ok ? 'Restored' : 'Nothing to restore',
      result.ok ? 'Pro active.' : result.reason,
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>Fairpay Pro</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          <SoftCard tone={darkMode ? 'fill' : 'accent'} style={styles.hero}>
            <Text style={[styles.heroEyebrow, { color: darkMode ? c.accent : c.accentInk }]}>
              {isPro ? 'ACTIVE' : 'WHY PAY'}
            </Text>
            <Text style={[styles.heroTitle, { color: darkMode ? c.text : c.accentInk }]}>
              {isPro ? 'You’re Pro' : 'Settle faster.\nEarn as a group.'}
            </Text>
            <Text
              style={[
                styles.heroSub,
                { color: darkMode ? c.textSecondary : c.accentInk },
              ]}
            >
              Pro isn’t ads — it’s batch settle, PDF proof, and travel cashback that funds the
              shared pot.
            </Text>
            {!isPro ? (
              <Text style={[styles.price, { color: darkMode ? c.accent : c.accentInk }]}>
                {PRO_PRICE_LABEL}
              </Text>
            ) : null}
          </SoftCard>
        </FadeIn>

        <SectionLabel>Free vs Pro</SectionLabel>
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
                <Text style={[styles.compareLbl, { color: c.accent }]}>Pro</Text>
                <Text style={[styles.compareVal, { color: c.text }]}>{row.pro}</Text>
              </View>
            </SoftCard>
          </MotiView>
        ))}

        <SectionLabel>Included</SectionLabel>
        {PRO_FEATURES.map((f, i) => (
          <MotiView
            key={f}
            from={{ opacity: 0, translateX: -6 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={timing(280, i * 40)}
          >
            <SoftCard style={styles.row}>
              <View style={[styles.check, { backgroundColor: c.accent }]}>
                <Ionicons name="checkmark" size={16} color={c.accentInk} />
              </View>
              <Text style={[styles.feature, { color: c.text }]}>{f}</Text>
            </SoftCard>
          </MotiView>
        ))}

        {!isPro ? (
          <View style={{ marginTop: space.xxl }}>
            <BeamUnlockButton
              label={`Unlock Pro · ${PRO_PRICE_LABEL}`}
              tone="neon"
              onPress={buy}
            />
            <Pressable onPress={restore} style={{ marginTop: space.md, alignItems: 'center' }}>
              <Text style={[styles.fine, { color: c.textSecondary, marginTop: 0 }]}>
                Restore purchases
              </Text>
            </Pressable>
            <Text style={[styles.fine, { color: c.textTertiary }]}>{BILLING_NOTE}</Text>
          </View>
        ) : (
          <SoftCard tone={darkMode ? 'fill' : 'accent'} style={{ marginTop: space.xxl }}>
            <Text style={[styles.heroEyebrow, { color: darkMode ? c.accent : c.accentInk }]}>
              THANKS
            </Text>
            <Text style={[styles.feature, { color: darkMode ? c.text : c.accentInk }]}>
              Pro tools unlocked on this device. Wire RevenueCat next for real billing.
            </Text>
            <Pressable onPress={() => router.push('/deals')} style={{ marginTop: space.md }}>
              <Text style={{ color: darkMode ? c.accent : c.accentInk, fontWeight: '700' }}>
                Open deals →
              </Text>
            </Pressable>
          </SoftCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xl,
    marginTop: space.sm,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...type.headline },
  hero: { marginBottom: space.xxl },
  heroEyebrow: {
    ...type.caption2,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: { ...type.largeTitle, marginTop: 8 },
  heroSub: { ...type.footnote, marginTop: 10, opacity: 0.9 },
  price: { ...type.title2, marginTop: space.lg },
  compare: {
    flexDirection: 'row',
    marginBottom: space.sm,
    gap: space.md,
  },
  compareCol: { flex: 1 },
  compareLbl: { ...type.caption2, fontWeight: '800', marginBottom: 4 },
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
