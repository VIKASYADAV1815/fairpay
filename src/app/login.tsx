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
import { useAuthStore } from '@/store/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { space, radius } from '@/theme/tokens';

type AuthMode = 'login' | 'signup';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);

  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password State
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleAuth = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      Alert.alert('Name Required', 'Please enter your full name.');
      return;
    }

    if (!isSupabaseConfigured()) {
      if (mode === 'login') {
        // Instant login in demo mode
        const displayName = name.trim() || cleanEmail.split('@')[0];
        useAuthStore.getState().setUser({
          id: 'demo_user_local',
          email: cleanEmail,
          phone: '',
          name: displayName,
        });
        useAuthStore.getState().setOnboardingDone(true);
        useAuthStore.getState().setShowWelcomeModal(false);
        router.replace('/');
      } else {
        router.push({
          pathname: '/(auth)/verify',
          params: {
            email: cleanEmail,
            type: 'signup',
            isDemo: '1',
            name: name.trim() || cleanEmail.split('@')[0],
          },
        });
      }
      return;
    }

    try {
      setLoading(true);

      if (mode === 'login') {
        // Direct Email + Password Login (Zero OTP friction)
        const { data: pwdData, error: pwdError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (pwdError) throw pwdError;

        if (pwdData?.user && pwdData?.session) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', pwdData.user.id)
            .maybeSingle();

          const isProfileComplete = Boolean(
            profile &&
            profile.name &&
            profile.payment_methods &&
            Array.isArray(profile.payment_methods) &&
            profile.payment_methods.length > 0
          );

          const resolvedName =
            profile?.name ||
            pwdData.user.user_metadata?.name ||
            cleanEmail.split('@')[0];

          useAuthStore.getState().setUser({
            id: pwdData.user.id,
            email: pwdData.user.email || cleanEmail,
            phone: profile?.phone_number || '',
            name: resolvedName,
            paymentMethods: profile?.payment_methods || [],
          });
          useAuthStore.getState().setSession(pwdData.session);
          useAuthStore.getState().updateProfile({
            name: resolvedName,
            email: pwdData.user.email || cleanEmail,
            phone: profile?.phone_number || '',
            paymentMethods: profile?.payment_methods || [],
          });

          if (isProfileComplete) {
            useAuthStore.getState().setOnboardingDone(true);
            useAuthStore.getState().setShowWelcomeModal(false);
            router.replace('/');
          } else {
            useAuthStore.getState().setShowWelcomeModal(false);
            router.replace('/(auth)/profile-setup');
          }
          return;
        }
      } else {
        // Sign Up with 8-digit OTP verification
        const userName = name.trim();
        const { error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { name: userName },
            emailRedirectTo: undefined,
          },
        });

        if (signUpError) throw signUpError;

        await supabase.auth.signOut();

        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: false },
        });

        if (otpError) {
          console.warn('OTP dispatch notice:', otpError.message);
        }

        router.push({
          pathname: '/(auth)/verify',
          params: {
            email: cleanEmail,
            type: 'signup',
            name: userName,
          },
        });
      }
    } catch (err: any) {
      console.warn('Auth error:', err);
      const msg = err.message || 'Authentication failed. Please check your credentials.';
      Alert.alert(mode === 'login' ? 'Sign In Failed' : 'Sign Up Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const targetEmail = (resetEmail || email).trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      Alert.alert('Email Required', 'Please enter your registered email address.');
      return;
    }

    try {
      setResetLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail);
      if (error) throw error;

      setForgotModalVisible(false);
      Alert.alert(
        'Password Reset Sent',
        `A password reset link was dispatched to ${targetEmail}. Please check your inbox.`,
      );
    } catch (err: any) {
      Alert.alert('Reset Failed', err.message || 'Could not send reset email. Please try again.');
    } finally {
      setResetLoading(false);
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
            paddingTop: insets.top + space.md,
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
          <FairpayLogo width={120} />
          <View style={{ width: 36 }} />
        </View>

        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Zero-friction shared money for any group
          </Text>
        </View>

        {/* Switcher Tabs: Log In vs Sign Up */}
        <View style={[styles.tabsWrap, { backgroundColor: darkMode ? '#1C1C1E' : '#F2F2F7' }]}>
          <Pressable
            style={[
              styles.tab,
              mode === 'login' && [styles.activeTab, { backgroundColor: darkMode ? '#2C2C2E' : '#FFFFFF' }],
            ]}
            onPress={() => setMode('login')}
          >
            <Ionicons
              name="log-in-outline"
              size={16}
              color={mode === 'login' ? c.text : c.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: mode === 'login' ? c.text : c.textSecondary },
              ]}
            >
              Log In
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              mode === 'signup' && [styles.activeTab, { backgroundColor: darkMode ? '#2C2C2E' : '#FFFFFF' }],
            ]}
            onPress={() => setMode('signup')}
          >
            <Ionicons
              name="person-add-outline"
              size={16}
              color={mode === 'signup' ? c.text : c.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: mode === 'signup' ? c.text : c.textSecondary },
              ]}
            >
              Sign Up
            </Text>
          </Pressable>
        </View>

        {/* Form Body */}
        <View style={styles.form}>
          {mode === 'signup' && (
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
                    backgroundColor: darkMode ? '#1C1C1E' : '#F5F5F7',
                    color: c.text,
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
                  backgroundColor: darkMode ? '#1C1C1E' : '#F5F5F7',
                  color: c.text,
                },
              ]}
            />
          </View>

          <View style={styles.inputWrap}>
            <View style={styles.passwordHeaderRow}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Password</Text>
              {mode === 'login' && (
                <Pressable
                  onPress={() => {
                    setResetEmail(email);
                    setForgotModalVisible(true);
                  }}
                  hitSlop={8}
                >
                  <Text style={[styles.forgotLink, { color: c.textSecondary }]}>Forgot password?</Text>
                </Pressable>
              )}
            </View>
            <View
              style={[
                styles.passwordRow,
                {
                  backgroundColor: darkMode ? '#1C1C1E' : '#F5F5F7',
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
                  size={19}
                  color={c.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          <View style={{ marginTop: space.sm }}>
            <PrimaryButton
              label={loading ? 'Processing…' : mode === 'login' ? 'Sign In' : 'Create Account'}
              variant="accent"
              disabled={loading}
              onPress={handleAuth}
            />
          </View>

          {/* Bottom Switcher Link */}
          <Pressable
            onPress={() => setMode((m) => (m === 'login' ? 'signup' : 'login'))}
            style={styles.modeToggle}
          >
            <Text style={[styles.modeToggleText, { color: c.textSecondary }]}>
              {mode === 'login' ? (
                <>Don't have an account? <Text style={{ color: c.text, fontWeight: '500' }}>Sign up</Text></>
              ) : (
                <>Already have an account? <Text style={{ color: c.text, fontWeight: '500' }}>Log in</Text></>
              )}
            </Text>
          </Pressable>
        </View>

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
              style={{ color: c.text, textDecorationLine: 'underline', fontWeight: '500' }}
            >
              Terms & Privacy Policy
            </Text>
          </Text>
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: c.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Reset Password</Text>
              <Pressable onPress={() => setForgotModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={c.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.modalSubtitle, { color: c.textSecondary }]}>
              Enter your registered email address and we will dispatch a secure password reset link.
            </Text>

            <TextInput
              value={resetEmail}
              onChangeText={setResetEmail}
              placeholder="name@example.com"
              placeholderTextColor={c.textTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[
                styles.modalInput,
                {
                  backgroundColor: darkMode ? '#1C1C1E' : '#F5F5F7',
                  color: c.text,
                },
              ]}
              autoFocus
            />

            <View style={{ marginTop: 20 }}>
              <PrimaryButton
                label={resetLoading ? 'Sending link…' : 'Send Reset Link'}
                variant="accent"
                disabled={resetLoading || !resetEmail.trim()}
                onPress={handleForgotPassword}
              />
            </View>
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
    fontSize: 27,
    fontWeight: '300', // Apple SF Pro Display Light
    letterSpacing: -0.7,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  tabsWrap: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 3,
    marginBottom: space.xl,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  form: {
    gap: space.md,
  },
  inputWrap: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
    letterSpacing: -0.1,
  },
  passwordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 2,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
  input: {
    height: 50,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: 15,
    fontWeight: '400',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '400',
  },
  eyeBtn: {
    padding: 6,
  },
  modeToggle: {
    alignItems: 'center',
    paddingVertical: space.md,
  },
  modeToggleText: {
    fontSize: 13,
    fontWeight: '400',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: space.md,
    marginTop: space.xs,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '400',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: space.xl,
    alignItems: 'center',
  },
  terms: {
    fontSize: 11.5,
    fontWeight: '400',
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
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    height: 50,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: 15,
    fontWeight: '400',
  },
});
