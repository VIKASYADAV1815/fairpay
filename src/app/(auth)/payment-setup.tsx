import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { PrimaryButton } from '@/components/PrimaryButton';
import { PaymentBrandLogo } from '@/components/PaymentBrandLogo';
import { useColors, useThemeStore } from '@/store/theme';
import { useAuthStore } from '@/store/auth';
import type { PaymentMethod, PayRail } from '@/lib/payments';

type PaymentOption = {
  rail: PayRail;
  brand: string;
  label: string;
  placeholder: string;
  hint: string;
};

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    rail: 'upi',
    brand: 'upi',
    label: 'UPI (Any App / BHIM)',
    placeholder: 'name@okhdfcbank or 9876543210@upi',
    hint: 'Works with all Indian UPI apps',
  },
  {
    rail: 'phonepe',
    brand: 'phonepe',
    label: 'PhonePe',
    placeholder: '9876543210@ybl',
    hint: 'Your PhonePe UPI ID',
  },
  {
    rail: 'gpay',
    brand: 'gpay',
    label: 'Google Pay',
    placeholder: 'name@okhdfcbank or name@okaxis',
    hint: 'Your GPay UPI ID',
  },
  {
    rail: 'paytm',
    brand: 'paytm',
    label: 'Paytm UPI',
    placeholder: '9876543210@paytm',
    hint: 'Your Paytm payment handle',
  },
  {
    rail: 'paypal',
    brand: 'paypal',
    label: 'PayPal (Global)',
    placeholder: 'paypal.me/yourname or email',
    hint: 'For international friends & trips',
  },
];

export default function PaymentSetupScreen() {
  const colors = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [loading, setLoading] = useState(false);
  const [activeRail, setActiveRail] = useState<PayRail>('upi');
  const [handles, setHandles] = useState<Record<string, string>>({
    upi: '',
    phonepe: '',
    gpay: '',
    paytm: '',
    paypal: '',
  });

  const handleTextChange = (rail: string, value: string) => {
    setHandles((prev) => ({ ...prev, [rail]: value }));
  };

  const handleSkip = () => {
    router.replace('/');
  };

  const handleSave = async () => {
    const paymentMethods: PaymentMethod[] = Object.entries(handles)
      .filter(([_, handle]) => handle.trim().length > 0)
      .map(([rail, handle]) => ({
        rail: rail as PayRail,
        handle: handle.trim(),
      }));

    if (paymentMethods.length === 0) {
      Alert.alert(
        'No Payment Handle Entered',
        'Add at least one payment handle so your friends can pay you with 1 tap, or skip for now.',
        [
          { text: 'Skip', onPress: handleSkip },
          { text: 'Add Now', style: 'cancel' },
        ]
      );
      return;
    }

    setLoading(true);

    try {
      const primaryUpi =
        paymentMethods.find((p) => ['upi', 'phonepe', 'gpay', 'paytm'].includes(p.rail))?.handle ||
        paymentMethods[0]?.handle ||
        '';

      // Update in Supabase if logged in with UUID
      if (user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) {
        try {
          await supabase
            .from('users')
            .update({
              payment_methods: paymentMethods,
            })
            .eq('id', user.id);
        } catch {
          // ignore
        }
      }

      // Update local store
      updateProfile({ paymentMethods, upiId: primaryUpi });

      // Navigate to home
      router.replace('/');
    } catch (error: any) {
      console.warn('Payment setup warning:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const currentOption = PAYMENT_OPTIONS.find((o) => o.rail === activeRail) || PAYMENT_OPTIONS[0];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="auto" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.badgePill, { backgroundColor: '#0A0A0A' }]}>
            <Text style={[styles.badgeText, { color: colors.accent }]}>Step 2 of 2 · 1-Tap Payments</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            How will friends pay you?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choose your preferred payment app. When someone settles up with you, Fairpay opens this app with the exact amount.
          </Text>
        </View>

        {/* Brand Option Tabs */}
        <View style={styles.brandSelector}>
          {PAYMENT_OPTIONS.map((opt) => {
            const isSelected = activeRail === opt.rail;
            const hasValue = !!handles[opt.rail]?.trim();
            return (
              <Pressable
                key={opt.rail}
                onPress={() => setActiveRail(opt.rail)}
                style={[
                  styles.brandPill,
                  {
                    backgroundColor: isSelected
                      ? darkMode
                        ? '#1E293B'
                        : '#F0FDF4'
                      : colors.card,
                    borderColor: isSelected ? colors.accent : colors.separator,
                  },
                ]}
              >
                <PaymentBrandLogo brand={opt.brand} size={24} />
                <Text
                  style={[
                    styles.brandPillText,
                    {
                      color: isSelected ? colors.text : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {opt.label.split(' ')[0]}
                </Text>
                {hasValue && (
                  <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Input Card for Active Option */}
        <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.separator }]}>
          <View style={styles.inputCardHeader}>
            <PaymentBrandLogo brand={currentOption.brand} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>{currentOption.label}</Text>
              <Text style={[styles.optionHint, { color: colors.textSecondary }]}>{currentOption.hint}</Text>
            </View>
          </View>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                color: colors.text,
                borderColor: handles[currentOption.rail] ? colors.accent : colors.separator,
              },
            ]}
            placeholder={currentOption.placeholder}
            placeholderTextColor={colors.textTertiary}
            value={handles[currentOption.rail]}
            onChangeText={(v) => handleTextChange(currentOption.rail, v)}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Information Callout */}
        <View style={[styles.securityNote, { backgroundColor: '#0A0A0A', borderColor: '#333333' }]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.accent} />
          <Text style={[styles.securityText, { color: '#E2E8F0' }]}>
            <Text style={{ fontWeight: '700', color: colors.accent }}>100% Safe:</Text> Fairpay only stores your public handle. We never ask for or store your UPI PIN, banking passwords, or card numbers.
          </Text>
        </View>

        <PrimaryButton
          label={loading ? 'Saving...' : 'Save & Continue'}
          onPress={handleSave}
          disabled={loading}
          variant="accent"
          style={styles.button}
        />

        <TouchableOpacity onPress={handleSkip} disabled={loading} style={styles.skipWrap}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip for now · Add later in Profile
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  brandSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  brandPillText: {
    fontSize: 13,
  },
  inputCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  inputCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionHint: {
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  securityNote: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 28,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    marginBottom: 16,
  },
  skipWrap: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
