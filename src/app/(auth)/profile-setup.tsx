import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemeStore } from '@/store/theme';
import { useAuthStore } from '@/store/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { FairpayLogo } from '@/components/FairpayLogo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { PaymentBrandLogo, type BrandType } from '@/components/PaymentBrandLogo';
import { COUNTRY_CODES, type CountryCode } from '@/lib/countryCodes';
import { CURRENCIES, type CurrencyCode } from '@/lib/currency';
import { space } from '@/theme/tokens';

const PAYMENT_RAILS: { rail: 'upi' | 'phonepe' | 'gpay' | 'paytm'; label: string; placeholder: string; brand: BrandType }[] = [
  { rail: 'upi', label: 'Any UPI', placeholder: 'yourname@okhdfcbank or 9876543210@upi', brand: 'upi' },
  { rail: 'phonepe', label: 'PhonePe', placeholder: '9876543210@ybl', brand: 'phonepe' },
  { rail: 'gpay', label: 'Google Pay', placeholder: 'name@okaxis or name@oksbi', brand: 'gpay' },
  { rail: 'paytm', label: 'Paytm UPI', placeholder: '9876543210@paytm', brand: 'paytm' },
];

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const { session, user, upiId: existingUpi, name: existingName, phone: existingPhone, email: existingEmail, preferredCurrency } = useAuthStore();

  const authenticatedEmail = session?.user?.email || user?.email || existingEmail || '';
  const authenticatedPhone = session?.user?.phone || user?.phone || existingPhone || '';

  const isEmailAuth = Boolean(authenticatedEmail);

  // Form State
  const [name, setName] = useState(existingName || session?.user?.user_metadata?.name || '');
  const [complementaryPhone, setComplementaryPhone] = useState(existingPhone.replace(/^\+91/, '').trim());
  const [complementaryEmail, setComplementaryEmail] = useState(authenticatedEmail || '');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  // Settlement Rail State
  const [selectedRail, setSelectedRail] = useState<'upi' | 'phonepe' | 'gpay' | 'paytm'>('upi');
  const [handle, setHandle] = useState(existingUpi || '');
  const [currency, setCurrency] = useState<CurrencyCode>(preferredCurrency || 'INR');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      const meta = session.user.user_metadata;
      if (!name) {
        setName(meta?.full_name || meta?.name || meta?.preferred_username || '');
      }
    }
  }, [session, name]);

  // ── Pre-flight Collision Check & Submission ─────────────────────────
  const handleContinue = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      Alert.alert('Name Required', 'Please enter your full name to continue.');
      return;
    }

    const currentUserId = session?.user?.id || user?.id;

    // Contact resolution
    const finalEmail = (isEmailAuth ? authenticatedEmail : complementaryEmail.trim().toLowerCase()) || null;
    const rawPhoneDigits = complementaryPhone.replace(/\D/g, '');
    const finalPhone = (isEmailAuth && rawPhoneDigits.length >= 10
      ? `${selectedCountry.dialCode}${rawPhoneDigits}`
      : authenticatedPhone) || null;

    if (!isEmailAuth && complementaryEmail.trim() && !complementaryEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      // ── Collision Check in Supabase ─────────────────────────────────
      if (isSupabaseConfigured() && currentUserId) {
        // 1. If user supplied a phone number, ensure it isn't claimed by another account
        if (finalPhone) {
          const { data: phoneConflict } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('phone_number', finalPhone)
            .neq('id', currentUserId)
            .maybeSingle();

          if (phoneConflict) {
            setLoading(false);
            Alert.alert(
              'Account Already Exists',
              `The phone number ${finalPhone} is already linked to an existing account (${phoneConflict.email || phoneConflict.name || 'Fairpay User'}).\n\nPlease log in using that account to prevent fragmented trips and balances.`,
              [
                { text: 'Edit Number', style: 'cancel' },
                {
                  text: 'Log In',
                  onPress: () => router.replace('/login'),
                },
              ],
            );
            return;
          }
        }

        // 2. If user supplied an email, ensure it isn't claimed by another account
        if (finalEmail) {
          const { data: emailConflict } = await supabase
            .from('users')
            .select('id, name, phone_number')
            .eq('email', finalEmail)
            .neq('id', currentUserId)
            .maybeSingle();

          if (emailConflict) {
            setLoading(false);
            Alert.alert(
              'Account Already Exists',
              `The email address ${finalEmail} is already linked to an existing Fairpay account.\n\nPlease log in with your email to access all your trips and balances.`,
              [
                { text: 'Edit Email', style: 'cancel' },
                {
                  text: 'Log In',
                  onPress: () => router.replace('/login'),
                },
              ],
            );
            return;
          }
        }

        // 3. Upsert into public.users with payment methods
        const payMethods = handle.trim()
          ? [{ rail: selectedRail, handle: handle.trim() }]
          : [];

        const { error: upsertErr } = await supabase.from('users').upsert({
          id: currentUserId,
          name: cleanName,
          email: finalEmail,
          phone_number: finalPhone,
          payment_methods: payMethods,
          updated_at: new Date().toISOString(),
        });

        if (upsertErr) {
          console.warn('Profile upsert warning:', upsertErr.message);
        }
      }

      // Update local Zustand store
      const payMethods = handle.trim()
        ? [{ rail: selectedRail, handle: handle.trim() }]
        : [];

      useAuthStore.getState().updateProfile({
        name: cleanName,
        email: finalEmail || '',
        phone: finalPhone || '',
        upiId: handle.trim(),
        paymentMethods: payMethods,
        preferredCurrency: currency,
      });

      if (user) {
        useAuthStore.getState().setUser({
          ...user,
          name: cleanName,
          email: finalEmail || user.email,
          phone: finalPhone || user.phone,
          paymentMethods: payMethods,
        });
      }

      // Proceed to Step 2: Onboarding Questions & Starter Group
      router.push('/(auth)/onboarding-questions');
    } catch (err: any) {
      console.warn('Profile setup exception:', err);
      // Still allow progression if network glitch
      router.push('/(auth)/onboarding-questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/onboarding-questions');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + space.md,
            paddingBottom: insets.bottom + space.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header */}
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={c.textSecondary} />
          </Pressable>
          <FairpayLogo width={105} />
          <Pressable onPress={handleSkip} hitSlop={12} style={styles.skipBtn}>
            <Text style={[styles.skipTxt, { color: c.textTertiary }]}>Skip</Text>
          </Pressable>
        </View>

        {/* Title Block with Apple SF Pro Light display typography */}
        <View style={styles.titleBlock}>
          <View style={[styles.stepPill, { backgroundColor: darkMode ? '#1C1C1E' : '#F2F2F7' }]}>
            <Text style={[styles.stepTxt, { color: c.textSecondary }]}>Step 1 of 2 · Profile & Settlements</Text>
          </View>
          <Text style={[styles.heading, { color: c.text }]}>Complete your profile</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Fairpay needs your settlement handle and contacts so friends can settle debts directly with 0 fees.
          </Text>
        </View>

        {/* Section 1: Personal Identity */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>PERSONAL IDENTITY</Text>

          {/* Full Name */}
          <View style={styles.inputWrap}>
            <Text style={[styles.fieldLabel, { color: c.text }]}>Full Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Vikas Sharma"
              placeholderTextColor={c.textTertiary}
              autoCapitalize="words"
              style={[
                styles.textInput,
                { backgroundColor: darkMode ? '#1C1C1E' : '#F5F5F7', color: c.text },
              ]}
            />
          </View>

          {/* Verified & Complementary Contact */}
          {isEmailAuth ? (
            <>
              {/* Verified Email Banner */}
              <View style={[styles.verifiedCard, { backgroundColor: darkMode ? '#1C1C1E' : '#F5F5F7' }]}>
                <Ionicons name="checkmark-circle" size={18} color={c.accent} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.verifiedTitle, { color: c.text }]}>Verified Email</Text>
                  <Text style={[styles.verifiedSub, { color: c.textSecondary }]}>{authenticatedEmail}</Text>
                </View>
              </View>

              {/* Complementary Phone Input */}
              <View style={styles.inputWrap}>
                <Text style={[styles.fieldLabel, { color: c.text }]}>
                  Mobile Number <Text style={{ color: c.textTertiary, fontWeight: '400' }}>(recommended)</Text>
                </Text>
                <View style={[styles.phoneRow, { backgroundColor: darkMode ? '#1C1C1E' : '#F5F5F7' }]}>
                  <Pressable
                    onPress={() => setCountryPickerVisible(true)}
                    style={styles.flagBtn}
                  >
                    <Text style={{ fontSize: 16 }}>{selectedCountry.flag}</Text>
                    <Text style={[styles.dialTxt, { color: c.text }]}>{selectedCountry.dialCode}</Text>
                    <Ionicons name="chevron-down" size={12} color={c.textTertiary} style={{ marginLeft: 2 }} />
                  </Pressable>
                  <TextInput
                    value={complementaryPhone}
                    onChangeText={setComplementaryPhone}
                    placeholder="98765 43210"
                    placeholderTextColor={c.textTertiary}
                    keyboardType="phone-pad"
                    maxLength={14}
                    style={[styles.phoneInput, { color: c.text }]}
                  />
                </View>
                <Text style={[styles.fieldHint, { color: c.textTertiary }]}>
                  Used for WhatsApp payment reminders and 1-tap UPI requests.
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* Verified Phone Banner */}
              <View style={[styles.verifiedCard, { backgroundColor: darkMode ? '#1C1C1E' : '#F5F5F7' }]}>
                <Ionicons name="checkmark-circle" size={18} color={c.accent} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.verifiedTitle, { color: c.text }]}>Verified Mobile</Text>
                  <Text style={[styles.verifiedSub, { color: c.textSecondary }]}>{authenticatedPhone}</Text>
                </View>
              </View>

              {/* Complementary Email Input */}
              <View style={styles.inputWrap}>
                <Text style={[styles.fieldLabel, { color: c.text }]}>
                  Email Address <Text style={{ color: c.textTertiary, fontWeight: '400' }}>(for statements)</Text>
                </Text>
                <TextInput
                  value={complementaryEmail}
                  onChangeText={setComplementaryEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={c.textTertiary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[
                    styles.textInput,
                    { backgroundColor: darkMode ? '#1C1C1E' : '#F5F5F7', color: c.text },
                  ]}
                />
                <Text style={[styles.fieldHint, { color: c.textTertiary }]}>
                  Used for 2-page PDF statements, balance receipts, and backup sign-in.
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Section 2: Settlement Rail (UPI / Instant Pay) */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>SETTLEMENT RAILS</Text>
          <Text style={[styles.fieldLabel, { color: c.text }]}>Primary Payment Handle</Text>
          <Text style={[styles.fieldHint, { color: c.textSecondary, marginBottom: 12 }]}>
            When group members pay you back, funds deposit directly into this account.
          </Text>

          {/* Payment Brand Selector */}
          <View style={styles.brandRow}>
            {PAYMENT_RAILS.map((p) => {
              const active = selectedRail === p.rail;
              return (
                <Pressable
                  key={p.rail}
                  onPress={() => setSelectedRail(p.rail)}
                  style={[
                    styles.brandPill,
                    {
                      backgroundColor: active
                        ? (darkMode ? '#2C2C2E' : '#E5E5EA')
                        : (darkMode ? '#1C1C1E' : '#F5F5F7'),
                      borderColor: active ? c.accent : 'transparent',
                    },
                  ]}
                >
                  <PaymentBrandLogo brand={p.brand} size={20} />
                  <Text style={[styles.brandLabel, { color: active ? c.text : c.textSecondary }]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* UPI ID / Handle Input */}
          <View style={styles.inputWrap}>
            <TextInput
              value={handle}
              onChangeText={setHandle}
              placeholder={PAYMENT_RAILS.find((r) => r.rail === selectedRail)?.placeholder || 'name@upi'}
              placeholderTextColor={c.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.textInput,
                { backgroundColor: darkMode ? '#1C1C1E' : '#F5F5F7', color: c.text },
              ]}
            />
          </View>
        </View>

        {/* Section 3: Currency */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>DEFAULT CURRENCY</Text>
          <View style={styles.currencyRow}>
            {CURRENCIES.slice(0, 4).map((cur) => {
              const active = currency === cur.code;
              return (
                <Pressable
                  key={cur.code}
                  onPress={() => setCurrency(cur.code)}
                  style={[
                    styles.currencyPill,
                    {
                      backgroundColor: active
                        ? (darkMode ? '#2C2C2E' : '#E5E5EA')
                        : (darkMode ? '#1C1C1E' : '#F5F5F7'),
                      borderColor: active ? c.accent : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.currencySymbol, { color: active ? c.text : c.textSecondary }]}>
                    {cur.symbol}
                  </Text>
                  <Text style={[styles.currencyCode, { color: active ? c.text : c.textTertiary }]}>
                    {cur.code}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Submit Button */}
        <View style={{ marginTop: 24 }}>
          <PrimaryButton
            label={loading ? 'Saving…' : 'Continue to group setup →'}
            onPress={handleContinue}
            disabled={loading || !name.trim()}
            variant="accent"
          />
        </View>
      </ScrollView>

      {/* Country Code Picker Modal */}
      <Modal
        visible={countryPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: c.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Select Country Code</Text>
              <Pressable onPress={() => setCountryPickerVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={c.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {COUNTRY_CODES.map((item) => (
                <Pressable
                  key={`${item.code}-${item.dialCode}`}
                  style={[
                    styles.countryItem,
                    { borderBottomColor: c.separator },
                    selectedCountry.dialCode === item.dialCode && {
                      backgroundColor: c.fillSecondary,
                    },
                  ]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setCountryPickerVisible(false);
                  }}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={[styles.countryItemName, { color: c.text }]}>{item.name}</Text>
                  <Text style={[styles.countryItemDial, { color: c.textSecondary }]}>
                    {item.dialCode}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    paddingHorizontal: space.xl,
    flexGrow: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipTxt: {
    fontSize: 13.5,
    fontWeight: '400',
  },
  titleBlock: {
    marginBottom: space.xl,
  },
  stepPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
    marginBottom: 10,
  },
  stepTxt: {
    fontSize: 11.5,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  heading: {
    fontSize: 27,
    fontWeight: '300', // Apple SF Pro Display Light
    letterSpacing: -0.7,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '400',
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  formSection: {
    marginBottom: space.xl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  inputWrap: {
    marginBottom: space.md,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    marginTop: 4,
    letterSpacing: -0.1,
  },
  textInput: {
    height: 50,
    borderRadius: 13,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '400',
  },
  verifiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 13,
    marginBottom: space.md,
  },
  verifiedTitle: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  verifiedSub: {
    fontSize: 13.5,
    fontWeight: '400',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 13,
    paddingHorizontal: 8,
  },
  flagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  dialTxt: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '400',
    paddingHorizontal: 8,
  },
  brandRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  brandLabel: {
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  currencyCode: {
    fontSize: 11,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: space.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  countryItemFlag: { fontSize: 22, marginRight: 12 },
  countryItemName: { flex: 1, fontSize: 15, fontWeight: '500' },
  countryItemDial: { fontSize: 14, fontWeight: '600' },
});
