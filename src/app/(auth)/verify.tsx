import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useColors } from '@/store/theme';
import { useAuthStore } from '@/store/auth';

export default function VerifyOTPScreen() {
  const { colors } = { colors: useColors() };
  const { phone, email, type, isDemo, name } = useLocalSearchParams<{
    phone?: string;
    email?: string;
    type?: 'signup' | 'email' | 'sms';
    isDemo?: string;
    name?: string;
  }>();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<any[]>([]);

  const targetIdentifier = email || phone || '';

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);

      const lastIndex = Math.min(index + digits.length, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);

    // ── Test / Demo Mode Verification (Strict 123456 check) ──
    if (isDemo === '1') {
      if (otpCode !== '123456') {
        setLoading(false);
        Alert.alert(
          'Verification Failed',
          'Incorrect code. In test mode, enter 123456 to verify.',
        );
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      const cleanTarget = (email || phone || 'user').replace(/[^a-zA-Z0-9]/g, '');
      const userEmail = email || `${phone?.replace(/\D/g, '') || 'user'}@fairpay.local`;
      const displayName = name?.trim() || (email ? email.split('@')[0] : 'User');

      useAuthStore.getState().setUser({
        id: `demo_${cleanTarget}`,
        email: userEmail,
        phone: phone || '',
        name: displayName,
      });
      useAuthStore.getState().updateProfile({
        name: displayName,
        email: userEmail,
        phone: phone || '',
      });

      setLoading(false);
      if (!name && !email) {
        router.replace('/(auth)/name-setup');
      } else {
        router.replace('/');
      }
      return;
    }

    // ── Real Supabase Verification ──
    try {
      let verifiedUser: any = null;
      let session: any = null;

      if (email) {
        // First try the passed type, then fallback to alternate type
        const primaryType = type === 'signup' ? 'signup' : 'email';
        let verifyResponse = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otpCode,
          type: primaryType as any,
        });

        if (verifyResponse.error) {
          const alternateType = primaryType === 'signup' ? 'email' : 'signup';
          const altResponse = await supabase.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token: otpCode,
            type: alternateType as any,
          });

          if (altResponse.error) {
            throw verifyResponse.error;
          }
          verifyResponse = altResponse;
        }

        verifiedUser = verifyResponse.data.user;
        session = verifyResponse.data.session;
      } else if (phone) {
        const verifyResponse = await supabase.auth.verifyOtp({
          phone: phone.trim(),
          token: otpCode,
          type: 'sms',
        });

        if (verifyResponse.error) throw verifyResponse.error;

        verifiedUser = verifyResponse.data.user;
        session = verifyResponse.data.session;
      }

      if (verifiedUser) {
        // Fetch or sync public.users profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', verifiedUser.id)
          .single();

        const resolvedName =
          name?.trim() ||
          profile?.name ||
          verifiedUser.user_metadata?.name ||
          (email ? email.split('@')[0] : 'User');

        try {
          await supabase.from('users').upsert({
            id: verifiedUser.id,
            email: verifiedUser.email || email || '',
            phone_number: verifiedUser.phone || phone || '',
            name: resolvedName,
            updated_at: new Date().toISOString(),
          });
        } catch {
          // ignore upsert errors if public table is not fully writable
        }

        useAuthStore.getState().setUser({
          id: verifiedUser.id,
          email: verifiedUser.email || email || '',
          phone: verifiedUser.phone || phone,
          name: resolvedName,
        });
        useAuthStore.getState().setSession(session);
        useAuthStore.getState().updateProfile({
          name: resolvedName,
          email: verifiedUser.email || email || '',
          phone: verifiedUser.phone || phone || '',
        });

        if (!profile && !name) {
          router.replace('/(auth)/name-setup');
        } else {
          router.replace('/');
        }
      }
    } catch (error: any) {
      console.warn('Verify error:', error?.message || error);
      const isNetworkIssue =
        error?.message?.includes('hostname') ||
        error?.message?.includes('fetch failed') ||
        error?.message?.includes('Network request failed');

      if (isNetworkIssue) {
        Alert.alert(
          'Database Offline',
          'Could not reach database to verify code. Continue in Demo Mode?',
          [
            { text: 'Retry', style: 'cancel' },
            {
              text: 'Continue in Demo',
              onPress: () => {
                const displayName = name?.trim() || (email ? email.split('@')[0] : 'User');
                useAuthStore.getState().setUser({
                  id: 'demo_user_local',
                  email: email || `${phone?.replace(/\D/g, '') || 'user'}@fairpay.local`,
                  phone: phone || '',
                  name: displayName,
                });
                router.replace('/');
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'Verification Failed',
          error?.message || 'Invalid 6-digit code. Please check and try again.',
        );
      }

      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setLoading(true);

    try {
      if (isDemo === '1') {
        Alert.alert('Demo Code', 'Your test verification code is 123456');
        setResendTimer(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      if (email) {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
        });
        if (error) throw error;
        Alert.alert('Code Sent', `A new 6-digit verification code has been sent to ${email}`);
      } else if (phone) {
        const { error } = await supabase.auth.signInWithOtp({
          phone: phone.trim(),
        });
        if (error) throw error;
        Alert.alert('Code Sent', `A new 6-digit verification code has been sent to ${phone}`);
      }

      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error('Resend error:', error);
      Alert.alert('Error', error.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style="auto" />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Enter verification code
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We sent a 6-digit code to
          </Text>
          <Text style={[styles.phone, { color: colors.text }]}>
            {targetIdentifier}
          </Text>
          {isDemo === '1' && (
            <View style={[styles.demoBadge, { backgroundColor: colors.card, borderColor: colors.separator }]}>
              <Text style={[styles.demoBadgeText, { color: colors.textSecondary }]}>
                Test Mode: Use code <Text style={{ color: colors.text, fontWeight: '700' }}>123456</Text>
              </Text>
            </View>
          )}
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: digit ? colors.accent : colors.separator,
                },
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <PrimaryButton
          label={loading ? 'Verifying...' : 'Verify & Continue'}
          onPress={handleVerifyOTP}
          disabled={loading || otp.join('').length !== 6}
          style={styles.button}
        />

        <View style={styles.resendContainer}>
          {resendTimer > 0 ? (
            <Text style={[styles.resendText, { color: colors.textSecondary }]}>
              Resend code in {resendTimer}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
              <Text style={[styles.resendButton, { color: colors.accent }]}>
                Resend Code
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.changeNumber}
        >
          <Text style={[styles.changeNumberText, { color: colors.textSecondary }]}>
            Wrong {email ? 'email address' : 'number'}? Change it
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 4,
  },
  phone: {
    fontSize: 17,
    fontWeight: '600',
  },
  demoBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  demoBadgeText: {
    fontSize: 12,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    marginBottom: 24,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
  },
  resendButton: {
    fontSize: 15,
    fontWeight: '600',
  },
  changeNumber: {
    alignItems: 'center',
    padding: 12,
  },
  changeNumberText: {
    fontSize: 14,
  },
});
