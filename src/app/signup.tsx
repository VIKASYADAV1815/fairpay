import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FairpayLogo } from '@/components/FairpayLogo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useColors, useThemeStore } from '@/store/theme';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { COUNTRY_CODES, type CountryCode } from '@/lib/countryCodes';
import { space, type, radius } from '@/theme/tokens';

type AuthMethod = 'email' | 'phone';
type EmailMode = 'login' | 'signup';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);

  const [method, setMethod] = useState<AuthMethod>('email');
  const [emailMode, setEmailMode] = useState<EmailMode>('signup');
  const [loading, setLoading] = useState(false);

  // Email form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone form state
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  const handleEmailAuth = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters.');
      return;
    }

    if (emailMode === 'signup' && !name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }

    if (!isSupabaseConfigured()) {
      // Demo fallback: require 6-digit OTP verification on verify screen
      router.push({
        pathname: '/(auth)/verify',
        params: {
          email: cleanEmail,
          type: emailMode,
          isDemo: '1',
          name: name.trim() || cleanEmail.split('@')[0],
        },
      });
      return;
    }

    try {
      setLoading(true);

      if (emailMode === 'signup') {
        const userName = name.trim();

        // Step 1: Create the account (with "Confirm email" disabled in Supabase dashboard,
        // this won't send any email — we send our own branded OTP below)
        const { error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { name: userName },
            // Suppress the default confirmation email — we send our own OTP
            emailRedirectTo: undefined,
          },
        });

        if (signUpError) throw signUpError;

        // Step 2: Sign out the auto-session so user must verify via OTP
        await supabase.auth.signOut();

        // Step 3: Send a single branded 6-digit OTP via our custom SMTP (Resend/Fairpay)
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: false },
        });

        if (otpError) {
          console.warn('OTP send error:', otpError.message);
          // Still navigate to verify screen — user can resend from there
        }

        router.push({
          pathname: '/(auth)/verify',
          params: {
            email: cleanEmail,
            type: 'signup',
            name: userName,
          },
        });
      } else {
        // Sign In
        const { data: pwdData, error: pwdError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (pwdError) throw pwdError;

        // Ensure session is cleared prior to OTP verification
        await supabase.auth.signOut();

        try {
          await supabase.auth.signInWithOtp({
            email: cleanEmail,
            options: { shouldCreateUser: false },
          });
        } catch (otpSendErr) {
          console.warn('signInWithOtp error:', otpSendErr);
        }

        const userName = pwdData.user?.user_metadata?.name || cleanEmail.split('@')[0];
        router.push({
          pathname: '/(auth)/verify',
          params: {
            email: cleanEmail,
            type: 'email',
            name: userName,
          },
        });
      }
    } catch (err: any) {
      console.warn('Email auth error:', err);
      const msg = err.message || 'Authentication failed. Please check your credentials.';
      Alert.alert(emailMode === 'signup' ? 'Sign Up Failed' : 'Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    const cleaned = phone.replace(/[\s-]/g, '');
    if (!cleaned || cleaned.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullPhone = `${selectedCountry.dialCode}${cleaned}`;
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        router.push({
          pathname: '/(auth)/verify',
          params: { phone: fullPhone, isDemo: '1' },
        });
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) {
        const isUnsupported =
          error.message?.includes('Unsupported phone provider') ||
          error.message?.includes('provider') ||
          error.message?.includes('gateway');

        if (isUnsupported) {
          Alert.alert(
            'SMS Test Mode',
            'Supabase SMS gateway is in test mode. Use code 123456 on the next screen to verify.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  router.push({
                    pathname: '/(auth)/verify',
                    params: { phone: fullPhone, isDemo: '1' },
                  });
                },
              },
            ],
          );
          return;
        }

        throw error;
      }

      router.push({
        pathname: '/(auth)/verify',
        params: { phone: fullPhone },
      });
    } catch (err: any) {
      console.warn('Phone OTP error:', err);
      Alert.alert(
        'Phone Verification',
        'Could not send SMS. Would you like to continue in Test Mode with code 123456?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Use Test Code',
            onPress: () => {
              router.push({
                pathname: '/(auth)/verify',
                params: { phone: fullPhone, isDemo: '1' },
              });
            },
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/');
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
            paddingTop: insets.top + space.lg,
            paddingBottom: insets.bottom + space.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header */}
        <View style={styles.topRow}>
          <Pressable onPress={handleSkip} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={c.textSecondary} />
          </Pressable>
          <FairpayLogo width={130} />
          <View style={{ width: 36 }} />
        </View>

        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>
            {method === 'email'
              ? emailMode === 'signup'
                ? 'Create account'
                : 'Welcome back'
              : 'Sign up with Phone'}
          </Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Zero-friction shared money for any group
          </Text>
        </View>

        {/* Method Switcher Tabs: Email vs Phone */}
        <View style={[styles.tabsWrap, { backgroundColor: darkMode ? '#2C2C2E' : '#F2F2F7' }]}>
          <Pressable
            style={[
              styles.tab,
              method === 'email' && [styles.activeTab, { backgroundColor: c.card }],
            ]}
            onPress={() => setMethod('email')}
          >
            <Ionicons
              name="mail-outline"
              size={18}
              color={method === 'email' ? c.text : c.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: method === 'email' ? c.text : c.textSecondary },
              ]}
            >
              Email
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              method === 'phone' && [styles.activeTab, { backgroundColor: c.card }],
            ]}
            onPress={() => setMethod('phone')}
          >
            <Ionicons
              name="call-outline"
              size={18}
              color={method === 'phone' ? c.text : c.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: method === 'phone' ? c.text : c.textSecondary },
              ]}
            >
              Phone
            </Text>
          </Pressable>
        </View>

        {/* Form Body */}
        {method === 'email' ? (
          <View style={styles.form}>
            {emailMode === 'signup' && (
              <View style={styles.inputWrap}>
                <Text style={[styles.label, { color: c.textSecondary }]}>Full Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Vikas Sharma"
                  placeholderTextColor={c.textTertiary}
                  autoCapitalize="words"
                  style={[
                    styles.input,
                    {
                      backgroundColor: c.fill,
                      color: c.text,
                      borderColor: c.separator,
                    },
                  ]}
                />
              </View>
            )}

            <View style={styles.inputWrap}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={c.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                style={[
                  styles.input,
                  {
                    backgroundColor: c.fill,
                    color: c.text,
                    borderColor: c.separator,
                  },
                ]}
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Password</Text>
              <View
                style={[
                  styles.passwordRow,
                  {
                    backgroundColor: c.fill,
                    borderColor: c.separator,
                  },
                ]}
              >
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={c.textTertiary}
                  secureTextEntry={!showPassword}
                  style={[styles.passwordInput, { color: c.text }]}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={8}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={c.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            <View style={{ marginTop: space.md }}>
              <PrimaryButton
                label={loading ? 'Processing...' : emailMode === 'signup' ? 'Create Account' : 'Sign In'}
                variant="accent"
                disabled={loading}
                onPress={handleEmailAuth}
              />
            </View>

            {/* Toggle Login / Signup */}
            <Pressable
              onPress={() => setEmailMode((m) => (m === 'signup' ? 'login' : 'signup'))}
              style={styles.modeToggle}
            >
              <Text style={[styles.modeToggleText, { color: c.textSecondary }]}>
                {emailMode === 'signup' ? (
                  <>Already have an account? <Text style={{ color: c.text, fontWeight: '700' }}>Log in</Text></>
                ) : (
                  <>Don't have an account? <Text style={{ color: c.text, fontWeight: '700' }}>Sign up</Text></>
                )}
              </Text>
            </Pressable>
          </View>
        ) : (
          /* Phone Form */
          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Mobile Number</Text>
              <View
                style={[
                  styles.phoneRow,
                  {
                    backgroundColor: c.fill,
                    borderColor: c.separator,
                  },
                ]}
              >
                <Pressable
                  onPress={() => setCountryPickerVisible(true)}
                  style={styles.countryCodeBadge}
                >
                  <Text style={[styles.countryCodeText, { color: c.text }]}>
                    {selectedCountry.flag} {selectedCountry.dialCode}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={c.textSecondary} style={{ marginLeft: 4 }} />
                </Pressable>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="98765 43210"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="phone-pad"
                  maxLength={15}
                  style={[styles.phoneInput, { color: c.text }]}
                  autoFocus
                />
              </View>
            </View>

            <Text style={[styles.hint, { color: c.textTertiary }]}>
              We will send a 6-digit verification code to this number.
            </Text>

            <View style={{ marginTop: space.lg }}>
              <PrimaryButton
                label={loading ? 'Sending code...' : 'Send OTP'}
                variant="accent"
                disabled={loading || phone.trim().length < 8}
                onPress={handlePhoneAuth}
              />
            </View>
          </View>
        )}

        {/* Skip Button */}
        <Pressable onPress={handleSkip} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: c.textSecondary }]}>
            Skip for now · Explore as guest
          </Text>
        </Pressable>

        {/* Footer Terms */}
        <View style={styles.footer}>
          <Text style={[styles.terms, { color: c.textTertiary }]}>
            By continuing, you agree to our{' '}
            <Text
              onPress={() => router.push('/privacy')}
              style={{ color: c.text, textDecorationLine: 'underline', fontWeight: '600' }}
            >
              Terms & Privacy Policy
            </Text>
          </Text>
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: space.xl,
  },
  title: {
    ...type.title1,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    ...type.subheadline,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabsWrap: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 4,
    marginBottom: space.xl,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    ...type.subheadline,
    fontWeight: '700',
  },
  form: {
    gap: space.md,
  },
  inputWrap: {
    gap: 6,
  },
  label: {
    ...type.caption1,
    fontWeight: '600',
    marginLeft: 2,
  },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.md,
    fontSize: 16,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.md,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  eyeBtn: {
    padding: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.sm,
  },
  countryCodeBadge: {
    paddingHorizontal: space.sm,
    paddingVertical: 6,
  },
  countryCodeText: {
    ...type.subheadline,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    fontSize: 17,
    paddingLeft: space.xs,
  },
  hint: {
    ...type.caption1,
    lineHeight: 16,
    marginLeft: 2,
  },
  modeToggle: {
    alignItems: 'center',
    paddingVertical: space.md,
  },
  modeToggleText: {
    ...type.footnote,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: space.lg,
    marginTop: space.sm,
  },
  skipText: {
    ...type.subheadline,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: space.xl,
    alignItems: 'center',
  },
  terms: {
    ...type.caption2,
    textAlign: 'center',
    lineHeight: 18,
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
  modalTitle: { ...type.headline, fontSize: 18 },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  countryItemFlag: { fontSize: 22, marginRight: 12 },
  countryItemName: { flex: 1, ...type.body, fontWeight: '500' },
  countryItemDial: { ...type.subheadline, fontWeight: '600' },
});
