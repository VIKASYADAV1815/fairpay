import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FairpayLogo } from '@/components/FairpayLogo';
import { useColors } from '@/store/theme';
import { space, type } from '@/theme/tokens';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>About Fairpay</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandHero}>
          <FairpayLogo width={160} />
          <View style={[styles.versionBadge, { backgroundColor: '#0A0A0A' }]}>
            <Text style={[styles.versionText, { color: c.accent }]}>Version 1.0.0 (Build 2026)</Text>
          </View>
          <Text style={[styles.heroHeadline, { color: c.text }]}>
            Zero-friction shared money for any group.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.separator }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Our Mission</Text>
          <Text style={[styles.cardText, { color: c.textSecondary }]}>
            Splitting bills on trips, with flatmates, or at dinners shouldn't feel like a chore. Fairpay eliminates awkward money reminders by combining offline-first tracking, AI receipt parsing, instant WhatsApp settlements, and automatic debt simplification.
          </Text>
        </View>

        <View style={styles.featureGrid}>
          <View style={[styles.featureCard, { backgroundColor: c.card, borderColor: c.separator }]}>
            <Ionicons name="flash-outline" size={24} color={c.accent} />
            <Text style={[styles.featureTitle, { color: c.text }]}>1-Tap Settlements</Text>
            <Text style={[styles.featureDesc, { color: c.textSecondary }]}>
              Deep links for UPI, PhonePe, GPay, Paytm & PayPal.
            </Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: c.card, borderColor: c.separator }]}>
            <Ionicons name="cloud-done-outline" size={24} color={c.accent} />
            <Text style={[styles.featureTitle, { color: c.text }]}>Multi-Device Sync</Text>
            <Text style={[styles.featureDesc, { color: c.textSecondary }]}>
              Real-time cross-device group sync via Supabase.
            </Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: c.card, borderColor: c.separator }]}>
            <Ionicons name="document-text-outline" size={24} color={c.accent} />
            <Text style={[styles.featureTitle, { color: c.text }]}>Bank Statements</Text>
            <Text style={[styles.featureDesc, { color: c.textSecondary }]}>
              Export structured, bank-grade PDF reports for groups.
            </Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: c.card, borderColor: c.separator }]}>
            <Ionicons name="shield-checkmark-outline" size={24} color={c.accent} />
            <Text style={[styles.featureTitle, { color: c.text }]}>Privacy First</Text>
            <Text style={[styles.featureDesc, { color: c.textSecondary }]}>
              No ads, no data selling, zero access to banking credentials.
            </Text>
          </View>
        </View>

        {/* Links */}
        <View style={styles.linkList}>
          <Pressable
            style={[styles.linkRow, { borderColor: c.separator }]}
            onPress={() => router.push('/privacy')}
          >
            <Text style={[styles.linkText, { color: c.text }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
          </Pressable>

          <Pressable
            style={[styles.linkRow, { borderColor: c.separator }]}
            onPress={() => router.push('/faq')}
          >
            <Text style={[styles.linkText, { color: c.text }]}>Frequently Asked Questions</Text>
            <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
          </Pressable>
        </View>

        <Text style={[styles.footerText, { color: c.textTertiary }]}>
          Crafted with care · Fairpay © 2026
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  backButton: { padding: 4 },
  headerTitle: { ...type.headline, fontSize: 17 },
  content: { padding: space.xl },
  brandHero: {
    alignItems: 'center',
    marginTop: space.lg,
    marginBottom: space.xxl,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: space.md,
    marginBottom: space.md,
  },
  versionText: { fontSize: 12, fontWeight: '700' },
  heroHeadline: {
    ...type.largeTitle,
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 30,
    marginTop: space.xs,
  },
  card: {
    padding: space.xl,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: space.xl,
  },
  cardTitle: { ...type.headline, fontSize: 18, marginBottom: space.sm },
  cardText: { ...type.body, fontSize: 15, lineHeight: 24 },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginBottom: space.xxl,
  },
  featureCard: {
    width: '47.5%',
    padding: space.lg,
    borderRadius: 14,
    borderWidth: 1,
  },
  featureTitle: { ...type.subheadline, fontWeight: '700', marginTop: space.sm, marginBottom: 4 },
  featureDesc: { ...type.caption1, lineHeight: 18 },
  linkList: { marginBottom: space.xxl },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkText: { ...type.body, fontWeight: '500' },
  footerText: {
    textAlign: 'center',
    ...type.caption1,
    marginTop: space.md,
  },
});
