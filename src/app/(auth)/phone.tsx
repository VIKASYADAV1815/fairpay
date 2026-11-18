import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { PrimaryButton } from '@/components/PrimaryButton';
import { FairpayLogo } from '@/components/FairpayLogo';
import { useColors } from '@/store/theme';
import { useAuthStore } from '@/store/auth';
import { COUNTRY_CODES, type CountryCode } from '@/lib/countryCodes';

export default function PhoneLoginScreen() {
  const { colors } = { colors: useColors() };
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  // Show warning if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar style="auto" />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Backend setup needed
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Supabase credentials are missing. Add them to your .env file to enable authentication.
            </Text>
            <View style={[styles.codeBlock, { backgroundColor: '#0A0A0A', borderColor: '#333333' }]}>
              <Text style={[styles.codeText, { color: colors.accent }]}>
                EXPO_PUBLIC_SUPABASE_URL=...{'\n'}
                EXPO_PUBLIC_SUPABASE_ANON_KEY=...
              </Text>
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              See BACKEND-SETUP.md for instructions
            </Text>
          </View>
          <View style={{ width: '100%', gap: 12, marginBottom: 32 }}>
            <PrimaryButton
              label="Continue in Demo Mode"
              variant="accent"
              onPress={() => {
                useAuthStore.getState().setUser({
                  id: 'demo_user_local',
                  email: 'demo@fairpay.local',
                  phone: '+91 98765 43210',
                  name: 'Vikas',
                });
                router.replace('/(auth)/name-setup');
              }}
            />
            <PrimaryButton
              label="Go Back"
              variant="black"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </View>
    );
  }

  const validatePhone = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/[\s-]/g, '');
    return cleaned.length >= 7 && cleaned.length <= 15;
  };

  const handleSendOTP = async () => {
    if (!validatePhone(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    const fullPhone = `${selectedCountry.dialCode}${phone.replace(/[\s-]/g, '')}`;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) {
        // Catch Unsupported phone provider on free Supabase tier
        const isUnsupported =
          error.message?.includes('Unsupported phone provider') ||
          error.message?.includes('provider') ||
          error.message?.includes('gateway');

        if (isUnsupported) {
          Alert.alert(
            'SMS Test Mode',
            'Supabase SMS gateway is in developer mode. Use test code 123456 on the next screen to verify.',
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

      // Navigate to OTP verification screen
      router.push({
        pathname: '/(auth)/verify',
        params: { phone: fullPhone },
      });
    } catch (error: any) {
      console.warn('OTP error:', error?.message || error);
      Alert.alert(
        'Phone Verification',
        'Could not send SMS. Would you like to proceed in Test Mode with code 123456?',
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
            <Pressable
              onPress={() => setCountryPickerVisible(true)}
              style={[
                styles.countryCode,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.separator,
                },
              ]}
            >
              <Text style={[styles.countryCodeText, { color: colors.text }]}>
                {selectedCountry.flag} {selectedCountry.dialCode}
              </Text>
              <Ionicons name="chevron-down" size={12} color={colors.textSecondary} style={{ marginLeft: 2 }} />
            </Pressable>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.separator,
                },
              ]}
              placeholder="98765 43210"
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
            <Text
              onPress={() => router.push('/privacy')}
              style={{ color: colors.text, textDecorationLine: 'underline', fontWeight: '600' }}
            >
              Terms & Privacy Policy
            </Text>
          </Text>
        </View>
      </View>

      {/* Country Code Picker Modal */}
      <Modal
        visible={countryPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Country Code</Text>
              <Pressable onPress={() => setCountryPickerVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {COUNTRY_CODES.map((item) => (
                <Pressable
                  key={`${item.code}-${item.dialCode}`}
                  style={[
                    styles.countryItem,
                    { borderBottomColor: colors.separator },
                    selectedCountry.dialCode === item.dialCode && {
                      backgroundColor: colors.fillSecondary,
                    },
                  ]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setCountryPickerVisible(false);
                  }}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={[styles.countryItemName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.countryItemDial, { color: colors.textSecondary }]}>
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
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  countryItemFlag: { fontSize: 22, marginRight: 12 },
  countryItemName: { flex: 1, fontSize: 16, fontWeight: '500' },
  countryItemDial: { fontSize: 15, fontWeight: '600' },
});
