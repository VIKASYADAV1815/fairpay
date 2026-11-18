import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/theme';
import { space, type } from '@/theme/tokens';

type FaqItem = {
  q: string;
  a: string;
};

const FAQS: FaqItem[] = [
  {
    q: 'How do I test Fairpay on a second phone?',
    a: 'Install "Expo Go" on your second device from the App Store or Google Play Store. Make sure both devices are on the same Wi-Fi (or run "npx expo start --tunnel"). Scan the terminal Metro QR code with your phone camera. Once both devices open Fairpay, create a group on Phone 1, tap "Share / QR", and scan it or enter the 6-character code on Phone 2 to collaborate in real-time!',
  },
  {
    q: 'How does 1-tap WhatsApp & UPI settlement work?',
    a: 'When you tap "Settle on WhatsApp", Fairpay generates a pre-filled WhatsApp message containing the exact debt breakdown and a direct UPI/payment link. When the receiver taps the link, their UPI app (PhonePe, Google Pay, Paytm, BHIM) opens with the exact amount pre-filled. No manual copy-pasting!',
  },
  {
    q: 'Is my UPI ID or PayPal handle safe?',
    a: 'Yes, 100%. A UPI ID (e.g. name@okhdfcbank) or PayPal username is a public receiving address, similar to an email address. Fairpay never asks for or stores your private UPI PIN, bank account password, or card numbers. Money moves strictly through your official bank apps.',
  },
  {
    q: 'What if my friends do not have Fairpay installed?',
    a: 'They do not need the app! You can share an instant breakdown and payment link directly to your WhatsApp group, or export a bank-grade PDF statement with all itemized expenses and simplified balances.',
  },
  {
    q: 'Can I use Fairpay without an internet connection?',
    a: 'Yes! Fairpay is built offline-first. You can create groups, log expenses, scan receipts, and compute balances with zero network. When you regain internet, your data syncs securely to the cloud.',
  },
  {
    q: 'What is the Group Pot & Cashback?',
    a: 'Fairpay Pro tracks group deals and partner travel cashback. Any earned savings flow directly into your shared group pot, reducing the final amount everyone needs to pay!',
  },
  {
    q: 'Why does Fairpay simplify debts?',
    a: 'If Person A owes Person B ₹100, and Person B owes Person C ₹100, Fairpay simplifies the math so Person A pays Person C ₹100 directly. This minimizes total transactions from 10+ down to just 2 or 3 payments.',
  },
];

export default function FaqScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>Help & FAQ</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: c.text }]}>Frequently Asked Questions</Text>
        <Text style={[styles.sub, { color: c.textSecondary }]}>
          Everything you need to know about Fairpay, group splits, and settlements.
        </Text>

        <View style={styles.faqList}>
          {FAQS.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <Pressable
                key={item.q}
                onPress={() => setExpandedIndex(isExpanded ? null : idx)}
                style={[
                  styles.faqCard,
                  {
                    backgroundColor: c.card,
                    borderColor: isExpanded ? c.accent : c.separator,
                  },
                ]}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQuestion, { color: c.text }]}>{item.q}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={c.textSecondary}
                  />
                </View>
                {isExpanded && (
                  <Text style={[styles.faqAnswer, { color: c.textSecondary }]}>
                    {item.a}
                  </Text>
                )}
              </Pressable>
            );
          })}
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
  title: { ...type.largeTitle, fontSize: 26, marginBottom: space.xs },
  sub: { ...type.body, fontSize: 15, lineHeight: 22, marginBottom: space.xl },
  faqList: { gap: space.md },
  faqCard: {
    padding: space.lg,
    borderRadius: 14,
    borderWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  faqQuestion: {
    ...type.headline,
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  faqAnswer: {
    ...type.body,
    fontSize: 14,
    lineHeight: 22,
    marginTop: space.md,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.15)',
  },
});
