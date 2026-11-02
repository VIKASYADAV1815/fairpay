import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { PrimaryButton } from '@/components/PrimaryButton';
import { FairpayLogo } from '@/components/FairpayLogo';
import { useColors } from '@/store/theme';

export default function PhoneLoginScreen() {
  const { colors } = { colors: useColors() };
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');

  // Show warning if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar style="auto" />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              ⚠️ Backend Not Configured
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Supabase credentials are missing. Add them to your .env file to enable authentication.
            </Text>
            <View style={[styles.codeBlock, { backgroundColor: colors.card, borderColor: colors.separator }]}>
              <Text style={[styles.codeText, { color: colors.accent }]}>
                EXPO_PUBLIC_SUPABASE_URL=...{'\n'}
                EXPO_PUBLIC_SUPABASE_ANON_KEY=...
              </Text>
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              See BACKEND-SETUP.md for instructions
            </Text>
          </View>
          <PrimaryButton
            label="Go Back"
            onPress={() => router.back()}
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  const validatePhone = (phoneNumber: string) => {
    // Remove spaces and dashes
    const cleaned = phoneNumber.replace(/[\s-]/g, '');
    
    // For India: 10 digits
    if (countryCode === '+91') {
      return /^\d{10}$/.test(cleaned);
    }
    
    // General: 7-15 digits
    return /^\d{7,15}$/.test(cleaned);
  };

  const handleSendOTP = async () => {
    if (!validatePhone(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    const fullPhone = `${countryCode}${phone.replace(/[\s-]/g, '')}`;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) throw error;

      // Navigate to OTP verification screen
      router.push({
        pathname: '/(auth)/verify',
        params: { phone: fullPhone },
      });
    } catch (error: any) {
      console.error('OTP error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="auto" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <FairpayLogo width={148} />
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome to Fairpay
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Zero-friction shared money for any group
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>
            Phone Number
          </Text>

          <View style={styles.phoneInput}>
            <View style={[styles.countryCode, { 
              backgroundColor: colors.card,
              borderColor: colors.separator 
            }]}>
              <Text style={[styles.countryCodeText, { color: colors.text }]}>
                {countryCode}
              </Text>
            </View>

            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.separator 
              }]}
              placeholder="9876543210"
              placeholderTextColor={colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={15}
              autoFocus
            />
          </View>

          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            We'll send you a one-time password to verify your number
          </Text>

          <PrimaryButton
            label={loading ? 'Sending...' : 'Send OTP'}
            onPress={handleSendOTP}
            disabled={loading || phone.length === 0}
            style={styles.button}
          />

          <TouchableOpacity
            onPress={() => {
              // Skip auth for now, use local-only mode
              router.replace('/');
            }}
            style={styles.skipButton}
          >
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>
              Skip for now · Try without account
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.terms, { color: colors.textSecondary }]}>
            By continuing, you agree to our{' '}
            <Text style={{ color: colors.accent }}>Terms</Text>
            {' and '}
            <Text style={{ color: colors.accent }}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -60,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  phoneInput: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCode: {
    width: 70,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
  },
  hint: {
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },
  button: {
    marginTop: 32,
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 32,
  },
  terms: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  codeBlock: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    width: '100%',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
});
