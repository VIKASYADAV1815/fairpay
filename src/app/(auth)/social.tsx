import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FairpayLogo } from '@/components/FairpayLogo';
import { useColors } from '@/store/theme';
import { signInWithGoogle, signInWithApple } from '@/lib/social-auth';
import { space, type } from '@/theme/tokens';

export default function SocialAuthScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<'google' | 'apple' | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setProvider('google');
      
      const { user, error } = await signInWithGoogle();
      
      if (error) {
        if (error.message === 'User cancelled') {
          // User cancelled - just return
          return;
        }
        throw error;
      }

      if (user) {
        // Success! Navigate to profile setup
        router.replace('/(auth)/profile-setup');
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      Alert.alert('Login failed', error.message || 'Could not sign in with Google');
    } finally {
      setLoading(false);
      setProvider(null);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setProvider('apple');
      
      const { user, error } = await signInWithApple();
      
      if (error) {
        if (error.message === 'User cancelled') {
          return;
        }
        throw error;
      }

      if (user) {
        router.replace('/(auth)/profile-setup');
      }
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      Alert.alert('Login failed', error.message || 'Could not sign in with Apple');
    } finally {
      setLoading(false);
      setProvider(null);
    }
  };

  const handleSkip = () => {
    router.replace('/');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.bg,
          paddingTop: insets.top + space.xxxl,
          paddingBottom: insets.bottom + space.xl,
        },
      ]}
    >
      <View style={styles.header}>
        <FairpayLogo width={160} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: c.text }]}>
          Welcome to FairPay
        </Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Split expenses with friends · Track IOUs · Settle up easily
        </Text>

        <View style={styles.buttons}>
          {/* Google Sign-In */}
          <Pressable
            style={[
              styles.button,
              styles.googleButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading && provider === 'google' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#fff" />
                <Text style={styles.buttonText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {/* Apple Sign-In (iOS only) */}
          {Platform.OS === 'ios' && (
            <Pressable
              style={[
                styles.button,
                styles.appleButton,
                { backgroundColor: c.text },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleAppleSignIn}
              disabled={loading}
            >
              {loading && provider === 'apple' ? (
                <ActivityIndicator color={c.bg} />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={22} color={c.bg} />
                  <Text style={[styles.buttonText, { color: c.bg }]}>
                    Continue with Apple
                  </Text>
                </>
              )}
            </Pressable>
          )}

          {/* Email fallback (future) */}
          {/* <Pressable
            style={[styles.button, { backgroundColor: c.fill }]}
            disabled={loading}
          >
            <Ionicons name="mail-outline" size={20} color={c.text} />
            <Text style={[styles.buttonText, { color: c.text }]}>
              Use Email
            </Text>
          </Pressable> */}
        </View>

        {/* Skip for now */}
        <Pressable
          onPress={handleSkip}
          disabled={loading}
          style={styles.skipButton}
        >
          <Text style={[styles.skipText, { color: c.textSecondary }]}>
            Skip for now
          </Text>
          <Text style={[styles.skipSubtext, { color: c.textTertiary }]}>
            Try locally first
          </Text>
        </Pressable>
      </View>

      {/* Terms */}
      <Text style={[styles.terms, { color: c.textTertiary }]}>
        By continuing, you agree to our{'\n'}
        <Text style={{ color: c.accent }}>Terms & Privacy Policy</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: space.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: space.xxxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...type.largeTitle,
    textAlign: 'center',
    marginBottom: space.sm,
  },
  subtitle: {
    ...type.body,
    textAlign: 'center',
    marginBottom: space.xxxl,
  },
  buttons: {
    gap: space.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: 16,
    borderRadius: 14,
    minHeight: 56,
  },
  googleButton: {
    backgroundColor: '#4285F4', // Google blue
  },
  appleButton: {
    // backgroundColor set dynamically (dark/light mode)
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...type.subheadline,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    marginTop: space.xxl,
    alignItems: 'center',
    paddingVertical: space.md,
  },
  skipText: {
    ...type.subheadline,
    fontWeight: '600',
  },
  skipSubtext: {
    ...type.caption1,
    marginTop: 4,
  },
  terms: {
    ...type.caption2,
    textAlign: 'center',
    lineHeight: 18,
  },
});
