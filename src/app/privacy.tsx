import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/theme';
import { space, type } from '@/theme/tokens';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>Privacy Policy</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.badge, { backgroundColor: '#0A0A0A' }]}>
          <Text style={[styles.badgeText, { color: c.accent }]}>Last updated: November 2026</Text>
        </View>

        <Text style={[styles.title, { color: c.text }]}>Your data stays yours.</Text>
        <Text style={[styles.lead, { color: c.textSecondary }]}>
          Fairpay is designed with privacy-first principles. We never sell your personal information, run tracking ads, or access your bank accounts.
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>1. Information We Collect</Text>
          <Text style={[styles.sectionBody, { color: c.textSecondary }]}>
            • <Text style={{ color: c.text, fontWeight: '600' }}>Account Info:</Text> When you sign in via email or phone, we store your contact identifier to authenticate you and sync your groups across devices.{'\n'}
            • <Text style={{ color: c.text, fontWeight: '600' }}>Payment Handles:</Text> We store your public payment handle (such as your UPI ID or PayPal username) solely so your group members can initiate 1-tap peer payments.{'\n'}
            • <Text style={{ color: c.text, fontWeight: '600' }}>Group & Expense Data:</Text> Group titles, amounts, and expense names to calculate balances and simplified settlements.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>2. We Never Access Banking Credentials</Text>
          <Text style={[styles.sectionBody, { color: c.textSecondary }]}>
            Fairpay is <Text style={{ color: c.text, fontWeight: '600' }}>NOT a banking institution</Text> and does not process money directly. All settlements open your native banking apps (Google Pay, PhonePe, Paytm, or PayPal) via official deep links. We never see, ask for, or store your UPI PIN, banking passwords, or card numbers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>3. Offline-First & Local Storage</Text>
          <Text style={[styles.sectionBody, { color: c.textSecondary }]}>
            All your group expenses are stored locally on your device using encrypted async storage. If you choose not to create an account, your data never leaves your device.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>4. Cloud Sync & Collaboration</Text>
          <Text style={[styles.sectionBody, { color: c.textSecondary }]}>
            When you create an account, groups are securely synced via our encrypted Supabase backend. Only users who possess the 6-character group invite code or QR code can view or add expenses to that group.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>5. Data Deletion</Text>
          <Text style={[styles.sectionBody, { color: c.textSecondary }]}>
            You can delete groups, expenses, or your profile data at any time directly from the app settings. Once deleted, your data is permanently removed.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>6. Contact Us</Text>
          <Text style={[styles.sectionBody, { color: c.textSecondary }]}>
            If you have questions about our privacy practices, contact us at <Text style={{ color: c.accent, fontWeight: '600' }}>privacy@fairpay.local</Text>.
          </Text>
        </View>
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
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: space.md,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  title: { ...type.largeTitle, fontSize: 28, marginBottom: space.sm },
  lead: { ...type.body, fontSize: 16, lineHeight: 24, marginBottom: space.xl },
  section: { marginBottom: space.xl },
  sectionTitle: { ...type.headline, fontSize: 18, marginBottom: space.sm },
  sectionBody: { ...type.body, fontSize: 15, lineHeight: 22 },
});
