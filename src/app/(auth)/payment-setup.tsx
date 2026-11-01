import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useColors } from '@/store/theme';
import { useAuthStore } from '@/store/auth';
import type { PaymentMethod, PayRail } from '@/lib/payments';

type PaymentMethodInput = {
  rail: PayRail;
  handle: string;
  label: string;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const PAYMENT_METHODS: PaymentMethodInput[] = [
  {
    rail: 'upi',
    handle: '',
    label: 'UPI ID',
    placeholder: 'yourname@paytm',
    icon: 'wallet-outline',
  },
  {
    rail: 'paypal',
    handle: '',
    label: 'PayPal',
    placeholder: 'your@email.com',
    icon: 'logo-paypal',
  },
  {
    rail: 'venmo',
    handle: '',
    label: 'Venmo',
    placeholder: '@username',
    icon: 'cash-outline',
  },
  {
    rail: 'wise',
    handle: '',
    label: 'Wise',
    placeholder: 'email or tag',
    icon: 'send-outline',
  },
];

export default function PaymentSetupScreen() {
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [loading, setLoading] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<Record<string, string>>({
    upi: '',
    paypal: '',
    venmo: '',
    wise: '',
  });

  const handleMethodChange = (rail: string, value: string) => {
    setSelectedMethods((prev) => ({ ...prev, [rail]: value }));
  };

  const handleSkip = () => {
    // Allow skipping - user can add payment methods later
    router.replace('/');
  };

  const handleSave = async () => {
    // Filter out empty methods
    const paymentMethods: PaymentMethod[] = Object.entries(selectedMethods)
      .filter(([_, handle]) => handle.trim().length > 0)
      .map(([rail, handle]) => ({
        rail: rail as PayRail,
        handle: handle.trim(),
      }));

    if (paymentMethods.length === 0) {
      Alert.alert(
        'No Payment Methods',
        'Add at least one payment method or skip for now',
        [
          { text: 'Skip', onPress: handleSkip },
          { text: 'Add Method', style: 'cancel' },
        ]
      );
      return;
    }

    setLoading(true);

    try {
      if (!user) {
        throw new Error('No user found');
      }

      // Update payment_methods in users table
      const { error } = await supabase
        .from('users')
        .update({
          payment_methods: paymentMethods,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local store
      updateProfile({ paymentMethods });

      // Navigate to home
      router.replace('/');
    } catch (error: any) {
      console.error('Payment setup error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save payment methods. You can add them later in settings.'
      );
      // Allow proceeding even on error
      router.replace('/');
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
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.emoji]}>💳</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Payment Methods
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Add your payment handles so others can pay you easily
          </Text>
        </View>

        <View style={styles.form}>
          {PAYMENT_METHODS.map((method) => (
            <View key={method.rail} style={styles.methodContainer}>
              <View style={styles.methodHeader}>
                <View style={[styles.iconWrap, { backgroundColor: colors.accent }]}>
                  <Ionicons name={method.icon} size={20} color={colors.accentInk} />
                </View>
                <Text style={[styles.label, { color: colors.text }]}>
                  {method.label}
                </Text>
              </View>

              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: selectedMethods[method.rail] ? colors.accent : colors.separator 
                }]}
                placeholder={method.placeholder}
                placeholderTextColor={colors.textSecondary}
                value={selectedMethods[method.rail]}
                onChangeText={(value) => handleMethodChange(method.rail, value)}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ))}

          <View style={[styles.hint, { backgroundColor: colors.fillSecondary, borderColor: colors.separator }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              You can add or edit these anytime in Settings → Profile
            </Text>
          </View>

          <PrimaryButton
            label={loading ? 'Saving...' : 'Save & Continue'}
            onPress={handleSave}
            disabled={loading}
            style={styles.button}
          />

          <TouchableOpacity onPress={handleSkip} disabled={loading}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  methodContainer: {
    marginBottom: 24,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  hint: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  hintText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginBottom: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    padding: 12,
  },
});
