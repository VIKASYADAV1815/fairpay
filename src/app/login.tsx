import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FairpayLogo } from '@/components/FairpayLogo';
import { SoftCard } from '@/components/SoftCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { FadeIn } from '@/components/FadeIn';
import { useAuthStore } from '@/store/auth';
import { useColors } from '@/store/theme';
import { space, type } from '@/theme/tokens';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = email.trim().includes('@') && password.length >= 4;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xxl },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>

        <FadeIn>
          <FairpayLogo width={150} />
          <Text style={[styles.title, { color: c.text }]}>Welcome back</Text>
          <Text style={[styles.sub, { color: c.textSecondary }]}>
            Sign in to keep groups and pay methods ready on this device.
          </Text>
        </FadeIn>

        <Text style={[styles.label, { color: c.textSecondary }]}>Email</Text>
        <SoftCard tone="fill" style={styles.field}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={c.textTertiary}
            style={[styles.input, { color: c.text }]}
            autoCapitalize="none"
            keyboardType="email-address"
            selectionColor={c.accent}
          />
        </SoftCard>

        <Text style={[styles.label, { color: c.textSecondary }]}>Password</Text>
        <SoftCard tone="fill" style={styles.field}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={c.textTertiary}
            style={[styles.input, { color: c.text }]}
            secureTextEntry
            selectionColor={c.accent}
          />
        </SoftCard>

        <View style={{ flex: 1 }} />

        <PrimaryButton
          label="Log in"
          variant="accent"
          disabled={!canSubmit}
          onPress={() => {
            login(email.trim());
            router.replace('/');
          }}
        />
        <Pressable onPress={() => router.push('/signup')} style={styles.link}>
          <Text style={[styles.linkText, { color: c.textSecondary }]}>
            New here? <Text style={{ color: c.text, fontWeight: '700' }}>Sign up</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.xl },
  back: { width: 36, height: 36, justifyContent: 'center', marginBottom: space.md },
  title: { ...type.title1, marginTop: space.xxl },
  sub: { ...type.body, marginTop: space.sm, marginBottom: space.xxxl },
  label: { ...type.footnote, marginBottom: space.sm, marginLeft: 4 },
  field: { marginBottom: space.xl, paddingHorizontal: space.lg, paddingVertical: 4 },
  input: { ...type.title3, paddingVertical: space.lg },
  link: { alignItems: 'center', marginTop: space.lg },
  linkText: { ...type.footnote },
});
