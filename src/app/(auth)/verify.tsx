import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { PrimaryButton } from '@/components/PrimaryButton';
import { FairpayLogo } from '@/components/FairpayLogo';
import { useColors, useThemeStore } from '@/store/theme';
import { useAuthStore } from '@/store/auth';

const OTP_LENGTH = 8;

export default function VerifyOTPScreen() {
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const insets = useSafeAreaInsets();
  const { phone, email, type, isDemo, name } = useLocalSearchParams<{
    phone?: string;
    email?: string;
    type?: 'signup' | 'email' | 'sms';
    isDemo?: string;
    name?: string;
  }>();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<any[]>([]);

  const targetIdentifier = email || phone || '';
  const otpCode = otp.join('');
  const isComplete = otpCode.length === OTP_LENGTH;

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);

    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Auto-detect authentication if user clicked magic link / confirm email
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (currentSession?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        const u = currentSession.user;
        const resolvedName =
          name?.trim() ||
          u.user_metadata?.name ||
          u.user_metadata?.full_name ||
          (u.email ? u.email.split('@')[0] : 'User');

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', u.id)
          .maybeSingle();

        const isProfileComplete = Boolean(
          profile &&
          profile.name &&
          profile.payment_methods &&
          Array.isArray(profile.payment_methods) &&
          profile.payment_methods.length > 0
        );

        useAuthStore.getState().setUser({
          id: u.id,
          email: u.email || email || '',
          phone: u.phone || phone,
          name: resolvedName,
          paymentMethods: profile?.payment_methods || [],
        });
        useAuthStore.getState().setSession(currentSession);

        if (isProfileComplete && type !== 'signup') {
          useAuthStore.getState().setOnboardingDone(true);
          useAuthStore.getState().setShowWelcomeModal(false);
          router.replace('/');
        } else {
          useAuthStore.getState().setShowWelcomeModal(false);
          router.replace('/(auth)/profile-setup');
        }
      }
    });

    return () => {
      clearInterval(timer);
      authListener?.subscription?.unsubscribe();
    };
  }, [email, phone, name, type]);

  // ── OTP input change & autofill ─────────────────────────────────────
  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Multi-character input (e.g. system OTP autofill or paste)
      const cleaned = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
      const digits = cleaned.split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      inputRefs.current[Math.min(index + digits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Verification ───────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (!isComplete) {
      Alert.alert('Incomplete Code', `Please enter all ${OTP_LENGTH} digits.`);
      return;
    }

    setLoading(true);

    // Demo Mode Handler
    if (isDemo === '1') {
      const expectedDemoCode = '12345678';
      if (otpCode !== expectedDemoCode) {
        setLoading(false);
        Alert.alert('Incorrect Code', `In test mode, enter ${expectedDemoCode} to verify.`);
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        return;
      }

      const userEmail = email || `${phone?.replace(/\D/g, '') || 'user'}@fairpay.local`;
      const displayName = name?.trim() || (email ? email.split('@')[0] : 'User');

      useAuthStore.getState().setUser({
        id: `demo_${(email || phone || 'user').replace(/[^a-zA-Z0-9]/g, '')}`,
        email: userEmail,
        phone: phone || '',
        name: displayName,
      });
      useAuthStore.getState().updateProfile({ name: displayName, email: userEmail, phone: phone || '' });
      useAuthStore.getState().setShowWelcomeModal(false);
      setLoading(false);

      if (type !== 'signup') {
        useAuthStore.getState().setOnboardingDone(true);
        router.replace('/');
      } else {
        router.replace('/(auth)/profile-setup');
      }
      return;
    }

    // Real Supabase Auth
    try {
      let verifiedUser: any = null;
      let session: any = null;

      if (email) {
        const primaryType = type === 'signup' ? 'signup' : 'email';
        let res = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otpCode,
          type: primaryType as any,
        });

        if (res.error) {
          const altType = primaryType === 'signup' ? 'email' : 'signup';
          const altRes = await supabase.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token: otpCode,
            type: altType as any,
          });

          if (altRes.error) throw res.error;
          res = altRes;
        }

        verifiedUser = res.data.user;
        session = res.data.session;
      } else if (phone) {
        const res = await supabase.auth.verifyOtp({
          phone: phone.trim(),
          token: otpCode,
          type: 'sms',
        });
        if (res.error) throw res.error;
        verifiedUser = res.data.user;
        session = res.data.session;
      }

      if (verifiedUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', verifiedUser.id)
          .maybeSingle();

        const resolvedName =
          name?.trim() ||
          profile?.name ||
          verifiedUser.user_metadata?.name ||
          (email ? email.split('@')[0] : 'User');

        const isProfileComplete = Boolean(
          profile &&
          profile.name &&
          profile.payment_methods &&
          Array.isArray(profile.payment_methods) &&
          profile.payment_methods.length > 0
        );

        useAuthStore.getState().setUser({
          id: verifiedUser.id,
          email: verifiedUser.email || email || '',
          phone: verifiedUser.phone || phone,
          name: resolvedName,
          paymentMethods: profile?.payment_methods || [],
        });
        useAuthStore.getState().setSession(session);
        useAuthStore.getState().updateProfile({
          name: resolvedName,
          email: verifiedUser.email || email || '',
          phone: verifiedUser.phone || phone || '',
          paymentMethods: profile?.payment_methods || [],
        });

        if (isProfileComplete && type !== 'signup') {
          // Existing user login: bypass onboarding & do NOT show welcome modal
          useAuthStore.getState().setOnboardingDone(true);
          useAuthStore.getState().setShowWelcomeModal(false);
          router.replace('/');
        } else {
          // New registration or incomplete profile: guide to profile & settlements setup
          useAuthStore.getState().setShowWelcomeModal(false);
          router.replace('/(auth)/profile-setup');
        }
      }
    } catch (error: any) {
      console.warn('Verify error:', error?.message || error);
      const isNetwork =
        error?.message?.includes('hostname') ||
        error?.message?.includes('fetch failed') ||
        error?.message?.includes('Network request failed');

      if (isNetwork) {
        Alert.alert('Connection Error', 'Could not reach Supabase. Continue in offline demo mode?', [
          { text: 'Retry', style: 'cancel' },
          {
            text: 'Continue in Demo',
            onPress: () => {
              const displayName = name?.trim() || (email ? email.split('@')[0] : 'User');
              useAuthStore.getState().setUser({
                id: 'demo_user_local',
                email: email || 'user@fairpay.local',
                phone: phone || '',
                name: displayName,
              });
              useAuthStore.getState().setShowWelcomeModal(false);
              if (type !== 'signup') {
                useAuthStore.getState().setOnboardingDone(true);
                router.replace('/');
              } else {
                router.replace('/(auth)/profile-setup');
              }
            },
          },
        ]);
      } else {
        Alert.alert(
          'Verification Failed',
          error?.message || `Invalid ${OTP_LENGTH}-digit code. Check your email or tap "Resend code".`,
        );
      }
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Resend Code ────────────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setLoading(true);

    try {
      if (isDemo === '1') {
        Alert.alert('Demo Code', 'Your test verification code is 12345678');
        setResendTimer(60);
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        return;
      }

      if (email) {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
        });
        if (error) throw error;
      } else if (phone) {
        const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
        if (error) throw error;
      }

      setResendTimer(60);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      Alert.alert('Code Dispatched', `A fresh ${OTP_LENGTH}-digit code was sent to ${targetIdentifier}`);
    } catch (error: any) {
      Alert.alert('Resend Failed', error.message || 'Unable to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maskedTarget = email
    ? email.replace(/(.{2}).+(@.+)/, '$1•••$2')
    : phone
      ? phone.slice(0, -4).replace(/\d/g, '•') + phone.slice(-4)
      : targetIdentifier;

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />

      {/* Navigation Bar */}
      <View style={[styles.nav, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={14} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={c.textSecondary} />
        </Pressable>
        <FairpayLogo width={105} />
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        {/* Header Block with Apple SF Pro Thin Display Typography */}
        <View style={styles.titleBlock}>
          <Text style={[styles.heading, { color: c.text }]}>Enter verification code</Text>
          <Text style={[styles.hint, { color: c.textSecondary }]}>
            An 8-digit security code was dispatched to
          </Text>
          <Text style={[styles.target, { color: c.text }]}>{maskedTarget}</Text>
        </View>

        {/* 8-Digit OTP Input Boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => {
                inputRefs.current[i] = r;
              }}
              style={[
                styles.otpBox,
                {
                  backgroundColor: darkMode ? '#1C1C1E' : '#F5F5F7',
                  color: c.text,
                  borderColor: digit ? c.accent : 'transparent',
                },
              ]}
              value={digit}
              onChangeText={(v) => handleOtpChange(v, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              selectTextOnFocus
              textContentType="oneTimeCode"
              autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
            />
          ))}
        </View>

        {/* Demo Mode Badge */}
        {isDemo === '1' && (
          <View style={[styles.demoBadge, { backgroundColor: darkMode ? '#1C1C1E' : '#F2F2F7' }]}>
            <Text style={[styles.demoTxt, { color: c.textSecondary }]}>
              Test mode · enter{' '}
              <Text style={{ color: c.text, fontWeight: '500' }}>12345678</Text>
            </Text>
          </View>
        )}

        {/* Verify CTA */}
        <View style={{ marginTop: 32 }}>
          <PrimaryButton
            label={loading ? 'Verifying…' : 'Continue'}
            onPress={handleVerifyOTP}
            disabled={loading || !isComplete}
            variant="accent"
          />
        </View>

        {/* Resend Timer / Action */}
        <View style={styles.resendRow}>
          {resendTimer > 0 ? (
            <Text style={[styles.resendCool, { color: c.textTertiary }]}>
              Resend code in{' '}
              <Text style={{ color: c.textSecondary, fontVariant: ['tabular-nums'], fontWeight: '400' }}>
                {resendTimer}s
              </Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendOTP} disabled={loading} hitSlop={10}>
              <Text style={[styles.resendLink, { color: c.text }]}>Resend verification code</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Change Destination Link */}
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.changeRow}>
          <Text style={[styles.changeTxt, { color: c.textTertiary }]}>
            Wrong {email ? 'email address' : 'phone number'}?{' '}
            <Text style={{ color: c.textSecondary, fontWeight: '400' }}>Change</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
  },

  titleBlock: {
    marginBottom: 36,
  },
  heading: {
    fontSize: 27,
    fontWeight: '300', // Thin Apple SF Pro Display typography
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14.5,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  target: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
  },

  otpRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: 11,
    borderWidth: 1.5,
    fontSize: 19,
    fontWeight: '300', // Refined thin numeric typography
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  demoBadge: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  demoTxt: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: -0.1,
  },

  resendRow: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendCool: {
    fontSize: 13.5,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    textDecorationLine: 'underline',
  },

  changeRow: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 6,
  },
  changeTxt: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
});
