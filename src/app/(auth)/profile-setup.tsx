import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/theme';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';
import { space, type } from '@/theme/tokens';

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { user, session } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill from OAuth data
  useEffect(() => {
    if (session?.user) {
      const metadata = session.user.user_metadata;
      setName(
        metadata?.full_name ||
        metadata?.name ||
        metadata?.preferred_username ||
        ''
      );
    }
  }, [session]);

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name');
      return;
    }

    try {
      setLoading(true);

      // Update user profile in database
      const { error } = await supabase
        .from('users')
        .upsert({
          id: session?.user.id,
          email: session?.user.email,
          name: name.trim(),
          phone_number: phone.trim() || null,
          payment_methods: upiId.trim()
            ? [{ type: 'upi', id: upiId.trim(), primary: true }]
            : [],
          avatar_url: session?.user.user_metadata?.avatar_url || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Update local auth store
      useAuthStore.getState().setUser({
        id: session?.user.id!,
        email: session?.user.email!,
        name: name.trim(),
        avatar: session?.user.user_metadata?.avatar_url,
        paymentMethods: upiId.trim()
          ? [{ type: 'upi', id: upiId.trim(), primary: true }]
          : [],
      });

      // Navigate to onboarding questions
      router.replace('/(auth)/questions');
    } catch (error: any) {
      console.error('Profile setup error:', error);
      Alert.alert('Setup failed', error.message || 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Skip profile details, go straight to questions
    router.replace('/(auth)/questions');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.bg,
          paddingTop: insets.top + space.lg,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>Profile Setup</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + space.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <View style={styles.section}>
          <Text style={[styles.title, { color: c.text }]}>
            Welcome{name ? `, ${name}` : ''}! 👋
          </Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Quick setup (1/2)
          </Text>
          <View style={[styles.progress, { backgroundColor: c.fill }]}>
            <View
              style={[styles.progressBar, { backgroundColor: c.accent, width: '50%' }]}
            />
          </View>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: c.text }]}>Name *</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: c.fill, color: c.text, borderColor: c.fill },
            ]}
            placeholder="Your name"
            placeholderTextColor={c.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {session?.user.user_metadata?.full_name && (
            <Text style={[styles.hint, { color: c.textSecondary }]}>
              ✓ From your Google account
            </Text>
          )}
        </View>

        {/* Phone (Optional) */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: c.text }]}>
            Phone <Text style={{ color: c.textTertiary }}>(optional)</Text>
          </Text>
          <View style={styles.phoneInput}>
            <Text
              style={[
                styles.phonePrefix,
                { color: c.textSecondary, backgroundColor: c.fillSecondary },
              ]}
            >
              +91
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: c.fill, color: c.text, borderColor: c.fill, flex: 1 },
              ]}
              placeholder="9876543210"
              placeholderTextColor={c.textTertiary}
              value={phone}
              onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          <Text style={[styles.hint, { color: c.textTertiary }]}>
            For payment reminders (SMS/WhatsApp)
          </Text>
        </View>

        {/* Payment Method (Optional) */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: c.text }]}>
            Payment Method <Text style={{ color: c.textTertiary }}>(optional)</Text>
          </Text>
          <View
            style={[styles.card, { backgroundColor: c.fillSecondary }]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: c.text }]}>
                🇮🇳 UPI ID
              </Text>
              <Text style={[styles.cardSubtitle, { color: c.textSecondary }]}>
                For receiving payments
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: c.fill, color: c.text, borderColor: c.fill },
              ]}
              placeholder="yourname@paytm"
              placeholderTextColor={c.textTertiary}
              value={upiId}
              onChangeText={(text) => setUpiId(text.toLowerCase().trim())}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <Text style={[styles.cardHint, { color: c.textTertiary }]}>
              Works with: Paytm, PhonePe, Google Pay, BHIM
            </Text>
          </View>
          <Text style={[styles.hint, { color: c.textTertiary }]}>
            💡 You can add this later when settling up
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: c.bg,
            paddingBottom: insets.bottom + space.md,
            borderTopColor: c.fill,
          },
        ]}
      >
        <Pressable
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={loading}
        >
          <Text style={[styles.skipText, { color: c.textSecondary }]}>
            Skip
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.continueButton,
            { backgroundColor: c.accent },
            (!name.trim() || loading) && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!name.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={c.accentInk} />
          ) : (
            <Text style={[styles.continueText, { color: c.accentInk }]}>
              Continue
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  headerTitle: {
    ...type.headline,
  },
  scroll: {
    paddingHorizontal: space.xl,
  },
  section: {
    marginBottom: space.xxl,
  },
  title: {
    ...type.largeTitle,
    marginBottom: space.xs,
  },
  subtitle: {
    ...type.body,
    marginBottom: space.md,
  },
  progress: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  label: {
    ...type.subheadline,
    fontWeight: '600',
    marginBottom: space.sm,
  },
  input: {
    ...type.body,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  hint: {
    ...type.caption1,
    marginTop: space.xs,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  phonePrefix: {
    ...type.body,
    fontWeight: '600',
    paddingHorizontal: space.md,
    paddingVertical: 14,
    borderRadius: 12,
  },
  card: {
    padding: space.md,
    borderRadius: 14,
    marginBottom: space.sm,
  },
  cardHeader: {
    marginBottom: space.md,
  },
  cardTitle: {
    ...type.subheadline,
    fontWeight: '600',
  },
  cardSubtitle: {
    ...type.caption1,
    marginTop: 2,
  },
  cardHint: {
    ...type.caption2,
    marginTop: space.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    borderTopWidth: 1,
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: space.lg,
  },
  skipText: {
    ...type.subheadline,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    minHeight: 56,
  },
  continueText: {
    ...type.subheadline,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
